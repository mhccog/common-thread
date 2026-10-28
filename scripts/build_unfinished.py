"""Pillar 3, The world's unfinished work: archived (read-only, no longer maintained) public GitHub repositories
that set out to solve a real-world problem and that many people valued (stars), placed at the owner's public location."""
import json, os, re, subprocess, time, datetime, urllib.parse
from common import get, write_json, read_json, clip
from geo import geocode, save as save_places

TOKEN = os.environ.get('GITHUB_TOKEN')

THEMES = {
    'climate-change': 'Climate', 'climate': 'Climate', 'renewable-energy': 'Energy', 
    'healthcare': 'Health', 'public-health': 'Health', 'medical': 'Health', 'mental-health': 'Health', 'covid-19': 'Pandemic', 'coronavirus': 'Pandemic', 'epidemiology': 'Health',
    'accessibility': 'Accessibility', 'a11y': 'Accessibility', 'assistive-technology': 'Accessibility', 'screen-reader': 'Accessibility',
    'edtech': 'Education', 
    'agriculture': 'Food & farming', 'farming': 'Food & farming',
    'humanitarian': 'Humanitarian', 'disaster-response': 'Disasters', 'earthquake': 'Disasters', 'refugees': 'Humanitarian',
    'civic-tech': 'Civic', 'open-government': 'Civic', 'elections': 'Civic', 
    'air-quality': 'Environment', 'biodiversity': 'Environment', 'conservation': 'Environment', 'sustainability': 'Environment', 'recycling': 'Environment',
    'low-resource-languages': 'Language', 'sign-language': 'Accessibility',
}
MIN_STARS = 40
DEV = re.compile(r'\b(snippets?|css|react|vue(\.js)?|angular|svelte|design system|components?|ui kit|interview|editor|slides?|themes?|plugin|boilerplate|templates?|sdk|wrapper|linter|eslint|webpack|date ?picker|tailwind|bootstrap|icons?|fonts?|jquery|wordpress|ui|async|productivity|classroom automat|dashboard template|markdown)\b', re.I)


def gh(path):
    if TOKEN:
        return json.loads(get('https://api.github.com' + path, headers={'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/vnd.github+json'}))
    out = subprocess.run(['gh', 'api', '-H', 'Accept: application/vnd.github+json', path], capture_output=True, text=True, timeout=90)
    if out.returncode:
        raise RuntimeError(out.stderr[:200])
    return json.loads(out.stdout)


def search_once(path):
    for attempt in range(6):
        try:
            return gh(path)
        except Exception as e:
            if 'rate limit' in str(e).lower() or '403' in str(e) or '429' in str(e):
                print('rate limited, waiting 65s'); time.sleep(65); continue
            raise
    raise RuntimeError('rate limit persisted')


def search(q, pages=1):
    res = []
    for page in range(1, pages + 1):
        d = search_once('/search/repositories?' + urllib.parse.urlencode({'q': q, 'sort': 'stars', 'order': 'desc', 'per_page': 100, 'page': page}))
        res += d.get('items', [])
        time.sleep(2.2)  # search API: 30/min with a token
        if len(d.get('items', [])) < 100:
            break
    return res


def main():
    topics = (read_json('converging.json') or {}).get('topics', [])
    repos, why, status = {}, {}, {'ok': True, 'note': ''}
    errors = 0
    for t, theme in THEMES.items():
        try:
            for r in search(f'archived:true topic:{t} stars:>={MIN_STARS}', pages=2 if t in ('covid-19', 'climate-change', 'accessibility') else 1):
                repos[r['full_name']] = r
                why.setdefault(r['full_name'], set()).add(theme)
        except Exception as e:
            errors += 1; print('search failed', t, e)
    # The same problems people are converging on right now (pillar 1): earlier, abandoned attempts.
    links = {}
    for tp in topics:
        q = tp.get('gh') or tp.get('query')
        words = [w for w in q.split() if w not in ('water', 'smartphone', 'early', 'low-cost', 'mitigation', 'surveillance', 'model')]
        try:
            found = search(f'{" ".join(words)} archived:true stars:>=3')
            if len(found) < 3 and len(words) > 2:
                found += search(f'{" ".join(words[:2])} archived:true stars:>=3')
            for r in found:
                text = (r.get('description') or '').lower() + ' ' + r['name'].lower() + ' ' + ' '.join(r.get('topics') or [])
                if not all(w.lower()[:6] in text for w in words):
                    continue
                repos[r['full_name']] = r
                why.setdefault(r['full_name'], set()).add('Wanted again today')
                links.setdefault(r['full_name'], []).append(tp['topic'])
        except Exception as e:
            errors += 1; print('search failed', q, e)
    if errors:
        status = {'ok': errors < 5, 'note': f'{errors} GitHub searches failed this run.'}
    print('repos', len(repos))

    owners = {}
    try:
        owners_cache = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data-cache', 'owners.json')))
    except Exception:
        owners_cache = {}
    items = []
    for name, r in sorted(repos.items(), key=lambda x: -x[1]['stargazers_count']):
        if r.get('fork') or not r.get('description') or r['name'].lower().startswith('awesome') or 'awesome list' in (r.get('description') or '').lower() or 'curated list' in (r.get('description') or '').lower():
            continue
        if 'Wanted again today' not in why.get(name, set()) and DEV.search(r['description'] + ' ' + r['name'].replace('-', ' ')):
            continue
        login = r['owner']['login']
        if login not in owners_cache:
            try:
                u = gh(f'/users/{login}')
                owners_cache[login] = {'loc': u.get('location'), 'type': u.get('type'), 'name': u.get('name')}
            except Exception as e:
                print('owner failed', login, e); continue
        o = owners_cache[login]
        place = geocode(o['loc']) if o.get('loc') and not o['loc'].startswith('http') else None
        items.append({
            'id': 'gh' + str(r['id']), 'title': r['full_name'], 'desc': clip(r['description'], 240),
            'url': r['html_url'], 'stars': r['stargazers_count'], 'forks': r['forks_count'], 'lang': r.get('language'),
            'topics': (r.get('topics') or [])[:8], 'themes': sorted(why.get(name, [])),
            'created': r['created_at'][:10], 'stopped': r['pushed_at'][:10], 'owner': o.get('name') or login, 'ownerType': o.get('type'),
            'licence': (r.get('license') or {}).get('spdx_id'),
            'place': place, 'where': o.get('loc') or None, 'convergesWith': links.get(name, []),
        })
    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'data-cache'), exist_ok=True)
    json.dump(owners_cache, open(os.path.join(os.path.dirname(__file__), '..', 'data-cache', 'owners.json'), 'w'), indent=0, sort_keys=True)
    save_places()
    placed = sum(1 for i in items if i['place'])
    write_json('unfinished.json', {'meta': {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'count': len(items), 'placed': placed,
                                            'minStars': MIN_STARS, 'source': 'GitHub (archived repositories)', 'status': status}, 'items': items})


if __name__ == '__main__':
    main()
