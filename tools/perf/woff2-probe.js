#!/usr/bin/env node
// tools/perf/woff2-probe.js — Agent 3: מה קורה לגופן מורחב (WOFF2) אחרי המרה ל-sfnt: parse, עימוד (מדידה אמיתית מול table), ייצוא PDF.
// קריאה בלבד — אינו משנה קוד/נכסים. שימוש:
//   node tools/perf/woff2-probe.js <תיקיית .ttf/.otf שהומרו> [--meta rows.json] [--out f.json]
// ההמרה (מחוץ ל-repo; דורשת fonttools + brotli):
//   python3 -c "from fontTools.ttLib import TTFont; f=TTFont('x.woff2'); f.flavor=None; f.save('x.ttf')"   # CFF נשמר כ-OTF (OTTO)
// --meta: JSON של שורות {{file,family,woff2,sfnt,outlines,hebrew,out}} (אופציונלי; מוסיף עמודות מקור/כיסוי עברית).
'use strict';

const fs = require('fs');
const path = require('path');

const RED = path.resolve(__dirname, '..', '..', 'red-build');
const fm = require(path.join(RED, 'src/engine/typography/font-metrics'));
const { registerFont } = require(path.join(RED, 'src/engine/typography/measure-api'));
const { typeset } = require(path.join(RED, 'src/engine/core/pipeline'));
const { getDefaultSettings } = require(path.join(RED, 'src/engine/core/settings-registry'));
const { exportPdf } = require(path.join(RED, 'src/engine/output/export-api'));

const argv = process.argv.slice(2);
const dir = argv[0];
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
if (!dir || !fs.existsSync(dir)) { console.error('שימוש: node tools/perf/woff2-probe.js <dir> [--meta rows.json] [--out f.json]'); process.exit(2); }
const meta = opt('--meta') ? new Map(JSON.parse(fs.readFileSync(opt('--meta'), 'utf8')).map((r) => [path.basename(r.out), r])) : new Map();

const corpus = fs.readFileSync(path.join(RED, 'tests/fixtures/canonical_corpus.txt'), 'utf8');
const sample = fs.readFileSync(path.join(RED, 'tests/fixtures/sample.txt'), 'utf8');
const base = getDefaultSettings();
const lay = (name) => typeset(corpus, { ...base, 'body-font': name }, { noRecommendations: true });
const linesOf = (r) => r.pages.reduce((s, pg) => s + pg.columns.reduce((t, col) => t + (Array.isArray(col) ? col.length : 0), 0), 0);
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

const rows = [];
fs.readdirSync(dir).filter((f) => /\.(ttf|otf)$/i.test(f)).sort().forEach((f, i) => {
  const bytes = fs.readFileSync(path.join(dir, f)); const m = meta.get(f) || {};
  const row = { file: f, KB: Math.round(bytes.length / 1024), outlines: m.outlines || (/\.otf$/i.test(f) ? 'CFF' : 'glyf'), hebrew: m.hebrew == null ? null : !!m.hebrew };
  const p = fm.parseFont(bytes); row.parse = p.ok ? 'ok' : String(p.error || 'fail');
  if (p.ok) {
    const name = 'probe-' + i; const reg = registerFont(name, bytes); row.register = reg.ok ? 'ok' : String(reg.error || 'fail');
    if (reg.ok) {
      const real = lay(name), tab = lay(name + '-unregistered'); // שם לא-רשום ⇒ מדידת table
      row.pagesReal = real.pages.length; row.pagesTable = tab.pages.length; row.linesReal = linesOf(real); row.linesTable = linesOf(tab); row.hashEqual = real.layoutHash === tab.layoutHash; row.contentPreserved = real.contentPreserved === true && tab.contentPreserved === true;
    }
    const pdf = exportPdf(sample, { ...base, 'body-font': name }, bytes, name, {}); row.pdf = pdf.ok ? 'ok' : String(pdf.error || 'fail');
  }
  rows.push(row);
});

const okRows = rows.filter((r) => r.parse === 'ok');
const dev = rows.filter((r) => r.linesReal != null).map((r) => Math.abs(r.linesReal - r.linesTable) / r.linesTable * 100);
const sum = {
  fonts: rows.length, parsed: okRows.length, parseFailed: rows.filter((r) => r.parse !== 'ok').map((r) => ({ file: r.file, outlines: r.outlines, error: r.parse })),
  pdfOk: rows.filter((r) => r.pdf === 'ok').length, layoutDeviationLinesPct: { n: dev.length, hashEqual: rows.filter((r) => r.hashEqual).length, median: dev.length ? +median(dev).toFixed(1) : null, max: dev.length ? +Math.max(...dev).toFixed(1) : null, nonZero: dev.filter((d) => d > 0).length },
  byOutlines: ['glyf', 'CFF'].map((k) => ({ outlines: k, fonts: rows.filter((r) => r.outlines === k).length, parsed: rows.filter((r) => r.outlines === k && r.parse === 'ok').length, pdfOk: rows.filter((r) => r.outlines === k && r.pdf === 'ok').length }))
};
for (const r of rows) console.log(r.file.slice(0, 34).padEnd(35), r.outlines.padEnd(5), String(r.KB).padStart(5) + 'KB', 'heb=' + String(r.hebrew).padEnd(5), 'parse=' + r.parse.slice(0, 26).padEnd(27), 'lines table→real ' + (r.linesTable != null ? r.linesTable + '→' + r.linesReal : '-').padEnd(10), 'pdf=' + (r.pdf || '-').slice(0, 26));
console.log(JSON.stringify(sum));
if (opt('--out')) fs.writeFileSync(opt('--out'), JSON.stringify({ summary: sum, rows }, null, 2) + '\n');
