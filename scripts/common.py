"""Small shared helpers: polite HTTP, text cleaning, TF-IDF. Standard library only."""
import json, os, re, time, math, html, urllib.request, urllib.error, collections

UA = 'CommonThread/0.1 (+https://github.com/mhccog/common-thread; open-data research prototype)'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'docs', 'data')
CACHE = os.path.join(ROOT, 'cache')


def get(url, headers=None, data=None, timeout=60, tries=3, pause=2.0):
    h = {'User-Agent': UA, 'Accept': 'application/json'}
    h.update(headers or {})
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=h, data=data)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read().decode('utf-8', 'replace')
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (403, 404, 410, 451):
                raise
            time.sleep(pause * (i + 1) * (5 if e.code == 429 else 1))
        except Exception as e:  # network hiccup
            last = e
            time.sleep(pause * (i + 1))
    raise last


def get_json(url, **kw):
    return json.loads(get(url, **kw))


def strip_html(s):
    s = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', s or '', flags=re.S | re.I)
    s = re.sub(r'<sup[^>]*>.*?</sup>', '', s, flags=re.S)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = html.unescape(s)
    s = re.sub(r'\[\d+\]', '', s)
    return re.sub(r'\s+', ' ', s).strip()


def clip(s, n):
    s = (s or '').strip()
    if len(s) <= n:
        return s
    cut = s[:n]
    m = re.search(r'^(.*[.!?])\s', cut)
    if m and len(m.group(1)) > n * 0.55:
        return m.group(1)
    return cut.rsplit(' ', 1)[0] + '…'


def write_json(name, obj):
    os.makedirs(DATA, exist_ok=True)
    path = os.path.join(DATA, name)
    tmp = path + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
    os.replace(tmp, path)
    print('wrote', path, os.path.getsize(path), 'bytes')


def read_json(name, default=None):
    try:
        with open(os.path.join(DATA, name)) as f:
            return json.load(f)
    except Exception:
        return default


STOP = set('''a an the and or of to in on for with by from at as is are was were be been being this that these those it its into than then
their there they them we our you your he she his her not no but if so such can could would should may might will also more most other
some any each which who whom what when where how why all both about over under between through during before after above below up down
out off again further once here only own same too very just new use used using based via within without across per among
case cases project projects programme program process initiative city cities people public local government citizens community participation participatory
participants participant held took took place part one two three first second year years made make number many well including'''.split())


SYN = {'kids': 'child', 'children': 'child', 'childhood': 'child', 'paediatric': 'child', 'pediatric': 'child', 'youth': 'young',
       'elderly': 'older', 'seniors': 'older', 'aged': 'older', 'jobs': 'employ', 'employment': 'employ', 'unemployment': 'employ',
       'electricity': 'power', 'electric': 'power', 'potable': 'drinking', 'sanitation': 'sanit', 'schooling': 'school', 'schools': 'school',
       'tumour': 'tumor', 'tumours': 'tumor', 'cancers': 'cancer', 'oncology': 'cancer', 'farmers': 'farm', 'farming': 'farm', 'agricultural': 'farm', 'agriculture': 'farm',
       'homelessness': 'homeless', 'housing': 'house', 'houses': 'house', 'flooding': 'flood', 'floods': 'flood', 'droughts': 'drought'}


def stem(w):
    w = SYN.get(w, w)
    for suf, rep in (('ational', 'ate'), ('ization', 'ize'), ('isation', 'ize'), ('ations', 'ate'), ('ation', 'ate'), ('ments', ''), ('ment', ''),
                     ('ities', 'ity'), ('ies', 'y'), ('ing', ''), ('ed', ''), ('es', ''), ('s', '')):
        if w.endswith(suf) and len(w) - len(suf) >= 4 and not w.endswith('ss'):
            return w[: len(w) - len(suf)] + rep
    return w


def tokens(s, stemmed=False):
    s = (s or '').lower()
    words = re.findall(r"[^\W\d_][\w\-']{2,}", s)
    out = [w.strip("-'") for w in words if w.strip("-'") not in STOP and len(w) > 2]
    return [stem(w) for w in out] if stemmed else out


def tfidf(docs):
    """docs: list of token lists -> list of {term: weight} (L2-normalised)."""
    df = collections.Counter()
    for d in docs:
        df.update(set(d))
    n = len(docs)
    out = []
    for d in docs:
        tf = collections.Counter(d)
        v = {t: (1 + math.log(c)) * math.log((1 + n) / (1 + df[t])) for t, c in tf.items() if df[t] >= 2 and df[t] < n * 0.25}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1
        out.append({t: x / norm for t, x in v.items()})
    return out


def cos(a, b):
    if len(a) > len(b):
        a, b = b, a
    return sum(w * b.get(t, 0) for t, w in a.items())


def shared_terms(a, b, k=4):
    s = sorted(((a[t] * b[t], t) for t in a if t in b), reverse=True)
    return [t for _, t in s[:k]]
