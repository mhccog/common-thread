"""Pillar 2b, Solved somewhere else: World Bank projects that independent evaluators (IEG) rated Satisfactory or
Highly Satisfactory. Ratings: IEG World Bank Project Performance Ratings (CC BY 4.0). Descriptions: World Bank
Projects API (CC BY 4.0). Placed at the country's label point (country-level only, said so on the page)."""
import csv, io, json, os, re, time, datetime, urllib.parse
from common import get, get_json, clip, write_json, read_json, strip_html, ROOT

IEG = 'https://financesonefiles.worldbank.org/f-one/DS00053/RS00055/IEG_World_Bank_Project_Performance_Ratings.csv'
API = 'https://search.worldbank.org/api/v2/projects?'
GOOD = {'Satisfactory', 'Highly Satisfactory'}
MIN_EVAL_FY = 2008


def jitter(s, amt):
    h = 2166136261
    for ch in s:
        h = ((h ^ ord(ch)) * 16777619) & 0xffffffff
    return ((h % 2000) / 1000 - 1) * amt, (((h >> 11) % 2000) / 1000 - 1) * amt


def main():
    try:
        rows = list(csv.DictReader(io.StringIO(get(IEG, headers={'Accept': 'text/csv'}, timeout=120).lstrip('\ufeff'))))
    except Exception as e:
        prev = read_json('solved_wb.json')
        if prev:
            prev['meta']['status'] = {'ok': False, 'note': f'IEG ratings download failed this run ({e.__class__.__name__}); showing the previous build.'}
            write_json('solved_wb.json', prev)
        return
    as_of = rows[0].get('As of Date') if rows else None
    keep = {r['Project ID']: r for r in rows if r['Outcome'] in GOOD and (r['Evaluation FY'] or '0') >= str(MIN_EVAL_FY)
            and r['Lending Instrument Type'] == 'IPF'}
    print('rated satisfactory', len(keep))
    # descriptions: page through closed projects (the API has no bulk id filter)
    info, os_ = {}, 0
    while True:
        q = {'format': 'json', 'rows': 500, 'os': os_, 'status_exact': 'Closed', 'fl': 'id,project_name,countrycode,countryshortname,boardapprovaldate,closingdate,url,pdo'}
        try:
            d = get_json(API + urllib.parse.urlencode(q), timeout=120)
        except Exception as e:
            print('projects page failed', os_, e); break
        ps = d.get('projects') or {}
        for pid, p in ps.items():
            if pid in keep:
                info[pid] = p
        os_ += 500
        if not ps or os_ >= int(d.get('total') or 0):
            break
        time.sleep(0.5)
    print('described', len(info))
    g = json.load(open(os.path.join(ROOT, 'docs', 'data', 'countries.geojson')))
    cty = {f['properties']['a2']: f['properties'] for f in g['features']}
    items = []
    for pid, r in keep.items():
        p = info.get(pid)
        if not p:
            continue
        cc = (p.get('countrycode') or [''])[0]
        c = cty.get(cc)
        if not c:
            continue  # regional / multi-country projects are not drawn
        abstract = strip_html(((p.get('project_abstract') or {}).get('cdata!')) or p.get('pdo') or '')
        if len(abstract) < 60:
            continue
        name = re.sub(r'^[A-Z][A-Za-z .,&\'-]+ - ', '', (p.get('project_name') or r['Project Name']).strip()) or r['Project Name']
        dx, dy = jitter(pid, 1.6)
        items.append({
            'id': 'wb' + pid, 'src': 'wb', 'licence': 'CC BY 4.0', 'commercial': True,
            'title': name, 'desc': clip(abstract, 300), 'problem': '', 'outcome': f"Independent evaluators (IEG) rated the outcome {r['Outcome']} in their {r['Evaluation Type']} review, fiscal year {r['Evaluation FY']}.",
            'lesson': '', 'rating': r['Outcome'], 'practice': r['Global Practice'], 'region': r['WB Region'],
            'place': (p.get('countryshortname') or r['Country / Economy']), 'country': c['n'], 'precision': 'country',
            'lat': round(c['ly'] + dy, 4), 'lon': round(c['lx'] + dx, 4),
            'start': (p.get('boardapprovaldate') or '')[:10] or (r['Approval FY'] + '-07-01' if r['Approval FY'] else None),
            'end': (r['Final Closing FY'] + '-06-30') if r['Final Closing FY'] else None, 'ongoing': False,
            'issues': [r['Global Practice']] if r['Global Practice'] else [], 'topics': [], 'documented': True,
            'url': f'https://projects.worldbank.org/en/projects-operations/project-detail/{pid}',
        })
    prev = read_json('solved_wb.json')
    if prev and len(items) < 0.8 * prev['meta'].get('count', 0):
        prev['meta']['status'] = {'ok': False, 'note': f'World Bank refresh returned less than usual ({len(items)}); showing the previous build.'}
        write_json('solved_wb.json', prev); return
    write_json('solved_wb.json', {'meta': {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'count': len(items),
        'source': 'World Bank · IEG Project Performance Ratings + Projects API', 'licence': 'CC BY 4.0', 'sourceAsOf': as_of,
        'citation': 'Independent Evaluation Group - World Bank Project Performance Ratings, http://ieg.worldbankgroup.org/ratings',
        'status': {'ok': True, 'note': ''}}, 'items': items})


if __name__ == '__main__':
    main()
