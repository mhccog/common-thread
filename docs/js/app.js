// Common Thread: five quiet layers of real public data on one globe.
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth <= 760;
const london = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtStamp = (iso) => iso ? london.format(new Date(iso)) + ' London time' : 'unknown';
const fmtDate = (d) => d ? new Date(d.length === 10 ? d + 'T12:00:00Z' : d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const year = (d) => d ? d.slice(0, 4) : '';
const n = (x) => Number(x || 0).toLocaleString('en-GB');
const ago = (d) => { if (!d) return ''; const y = (Date.now() - new Date(d)) / 3.156e10; return y >= 1.5 ? `${Math.round(y)} years ago` : y >= 0.9 ? 'about a year ago' : `${Math.max(1, Math.round(y * 12))} months ago`; };

// ---------- the five pillars ----------
const P = {
  p1: { key: 'p1', n: 1, colour: '#ffcf8a', name: "You're not the only one", what: 'Independent teams, far apart, doing nearly the same work at the same time.', file: 'converging.json' },
  p2: { key: 'p2', n: 2, colour: '#6fe3c1', name: 'Solved somewhere else', what: 'A problem met in one place, joined to an earlier documented answer in another country.', file: 'solved.json' },
  p3: { key: 'p3', n: 3, colour: '#b9a2ff', name: "The world's unfinished work", what: 'Valued projects that stopped. Each ring is a nearly finished answer someone could pick up.', file: 'unfinished.json' },
  p4: { key: 'p4', n: 4, colour: '#cfe4ff', name: "Everything we're stuck on", what: 'Open problems, drawn in the sky because they belong to no place. Quiet ones glow.', file: 'stuck.json' },
  p5: { key: 'p5', n: 5, colour: '#ff9f8f', name: "Leftovers and missing pieces", what: 'Places where people leave what they have spare. Only the offers are published.', file: 'leftovers.json' },
};
const LINK = '#fff1c9';
const ICON = {
  p1: (c) => `<svg viewBox="0 0 26 26" class="ico"><path d="M6 17 Q13 4 20 17" fill="none" stroke="${c}" stroke-width="1.3" opacity=".8"/><circle cx="6" cy="17" r="3.2" fill="${c}"/><circle cx="20" cy="17" r="3.2" fill="${c}"/></svg>`,
  p2: (c) => `<svg viewBox="0 0 26 26" class="ico"><path d="M7 19 L19 7" stroke="${c}" stroke-width="1.3" stroke-dasharray="2.2 2.4"/><path d="M19 3.5 L22.5 7 L19 10.5 L15.5 7Z" fill="${c}"/><path d="M7 15.5 L10.5 19 L7 22.5 L3.5 19Z" fill="none" stroke="${c}" stroke-width="1.3"/></svg>`,
  p3: (c) => `<svg viewBox="0 0 26 26" class="ico"><circle cx="13" cy="13" r="7.5" fill="none" stroke="${c}" stroke-width="1.6"/><circle cx="13" cy="13" r="11" fill="none" stroke="${c}" stroke-width=".8" opacity=".35"/></svg>`,
  p4: (c) => `<svg viewBox="0 0 26 26" class="ico"><path d="M13 3 L14.6 11.4 L23 13 L14.6 14.6 L13 23 L11.4 14.6 L3 13 L11.4 11.4Z" fill="${c}"/><circle cx="13" cy="13" r="9" fill="${c}" opacity=".12"/></svg>`,
  p5: (c) => `<svg viewBox="0 0 26 26" class="ico"><rect x="7.5" y="7.5" width="11" height="11" rx="2.5" fill="none" stroke="${c}" stroke-width="1.6"/><rect x="10.5" y="10.5" width="5" height="5" rx="1" fill="${c}"/></svg>`,
  link: () => `<svg viewBox="0 0 26 12" width="26" height="12"><path d="M1 10 Q13 -2 25 10" fill="none" stroke="${LINK}" stroke-width="1.8"/></svg>`,
};

const S = {
  data: {}, status: {}, on: { p1: true, p2: true, p3: true, p4: true, p5: true, link: true },
  byId: new Map(), index: [], links: [], stars: [], sel: null, drift: true, driftTimer: null, driftStep: 0,
  lastInteract: 0, flying: false, p1arcs: [], linkArcs: [], groundLinks: [],
};
window.__commonThread = S;
S.select = (id) => { pauseDrift(); select(id, true); };

// ---------- map ----------
const map = new maplibregl.Map({
  container: 'map',
  style: { version: 8, projection: { type: 'globe' }, sources: {}, layers: [] },
  center: [10, 22], zoom: isMobile() ? 0.05 : 0.9, attributionControl: false, maxPitch: 0, renderWorldCopies: false,
  canvasContextAttributes: { alpha: true, antialias: true },
});
S.map = map;
map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'Natural Earth · OpenAlex · GitHub · arXiv · Hacker News · Participedia (CC BY-NC-SA 3.0) · © OpenStreetMap contributors (ODbL) · Wikipedia · Open Problem Garden · Erdős problems · Gap Map · Photon' }), 'bottom-right');
map.dragRotate.disable(); map.touchZoomRotate.disableRotation();
['mousedown', 'touchstart', 'wheel'].forEach(ev => map.getCanvasContainer().addEventListener(ev, () => { S.lastInteract = performance.now(); if (S.drift && ev !== 'wheel') pauseDrift(); }, { passive: true }));

const fc = (features) => ({ type: 'FeatureCollection', features });
const pt = (lon, lat, props) => ({ type: 'Feature', properties: props, geometry: { type: 'Point', coordinates: [lon, lat] } });

function iconImage(kind, colour) {
  const s = 48, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  g.strokeStyle = colour; g.fillStyle = colour;
  if (kind === 'diamond') { g.beginPath(); g.moveTo(24, 8); g.lineTo(40, 24); g.lineTo(24, 40); g.lineTo(8, 24); g.closePath(); g.fill(); }
  if (kind === 'ring') { g.lineWidth = 5; g.beginPath(); g.arc(24, 24, 15, 0, Math.PI * 2); g.stroke(); }
  if (kind === 'box') { g.lineWidth = 5; const r = 6; g.beginPath(); g.roundRect(9, 9, 30, 30, r); g.stroke(); g.fillRect(19, 19, 10, 10); }
  return { width: s, height: s, data: new Uint8Array(g.getImageData(0, 0, s, s).data.buffer) };
}

