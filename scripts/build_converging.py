"""Pillar 1, You're not the only one: reuse the weekly sweep published by mhccog/not-the-only-one."""
import json, datetime
from common import get_json, write_json, read_json

SRC = 'https://mhccog.github.io/not-the-only-one/data/discoveries.json'


def main():
    try:
        d = get_json(SRC)
    except Exception as e:
        prev = read_json('converging.json')
        if prev:
            prev['meta']['status'] = {'ok': False, 'note': f'Could not reach the weekly sweep this run ({e.__class__.__name__}); showing the previous copy.'}
            write_json('converging.json', prev)
        return
    topics, n = [], 0
    for t in d.get('topics', []):
        convs = []
        for c in t.get('convergences', []):
            members = []
            for m in c.get('members', []):
                p = m.get('place')
                members.append({k: m.get(k) for k in ('id', 'source', 'sourceLabel', 'kind', 'title', 'url', 'date', 'dateLabel', 'by', 'venue')} | {
                    'place': {k: p.get(k) for k in ('lat', 'lon', 'city', 'countryName', 'label', 'precision')} if p else None})
            if sum(1 for m in members if m['place']) >= 2:
                n += 1
                convs.append({'id': f"cv{n}", 'caption': c.get('caption'), 'terms': c.get('terms', []), 'spanDays': c.get('spanDays'), 'score': c.get('score'), 'members': members})
        topics.append({'topic': t.get('topic'), 'query': t.get('query'), 'gh': t.get('gh'), 'efforts': t.get('efforts'), 'convergences': convs})
    write_json('converging.json', {'meta': {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'sweptAt': d.get('generatedAt'), 'source': SRC, 'count': n, 'status': {'ok': True, 'note': ''}}, 'topics': topics})


if __name__ == '__main__':
    main()
