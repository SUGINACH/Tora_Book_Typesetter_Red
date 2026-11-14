#!/usr/bin/env node
// tools/perf/browser-boot.js — Agent 3: מדידת עלייה בדפדפן (headless Chromium) מול שרת סטטי מוגבל.
// קריאה בלבד: אינו משנה קוד ב-repo. התלויות החיצוניות אינן נוספות ל-repo:
//   PERF_BROWSER_MODULES=<node_modules עם puppeteer-core ו-@sparticuz/chromium>  (או CHROME_PATH לדפדפן קיים). דורש openssl (HTTP/2 מקומי).
//   node tools/perf/browser-boot.js --profile broadband --variants cold,cold+prefetch,warm,reval --repeat 3 [--out f.json]
// השרת מדמה מארח (GitHub Pages): HTTP/2, gzip לטקסט בלבד (גופנים ללא דחיסה — שמרני), ETag, Cache-Control, + RTT לבקשה (ו-2×RTT לבקשה
// הראשונה: TCP+TLS) ורוחב פס משותף (חלוקה שווה בין הזרמים הפעילים). ה-RTT/רוחב-פס הם הדמיה, לא מדידת רשת אמיתית.
// וריאנטים: cold (הקשר נקי) · +prefetch (שליפה מקבילית של גופני העלייה בתחילת המסמך — "מה אם", ללא שינוי קוד) ·
//           +designsfast (אוספי העיצוב נשלחים מיד — חסם עליון לתועלת מהסרתם מהרשת) · warm (טעינה שנייה, max-age=600) ·
//           +prefetchlate (כמו prefetch אך מתחיל ב-DOMContentLoaded, כלומר אחרי שה-bundle נטען) · +fontsimmutable (גופנים עם מטמון ארוך — חסם עליון
//           לתועלת מ-force-cache/IndexedDB) · +prefetchlink / +preloadlink (תגיות <link> ב-<head> של index.html — ללא JS) · reval (טעינה שנייה כשהמטמון פג: בקשות מותנות 304).
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const http2 = require('http2');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
let UI = path.join(ROOT, 'red-build', 'ui'); // ניתן לעקיפה ב-ui-root (להשוואת לפני/אחרי על עץ חלופי)
const PROFILES = { local: { rttMs: 0, mbps: 0 }, broadband: { rttMs: 50, mbps: 20 }, slow: { rttMs: 150, mbps: 5 } };
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.png': 'image/png' };
const TEXT = /^\.(html|css|js|json|svg)$/;
const DESIGN_RE = /(shaar_|ornaments_|section_dividers|header_ornaments)[^/]*\.json$/;