map.on('load', async () => {
  const countries = await fetch('data/countries.geojson').then(r => r.json()).catch(() => fc([]));
  map.addSource('countries', { type: 'geojson', data: countries });
  map.addLayer({ id: 'ocean', type: 'background', paint: { 'background-color': '#060b16' } });
  map.addLayer({ id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': '#0f182b' } });
  map.addLayer({ id: 'borders', type: 'line', source: 'countries', paint: { 'line-color': '#1d2942', 'line-width': 0.5 } });
  map.addImage('diamond', iconImage('diamond', P.p2.colour), { pixelRatio: 2 });
  map.addImage('ring', iconImage('ring', P.p3.colour), { pixelRatio: 2 });
  map.addImage('box', iconImage('box', P.p5.colour), { pixelRatio: 2 });
  for (const id of ['p5', 'p2t', 'p2', 'p3', 'p1t', 'p1s', 'p1', 'lk', 'lks', 'sel']) map.addSource(id, { type: 'geojson', data: fc([]) });
  const iconLayer = (id, img, size, op) => map.addLayer({ id, type: 'symbol', source: id, layout: { 'icon-image': img, 'icon-size': size, 'icon-allow-overlap': true, 'icon-ignore-placement': true, 'icon-pitch-alignment': 'map', 'icon-rotation-alignment': 'map' }, paint: { 'icon-opacity': op } });
  // 5: leftovers, small boxes, lowest
  iconLayer('p5', 'box', ['interpolate', ['linear'], ['zoom'], 0, 0.22, 4, 0.4, 8, 0.6], ['interpolate', ['linear'], ['zoom'], 0, 0.5, 5, 0.85]);
  // 2: solved, dashed mint threads and diamonds
  map.addLayer({ id: 'p2t', type: 'line', source: 'p2t', paint: { 'line-color': P.p2.colour, 'line-width': 1, 'line-opacity': 0.32, 'line-dasharray': [2, 3] } });
  iconLayer('p2', 'diamond', ['interpolate', ['linear'], ['zoom'], 0, 0.28, 5, 0.5], ['case', ['get', 'paired'], 0.95, 0.5]);
  // 3: unfinished work, rings sized by how many valued it
  iconLayer('p3', 'ring', ['interpolate', ['linear'], ['get', 'w'], 0, 0.22, 1, 0.62], 0.85);
  // 1: converging teams, amber arcs with travelling sparks
  map.addLayer({ id: 'p1t-glow', type: 'line', source: 'p1t', layout: { 'line-cap': 'round' }, paint: { 'line-color': P.p1.colour, 'line-width': 5, 'line-blur': 5, 'line-opacity': 0.13 } });
  map.addLayer({ id: 'p1t', type: 'line', source: 'p1t', layout: { 'line-cap': 'round' }, paint: { 'line-color': P.p1.colour, 'line-width': 1, 'line-opacity': 0.55 } });
  map.addLayer({ id: 'p1s', type: 'circle', source: 'p1s', paint: { 'circle-radius': 2.6, 'circle-blur': 0.8, 'circle-color': '#fff3dc', 'circle-opacity': ['get', 'o'], 'circle-pitch-alignment': 'map' } });
  map.addLayer({ id: 'p1', type: 'circle', source: 'p1', paint: { 'circle-radius': 3.2, 'circle-color': P.p1.colour, 'circle-opacity': 0.95, 'circle-stroke-width': 4, 'circle-stroke-color': P.p1.colour, 'circle-stroke-opacity': 0.15, 'circle-pitch-alignment': 'map' } });
  // gold threads where layers meet
  map.addLayer({ id: 'lk-glow', type: 'line', source: 'lk', layout: { 'line-cap': 'round' }, paint: { 'line-color': LINK, 'line-width': 7, 'line-blur': 6, 'line-opacity': 0.18 } });
  map.addLayer({ id: 'lk', type: 'line', source: 'lk', layout: { 'line-cap': 'round' }, paint: { 'line-color': LINK, 'line-width': 1.7, 'line-opacity': 0.8 } });
  map.addLayer({ id: 'lks', type: 'circle', source: 'lks', paint: { 'circle-radius': 3, 'circle-blur': 0.7, 'circle-color': '#ffffff', 'circle-opacity': ['get', 'o'], 'circle-pitch-alignment': 'map' } });
  map.addLayer({ id: 'sel', type: 'circle', source: 'sel', paint: { 'circle-radius': 14, 'circle-color': 'transparent', 'circle-stroke-color': ['get', 'c'], 'circle-stroke-width': 1.2, 'circle-stroke-opacity': 0.9, 'circle-pitch-alignment': 'map' } });

  wirePointer();
  await loadAll();
  requestAnimationFrame(tick);
});

// ---------- data ----------
async function loadJSON(file) {
  try { const r = await fetch('data/' + file, { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
  catch (e) { return { __error: e.message }; }
}
async function loadAll() {
  const keys = ['p1', 'p2', 'p3', 'p4', 'p5'];
  const [d1, d2, d3, d4, d5, lk] = await Promise.all([...keys.map(k => loadJSON(P[k].file)), loadJSON('links.json')]);
  S.data = { p1: d1, p2: d2, p3: d3, p4: d4, p5: d5 };
  buildP1(d1); buildP2(d2); buildP3(d3); buildP4(d4); buildP5(d5);
  buildLinks(lk);
  renderLegend(); renderIntro();
  if (!localStorage.getItem('ct-intro')) { $('intro').showModal(); $('intro').addEventListener('close', () => { localStorage.setItem('ct-intro', '1'); startDrift(); }, { once: true }); }
  else startDrift();
  const hash = decodeURIComponent(location.hash.slice(1)); if (hash && S.byId.has(hash)) { pauseDrift(); select(hash, true); }
}
const okMeta = (d) => d && !d.__error && d.meta;
function setStatus(k, d, count, extra) {
  if (!okMeta(d)) { S.status[k] = { count: 0, warn: true, text: k === 'p4' ? 'Arriving soon: this layer has not published yet.' : `Unavailable right now (${d?.__error || 'no data'}).` }; return; }
  const m = d.meta, st = m.status || {};
  S.status[k] = { count, warn: st.ok === false, text: (st.ok === false && st.note ? st.note + ' ' : '') + (extra || '') + `Updated ${fmtStamp(m.generated)}.` };
}
function addIndex(key, id, title, sub, text, item) {
  S.byId.set(id, { key, id, title, sub, item });
  S.index.push({ key, id, title, sub, hay: (title + ' ' + sub + ' ' + (text || '')).toLowerCase() });
}

function buildP1(d) {
  if (!okMeta(d)) return setStatus('p1', d, 0);
  const pts = [], lines = [];
  S.p1arcs = [];
  for (const t of d.topics) for (const c of t.convergences) {
    c.topic = t.topic;
    const placed = c.members.filter(m => m.place);
    placed.forEach(m => pts.push(pt(m.place.lon, m.place.lat, { id: c.id, title: m.title, where: placeLabel(m.place) })));
    for (let i = 0; i < placed.length - 1; i++) {
      const segs = arc([placed[i].place.lon, placed[i].place.lat], [placed[i + 1].place.lon, placed[i + 1].place.lat]);
      if (segs) { segs.forEach(s => lines.push({ type: 'Feature', properties: { id: c.id }, geometry: { type: 'LineString', coordinates: s } })); S.p1arcs.push(segs.flat()); }
    }
    addIndex('p1', c.id, t.topic, c.caption, c.members.map(m => m.title + ' ' + (m.by || '') + ' ' + (m.place?.city || '') + ' ' + (m.place?.countryName || '')).join(' ') + ' ' + c.terms.join(' '), c);
  }
  map.getSource('p1').setData(fc(pts)); map.getSource('p1t').setData(fc(lines));
  const total = d.topics.reduce((a, t) => a + t.convergences.length, 0);
  setStatus('p1', d, total, `${d.topics.length} problems swept weekly (last sweep ${fmtStamp(d.meta.sweptAt)}). `);
}

function buildP2(d) {
  if (!okMeta(d)) return setStatus('p2', d, 0);
  const byId = new Map(d.items.map(i => [i.id, i]));
  const paired = new Set(); d.pairs.forEach(p => { paired.add(p.from); paired.add(p.to); });
  S.p2pairs = d.pairs; S.p2by = byId;
  map.getSource('p2').setData(fc(d.items.map(i => pt(i.lon, i.lat, { id: i.id, paired: paired.has(i.id) }))));
  const lines = [];
  for (const p of d.pairs) { const a = byId.get(p.from), b = byId.get(p.to); if (!a || !b) continue; const segs = arc([a.lon, a.lat], [b.lon, b.lat], 64); if (segs) segs.forEach(s => lines.push({ type: 'Feature', properties: { id: p.from }, geometry: { type: 'LineString', coordinates: s } })); }
  map.getSource('p2t').setData(fc(lines));
  for (const i of d.items) addIndex('p2', i.id, i.title, `${i.place}${i.start ? ' · ' + year(i.start) : ''}`, [i.desc, i.problem, i.topics.join(' '), i.issues.join(' ')].join(' '), i);
  setStatus('p2', d, d.items.length, `${n(d.meta.documented)} with documented outcomes, ${n(d.meta.pairs)} joined to an earlier answer abroad. `);
}

function buildP3(d) {
  if (!okMeta(d)) return setStatus('p3', d, 0);
  const placed = d.items.filter(i => i.place);
  const maxL = Math.log10(Math.max(...placed.map(i => i.stars), 10));
  map.getSource('p3').setData(fc(placed.map(i => pt(i.place.lon + jitter(i.id, 0.25), i.place.lat + jitter(i.id + 'y', 0.25), { id: i.id, w: Math.min(1, Math.log10(i.stars) / maxL) }))));
  for (const i of d.items) addIndex('p3', i.id, i.title, `${i.desc}`, `${i.topics.join(' ')} ${i.themes.join(' ')} ${i.where || ''}`, i);
  setStatus('p3', d, d.items.length, `${n(d.meta.placed)} have a public location and are drawn; the rest are searchable. `);
}

function buildP4(d) {
  if (!okMeta(d) || !d.problems?.length) { setStatus('p4', d?.problems ? { __error: 'empty' } : d, 0); if (okMeta(d)) S.status.p4 = { count: 0, warn: true, text: d.meta.status?.note || 'Arriving soon.' }; return; }
  const fams = d.meta.families || [...new Set(d.problems.map(p => p.family))];
  const cnt = {}; d.problems.forEach(p => { cnt[p.family] = (cnt[p.family] || 0) + 1; });
  const wts = fams.map(f => Math.sqrt(cnt[f] || 0)), tot = wts.reduce((a, b) => a + b, 0) || 1;
  let acc = 0; S.sectors = fams.map((f, i) => { const s0 = acc / tot * Math.PI * 2; acc += wts[i]; return { f, a0: s0, a1: acc / tot * Math.PI * 2 }; });
  S.stars = d.problems.map(p => {
    const h = hash(p.id), sec = S.sectors[Math.max(0, fams.indexOf(p.family))];
    const pad = (sec.a1 - sec.a0) * 0.06;
    return { p, a: sec.a0 + pad + (h % 1000) / 1000 * (sec.a1 - sec.a0 - 2 * pad), r: 1.12 + Math.sqrt(((h >> 10) % 1000) / 1000) * 0.8, tw: (h >> 3) % 628 / 100, quiet: p.neglect != null && p.neglect >= 0.8 };
  });
  S.families = fams;
  for (const p of d.problems) addIndex('p4', p.id, p.title, `${p.family}${p.subfield ? ' · ' + p.subfield : ''}`, (p.statement || '') + ' ' + (p.query || ''), p);
  const quiet = S.stars.filter(s => s.quiet).length;
  setStatus('p4', d, d.problems.length, `${n(quiet)} glow: almost nobody is visibly working on them. `);
}

function buildP5(d) {
  if (!okMeta(d)) return setStatus('p5', d, 0);
  S.p5kinds = d.meta.kinds;
  map.getSource('p5').setData(fc(d.items.map(i => pt(i.lon, i.lat, { id: i.id }))));
  for (const i of d.items) addIndex('p5', i.id, i.name || d.meta.kinds[i.kind]?.label || 'Unnamed', `${d.meta.kinds[i.kind]?.label || i.kind}${i.city ? ' · ' + i.city : ''}`, (i.note || '') + ' ' + i.kind.replace('_', ' '), i);
  const c = d.meta.counts || {};
  setStatus('p5', d, d.items.length, Object.entries(c).filter(([, v]) => v).map(([k, v]) => `${n(v)} ${d.meta.kinds[k]?.label.toLowerCase()}${v === 1 ? '' : 's'}`).join(', ').replace(/caf(é|e)s?s/, 'cafés') + '. No open source of needs to match them to. ');
}

function buildLinks(d) {
  S.links = (d && !d.__error && d.links) || [];
  S.linkMeta = d && !d.__error ? d.meta : null;
  const lines = []; S.linkArcs = []; S.groundLinks = [];
  for (const l of S.links) {
    const a = anchor(l.a), b = anchor(l.b);
    l.ok = !!(a && b);
    if (a?.ground && b?.ground) {
      const segs = arc(a.ll, b.ll);
      if (segs) { segs.forEach(s => lines.push({ type: 'Feature', properties: { id: l.id }, geometry: { type: 'LineString', coordinates: s } })); S.linkArcs.push(segs.flat()); }
    } else if (a && b) S.groundLinks.push({ l, a, b });
    if (l.ok) addIndex('link', l.id, l.title, 'Where two layers meet', l.why, l);
  }
  map.getSource('lk').setData(fc(lines));
}
function anchor(ref) {
  const e = S.byId.get(ref); if (!e) return null;
  const it = e.item;
  if (e.key === 'p4') return { star: S.stars.find(s => s.p.id === ref) };
  const ll = locate(e); return ll ? { ground: true, ll } : null;
}
function locate(e) {
  const it = e.item;
  if (e.key === 'p1') { const m = it.members.find(m => m.place); return m && [m.place.lon, m.place.lat]; }
  if (e.key === 'p2' || e.key === 'p5') return [it.lon, it.lat];
  if (e.key === 'p3') return it.place && [it.place.lon + jitter(it.id, 0.25), it.place.lat + jitter(it.id + 'y', 0.25)];
  if (e.key === 'link') return null;
  return null;
}

// ---------- legend / intro ----------
function renderLegend() {
  const el = $('legend');
  el.innerHTML = ['p1', 'p2', 'p3', 'p4', 'p5'].map(k => {
    const p = P[k], st = S.status[k] || {};
    return `<button class="layer ${S.on[k] ? '' : 'off'}" data-k="${k}" aria-pressed="${S.on[k]}" title="Show or hide this layer">
      ${ICON[k](p.colour)}<span class="name" style="color:${p.colour}">${esc(p.name)}</span><span class="num">${st.count ? n(st.count) : '–'}</span>
      <span class="what">${esc(p.what)}</span><span class="state ${st.warn ? 'warn' : ''}">${esc(st.text || '')}</span></button>`;
  }).join('') + `<button class="linkrow ${S.on.link ? '' : 'off'}" data-k="link">${ICON.link()}<span><span style="color:${LINK}">Gold threads</span>: ${n(S.links.filter(l => l.ok).length)} places where two layers genuinely meet</span></button>`;
  el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => toggle(b.dataset.k));
}
function renderIntro() {
  $('introFive').innerHTML = ['p1', 'p2', 'p3', 'p4', 'p5'].map(k => `<li>${ICON[k](P[k].colour)}<div><b style="color:${P[k].colour}">${esc(P[k].name)}</b><span>${esc(P[k].what)}</span></div></li>`).join('');
}
$('aboutBtn').onclick = () => $('intro').showModal();
function toggle(k) {
  S.on[k] = !S.on[k];
  const vis = S.on[k] ? 'visible' : 'none';
  const ids = { p1: ['p1', 'p1t', 'p1t-glow', 'p1s'], p2: ['p2', 'p2t'], p3: ['p3'], p4: [], p5: ['p5'], link: ['lk', 'lk-glow', 'lks'] }[k];
  ids.forEach(id => map.setLayoutProperty(id, 'visibility', vis));
  renderLegend();
}

// ---------- geometry ----------
const rad = (d) => d * Math.PI / 180, deg = (r) => r * 180 / Math.PI;
function toVec(lon, lat) { const a = rad(lat), b = rad(lon); return [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)]; }
function toLonLat(v) { const m = Math.hypot(...v); return [deg(Math.atan2(v[1], v[0])), deg(Math.asin(v[2] / m))]; }
function arc(a, b, steps = 96) {
  const va = toVec(...a), vb = toVec(...b);
  const om = Math.acos(Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2])));
  if (om < 1e-4) return null;
  const pts = []; let prev = null;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om);
    let [lon, lat] = toLonLat([s1 * va[0] + s2 * vb[0], s1 * va[1] + s2 * vb[1], s1 * va[2] + s2 * vb[2]]);
    if (prev != null) { while (lon - prev > 180) lon -= 360; while (lon - prev < -180) lon += 360; }
    prev = lon; pts.push([lon, lat]);
  }
  const segs = []; let cur = [];
  for (const p of pts) { if (Math.abs(p[1]) > 84.8) { if (cur.length > 1) segs.push(cur); cur = []; continue; } cur.push(p); }
  if (cur.length > 1) segs.push(cur);
  return segs.length ? segs : null;
}
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function jitter(s, amt) { return ((hash(s) % 2000) / 1000 - 1) * amt; }
function placeLabel(p) { if (!p) return 'Place not public'; return (p.precision === 'country' ? `${p.countryName || p.label} (country only)` : [p.city || p.label, p.countryName].filter(Boolean).join(', ')); }
// visible when the point faces the viewer
function facing(ll) { const c = map.getCenter(); const a = toVec(ll[0], ll[1]), b = toVec(c.lng, c.lat); return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] > 0.08; }
function globeGeom() {
  const c = map.getCenter(), z = map.getZoom();
  const r = (512 * Math.pow(2, z)) / (2 * Math.PI) / Math.cos(rad(Math.min(Math.abs(c.lat), 85)));
  const cv = map.getCanvas(); const ctr = map.project(c);
  return { cx: ctr.x, cy: ctr.y, r: r * (cv.clientWidth / cv.clientWidth) };
}
function starXY(s, g, t) { const a = s.a - rad(map.getCenter().lng) * 0.5 + (reduceMotion ? 0 : t * 0.000006); return [g.cx + Math.cos(a) * g.r * s.r, g.cy + Math.sin(a) * g.r * s.r * 0.92]; }

