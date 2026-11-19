#!/usr/bin/env node
// tools/run-tests.js — runner שמגלה בדיקות (D-110; סוכן 4 — תשתית בדיקות)
//
// למה: `npm test` ו-`npm run test:regress` היו שרשראות ידניות ב-`red-build/package.json` (`node a && node b && …`).
// כל PR שהוסיף קובץ בדיקה ערך את אותה שורה ⇒ התנגשויות חוזרות בכל מיזוג (O-9), ובדיקה שנוספה לעץ בלי להיכנס לשרשרת
// לא רצה בשום מקום (מוקש שכבר נתפס פעם בסקירה — ci.yml, הערת S5.3). הכלי הזה מגלה את הקבצים בעצמו: מוסיפים
// `tests/<קבוצה>/<שם>.test.js` ואין מה לערוך — לא ב-package.json ולא ב-workflow.
//
// שימוש (מתוך red-build/, כמו ב-CI):
//   node ../tools/run-tests.js                       סוויטת `main`: כל tests/**/*.test.js חוץ מ-tests/regress/ + צעדי כלי (scan-control-triggers)
//   node ../tools/run-tests.js --suite regress       tests/regress/**/*.test.js  (הצעד "Regression repros" ב-CI)
//   node ../tools/run-tests.js --suite all           שתיהן — לפי הסדר main ואז regress (run-baseline.js)
//   --only a,b       רק צעדים שנתיבם מכיל אחד מהמחרוזות (לפיתוח:  npm test -- --only s10-ui)
//   --bail           עצירה בכשל הראשון (כמו `&&` בשרשרת הישנה); ברירת המחדל: להריץ הכול ולדווח את כל הכשלים בסוף
//   --json <file>    כתיבת תוצאות מכונתיות (סכמה red-run-tests-v1)
//   --list | --list-json    הדפסת התכנית (הקבצים לפי סדר ההרצה) בלי להריץ
//   --check          שומר-כיסוי בלבד: קבצי JS ב-tests/ שנראים כבדיקה (משתמשים ב-harness / describe) אך אינם `*.test.js` —
//                    "בדיקה יתומה" שלא תרוץ בשום מקום; קוד יציאה 1 אם נמצא כזה. השומר רץ גם בראש כל הרצה מלאה (בלי --only)
//   --root <dir>     שורש red-build חלופי (לבדיקות של הכלי עצמו) · --no-extra  בלי צעדי הכלי
//
// סדר ההרצה: לפי קבוצה (unit → integration → layout → e2e → audit, ואחריהן קבוצות אחרות לפי שם), בתוך קבוצה — סדר טבעי
// (s7 לפני s10). הסדר דטרמיניסטי ואינו תלוי ב-locale או במערכת הקבצים. הבדיקות אינן תלויות זו בזו (אומת: אותן ספירות בכל קובץ).
//
// מה לא משתנה: כל קובץ רץ כ-`node <נתיב>` עם cwd=red-build ואותה סביבה (כולל CI) — כמו בשרשרת; פלט הקובץ מועבר כמות שהוא
// (שורות הסיכום `== כותרת: N passed, F failed ==` שה-CI ו-compare-with-ci.js קוראים נשארות זהות). קוד היציאה = 0 רק אם כל
// הצעדים הצליחו.
//
// מה נוסף (קשיחות, לא החלשה): (1) קובץ בדיקה שלא הדפיס שורת סיכום נחשב כשל ("בדיקה שקטה" — 0 בדיקות עוברות לא ירוק);
// (2) קובץ שדיווח על כשלים אך יצא 0 — כשל; (3) הרצת הכול גם אחרי כשל (אפשר --bail).
//
// אפס תלויות. קוד יציאה: 0 תקין | 1 כשל בדיקה/שומר | 2 שגיאת שימוש.
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_ROOT = path.resolve(__dirname, '..', 'red-build');
const SCHEMA = 'red-run-tests-v1';
/** קבוצות לפי סדר ההרצה (מהיסודי/מהיר אל הכבד); קבוצה אחרת — אחרי אלה, לפי שם. */
const GROUP_ORDER = ['unit', 'integration', 'layout', 'e2e', 'audit'];
/** צעדי כלי (לא `*.test.js`) שהשרשרת הישנה הריצה אחרי הבדיקות — נתיב יחסית ל-red-build. אין דרישת שורת סיכום. */
const EXTRA_STEPS = ['../tools/scan-control-triggers.js'];
/** שלוש תבניות הסיכום שבקבצים (harness: "P/N passed, F failed, S skipped"; d89: בלי skipped; s14: "P passed, F failed"). */
const SUMMARY = /== (.+?): (\d+)(?:\/(\d+))? passed, (\d+) failed(?:, (\d+) skipped)? ==/g;
const SUITES = ['main', 'regress', 'all'];
const ORPHAN_MSG = 'נראה כבדיקה (harness/describe) אך אינו *.test.js — לא יתגלה ולא ירוץ בשום מקום. שנו את השם ל-*.test.js (או העבירו עוזר ל-lib/)';

