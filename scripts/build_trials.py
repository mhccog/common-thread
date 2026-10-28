"""Pillar 3b, The world's unfinished work: clinical studies on ClinicalTrials.gov (US National Library of Medicine,
public-domain records) that stopped for practical reasons (money, recruitment, staff, sponsor decisions, the pandemic),
not because the treatment was unsafe or did not work. Drawn at the first listed study site."""
import json, re, time, datetime, urllib.parse
from common import get_json, clip, write_json, read_json

API = 'https://clinicaltrials.gov/api/v2/studies?'
FIELDS = 'NCTId,BriefTitle,OfficialTitle,OverallStatus,WhyStopped,Condition,LeadSponsorName,LeadSponsorClass,LocationCity,LocationCountry,LocationGeoPoint,LocationFacility,StartDate,LastUpdatePostDate,Phase,EnrollmentCount,EnrollmentType,BriefSummary,StudyType'
REASONS = [
    ('Money ran out', r'\bfund|financ|budget|\bgrant\b|money|\bcost'),
    ('Too few people enrolled', r'(low|slow|poor|insufficient|inadequate|limited|lack of|lagging|failure to|unable to|difficult\w*|challeng\w*|problems?) (in |with |of )?(patient |participant |subject )?(enrol|recruit|accrual)|(enrol\w*|recruit\w*|accrual) (was |were |is )?(too )?(low|slow|poor|insufficient|difficult|challeng|goals? not)|(no|zero|few) (patients|participants|subjects)( were)? (enrol|recruit)|not (enrol|recruit)\w* any|did not (enrol|recruit)|never (enrol|recruit)'),
    ('The sponsor changed course', r'sponsor|business|strateg|commercial|portfolio|company|priorit|manufacturer'),
    ('People or resources left', r'staff|investigator (left|moved|retired|departure|relocat)|\bpi (left|moved|retired|departure|relocat)|left the institution|resources?\b|personnel|capacity'),
    ('The pandemic', r'covid|pandemi|sars-cov'),
]
SAFE = re.compile(r'safety|futility|futile|toxic|adverse|efficacy|death|died|harm|ineffective|lack of (benefit|effect)|interim analysis|dsmb|data monitoring|risk', re.I)
PAGES = 6
MAX_ITEMS = 1800


def classify(w):
    if not w or SAFE.search(w):
        return None
    for label, rx in REASONS:
        if re.search(rx, w, re.I):
            return label
    return None


def main():
    since = (datetime.date.today() - datetime.timedelta(days=3 * 365)).isoformat()
    q = {'filter.overallStatus': 'TERMINATED,WITHDRAWN,SUSPENDED', 'pageSize': 1000, 'countTotal': 'true',
         'query.term': f'AREA[LastUpdatePostDate]RANGE[{since},MAX]', 'sort': 'LastUpdatePostDate:desc', 'fields': FIELDS}
    studies, token, total, err = [], None, None, None
    for _ in range(PAGES):
        try:
            d = get_json(API + urllib.parse.urlencode(q | ({'pageToken': token} if token else {})), timeout=120)
        except Exception as e:
            err = e; print('page failed', e); break
        total = total or d.get('totalCount')
        studies += d.get('studies', [])
        token = d.get('nextPageToken')
        if not token:
            break
        time.sleep(1)
    items = []
    for s in studies:
        p = s.get('protocolSection', {})
        st, idm = p.get('statusModule', {}), p.get('identificationModule', {})
        why = st.get('whyStopped') or ''
        reason = classify(why)
        if not reason:
            continue
        locs = [l for l in (p.get('contactsLocationsModule') or {}).get('locations', []) if l.get('geoPoint')]
        if not locs:
            continue
        l0 = locs[0]
        sp = (p.get('sponsorCollaboratorsModule') or {}).get('leadSponsor') or {}
        en = (p.get('designModule') or {}).get('enrollmentInfo') or {}
        conds = (p.get('conditionsModule') or {}).get('conditions') or []
        nct = idm.get('nctId')
        items.append({
            'id': 'ct' + nct, 'src': 'ct', 'title': idm.get('briefTitle'), 'desc': clip((p.get('descriptionModule') or {}).get('briefSummary') or '', 180),
            'why': clip(why, 220), 'reason': reason, 'status': st.get('overallStatus', '').title(), 'conditions': conds[:5],
            'sponsor': sp.get('name'), 'sponsorClass': sp.get('class'), 'phase': ', '.join((p.get('designModule') or {}).get('phases') or []),
            'enrolled': en.get('count'), 'enrolledType': en.get('type'),
            'created': (st.get('startDateStruct') or {}).get('date'), 'stopped': (st.get('lastUpdatePostDateStruct') or {}).get('date'),
            'sites': len(locs), 'place': {'lat': round(l0['geoPoint']['lat'], 3), 'lon': round(l0['geoPoint']['lon'], 3),
                                          'label': ', '.join(x for x in [l0.get('city'), l0.get('country')] if x), 'precision': 'city'},
            'where': l0.get('facility'), 'url': f'https://clinicaltrials.gov/study/{nct}',
        })
    items = items[:MAX_ITEMS]
    prev = read_json('trials.json')
    if prev and len(items) < 0.8 * prev['meta'].get('count', 0):
        prev['meta']['status'] = {'ok': False, 'note': f'ClinicalTrials.gov returned less than usual ({len(items)}; {err or ""}); showing the previous build.'}
        write_json('trials.json', prev); return
    counts = {}
    for i in items:
        counts[i['reason']] = counts.get(i['reason'], 0) + 1
    write_json('trials.json', {'meta': {'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'count': len(items), 'placed': len(items),
        'scanned': len(studies), 'stoppedTotal': total, 'byReason': counts, 'since': since,
        'source': 'ClinicalTrials.gov API v2 (US National Library of Medicine)', 'licence': 'Public domain (US government work; NLM asks for attribution)',
        'status': {'ok': not err, 'note': f'Only part of the list was read this run ({err.__class__.__name__}).' if err else ''}}, 'items': items})


if __name__ == '__main__':
    main()
