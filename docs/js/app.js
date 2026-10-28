// Common Thread: five quiet layers of real public data on one globe.
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth <= 760;
const london = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtStamp = (iso) => iso ? london.format(new Date(iso)) + ' London time' : 'unknown';
const fmtDate = (d) => d ? new Date(d.length === 10 ? d + 'T12:00:00Z' : d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const regionNames = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; } })();
const regionName = (c) => { try { return regionNames?.of(c) || c; } catch { return c; } };
const year = (d) => d ? d.slice(0, 4) : '';
const n = (x) => Number(x || 0).toLocaleString('en-GB');
const ago = (d) => { if (!d) return ''; const y = (Date.now() - new Date(d)) / 3.156e10; return y >= 1.5 ? `${Math.round(y)} years ago` : y >= 0.9 ? 'about a year ago' : `${Math.max(1, Math.round(y * 12))} months ago`; };

// ---------- the five pillars ----------
const P = {
  p1: { key: 'p1', n: 1, colour: '#b86e12', name: "You're not the only one", what: 'Independent teams, far apart, doing nearly the same work at the same time.', file: 'converging.json' },
  p2: { key: 'p2', n: 2, colour: '#23826a', name: 'Solved somewhere else', what: 'Fixes that worked somewhere: civic cases joined to an earlier answer abroad, and projects independent evaluators rated a success.', file: 'solved.json' },
  p3: { key: 'p3', n: 3, colour: '#6a52c2', name: "The world's unfinished work", what: 'Work that stopped short: archived open-source projects, and medical studies halted for money, staff or recruitment, not safety.', file: 'unfinished.json' },
  p4: { key: 'p4', n: 4, colour: '#3c6894', name: "Everything we're stuck on", what: 'Open problems, drawn in the air around the globe because they belong to no place. Quiet ones wear a halo.', file: 'stuck.json' },
  p5: { key: 'p5', n: 5, colour: '#c4523e', name: "Leftovers and missing pieces", what: 'What people have spare (solid boxes) and what UK food banks are short of (hollow). A coral line joins a surplus to a shortage nearby.', file: 'leftovers.json' },
};
const LINK = '#9a7414';
const ICON = {
  p1: (c) => `<svg viewBox="0 0 26 26" class="ico"><path d="M6 17 Q13 4 20 17" fill="none" stroke="${c}" stroke-width="1.3" opacity=".8"/><circle cx="6" cy="17" r="3.2" fill="${c}"/><circle cx="20" cy="17" r="3.2" fill="${c}"/></svg>`,
  p2: (c) => `<svg viewBox="0 0 26 26" class="ico"><path d="M7 19 L19 7" stroke="${c}" stroke-width="1.3" stroke-dasharray="2.2 2.4"/><path d="M19 3.5 L22.5 7 L19 10.5 L15.5 7Z" fill="${c}"/><path d="M7 15.5 L10.5 19 L7 22.5 L3.5 19Z" fill="none" stroke="${c}" stroke-width="1.3"/></svg>`,
  p3: (c) => `<svg viewBox="0 0 26 26" class="ico"><circle cx="13" cy="13" r="7.5" fill="none" stroke="${c}" stroke-width="1.6"/><circle cx="13" cy="13" r="11" fill="none" stroke="${c}" stroke-width=".8" opacity=".35"/></svg>`,
  p4: (c) => `<svg viewBox="0 0 26 26" class="ico"><path d="M13 3 L14.6 11.4 L23 13 L14.6 14.6 L13 23 L11.4 14.6 L3 13 L11.4 11.4Z" fill="${c}"/><circle cx="13" cy="13" r="9" fill="${c}" opacity=".12"/></svg>`,
  p2o: (c) => `<svg viewBox="0 0 12 12" width="11" height="11"><path d="M6 1 L11 6 L6 11 L1 6Z" fill="none" stroke="${c}" stroke-width="1.4"/></svg>`,
  p2f: (c) => `<svg viewBox="0 0 12 12" width="11" height="11"><path d="M6 1 L11 6 L6 11 L1 6Z" fill="${c}"/></svg>`,
  p3r: (c) => `<svg viewBox="0 0 12 12" width="11" height="11"><circle cx="6" cy="6" r="4.4" fill="none" stroke="${c}" stroke-width="1.4"/></svg>`,
  p3d: (c) => `<svg viewBox="0 0 12 12" width="11" height="11"><circle cx="6" cy="6" r="4.4" fill="none" stroke="${c}" stroke-width="1.4"/><circle cx="6" cy="6" r="1.6" fill="${c}"/></svg>`,
  p5f: (c) => `<svg viewBox="0 0 12 12" width="11" height="11"><rect x="1.5" y="1.5" width="9" height="9" rx="2" fill="none" stroke="${c}" stroke-width="1.4"/><rect x="4.3" y="4.3" width="3.4" height="3.4" fill="${c}"/></svg>`,
  p5o: (c) => `<svg viewBox="0 0 12 12" width="11" height="11"><rect x="1.5" y="1.5" width="9" height="9" rx="2" fill="none" stroke="${c}" stroke-width="1.4" stroke-dasharray="2.2 1.4"/></svg>`,
  p5: (c) => `<svg viewBox="0 0 26 26" class="ico"><rect x="7.5" y="7.5" width="11" height="11" rx="2.5" fill="none" stroke="${c}" stroke-width="1.6"/><rect x="10.5" y="10.5" width="5" height="5" rx="1" fill="${c}"/></svg>`,
  link: () => `<svg viewBox="0 0 26 12" width="26" height="12"><path d="M1 10 Q13 -2 25 10" fill="none" stroke="${LINK}" stroke-width="1.8"/></svg>`,
};

const S = {
  data: {}, status: {}, on: { p1: true, p2: true, p3: true, p4: true, p5: true, link: true },
  sub: { pp: true, wb: true, gh: true, ct: true, off: true, need: true }, commercialOnly: false, trust: null,
  byId: new Map(), index: [], links: [], stars: [], sel: null, drift: true, driftTimer: null, driftStep: 0,
  lastInteract: 0, flying: false, p1arcs: [], linkArcs: [], groundLinks: [],
};
window.__commonThread = S;
S.select = (id) => { pauseDrift(); select(id, true); };

// ---------- map ----------
const map = new maplibregl.Map({
  container: 'map',
  style: { version: 8, projection: { type: 'globe' }, glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf', sources: {}, layers: [] },
  center: [10, 22], zoom: isMobile() ? 0.05 : 1.05, attributionControl: false, maxPitch: 0, renderWorldCopies: false,
  canvasContextAttributes: { alpha: true, antialias: true },
});
S.map = map;
map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'Natural Earth · OpenAlex · GitHub · arXiv · Hacker News · Participedia (CC BY-NC-SA 3.0) · World Bank IEG (CC BY 4.0) · ClinicalTrials.gov (NLM) · Give Food (CC BY 4.0) · © OpenStreetMap contributors (ODbL) · Wikipedia · Open Problem Garden · Erdős problems · Gap Map · Photon' }), 'bottom-right');
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
  if (kind === 'diamondo') { g.lineWidth = 4.5; g.beginPath(); g.moveTo(24, 9); g.lineTo(39, 24); g.lineTo(24, 39); g.lineTo(9, 24); g.closePath(); g.stroke(); }
  if (kind === 'ringdot') { g.lineWidth = 4; g.beginPath(); g.arc(24, 24, 15, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(24, 24, 5, 0, Math.PI * 2); g.fill(); }
  if (kind === 'boxo') { g.lineWidth = 4.5; g.setLineDash([7, 4]); g.beginPath(); g.roundRect(9, 9, 30, 30, 6); g.stroke(); }
  return { width: s, height: s, data: new Uint8Array(g.getImageData(0, 0, s, s).data.buffer) };
}

