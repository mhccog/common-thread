"""Pillar 5, One person's leftovers, another's missing piece: places mapped on OpenStreetMap (ODbL) where
people leave what they have spare for whoever needs it. Only the offer side is openly published."""
import json, time, datetime, urllib.parse
from common import get, write_json, read_json, clip

OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']  # mail.ru last: its copy of OSM was months behind in Oct 2026
KINDS = [
    ('give_box', 'nwr["amenity"="give_box"]', 'Give box', 'A small shelter where anyone can leave things they no longer need, and anyone can take them.'),
    ('food_sharing', 'nwr["amenity"="food_sharing"]', 'Community fridge / food sharing', 'Surplus food left for anyone to take.'),
    ('freeshop', 'nwr["amenity"="freeshop"]', 'Free shop', 'A shop where everything is free.'),
    ('tool_library', 'nwr["amenity"="tool_library"]', 'Tool library', 'Tools lent out so people do not each have to buy one.'),
    ('repair_cafe', 'nwr["repair_cafe"="yes"];nwr["amenity"="repair_cafe"];nwr["craft"="repair_cafe"]', 'Repair café', 'Volunteers fix broken things so they are not thrown away.'),
    ('library_of_things', 'nwr["name"~"[Ll]ibrary [Oo]f [Tt]hings|[Ll]eihladen|[Bb]ibliothèque d.[Oo]bjets|[Bb]iblioteca de las [Cc]osas|[Bb]ibliotheek van [Dd]ingen"]', 'Library of things', 'Everyday things, from drills to tents, lent out like library books.'),
    ('seed_library', 'nwr["name"~"[Ss]eed [Ll]ibrary|[Ss]aatgutbibliothek|[Gg]rainothèque|[Bb]iblioteca de [Ss]emillas|[Zz]adenbibliotheek"]', 'Seed library', 'Seeds given away to grow, with a few saved and returned.'),
]


def overpass(q):
    body = urllib.parse.urlencode({'data': f'[out:json][timeout:170];({q};);out center tags;'}).encode()
    last = None
    stale = None
    for url in OVERPASS:
        try:
            d = json.loads(get(url, data=body, timeout=200, tries=2, headers={'Content-Type': 'application/x-www-form-urlencoded'}))
        except Exception as e:
            last = e; print('overpass failed', url, e); continue
        base = (d.get('osm3s') or {}).get('timestamp_osm_base') or ''
        age = (datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(base.replace('Z', '+00:00'))).days if base else 999
        if age <= 14:
            return d
        print('overpass mirror is', age, 'days behind, trying the next one:', url)
        stale = stale or d
        last = RuntimeError(f'mirror {age} days behind')
    if stale is not None:
        return stale  # every mirror was behind: use it, and the trust check will say so on the page
    raise last


def main():
    prev = {i['id']: i for i in (read_json('leftovers.json') or {}).get('items', [])}
    items, counts, notes = [], {}, []
    osm_base = [None]
    for kind, q, label, blurb in KINDS:
        try:
            d = overpass(q)
        except Exception as e:
            old = [i for i in prev.values() if i['kind'] == kind]
            items += old; counts[kind] = len(old)
            notes.append(f'{label}: OpenStreetMap query failed this run, kept {len(old)} from the previous build.')
            continue
        n = 0
        base = (d.get('osm3s') or {}).get('timestamp_osm_base')
        if base and (not osm_base[0] or base < osm_base[0]):
            osm_base[0] = base
        for el in d.get('elements', []):
            lat = el.get('lat') or (el.get('center') or {}).get('lat'); lon = el.get('lon') or (el.get('center') or {}).get('lon')
            if lat is None:
                continue
            t = el.get('tags', {})
            if t.get('disused:amenity') or t.get('access') == 'private':
                continue
            items.append({'id': f"osm{el['type'][0]}{el['id']}", 'kind': kind, 'name': t.get('name') or t.get('name:en') or None,
                          'note': clip(t.get('description') or t.get('description:en') or t.get('note') or '', 200) or None,
                          'hours': t.get('opening_hours'), 'operator': t.get('operator'),
                          'lat': round(lat, 5), 'lon': round(lon, 5), 'city': t.get('addr:city'), 'country': t.get('addr:country'),
                          'url': f"https://www.openstreetmap.org/{el['type']}/{el['id']}"})
            n += 1
        counts[kind] = n
        time.sleep(5)
    write_json('leftovers.json', {'meta': {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'count': len(items), 'counts': counts,
                                           'kinds': {k: {'label': l, 'blurb': b} for k, _, l, b in KINDS},
                                           'source': 'OpenStreetMap via Overpass', 'osmBase': osm_base[0], 'licence': 'ODbL 1.0',
                                           'status': {'ok': not notes, 'note': ' '.join(notes)}}, 'items': items})


if __name__ == '__main__':
    main()
