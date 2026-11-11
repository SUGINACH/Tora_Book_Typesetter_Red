#!/usr/bin/env node
// tools/baseline/run-baseline.js — שלב 0 (G0): baseline מזוהה וניתן לשחזור (סוכן 4)
//
// מריץ בפועל את כל מה שהתוכנית (§4 שלב 0) דורשת שניתן להריץ בלי דפדפן, ושומר
// פלט מלא לכל פקודה גם כשהיא נכשלת:
//   1. זיהוי: commit, ענף, תאריך, גרסאות Node/npm/poppler/Python/PyMuPDF/Chrome, גופנים.
//   2. טביעת אצבע (sha256) לכל קובץ קלט מרכזי (קורפוסים, ייחוס, הגדרות, חבילות UI).
//   3. כל פקודה בשרשרת `npm test` בנפרד (בלי עצירה בכשל ראשון), עם CI=true — כמו ב-CI:
//      דילוג = כשל. ספירה לפי הסיכום שכל קובץ מדפיס (ראו "מה נספר" ב-BASELINE.md).
//   4. דטרמיניזם: הסקריפט הרשמי + שתי ריצות בתהליכים נפרדים על הקורפוס הקנוני.
//   5. (--parity) צנרת layout-parity כמו ב-workflow: חילוץ ייחוס, RED בנתיב החי, השוואה,
//      ורצפת ה-ratchet; והקורפוס הארוך מאוד עם דטרמיניזם כפול + C1..C12.
//   6. סחף artifacts שהבדיקות עצמן כותבות לתוך עץ ה-git (נרשם ואז משוחזר, אלא אם --keep-artifacts).
//
// אינו משנה קוד מנוע. אפס תלויות (Node בלבד). full-math-audit דורש דפדפן ורץ רק ב-Actions —
// ראיית ה-CI שלו נרשמת ב-BASELINE.md, לא כאן.
//
// שימוש (משורש הריפו):
//   node tools/baseline/run-baseline.js [--parity] [--out <dir>] [--keep-artifacts] [--skip-suite]
// ברירת מחדל ליעד: audits/baseline/<sha7>/   (manifest.json + logs/ + parity/)
// יציאה: 0 הכול תקין | 1 כשל בדיקה/דילוג/אי-דטרמיניזם/כשל HARD/ירידה מתחת לרצפת ה-parity.
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const RED = path.join(ROOT, 'red-build');
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

const git = (args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
const HEAD = git(['rev-parse', 'HEAD']).stdout.trim();
const OUT = path.resolve(ROOT, opt('--out', path.join('audits', 'baseline', HEAD.slice(0, 7))));
const LOGS = path.join(OUT, 'logs');
fs.mkdirSync(LOGS, { recursive: true });

const sh = (cmd, o = {}) => spawnSync('bash', ['-c', cmd], { encoding: 'utf8', maxBuffer: 1 << 30, ...o });
const sha256 = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');
const writeLog = (name, text) => fs.writeFileSync(path.join(LOGS, name), text);

/** גרסת כלי: שורה ראשונה של הפלט, או 'not installed' אם הפקודה נכשלה. */
function toolVersion(cmd) {
  const r = sh(`${cmd} 2>&1`);
  return r.status === 0 ? String(r.stdout || '').split('\n')[0].trim() : 'not installed';
}

function fileInfo(f) {
  const shown = f.startsWith(ROOT) ? rel(f) : f;
  try {
    const st = fs.statSync(f);
    return { path: shown, bytes: st.size, sha256: sha256(f) };
  } catch (e) {
    return { path: shown, missing: true };
  }
}

// ───────────────────────── 1. זיהוי ─────────────────────────
function collectEnv() {
  return {
    commit: HEAD,
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim(),
    dirtyTrackedBeforeRun: git(['status', '--porcelain', '--untracked-files=no']).stdout.split('\n').filter(Boolean),
    dateUtc: new Date().toISOString(),
    runner: {
      node: process.version,
      npm: toolVersion('npm -v'),
      os: `${os.type()} ${os.release()} ${os.arch()}`,
      cpus: os.cpus().length,
      memMB: Math.round(os.totalmem() / 2 ** 20),
      ciFlag: !!process.env.CI,
    },
    tools: {
      pdfinfo: toolVersion('pdfinfo -v'),
      pdftotext: toolVersion('pdftotext -v'),
      python: toolVersion('python3 --version'),
      pymupdf: toolVersion('python3 -c "import pymupdf; print(pymupdf.__version__)"'),
      chrome: toolVersion('google-chrome --version'),
    },
    fonts: { dejavuSans: fileInfo('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf') },
  };
}

// ───────────────────────── 2. קלטים ─────────────────────────
function collectInputs() {
  const files = [
    'audits/very_long_test_text.txt', 'audits/long_test_text.txt', 'audits/mid_long_test_text.txt',
    'audits/no_long_test_text.txt', 'audits/long_test_text_no_parentheses.txt', 'audits/layout-reference.json',
    'red-build/tests/fixtures/canonical_corpus.txt', 'red-build/tests/fixtures/imud_default_text.txt',
    'red-build/tests/fixtures/imud_default_settings.json', 'red-build/ui/assets/imud/default_settings.json',
    'red-build/tests/artifacts/parity-baseline.json', 'red-build/package.json',
    'red-build/ui/app.bundle.js', 'red-build/ui/engine-worker.bundle.js',
  ].map((f) => path.join(ROOT, f));
  const addDir = (dir, pick) => {
    if (!fs.existsSync(dir)) return;
    for (const n of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, n);
      if (fs.statSync(p).isFile() && pick(n)) files.push(p);
    }
  };
  addDir(path.join(RED, 'tests', 'fixtures', 'real'), () => true);
  addDir(path.join(ROOT, 'audits'), (n) => n.toLowerCase().endsWith('.pdf'));
  return files.map(fileInfo);
}