// ---------- sky + overlay ----------
const sky = $('sky'), ov = $('overlay'), sg = sky.getContext('2d'), og = ov.getContext('2d');
function sizeCanvases() { const d = devicePixelRatio || 1; for (const c of [sky, ov]) { c.width = innerWidth * d; c.height = innerHeight * d; c.getContext('2d').setTransform(d, 0, 0, d, 0, 0); } }
addEventListener('resize', sizeCanvases); sizeCanvases();
function drawSky(t) {
  sg.clearRect(0, 0, innerWidth, innerHeight);
  const g = globeGeom(); S.g = g;
  // faint far stars, purely decorative and labelled as such in the code: not data
  sg.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 140; i++) { const h = hash('bg' + i); sg.fillRect(h % innerWidth, (h >> 11) % innerHeight, 1, 1); }
  if (!S.on.p4 || !S.stars.length) return;
  const sel = S.sel?.id;
  sg.font = '10px -apple-system, Segoe UI, sans-serif'; sg.textAlign = 'center'; sg.fillStyle = 'rgba(207,228,255,0.32)';
  if (!isMobile()) for (const sec of S.sectors || []) { const [x, y] = starXY({ a: (sec.a0 + sec.a1) / 2, r: 2.04 }, g, t); if (x > 300 && x < innerWidth - 20 && y > 60 && y < innerHeight - 110) sg.fillText(sec.f.toUpperCase(), x, y); }
  for (const s of S.stars) {
    const [x, y] = starXY(s, g, t); s.x = x; s.y = y;
    if (x < -10 || y < -10 || x > innerWidth + 10 || y > innerHeight + 10) { s.vis = false; continue; }
    // hide stars that fall in front of the globe disc
    if (Math.hypot(x - g.cx, y - g.cy) < g.r * 1.02) { s.vis = false; continue; }
    s.vis = true;
    const tw = reduceMotion ? 1 : 0.75 + 0.25 * Math.sin(t / 1300 + s.tw);
    if (s.p.neglect == null) { sg.strokeStyle = 'rgba(207,228,255,0.25)'; sg.lineWidth = 0.7; sg.beginPath(); sg.arc(x, y, 1.6, 0, 7); sg.stroke(); continue; }
    if (s.quiet) {
      const gr = sg.createRadialGradient(x, y, 0, x, y, 9); gr.addColorStop(0, `rgba(207,228,255,${0.5 * tw})`); gr.addColorStop(1, 'rgba(207,228,255,0)');
      sg.fillStyle = gr; sg.fillRect(x - 9, y - 9, 18, 18);
      sg.fillStyle = `rgba(240,247,255,${0.9 * tw})`; sparkle(sg, x, y, 3.4);
    } else { sg.fillStyle = `rgba(207,228,255,${0.22 + 0.25 * (s.p.neglect || 0)})`; sg.fillRect(x - 0.8, y - 0.8, 1.6, 1.6); }
    if (s.p.id === sel) { sg.strokeStyle = P.p4.colour; sg.lineWidth = 1; sg.beginPath(); sg.arc(x, y, 11, 0, 7); sg.stroke(); }
  }
}
function sparkle(g, x, y, r) { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.25, y - r * 0.25); g.lineTo(x + r, y); g.lineTo(x + r * 0.25, y + r * 0.25); g.lineTo(x, y + r); g.lineTo(x - r * 0.25, y + r * 0.25); g.lineTo(x - r, y); g.lineTo(x - r * 0.25, y - r * 0.25); g.closePath(); g.fill(); }
function drawOverlay(t) {
  og.clearRect(0, 0, innerWidth, innerHeight);
  if (!S.on.link || !S.on.p4) return;
  for (const { l, a, b } of S.groundLinks) {
    const star = (a.star || b.star), ground = a.ground ? a : b;
    if (!star?.vis || !ground?.ll || !facing(ground.ll)) continue;
    const p = map.project(ground.ll); const on = S.sel && (S.sel.id === l.id || S.sel.id === l.a || S.sel.id === l.b);
    const mx = (star.x + p.x) / 2, my = Math.min(star.y, p.y) - 40;
    og.strokeStyle = `rgba(255,241,201,${on ? 0.85 : 0.28})`; og.lineWidth = on ? 1.6 : 0.9;
    og.beginPath(); og.moveTo(star.x, star.y); og.quadraticCurveTo(mx, my, p.x, p.y); og.stroke();
    if (!reduceMotion) { const ph = ((t + hash(l.id) % 4000) % 4800) / 4800, u = 1 - ph; const x = u * u * star.x + 2 * u * ph * mx + ph * ph * p.x, y = u * u * star.y + 2 * u * ph * my + ph * ph * p.y; og.fillStyle = `rgba(255,255,255,${Math.sin(ph * Math.PI) * (on ? 0.95 : 0.5)})`; og.beginPath(); og.arc(x, y, on ? 2.4 : 1.6, 0, 7); og.fill(); }
  }
}

