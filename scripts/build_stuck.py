"""Pillar 4, Everything we're stuck on: reuse the stable export of mhccog/stuck-on (schema stuck-on/atlas@1).
Problems are not places, so they are drawn in the sky around the globe, not on it."""
import re, datetime
from common import get_json, write_json, read_json, clip

SRC = 'https://mhccog.github.io/stuck-on/data/atlas.json'
SPAM = re.compile(r'cheats? generator|free (robux|coins|gems|v-?bucks|gold)|hack (tool|generator)|mod apk', re.I)


def main():
    try:
        d = get_json(SRC, timeout=120)
        if d.get('schema') != 'stuck-on/atlas@1':
            raise ValueError('unexpected schema ' + str(d.get('schema')))
    except Exception as e:
        prev = read_json('stuck.json')
        if prev and prev.get('problems'):
            prev['meta']['status'] = {'ok': False, 'note': f'Could not reach the stuck-on export this run ({e.__class__.__name__}); showing the previous copy.'}
            write_json('stuck.json', prev)
        else:
            write_json('stuck.json', {'meta': {'generated': None, 'count': 0, 'status': {'ok': False, 'note': 'Arriving soon: the map of what we are stuck on has not published yet.'}}, 'problems': []})
        return
    out, dropped = [], 0
    for p in d.get('problems', []):
        if SPAM.search((p.get('title') or '') + ' ' + (p.get('searchedAs') or '')):
            dropped += 1; continue
        act = p.get('activity') or {}
        si = p.get('statedIn') or None
        out.append({'id': 'so' + p['id'], 'title': clip(p.get('title'), 180), 'statement': clip(p.get('statement'), 380), 'query': p.get('searchedAs'),
                    'family': p.get('field'), 'subfield': p.get('subfield'), 'source': p.get('source'), 'sourceName': p.get('sourceName'),
                    'url': p.get('articleUrl') or p.get('sourceUrl'), 'sourceUrl': p.get('sourceUrl'), 'deep': p.get('url'),
                    'neglect': p.get('neglect'), 'busier': p.get('busierShare'), 'measured': p.get('measuredBy'), 'confidence': p.get('confidence'),
                    'work': {k: (v or {}).get('count') for k, v in act.items() if isinstance(v, dict)},
                    'statedIn': {k: si.get(k) for k in ('paperTitle', 'date', 'venue', 'countries')} if si else None})
    write_json('stuck.json', {'meta': {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'rebuiltAt': d.get('generated'), 'source': SRC,
                                       'schema': d.get('schema'), 'count': len(out), 'droppedSpam': dropped, 'families': d.get('families', []),
                                       'sources': d.get('sources'), 'status': {'ok': all((s or {}).get('ok', True) for s in (d.get('sources') or {}).values()), 'note': ''}}, 'problems': out})


if __name__ == '__main__':
    main()
