"""Sources & trust: validate every published file, check freshness, and spot-check real records against their
originals. Writes docs/data/trust.json. A source that fails is FLAGGED, and the page hides it rather than showing
stale or broken data. Standard library only (the workflow also runs lychee over the page's own links)."""
import json, random, re, datetime, urllib.parse
from common import get, get_json, read_json, write_json

NOW = datetime.datetime.now(datetime.timezone.utc)

# Who publishes each source, under what terms, how often it changes, and what to watch out for.
SOURCES = {
    'converging': {'layer': 'p1', 'file': 'converging.json', 'name': "You're not the only one (weekly sweep)", 'publisher': 'Our own sweep of OpenAlex (CC0), arXiv, GitHub and Hacker News',
                   'type': 'Derived by matching', 'licence': 'CC0 metadata; links to originals', 'updates': 'Weekly', 'maxAgeDays': 10,
                   'trust': 'medium', 'caveats': 'Pairs are found by word overlap; dates are publication dates, not when work began.', 'url': 'https://github.com/mhccog/not-the-only-one'},
    'participedia': {'layer': 'p2', 'file': 'solved.json', 'name': 'Participedia', 'publisher': 'Research network led from the University of British Columbia; cases written by contributors',
                     'type': 'Crowd-written, academically curated', 'licence': 'CC BY-NC-SA 3.0 (non-commercial)', 'commercial': False, 'updates': 'Continuous; we re-read changed cases daily', 'maxAgeDays': 4,
                     'trust': 'medium', 'caveats': 'Quality varies by author; about 4 in 10 cases have no written-up outcome. Not usable commercially.', 'url': 'https://participedia.net'},
    'worldbank': {'layer': 'p2', 'file': 'solved_wb.json', 'name': 'World Bank · IEG project ratings', 'publisher': 'Independent Evaluation Group, World Bank Group (intergovernmental)',
                  'type': 'Independent evaluation', 'licence': 'CC BY 4.0', 'commercial': True, 'updates': 'Quarterly ratings; projects API daily', 'maxAgeDays': 4,
                  'trust': 'high', 'caveats': 'Rates achievement of the project\'s own objectives, not wider impact. Placed at country level only.', 'url': 'https://ieg.worldbankgroup.org/ratings'},
    'github': {'layer': 'p3', 'file': 'unfinished.json', 'name': 'GitHub archived repositories', 'publisher': 'GitHub (platform metadata)', 'type': 'Platform metadata',
               'licence': 'Metadata, linked; each repository has its own licence', 'updates': 'Daily', 'maxAgeDays': 4, 'trust': 'medium',
               'caveats': 'Stars measure attention, not quality. Locations are what owners typed on their profile.', 'url': 'https://github.com'},
    'trials': {'layer': 'p3', 'file': 'trials.json', 'name': 'ClinicalTrials.gov stopped studies', 'publisher': 'US National Library of Medicine (government registry)',
               'type': 'Official registry, sponsor-reported', 'licence': 'Public domain (NLM asks for attribution)', 'commercial': True, 'updates': 'Daily', 'maxAgeDays': 4,
               'trust': 'high', 'caveats': 'The stop reason is free text from the sponsor; our grouping of reasons is automatic. Drawn at the first listed site.', 'url': 'https://clinicaltrials.gov'},
    'stuck': {'layer': 'p4', 'file': 'stuck.json', 'name': "Everything we're stuck on (daily sky)", 'publisher': 'Our own collection: Wikipedia unsolved-problem lists (CC BY-SA), Erdős problems, Open Problem Garden, Gap Map, OpenAlex',
              'type': 'Curated lists + automated extraction', 'licence': 'Per source', 'updates': 'Daily', 'maxAgeDays': 4, 'trust': 'mixed',
              'caveats': 'Curated lists are strong; problems pulled from paper abstracts by OpenAlex text are automated and weaker, so they are drawn fainter.', 'url': 'https://github.com/mhccog/stuck-on'},
    'osm': {'layer': 'p5', 'file': 'leftovers.json', 'name': 'OpenStreetMap', 'publisher': 'OpenStreetMap Foundation; mapped by volunteers', 'type': 'Volunteer-mapped',
            'licence': 'ODbL 1.0', 'commercial': True, 'updates': 'Continuous; read daily', 'maxAgeDays': 4, 'trust': 'medium',
            'caveats': 'A mapped place may have closed. Coverage is much denser in Europe than elsewhere.', 'url': 'https://www.openstreetmap.org'},
    'givefood': {'layer': 'p5', 'file': 'needs.json', 'name': 'Give Food', 'publisher': 'Give Food, UK registered charity 1188192', 'type': 'Charity, read from food banks\' own websites',
                 'licence': 'CC BY 4.0', 'commercial': True, 'updates': 'Several times a day', 'maxAgeDays': 3, 'trust': 'high',
                 'caveats': 'Lists are a hint, not a prescription; lists older than 120 days are not drawn. UK only.', 'url': 'https://www.givefood.org.uk'},
}