// ---------- animation ----------
let lastSpark = 0;
function sparks(arcs, t, base) { return arcs.map((a, i) => { const per = base + (i % 5) * 700, ph = ((t + i * 1300) % per) / per; return pt(...a[Math.floor(ph * (a.length - 1))], { o: Math.sin(ph * Math.PI) * 0.95 }); }); }
function tick(t) {
  requestAnimationFrame(tick);
  if (!map.isStyleLoaded()) return;
  drawSky(t); drawOverlay(t);
  if (!reduceMotion && t - lastSpark > 50) {
    lastSpark = t;
    map.getSource('p1s')?.setData(fc(sparks(S.p1arcs, t, 5600)));
    map.getSource('lks')?.setData(fc(sparks(S.linkArcs, t, 4200)));
    if (!map.isMoving() && !S.flying && t - S.lastInteract > 8000 && !S.sel) { const c = map.getCenter(); map.setCenter([c.lng + 0.01, c.lat]); }
  }
}

// ---------- pointer ----------
const HIT = ['p1', 'p2', 'p3', 'p5'];
function hitAt(point) {
  const fs = map.queryRenderedFeatures([[point.x - 5, point.y - 5], [point.x + 5, point.y + 5]], { layers: HIT.filter(l => map.getLayer(l) && S.on[l]) });
  if (fs.length) return fs[0].properties.id;
  const ls = S.on.link ? map.queryRenderedFeatures([[point.x - 4, point.y - 4], [point.x + 4, point.y + 4]], { layers: ['lk'] }) : [];
  if (ls.length) return ls[0].properties.id;
  const p2t = S.on.p2 ? map.queryRenderedFeatures([[point.x - 3, point.y - 3], [point.x + 3, point.y + 3]], { layers: ['p2t'] }) : [];
  if (p2t.length) return p2t[0].properties.id;
  if (S.on.p4) { let best = null, bd = 9; for (const s of S.stars) { if (!s.vis) continue; const d = Math.hypot(s.x - point.x, s.y - point.y); if (d < bd) { bd = d; best = s; } } if (best) return best.p.id; }
  return null;
}
function wirePointer() {
  map.on('mousemove', (e) => {
    const id = hitAt(e.point); const tip = $('tip');
    if (!id) { tip.hidden = true; map.getCanvas().style.cursor = ''; return; }
    const en = S.byId.get(id); if (!en) return;
    map.getCanvas().style.cursor = 'pointer';
    const c = en.key === 'link' ? LINK : P[en.key].colour, name = en.key === 'link' ? 'Gold thread' : P[en.key].name;
    tip.innerHTML = `<div class="k" style="color:${c}">${esc(name)}</div><div>${esc(en.title.length > 120 ? en.title.slice(0, 118) + '…' : en.title)}</div><div class="m">${esc((en.sub || '').slice(0, 140))}</div>`;
    tip.hidden = false; tip.style.left = Math.min(e.originalEvent.clientX + 14, innerWidth - 310) + 'px'; tip.style.top = Math.min(e.originalEvent.clientY + 14, innerHeight - 120) + 'px';
  });
  map.getCanvas().addEventListener('mouseleave', () => { $('tip').hidden = true; });
  map.on('click', (e) => { const id = hitAt(e.point); if (id) { pauseDrift(); select(id, false); } });
}

