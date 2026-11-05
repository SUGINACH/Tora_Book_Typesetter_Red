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
const crypto = require('crypto');

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
// **S5.2 (רצפת נפח):** ספר שהתקצר בשקט (מנוע שבורע/מדלג תוכן) עבר ירוק כל
// עוד 0 בעיות במה שכן רונדר. הקורפוס הקנוני: 704 עמודים / 363,232 מילים —
// הרצפה מכוונת בכוונה נדיבה (690) כי שינויי TOC/הערות-סיום של המנוע עשויים
// להזיז את מספר העמודים במעט; יחס המילים (0.98) תופס איבוד תוכן אמיתי.
const EXPECTED_PAGES_MIN = 690;
const EXPECTED_WORDS_MIN_RATIO = 0.98;

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
  // **S5.2 (מרוץ הרצה-2):** לפני ההדלקה נלקח מונה הדור של האפליקציה —
  // app.getState().gen: 0 בעלייה, +1 על **כל** עימוד שהושלם. בלי זה, הרצה-2
  // המתינה על `hasResult && pages>0` — תנאי שכבר התקיים מהרצה-1 (עימוד מחדש
  // אינו מאפס את התוצאה הישנה) — ויכלה לבדוק את ה-DOM הישן/מעורבב של הרצה-1
  // ("IDENTICAL" ריק, או דגימת ביניים באמצע מחיקה). חוזה: gen מספר; אם השדה
  // חסר (אפליקציה ישנה) — נפילה חזרה להתנהגות הקודמת.
  const gen0 = await ev(`(function(){ const st = window.__toraApp && window.__toraApp.getState(); return st && typeof st.gen === 'number' ? st.gen : null; })()`);
  const hasGen = typeof gen0 === 'number';
  log(`${label}: מונה דור (gen) ${hasGen ? '=' + gen0 : 'לא נתמך — נפילה ל-polling ישן'}`);
  const inject = URL
    ? `(async () => { const app = window.__toraApp; if (!app) return 'NO_APP'; const ta = document.querySelector('textarea'); if (!ta) return 'NO_TEXTAREA'; ta.value = window.__fx; ta.dispatchEvent(new Event('input', {bubbles:true})); await new Promise(r => setTimeout(r, 400)); app.onExplicitRetypeset(); return 'STARTED'; })()`
    : `(async () => { const app = window.__toraApp; if (!app) return 'NO_APP'; const ta = document.querySelector('textarea'); if (!ta) return 'NO_TEXTAREA'; const text = await (await fetch('/_audit-fixture.txt')).text(); ta.value = text; ta.dispatchEvent(new Event('input', {bubbles:true})); await new Promise(r => setTimeout(r, 400)); app.onExplicitRetypeset(); return 'STARTED'; })()`;
  const r = await ev(inject);
  if (r !== 'STARTED') throw new Error(`${label}: הזרקה נכשלה: ${r}`);
  const t0 = Date.now();
  const pollJs = hasGen
    ? `(function(){ const st = window.__toraApp && window.__toraApp.getState(); return st && typeof st.gen === 'number' && st.gen > ${gen0} && st.hasResult && st.pages > 0 ? 'READY_' + st.pages : 'WAIT'; })()`
    : `(function(){ const st = window.__toraApp && window.__toraApp.getState(); return st && st.hasResult && st.pages > 0 ? 'READY_' + st.pages : 'WAIT'; })()`;
  for (;;) {
    const st = await ev(pollJs);
    if (String(st).startsWith('READY_')) {
      // **S5.2:** המתנה קצרה אחרי READY — הווירטואליזציה של התצוגה מרנדרת את
      // החלון החי בגלילה; בלי המתנה הבדיקה עלולה לראות placeholders טריים.
      await sleep(1200);
      return parseInt(String(st).slice(6), 10);
    }
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
  // **S5.2 (רצפת נפח):** ספירת מילות ה-fixture — בסיס ליחס המילים המרונדרות
  const fixtureWords = fs.readFileSync(FIXTURE, 'utf8').split(/\s+/).filter(Boolean).length;
  // **S5.2 (פריסה מיושנת — cache-bust):** פתיחת ה-HTML עם query ייחודי — אחרת
  // ה-CDN של Pages עשוי להגיש HTML מיושן מהמטמון והבדיקה תרוץ נגד עבר.
  const runId = Date.now();
  const targetUrl = URL
    ? URL + (URL.includes('?') ? '&' : '?') + 't=' + runId
    : `http://127.0.0.1:${PORT}/index.html`;
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

  // **S5.2 (פריסה מיושנת — אמת חמורה, מצב חי בלבד):** sha256 של הבאנדלים הפרוסים
  // (נמשכים בעמוד עצמו עם cache:'reload') מול הבאנדלים בענף — אי-התאמה אחת
  // משמעותה שהאודיט רץ נגד פריסה שאינה main. בנוסף ASSET_VERSION שבפועל
  // במסמך (?v= ב-script src) מול הקבוע ב-red-build/src/ui/browser-entry.js.
  if (URL) {
    const deployed = await ev(`(async function () {
      const appSrc = (document.querySelector('script[src*="app.bundle.js"]') || {}).src || null;
      const verOf = (u) => { const m = String(u || '').match(/[?&]v=([^&]+)/); return m ? m[1] : null; };
      // **S5.2:** גם השליפה עצמה עם ?t= (cache-bust) + cache:'reload' — לא לקבל
      // עותק מיושן מה-CDN/מטמון הדפדפן בדיוק ברגע שבודקים טריות.
      const bust = (u) => String(u) + (String(u).includes('?') ? '&' : '?') + 't=' + '${runId}';
      const sha = async (u) => {
        try {
          const buf = await (await fetch(bust(u), { cache: 'reload' })).arrayBuffer();
          const h = await crypto.subtle.digest('SHA-256', buf);
          let hex = '';
          for (const b of new Uint8Array(h)) hex += b.toString(16).padStart(2, '0');
          return hex;
        } catch (e) { return 'FETCH_FAIL:' + ((e && e.message) || e); }
      };
      const v = verOf(appSrc);
      const appSha = await sha(appSrc || (location.href.replace(/[?#].*$/, '') + 'app.bundle.js'));
      const workerUrl = new URL('engine-worker.bundle.js' + (v ? '?v=' + v : ''), location.href).href;
      const workerSha = await sha(workerUrl);
      return { appSrc, assetVersion: v, appSha, workerSha };
    })()`);
    const shaFile = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    const localAppSha = shaFile(path.join(UI, 'app.bundle.js'));
    const localWorkerSha = shaFile(path.join(UI, 'engine-worker.bundle.js'));
    const entrySrc = fs.readFileSync(path.join(ROOT, 'red-build', 'src', 'ui', 'browser-entry.js'), 'utf8');
    const mV = entrySrc.match(/ASSET_VERSION\s*=\s*'([^']+)'/);
    const localVersion = mV ? mV[1] : null;
    log(`באנדלים (חי):  app ${String(deployed.appSha).slice(0, 16)}… | worker ${String(deployed.workerSha).slice(0, 16)}… | ASSET_VERSION ${deployed.assetVersion || '—'}`);
    log(`באנדלים (main): app ${localAppSha.slice(0, 16)}… | worker ${localWorkerSha.slice(0, 16)}… | ASSET_VERSION ${localVersion || '—'}`);
    let stale = false;
    if (deployed.appSha !== localAppSha || deployed.workerSha !== localWorkerSha) {
      console.error('✗ הפריסה החיה מיושנת — הבאנדל הפרוס אינו תואם ל-main');
      console.error(`  app.bundle.js:           פרוס ${deployed.appSha}`);
      console.error(`                          main  ${localAppSha}`);
      console.error(`  engine-worker.bundle.js: פרוס ${deployed.workerSha}`);
      console.error(`                          main  ${localWorkerSha}`);
      stale = true;
    }
    if (localVersion && deployed.assetVersion && deployed.assetVersion !== localVersion) {
      console.error(`✗ ASSET_VERSION במסמך (${deployed.assetVersion}) ≠ במקור (${localVersion}) — ה-HTML הפרוס מיושן`);
      stale = true;
    }
    if (!localVersion || !deployed.assetVersion) {
      log(`⚠ לא ניתן להשוות ASSET_VERSION (פרוס: ${deployed.assetVersion || '—'}, מקור: ${localVersion || '—'}) — ממשיכים על סמך sha256 בלבד`);
    }
    if (stale) throw new Error('הפריסה החיה מיושנת — הבאנדל הפרוס אינו תואם ל-main (ראה טביעות sha256 למעלה)');
  }

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

  // **S5.2 (רצפת נפח):** כיסוי מלא של הספר כולו — לא רק "0 בעיות במה שכן רונדר".
  // עמודים: הקורפוס הקנוני 704 (רצפה 690 — נדיבה בכוונה לשינויי TOC/הערות-סיום
  // של המנוע). מילים: ספירת הדוח (שורות+הערות+פסים+TOC) מול ה-fixture ביחס
  // ≥0.98 — תופס מנוע שמדלג תוכן שלם בשקט.
  const floorFail = [];
  if (!(pages1 >= EXPECTED_PAGES_MIN)) floorFail.push(`עמודים ${pages1} < רצפת המינימום ${EXPECTED_PAGES_MIN}`);
  const totalWords = s.totalWords || 0;
  if (!(totalWords >= EXPECTED_WORDS_MIN_RATIO * fixtureWords)) {
    floorFail.push(`מילים מרונדרות ${totalWords.toLocaleString()} < ${Math.round(EXPECTED_WORDS_MIN_RATIO * fixtureWords).toLocaleString()} (= ${EXPECTED_WORDS_MIN_RATIO} × ${fixtureWords.toLocaleString()} מילות ה-fixture)`);
  }
  if (floorFail.length) {
    console.error('✗ רצפת הנפח נכשלה — הספר התקצר בשקט (ספר שחסר תוכן אינו יכול להיות "0 בעיות"):');
    for (const f of floorFail) console.error('  - ' + f);
    try { await ab(['close']); } catch (e) {}
    if (server) server.close();
    process.exit(1);
  }
  log(`רצפת נפח ✓: ${pages1} עמודים (≥${EXPECTED_PAGES_MIN}) | ${totalWords.toLocaleString()} מילים (≥${Math.round(EXPECTED_WORDS_MIN_RATIO * fixtureWords).toLocaleString()})`);
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
  console.log(`pages: ${s.pages}/${s.slots} | lines: ${(s.totalLines || 0).toLocaleString()} | words: ${(s.totalWords || 0).toLocaleString()} | problems: ${s.problems}`);
  console.log(`counts: ${JSON.stringify(st.counts || {})}`);
  console.log(`determinism: ${detIdentical ? 'IDENTICAL' : 'DIFFERENCES!'}`);
  console.log(`reports: ${OUT}`);
  console.log(ok ? '✓ PASS — 0 בעיות + דטרמיניזם מלא' : '✗ FAIL — נדרשות 0 בעיות');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(String(e && e.stack || e)); try { ab(['close']); } catch (x) {} if (server) server.close(); process.exit(2); });