function startServer(init) {
  const o = { rttMs: 0, mbps: 0, cache: 'public, max-age=600', fast: [], ...init };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'redcert-'));
  const gen = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', path.join(tmp, 'k.pem'), '-out', path.join(tmp, 'c.pem'), '-days', '1', '-subj', '/CN=localhost'], { stdio: 'ignore' });
  if (gen.status !== 0) throw new Error('openssl נדרש ליצירת תעודת HTTP/2 מקומית');
  const spki = spawnSync('sh', ['-c', `openssl x509 -in ${path.join(tmp, 'c.pem')} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64`], { encoding: 'utf8' }).stdout.trim();
  const gz = new Map(); const active = new Set(); const log = []; let timer = null; let first = true;
  const tick = () => {
    if (!active.size) { clearInterval(timer); timer = null; return; }
    const share = Math.max(1, Math.floor((o.mbps * 1e6 / 8 * 0.005) / active.size)); // חלוקה שווה בכל 5ms
    for (const s of [...active]) {
      const n = Math.min(share, s.buf.length - s.off);
      s.res.write(s.buf.subarray(s.off, s.off + n)); s.off += n;
      if (s.off >= s.buf.length) { s.res.end(); active.delete(s); }
    }
  };
  const handler = (req, res) => {
    let rel = decodeURIComponent(new URL(req.url, 'https://localhost').pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(UI, rel);
    if (!file.startsWith(UI) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { log.push({ rel, status: 404 }); res.writeHead(404); res.end('nf'); return; }
    const st = fs.statSync(file); const ext = path.extname(file).toLowerCase();
    const etag = `"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': (o.fontCache && /\/fonts\//.test(rel)) ? o.fontCache : o.cache, ETag: etag, 'Last-Modified': st.mtime.toUTCString() };
    const fast = o.fast.some((re) => re.test(rel));
    const delay = fast ? 0 : o.rttMs + (first ? 2 * o.rttMs : 0); first = false;
    setTimeout(() => {
      if (req.headers['if-none-match'] === etag) { log.push({ rel, status: 304 }); res.writeHead(304, headers); res.end(); return; }
      let body = fs.readFileSync(file); const inj = rel === '/index.html' && o.headLinks ? o.headLinks : '';
      if (inj) body = Buffer.from(body.toString('utf8').replace('</head>', inj + '\n</head>'));
      if (TEXT.test(ext)) { const key = file + '|' + inj; if (!gz.has(key)) gz.set(key, zlib.gzipSync(body, { level: 6 })); body = gz.get(key); headers['Content-Encoding'] = 'gzip'; }
      headers['Content-Length'] = body.length; log.push({ rel, status: 200, bytes: body.length });
      res.writeHead(200, headers);
      if (fast || !o.mbps) res.end(body); else { active.add({ res, buf: body, off: 0 }); if (!timer) timer = setInterval(tick, 5); }
    }, delay);
  };
  const server = http2.createSecureServer({ key: fs.readFileSync(path.join(tmp, 'k.pem')), cert: fs.readFileSync(path.join(tmp, 'c.pem')), allowHTTP1: true }, handler);
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({
    url: `https://localhost:${server.address().port}`, log, o, spki,
    reset() { first = true; log.length = 0; }, close() { server.close(); server.closeAllConnections && server.closeAllConnections(); }
  })));
}

const category = (u) => /app\.bundle\.js|engine-worker\.bundle\.js/.test(u) ? 'bundle' : /styles\.css|index\.html|\/$/.test(u) ? 'html/css' : /imud-fonts\.json|fonts-extended\.json/.test(u) ? 'catalog'
  : /default_settings|setting_sets/.test(u) ? 'settings' : DESIGN_RE.test(u) ? 'design' : /\/fonts\//.test(u) ? 'font' : 'other';
const median = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const r0 = (x) => (x == null ? null : Math.round(x));