// ---------- selection & detail ----------
function select(id, fly = true) {
  const en = S.byId.get(id); if (!en) return;
  S.sel = en; history.replaceState(null, '', '#' + encodeURIComponent(id));
  const ll = en.key === 'link' ? linkGround(en.item) : locate(en);
  map.getSource('sel').setData(fc(ll ? [pt(ll[0], ll[1], { c: en.key === 'link' ? LINK : P[en.key].colour })] : []));
  if (fly && ll) flyTo(ll, en.key === 'p5' ? 4.2 : en.key === 'p1' ? null : 2.6, en);
  if (fly && en.key === 'p4') flyTo([map.getCenter().lng, 15], isMobile() ? -0.3 : 0.45);
  $('detail').hidden = false; $('detailBody').innerHTML = detailHTML(en); $('detail').scrollTop = 0;
  $('detailBody').querySelectorAll('[data-go]').forEach(a => a.onclick = () => { pauseDrift(); select(a.dataset.go, true); });
}
function linkGround(l) { for (const r of [l.a, l.b]) { const e = S.byId.get(r); const ll = e && locate(e); if (ll) return ll; } return null; }
function flyTo(ll, zoom, en) {
  let z = zoom;
  if (en?.key === 'p1') { const pts = en.item.members.filter(m => m.place).map(m => [m.place.lon, m.place.lat]); const v = viewFor(pts); ll = v.center; z = v.zoom; }
  if (z == null) z = 2.2;
  const latFix = Math.log2(Math.cos(rad(Math.min(Math.abs(ll[1]), 80))));
  z = isMobile() ? z - 1.1 : z; z += latFix; z = Math.max(z, isMobile() ? -0.5 : 0.6);
  S.flying = true; map.flyTo({ center: ll, zoom: z, duration: reduceMotion ? 0 : 4200, curve: 1.2, essential: true }); map.once('moveend', () => { S.flying = false; });
}
function viewFor(points) {
  const s = [0, 0, 0]; for (const p of points) { const v = toVec(...p); s[0] += v[0]; s[1] += v[1]; s[2] += v[2]; }
  const c = Math.hypot(...s) < 1e-6 ? points[0] : toLonLat(s);
  let spread = 0; for (const p of points) { const a = toVec(...p), b = toVec(...c); spread = Math.max(spread, deg(Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])))); }
  return { center: c, zoom: spread > 100 ? 0.5 : spread > 70 ? 0.8 : spread > 45 ? 1.3 : spread > 25 ? 1.9 : spread > 12 ? 2.5 : 3.2 };
}
$('detailClose').onclick = () => { $('detail').hidden = true; S.sel = null; map.getSource('sel').setData(fc([])); history.replaceState(null, '', location.pathname); };

