"""Pillar 2, Solved somewhere else: documented civic fixes from Participedia (CC BY-NC-SA 3.0),
paired with earlier documented fixes for the same problem in another country."""
import json, os, re, sys, time, datetime
from common import get_json, strip_html, clip, write_json, read_json, tokens, tfidf, cos, shared_terms, CACHE

CDIR = os.path.join(CACHE, 'participedia')
os.makedirs(CDIR, exist_ok=True)
MAX_MIN = float(os.environ.get('SOLVED_MINUTES', '45'))
t0 = time.time()


def list_ids():
    ids = {}
    page, pages = 1, 1
    while page <= pages:
        d = get_json(f'https://participedia.net/search?selectedCategory=case&returns=json&page={page}')
        pages = d.get('pages', 1)
        for r in d.get('results', []):
            ids[r['id']] = r.get('updated_date') or ''
        if page % 20 == 0:
            print('listed page', page, 'of', pages, len(ids), 'ids', flush=True)
        page += 1
        time.sleep(0.4)
    return ids


def section(body, *names):
    parts = re.split(r'<h2[^>]*>(.*?)</h2>', body or '')
    for i in range(1, len(parts) - 1, 2):
        head = strip_html(parts[i]).lower()
        if any(n in head for n in names):
            txt = strip_html(parts[i + 1])
            if len(txt) > 40:
                return txt
    return ''


def main():
    status = {'ok': True, 'note': ''}
    try:
        ids = list_ids()
    except Exception as e:
        print('listing failed', e)
        prev = read_json('solved.json')
        if prev:
            prev['meta']['status'] = {'ok': False, 'note': f'Participedia listing failed this run ({e.__class__.__name__}); showing the previous build.'}
            write_json('solved.json', prev)
        return
    todo = []
    for cid, upd in sorted(ids.items(), key=lambda x: -x[0]):
        path = os.path.join(CDIR, f'{cid}.json')
        if os.path.exists(path):
            try:
                if json.load(open(path)).get('updated_date', '')[:19] >= upd[:19]:
                    continue
            except Exception:
                pass
        todo.append(cid)
    print('to fetch', len(todo), flush=True)
    fetched = 0

    def fetch(cid):
        if time.time() - t0 > MAX_MIN * 60:
            return 'late'
        try:
            a = get_json(f'https://participedia.net/case/{cid}?returns=json').get('article') or {}
            json.dump(a, open(os.path.join(CDIR, f'{cid}.json'), 'w'))
            time.sleep(0.3)
            return 'ok'
        except Exception as e:
            print('case', cid, 'failed', e)
            return 'fail'

    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(3) as ex:  # three gentle parallel requests
        for r in ex.map(fetch, todo):
            if r == 'ok':
                fetched += 1
                if fetched % 100 == 0:
                    print('fetched', fetched, flush=True)
            elif r == 'late':
                status['note'] = 'Some cases were not refreshed this run (time budget); they will be on the next run.'
    print('fetched', fetched, 'of', len(ids))

    items = []
    for cid in ids:
        path = os.path.join(CDIR, f'{cid}.json')
        if not os.path.exists(path):
            continue
        a = json.load(open(path))
        if not a or a.get('hidden') or not a.get('published', True):
            continue
        lat, lon = a.get('latitude'), a.get('longitude')
        if lat is None or lon is None or (abs(lat) < 0.01 and abs(lon) < 0.01):
            continue
        body = a.get('body') or ''
        problem = section(body, 'problem', 'purpose')
        outcome = section(body, 'outcome', 'effects', 'influence')
        lessons = section(body, 'lessons', 'analysis')
        title = (a.get('title') or '').strip()
        if not title:
            continue
        place = ', '.join(x for x in [a.get('city'), a.get('province') if not a.get('city') else '', a.get('country')] if x)
        items.append({
            'id': f'pp{cid}', 'title': title,
            'desc': clip(strip_html(a.get('description')), 260),
            'problem': clip(problem, 340), 'outcome': clip(outcome, 340), 'lesson': clip(lessons, 240),
            'place': place or 'Place not listed', 'country': a.get('country') or '',
            'lat': round(float(lat), 4), 'lon': round(float(lon), 4),
            'start': (a.get('start_date') or '')[:10] or None, 'end': (a.get('end_date') or '')[:10] or None,
            'ongoing': bool(a.get('ongoing')),
            'issues': a.get('general_issues') or [], 'topics': a.get('specific_topics') or [],
            'evidence': a.get('impact_evidence'), 'evaluated': a.get('formal_evaluation'),
            'lang': a.get('original_language') or '', 'documented': bool(outcome),
            'url': f'https://participedia.net/case/{cid}',
            'methods': [m.get('title') for m in (a.get('specific_methods_tools_techniques') or [])[:3] if m.get('title')],
        })

    # Pair: same problem, different country; thread from the later attempt to the earlier documented one.
    docs = [tokens(' '.join([it['title'], it['desc'], it['problem'], ' '.join(it['topics']) * 2])) for it in items]
    vecs = tfidf(docs)
    pairs = []
    for i, it in enumerate(items):
        best = None
        for j, jt in enumerate(items):
            if i == j or not jt['documented'] or not jt['country'] or jt['country'] == it['country']:
                continue
            if not it['start'] or not jt['start'] or jt['start'] >= it['start']:
                continue
            s = cos(vecs[i], vecs[j])
            if set(it['issues']) & set(jt['issues']):
                s += 0.03
            if not best or s > best[0]:
                best = (s, j)
        if best and best[0] >= 0.30:
            j = best[1]
            pairs.append({'from': it['id'], 'to': items[j]['id'], 'score': round(best[0], 3),
                          'terms': shared_terms(vecs[i], vecs[j])})
    pairs.sort(key=lambda p: -p['score'])
    write_json('solved.json', {
        'meta': {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'count': len(items),
                 'documented': sum(1 for x in items if x['documented']), 'pairs': len(pairs), 'listed': len(ids),
                 'source': 'Participedia', 'licence': 'CC BY-NC-SA 3.0', 'status': status},
        'items': items, 'pairs': pairs[:400]})


if __name__ == '__main__':
    main()
