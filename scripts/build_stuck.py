"""Pillar 4, Everything we're stuck on: reuse the daily sky published by mhccog/stuck-on.
Problems are not places, so they are drawn in the sky around the globe, not on it."""
import re, datetime
from common import get_json, write_json, read_json, clip

SRC = 'https://mhccog.github.io/stuck-on/data/problems.json'
SPAM = re.compile(r'cheats? generator|free (robux|coins|gems|v-?bucks)|hack (tool|generator)|mod apk', re.I)


def main():
    try:
        d = get_json(SRC, timeout=120)
    except Exception as e:
        prev = read_json('stuck.json')
        if prev:
            prev['meta']['status'] = {'ok': False, 'note': f'Could not reach the stuck-on sky this run ({e.__class__.__name__}); showing the previous copy.'}
            write_json('stuck.json', prev)
        else:
            write_json('stuck.json', {'meta': {'generated': None, 'count': 0, 'status': {'ok': False, 'note': 'Arriving soon: the map of what we are stuck on has not published yet.'}}, 'problems': []})
        return
    out, dropped = [], 0
    for p in d.get('problems', []):
        if SPAM.search(p.get('title', '') + ' ' + (p.get('query') or '')):
            dropped += 1; continue
        sig = p.get('signals') or {}
        out.append({'id': 'so' + p['id'], 'title': clip(p.get('title'), 180), 'statement': clip(p.get('statement'), 420), 'query': p.get('query'),
                    'family': p.get('family'), 'subfield': p.get('subfield'), 'source': p.get('source'), 'sourceName': p.get('sourceName'),
                    'url': p.get('articleUrl') or p.get('sourceUrl'), 'sourceUrl': p.get('sourceUrl'), 'neglect': p.get('neglect'), 'busier': p.get('busier'),
                    'measured': p.get('measured'), 'confidence': p.get('confidence'),
                    'work': {k: (v or {}).get('n') for k, v in sig.items() if isinstance(v, dict)},
                    'examples': [dict(i, kind=k) for k, v in sig.items() if isinstance(v, dict) for i in (v.get('items') or [])[:2]][:5]})
    m = d.get('meta', {})
    write_json('stuck.json', {'meta': {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'rebuiltAt': m.get('generated'), 'source': SRC,
                                       'count': len(out), 'measured': m.get('measured'), 'droppedSpam': dropped, 'families': d.get('families', []),
                                       'status': {'ok': True, 'note': ''}}, 'problems': out})


if __name__ == '__main__':
    main()