const consent = '<p class="consent">Introductions will come later, and only with everyone\'s consent. Nobody here has been contacted.</p>';
function badge(k) { const c = k === 'link' ? LINK : P[k].colour; return `<span class="badge" style="color:${c}">${k === 'link' ? ICON.link() : ICON[k](c).replace('class="ico"', 'width="18" height="18"')}${esc(k === 'link' ? 'Gold thread · where two layers meet' : P[k].n + ' · ' + P[k].name)}</span>`; }
function relatedLinks(id) {
  const ls = S.links.filter(l => l.ok && (l.a === id || l.b === id)); if (!ls.length) return '';
  return `<h3>Where this meets another layer</h3>` + ls.map(l => { const other = S.byId.get(l.a === id ? l.b : l.a); return `<div class="thread"><span class="go" data-go="${esc(other.id)}" style="color:${P[other.key].colour}">${esc(other.title.slice(0, 120))}</span><br><small style="color:var(--mute)">${esc(l.why)}</small></div>`; }).join('');
}
function detailHTML(en) {
  const it = en.item, k = en.key;
  if (k === 'p1') return `${badge(k)}<h2>${esc(it.topic)}</h2><p class="meta">${esc(it.caption)}${it.terms?.length ? ' Shared ideas: ' + esc(it.terms.join(', ')) + '.' : ''}</p><h3>The independent efforts</h3><ul>${it.members.map(m => `<li><a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.title)}</a><small>${esc(m.sourceLabel)} · ${esc(m.dateLabel || '')} ${esc(fmtDate(m.date))}<br>${esc(m.by || '')}${m.by ? ' · ' : ''}${esc(placeLabel(m.place))}</small></li>`).join('')}</ul>${relatedLinks(it.id)}<p class="src">No shared authors or owners; dates are publication or creation dates, not when work began. From the weekly sweep of <a href="https://mhccog.github.io/not-the-only-one/" target="_blank" rel="noopener">You're not the only one</a>.</p>${consent}`;
  if (k === 'p2') {
    const out = (S.p2pairs || []).filter(p => p.from === it.id), inn = (S.p2pairs || []).filter(p => p.to === it.id);
    const pairHTML = (p, other, label) => `<div class="thread" style="border-color:${P.p2.colour}"><small style="color:var(--mute)">${label}</small><br><span class="go" data-go="${esc(other.id)}">${esc(other.title)}</span><small style="color:var(--mute)"> · ${esc(other.place)}, ${esc(year(other.start))}${p.terms?.length ? ' · shared: ' + esc(p.terms.join(', ')) : ''}</small></div>`;
    return `${badge(k)}<h2>${esc(it.title)}</h2><p class="meta">${esc(it.place)}${it.start ? ' · ' + esc(fmtDate(it.start)) : ''}${it.end ? ' to ' + esc(fmtDate(it.end)) : it.ongoing ? ' · ongoing' : ''}</p>
    ${it.problem ? `<h3>The problem</h3><p>${esc(it.problem)}</p>` : `<p>${esc(it.desc)}</p>`}
    ${it.outcome ? `<h3>What happened</h3><p>${esc(it.outcome)}</p>` : '<p class="gap">No outcomes are written up for this case yet.</p>'}
    ${it.lesson ? `<h3>Lessons noted</h3><p>${esc(it.lesson)}</p>` : ''}
    ${it.methods?.length ? `<p class="meta">Methods: ${esc(it.methods.join(', '))}</p>` : ''}
    ${out.length || inn.length ? '<h3>The same problem, elsewhere</h3>' : ''}${out.map(p => pairHTML(p, S.p2by.get(p.to), 'Met earlier, and written up, in')).join('')}${inn.slice(0, 4).map(p => pairHTML(p, S.p2by.get(p.from), 'Later faced again in')).join('')}
    ${relatedLinks(it.id)}<p class="src">Case from <a href="${esc(it.url)}" target="_blank" rel="noopener">Participedia</a>, written by its contributors (CC BY-NC-SA 3.0). Pairs are matched by shared words, a suggestion rather than proof that one copied or solved the other.</p>${consent}`;
  }
  if (k === 'p3') return `${badge(k)}<h2>${esc(it.title)}</h2><p class="meta">★ ${n(it.stars)} people valued it · ${n(it.forks)} copies · ${esc(it.lang || '')}</p><h3>What it set out to solve</h3><p>${esc(it.desc)}</p>${it.topics?.length ? `<p class="meta">${esc(it.topics.join(' · '))}</p>` : ''}<h3>When it stopped</h3><p>Started ${esc(fmtDate(it.created))}. Last code ${esc(fmtDate(it.stopped))} (${esc(ago(it.stopped))}). Archived by its owner, so it is read-only now${it.licence && it.licence !== 'NOASSERTION' ? `; its ${esc(it.licence)} licence lets anyone carry it on` : '; no clear licence, so carrying it on means asking first'}.</p><h3>Where</h3><p>${it.place ? esc(it.place.label) + (it.place.precision === 'country' ? ' (country only)' : '') + `<small style="color:var(--mute)"> · from the owner's public profile: "${esc(it.where)}"</small>` : 'The owner lists no public location, so it is not drawn.'}</p>${it.convergesWith?.length ? `<h3>Wanted again</h3><p>People are working on the same problem right now: ${it.convergesWith.map(esc).join(', ')}.</p>` : ''}${relatedLinks(it.id)}<p class="src"><a href="${esc(it.url)}" target="_blank" rel="noopener">Open the repository on GitHub</a></p>${consent}`;
  if (k === 'p4') {
    const w = it.work || {}, parts = [['papers', 'papers'], ['repos', 'repositories'], ['hn', 'discussions']].filter(([x]) => w[x] != null).map(([x, l]) => `${n(w[x])} ${l}`);
    return `${badge(k)}<h2>${esc(it.title)}</h2><p class="meta">${esc(it.family)}${it.subfield ? ' · ' + esc(it.subfield) : ''}</p>${it.statement && it.statement !== it.title ? `<p>${esc(it.statement)}</p>` : ''}<h3>Who is working on it</h3><p>${it.neglect == null ? 'Not measured yet' : (it.neglect >= 0.8 ? 'Very quiet. ' : it.neglect >= 0.6 ? 'Quiet. ' : 'Busy. ') + (parts.length ? `In the last two years: ${parts.join(', ')}.` : '')}</p>${it.examples?.length ? `<ul>${it.examples.slice(0, 4).map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a><small>${esc(x.date || x.pushed || '')}</small></li>`).join('')}</ul>` : ''}<p class="meta">${esc(it.confidence || '')}</p>${relatedLinks(it.id)}<p class="src">Listed by <a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.sourceName)}</a>. From <a href="https://mhccog.github.io/stuck-on/" target="_blank" rel="noopener">Everything we're stuck on</a>. Drawn in the sky because a problem is not a place.</p>`;
  }
  if (k === 'p5') { const kind = S.p5kinds?.[it.kind] || {}; return `${badge(k)}<h2>${esc(it.name || kind.label)}</h2><p class="meta">${esc(kind.label)}${it.city ? ' · ' + esc(it.city) : ''}${it.operator ? ' · run by ' + esc(it.operator) : ''}</p><p>${esc(kind.blurb)}</p>${it.note ? `<h3>Notes on the map</h3><p>${esc(it.note)}</p>` : ''}${it.hours ? `<p class="meta">Hours: ${esc(it.hours)}</p>` : ''}<h3>The missing piece</h3><p class="gap">Nobody openly publishes what people nearby need, so we can show the offer but not yet who it would help.</p><p class="src">Mapped by volunteers on <a href="${esc(it.url)}" target="_blank" rel="noopener">OpenStreetMap</a> (© OpenStreetMap contributors, ODbL).</p>`; }
  if (k === 'link') { const a = S.byId.get(it.a), b = S.byId.get(it.b); return `${badge('link')}<h2>${esc(it.title)}</h2><p>${esc(it.why)}</p>${[a, b].map(x => `<div class="thread" style="border-color:${P[x.key].colour}"><small style="color:${P[x.key].colour}">${esc(P[x.key].name)}</small><br><span class="go" data-go="${esc(x.id)}">${esc(x.title.slice(0, 140))}</span></div>`).join('')}<p class="src">Matched by ${esc(it.method || 'shared words')}; a suggestion, not a claim that one solves the other.</p>${consent}`; }
  return '';
}