// ───────────────────────── גילוי וסדר ─────────────────────────
/** השוואה "טבעית" בלי תלות ב-locale: מקטעי ספרות לפי ערך (s7 < s10), כל השאר לפי קוד תו. */
function naturalCompare(a, b) {
  const ax = String(a).split(/(\d+)/);
  const bx = String(b).split(/(\d+)/);
  const n = Math.min(ax.length, bx.length);
  for (let i = 0; i < n; i++) {
    if (ax[i] === bx[i]) continue;
    if (i % 2 === 1) {
      const d = Number(ax[i]) - Number(bx[i]);
      if (d !== 0) return d;
      return ax[i].length - bx[i].length || (ax[i] < bx[i] ? -1 : 1);
    }
    return ax[i] < bx[i] ? -1 : 1;
  }
  return ax.length - bx.length;
}

const groupOf = (rel) => { const p = rel.split('/'); return p.length > 2 ? p[1] : ''; }; // tests/<group>/...
function compareFiles(a, b) {
  const ia = GROUP_ORDER.indexOf(groupOf(a));
  const ib = GROUP_ORDER.indexOf(groupOf(b));
  return (ia < 0 ? GROUP_ORDER.length : ia) - (ib < 0 ? GROUP_ORDER.length : ib) || naturalCompare(a, b);
}

/** כל הקבצים תחת tests/ (נתיבים יחסית ל-root, עם `/`), בלי node_modules ובלי קבצים/תיקיות נסתרים. */
function walk(root) {
  const out = [];
  const rec = (abs, rel) => {
    let entries;
    try { entries = fs.readdirSync(abs, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) rec(path.join(abs, e.name), r);
      else if (e.isFile()) out.push(r);
    }
  };
  rec(path.join(root, 'tests'), 'tests');
  return out;
}

const isTestFile = (f) => f.endsWith('.test.js');
const isRegress = (f) => f.startsWith('tests/regress/');

/** קבצי הבדיקה שהתגלו, מחולקים לסוויטות (הסדר = סדר ההרצה). */
function discover(opts = {}) {
  const root = path.resolve(opts.root || DEFAULT_ROOT);
  const tests = walk(root).filter(isTestFile);
  return {
    root,
    main: tests.filter((f) => !isRegress(f)).sort(compareFiles),
    regress: tests.filter(isRegress).sort(naturalCompare),
  };
}

/** תכנית ההרצה: [{ file, kind: 'test'|'tool', suite }] לפי הסדר. */
function plan(opts = {}) {
  const suite = opts.suite || 'main';
  if (!SUITES.includes(suite)) throw new Error(`suite לא מוכר: ${suite} (מותר: ${SUITES.join(' | ')})`);
  const d = discover(opts);
  const steps = [];
  if (suite === 'main' || suite === 'all') {
    d.main.forEach((file) => steps.push({ file, kind: 'test', suite: 'main' }));
    if (opts.extra !== false) EXTRA_STEPS.forEach((file) => steps.push({ file, kind: 'tool', suite: 'main' }));
  }
  if (suite === 'regress' || suite === 'all') d.regress.forEach((file) => steps.push({ file, kind: 'test', suite: 'regress' }));
  const only = (opts.only || []).filter(Boolean);
  return only.length ? steps.filter((s) => only.some((o) => s.file.includes(o))) : steps;
}

/**
 * שומר-כיסוי: קובץ JS תחת tests/ שנראה כבדיקה (משתמש ב-harness או קורא ל-describe) אך אינו `*.test.js` — לא יתגלה ולא ירוץ
 * בשום מקום ("בדיקה יתומה"). לא נבדקים: tests/harness.js עצמו ותיקיות עוזרים/נתונים (lib/, fixtures/, artifacts/).
 * עוזר רגיל (בלי harness ובלי describe) מותר בכל מקום.
 */
