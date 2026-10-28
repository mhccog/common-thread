const puppeteer = require('/tmp/shotenv/node_modules/puppeteer-core');
const [,, url = 'http://localhost:8790/', out = 'shot.png', w = '1440', h = '900', waitMs = '14000', action = ''] = process.argv;
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage();
  const errs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('requestfailed', r => errs.push('reqfail: ' + r.url() + ' ' + r.failure()?.errorText));
  await p.setViewport({ width: +w, height: +h, deviceScaleFactor: +w < 500 ? 2 : 1, isMobile: +w < 500, hasTouch: +w < 500 });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, +waitMs));
  await p.evaluate(() => { const d = document.getElementById('intro'); if (d?.open && !location.search.includes('intro')) d.close(); });
  await new Promise(r => setTimeout(r, 1500));
  if (action.startsWith('select:')) { await p.evaluate((id) => { const S = window.__commonThread; const k = S.byId.has(id) ? id : [...S.byId.keys()].find(x => x.startsWith(id)); S.select(k); }, action.slice(7)); await new Promise(r => setTimeout(r, 7000)); }
  if (action.startsWith('view:')) { const [lng, lat, z] = action.slice(5).split(',').map(Number); await p.evaluate((lng, lat, z) => { const S = window.__commonThread; document.getElementById('driftBtn').click(); S.map.jumpTo({ center: [lng, lat], zoom: z }); S.lastInteract = performance.now() + 1e9; }, lng, lat, z); await new Promise(r => setTimeout(r, 5000)); }
  if (action === 'search') { await p.type('#q', 'water'); await new Promise(r => setTimeout(r, 1500)); }
  await p.screenshot({ path: out });
  const info = await p.evaluate(() => ({ zoom: window.__commonThread?.map?.getZoom(), caption: document.getElementById('capMain').textContent, kicker: document.getElementById('capKicker').textContent, legend: [...document.querySelectorAll('.layer')].map(l => l.querySelector('.name').textContent + ' | ' + l.querySelector('.num').textContent + ' | ' + l.querySelector('.state').textContent), links: window.__commonThread?.links?.length, detail: document.getElementById('detail').hidden ? null : document.getElementById('detailBody').innerText.slice(0, 400) }));
  console.log(JSON.stringify(info, null, 1));
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})();