// ───────────────────────── 3. סוויטת Node ─────────────────────────
// שלוש תבניות סיכום קיימות בקבצים: "P/N passed, F failed, S skipped" (harness),
// "P/N passed, F failed" (d89) ו-"P passed, F failed" (s14).
const SUMMARY = /== (.+?): (\d+)(?:\/(\d+))? passed, (\d+) failed(?:, (\d+) skipped)? ==/g;

function runSuite() {
  const pkg = JSON.parse(fs.readFileSync(path.join(RED, 'package.json'), 'utf8'));
  const cmds = pkg.scripts.test.split(' && ');
  const rows = [];
  cmds.forEach((cmd, i) => {
    const t0 = Date.now();
    const r = sh(cmd, { cwd: RED, env: { ...process.env, CI: 'true' } });
    const out = (r.stdout || '') + (r.stderr || '');
    const logName = `${String(i + 1).padStart(2, '0')}-${cmd.replace(/^node (\.\.\/)?/, '').replace(/[\\/]/g, '_')}.log`;
    writeLog(logName, out);
    const all = [...out.matchAll(SUMMARY)];
    const last = all.length ? all[all.length - 1] : null;
    const row = { n: i + 1, cmd: cmd.replace(/^node /, ''), exit: r.status, ms: Date.now() - t0, log: `logs/${logName}` };
    if (last) {
      Object.assign(row, {
        title: last[1], passed: +last[2], failed: +last[4],
        skipped: last[5] != null ? +last[5] : 0, skippedReported: last[5] != null,
      });
    } else {
      const v = out.match(/(\d+) violations/);
      if (v) row.violations = +v[1];
    }
    if (r.status !== 0) row.failLines = out.split('\n').filter((l) => /FAIL|✗|Error/.test(l)).slice(0, 10);
    rows.push(row);
    const counts = last ? `${row.passed}p/${row.failed}f/${row.skipped}s` : (row.violations != null ? `${row.violations} violations` : 'n/a');
    console.log(`${r.status === 0 ? 'OK  ' : 'FAIL'} ${String(row.ms).padStart(7)}ms ${counts.padStart(14)}  ${row.cmd}`);
  });
  const counted = rows.filter((r) => r.passed != null);
  return {
    rows,
    totals: {
      commands: rows.length,
      withCounter: counted.length,
      passed: counted.reduce((a, r) => a + r.passed, 0),
      failed: counted.reduce((a, r) => a + r.failed, 0),
      skipped: counted.reduce((a, r) => a + r.skipped, 0),
      nonZeroExit: rows.filter((r) => r.exit !== 0).length,
      wallMs: rows.reduce((a, r) => a + r.ms, 0),
    },
  };
}