const LOOKS_LIKE_TEST = /require\(\s*['"][^'"]*harness(?:\.js)?['"]\s*\)|(?:^|[^\w.])describe\s*\(/m;
function orphans(opts = {}) {
  const root = path.resolve(opts.root || DEFAULT_ROOT);
  const skip = (f) => f === 'tests/harness.js' || /(^|\/)(lib|fixtures|artifacts)\//.test(f);
  return walk(root)
    .filter((f) => /\.(js|mjs|cjs)$/.test(f) && !isTestFile(f) && !skip(f))
    .filter((f) => { try { return LOOKS_LIKE_TEST.test(fs.readFileSync(path.join(root, f), 'utf8')); } catch (e) { return false; } })
    .sort(naturalCompare);
}

// ───────────────────────── הרצה ─────────────────────────
function runStep(step, root, env, echo) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let out = '';
    let settled = false;
    const done = (r) => { if (!settled) { settled = true; resolve({ ms: Date.now() - t0, out, ...r }); } };
    let child;
    try {
      child = spawn(process.execPath, [step.file], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { done({ exit: null, signal: null, error: String(e && e.message || e) }); return; }
    child.stdout.on('data', (d) => { out += d; if (echo) process.stdout.write(d); });
    child.stderr.on('data', (d) => { out += d; if (echo) process.stderr.write(d); });
    child.on('error', (e) => done({ exit: null, signal: null, error: String(e && e.message || e) }));
    child.on('close', (code, signal) => done({ exit: code, signal }));
  });
}

/** פענוח פלט צעד לתוצאה: ספירות מכל שורות הסיכום + בעיות (כל בעיה = כשל). */
function evaluate(step, r, opts = {}) {
  const summaries = [...r.out.matchAll(SUMMARY)].map((m) => ({
    title: m[1], passed: +m[2], failed: +m[4], skipped: m[5] != null ? +m[5] : 0,
  }));
  const sum = (k) => summaries.reduce((a, s) => a + s[k], 0);
  const res = {
    file: step.file, kind: step.kind, suite: step.suite, exit: r.exit, ms: r.ms,
    summaries, passed: sum('passed'), failed: sum('failed'), skipped: sum('skipped'), problems: [],
  };
  if (r.error) res.problems.push(`הרצה נכשלה: ${r.error}`);
  else if (r.exit == null) res.problems.push(`הסתיים באות ${r.signal || '?'}`);
  else if (r.exit !== 0) res.problems.push(`קוד יציאה ${r.exit}`);
  if (step.kind === 'test') {
    if (!summaries.length && opts.requireSummary !== false) {
      res.problems.push('לא הודפסה שורת סיכום "== כותרת: N passed, F failed ==" — בדיקה שקטה אינה נספרת (השתמשו ב-report של tests/harness.js)');
    }
    if (res.failed > 0 && r.exit === 0) res.problems.push(`דווחו ${res.failed} כשלים אך קוד היציאה 0`);
  }
  res.ok = res.problems.length === 0;
  return res;
}

async function run(steps, opts = {}) {
  const root = path.resolve(opts.root || DEFAULT_ROOT);
  const env = opts.env || process.env;
  const echo = opts.echo !== false;
  const results = [];
  const t0 = Date.now();
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (echo) process.stdout.write(`\n▶ [${i + 1}/${steps.length}] ${step.file}\n`);
    const res = evaluate(step, await runStep(step, root, env, echo), opts);
    results.push(res);
    if (!res.ok && opts.bail) break;
  }
  const tests = results.filter((r) => r.kind === 'test');
  const totals = {
    steps: results.length,
    files: tests.length,
    passed: results.reduce((a, r) => a + r.passed, 0),
    failed: results.reduce((a, r) => a + r.failed, 0),
    skipped: results.reduce((a, r) => a + r.skipped, 0),
    problems: results.filter((r) => !r.ok).length,
    orphans: 0,
  };
  return { schema: SCHEMA, suite: opts.suite || 'main', root: path.basename(root), node: process.version, ci: !!process.env.CI,
    ms: Date.now() - t0, planned: steps.length, bailed: !!opts.bail && results.length < steps.length, totals, results, ok: totals.problems === 0 };
}