// ---------- search ----------
let qTimer;
$('q').addEventListener('input', () => { clearTimeout(qTimer); qTimer = setTimeout(runSearch, 160); });
$('q').addEventListener('focus', () => { if ($('q').value) runSearch(); });
document.addEventListener('click', (e) => { if (!e.target.closest('.find')) $('results').hidden = true; });
function runSearch() {
  const q = $('q').value.trim().toLowerCase(), el = $('results');
  if (q.length < 2) { el.hidden = true; return; }
  const words = q.split(/\s+/).filter(Boolean);
  const hits = { p1: [], p2: [], p3: [], p4: [], p5: [], link: [] };
  for (const r of S.index) if (words.every(w => r.hay.includes(w))) { const h = hits[r.key]; if (h.length < 8) h.push(r); h.total = (h.total || 0) + 1; }
  const order = ['link', 'p1', 'p2', 'p3', 'p4', 'p5'];
  let html = '';
  for (const k of order) { const h = hits[k]; if (!h.length) continue; const c = k === 'link' ? LINK : P[k].colour; html += `<li class="head" style="color:${c}">${esc(k === 'link' ? 'Gold threads' : P[k].name)} · ${n(h.total)}</li>` + h.map(r => `<li data-id="${esc(r.id)}">${k === 'link' ? ICON.link() : ICON[k](c).replace('class="ico"', 'width="16" height="16" style="flex:none;margin-top:2px"')}<span>${esc(r.title.slice(0, 110))}<small>${esc((r.sub || '').slice(0, 90))}</small></span></li>`).join(''); }
  el.innerHTML = html || `<li class="none">Nothing in the five layers matches “${esc(q)}” yet.</li>`;
  el.hidden = false;
  el.querySelectorAll('li[data-id]').forEach(li => li.onclick = () => { pauseDrift(); el.hidden = true; select(li.dataset.id, true); });
}