map.on('load', async () => {
  const countries = await fetch('data/countries.geojson').then(r => r.json()).catch(() => fc([]));
  map.addSource('countries', { type: 'geojson', data: countries });
  // World view: simple Natural Earth shapes. Close up (zoom 4+): OpenFreeMap vector tiles (OpenStreetMap data), no key needed.
  map.addLayer({ id: 'ocean', type: 'background', paint: { 'background-color': ['interpolate', ['linear'], ['zoom'], 3.6, '#dde4e3', 4.4, '#f8f5ee'] } });
  map.addLayer({ id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': '#faf7f0', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 3.6, 1, 4.4, 0] } });
  map.addLayer({ id: 'borders', type: 'line', source: 'countries', maxzoom: 4.4, paint: { 'line-color': '#d2c9b8', 'line-width': 0.6 } });
  map.addSource('ofm', { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a>' });
  map.addLayer({ id: 'ofm-water', type: 'fill', source: 'ofm', 'source-layer': 'water', minzoom: 3.5, paint: { 'fill-color': '#dde4e3', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 3.6, 0, 4.4, 1] } });
  map.addLayer({ id: 'ofm-park', type: 'fill', source: 'ofm', 'source-layer': 'park', minzoom: 6, paint: { 'fill-color': '#eef0e2', 'fill-opacity': 0.7 } });
  map.addLayer({ id: 'ofm-roads', type: 'line', source: 'ofm', 'source-layer': 'transportation', minzoom: 6, filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]], paint: { 'line-color': '#e6dfd0', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 10, 1.6] } });
  map.addLayer({ id: 'ofm-bound', type: 'line', source: 'ofm', 'source-layer': 'boundary', minzoom: 4, filter: ['all', ['<=', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]], paint: { 'line-color': '#d6ccb9', 'line-width': ['match', ['get', 'admin_level'], 2, 0.8, 0.4], 'line-dasharray': [3, 2] } });
  map.addLayer({ id: 'ofm-place', type: 'symbol', source: 'ofm', 'source-layer': 'place', minzoom: 5, filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]], layout: { 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 9, 12.5], 'text-letter-spacing': 0.04, 'symbol-sort-key': ['get', 'rank'] }, paint: { 'text-color': '#8f8676', 'text-halo-color': '#f8f5ee', 'text-halo-width': 1.4 } });
  try { map.setSky({ 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.55, 4, 0.2, 7, 0], 'sky-color': '#f3eee4', 'horizon-color': '#efe8da', 'fog-color': '#efe8da' }); } catch { }
  map.addImage('diamond', iconImage('diamond', P.p2.colour), { pixelRatio: 2 });
  map.addImage('ring', iconImage('ring', P.p3.colour), { pixelRatio: 2 });
  map.addImage('box', iconImage('box', P.p5.colour), { pixelRatio: 2 });
  map.addImage('diamondo', iconImage('diamondo', P.p2.colour), { pixelRatio: 2 });
  map.addImage('ringdot', iconImage('ringdot', P.p3.colour), { pixelRatio: 2 });
  map.addImage('boxo', iconImage('boxo', P.p5.colour), { pixelRatio: 2 });
  for (const id of ['p5', 'p5m', 'p5n', 'p2t', 'p2', 'p3', 'p1t', 'p1s', 'p1', 'lk', 'lks', 'sel']) map.addSource(id, { type: 'geojson', data: fc([]) });
  const iconLayer = (id, img, size, op) => map.addLayer({ id, type: 'symbol', source: id, layout: { 'icon-image': img, 'icon-size': size, 'icon-allow-overlap': true, 'icon-ignore-placement': true, 'icon-pitch-alignment': 'map', 'icon-rotation-alignment': 'map' }, paint: { 'icon-opacity': op } });
  // 5: leftovers, small boxes, lowest
  iconLayer('p5', 'box', ['interpolate', ['linear'], ['zoom'], 0, 0.22, 4, 0.4, 8, 0.6], ['interpolate', ['linear'], ['zoom'], 0, 0.55, 5, 0.9]);
  map.addLayer({ id: 'p5m', type: 'line', source: 'p5m', layout: { 'line-cap': 'round' }, paint: { 'line-color': P.p5.colour, 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.8, 7, 2], 'line-opacity': 0.75, 'line-dasharray': [1.2, 1.6] } });
  map.addLayer({ id: 'p5m-sel', type: 'line', source: 'p5m', layout: { 'line-cap': 'round' }, filter: ['==', ['get', 'id'], ''], paint: { 'line-color': P.p5.colour, 'line-width': 3, 'line-opacity': 0.95 } });
  iconLayer('p5n', 'boxo', ['interpolate', ['linear'], ['zoom'], 0, 0.3, 4, 0.48, 8, 0.7], 0.95);
  // 2: solved, dashed mint threads and diamonds
  map.addLayer({ id: 'p2t', type: 'line', source: 'p2t', paint: { 'line-color': P.p2.colour, 'line-width': 1, 'line-opacity': ['interpolate', ['linear'], ['zoom'], 2.5, 0.45, 5, 0.15], 'line-dasharray': [2, 3] } });
  map.addLayer({ id: 'p2', type: 'symbol', source: 'p2', layout: { 'icon-image': ['case', ['get', 'nc'], 'diamondo', 'diamond'], 'icon-size': ['interpolate', ['linear'], ['zoom'], 0, 0.26, 5, 0.5], 'icon-allow-overlap': true, 'icon-ignore-placement': true, 'icon-pitch-alignment': 'map', 'icon-rotation-alignment': 'map' }, paint: { 'icon-opacity': ['case', ['get', 'paired'], 0.95, 0.62] } });
  // 3: unfinished work, rings sized by how many valued it
  map.addLayer({ id: 'p3', type: 'symbol', source: 'p3', layout: { 'icon-image': ['case', ['==', ['get', 'src'], 'ct'], 'ringdot', 'ring'], 'icon-size': ['interpolate', ['linear'], ['get', 'w'], 0, 0.22, 1, 0.62], 'icon-allow-overlap': true, 'icon-ignore-placement': true, 'icon-pitch-alignment': 'map', 'icon-rotation-alignment': 'map' }, paint: { 'icon-opacity': 0.85 } });
  // 1: converging teams, amber arcs with travelling sparks
  map.addLayer({ id: 'p1t-glow', type: 'line', source: 'p1t', layout: { 'line-cap': 'round' }, paint: { 'line-color': P.p1.colour, 'line-width': 5, 'line-blur': 5, 'line-opacity': 0.12 } });
  map.addLayer({ id: 'p1t', type: 'line', source: 'p1t', layout: { 'line-cap': 'round' }, paint: { 'line-color': P.p1.colour, 'line-width': 1, 'line-opacity': ['interpolate', ['linear'], ['zoom'], 2.5, 0.55, 5, 0.16] } });
  map.addLayer({ id: 'p1s', type: 'circle', source: 'p1s', paint: { 'circle-radius': 2.6, 'circle-blur': 0.8, 'circle-color': '#e0962e', 'circle-opacity': ['get', 'o'], 'circle-pitch-alignment': 'map' } });
  map.addLayer({ id: 'p1', type: 'circle', source: 'p1', paint: { 'circle-radius': 3.2, 'circle-color': P.p1.colour, 'circle-opacity': 0.95, 'circle-stroke-width': 4, 'circle-stroke-color': P.p1.colour, 'circle-stroke-opacity': 0.16, 'circle-pitch-alignment': 'map' } });
  // gold threads where layers meet
  map.addLayer({ id: 'lk-glow', type: 'line', source: 'lk', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#e8c66e', 'line-width': 8, 'line-blur': 7, 'line-opacity': 0.32 } });
  map.addLayer({ id: 'lk', type: 'line', source: 'lk', layout: { 'line-cap': 'round' }, paint: { 'line-color': LINK, 'line-width': 1.6, 'line-opacity': ['interpolate', ['linear'], ['zoom'], 2.5, 0.9, 5, 0.35] } });
  map.addLayer({ id: 'lks', type: 'circle', source: 'lks', paint: { 'circle-radius': 3, 'circle-blur': 0.7, 'circle-color': '#c8921a', 'circle-opacity': ['get', 'o'], 'circle-pitch-alignment': 'map' } });
  map.addLayer({ id: 'sel', type: 'circle', source: 'sel', paint: { 'circle-radius': 14, 'circle-color': 'transparent', 'circle-stroke-color': ['get', 'c'], 'circle-stroke-width': 1.2, 'circle-stroke-opacity': 0.9, 'circle-pitch-alignment': 'map' } });

  wirePointer();
  document.querySelectorAll('.maplibregl-ctrl-attrib').forEach(a => { a.classList.remove('maplibregl-compact-show'); a.removeAttribute('open'); });
  await loadAll();
  requestAnimationFrame(tick);
});