def records(key, d):
    if key == 'converging':
        return [m | {'_t': m['title']} for t in d.get('topics', []) for c in t['convergences'] for m in c['members']]
    if key == 'stuck':
        return [p | {'_t': p['title']} for p in d.get('problems', [])]
    if key in ('osm', 'givefood'):
        kinds = (d['meta'].get('kinds') or {})
        return [i | {'_t': i.get('name') or (kinds.get(i.get('kind'), {}).get('label', 'Unnamed place') + (' (unnamed)'))} for i in d.get('items', [])]
    return [i | {'_t': i.get('title') or ''} for i in d.get('items', [])]


def valid(key, r):
    if not re.match(r'https?://', str(r.get('url', ''))):
        return False
    if key in ('participedia', 'worldbank', 'osm', 'givefood'):
        return -90 <= r.get('lat', 999) <= 90 and -180 <= r.get('lon', 999) <= 180
    if key in ('github', 'trials'):
        p = r.get('place')
        return p is None or (-90 <= p['lat'] <= 90 and -180 <= p['lon'] <= 180)
    return bool(r['_t'])


def words(s):
    return set(re.findall(r'[a-z0-9]{4,}', (s or '').lower()))


def spot(key, r):
    """Fetch the original record and confirm it still exists and still says the same thing."""
    u = r['url']
    try:
        if key == 'trials':
            nct = u.rsplit('/', 1)[-1]
            j = get_json(f'https://clinicaltrials.gov/api/v2/studies/{nct}?fields=BriefTitle,OverallStatus', tries=2, timeout=40)
            return j['protocolSection']['identificationModule']['briefTitle'] == r['title']
        if key == 'worldbank':
            pid = u.rsplit('/', 1)[-1]
            j = get_json(f'https://search.worldbank.org/api/v2/projects?format=json&id={pid}&fl=id,project_name', tries=2, timeout=40)
            name = (j.get('projects') or {}).get(pid, {}).get('project_name', '')
            return len(words(r['title']) & words(name)) >= max(1, len(words(r['title'])) // 2)
        if key == 'participedia':
            j = get_json(u + '?returns=json', tries=2, timeout=40)
            return (j.get('article') or {}).get('title', '').strip() == r['title']
        if key == 'github':
            j = get_json('https://api.github.com/repos/' + r['title'], tries=2, timeout=40)
            return bool(j.get('archived'))
        if key == 'osm':
            t, i = u.rstrip('/').split('/')[-2:]
            j = get_json(f'https://api.openstreetmap.org/api/0.6/{t}/{i}.json', tries=2, timeout=40)
            return bool(j.get('elements')) and j['elements'][0].get('visible', True)
        if key == 'givefood':
            slug = r['id'][2:]
            j = get_json(f'https://www.givefood.org.uk/api/2/foodbank/{slug}/', tries=2, timeout=40)
            return not j.get('closed')
        if key in ('converging', 'stuck'):
            if 'doi.org/' in u:
                j = get_json('https://api.openalex.org/works/doi:' + urllib.parse.quote(u.split('doi.org/', 1)[1]), tries=2, timeout=40)
                ref = (r.get('statedIn') or {}).get('paperTitle') if key == 'stuck' else r['title']
                if key == 'stuck' and not ref:
                    return bool(j.get('id'))  # the problem is a sentence from the paper; the paper must still exist
                return len(words(j.get('title')) & words(ref)) >= max(1, len(words(ref)) // 2)
            if 'github.com/' in u:
                j = get_json('https://api.github.com/repos/' + '/'.join(u.split('github.com/', 1)[1].split('/')[:2]), tries=2, timeout=40)
                return bool(j.get('id'))
            if 'arxiv.org/abs/' in u:
                x = get('https://export.arxiv.org/api/query?id_list=' + u.rsplit('/', 1)[-1], headers={'Accept': 'application/atom+xml'}, tries=2, timeout=40)
                return len(words(x) & words(r['title'])) >= max(1, len(words(r['title'])) // 2)
        page = get(u, headers={'Accept': 'text/html,application/json'}, tries=2, timeout=40)
        return len(page) > 200
    except Exception as e:
        print('  spot failed', key, u, e)
        return False


def main(samples=3):
    random.seed(NOW.strftime('%Y%m%d'))
    out, checked = {}, []
    for key, s in SOURCES.items():
        d = read_json(s['file'])
        res = dict(s)
        if not d or 'meta' not in d:
            res.update(state='flagged', reason='No published data.'); out[key] = res; continue
        m = d['meta']
        gen = datetime.datetime.fromisoformat(m['generated'].replace('Z', '+00:00'))
        age = (NOW - gen).total_seconds() / 86400
        recs = records(key, d)
        bad = sum(1 for r in recs if not valid(key, r))
        sample = random.sample(recs, min(samples, len(recs))) if recs else []
        oks = []
        for r in sample:
            ok = spot(key, r)
            oks.append(ok)
            checked.append({'source': key, 'title': r['_t'][:140], 'url': r['url'], 'ok': ok})
        state, reason = 'ok', ''
        if not recs:
            state, reason = 'flagged', 'Empty.'
        elif age > s['maxAgeDays']:
            state, reason = 'flagged', f'Last refreshed {age:.0f} days ago (limit {s["maxAgeDays"]}).'
        elif bad > 0.05 * len(recs):
            state, reason = 'flagged', f'{bad} of {len(recs)} records failed validation.'
        elif sample and sum(oks) < len(oks) / 2:
            state, reason = 'flagged', f'Only {sum(oks)} of {len(oks)} spot-checked records matched their originals today.'
        elif (m.get('status') or {}).get('ok') is False or (sample and not all(oks)):
            state, reason = 'warn', (m.get('status') or {}).get('note') or f'{sum(oks)} of {len(oks)} spot checks matched.'
        if key == 'osm' and m.get('osmBase'):
            lag = (NOW - datetime.datetime.fromisoformat(m['osmBase'].replace('Z', '+00:00'))).days
            res['sourceLag'] = lag
            if lag > 14 and state == 'ok':
                state, reason = 'warn', f'The OpenStreetMap copy we read was {lag} days behind.'
        res.update(state=state, reason=reason, generated=m['generated'], ageDays=round(age, 2), records=len(recs), invalid=bad,
                   spot={'checked': len(oks), 'matched': sum(oks)})
        out[key] = res
        print(key, state, reason, len(recs), 'records', f'{sum(oks)}/{len(oks)} spot')
    write_json('trust.json', {'meta': {'generated': NOW.strftime('%Y-%m-%dT%H:%M:%SZ')}, 'sources': out, 'spotChecks': checked})


if __name__ == '__main__':
    import sys
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 3)