// ───────────────────────── 4. דטרמיניזם ─────────────────────────
const DET_SCRIPT = "const{typeset}=require('./src/engine/core/pipeline');const{getDefaultSettings}=require('./src/engine/core/settings-registry');" +
  "const fs=require('fs');const t=fs.readFileSync('tests/fixtures/canonical_corpus.txt','utf8');const a=typeset(t,getDefaultSettings());" +
  'console.log(JSON.stringify({layoutHash:a.layoutHash,pages:a.pages.length}))';

function runDeterminism() {
  const official = sh('npm run --silent test:determinism', { cwd: RED, env: { ...process.env, CI: 'true' } });
  writeLog('determinism-official.log', (official.stdout || '') + (official.stderr || ''));
  const runs = [1, 2].map(() => {
    const r = spawnSync('node', ['-e', DET_SCRIPT], { cwd: RED, encoding: 'utf8' });
    try { return JSON.parse(String(r.stdout).trim().split('\n').pop()); } catch (e) { return { error: String(r.stderr || e).slice(0, 300) }; }
  });
  writeLog('determinism-cross-process.log', JSON.stringify(runs, null, 2) + '\n');
  const equal = !!runs[0].layoutHash && runs[0].layoutHash === runs[1].layoutHash && runs[0].pages === runs[1].pages;
  console.log(`${official.status === 0 && equal ? 'OK  ' : 'FAIL'} determinism  official exit=${official.status}  cross-process ${equal ? 'IDENTICAL' : 'DIFFERENT'}  ${runs[0].layoutHash || '?'} pages=${runs[0].pages}`);
  return { officialExit: official.status, officialOutput: String(official.stdout || '').trim().split('\n').pop(), crossProcess: runs, crossProcessIdentical: equal };
}

// ───────────────────────── 5. layout-parity (כמו ב-workflow) ─────────────────────────
function runParity() {
  const dir = path.join(OUT, 'parity');
  fs.mkdirSync(dir, { recursive: true });
  const steps = [];
  const step = (name, cmd) => {
    const t0 = Date.now();
    const r = sh(cmd, { cwd: ROOT });
    writeLog(`parity-${name}.log`, (r.stdout || '') + (r.stderr || ''));
    const s = { name, cmd, exit: r.status, ms: Date.now() - t0, log: `logs/parity-${name}.log` };
    steps.push(s);
    console.log(`${r.status === 0 ? 'OK  ' : (name === 'compare' && r.status === 2 ? 'GAPS' : 'FAIL')} ${String(s.ms).padStart(7)}ms  parity/${name} (exit ${r.status})`);
    return s;
  };
  const A = path.join(ROOT, 'audits', 'layout-parity-artifacts');
  const V = path.join(ROOT, 'audits', 'very-long-artifacts');
  const copyJson = (src, name) => { if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, name)); };

  step('extract-reference', 'python3 tools/layout-parity/extract-reference.py');
  const drift = sh('git diff --exit-code --stat -- audits/layout-reference.json', { cwd: ROOT });
  const referenceDeterministic = drift.status === 0;
  if (!referenceDeterministic) sh('git checkout -- audits/layout-reference.json', { cwd: ROOT });

  step('run-ours', 'node tools/layout-parity/run-ours.js');
  const cmp = step('compare', 'python3 tools/layout-parity/compare.py audits/layout-reference.json audits/layout-parity-artifacts/ours-model.json audits/layout-parity-artifacts/ours.pdf audits/layout-parity-artifacts/parity-report.json');
  copyJson(path.join(A, 'parity-report.json'), 'parity-report.json');

  let score = null; let floor = null; let summary = null;
  try {
    summary = JSON.parse(fs.readFileSync(path.join(A, 'parity-report.json'), 'utf8')).summary;
    score = summary.score;
    floor = JSON.parse(fs.readFileSync(path.join(RED, 'tests', 'artifacts', 'parity-baseline.json'), 'utf8')).score * 100;
  } catch (e) { /* ידווח כ-null */ }

  step('run-ours-very-long', 'node tools/layout-parity/run-ours.js audits/very_long_test_text.txt audits/very-long-artifacts --determinism --html');
  step('verify-corpus', 'python3 tools/layout-parity/verify-corpus.py audits/very_long_test_text.txt audits/very-long-artifacts/ours-model.json audits/very-long-artifacts/ours.pdf audits/very-long-artifacts/corpus-report.json audits/very-long-artifacts/ours.html');
  copyJson(path.join(V, 'corpus-report.json'), 'corpus-report.json');

  const artifacts = [
    path.join(A, 'ours-model.json'), path.join(A, 'ours.pdf'), path.join(A, 'parity-report.json'),
    path.join(V, 'ours-model.json'), path.join(V, 'ours.pdf'), path.join(V, 'ours.html'), path.join(V, 'corpus-report.json'),
  ].map(fileInfo);

  // קודי compare.py: 0 תקין | 1 כשל HARD | 2 כשל PARITY | 3 שניהם. ה-workflow קובע: HARD קטלני; PARITY לא חוסם.
  const hardFail = cmp.exit === 1 || cmp.exit === 3;
  const ratchetOk = score != null && floor != null ? score >= floor : null;
  return {
    steps, referenceDeterministic, compareExit: cmp.exit, hardFail, parityGapsRemain: cmp.exit === 2 || cmp.exit === 3,
    score, ratchetFloor: floor, ratchetOk, summary, artifacts,
  };
}