// ---------- data ----------
async function loadJSON(file) {
  try { const r = await fetch('data/' + file, { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
  catch (e) { return { __error: e.message }; }
}
// Which trust.json source each file belongs to; a FLAGGED source is not drawn at all.
const SRC_KEY = { 'converging.json': 'converging', 'solved.json': 'participedia', 'solved_wb.json': 'worldbank', 'unfinished.json': 'github', 'trials.json': 'trials', 'stuck.json': 'stuck', 'leftovers.json': 'osm', 'needs.json': 'givefood' };
const flagged = (file) => S.trust?.sources?.[SRC_KEY[file]]?.state === 'flagged';
async function loadTrusted(file) {
  const d = await loadJSON(file);
  if (!flagged(file)) return d;
  const t = S.trust.sources[SRC_KEY[file]];
  return { __error: `held back by today's check: ${t.reason}` };
}
async function loadAll() {
  S.trust = await loadJSON('trust.json'); if (S.trust?.__error) S.trust = null;
  const files = ['converging.json', 'solved.json', 'solved_wb.json', 'unfinished.json', 'trials.json', 'stuck.json', 'leftovers.json', 'needs.json'];
  const [d1, d2, d2b, d3, d3b, d4, d5, d5b, lk] = await Promise.all([...files.map(loadTrusted), loadJSON('links.json')]);
  S.data = { p1: d1, p2: d2, p2b: d2b, p3: d3, p3b: d3b, p4: d4, p5: d5, p5b: d5b };
  buildP1(d1); buildP2(d2, d2b); buildP3(d3, d3b); buildP4(d4); buildP5(d5, d5b);
  buildLinks(lk);
  renderLegend(); renderIntro(); renderTrustDot();
  if (!localStorage.getItem('ct-intro')) { $('intro').showModal(); $('intro').addEventListener('close', () => { localStorage.setItem('ct-intro', '1'); startDrift(); }, { once: true }); }
  else startDrift();
  const hash = decodeURIComponent(location.hash.slice(1)); if (hash && S.byId.has(hash)) { pauseDrift(); select(hash, true); }
}
const okMeta = (d) => d && !d.__error && d.meta;
const londonDay = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short' });
function setStatus(k, d, count, short, long) {
  if (!okMeta(d)) { S.status[k] = { count: 0, warn: true, text: k === 'p4' ? 'Arriving soon: this layer has not published yet.' : `Unavailable right now (${d?.__error || 'no data'}).`, long: '' }; return; }
  const m = d.meta, st = m.status || {};
  S.status[k] = { count, warn: st.ok === false, text: (st.ok === false && st.note ? st.note + ' ' : '') + (short || '') + ` · updated ${londonDay.format(new Date(m.generated))}`, long: (long || '') + ` Updated ${fmtStamp(m.generated)}.` };
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
  setStatus('p1', d, total, `${n(total)} convergences across ${d.topics.length} problems`, `Weekly sweep of ${d.topics.length} problems; last sweep ${fmtStamp(d.meta.sweptAt)}.`);
}

function buildP2(d, wb) {
  const pp = okMeta(d) ? d.items.map(i => Object.assign(i, { src: 'pp', nc: true, licence: 'CC BY-NC-SA 3.0' })) : [];
  const wbi = okMeta(wb) ? wb.items : [];
  if (!pp.length && !wbi.length) return setStatus('p2', d, 0);
  const items = pp.concat(wbi);
  const byId = new Map(items.map(i => [i.id, i]));
  const pairs = okMeta(d) ? d.pairs : [];
  const paired = new Set(); pairs.forEach(p => { paired.add(p.from); paired.add(p.to); });
  S.p2pairs = pairs; S.p2by = byId; S.p2items = items;
  map.getSource('p2').setData(fc(items.map(i => pt(i.lon, i.lat, { id: i.id, src: i.src, nc: !!i.nc, paired: paired.has(i.id) }))));
  const lines = [];
  for (const p of pairs) { const a = byId.get(p.from), b = byId.get(p.to); if (!a || !b) continue; const segs = arc([a.lon, a.lat], [b.lon, b.lat], 64); if (segs) segs.forEach(s => lines.push({ type: 'Feature', properties: { id: p.from, src: 'pp' }, geometry: { type: 'LineString', coordinates: s } })); }
  map.getSource('p2t').setData(fc(lines));
  for (const i of pp) addIndex('p2', i.id, i.title, `${i.place}${i.start ? ' · ' + year(i.start) : ''} · Participedia`, [i.desc, i.problem, i.topics.join(' '), i.issues.join(' ')].join(' '), i);
  for (const i of wbi) addIndex('p2', i.id, i.title, `${i.place} · World Bank, rated ${i.rating}`, [i.desc, i.practice, i.region].join(' '), i);
  S.p2counts = { pp: pp.length, wb: wbi.length };
  const m = okMeta(d) ? d : wb;
  setStatus('p2', m, items.length, `${n(pp.length)} civic cases · ${n(wbi.length)} rated projects`, `${n(pp.length)} civic cases from Participedia (non-commercial licence), ${n(pairs.length)} joined to an earlier answer abroad; ${n(wbi.length)} World Bank projects rated Satisfactory or better by independent evaluators (CC BY 4.0).`);
  if (!okMeta(wb)) S.status.p2.text = 'World Bank part unavailable. ' + S.status.p2.text;
}

function buildP3(d, tr) {
  const gh = okMeta(d) ? d.items.map(i => Object.assign(i, { src: 'gh' })) : [];
  const ct = okMeta(tr) ? tr.items : [];
  if (!gh.length && !ct.length) return setStatus('p3', d, 0);
  const placed = gh.filter(i => i.place);
  const maxL = Math.log10(Math.max(...placed.map(i => i.stars), 10));
  const feats = placed.map(i => pt(i.place.lon + jitter(i.id, 0.25), i.place.lat + jitter(i.id + 'y', 0.25), { id: i.id, src: 'gh', w: Math.min(1, Math.log10(i.stars) / maxL) }));
  for (const i of ct) feats.push(pt(i.place.lon + jitter(i.id, 0.06), i.place.lat + jitter(i.id + 'y', 0.06), { id: i.id, src: 'ct', w: Math.min(0.75, 0.2 + Math.log10((i.enrolled || 0) + 10) / 6) }));
  map.getSource('p3').setData(fc(feats));
  for (const i of gh) addIndex('p3', i.id, i.title, `${i.desc}`, `${i.topics.join(' ')} ${i.themes.join(' ')} ${i.where || ''} github`, i);
  for (const i of ct) addIndex('p3', i.id, i.title, `${i.reason} · ${i.place.label}`, `${i.conditions.join(' ')} ${i.sponsor || ''} ${i.why} clinical trial study`, i);
  S.p3counts = { gh: gh.length, ct: ct.length };
  setStatus('p3', okMeta(d) ? d : tr, gh.length + ct.length, `${n(gh.length)} projects · ${n(ct.length)} stopped studies`, `${n(gh.length)} archived GitHub repositories on real-world topics (${n(placed.length)} drawn at the owner's public location); ${n(ct.length)} clinical studies that stopped for practical reasons in the last three years, drawn at their first listed site.`);
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
  setStatus('p4', d, d.problems.length, `${n(quiet)} glow, almost untouched`, `${n(d.problems.length)} open problems; ${n(quiet)} have almost no visible work in two years.`);
}

const PL5 = { give_box: 'give boxes', food_sharing: 'community fridges', freeshop: 'free shops', tool_library: 'tool libraries', repair_cafe: 'repair cafés', library_of_things: 'libraries of things', seed_library: 'seed libraries' };
function buildP5(d, nd) {
  const offers = okMeta(d) ? d.items.map(i => Object.assign(i, { src: 'osm' })) : [];
  const needs = okMeta(nd) ? nd.items : [];
  if (!offers.length && !needs.length) return setStatus('p5', d, 0);
  S.p5kinds = okMeta(d) ? d.meta.kinds : {};
  map.getSource('p5').setData(fc(offers.map(i => pt(i.lon, i.lat, { id: i.id }))));
  map.getSource('p5n').setData(fc(needs.map(i => pt(i.lon, i.lat, { id: i.id }))));
  const by = new Map(needs.map(i => [i.id, i]));
  S.p5matches = okMeta(nd) ? nd.matches : []; S.p5by = by;
  const lines = [];
  for (const m of S.p5matches) { const a = by.get(m.from), b = by.get(m.to); if (!a || !b) continue; const segs = arc([a.lon, a.lat], [b.lon, b.lat], 24); if (segs) segs.forEach(s => lines.push({ type: 'Feature', properties: { id: 'm:' + m.from + '>' + m.to }, geometry: { type: 'LineString', coordinates: s } })); }
  map.getSource('p5m').setData(fc(lines));
  for (const m of S.p5matches) { const a = by.get(m.from), b = by.get(m.to); if (a && b) S.byId.set('m:' + m.from + '>' + m.to, { key: 'p5', id: 'm:' + m.from + '>' + m.to, title: `${a.name} → ${b.name}`, sub: 'A surplus meets a shortage', item: { match: m, a, b } }); }
  for (const i of offers) addIndex('p5', i.id, i.name || S.p5kinds[i.kind]?.label || 'Unnamed', `${S.p5kinds[i.kind]?.label || i.kind}${i.city ? ' · ' + i.city : ''}`, (i.note || '') + ' ' + i.kind.replace(/_/g, ' '), i);
  for (const i of needs) addIndex('p5', i.id, i.name, `Food bank · short of ${i.needs.slice(0, 3).join(', ')}`, `${i.needs.join(' ')} ${i.excess.join(' ')} ${i.district || ''} food bank need`, i);
  const c = okMeta(d) ? d.meta.counts || {} : {};
  S.p5counts = { off: offers.length, need: needs.length, match: S.p5matches.length };
  setStatus('p5', okMeta(d) ? d : nd, offers.length + needs.length, `${n(offers.length)} offers · ${n(needs.length)} needs · ${n(S.p5matches.length)} matches`,
    Object.entries(c).filter(([, v]) => v).map(([k, v]) => `${n(v)} ${v === 1 ? (S.p5kinds[k]?.label || k).toLowerCase() : PL5[k] || k}`).join(', ') + ` from OpenStreetMap. Needs: ${n(needs.length)} UK food banks with a current shopping list (Give Food), ${n(S.p5matches.length)} pairs where one has too much of what a neighbour within ${okMeta(nd) ? nd.meta.matchKm : 40} km is short of. Needs elsewhere in the world are not openly published.`);
}

function buildLinks(d) {
  S.links = (d && !d.__error && d.links) || [];
  S.linkMeta = d && !d.__error ? d.meta : null;
  for (const l of S.links) { l.ok = !!(anchor(l.a) && anchor(l.b)); if (l.ok) addIndex('link', l.id, l.title, 'Where two layers meet', l.why, l); }
  buildLinkGeometry();
}
function buildLinkGeometry() {
  const lines = []; S.linkArcs = []; S.groundLinks = [];
  for (const l of S.links) {
    if (!l.ok || !linkVisible(l)) continue;
    const a = anchor(l.a), b = anchor(l.b);
    if (a.ground && b.ground) {
      const segs = arc(a.ll, b.ll);
      if (segs) { segs.forEach(s => lines.push({ type: 'Feature', properties: { id: l.id }, geometry: { type: 'LineString', coordinates: s } })); S.linkArcs.push(segs.flat()); }
    } else S.groundLinks.push({ l, a, b });
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
  if (e.key === 'p5' && it.match) return [it.b.lon, it.b.lat];
  if (e.key === 'p2' || e.key === 'p5') return [it.lon, it.lat];
  if (e.key === 'p3') return it.place && (it.src === 'ct' ? [it.place.lon + jitter(it.id, 0.06), it.place.lat + jitter(it.id + 'y', 0.06)] : [it.place.lon + jitter(it.id, 0.25), it.place.lat + jitter(it.id + 'y', 0.25)]);
  if (e.key === 'link') return null;
  return null;
}

// ---------- legend / intro ----------
const SUBS = {
  p2: [['pp', 'Participedia', 'p2o', true], ['wb', 'World Bank, rated', 'p2f', false]],
  p3: [['gh', 'Open-source projects', 'p3r'], ['ct', 'Stopped studies', 'p3d']],
  p5: [['off', 'Spare (offers)', 'p5f'], ['need', 'Short of (needs)', 'p5o']],
};
const SUBCOUNT = (k, s) => ({ pp: S.p2counts?.pp, wb: S.p2counts?.wb, gh: S.p3counts?.gh, ct: S.p3counts?.ct, off: S.p5counts?.off, need: S.p5counts?.need })[s];
function renderLegend() {
  const el = $('legend');
  el.innerHTML = ['p1', 'p2', 'p3', 'p4', 'p5'].map(k => {
    const p = P[k], st = S.status[k] || {};
    const subs = SUBS[k] ? `<div class="subs">${SUBS[k].map(([s, label, ic, nc]) => `<span class="chip ${S.sub[s] && !(nc && S.commercialOnly) ? '' : 'off'}" data-sub="${s}" role="button" tabindex="0" title="${nc ? 'Non-commercial licence (CC BY-NC-SA 3.0). ' : ''}Show or hide">${ICON[ic](p.colour)}${esc(label)} ${SUBCOUNT(k, s) != null ? '<span style="color:var(--mute)">' + n(SUBCOUNT(k, s)) + '</span>' : ''}${nc ? '<span class="nc">NC</span>' : ''}</span>`).join('')}</div>` : '';
    return `<button class="layer ${S.on[k] ? '' : 'off'}" data-k="${k}" aria-pressed="${S.on[k]}" title="${esc((st.long || '').trim())} Click to show or hide; hover to see it alone.">
      ${ICON[k](p.colour)}<span class="name" style="color:${p.colour}">${esc(p.name)}</span><span class="num">${st.count ? n(st.count) : '–'}</span>
      <span class="what">${esc(p.what)}</span><span class="state ${st.warn ? 'warn' : ''}">${esc(st.text || '')}</span></button>${subs}`;
  }).join('') + `<button class="linkrow ${S.on.link ? '' : 'off'}" data-k="link">${ICON.link()}<span><span style="color:${LINK};font-weight:600">Common threads</span>: ${n(S.links.filter(l => l.ok && linkVisible(l)).length)} places where two layers genuinely meet</span></button>
  <button class="commrow" id="commBtn" aria-pressed="${S.commercialOnly}" title="Hide sources whose licence forbids commercial use (Participedia, CC BY-NC-SA)."><span class="switch"></span><span>Commercial-safe data only</span></button>`;
  el.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => toggle(b.dataset.k); if (!isMobile()) { b.onmouseenter = () => solo(b.dataset.k); b.onmouseleave = () => solo(null); } });
  el.querySelectorAll('[data-sub]').forEach(c => { c.onclick = (e) => { e.stopPropagation(); S.sub[c.dataset.sub] = !S.sub[c.dataset.sub]; applyFilters(); renderLegend(); }; c.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); } }; });
  $('commBtn').onclick = () => { S.commercialOnly = !S.commercialOnly; applyFilters(); renderLegend(); toast(S.commercialOnly ? 'Showing only data you may reuse commercially' : 'Showing all sources'); };
}
function allowed(src) { if (src === 'pp' && S.commercialOnly) return false; return S.sub[src] !== false; }
function srcOf(id) { const e = S.byId.get(id); if (!e) return null; return e.item?.src || (e.key === 'p5' ? 'off' : null); }
function linkVisible(l) { return [l.a, l.b].every(r => { const s = srcOf(r); return !s || allowed(s === 'osm' ? 'off' : s === 'gf' ? 'need' : s); }); }
function applyFilters() {
  const p2 = ['pp', 'wb'].filter(allowed), p3 = ['gh', 'ct'].filter(allowed);
  map.setFilter('p2', ['in', ['get', 'src'], ['literal', p2]]);
  map.setFilter('p2t', ['in', ['get', 'src'], ['literal', p2]]);
  map.setFilter('p3', ['in', ['get', 'src'], ['literal', p3]]);
  solo(S.solo || null);
  buildLinkGeometry();
}
function renderIntro() {
  $('introFive').innerHTML = ['p1', 'p2', 'p3', 'p4', 'p5'].map(k => `<li>${ICON[k](P[k].colour)}<div><b style="color:${P[k].colour}">${esc(P[k].name)}</b><span>${esc(P[k].what)}</span></div></li>`).join('');
}
$('aboutBtn').onclick = () => $('intro').showModal();
function openTrust() { renderTrust(); $('trust').showModal(); requestAnimationFrame(() => { $('trust').scrollTop = 0; }); }
$('trustBtn').onclick = openTrust;
$('intro').addEventListener('close', () => { if ($('intro').returnValue === 'trust') openTrust(); });
const LAYERS = { p1: ['p1', 'p1t', 'p1t-glow', 'p1s'], p2: ['p2', 'p2t'], p3: ['p3'], p4: [], p5: ['p5', 'p5n', 'p5m', 'p5m-sel'], link: ['lk', 'lk-glow', 'lks'] };
function layerOn(key, id) {
  if (!S.on[key]) return false;
  if (id === 'p5') return S.sub.off;
  if (id === 'p5n') return S.sub.need;
  if (id === 'p5m' || id === 'p5m-sel') return S.sub.need;
  return true;
}
function solo(k) {
  S.solo = k;
  for (const [key, ids] of Object.entries(LAYERS)) ids.forEach(id => map.setLayoutProperty(id, 'visibility', layerOn(key, id) && (!k || k === key) ? 'visible' : 'none'));
}
function toggle(k) { S.on[k] = !S.on[k]; solo(S.solo || null); renderLegend(); }

