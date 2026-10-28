"""Gold threads: places where two layers genuinely meet. Conservative matching; every link says why."""
import math, re, datetime
from common import read_json, write_json, tokens, tfidf, cos, shared_terms


def tokens_s(x):
    return tokens(x, stemmed=True)


def km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[1], a[0], b[1], b[0]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def main():
    c = read_json('converging.json') or {}
    s = read_json('solved.json') or {}
    u = read_json('unfinished.json') or {}
    st = read_json('stuck.json') or {}
    lo = read_json('leftovers.json') or {}
    wb = read_json('solved_wb.json') or {}
    tr = read_json('trials.json') or {}
    nd = read_json('needs.json') or {}
    convs = [cv | {'topic': t['topic'], 'query': t.get('query')} for t in c.get('topics', []) for cv in t.get('convergences', [])]
    probs = st.get('problems', [])
    repos = u.get('items', [])
    cases = s.get('items', []) + wb.get('items', [])
    trials = tr.get('items', [])
    links = []

    def add(a, b, title, why, method, score):
        import hashlib
        links.append({'id': 'lk' + hashlib.sha1((a + '|' + b).encode()).hexdigest()[:10], 'a': a, 'b': b, 'title': title, 'why': why, 'method': method, 'score': round(score, 3)})

    # corpus for TF-IDF across everything
    docs, refs = [], []
    for cv in convs:
        docs.append(tokens_s(cv['topic'] + ' ' + (cv.get('query') or '') + ' ' + ' '.join(m['title'] for m in cv['members']) + ' ' + ' '.join(cv.get('terms', [])))); refs.append(('p1', cv))
    for p in probs:
        docs.append(tokens_s(p['title'] + ' ' + (p.get('statement') or '') + ' ' + (p.get('query') or '') * 2)); refs.append(('p4', p))
    for r in repos:
        docs.append(tokens_s(r['title'].split('/')[-1].replace('-', ' ') + ' ' + r['desc'] + ' ' + ' '.join(t.replace('-', ' ') for t in r['topics']))); refs.append(('p3', r))
    for k in cases:
        docs.append(tokens_s(k['title'] + ' ' + k['desc'] + ' ' + k.get('problem', '') + ' ' + ' '.join(k['topics']))); refs.append(('p2', k))
    for t in trials:
        docs.append(tokens_s(t['title'] + ' ' + ' '.join(t['conditions']) * 2 + ' ' + t['desc'])); refs.append(('p3', t))
    vecs = tfidf(docs)
    V = {id(o): vecs[i] for i, (_, o) in enumerate(refs)}

    # 1. A stuck-on problem and teams converging on it now (p4 <-> p1)
    GENERIC = {'language', 'languages', 'early', 'detection', 'detecting', 'water', 'cities', 'solar', 'resistance', 'disease', 'cheap', 'model', 'models', 'sensors', 'screening', 'finding', 'keeping', 'spotting', 'seeing', 'hearing', 'translating', 'recycling'}
    seen = set()
    for cv in convs:
        core = [t for t in tokens_s(cv['topic'] + ' ' + (cv.get('query') or '')) if t not in GENERIC and len(t) >= 6]
        for p in probs:
            if len(p['title'].split()) < 4:
                continue
            sc = cos(V[id(cv)], V[id(p)])
            if sc < 0.24:
                continue
            sh = shared_terms(V[id(cv)], V[id(p)], 6)
            if len(sh) >= 2 and any(t[:6] == c[:6] for t in sh for c in core) and (p['id'], cv['topic']) not in seen:
                seen.add((p['id'], cv['topic']))
                who = 'A recent paper says this is still open' if p.get('source') == 'openalex' else f"{p['sourceName'].split('·')[0].strip()} lists this as open"
                add(p['id'], cv['id'], 'Stuck on it, and converging on it', f"{who}: “{p['title'][:150]}” Meanwhile, independent teams are working on {cv['topic'].lower()}. Shared words: {', '.join(sh[:4])}.", 'shared words (TF-IDF) including the topic itself', sc)

    # 2. An abandoned attempt at a problem teams are converging on now (p3 <-> p1)
    by_topic = {}
    for cv in convs:
        by_topic.setdefault(cv['topic'], []).append(cv)
    for r in repos:
        for t in r.get('convergesWith', [])[:1]:
            if not r.get('place') or t not in by_topic:
                continue
            cv = max(by_topic[t], key=lambda x: cos(V[id(r)], V[id(x)]))
            sc = cos(V[id(r)], V[id(cv)])
            if sc >= 0.2:
                add(r['id'], cv['id'], 'An earlier attempt, set down', f"{r['title']} tackled {t.lower()} and was archived; its last code was in {r['stopped'][:4]}. Today, independent teams are working on the same problem again.", 'same search topic, archived repository', sc)

    # 3. An abandoned project aimed at a listed open problem (p3 <-> p4): the problem's short name appears in the repo
    named = [p for p in probs if p.get('query') and (len(p['query'].split()) >= 2 or len(p['query']) >= 14) and len(p['title'].split()) >= 3]
    for r in repos:
        text = (r['desc'] + ' ' + r['title'] + ' ' + ' '.join(r['topics'])).lower()
        for p in named:
            q = p['query'].lower()
            if re.search(r'\b' + re.escape(q) + r'\b', text):
                add(r['id'], p['id'], 'An unfinished answer to an open problem', f"{r['title']} names “{p['query']}”, which {p['sourceName'].split('·')[0].strip()} lists as open. The project was archived; its last code was in {r['stopped'][:4]}.", 'problem name appears in the project', 1.0)
                break

    # 4. A documented civic fix and a listed open problem (p2 <-> p4), strict
    soc = [p for p in probs if p.get('family') in ('Society & economics', 'Health & medicine', 'Earth & climate')]
    for k in cases:
        if not k.get('documented'):
            continue
        best = max(((cos(V[id(k)], V[id(p)]), p) for p in soc), key=lambda x: x[0], default=(0, None))
        if best[1] and best[0] >= 0.33 and len(shared_terms(V[id(k)], V[id(best[1])], 6)) >= 3:
            p = best[1]
            add(k['id'], p['id'], 'A place that tried, on a question still open', (f"A World Bank project in {k['place']}, “{k['title']}”, was rated {k['rating']} by independent evaluators. The broader question is still listed as open: “{p['title'][:140]}”." if k.get('src') == 'wb' else f"{k['place']} tried “{k['title']}” and wrote up what happened. The broader question is still listed as open: “{p['title'][:140]}”."), 'shared words (TF-IDF)', best[0])

    # 5. Spare-sharing points near a documented fix for the same thing (p5 <-> p2)
    kinds = {'food_sharing': r'food (waste|surplus|sharing|insecurity|bank)|community fridge', 'give_box': r'\b(reuse|second-hand|sharing economy|waste reduction)\b',
             'tool_library': r'tool (library|sharing)|sharing economy', 'repair_cafe': r'repair', 'freeshop': r'\b(reuse|free shop|gift economy)\b'}
    pts = lo.get('items', [])
    for k in cases:
        text = (k['title'] + ' ' + k['desc'] + ' ' + k.get('problem', '')).lower()
        for kind, rx in kinds.items():
            mt = re.search(rx, text)
            if not mt:
                continue
            near = min(((km((k['lon'], k['lat']), (p['lon'], p['lat'])), p) for p in pts if p['kind'] == kind), key=lambda x: x[0], default=(1e9, None))
            if near[1] and near[0] <= 25:
                label = (lo.get('meta', {}).get('kinds', {}).get(kind, {}).get('label') or kind).lower()
                add(near[1]['id'], k['id'], 'Leftovers, near a place that worked on it', f"A {label} sits {max(near[0], 0.1):.1f} km from where “{k['title']}” in {k['place']} took on “{mt.group(0)}”.", 'same subject and within 25 km', 1 - near[0] / 25)
                break

    # 6. A clinical study that stopped for practical reasons, on a question still listed as open (p3 <-> p4)
    health = [p for p in probs if p.get('family') == 'Health & medicine' and len(p['title'].split()) >= 4]
    best_for = {}
    for t in trials:
        cond = set(tokens_s(' '.join(t['conditions'])))
        for p in health:
            sc = cos(V[id(t)], V[id(p)])
            if sc < 0.36:
                continue
            sh = [x for x in shared_terms(V[id(t)], V[id(p)], 6) if V[id(t)][x] * V[id(p)][x] >= 0.012]
            if len(sh) >= 3 and len(cond & set(sh)) >= 2 and sc > best_for.get(p['id'], (0,))[0]:
                best_for[p['id']] = (sc, t, p, sh)
    used = set()
    for sc, t, p, sh in sorted(best_for.values(), key=lambda x: -x[0])[:30]:
        if t['id'] in used:
            continue
        used.add(t['id'])
        add(t['id'], p['id'], 'A study set down, on a question still open', f"“{t['title'][:120]}” stopped ({t['why'][:90]}). A related question is still listed as open: “{p['title'][:130]}”. Shared words: {', '.join(sh[:4])}.", 'shared words (stemmed TF-IDF) including the condition', sc)

    # 8. A food bank short of something, near a place that documented work on food poverty (p5 needs <-> p2)
    food = re.compile(r'food (bank|poverty|insecurity|waste|surplus|sharing)|hunger|community fridge')
    for k in s.get('items', []):
        text = (k['title'] + ' ' + k['desc'] + ' ' + k.get('problem', '')).lower()
        mt = food.search(text)
        if not mt:
            continue
        near = min(((km((k['lon'], k['lat']), (f['lon'], f['lat'])), f) for f in nd.get('items', [])), key=lambda x: x[0], default=(1e9, None))
        if near[1] and near[0] <= 15:
            f = near[1]
            add(f['id'], k['id'], 'A shortage, near a place that worked on it', f"{f['name']} is asking for {', '.join(f['needs'][:3])} (list found {f['found']}). {near[0]:.1f} km away, “{k['title']}” took on “{mt.group(0)}”.", 'same subject and within 15 km', 1 - near[0] / 15)

    links.sort(key=lambda l: -l['score'])
    kinds_count = {}
    for l in links:
        key = l['a'][:2] + '-' + l['b'][:2]
        kinds_count[key] = kinds_count.get(key, 0) + 1
    write_json('links.json', {'meta': {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'count': len(links), 'byKind': kinds_count}, 'links': links})


if __name__ == '__main__':
    main()
