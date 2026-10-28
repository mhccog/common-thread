"""Pillar 5b, the missing pieces: what UK food banks say they need right now, and what they have too much of.
Source: Give Food (registered charity 1188192), republished at github.com/givefood/data under CC BY 4.0.
Give Food's rules, followed here: credit with a link, link to each food bank and its shopping list, never modify or
reorder an item list, keep it up to date, no bulk contact (we publish no emails or phone numbers).
Matches: one food bank's stated EXCESS item equals a nearby food bank's stated NEED (same normalised item, <= 40 km)."""
import json, math, re, datetime
from common import get, write_json, read_json

DUMP = 'https://raw.githubusercontent.com/givefood/data/main/dumps/foodbanks.json'
FRESH_DAYS = 120   # older lists are flagged as stale and not drawn
MATCH_KM = 40
DROP = r'\b(tins? of|tinned|canned|packets? of|packs? of|jars? of|bottles? of|small|large|long[- ]life|uht|dried|dry|any|all|good quality|in date|non[- ]perishable|please|only|e\.?g\.?)\b'


def norm(item):
    s = item.lower()
    s = re.sub(r'\(.*?\)|\[.*?\]', ' ', s)
    s = re.sub(r'\s+-\s+.*$', '', s)            # 'Nappies - Size 2' -> 'nappies'
    s = re.sub(DROP, ' ', s)
    s = re.sub(r'[^a-z &]', ' ', s)
    words = []
    for w in s.split():
        if w in ('&', 'and'):
            words.append('&'); continue
        if len(w) > 4 and w.endswith('ies'):
            w = w[:-3] + 'y'
        elif len(w) > 3 and w.endswith('s') and not w.endswith('ss'):
            w = w[:-1]
        words.append(w)
    return ' '.join(words).strip(' &')


def km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def main():
    try:
        rows = json.loads(get(DUMP, timeout=180))
    except Exception as e:
        prev = read_json('needs.json')
        if prev:
            prev['meta']['status'] = {'ok': False, 'note': f'Give Food download failed this run ({e.__class__.__name__}); showing the previous build.'}
            write_json('needs.json', prev)
        return
    today = datetime.datetime.now(datetime.timezone.utc)
    locs = {}
    for r in rows:
        if r.get('location_name'):
            locs[r['organisation_slug']] = locs.get(r['organisation_slug'], 0) + 1
    items, stale, unknown = [], 0, 0
    for r in rows:
        if r.get('location_name') or not r.get('lat_lng'):
            continue
        needs = [x.strip() for x in (r.get('needed_items') or '').split('\n') if x.strip()]
        if not needs or needs == ['Unknown'] or needs == ['Nothing']:
            unknown += 1; continue
        found = (r.get('need_found') or '')[:19]
        age = (today - datetime.datetime.fromisoformat(found).replace(tzinfo=datetime.timezone.utc)).days if found else 9999
        if age > FRESH_DAYS:
            stale += 1; continue
        lat, lon = map(float, r['lat_lng'].split(','))
        excess = [x.strip() for x in (r.get('excess_items') or '').split('\n') if x.strip()]
        slug = r['organisation_slug']
        items.append({'id': 'gf' + slug, 'src': 'gf', 'name': (r.get('organisation_name') or slug) + (' Food Bank' if 'food' not in (r.get('organisation_name') or '').lower() else ''),
                      'needs': needs, 'excess': excess, 'found': found[:10], 'age': age, 'network': r.get('network'),
                      'district': r.get('district'), 'country': r.get('country'), 'sites': 1 + locs.get(slug, 0),
                      'lat': round(lat, 5), 'lon': round(lon, 5), 'charity': r.get('charity_number'),
                      'url': f'https://www.givefood.org.uk/needs/at/{slug}/', 'list': r.get('shopping_list_url') or r.get('url')})
    # excess here == need there
    for it in items:
        it['_n'] = {norm(x): x for x in it['needs'] if len(norm(x)) >= 3}
        it['_e'] = {norm(x): x for x in it['excess'] if len(norm(x)) >= 3}
    matches = []
    givers = [i for i in items if i['_e']]
    for g in givers:
        for t in items:
            if t is g:
                continue
            common = [k for k in g['_e'] if k in t['_n']]
            if not common:
                continue
            d = km((g['lat'], g['lon']), (t['lat'], t['lon']))
            if d <= MATCH_KM:
                matches.append({'from': g['id'], 'to': t['id'], 'km': round(d, 1), 'items': [[g['_e'][k], t['_n'][k]] for k in common][:6]})
    for it in items:
        it.pop('_n'); it.pop('_e')
    matches.sort(key=lambda m: (-len(m['items']), m['km']))
    # keep it readable: at most the two best suppliers for each food bank that is short
    per = {}
    kept = []
    for m in matches:
        if per.get(m['to'], 0) < 2:
            per[m['to']] = per.get(m['to'], 0) + 1; kept.append(m)
    matches = kept
    write_json('needs.json', {'meta': {'generated': today.strftime('%Y-%m-%dT%H:%M:%SZ'), 'count': len(items), 'stale': stale, 'unknown': unknown,
        'freshDays': FRESH_DAYS, 'matchKm': MATCH_KM, 'matches': len(matches), 'withExcess': len(givers),
        'source': 'Give Food (givefood.org.uk), via github.com/givefood/data', 'licence': 'CC BY 4.0',
        'status': {'ok': True, 'note': ''}}, 'items': items, 'matches': matches})
    print(len(items), 'current lists;', stale, 'stale;', len(matches), 'excess-to-need matches')


if __name__ == '__main__':
    main()