// ---------- trust ----------
const TRUSTWORD = { high: 'High trust', medium: 'Medium trust', mixed: 'Mixed trust', low: 'Low trust' };
const STATEWORD = { ok: 'Checked today', warn: 'Checked today, with a caveat', flagged: 'Held back today' };
function srcKeyFor(en) {
  const it = en.item, k = en.key;
  if (k === 'p1') return 'converging';
  if (k === 'p2') return it.src === 'wb' ? 'worldbank' : 'participedia';
  if (k === 'p3') return it.src === 'ct' ? 'trials' : 'github';
  if (k === 'p4') return 'stuck';
  if (k === 'p5') return it.src === 'gf' || it.match ? 'givefood' : 'osm';
  return null;
}
function trustBar(en, url, fresh) {
  const t = S.trust?.sources?.[srcKeyFor(en)]; if (!t) return url ? `<div class="trustbar"><a class="orig" href="${esc(url)}" target="_blank" rel="noopener">Open the original record ↗</a></div>` : '';
  let level = t.trust;
  if (en.key === 'p4' && en.item.source === 'openalex') level = 'low';
  if (en.key === 'p4' && en.item.source !== 'openalex') level = 'high';
  return `<div class="trustbar"><span class="t" title="${esc(t.caveats)}"><span class="dotq ${level}"></span>${esc(TRUSTWORD[level] || level)}${en.key === 'p4' ? (en.item.source === 'openalex' ? ' · pulled from a paper abstract automatically' : ' · from a curated list') : ''}</span>
    <span class="t">${esc(t.licence)}</span><span class="t"><span class="dotq ${t.state}"></span>${esc(fresh || ('Updated ' + fmtStamp(t.generated)))}</span>
    ${url ? `<a class="orig" href="${esc(url)}" target="_blank" rel="noopener">Open the original record ↗</a>` : ''}</div>
    <div class="actions"><button data-copy>Copy link to this</button><button data-trust>About this source</button></div>`;
}
function renderTrustDot() {
  const st = Object.values(S.trust?.sources || {}).map(s => s.state);
  $('trustDot').className = 'dotq ' + (!st.length ? 'warn' : st.includes('flagged') ? 'flagged' : st.includes('warn') ? 'warn' : 'ok');
}
function renderTrust() {
  const T = S.trust; if (!T) { $('trustBody').innerHTML = '<p>The trust check has not published yet.</p>'; return; }
  const rows = Object.entries(T.sources).map(([k, t]) => `<tr><td><span class="lay" style="background:${P[t.layer]?.colour}"></span><b>${esc(t.name)}</b><small>${esc(P[t.layer]?.name || '')}</small></td>
    <td>${esc(t.publisher)}<small>${esc(t.type)}</small></td><td>${esc(t.licence)}${t.commercial === false ? '<small style="color:var(--warn)">Not for commercial use</small>' : t.commercial ? '<small>Commercial use allowed, with attribution</small>' : ''}</td>
    <td><span class="dotq ${t.trust}"></span> ${esc(TRUSTWORD[t.trust] || t.trust)}<small>${esc(t.caveats)}</small></td>
    <td><span class="dotq ${t.state}"></span> ${esc(STATEWORD[t.state] || t.state)}<small>${t.reason ? esc(t.reason) + ' ' : ''}${t.records != null ? n(t.records) + ' records · ' + t.spot.matched + '/' + t.spot.checked + ' spot checks matched · ' : ''}${esc(t.updates)}${t.generated ? ' · refreshed ' + esc(fmtStamp(t.generated)) : ''}</small></td></tr>`).join('');
  const spots = (T.spotChecks || []).map(c => `<li>${c.ok ? '✓' : '✗'} <a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title.slice(0, 80))}</a> <span style="color:var(--mute)">· ${esc(T.sources[c.source]?.name || c.source)}</span></li>`).join('');
  $('trustBody').innerHTML = `<table><thead><tr><th>Source</th><th>Publisher</th><th>Licence</th><th>Trust</th><th>Today's check</th></tr></thead><tbody>${rows}</tbody></table>
    <h3>How the check works</h3><p class="small">Every day, after the data refresh, each file is validated (links, coordinates, required fields), its age is compared with how often the source changes, and a few records chosen at random are re-read from the original publisher. A source that is out of date, malformed, or no longer matches its originals is <b>held back</b>: the page hides it rather than show something wrong. Last check: ${esc(fmtStamp(T.meta.generated))}.</p>
    <h3>Today's spot checks</h3><ul class="spots">${spots}</ul>
    <p class="small">Matches between records (pairs, coral lines, gold threads) are suggestions from shared words, shared item names or distance, never claims. "Commercial-safe data only" in the legend hides the one source whose licence forbids commercial use.</p>`;
}
function toast(msg) { let t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.textContent = msg; t.style.opacity = 1; clearTimeout(t._h); t._h = setTimeout(() => { t.style.opacity = 0; }, 2400); }