// ───────────────────────── 6. סחף artifacts שהבדיקות כותבות ─────────────────────────
function trackedDrift() {
  const changed = git(['status', '--porcelain', '--untracked-files=no']).stdout.split('\n').filter(Boolean);
  const numstat = git(['diff', '--numstat']).stdout.trim().split('\n').filter(Boolean);
  writeLog('tracked-artifact-drift.patch', sh("git diff -- . ':(exclude)*.pdf'", { cwd: ROOT }).stdout || '');
  if (!flag('--keep-artifacts')) sh('git checkout -- red-build/tests/artifacts', { cwd: ROOT });
  return { changedTrackedFiles: changed, numstat, restored: !flag('--keep-artifacts') };
}

// ───────────────────────── main ─────────────────────────
const manifest = { schema: 'red-baseline-v1', env: collectEnv(), inputs: collectInputs() };
console.log(`baseline @ ${manifest.env.commit.slice(0, 7)} (${manifest.env.branch}) — node ${manifest.env.runner.node} — ${manifest.env.dateUtc}`);
if (manifest.env.dirtyTrackedBeforeRun.length) console.warn(`⚠ העץ אינו נקי לפני ההרצה: ${manifest.env.dirtyTrackedBeforeRun.join(', ')}`);

if (!flag('--skip-suite')) {
  manifest.suite = runSuite();
  manifest.determinism = runDeterminism();
}
if (flag('--parity')) manifest.parity = runParity();
manifest.trackedDrift = trackedDrift();

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const bad = [];
if (manifest.suite) {
  const t = manifest.suite.totals;
  console.log(`\nTOTAL: ${t.passed} passed, ${t.failed} failed, ${t.skipped} skipped | ${t.nonZeroExit}/${t.commands} commands non-zero | ${t.withCounter}/${t.commands} with counter | ${(t.wallMs / 1000).toFixed(1)}s`);
  if (t.failed || t.skipped || t.nonZeroExit) bad.push('suite');
  if (manifest.determinism.officialExit !== 0 || !manifest.determinism.crossProcessIdentical) bad.push('determinism');
}
if (manifest.parity) {
  const p = manifest.parity;
  console.log(`PARITY: score=${p.score} floor=${p.ratchetFloor} hardFail=${p.hardFail} gapsRemain=${p.parityGapsRemain} referenceDeterministic=${p.referenceDeterministic}`);
  if (p.hardFail || p.ratchetOk === false || !p.referenceDeterministic || p.steps.some((s) => s.name !== 'compare' && s.exit !== 0)) bad.push('parity');
}
console.log(`manifest → ${rel(path.join(OUT, 'manifest.json'))}${bad.length ? `  | ✗ ${bad.join(', ')}` : ''}`);
process.exitCode = bad.length ? 1 : 0;