async function loadOnce(ctx, base, spec, expectFonts, bootFonts) {
  const page = await ctx.newPage();
  const errors = []; let reqCount = 0;
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 120)));
  page.on('request', () => { reqCount++; });
  await page.evaluateOnNewDocument((prefetch, fonts) => {
    window.__long = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch (e) { /* ללא longtask */ }
    const go = (fc) => { for (const f of fonts) fetch('assets/imud/fonts/' + f, fc ? { cache: 'force-cache' } : undefined).catch(() => {}); };
    if (prefetch === 'start') go(); else if (prefetch === 'late') document.addEventListener('DOMContentLoaded', () => go(false)); else if (prefetch === 'late-fc') document.addEventListener('DOMContentLoaded', () => go(true));
  }, spec.prefetch, bootFonts);
  await page.goto(base + '/index.html', { waitUntil: 'load', timeout: 180000 });
  if (expectFonts) await page.waitForFunction((n) => { if (document.fonts.size >= n) { window.__fr = window.__fr || performance.now(); return true; } return false; }, { timeout: 180000, polling: 25 }, expectFonts);
  await page.waitForNetworkIdle({ idleTime: 1500, timeout: 180000 });
  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return { res: performance.getEntriesByType('resource').map((e) => ({ n: e.name, s: e.startTime, re: e.responseEnd, ts: e.transferSize, eb: e.encodedBodySize })),
      load: nav.loadEventEnd, fcp: (performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint') || {}).startTime, long: window.__long, fr: window.__fr || null,
      fonts: document.fonts.size, heapMB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null };
  });
  await page.close();
  const by = {}; for (const e of m.res) { const c = category(e.n); (by[c] = by[c] || []).push(e); }
  const endOf = (c) => (by[c] ? Math.max(...by[c].map((e) => e.re)) : null);
  const bytes = (c) => (by[c] || []).reduce((s, e) => s + (e.ts || e.eb || 0), 0);
  const tbt = m.long.reduce((s, [, d]) => s + Math.max(0, d - 50), 0);
  return { requests: reqCount, fonts: m.fonts, fontsReadyMs: m.fr, bundleDoneMs: endOf('bundle'), catalogDoneMs: endOf('catalog'), fontFilesDoneMs: endOf('font'), designsDoneMs: endOf('design'),
    lastResponseMs: Math.max(...m.res.map((e) => e.re)), loadMs: m.load, fcpMs: m.fcp, longTasks: m.long.length, tbtMs: tbt, maxLongMs: m.long.length ? Math.max(...m.long.map((x) => x[1])) : 0,
    heapMB: m.heapMB, transferKB: Object.fromEntries(Object.keys(by).map((c) => [c, Math.round(bytes(c) / 1024)])), errors };
}

function parseVariant(v, fonts) {
  const links = (rel) => fonts.map((f) => (rel === 'prefetch' ? `<link rel="prefetch" href="assets/imud/fonts/${encodeURI(f)}">` : `<link rel="preload" as="fetch" crossorigin href="assets/imud/fonts/${encodeURI(f)}">`)).join('\n');
  const parts = v.split('+'); const base = parts[0];
  return { name: v, second: base === 'warm' || base === 'reval', cache: base === 'reval' ? 'public, max-age=0' : 'public, max-age=600',
    prefetch: parts.includes('prefetch') ? 'start' : parts.includes('prefetchlatefc') ? 'late-fc' : parts.includes('prefetchlate') ? 'late' : null, designsFast: parts.includes('designsfast'),
    fontCache: parts.includes('fontsimmutable') ? 'public, max-age=31536000, immutable' : null,
    headLinks: parts.includes('prefetchlink') ? links('prefetch') : parts.includes('preloadlink') ? links('preload') : null };
}

const serverKB = (log) => { const o = {}; for (const l of log) if (l.status === 200) { const c = category(l.rel); o[c] = (o[c] || 0) + l.bytes; } return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v / 1024)])); };