// ---------- near me ----------
$('nearBtn').onclick = () => {
  if (!navigator.geolocation) return toast('Location is not available in this browser');
  toast('Finding where you are…');
  navigator.geolocation.getCurrentPosition((pos) => {
    const ll = [pos.coords.longitude, pos.coords.latitude]; pauseDrift();
    const near = [];
    for (const e of S.byId.values()) { if (e.key === 'link' || e.key === 'p4' || e.item?.match) continue; const p = locate(e); if (!p) continue; const s = srcOf(e.id); if (s && !allowed(s === 'osm' ? 'off' : s === 'gf' ? 'need' : s)) continue; const d = kmBetween(ll, p); if (d < 400) near.push([d, e]); }
    near.sort((a, b) => a[0] - b[0]);
    map.getSource('sel').setData(fc([pt(ll[0], ll[1], { c: '#23211d' })]));
    S.flying = true; map.flyTo({ center: ll, zoom: isMobile() ? 4.6 : 5.6, duration: reduceMotion ? 0 : 3500 }); map.once('moveend', () => { S.flying = false; });
    $('detail').hidden = false;
    $('detailBody').innerHTML = `<span class="badge" style="color:var(--ink)">Near you</span><h2>What is around you</h2><p class="meta">Your location is used on this device only and never sent anywhere.</p>${near.length ? '<ul>' + near.slice(0, 14).map(([d, e]) => `<li><span class="go" data-go="${esc(e.id)}" style="color:${P[e.key].colour}">${esc(e.title.slice(0, 110))}</span><small>${esc(P[e.key].name)} · ${d < 1 ? '<1' : Math.round(d)} km</small></li>`).join('') + '</ul>' : '<p class="gap">Nothing from the five layers within 400 km yet.</p>'}`;
    $('detailBody').querySelectorAll('[data-go]').forEach(a => a.onclick = () => select(a.dataset.go, true));
  }, () => toast('Location was not shared, so nothing changed'), { timeout: 12000, maximumAge: 600000 });
};
function kmBetween(a, b) { const v = toVec(...a), w = toVec(...b); return 6371 * Math.acos(Math.min(1, v[0] * w[0] + v[1] * w[1] + v[2] * w[2])); }

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
    pts.push([lon, lat]);
  }
  // split at the antimeridian and near the poles instead of unwrapping (the globe draws unwrapped lines straight)
  const segs = []; let cur = [];
  for (const p of pts) {
    if (Math.abs(p[1]) > 84.8) { if (cur.length > 1) segs.push(cur); cur = []; continue; }
    if (cur.length && Math.abs(p[0] - cur[cur.length - 1][0]) > 180) { if (cur.length > 1) segs.push(cur); cur = []; }
    cur.push(p);
  }
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
  if (!Number.isFinite(g.cx + g.cy + g.r)) return;
  // faint far stars, purely decorative and labelled as such in the code: not data
  sg.fillStyle = 'rgba(60,104,148,0.07)';
  for (let i = 0; i < 90; i++) { const h = hash('bg' + i); sg.fillRect(h % innerWidth, (h >> 11) % innerHeight, 1.2, 1.2); }
  if (!S.on.p4 || !S.stars.length || (S.solo && S.solo !== 'p4')) return;
  const sel = S.sel?.id;
  sg.font = '10px -apple-system, Segoe UI, sans-serif'; sg.textAlign = 'center'; sg.fillStyle = 'rgba(60,104,148,0.45)'; sg.font = '600 9.5px -apple-system, Segoe UI, sans-serif';
  if (!isMobile()) for (const sec of S.sectors || []) { const [x, y] = starXY({ a: (sec.a0 + sec.a1) / 2, r: 2.04 }, g, t); if (x > 300 && x < innerWidth - 20 && y > 60 && y < innerHeight - 110) sg.fillText(sec.f.toUpperCase(), x, y); }
  for (const s of S.stars) {
    const [x, y] = starXY(s, g, t); s.x = x; s.y = y;
    if (!Number.isFinite(x + y)) { s.vis = false; continue; }
    if (x < -10 || y < -10 || x > innerWidth + 10 || y > innerHeight + 10) { s.vis = false; continue; }
    // hide stars that fall in front of the globe disc
    if (Math.hypot(x - g.cx, y - g.cy) < g.r * 1.02) { s.vis = false; continue; }
    s.vis = true;
    const tw = reduceMotion ? 1 : 0.75 + 0.25 * Math.sin(t / 1300 + s.tw);
    const weak = s.p.source === 'openalex' ? 0.5 : 1;
    if (s.p.neglect == null) { sg.strokeStyle = `rgba(60,104,148,${0.3 * weak})`; sg.lineWidth = 0.8; sg.beginPath(); sg.arc(x, y, 1.7, 0, 7); sg.stroke(); continue; }
    if (s.quiet) {
      sg.strokeStyle = `rgba(60,104,148,${0.28 * tw * weak})`; sg.lineWidth = 1; sg.beginPath(); sg.arc(x, y, 6.5, 0, 7); sg.stroke();
      const gr = sg.createRadialGradient(x, y, 0, x, y, 10); gr.addColorStop(0, `rgba(120,160,200,${0.28 * tw * weak})`); gr.addColorStop(1, 'rgba(120,160,200,0)');
      sg.fillStyle = gr; sg.fillRect(x - 10, y - 10, 20, 20);
      sg.fillStyle = `rgba(44,84,128,${0.85 * tw * weak})`; sparkle(sg, x, y, 3.4);
    } else { sg.fillStyle = `rgba(60,104,148,${(0.25 + 0.3 * (s.p.neglect || 0)) * weak})`; sg.beginPath(); sg.arc(x, y, 1.1, 0, 7); sg.fill(); }
    if (s.p.id === sel || (S.sel?.key === 'link' && (S.sel.item.a === s.p.id || S.sel.item.b === s.p.id))) { sg.strokeStyle = P.p4.colour; sg.lineWidth = 1; sg.beginPath(); sg.arc(x, y, 11, 0, 7); sg.stroke(); }
  }
}
function sparkle(g, x, y, r) { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.25, y - r * 0.25); g.lineTo(x + r, y); g.lineTo(x + r * 0.25, y + r * 0.25); g.lineTo(x, y + r); g.lineTo(x - r * 0.25, y + r * 0.25); g.lineTo(x - r, y); g.lineTo(x - r * 0.25, y - r * 0.25); g.closePath(); g.fill(); }
function drawOverlay(t) {
  og.clearRect(0, 0, innerWidth, innerHeight);
  if (!S.on.link || !S.on.p4 || (S.solo && S.solo !== 'link' && S.solo !== 'p4')) return;
  for (const { l, a, b } of S.groundLinks) {
    const star = (a.star || b.star), ground = a.ground ? a : b;
    if (!star?.vis || !ground?.ll || !facing(ground.ll)) continue;
    const p = map.project(ground.ll); const on = S.sel && (S.sel.id === l.id || S.sel.id === l.a || S.sel.id === l.b);
    const mx = (star.x + p.x) / 2, my = Math.min(star.y, p.y) - 40;
    og.strokeStyle = `rgba(154,116,20,${on ? 0.85 : 0.35})`; og.lineWidth = on ? 1.6 : 0.9;
    og.beginPath(); og.moveTo(star.x, star.y); og.quadraticCurveTo(mx, my, p.x, p.y); og.stroke();
    if (!reduceMotion) { const ph = ((t + hash(l.id) % 4000) % 4800) / 4800, u = 1 - ph; const x = u * u * star.x + 2 * u * ph * mx + ph * ph * p.x, y = u * u * star.y + 2 * u * ph * my + ph * ph * p.y; og.fillStyle = `rgba(200,146,26,${Math.sin(ph * Math.PI) * (on ? 0.95 : 0.6)})`; og.beginPath(); og.arc(x, y, on ? 2.4 : 1.6, 0, 7); og.fill(); }
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
const HIT = ['p1', 'p2', 'p3', 'p5n', 'p5'];
function hitAt(point) {
  const fs = map.queryRenderedFeatures([[point.x - 5, point.y - 5], [point.x + 5, point.y + 5]], { layers: HIT.filter(l => map.getLayer(l) && S.on[l.slice(0, 2)] && map.getLayoutProperty(l, 'visibility') !== 'none') });
  if (fs.length) return fs[0].properties.id;
  const ls = S.on.link ? map.queryRenderedFeatures([[point.x - 4, point.y - 4], [point.x + 4, point.y + 4]], { layers: ['lk'] }) : [];
  if (ls.length) return ls[0].properties.id;
  const pm = S.on.p5 && S.sub.need ? map.queryRenderedFeatures([[point.x - 3, point.y - 3], [point.x + 3, point.y + 3]], { layers: ['p5m'] }) : [];
  if (pm.length) return pm[0].properties.id;
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
    const c = en.key === 'link' ? LINK : P[en.key].colour, name = en.key === 'link' ? 'Common thread' : P[en.key].name;
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
  map.setFilter('p5m-sel', ['==', ['get', 'id'], en.item?.match ? id : '']);
  const ll = en.key === 'link' ? linkGround(en.item) : locate(en);
  map.getSource('sel').setData(fc(ll ? [pt(ll[0], ll[1], { c: en.key === 'link' ? LINK : P[en.key].colour })] : []));
  const touchesSky = en.key === 'link' && [en.item.a, en.item.b].some(r => S.byId.get(r)?.key === 'p4');
  if (fly && ll) flyTo(ll, touchesSky ? 1.0 : en.item?.match ? 6.9 : en.key === 'p5' ? 6.2 : en.key === 'p1' ? null : 2.6, touchesSky ? null : en);
  if (fly && en.key === 'p4') flyTo([map.getCenter().lng, 15], isMobile() ? -0.3 : 0.45);
  $('detail').hidden = false; $('detailBody').innerHTML = detailHTML(en); $('detail').scrollTop = 0;
  $('detailBody').querySelectorAll('[data-go]').forEach(a => a.onclick = () => { pauseDrift(); select(a.dataset.go, true); });
  wireDetailActions();
}
function wireDetailActions() {
  $('detailBody').querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(location.href); toast('Link copied'); } catch { toast(location.href); } });
  $('detailBody').querySelectorAll('[data-trust]').forEach(b => b.onclick = openTrust);
}
function linkGround(l) { for (const r of [l.a, l.b]) { const e = S.byId.get(r); const ll = e && locate(e); if (ll) return ll; } return null; }
function flyTo(ll, zoom, en) {
  let z = zoom;
  if (en?.key === 'p1') { const pts = en.item.members.filter(m => m.place).map(m => [m.place.lon, m.place.lat]); const v = viewFor(pts); ll = v.center; z = v.zoom; }
  if (z == null) z = 2.2;
  const latFix = Math.log2(Math.cos(rad(Math.min(Math.abs(ll[1]), 80))));
  z = isMobile() ? z - 1.1 : z; z += latFix; z = Math.max(z, isMobile() ? -0.5 : 0.95);
  const padding = isMobile() ? { top: 60, bottom: Math.round(innerHeight * 0.5), left: 0, right: 0 } : { top: 40, bottom: 60, left: 300, right: $('detail').hidden ? 40 : 430 };
  S.flying = true; map.flyTo({ center: ll, zoom: z, padding, duration: reduceMotion ? 0 : 4200, curve: 1.2, essential: true }); map.once('moveend', () => { S.flying = false; });
}
function viewFor(points) {
  const s = [0, 0, 0]; for (const p of points) { const v = toVec(...p); s[0] += v[0]; s[1] += v[1]; s[2] += v[2]; }
  const c = Math.hypot(...s) < 1e-6 ? points[0] : toLonLat(s);
  let spread = 0; for (const p of points) { const a = toVec(...p), b = toVec(...c); spread = Math.max(spread, deg(Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])))); }
  return { center: c, zoom: spread > 100 ? 0.5 : spread > 70 ? 0.8 : spread > 45 ? 1.3 : spread > 25 ? 1.9 : spread > 12 ? 2.5 : 3.2 };
}
$('detailClose').onclick = () => { $('detail').hidden = true; S.sel = null; map.getSource('sel').setData(fc([])); history.replaceState(null, '', location.pathname); };

