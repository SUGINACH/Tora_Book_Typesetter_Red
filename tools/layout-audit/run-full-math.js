#!/usr/bin/env node
// tools/layout-audit/run-full-math.js — האודיט המתמטי המלא (S4.24) ברגרסיית Node
'use strict';
/**
 * הרצה עצמאית (אפס תלויות חוץ מ-agent-browser) של האודיט המתמטי המלא:
 *   1. מגיש את האפליקציה (red-build/ui) בשרת מקומי — או פותח URL חי (--url).
 *   2. מזרים את ה-fixture (ברירת מחדל: audits/very_long_test_text.txt —
 *      3.4MB, ~700 עמודים) — מקומית דרך השרת, בחי דרך base64 בחתיכות
 *      (עוקף MAX_ARG_STRLEN).
 *   3. ממתין לסיום העימוד (polling של מצב האפליקציה).
 *   4. מריץ את full-math-audit.js בתוך הדף (21 משפחות בדיקות — דיו בפועל,
 *      חפיפות, יישור, מרכוז, פסים, הערות-שוליים, כיסוי, גופנים, וירטואליזציה).
 *   5. מעמד שנית ומריץ את determinism-sweep.js — השוואת טביעת-אצבע גאומטרית.
 * יציאה 0 **רק** אם: 0 בעיות + כיסוי מלא + דטרמיניזם זהה.
 * הדוחות נשמרים ב-red-build/tests/artifacts/full-math-audit/ (או --out).
 *
 * **הערת מימוש (קריטית):** כל הפעלות agent-browser הן **אסינכרוניות**
 * (child_process.spawn + await) — השרת המקומי חי באותו תהליך, ו-spawnSync
 * היה חוסם את ה-event-loop ומונע ממנו להגיש את הדף בזמן שהדפדפן ממתין
 * לו (נמדד: קיפאון כפול — ה-open מסתיים ב-EAGAIN מול הדמון).
 *
 * שימוש:
 *   node tools/layout-audit/run-full-math.js [--fixture <path>] [--url <url>]
 *        [--tag <name>] [--out <dir>] [--skip-determinism]
 * דוגמאות:
 *   node tools/layout-audit/run-full-math.js                      # מקומי + very_long
 *   node tools/layout-audit/run-full-math.js --url https://suginach.github.io/Tora_Book_Typesetter_Red/ --tag live
 */
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const UI = path.join(ROOT, 'red-build', 'ui');
const AUDIT_JS = path.join(__dirname, 'full-math-audit.js');
const DET_JS = path.join(__dirname, 'determinism-sweep.js');

// ── ארגומנטים ──
const args = process.argv.slice(2);
const argOf = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const FIXTURE = path.resolve(argOf('--fixture', path.join(ROOT, 'audits', 'very_long_test_text.txt')));
const URL = argOf('--url', null);
const TAG = argOf('--tag', URL ? 'live' : 'local');
const OUT = path.resolve(argOf('--out', path.join(ROOT, 'red-build', 'tests', 'artifacts', 'full-math-audit')));
const SKIP_DET = args.includes('--skip-determinism');
const PORT = 8932;
const B64_CHUNK = 100_000;
const READY_TIMEOUT_MS = 900_000;

const log = (m) => console.log(m);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── agent-browser (אסינכרוני בלבד!) ──
function ab(argv, timeoutMs = 300_000) {
  return new Promise((resolve, reject) => {
    const p = spawn('agent-browser', argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    const timer = setTimeout(() => { p.kill('SIGKILL'); reject(new Error(`agent-browser ${argv[0]}: פסק זמן (${timeoutMs}ms)`)); }, timeoutMs);
    p.on('error', (e) => { clearTimeout(timer); reject(new Error(`agent-browser ${argv[0]}: ${e.message}`)); });
    p.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`agent-browser ${String(argv.join(' ')).slice(0, 80)} rc=${code}: ${String(err || out).slice(0, 400)}`));
      else resolve(out.trim());
    });
  });
}
async function ev(js) {
  const out = await ab(['eval', js]);
  try { return JSON.parse(out); } catch (e) { return out; }
}

