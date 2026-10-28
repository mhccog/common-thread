"""Pillar 5, One person's leftovers, another's missing piece: places mapped on OpenStreetMap (ODbL) where
people leave what they have spare for whoever needs it. Only the offer side is openly published."""
import json, time, datetime, urllib.parse
from common import get, write_json, read_json, clip

OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter']
KINDS = [
    ('give_box', 'nwr["amenity"="give_box"]', 'Give box', 'A small shelter where anyone can leave things they no longer need, and anyone can take them.'),
    ('food_sharing', 'nwr["amenity"="food_sharing"]', 'Community fridge / food sharing', 'Surplus food left for anyone to take.'),
    ('freeshop', 'nwr["amenity"="freeshop"]', 'Free shop', 'A shop where everything is free.'),
    ('tool_library', 'nwr["amenity"="tool_library"]', 'Tool library', 'Tools lent out so people do not each have to buy one.'),
    ('repair_cafe', 'nwr["repair_cafe"="yes"];nwr["amenity"="repair_cafe"]', 'Repair café', 'Volunteers fix broken things so they are not thrown away.'),
]


def overpass(q):
    body = urllib.parse.urlencode({'data': f'[out:json][timeout:170];({q};);out center tags;'}).encode()
    last = None
    for url in OVERPASS:
        try:
            return json.loads(get(url, data=body, timeout=200, tries=2, headers={'Content-Type': 'application/x-www-form-urlencoded'}))
        except Exception as e:
            last = e; print('overpass failed', url, e)
    raise last


def main():
    prev = {i['id']: i for i in (read_json('leftovers.json') or {}).get('items', [])}
    items, counts, notes = [], {}, []
    for kind, q, label, blurb in KINDS:
        try:
            d = overpass(q)
        except Exception as e:
            old = [i for i in prev.values() if i['kind'] == kind]
            items += old; counts[kind] = len(old)
            notes.append(f'{label}: OpenStreetMap query failed this run, kept {len(old)} from the previous build.')
            continue
        n = 0
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
                                           'source': 'OpenStreetMap via Overpass', 'licence': 'ODbL 1.0',
                                           'status': {'ok': not notes, 'note': ' '.join(notes)}}, 'items': items})


if __name__ == '__main__':
    main()