const consent = '<p class="consent">Introductions will come later, and only with everyone\'s consent. Nobody here has been contacted.</p>';
function badge(k) { const c = k === 'link' ? LINK : P[k].colour; return `<span class="badge" style="color:${c}">${k === 'link' ? ICON.link() : ICON[k](c).replace('class="ico"', 'width="18" height="18"')}${esc(k === 'link' ? 'Common thread · where two layers meet' : P[k].n + ' · ' + P[k].name)}</span>`; }
function relatedLinks(id) {
  const ls = S.links.filter(l => l.ok && (l.a === id || l.b === id)); if (!ls.length) return '';
  return `<h3>Where this meets another layer</h3>` + ls.map(l => { const other = S.byId.get(l.a === id ? l.b : l.a); if (!other) return ''; return `<div class="thread"><span class="go" data-go="${esc(other.id)}" style="color:${P[other.key].colour}">${esc(other.title.slice(0, 120))}</span><br><small style="color:var(--mute)">${esc(l.why)}</small></div>`; }).join('');
}
function nearNeed(it) {
  const needs = S.data.p5b?.items || [];
  let best = null; for (const f of needs) { const d = kmBetween([it.lon, it.lat], [f.lon, f.lat]); if (!best || d < best[0]) best = [d, f]; }
  if (best && best[0] <= 15) return `<h3>A stated need nearby</h3><div class="thread" style="border-color:${P.p5.colour}"><span class="go" data-go="${esc(best[1].id)}">${esc(best[1].name)}</span><small style="color:var(--mute)"> · ${best[0].toFixed(1)} km · short of ${esc(best[1].needs.slice(0, 4).join(', '))}</small></div>`;
  return `<h3>The missing piece</h3><p class="gap">Needs are only openly published for UK food banks so far, and none is close to this one.</p>`;
}
function detailHTML(en) {
  const it = en.item, k = en.key;
  if (k === 'p1') return `${badge(k)}<h2>${esc(it.topic)}</h2><p class="meta">${esc(it.caption)}${it.terms?.length ? ' Shared ideas: ' + esc(it.terms.join(', ')) + '.' : ''}</p><h3>The independent efforts</h3><ul>${it.members.map(m => `<li><a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.title)}</a><small>${esc(m.sourceLabel)} · ${esc(m.dateLabel || '')} ${esc(fmtDate(m.date))}<br>${esc(m.by || '')}${m.by ? ' · ' : ''}${esc(placeLabel(m.place))}</small></li>`).join('')}</ul>${relatedLinks(it.id)}<p class="src">No shared authors or owners; dates are publication or creation dates, not when work began. From the weekly sweep of <a href="https://mhccog.github.io/not-the-only-one/" target="_blank" rel="noopener">You're not the only one</a>.</p>${trustBar(en, null, 'Swept ' + fmtStamp(S.data.p1?.meta?.sweptAt))}${consent}`;
  if (k === 'p2' && it.src === 'wb') return `${badge(k)}<h2>${esc(it.title)}</h2><p class="meta">${esc(it.place)} (country level) · approved ${esc(fmtDate(it.start))}${it.end ? ' · closed ' + esc(year(it.end)) : ''}${it.practice ? ' · ' + esc(it.practice) : ''}</p>
    <h3>What it set out to do</h3><p>${esc(it.desc)}</p><h3>How it turned out</h3><p>${esc(it.outcome)}</p>
    <p class="meta">An IEG rating judges whether the project reached its own stated objectives, efficiently. It is not a measure of wider impact.</p>${relatedLinks(it.id)}
    ${trustBar(en, it.url, 'Ratings as of ' + (S.data.p2b?.meta?.sourceAsOf || '?'))}<p class="src">Rating: Independent Evaluation Group, World Bank Project Performance Ratings (CC BY 4.0). Description: World Bank Projects API (CC BY 4.0). No endorsement by the World Bank is implied.</p>${consent}`;
  if (k === 'p2') {
    const out = (S.p2pairs || []).filter(p => p.from === it.id), inn = (S.p2pairs || []).filter(p => p.to === it.id);
    const pairHTML = (p, other, label) => `<div class="thread" style="border-color:${P.p2.colour}"><small style="color:var(--mute)">${label}</small><br><span class="go" data-go="${esc(other.id)}">${esc(other.title)}</span><small style="color:var(--mute)"> · ${esc(other.place)}, ${esc(year(other.start))}${p.terms?.length ? ' · shared: ' + esc(p.terms.join(', ')) : ''}</small></div>`;
    return `${badge(k)}<h2>${esc(it.title)}</h2><p class="meta">${esc(it.place)}${it.start ? ' · ' + esc(fmtDate(it.start)) : ''}${it.end ? ' to ' + esc(fmtDate(it.end)) : it.ongoing ? ' · ongoing' : ''}</p>
    ${it.problem ? `<h3>The problem</h3><p>${esc(it.problem)}</p>` : `<p>${esc(it.desc)}</p>`}
    ${it.outcome ? `<h3>What happened</h3><p>${esc(it.outcome)}</p>` : '<p class="gap">No outcomes are written up for this case yet.</p>'}
    ${it.lesson ? `<h3>Lessons noted</h3><p>${esc(it.lesson)}</p>` : ''}
    ${it.methods?.length ? `<p class="meta">Methods: ${esc(it.methods.join(', '))}</p>` : ''}
    ${out.length || inn.length ? '<h3>The same problem, elsewhere</h3>' : ''}${out.map(p => pairHTML(p, S.p2by.get(p.to), 'Met earlier, and written up, in')).join('')}${inn.slice(0, 4).map(p => pairHTML(p, S.p2by.get(p.from), 'Later faced again in')).join('')}
    ${relatedLinks(it.id)}<p class="src">Case from <a href="${esc(it.url)}" target="_blank" rel="noopener">Participedia</a>, written by its contributors (CC BY-NC-SA 3.0). Pairs are matched by shared words, a suggestion rather than proof that one copied or solved the other.</p>${trustBar(en, it.url)}${consent}`;
  }
  if (k === 'p3' && it.src === 'ct') return `${badge(k)}<h2>${esc(it.title)}</h2><p class="meta">${esc(it.status)}${it.phase ? ' · ' + esc(it.phase.replace(/PHASE/g, 'Phase ').replace(/_/g, ' ')) : ''}${it.sponsor ? ' · ' + esc(it.sponsor) : ''}</p>
    ${it.desc ? `<h3>What it set out to test</h3><p>${esc(it.desc)}</p>` : ''}${it.conditions?.length ? `<p class="meta">${esc(it.conditions.join(' · '))}</p>` : ''}
    <h3>Why it stopped</h3><p>“${esc(it.why)}”</p><p class="meta">The sponsor's own words. Grouped here as: ${esc(it.reason.toLowerCase())}. Studies stopped for safety or because the treatment did not work are left out.</p>
    <h3>When and where</h3><p>${it.created ? 'Started ' + esc(fmtDate(it.created)) + '. ' : ''}${it.enrolled != null ? esc(n(it.enrolled)) + ' people ' + (it.enrolledType === 'ACTUAL' ? 'enrolled' : 'planned') + '. ' : ''}Drawn at the first listed site: ${esc(it.where || '')}${it.where ? ', ' : ''}${esc(it.place.label)}${it.sites > 1 ? ` (one of ${n(it.sites)} sites)` : ''}.</p>
    ${relatedLinks(it.id)}${trustBar(en, it.url, 'Record updated ' + fmtDate(it.stopped))}<p class="src">Record from ClinicalTrials.gov, US National Library of Medicine. Registry entries are submitted by sponsors.</p>${consent}`;
  if (k === 'p3') return `${badge(k)}<h2>${esc(it.title)}</h2><p class="meta">★ ${n(it.stars)} people valued it · ${n(it.forks)} copies · ${esc(it.lang || '')}</p><h3>What it set out to solve</h3><p>${esc(it.desc)}</p>${it.topics?.length ? `<p class="meta">${esc(it.topics.join(' · '))}</p>` : ''}<h3>When it stopped</h3><p>Started ${esc(fmtDate(it.created))}. Last code ${esc(fmtDate(it.stopped))} (${esc(ago(it.stopped))}). Archived by its owner, so it is read-only now${it.licence && it.licence !== 'NOASSERTION' ? `; its ${esc(it.licence)} licence lets anyone carry it on` : '; no clear licence, so carrying it on means asking first'}.</p><h3>Where</h3><p>${it.place ? esc(it.place.label) + (it.place.precision === 'country' ? ' (country only)' : '') + `<small style="color:var(--mute)"> · from the owner's public profile: "${esc(it.where)}"</small>` : 'The owner lists no public location, so it is not drawn.'}</p>${it.convergesWith?.length ? `<h3>Wanted again</h3><p>People are working on the same problem right now: ${it.convergesWith.map(esc).join(', ')}.</p>` : ''}${relatedLinks(it.id)}${trustBar(en, it.url)}${consent}`;
  if (k === 'p4') {
    const w = it.work || {}, parts = [['papers', 'papers'], ['repos', 'repositories'], ['hn', 'discussions']].filter(([x]) => w[x] != null).map(([x, l]) => `${n(w[x])} ${l}`);
    return `${badge(k)}<h2>${esc(it.title)}</h2><p class="meta">${esc(it.family)}${it.subfield ? ' · ' + esc(it.subfield) : ''}</p>${it.statement && it.statement !== it.title ? `<p>${esc(it.statement)}</p>` : ''}<h3>Who is working on it</h3><p>${it.neglect == null ? 'Not measured yet' : (it.neglect >= 0.8 ? 'Very quiet. ' : it.neglect >= 0.6 ? 'Quiet. ' : 'Busy. ') + (parts.length ? `In the last two years: ${parts.join(', ')}.` : esc(it.measured || ''))}</p>${it.statedIn ? `<h3>Where it was said</h3><p>“${esc(it.statedIn.paperTitle || '')}”${it.statedIn.venue ? ', ' + esc(it.statedIn.venue) : ''}${it.statedIn.date ? ', ' + esc(fmtDate(it.statedIn.date)) : ''}${it.statedIn.countries?.length ? `. Authors in ${esc(it.statedIn.countries.map(c => regionName(c)).join(', '))}` : ''}.</p>` : ''}${it.deep ? `<p><a href="${esc(it.deep)}" target="_blank" rel="noopener">See who is working on it in the full sky</a></p>` : ''}<p class="meta">${esc(it.confidence || '')}</p>${relatedLinks(it.id)}<p class="src">Listed by <a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.sourceName)}</a>. From <a href="https://mhccog.github.io/stuck-on/" target="_blank" rel="noopener">Everything we're stuck on</a>. Drawn in the air because a problem is not a place.</p>${trustBar(en, it.url)}`;
  }
  if (k === 'p5' && it.match) { const m = it.match; return `${badge(k)}<h2>A surplus meets a shortage</h2><p class="meta">${esc(m.km)} km apart · both lists from Give Food</p>
    <div class="thread" style="border-color:${P.p5.colour}"><small style="color:var(--mute)">Has too much of</small><br><span class="go" data-go="${esc(it.a.id)}">${esc(it.a.name)}</span></div>
    <div class="thread" style="border-color:${P.p5.colour}"><small style="color:var(--mute)">Is short of</small><br><span class="go" data-go="${esc(it.b.id)}">${esc(it.b.name)}</span></div>
    <h3>The same items</h3><ul class="items">${m.items.map(([a, b]) => `<li class="hit">${esc(a)}${a !== b ? ' ↔ ' + esc(b) : ''}</li>`).join('')}</ul>
    <p class="meta">Matched by item name after light clean-up ("Dry Pasta" = "Pasta"). Food banks often pass on surplus to each other already; this only shows that, by their own lists, it could help here.</p>${trustBar(en, it.b.url, 'Lists found ' + fmtDate(it.a.found) + ' and ' + fmtDate(it.b.found))}`; }
  if (k === 'p5' && it.src === 'gf') {
    const mm = (S.p5matches || []).filter(m => m.to === it.id || m.from === it.id);
    const hits = new Set(mm.filter(m => m.to === it.id).flatMap(m => m.items.map(x => x[1])));
    return `${badge(k)}<h2>${esc(it.name)}</h2><p class="meta">${esc([it.district, it.country].filter(Boolean).join(', '))}${it.network ? ' · ' + esc(it.network) : ''}${it.sites > 1 ? ' · ' + n(it.sites) + ' sites' : ''}</p>
    <h3>Short of right now</h3><ul class="items">${it.needs.map(x => `<li class="${hits.has(x) ? 'hit' : ''}">${esc(x)}</li>`).join('')}</ul>
    <p class="meta">Their list as published, in their order${hits.size ? '; coral items are on a neighbour\'s surplus list' : ''}. A list is a hint, so <a href="${esc(it.list || it.url)}" target="_blank" rel="noopener">read their own shopping list</a> before giving.</p>
    ${it.excess?.length ? `<h3>Has too much of</h3><ul class="items excess">${it.excess.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${mm.length ? '<h3>Surplus and shortage nearby</h3>' + mm.slice(0, 6).map(m => { const o = S.p5by.get(m.from === it.id ? m.to : m.from); return `<div class="thread" style="border-color:${P.p5.colour}"><small style="color:var(--mute)">${m.from === it.id ? 'Short of what this one has spare' : 'Has spare what this one needs'} · ${esc(m.km)} km</small><br><span class="go" data-go="${esc('m:' + m.from + '>' + m.to)}">${esc(o.name)}</span><small style="color:var(--mute)"> · ${esc(m.items.map(x => x[1]).join(', '))}</small></div>`; }).join('') : ''}
    ${relatedLinks(it.id)}${trustBar(en, it.url, 'List found ' + fmtDate(it.found) + (it.age > 60 ? ' (over two months old)' : ''))}<p class="src">Data from <a href="https://www.givefood.org.uk" target="_blank" rel="noopener">Give Food</a> (CC BY 4.0), a UK charity that reads food banks' own websites.</p>`;
  }
  if (k === 'p5') { const kind = S.p5kinds?.[it.kind] || {}; return `${badge(k)}<h2>${esc(it.name || kind.label)}</h2><p class="meta">${esc(kind.label)}${it.city ? ' · ' + esc(it.city) : ''}${it.operator ? ' · run by ' + esc(it.operator) : ''}</p><p>${esc(kind.blurb)}</p>${it.note ? `<h3>Notes on the map</h3><p>${esc(it.note)}</p>` : ''}${it.hours ? `<p class="meta">Hours: ${esc(it.hours)}</p>` : ''}${nearNeed(it)}${relatedLinks(it.id)}${trustBar(en, it.url, 'OpenStreetMap as of ' + fmtDate((S.data.p5?.meta?.osmBase || '').slice(0, 10)))}<p class="src">Mapped by volunteers on OpenStreetMap (© OpenStreetMap contributors, ODbL). A mapped place may have closed; check before visiting.</p>`; }
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
  for (const k of order) { const h = hits[k]; if (!h.length) continue; const c = k === 'link' ? LINK : P[k].colour; html += `<li class="head" style="color:${c}">${esc(k === 'link' ? 'Common threads' : P[k].name)} · ${n(h.total)}</li>` + h.map(r => `<li data-id="${esc(r.id)}">${k === 'link' ? ICON.link() : ICON[k](c).replace('class="ico"', 'width="16" height="16" style="flex:none;margin-top:2px"')}<span>${esc(r.title.slice(0, 110))}<small>${esc((r.sub || '').slice(0, 90))}</small></span></li>`).join(''); }
  el.innerHTML = html || `<li class="none">Nothing in the five layers matches “${esc(q)}” yet.</li>`;
  el.hidden = false;
  el.querySelectorAll('li[data-id]').forEach(li => li.onclick = () => { pauseDrift(); el.hidden = true; select(li.dataset.id, true); });
}