function printTable(rep) {
  const w = Math.max(...rep.results.map((r) => r.file.length), 10);
  console.log(`\n──────── run-tests · suite=${rep.suite} · ${rep.results.length}/${rep.planned} צעדים ────────`);
  for (const r of rep.results) {
    const cnt = r.kind === 'tool' ? 'כלי' : `${r.passed}p/${r.failed}f/${r.skipped}s`;
    console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${String(r.ms).padStart(7)}ms ${cnt.padStart(12)}  ${r.file.padEnd(w)}`);
  }
  const t = rep.totals;
  const bad = rep.results.filter((r) => !r.ok);
  for (const r of bad) console.log(`✗ ${r.file}: ${r.problems.join(' · ')}`);
  for (const f of (rep.guard && rep.guard.orphans) || []) console.log(`✗ ${f}: ${ORPHAN_MSG}`);
  console.log(`RUN-TESTS ${rep.ok ? 'OK' : 'FAILED'} — suite=${rep.suite} steps=${t.steps}/${rep.planned} files=${t.files} passed=${t.passed} failed=${t.failed} skipped=${t.skipped} problems=${t.problems} orphans=${t.orphans} wall=${(rep.ms / 1000).toFixed(1)}s`);
}

// ───────────────────────── CLI ─────────────────────────
function parseArgs(argv) {
  const o = { suite: 'main', only: [], bail: false, list: false, listJson: false, check: false, extra: true, json: null, root: null };
  const need = (i, n) => { if (i + 1 >= argv.length) throw new Error(`הדגל ${n} דורש ערך`); return argv[i + 1]; };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--suite') { o.suite = need(i, a); i++; }
    else if (a === '--only') { o.only = need(i, a).split(',').map((s) => s.trim()).filter(Boolean); i++; }
    else if (a === '--json') { o.json = need(i, a); i++; }
    else if (a === '--root') { o.root = need(i, a); i++; }
    else if (a === '--bail') o.bail = true;
    else if (a === '--list') o.list = true;
    else if (a === '--list-json') o.listJson = true;
    else if (a === '--check') o.check = true;
    else if (a === '--no-extra') o.extra = false;
    else if (a === '--help' || a === '-h') o.help = true;
    else throw new Error(`דגל לא מוכר: ${a}`);
  }
  if (!SUITES.includes(o.suite)) throw new Error(`suite לא מוכר: ${o.suite} (מותר: ${SUITES.join(' | ')})`);
  return o;
}

/** כותרת הקובץ (בלוק ההערות הראשון) כטקסט עזרה. */
function helpText() {
  const out = [];
  for (const l of fs.readFileSync(__filename, 'utf8').split('\n')) {
    if (l.startsWith('#!')) continue;
    if (!l.startsWith('//')) break;
    out.push(l.replace(/^\/\/ ?/, ''));
  }
  return out.join('\n');
}

async function main(argv) {
  let o;
  try { o = parseArgs(argv); } catch (e) {
    console.error(`run-tests: ${e.message}\nשימוש: node tools/run-tests.js [--suite main|regress|all] [--only a,b] [--bail] [--json out] [--list|--list-json] [--check]`);
    return 2;
  }
  if (o.help) { console.log(helpText()); return 0; }
  const base = { root: o.root, suite: o.suite, only: o.only, extra: o.extra };

  if (o.check) {
    const d = discover(base);
    const orph = orphans(base);
    console.log(`run-tests --check: root=${path.basename(d.root)} · main=${d.main.length} · regress=${d.regress.length} · בדיקות יתומות=${orph.length}`);
    for (const f of orph) console.log(`✗ ${f}: ${ORPHAN_MSG}`);
    if (!d.main.length) { console.log('✗ לא התגלה אף קובץ בדיקה בסוויטת main'); return 1; }
    return orph.length ? 1 : 0;
  }

  const steps = plan(base);
  if (o.list || o.listJson) {
    if (o.listJson) console.log(JSON.stringify({ schema: SCHEMA, suite: o.suite, steps }, null, 2));
    else steps.forEach((s) => console.log(s.file));
    return 0;
  }
  if (!steps.length) { console.error(`run-tests: אין צעדים להרצה (suite=${o.suite}${o.only.length ? `, only=${o.only.join(',')}` : ''})`); return 2; }

  const rep = await run(steps, { root: o.root, suite: o.suite, bail: o.bail });
  // שומר-כיסוי בכל הרצה מלאה: בדיקה יתומה = כשל (גם אם כל הצעדים שרצו ירוקים)
  rep.guard = { orphans: o.only.length ? [] : orphans(base) };
  if (rep.guard.orphans.length) { rep.ok = false; rep.totals.orphans = rep.guard.orphans.length; }
  printTable(rep);
  if (o.json) fs.writeFileSync(path.resolve(o.json), JSON.stringify(rep, null, 2) + '\n');
  return rep.ok ? 0 : 1;
}

module.exports = { SCHEMA, SUITES, GROUP_ORDER, EXTRA_STEPS, SUMMARY, naturalCompare, compareFiles, walk, discover, plan, orphans, evaluate, run, parseArgs };

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (e) => { console.error(e && e.stack || e); process.exitCode = 2; });
}