// ── שרת מקומי (מצב local) ──
let server = null;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };
function startServer() {
  return new Promise((res, rej) => {
    server = http.createServer((req, resp) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let file = null;
      if (urlPath === '/_audit-fixture.txt') file = FIXTURE;
      else if (urlPath === '/' || urlPath === '/index.html') file = path.join(UI, 'index.html');
      else file = path.join(UI, urlPath.replace(/^\//, ''));
      fs.readFile(file, (err, data) => {
        if (err) { resp.writeHead(404); resp.end('not found'); return; }
        resp.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        resp.end(data);
      });
    });
    server.on('error', rej);
    server.listen(PORT, '127.0.0.1', () => res());
  });
}

// ── הזרקת JS ב-base64 בחתיכות (עוקף MAX_ARG_STRLEN) ──
async function injectB64Var(file, varName) {
  const b64 = fs.readFileSync(file).toString('base64');
  await ev(`window.${varName} = ''; 'INIT'`);
  const total = Math.ceil(b64.length / B64_CHUNK);
  for (let i = 0; i < total; i++) {
    const part = b64.substr(i * B64_CHUNK, B64_CHUNK);
    const r = await ev(`window.${varName} += '${part}'; ${i + 1}`);
    if (String(r) !== String(i + 1)) throw new Error(`הזרקת ${varName} נכשלה בחתיכה ${i + 1}/${total}: ${r}`);
  }
}

async function runScriptVar(varSrc, varOut, errVar, timeoutMs) {
  await ev(`window.${varOut} = null; window.${errVar} = null;`
    + `(function() { const s = new TextDecoder('utf-8').decode(Uint8Array.from(atob(window.${varSrc}), c => c.charCodeAt(0)));`
    + `Promise.resolve().then(() => eval(s))`
    + `  .then(r => { window.${varOut} = r; })`
    + `  .catch(e => { window.${errVar} = String((e && e.stack) || e); }); })(); 'RUNNING'`);
  const t0 = Date.now();
  for (;;) {
    const st = await ev(`window.${varOut} ? 'DONE' : (window.${errVar} ? 'ERR' : 'RUNNING')`);
    if (st === 'DONE') return;
    if (st === 'ERR') throw new Error(`${varSrc} נכשל: ` + String(await ev(`window.${errVar}`)).slice(0, 800));
    if (Date.now() - t0 > timeoutMs) throw new Error(`פסק זמן ל-${varSrc}`);
    await sleep(5000);
  }
}

async function fetchBigVar(name) {
  const len = await ev(`(window.${name} ? window.${name}.length : -1)`);
  if (typeof len !== 'number' || len < 0) throw new Error(`משתנה ${name} לא זמין (אורך ${len})`);
  // **S4.26 (תעבורה עמידה):** שליפת מחרוזות גדולות דרך פלט ה-CLI של
  // agent-browser עלולה לשנות תווי יוניקוד נדירים (נצפה: אורך 777660
  // מול 777659 — פער של תו אחד בתעבורה, לא בתוכן). שליפה ב-base64 לכל
  // חתיכה — חסינה לחלוטין לרגעים כאלה (utf-8 ⇄ base64 בלי עריכת התווים).
  const CHUNK = 120_000;
  const parts = [];
  for (let i = 0; i < len; i += CHUNK) {
    const b64 = await ev(
      `(function(){ const s = window.${name}.slice(${i}, ${i + CHUNK});`
      + ` const u8 = new TextEncoder().encode(s);`
      + ` let bin = ''; for (let k = 0; k < u8.length; k += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(k, k + 0x8000));`
      + ` return btoa(bin); })()`
    );
    if (typeof b64 !== 'string' || !b64.length) throw new Error(`שליפת ${name}: חתיכה ${i} ריקה`);
    parts.push(Buffer.from(b64, 'base64').toString('utf8'));
  }
  const s = parts.join('');
  if (s.length !== len) throw new Error(`שליפת ${name}: אורך ${s.length} ≠ ${len}`);
  return s;
}

async function retypesetAndWait(label) {
  const inject = URL
    ? `(async () => { const app = window.__toraApp; if (!app) return 'NO_APP'; const ta = document.querySelector('textarea'); if (!ta) return 'NO_TEXTAREA'; ta.value = window.__fx; ta.dispatchEvent(new Event('input', {bubbles:true})); await new Promise(r => setTimeout(r, 400)); app.onExplicitRetypeset(); return 'STARTED'; })()`
    : `(async () => { const app = window.__toraApp; if (!app) return 'NO_APP'; const ta = document.querySelector('textarea'); if (!ta) return 'NO_TEXTAREA'; const text = await (await fetch('/_audit-fixture.txt')).text(); ta.value = text; ta.dispatchEvent(new Event('input', {bubbles:true})); await new Promise(r => setTimeout(r, 400)); app.onExplicitRetypeset(); return 'STARTED'; })()`;
  const r = await ev(inject);
  if (r !== 'STARTED') throw new Error(`${label}: הזרקה נכשלה: ${r}`);
  const t0 = Date.now();
  for (;;) {
    const st = await ev(`(function(){ const st = window.__toraApp && window.__toraApp.getState(); return st && st.hasResult && st.pages > 0 ? 'READY_' + st.pages : 'WAIT'; })()`);
    if (String(st).startsWith('READY_')) return parseInt(String(st).slice(6), 10);
    if (Date.now() - t0 > READY_TIMEOUT_MS) throw new Error(`${label}: פסק זמן לעימוד`);
    await sleep(3000);
  }
}
const gotoView = async () => {
  await ev(`(async () => { for (const t of document.querySelectorAll('[role=tab],.tab,button')) if (/תצוגה/.test(t.textContent)) t.click(); await new Promise(r => setTimeout(r, 2500)); return 'VIEW'; })()`);
};

// ═════════ main ═════════
(async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(FIXTURE)) throw new Error(`חסר fixture: ${FIXTURE}`);
  const targetUrl = URL || `http://127.0.0.1:${PORT}/index.html`;
  if (!URL) await startServer();

  try { await ab(['close']); } catch (e) {}
  // הדמון של agent-browser עשוי להיות עסוק עוד רגע בסגירת הדפדפן הקודם
  // (EAGAIN בקריאת התשובה) — ניסיון חוזר עם המתנה פותר זאת.
  let opened = false;
  for (let attempt = 1; attempt <= 4 && !opened; attempt++) {
    try { await ab(['open', targetUrl]); opened = true; }
    catch (e) {
      if (attempt === 4) throw e;
      await sleep(3000);
    }
  }
  await sleep(4000);
  const t0 = Date.now();
  for (;;) {
    if (await ev(`window.__toraApp ? 'APP' : 'NO'`) === 'APP') break;
    if (Date.now() - t0 > 120_000) throw new Error('האפליקציה לא עלתה ב-120 שניות');
    await sleep(2000);
  }
  log(`אתר: ${targetUrl} | app: ${await ev(`(document.querySelector('script[src*="app.bundle.js"]') || {}).src || '—'`)}`);

  // במצב חי: הזרקת ה-fixture ב-base64 (לשרת החי אין את הקובץ)
  if (URL) {
    const b64 = fs.readFileSync(FIXTURE).toString('base64');
    const total = Math.ceil(b64.length / B64_CHUNK);
    log(`fixture (חי): ${path.basename(FIXTURE)} — ${fs.statSync(FIXTURE).size.toLocaleString()} בתים → ${total} חתיכות`);
    await ev(`window.__ab = ''; 'INIT'`);
    for (let i = 0; i < total; i++) {
      const r = await ev(`window.__ab += '${b64.substr(i * B64_CHUNK, B64_CHUNK)}'; ${i + 1}`);
      if (String(r) !== String(i + 1)) throw new Error(`חתיכה ${i + 1}/${total} נכשלה`);
    }
    await ev(`window.__fx = new TextDecoder('utf-8').decode(Uint8Array.from(atob(window.__ab), c => c.charCodeAt(0))); window.__ab = ''; 'OK'`);
  } else {
    log(`fixture (מקומי): ${path.basename(FIXTURE)} — ${fs.statSync(FIXTURE).size.toLocaleString()} בתים`);
  }

  const pages1 = await retypesetAndWait('הרצה-1');
  log(`עימוד הרצה-1: ${pages1.toLocaleString()} עמודים`);
  await gotoView();

  log('האודיט המתמטי המלא רץ — סריקת גלילה של כל הספר...');
  await injectB64Var(AUDIT_JS, '__auditSrc');
  await runScriptVar('__auditSrc', '__rep', '__err', 1_200_000);
  const reportRaw = await fetchBigVar('__rep');
  fs.writeFileSync(path.join(OUT, `${TAG}-full-math-audit.json`), reportRaw, 'utf8');
  const report = JSON.parse(reportRaw);
  const s = report.summary || {};
  const st = report.stats || {};
  log('─'.repeat(62));
  log(`עמודים: ${s.pages}/${s.slots} | שורות: ${(s.totalLines || 0).toLocaleString()} | וירטואלי: ${s.virtualized} | סריקה: ${s.sweep && s.sweep.ms}ms`);
  log(`בעיות (סה"כ): ${s.problems} | לפי סוג: ${JSON.stringify(st.counts || {})}`);
  log(`גופנים בפועל: ${(s.observedFonts || []).join(', ')}`);
  log(`פער דיו שמאל: ${JSON.stringify(st.bodyGapLeft)}`);
  log(`פער דיו ימין: ${JSON.stringify(st.bodyGapRight)}`);
  log(`חלון מימין: ${JSON.stringify(st.windowDistFromRight)}`);
  log('─'.repeat(62));

  // דטרמיניזם
  let detIdentical = SKIP_DET;
  let pages2 = null;
  if (!SKIP_DET) {
    log('דטרמיניזם: מריץ עימוד מחדש...');
    pages2 = await retypesetAndWait('הרצה-2');
    log(`עימוד הרצה-2: ${pages2.toLocaleString()} עמודים`);
    await gotoView();
    await injectB64Var(DET_JS, '__detSrc');
    await runScriptVar('__detSrc', '__det', '__detErr', 1_200_000);
    const detRaw = await fetchBigVar('__det');
    fs.writeFileSync(path.join(OUT, `${TAG}-determinism-raw.json`), detRaw, 'utf8');
    const det = JSON.parse(detRaw);
    const canonMain = {}, canonDet = {};
    for (const p of (report.pages || [])) canonMain[p.i] = [p.t, (p.cols || []).map((c) => c.tops)];
    for (const p of (det.pages || [])) canonDet[p.i] = [p.t, p.cols];
    const keys1 = Object.keys(canonMain).sort((a, b) => a - b);
    const keys2 = Object.keys(canonDet).sort((a, b) => a - b);
    const diffs = [];
    if (keys1.join(',') === keys2.join(',')) {
      for (const k of keys1) {
        const [t1, c1] = canonMain[k], [t2, c2] = canonDet[k];
        if (t1 !== t2 || JSON.stringify(c1) !== JSON.stringify(c2)) diffs.push({ page: k });
        if (diffs.length >= 20) break;
      }
    } else diffs.push({ pageSet: 'different' });
    detIdentical = diffs.length === 0;
    fs.writeFileSync(path.join(OUT, `${TAG}-determinism-result.json`),
      JSON.stringify({ pagesRun1: pages1, pagesRun2: pages2, identical: detIdentical, diffCount: diffs.length, diffs }, null, 2), 'utf8');
    log(`דטרמיניזם: ${detIdentical ? 'זהה לחלוטין ✔' : diffs.length + ' הבדלים ✗'} (עמודים ${pages1}/${pages2})`);
  }

  try { await ab(['close']); } catch (e) {}
  if (server) server.close();

  const ok = s.problems === 0 && detIdentical && s.pages === s.slots;
  console.log('');
  console.log('════════ סיכום האודיט המתמטי המלא ════════');
  console.log(`pages: ${s.pages}/${s.slots} | lines: ${(s.totalLines || 0).toLocaleString()} | problems: ${s.problems}`);
  console.log(`counts: ${JSON.stringify(st.counts || {})}`);
  console.log(`determinism: ${detIdentical ? 'IDENTICAL' : 'DIFFERENCES!'}`);
  console.log(`reports: ${OUT}`);
  console.log(ok ? '✓ PASS — 0 בעיות + דטרמיניזם מלא' : '✗ FAIL — נדרשות 0 בעיות');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(String(e && e.stack || e)); try { ab(['close']); } catch (x) {} if (server) server.close(); process.exit(2); });