// ---------- drift ----------
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function driftCandidates(k) {
  const d = S.data;
  if (k === 'p1' && okMeta(d.p1)) return d.p1.topics.flatMap(t => t.convergences).map(c => c.id);
  if (k === 'p2' && okMeta(d.p2)) return (S.p2pairs || []).slice(0, 120).map(p => p.from);
  if (k === 'p3' && okMeta(d.p3)) return d.p3.items.filter(i => i.place && i.stars >= 150).map(i => i.id);
  if (k === 'p4') return S.stars.filter(s => s.quiet && s.p.title.length < 140).map(s => s.p.id);
  if (k === 'p5' && okMeta(d.p5)) return d.p5.items.filter(i => i.note || i.name).map(i => i.id);
  if (k === 'link') return S.links.filter(l => l.ok).map(l => l.id);
  return [];
}
function captionFor(en) {
  const it = en.item;
  switch (en.key) {
    case 'p1': return it.caption;
    case 'p2': { const p = (S.p2pairs || []).find(p => p.from === it.id); const b = p && S.p2by.get(p.to); return b ? `${it.place} faced this in ${year(it.start)}: “${it.title}”. ${b.place} had met it in ${year(b.start)}, and wrote up what happened.` : it.title; }
    case 'p3': return `${it.title} set out to solve this: “${it.desc}” ${n(it.stars)} people valued it. Its last code was ${ago(it.stopped)}.`;
    case 'p4': return `Still open: “${it.title}” Almost nobody is visibly working on it.`;
    case 'p5': { const kind = S.p5kinds?.[it.kind]; return `${it.name ? it.name + ', a ' + kind.label.toLowerCase() : 'A ' + kind.label.toLowerCase()}${it.city ? ' in ' + it.city : ''}. ${it.note ? '“' + it.note + '”' : kind.blurb}`; }
    case 'link': return it.why;
  }
}
function driftStep() {
  if (!S.drift) return;
  const order = ['p1', 'p2', 'p3', 'p4', 'p5', 'link'];
  let tries = 0, en = null;
  while (!en && tries++ < 6) { const k = order[S.driftStep++ % order.length]; if (!S.on[k]) continue; const c = driftCandidates(k); if (c.length) en = S.byId.get(pick(c)); }
  if (en) {
    const c = en.key === 'link' ? LINK : P[en.key].colour;
    const cap = $('caption'); cap.style.opacity = 0;
    setTimeout(() => { $('capKicker').innerHTML = `<span style="color:${c}">${esc(en.key === 'link' ? 'Gold thread · where two layers meet' : P[en.key].n + ' · ' + P[en.key].name)}</span>`; $('capMain').textContent = (captionFor(en) || '').slice(0, 260); cap.style.opacity = 1; }, 900);
    S.sel = en;
    const ll = en.key === 'link' ? linkGround(en.item) : locate(en);
    map.getSource('sel').setData(fc(ll ? [pt(ll[0], ll[1], { c })] : []));
    if (ll) flyTo(ll, en.key === 'p5' ? 3.4 : en.key === 'p1' ? null : 2.2, en); else if (en.key === 'p4') flyTo([map.getCenter().lng + 25, 12], isMobile() ? -0.4 : 0.35);
  }
  S.driftTimer = setTimeout(driftStep, reduceMotion ? 14000 : 11000);
}
function startDrift() { S.drift = true; $('driftBtn').setAttribute('aria-pressed', 'true'); $('driftLabel').textContent = 'Drifting through all five'; $('detail').hidden = true; clearTimeout(S.driftTimer); driftStep(); }
function pauseDrift() { if (!S.drift) return; S.drift = false; clearTimeout(S.driftTimer); $('driftBtn').setAttribute('aria-pressed', 'false'); $('driftLabel').textContent = 'Drift'; $('caption').style.opacity = 0; S.sel = null; }
$('driftBtn').onclick = () => S.drift ? pauseDrift() : startDrift();