// רשימת גופני העלייה (נדרשת לווריאנטי "מה אם" ולכיול): --boot-fonts <json> · ui/font-prefetch.js (FILES) · docs/perf/baseline-*.json
function loadBootFonts(file) {
  if (file) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const fp = path.join(ROOT, 'red-build', 'ui', 'font-prefetch.js');
  if (fs.existsSync(fp)) return require(fp).FILES;
  const dir = path.join(ROOT, 'docs', 'perf');
  const f = fs.existsSync(dir) && fs.readdirSync(dir).find((x) => /^baseline-.*\.json$/.test(x));
  if (f) return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).inventory.boot.steps.filter((x) => x.category === 'font').map((x) => x.file.replace(/^fonts\//, ''));
  return [];
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const profName = opt('--profile', 'local'); const prof = PROFILES[profName]; if (!prof) throw new Error('profile לא מוכר: ' + Object.keys(PROFILES));
  if (opt('--ui-root')) UI = path.resolve(opt('--ui-root'));
  const repeat = Number(opt('--repeat', 2)); const variantNames = opt('--variants', 'cold,cold+prefetch').split(',');
  const mods = process.env.PERF_BROWSER_MODULES; if (!mods && !process.env.CHROME_PATH) throw new Error('הגדר PERF_BROWSER_MODULES (או CHROME_PATH + puppeteer-core)');
  const req = require('module').createRequire(path.join(mods || process.cwd(), '..', 'noop.js')); // פתרון חבילות כרגיל (exports נתמך)
  const puppeteer = req('puppeteer-core');
  const server = await startServer({ rttMs: 0, mbps: 0 });
  // SPKI ספציפי (ולא --ignore-certificate-errors): Chrome אינו שומר במטמון HTTP תגובות מחיבור עם שגיאת תעודה
  let exe = process.env.CHROME_PATH; let args = ['--no-sandbox', `--ignore-certificate-errors-spki-list=${server.spki}`, '--enable-precise-memory-info', '--host-resolver-rules=MAP red-pages.test 127.0.0.1'];
  const host = profName === 'local' ? 'localhost' : 'red-pages.test'; // שם שאינו loopback — כדי שלוגיקה התלויה ב-location.hostname תפעל כמו בארוח מרוחק
  if (!exe) { const c = req('@sparticuz/chromium'); const chromium = c.default || c; exe = await chromium.executablePath(); args = [...chromium.args.filter((x) => !/^--(single-process|no-zygote)$/.test(x)), ...args]; } // single-process מקריס הקשרי גלישה נפרדים
  const browser = await puppeteer.launch({ executablePath: exe, args, headless: 'shell' });
  const bootFonts = loadBootFonts(opt('--boot-fonts'));
  const specs = variantNames.map((v) => parseVariant(v, bootFonts));
  const base = server.url.replace('localhost', host);
  const out = { env: { browser: await browser.version(), node: process.version, cpus: os.cpus().length, profile: profName, ...prof, bootFonts: bootFonts.length, repeat }, variants: [] };
  // כיול: כמה FontFace נוספים בסוף עלייה תקינה (ריצה מקומית, ללא הגבלה)
  { const ctx = await browser.createBrowserContext(); const r = await loadOnce(ctx, base, { cache: 'public, max-age=600' }, 0, bootFonts); await ctx.close(); out.env.expectFonts = r.fonts; out.env.calibrationErrors = r.errors; }
  for (const spec of specs) {
    const runs = [];
    for (let i = 0; i < repeat; i++) {
      Object.assign(server.o, { ...prof, cache: spec.cache, fontCache: spec.fontCache, headLinks: spec.headLinks, fast: spec.designsFast ? [DESIGN_RE] : [] }); server.reset();
      const ctx = await browser.createBrowserContext();
      let m = await loadOnce(ctx, base, spec, out.env.expectFonts, bootFonts);
      if (spec.second) { server.reset(); m = await loadOnce(ctx, base, spec, out.env.expectFonts, bootFonts); m.statuses = server.log.reduce((a, l) => { a[l.status] = (a[l.status] || 0) + 1; return a; }, {}); }
      m.transferKB = serverKB(server.log); m.serverHits = server.log.length; await ctx.close(); runs.push(m);
    }
    const keys = ['fontsReadyMs', 'bundleDoneMs', 'catalogDoneMs', 'fontFilesDoneMs', 'designsDoneMs', 'lastResponseMs', 'loadMs', 'fcpMs', 'tbtMs', 'maxLongMs', 'longTasks', 'serverHits', 'heapMB'];
    const med = Object.fromEntries(keys.map((k) => [k, r0(median(runs.map((r) => r[k])))]));
    out.variants.push({ name: spec.name, median: med, transferKB: runs[0].transferKB, statuses: runs[0].statuses || null, errors: [...new Set(runs.flatMap((r) => r.errors))], runs });
    console.log(profName.padEnd(10), spec.name.padEnd(22), JSON.stringify(med));
  }
  await browser.close(); server.close();
  if (opt('--out')) fs.writeFileSync(opt('--out'), JSON.stringify(out, null, 2) + '\n');
}
main().then(() => process.exit(0), (e) => { console.error('FAIL', e && e.stack || e); process.exit(1); });
