#!/usr/bin/env node
/**
 * tools/baseline/compare-with-ci.js — השוואה מכונתית "מקומי ↔ CI" של ה-baseline.
 * (סוכן 4 — תשתית בדיקות; אפס תלויות; לא נוגע בקוד המנוע)
 *
 * למה: טענת "הריצה המקומית זהה ל-CI" היא הבסיס לאמון ב-baseline. במקום לטעון אותה
 * בעל-פה — הסקריפט הזה מחשב אותה מתוך הקבצים שבחבילה ומדפיס שוויון/פער לכל פריט.
 *
 * שימוש:
 *   node tools/baseline/compare-with-ci.js audits/baseline/<sha7>
 *
 * קלט (בתוך תיקיית ה-baseline, שנוצרה ע"י run-baseline.js + לוגי CI שהועתקו ל-ci/logs/):
 *   manifest.json                    — תוצאות הריצה המקומית (suite.rows, parity, ...)
 *   logs/parity-compare.log          — פלט compare.py המקומי
 *   logs/parity-run-ours-very-long.log
 *   ci/logs/*-test-<node>.log        — job "test (18/20/22)" של ci.yml
 *   ci/logs/*-layout-parity.log      — job "layout-parity"
 *   ci/logs/*-very-long-corpus.log   — job "very-long-corpus"
 *   ci/logs/*-local.log              — full-math-audit (מצב local, דפדפן)
 *   ci/logs/*-layout-audit.log       — job "layout-audit" של ci.yml (דפדפן)
 *   ci/logs/*-live-audit-after-deploy.log — gh-pages-audit (האתר החי)
 *
 * פלט: ci/local-vs-ci.json + טבלה ל-stdout. קוד יציאה 1 אם נמצא פער בפריט שמושווה.
 * פריטים שרצים ב-CI בלבד (אודיט הדפדפן) מדווחים כ-"ci-only" — לא כפער.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const dir = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(dir, 'manifest.json'))) {
  console.error('usage: node tools/baseline/compare-with-ci.js audits/baseline/<sha7>');
  process.exit(2);
}

const read = (rel) => fs.readFileSync(path.join(dir, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(dir, rel));
const ciLogs = exists('ci/logs') ? fs.readdirSync(path.join(dir, 'ci/logs')).sort() : [];
const findCi = (re) => ciLogs.filter((n) => re.test(n));

const manifest = JSON.parse(read('manifest.json'));
const out = { schema: 'red-baseline-vs-ci-v1', baselineDir: path.relative(process.cwd(), dir), commit: manifest.env.commit, items: [] };
let mismatches = 0;

function add(item) {
  out.items.push(item);
  if (item.status === 'MISMATCH') mismatches++;
}

// ── 1. ספירת בדיקות לכל קובץ: מקומי ↔ כל אחד מג'ובי test (18/20/22) ──
const SUMMARY = /== (.+?): (\d+)(?:\/(\d+))? passed, (\d+) failed(?:, (\d+) skipped)? ==/g;
const parseSummaries = (txt) => {
  const m = new Map();
  for (const x of txt.matchAll(SUMMARY)) m.set(x[1], { passed: +x[2], failed: +x[4], skipped: x[5] != null ? +x[5] : 0 });
  return m;
};
const localRows = manifest.suite.rows.filter((r) => r.passed != null);
const localTotal = localRows.reduce((a, r) => a + r.passed, 0);
for (const f of findCi(/-test-(\d+)\.log$/)) {
  const node = f.match(/-test-(\d+)\.log$/)[1];
  const ci = parseSummaries(read(`ci/logs/${f}`));
  const diffs = [];
  let equal = 0;
  for (const r of localRows) {
    const c = ci.get(r.title);
    if (c && c.passed === r.passed && c.failed === r.failed && c.skipped === r.skipped) equal++;
    else diffs.push({ title: r.title, local: `${r.passed}/${r.failed}/${r.skipped}`, ci: c ? `${c.passed}/${c.failed}/${c.skipped}` : 'MISSING' });
  }
  const extra = [...ci.keys()].filter((t) => !localRows.some((r) => r.title === t));
  const ciTotal = [...ci.values()].reduce((a, v) => a + v.passed, 0);
  add({
    id: `suite.node${node}`,
    what: `ספירת בדיקות לכל קובץ (passed/failed/skipped) — מקומי מול job test (${node})`,
    local: { files: localRows.length, passed: localTotal },
    ci: { files: ci.size, passed: ciTotal, log: `ci/logs/${f}` },
    equalFiles: equal,
    diffs,
    extraInCiOnly: extra,
    status: diffs.length === 0 && extra.length === 0 && ciTotal === localTotal ? 'EQUAL' : 'MISMATCH',
  });
}

// ── 2. parity: HARD/PARITY/score + אילו בדיקות ✗ ──
const parityOf = (txt) => {
  const m = txt.match(/HARD: (\d+)\/(\d+)\s*\|\s*PARITY: (\d+)\/(\d+)\s*\|\s*ציון: ([\d.]+)%/);
  const failing = [...txt.matchAll(/✗ \[(HARD|PARITY)\] (.+)/g)].map((x) => `${x[1]}: ${x[2].trim()}`);
  return m ? { hard: `${m[1]}/${m[2]}`, parity: `${m[3]}/${m[4]}`, score: +m[5], failing } : null;
};
for (const f of findCi(/-layout-parity\.log$/)) {
  const ci = parityOf(read(`ci/logs/${f}`));
  const local = parityOf(read('logs/parity-compare.log'));
  const same = ci && local && JSON.stringify(ci) === JSON.stringify(local);
  add({ id: 'parity.compare', what: 'compare.py: HARD/PARITY/ציון/בדיקות שנכשלות', local, ci: ci && { ...ci, log: `ci/logs/${f}` }, status: same ? 'EQUAL' : 'MISMATCH' });
}

// ── 3. הקורפוס הארוך (נתיב Node): עמודים + hash ──
const typesetOf = (txt) => {
  const m = txt.match(/typeset: (\d+) pages .*?\(hash (legacy-[0-9a-f]+)\)/);
  const d = /determinism: run2 .*? — OK \(identical\)/.test(txt);
  return m ? { pages: +m[1], hash: m[2], determinismIdentical: d } : null;
};
for (const f of findCi(/-very-long-corpus\.log$/)) {
  const ci = typesetOf(read(`ci/logs/${f}`));
  const local = typesetOf(read('logs/parity-run-ours-very-long.log'));
  const same = ci && local && JSON.stringify(ci) === JSON.stringify(local);
  add({ id: 'very-long.node-path', what: 'קורפוס 3.4MB בנתיב Node: עמודים/hash/דטרמיניזם', local, ci: ci && { ...ci, log: `ci/logs/${f}` }, status: same ? 'EQUAL' : 'MISMATCH' });
}

// ── 4. אודיט דפדפן (CI בלבד): full-math local/live + layout-audit ──
const fullMathOf = (txt) => {
  const m = txt.match(/pages: (\d+)\/(\d+) \| lines: ([\d,]+) \| words: ([\d,]+) \| problems: (\d+)/);
  const d = txt.match(/determinism: (\w+)/);
  return m ? { pages: `${m[1]}/${m[2]}`, lines: m[3], words: m[4], problems: +m[5], determinism: d ? d[1] : null } : null;
};
const fmLocal = findCi(/-local\.log$/)[0];
const fmLive = findCi(/-live-audit-after-deploy\.log$/)[0];
if (fmLocal && fmLive) {
  const a = fullMathOf(read(`ci/logs/${fmLocal}`));
  const b = fullMathOf(read(`ci/logs/${fmLive}`));
  add({
    id: 'full-math.ci-local-vs-live',
    what: 'אודיט מתמטי מלא בדפדפן (21 משפחות, 704 עמודים): CI על ה-build ↔ האתר החי',
    ciLocal: a && { ...a, log: `ci/logs/${fmLocal}` },
    ciLive: b && { ...b, log: `ci/logs/${fmLive}` },
    status: a && b && JSON.stringify(a) === JSON.stringify(b) && a.problems === 0 && a.determinism === 'IDENTICAL' ? 'EQUAL' : 'MISMATCH',
    note: 'ריצת הדפדפן קיימת רק ב-CI (ci-only) — אין ריצה מקומית לשוואה',
  });
}
for (const f of findCi(/-layout-audit\.log$/)) {
  const txt = read(`ci/logs/${f}`);
  const p = txt.match(/עמודים שנבדקו: (\d+)\/(\d+)/);
  const b = txt.match(/בעיות: (\d+)/);
  add({
    id: 'layout-audit.ci',
    what: 'layout-audit (ci.yml) — עמודים שנבדקו ובעיות',
    ci: p && b ? { pages: `${p[1]}/${p[2]}`, problems: +b[1], log: `ci/logs/${f}` } : null,
    status: p && b && +b[1] === 0 && p[1] === p[2] ? 'ci-only' : 'MISMATCH',
  });
}

// ── 5. התאמה לתיעוד: סכום הבדיקות הנמדד מול המספרים שבתיעוד ──
out.measuredTotalTests = localTotal;
out.docClaims = [
  { claim: 'README.md:44 — 388', measured: localTotal },
  { claim: 'ci.yml:34 (הערה) — 670', measured: localTotal },
  { claim: 'WORKLOG.md:2408/2575/2591 — 657 (32 קבצים)', measured: `${localTotal} (${localRows.length} קבצים)` },
];

out.verdict = mismatches === 0 ? 'EQUAL' : 'MISMATCH';
fs.writeFileSync(path.join(dir, 'ci/local-vs-ci.json'), JSON.stringify(out, null, 2) + '\n');

// ── הדפסה ──
for (const it of out.items) {
  const tag = it.status === 'EQUAL' ? '✓' : it.status === 'ci-only' ? '·' : '✗';
  console.log(`${tag} ${it.id.padEnd(28)} ${it.status.padEnd(8)} ${it.what}`);
  if (it.diffs && it.diffs.length) for (const d of it.diffs) console.log(`    ↳ ${d.title}: מקומי ${d.local} ≠ CI ${d.ci}`);
}
console.log(`\nסה"כ בדיקות (מקומי, נמדד): ${localTotal} ב-${localRows.length} קבצים — ${out.verdict}`);
process.exit(mismatches ? 1 : 0);
