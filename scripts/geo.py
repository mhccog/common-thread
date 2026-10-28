"""Geocode free-text public locations with Photon (OpenStreetMap data), cached and rate-limited."""
import json, os, time, urllib.parse
from common import get_json, ROOT

PATH = os.path.join(ROOT, 'data-cache', 'places.json')
_cache = None
_last = [0.0]


def _load():
    global _cache
    if _cache is None:
        try:
            _cache = json.load(open(PATH))
        except Exception:
            _cache = {}
    return _cache


def save():
    os.makedirs(os.path.dirname(PATH), exist_ok=True)
    json.dump(_load(), open(PATH, 'w'), ensure_ascii=False, sort_keys=True, indent=0)


def geocode(text):
    c = _load()
    key = (text or '').strip().lower()[:120]
    if not key or len(key) < 2:
        return None
    if key in c:
        return c[key]
    wait = 1.1 - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    _last[0] = time.time()
    place = None
    try:
        j = get_json('https://photon.komoot.io/api/?' + urllib.parse.urlencode({'q': text[:120], 'limit': 1, 'lang': 'en'}), tries=2)
        f = (j.get('features') or [None])[0]
        if f:
            p = f['properties']; lon, lat = f['geometry']['coordinates']
            t = p.get('type') or p.get('osm_value')
            precision = 'country' if t == 'country' else 'region' if t in ('state', 'county', 'region') else 'city'
            place = {'lat': round(lat, 3), 'lon': round(lon, 3), 'label': ', '.join(x for x in [p.get('name') if precision != 'country' else None, p.get('country')] if x), 'country': p.get('countrycode') or '', 'precision': precision}
    except Exception as e:
        print('geocode failed', text, e)
        return None  # don't cache failures
    c[key] = place
    return place