// ---------- drift ----------
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function driftCandidates(k) {
  const d = S.data;
  if (k === 'p1' && okMeta(d.p1)) return d.p1.topics.flatMap(t => t.convergences).map(c => c.id);
  if (k === 'p2') { const a = allowed('pp') ? (S.p2pairs || []).slice(0, 120).map(p => p.from) : [], b = allowed('wb') && okMeta(d.p2b) ? d.p2b.items.filter(i => i.rating === 'Highly Satisfactory' || i.desc.length > 200).map(i => i.id) : []; return Math.random() < 0.5 && a.length || !b.length ? a : b; }
  if (k === 'p3') { const a = allowed('gh') && okMeta(d.p3) ? d.p3.items.filter(i => i.place && i.stars >= 150).map(i => i.id) : [], b = allowed('ct') && okMeta(d.p3b) ? d.p3b.items.filter(i => i.desc && i.why.length > 25).map(i => i.id) : []; return Math.random() < 0.5 && a.length || !b.length ? a : b; }
  if (k === 'p4') return S.stars.filter(s => s.quiet && s.p.title.length < 140).map(s => s.p.id);
  if (k === 'p5') { const a = S.sub.off && okMeta(d.p5) ? d.p5.items.filter(i => i.note || i.name).map(i => i.id) : [], b = S.sub.need ? (S.p5matches || []).slice(0, 80).map(m => 'm:' + m.from + '>' + m.to) : []; return Math.random() < 0.55 && b.length || !a.length ? b : a; }
  if (k === 'link') return S.links.filter(l => l.ok && linkVisible(l)).map(l => l.id);
  return [];
}
function captionFor(en) {
  const it = en.item;
  switch (en.key) {
    case 'p1': return it.caption;
    case 'p2': if (it.src === 'wb') return `${it.place}: “${it.title}”. Independent evaluators rated it ${it.rating}.`; { const p = (S.p2pairs || []).find(p => p.from === it.id); const b = p && S.p2by.get(p.to); return b ? `${it.place} faced this in ${year(it.start)}: “${it.title}”. ${b.place} had met it in ${year(b.start)}, and wrote up what happened.` : it.title; }
    case 'p3': if (it.src === 'ct') return `“${it.title}” stopped: “${it.why}”`; return `${it.title} set out to solve this: “${it.desc}” ${n(it.stars)} people valued it. Its last code was ${ago(it.stopped)}.`;
    case 'p4': return `Still open: “${it.title}” Almost nobody is visibly working on it.`;
    case 'p5': if (it.match) return `${it.a.name} has too much ${it.match.items.map(x => x[0].toLowerCase()).slice(0, 3).join(', ')}. ${it.match.km} km away, ${it.b.name} is short of it.`; if (it.src === 'gf') return `${it.name} is short of ${it.needs.slice(0, 4).join(', ')}.`; { const kind = S.p5kinds?.[it.kind]; return `${it.name ? it.name + ', a ' + kind.label.toLowerCase() : 'A ' + kind.label.toLowerCase()}${it.city ? ' in ' + it.city : ''}. ${it.note ? '“' + it.note + '”' : kind.blurb}`; }
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
    setTimeout(() => { if (!S.drift) return; $('capKicker').innerHTML = `<span style="color:${c}">${esc(en.key === 'link' ? 'Common thread · where two layers meet' : P[en.key].n + ' · ' + P[en.key].name)}</span>`; $('capMain').textContent = (captionFor(en) || '').slice(0, 260); cap.style.opacity = 1; }, 900);
    S.sel = en;
    const ll = en.key === 'link' ? linkGround(en.item) : locate(en);
    map.getSource('sel').setData(fc(ll ? [pt(ll[0], ll[1], { c })] : []));
    if (ll) { const sky = en.key === 'link' && [en.item.a, en.item.b].some(r => S.byId.get(r)?.key === 'p4'); flyTo(ll, sky ? 1.0 : en.item?.match ? 5.8 : en.key === 'p5' ? 3.4 : en.key === 'p1' ? null : 2.2, sky ? null : en); } else if (en.key === 'p4') flyTo([map.getCenter().lng + 25, 12], isMobile() ? -0.4 : 0.35);
  }
  S.driftTimer = setTimeout(driftStep, reduceMotion ? 14000 : 11000);
}
function startDrift() { S.drift = true; $('driftBtn').setAttribute('aria-pressed', 'true'); $('driftLabel').textContent = isMobile() ? 'Drifting' : 'Drifting through all five'; $('detail').hidden = true; clearTimeout(S.driftTimer); driftStep(); }
function pauseDrift() { if (!S.drift) return; S.drift = false; clearTimeout(S.driftTimer); $('driftBtn').setAttribute('aria-pressed', 'false'); $('driftLabel').textContent = 'Drift'; $('caption').style.opacity = 0; S.sel = null; }
$('driftBtn').onclick = () => S.drift ? pauseDrift() : startDrift();
