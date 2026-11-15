#!/usr/bin/env node
// tools/perf/font-perf-baseline.js — Agent 3: מדידת ביצועים ומסלול גופנים (קריאה בלבד).
// אינו משנה קוד מנוע/UI/בדיקות ואינו מוסיף תלויות. כל המספרים נמדדים מהקבצים ומהמנוע בפועל.
//
//   node tools/perf/font-perf-baseline.js all [--repeat 3] [--out-dir docs/perf] [--woff2-sizes f.json] [--woff2-sample f.woff2]
//   node tools/perf/font-perf-baseline.js run <doc> <table|app>     # ריצה בודדת, מדפיסה JSON
//   node tools/perf/font-perf-baseline.js export <doc>              # typeset + ייצוא PDF (גופן TTF רשום); זמן הייצוא-בלבד משוער
//   node tools/perf/font-perf-baseline.js inventory | parse | b64   # מדידות בודדות
//
// מצבי ריצה: table = ברירות מחדל של המנוע ללא גופנים רשומים (כמו בדיקות הקורפוס);
//            app   = ברירות המקור המיובאות + גופני הליבה רשומים כמו בעליית האפליקציה (ללא נכסי SVG).
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync, execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const RED = path.join(ROOT, 'red-build');
const ASSETS = path.join(RED, 'ui', 'assets', 'imud');
const FONTS = path.join(ASSETS, 'fonts');
const FIX = path.join(RED, 'tests', 'fixtures');
const rd = (f) => JSON.parse(fs.readFileSync(path.join(ASSETS, f), 'utf8'));
const DOCS = [
  ['sample', path.join(FIX, 'sample.txt')],
  ['canonical', path.join(FIX, 'canonical_corpus.txt')],
  ['real_book', path.join(FIX, 'real', 'no_long_test_text.txt')],
  ['mid_long', path.join(FIX, 'real', 'mid_long_test_text.txt')],
  ['long', path.join(FIX, 'real', 'long_test_text.txt')],
  ['very_long', path.join(ROOT, 'audits', 'very_long_test_text.txt')],
  ['historical', path.join(FIX, 'real', 'orange_very_long_test_text.txt')]
].filter(([, p]) => fs.existsSync(p));

// ---------- מראות של לוגיקת הקוד הפעיל (app-shell.js / imud-library.js) ----------
const FONT_KEYS = ['body-font', 'first-word-font', 'dh-font', 'f-note-body-font',
  ...Array.from({ length: 8 }, (_, i) => `heading-${i}-font`),
  'shaar-title-font', 'shaar-subtitle-font', 'shaar-desc-font', 'shaar-sections-font',
  'shaar-author-font', 'shaar-year-font', 'shaar-back-text-font'];
for (const side of ['recto', 'verso']) for (const pos of ['right', 'center', 'left']) FONT_KEYS.push(`header-${side}-${pos}-font`);
const SETTING_SETS = ['תלמוד', 'פרשנות', 'קונטרס'];
const BOOT_DESIGN_COLLECTIONS = ['shaar_main', 'shaar_sub', 'shaar_back', 'ornaments_up_down', 'ornaments_left_right', 'section_dividers'];

function loadCatalogs() {
  const imud = rd('imud-fonts.json'), ext = rd('fonts-extended.json'), pri = rd('fonts-priority.json');
  const f2f = new Map(); // כמו fontCatalog.byFamily: ב-TTF האחרון זוכה; במורחב הראשון זוכה ואינו דורס
  for (const e of imud) f2f.set(e.family, e.file);
  for (const e of ext) if (!f2f.has(e.family)) f2f.set(e.family, e.file);
  return { imud, ext, pri, f2f };
}
function resolveFamily(v, f2f) {
  if (!v) return null;
  const s = String(v).trim();
  if (f2f.has(s)) return s;
  const parts = String(v).replace(/'/g, '').split(',').map((x) => x.trim()).filter(Boolean)
    .filter((p) => !/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/i.test(p));
  for (const p of parts) if (f2f.has(p)) return p;
  return null;
}
function requiredFonts(legacy, cat) {
  const { importImudSettings } = require(path.join(RED, 'src/engine/core/legacy-settings-map'));
  const { getSettingDefs } = require(path.join(RED, 'src/engine/core/settings-registry'));
  const { settings } = importImudSettings(legacy, new Set(getSettingDefs().map((r) => r.id)), { availableFonts: new Set(cat.f2f.keys()) });
  const fams = new Set();
  for (const k of FONT_KEYS) { const f = resolveFamily(settings[k], cat.f2f); if (f) fams.add(f); }
  return { settings, families: [...fams] };
}

const r1 = (x) => Math.round(x * 10) / 10;
const KB = (b) => Math.round(b / 1024);
function stats(arr) {
  const a = arr.slice().sort((x, y) => x - y);
  const q = (p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
  return { n: a.length, min: a[0], median: q(0.5), p95: q(0.95), max: a[a.length - 1], sum: a.reduce((s, x) => s + x, 0) };
}
const hr = () => process.hrtime.bigint();
const msSince = (t0) => Number(hr() - t0) / 1e6;

// ---------- 1. מלאי נכסים + מפת עלייה + מפת שימוש ----------
function inventory(woff2SizesPath, woff2Sample) {
  const cat = loadCatalogs();
  const stat = (list) => {
    const m = new Map();
    for (const e of list) { if (!m.has(e.family)) m.set(e.family, new Set()); m.get(e.family).add(e.file); }
    return { entries: list.length, families: m.size, files: new Set(list.map((e) => e.file)).size,
      familiesWithMultipleFiles: [...m.values()].filter((s) => s.size > 1).length };
  };
  const ttf = fs.readdirSync(FONTS).filter((f) => /\.ttf$/i.test(f)).map((f) => fs.statSync(path.join(FONTS, f)).size);
  const t = stats(ttf);
  // גדלי WOFF2: מהדיסק כשכל הקבצים קיימים (שכפול מלא); אחרת מקובץ גדלים חיצוני (--woff2-sizes)
  let woff2 = null, sizes = null, sizesSource = null;
  const onDisk = [...new Set(cat.ext.map((e) => e.file))].map((f) => path.join(FONTS, f));
  if (onDisk.every((q) => fs.existsSync(q))) { sizes = onDisk.map((q) => fs.statSync(q).size); sizesSource = 'disk'; }
  else if (woff2SizesPath && fs.existsSync(woff2SizesPath)) { sizes = Object.values(JSON.parse(fs.readFileSync(woff2SizesPath, 'utf8'))).filter(Number.isFinite); sizesSource = 'sizes-file'; }
  if (sizes) { const w = stats(sizes); woff2 = { source: sizesSource, files: w.n, totalMB: r1(w.sum / 1e6), medianKB: KB(w.median), maxMB: r1(w.max / 1e6) }; }
  // האם הנתיב הקיים (parser / מדידה / ייצוא PDF) מקבל WOFF2 — עם בקרת-חיוב TTF
  let woff2Probe = null;
  if (woff2Sample && fs.existsSync(woff2Sample)) {
    const fm = require(path.join(RED, 'src/engine/typography/font-metrics'));
    const { exportPdf } = require(path.join(RED, 'src/engine/output/export-api'));
    const { getDefaultSettings } = require(path.join(RED, 'src/engine/core/settings-registry'));
    const { resolveMeasureImpl } = require(path.join(RED, 'src/engine/typography/measure-api'));
    const sampleText = fs.readFileSync(path.join(FIX, 'sample.txt'), 'utf8');
    const pdf = (bytes, name) => { const r = exportPdf(sampleText, { ...getDefaultSettings(), 'body-font': name }, bytes, name, {}); return { ok: !!r.ok, error: r.ok ? null : String(r.error || ''), pdfBytes: r.bytes ? r.bytes.length : 0 }; };
    const pr = fm.parseFont(fs.readFileSync(woff2Sample));
    woff2Probe = { file: path.basename(woff2Sample), parseFont: { ok: !!pr.ok, error: pr.ok ? null : String(pr.error || '') },
      exportPdfWoff2: pdf(fs.readFileSync(woff2Sample), 'woff2-probe'),
      exportPdfTtfControl: pdf(fs.readFileSync(path.join(FONTS, 'FrankRuhlLibre-VF.ttf')), 'Frank Ruhl Libre'),
      measureImplUnregisteredFamily: resolveMeasureImpl({ ...getDefaultSettings(), 'body-font': 'woff2-probe' }) };
  }
  const famTtf = new Set(cat.imud.map((e) => e.family)), famExt = new Set(cat.ext.map((e) => e.family));
  const selectable = { total: new Set([...famTtf, ...famExt]).size, ttf: famTtf.size, woff2Only: [...famExt].filter((f) => !famTtf.has(f)).length };
  // מפת שימוש: אילו גופנים נדרשים בפועל לפי מקורות מוכחים
  const sources = [['default_settings.json', path.join(ASSETS, 'default_settings.json')]];
  for (const n of SETTING_SETS) sources.push([`setting_sets/${n}`, path.join(ASSETS, 'setting_sets', n + '.json')]);
  for (const f of fs.readdirSync(FIX).filter((x) => /^imud_default_settings.*\.json$/.test(x))) sources.push([`fixtures/${f}`, path.join(FIX, f)]);
  const usage = {}; const union = new Set();
  for (const [name, p] of sources) {
    const fams = requiredFonts(JSON.parse(fs.readFileSync(p, 'utf8')), cat).families;
    usage[name] = fams; fams.forEach((f) => union.add(f));
  }
  const bootReq = requiredFonts(rd('default_settings.json'), cat);
  const bootFontFiles = [...new Set(['FrankReal-Bold.ttf', 'DavidLibre-Bold.ttf', ...bootReq.families.map((f) => cat.f2f.get(f))])];
  const sz = (rel) => fs.statSync(path.join(RED, rel)).size;
  const boot = [
    ['html', 'ui/index.html'], ['css', 'ui/styles.css'], ['js-bundle', 'ui/app.bundle.js'], ['worker-bundle', 'ui/engine-worker.bundle.js'],
    ['catalog', 'ui/assets/imud/imud-fonts.json'], ['catalog', 'ui/assets/imud/fonts-extended.json'], ['settings', 'ui/assets/imud/default_settings.json'],
    ...BOOT_DESIGN_COLLECTIONS.map((c) => ['design-collection', `ui/assets/imud/${c}.json`]),
    ...bootFontFiles.map((f) => ['font', `ui/assets/imud/fonts/${f}`])
  ].map(([category, rel]) => ({ category, file: rel.replace('ui/assets/imud/', ''), bytes: sz(rel) }));
  const byCat = {}; let total = 0;
  for (const s of boot) { byCat[s.category] = (byCat[s.category] || 0) + s.bytes; total += s.bytes; }
  const dupSameBytes = (() => { // כפילויות משפחה ב-TTF: האם הבתים זהים?
    const m = new Map(); for (const e of cat.imud) { if (!m.has(e.family)) m.set(e.family, []); m.get(e.family).push(e.file); }
    const crypto = require('crypto'); let same = 0, diff = 0;
    for (const fl of m.values()) { if (fl.length < 2) continue;
      const h = new Set(fl.map((f) => crypto.createHash('sha1').update(fs.readFileSync(path.join(FONTS, f))).digest('hex')));
      if (h.size === 1) same++; else diff++; }
    return { sameBytes: same, differentBytes: diff };
  })();
  return {
    catalogs: { imudTtf: stat(cat.imud), extendedWoff2: stat(cat.ext), priorityWoff2: stat(cat.pri) },
    ttf: { files: t.n, totalMB: r1(t.sum / 1e6), medianKB: KB(t.median), p95KB: KB(t.p95), maxMB: r1(t.max / 1e6) },
    woff2, woff2Probe, selectable, ttfDuplicateFamilies: dupSameBytes,
    usage, usageUnion: [...union],
    boot: { requests: boot.length, totalBytes: total, byCategory: byCat, steps: boot, bootFamilies: bootReq.families }
  };
}

// ---------- 2. פרסור גופנים (עלות ה-Worker: parseFont) ----------
function parseBench() {
  const fm = require(path.join(RED, 'src/engine/typography/font-metrics'));
  const files = fs.readdirSync(FONTS).filter((f) => /\.ttf$/i.test(f)).sort();
  const pass = () => files.map((f) => {
    const bytes = fs.readFileSync(path.join(FONTS, f));
    const t0 = hr(); const r = fm.parseFont(bytes);
    return { file: f, bytes: bytes.length, ms: msSince(t0), ok: !!r.ok, error: r.ok ? null : String(r.error || '') };
  });
  const cold = pass(), warm = pass();
  const sum = (rows) => { const s = stats(rows.map((r) => r.ms)); return { files: s.n, totalMs: r1(s.sum), medianMs: r1(s.median), p95Ms: r1(s.p95), maxMs: r1(s.max), failed: rows.filter((r) => !r.ok).map((r) => ({ file: r.file, error: r.error })) }; };
  return { cold: sum(cold), warm: sum(warm),
    slowestCold: cold.slice().sort((a, b) => b.ms - a.ms).slice(0, 5).map((r) => ({ file: r.file, KB: KB(r.bytes), ms: r1(r.ms) })) };
}

// ---------- 3. המרת base64 בצד ה-UI (imud-library.loadFont) ----------
function b64Bench() {
  const cat = loadCatalogs();
  const bootFiles = [...new Set(['FrankReal-Bold.ttf', 'DavidLibre-Bold.ttf', ...requiredFonts(rd('default_settings.json'), cat).families.map((f) => cat.f2f.get(f))])];
  const largest = fs.readdirSync(FONTS).filter((f) => /\.ttf$/i.test(f)).map((f) => [f, fs.statSync(path.join(FONTS, f)).size]).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]);
  const conv = (buf) => { const u8 = new Uint8Array(buf); let bin = ''; const CH = 0x8000; for (let i = 0; i < u8.length; i += CH) bin += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(bin); };
  const one = (f) => { const b = fs.readFileSync(path.join(FONTS, f)); const t0 = hr(); const s = conv(b); return { file: f, KB: KB(b.length), ms: r1(msSince(t0)), b64KB: KB(s.length) }; };
  const boot = bootFiles.map(one);
  return { boot, bootTotalMs: r1(boot.reduce((s, r) => s + r.ms, 0)), largest: largest.map(one) };
}

// ---------- 4. ריצת מנוע בודדת (תהליך נקי ⇒ maxRSS אמין) ----------
function runDoc(name, mode) {
  const found = DOCS.find(([n]) => n === name);
  if (!found) throw new Error('doc לא קיים: ' + name);
  const text = fs.readFileSync(found[1], 'utf8');
  const { typeset } = require(path.join(RED, 'src/engine/core/pipeline'));
  const { getDefaultSettings } = require(path.join(RED, 'src/engine/core/settings-registry'));
  let settings, registerMs = 0, fontsRegistered = 0;
  if (mode === 'app') {
    const cat = loadCatalogs();
    const { registerFont } = require(path.join(RED, 'src/engine/typography/measure-api'));
    const req = requiredFonts(rd('default_settings.json'), cat);
    settings = req.settings;
    const t0 = hr();
    const reg = (n, file) => { if (registerFont(n, fs.readFileSync(path.join(FONTS, file))).ok) fontsRegistered++; };
    for (const fam of req.families) reg(fam, cat.f2f.get(fam));
    reg('FrankReal', 'FrankReal-Bold.ttf'); reg('DavidLibre-Bold', 'DavidLibre-Bold.ttf');
    registerMs = msSince(t0);
  } else settings = getDefaultSettings();
  const t1 = hr();
  const r = typeset(text, settings, { noRecommendations: true });
  const wallMs = msSince(t1);
  return { doc: name, mode, bytes: Buffer.byteLength(text), wallMs: r1(wallMs), registerMs: r1(registerMs), fontsRegistered,
    pages: r.pages.length, layoutHash: r.layoutHash, contentPreserved: r.contentPreserved === true, maxRSS_MB: Math.round(process.resourceUsage().maxRSS / 1024) };
}

// ---------- 4ב. ייצוא PDF (typeset + כתיבת PDF; גופן TTF רשום) ----------
function exportDoc(name) {
  const found = DOCS.find(([n]) => n === name);
  if (!found) throw new Error('doc לא קיים: ' + name);
  const text = fs.readFileSync(found[1], 'utf8');
  const { typeset } = require(path.join(RED, 'src/engine/core/pipeline'));
  const { getDefaultSettings } = require(path.join(RED, 'src/engine/core/settings-registry'));
  const { registerFont } = require(path.join(RED, 'src/engine/typography/measure-api'));
  const { exportPdf } = require(path.join(RED, 'src/engine/output/export-api'));
  const bytes = fs.readFileSync(path.join(FONTS, 'FrankRuhlLibre-VF.ttf'));
  registerFont('Frank Ruhl Libre', bytes);
  const settings = { ...getDefaultSettings(), 'body-font': 'Frank Ruhl Libre' };
  const t0 = hr(); const r = typeset(text, settings, { noRecommendations: true }); const typesetMs = msSince(t0);
  const t1 = hr(); const pdf = exportPdf(text, settings, bytes, 'Frank Ruhl Libre', {}); const exportTotalMs = msSince(t1);
  return { doc: name, bytes: Buffer.byteLength(text), pages: r.pages.length, typesetMs: r1(typesetMs), exportTotalMs: r1(exportTotalMs), exportOnlyMsApprox: r1(exportTotalMs - typesetMs),
    pdfOk: !!pdf.ok, pdfKB: pdf.bytes ? KB(pdf.bytes.length) : 0, maxRSS_MB: Math.round(process.resourceUsage().maxRSS / 1024) };
}

// ---------- 5. סיכום פרופיל CPU לפי שלב/מודול ----------
function summarizeProfile(file) {
  const prof = JSON.parse(fs.readFileSync(file, 'utf8'));
  const byId = new Map(prof.nodes.map((n) => [n.id, n]));
  const self = new Map(); let total = 0;
  prof.samples.forEach((id, i) => { const d = prof.timeDeltas[i] || 0; self.set(id, (self.get(id) || 0) + d); });
  const groups = {}, files = {};
  for (const [id, t] of self) {
    const cf = byId.get(id).callFrame; const fn = cf.functionName || '';
    if (fn === '(idle)') continue;
    total += t;
    const url = String(cf.url || '').replace(/^file:\/\//, '');
    const i = url.indexOf('/red-build/src/');
    let rel, g;
    if (i >= 0) { rel = url.slice(i + 11); g = rel.startsWith('src/engine/') ? 'engine/' + rel.split('/')[2] : rel.startsWith('src/ui/') ? 'ui' : 'src/other'; }
    else if (fn === '(garbage collector)') { rel = '(gc)'; g = 'runtime/gc'; }
    else { rel = url ? (url.startsWith('node:') ? 'node-internal' : path.basename(url)) : (fn || 'native'); g = 'runtime/other'; }
    groups[g] = (groups[g] || 0) + t; files[rel] = (files[rel] || 0) + t;
  }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ name: k, ms: Math.round(v / 1000), pct: r1(100 * v / total) }));
  return { sampledMs: Math.round(total / 1000), groups: top(groups, 12), topFiles: top(files, 10) };
}

// ---------- תזמור + דוח ----------
function child(args, nodeArgs = []) {
  const r = spawnSync(process.execPath, [...nodeArgs, __filename, ...args], { encoding: 'utf8', maxBuffer: 1 << 27 });
  if (r.status !== 0) throw new Error(`child failed: ${args.join(' ')}\n${r.stderr}`);
  const line = r.stdout.split('\n').find((l) => l.startsWith('@@RESULT@@'));
  return JSON.parse(line.slice(10));
}
function allCmd(argv) {
  const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const repeat = Number(opt('--repeat', 3));
  const outDir = path.resolve(ROOT, opt('--out-dir', 'docs/perf'));
  let commit = 'unknown'; try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch (e) { /* ללא git */ }
  const env = { commit, node: process.version, cpu: os.cpus()[0].model, cpus: os.cpus().length, ramGB: Math.round(os.totalmem() / 1e9), platform: `${os.platform()} ${os.release()}`, repeat };
  const res = { env, inventory: inventory(opt('--woff2-sizes'), opt('--woff2-sample')), parse: parseBench(), b64: b64Bench(), runs: [], profile: null };
  for (const [doc] of DOCS) for (const mode of ['table', 'app']) {
    const rows = []; for (let i = 0; i < repeat; i++) rows.push(child(['run', doc, mode]));
    const w = stats(rows.map((r) => r.wallMs));
    res.runs.push({ doc, mode, KB: KB(rows[0].bytes), medianMs: r1(w.median), minMs: r1(w.min), maxMs: r1(w.max), registerMs: rows[0].registerMs, pages: rows[0].pages,
      maxRSS_MB: Math.max(...rows.map((r) => r.maxRSS_MB)), hash12: rows[0].layoutHash.slice(0, 12), deterministic: new Set(rows.map((r) => r.layoutHash)).size === 1,
      contentPreserved: rows.every((r) => r.contentPreserved) });
  }
  const profDir = fs.mkdtempSync(path.join(os.tmpdir(), 'redprof-'));
  const profDoc = DOCS.some(([n]) => n === 'very_long') ? 'very_long' : DOCS[DOCS.length - 1][0];
  child(['run', profDoc, 'app'], ['--cpu-prof', '--cpu-prof-dir', profDir]);
  res.profile = { doc: profDoc, mode: 'app', ...summarizeProfile(path.join(profDir, fs.readdirSync(profDir).find((f) => f.endsWith('.cpuprofile')))) };
  fs.mkdirSync(outDir, { recursive: true });
  const base = path.join(outDir, `baseline-${commit.slice(0, 7)}`);
  fs.writeFileSync(base + '.json', JSON.stringify(res, null, 2) + '\n');
  fs.writeFileSync(base + '.tables.md', toMd(res));
  console.log('נכתב:', path.relative(ROOT, base) + '.{json,tables.md}');
}
function toMd(r) {
  const L = []; const row = (...c) => L.push('| ' + c.join(' | ') + ' |'); const hdr = (...c) => { row(...c); row(...c.map(() => '---')); };
  const inv = r.inventory, B = inv.boot;
  L.push('### מלאי קטלוגים', ''); hdr('קטלוג', 'רשומות', 'משפחות ייחודיות', 'קבצים', 'משפחות עם >1 קובץ');
  for (const [k, v] of Object.entries(inv.catalogs)) row(k, v.entries, v.families, v.files, v.familiesWithMultipleFiles);
  L.push('', '### פורמטים ונתיב הגופנים (בדיקה ישירה בקוד הפעיל)', ''); hdr('נושא', 'תוצאה');
  row('TTF (נמדד/נרשם במנוע)', `${inv.ttf.files} קבצים, ${inv.ttf.totalMB} MB, חציון ${inv.ttf.medianKB} KB, מקס ${inv.ttf.maxMB} MB`);
  row('WOFF2 (תצוגה בלבד)', inv.woff2 ? `${inv.woff2.files} קבצים, ${inv.woff2.totalMB} MB, חציון ${inv.woff2.medianKB} KB, מקס ${inv.woff2.maxMB} MB (מקור: ${inv.woff2.source})` : 'לא נמדד');
  row('משפחות לבחירה', `${inv.selectable.total}: TTF ${inv.selectable.ttf}; WOFF2 בלבד ${inv.selectable.woff2Only}`);
  row('כפילויות משפחה ב-TTF (שני קבצים לשם)', `${inv.ttfDuplicateFamilies.differentBytes} עם בתים שונים, ${inv.ttfDuplicateFamilies.sameBytes} זהים`);
  if (inv.woff2Probe) { const w = inv.woff2Probe;
    row('parseFont(WOFF2)', `ok=${w.parseFont.ok} ${w.parseFont.error || ''}`);
    row('exportPdf(WOFF2)', `ok=${w.exportPdfWoff2.ok} ${w.exportPdfWoff2.error || ''}`);
    row('exportPdf(TTF) — בקרת חיוב', `ok=${w.exportPdfTtfControl.ok}, pdf ${w.exportPdfTtfControl.pdfBytes} בתים`);
    row('measure-impl למשפחה לא-רשומה', w.measureImplUnregisteredFamily); }
  L.push('', '### גופנים בשימוש מוכח (ברירות מחדל, 3 ערכות, fixtures של הגדרות)', ''); hdr('מקור', 'משפחות');
  for (const [k, v] of Object.entries(inv.usage)) row(k, v.length);
  L.push('', `איחוד (${inv.usageUnion.length}): ${inv.usageUnion.join(', ')}`, `בעלייה (${B.bootFamilies.length}): ${B.bootFamilies.join(', ')}`);
  L.push('', '### עלייה — בתים לפי קטגוריה (מדוד מהקבצים; סדר/רצף לפי קריאת קוד)', ''); hdr('קטגוריה', 'KB', '% מהסך');
  for (const [k, v] of Object.entries(B.byCategory).sort((a, b) => b[1] - a[1])) row(k, KB(v), r1(100 * v / B.totalBytes));
  row('**סה"כ**', `**${KB(B.totalBytes)}**`, '100');
  L.push('', '### פרסור גופנים (parseFont, TTF בלבד, Node/V8)', ''); hdr('מעבר', 'קבצים', 'סה"כ ms', 'חציון ms', 'p95 ms', 'מקס ms', 'נכשלו');
  for (const k of ['cold', 'warm']) { const p = r.parse[k]; row(k, p.files, p.totalMs, p.medianMs, p.p95Ms, p.maxMs, p.failed.length); }
  L.push('', '### המרת base64 ב-UI (loadFont)', ''); hdr('קובץ', 'KB', 'ms');
  for (const b of [...r.b64.boot, ...r.b64.largest]) row(b.file, b.KB, b.ms);
  L.push('', '### ריצות מנוע (תהליך נקי לכל ריצה)', ''); hdr('מסמך', 'KB', 'מצב', 'חציון ms', 'טווח ms', 'רישום גופנים ms', 'עמודים', 'maxRSS MB', 'hash', 'דטרמיניסטי', 'שימור תוכן');
  for (const x of r.runs) row(x.doc, x.KB, x.mode, x.medianMs, `${x.minMs}–${x.maxMs}`, x.mode === 'app' ? x.registerMs : '-', x.pages, x.maxRSS_MB, x.hash12, x.deterministic ? 'כן' : '**לא**', x.contentPreserved ? 'כן' : '**לא**');
  L.push('', `### פרופיל CPU — ${r.profile.doc} (${r.profile.mode}), ${r.profile.sampledMs} ms נדגמו`, ''); hdr('קבוצה', 'ms', '%');
  for (const g of r.profile.groups) row(g.name, g.ms, g.pct);
  L.push('', 'קבצים חמים:', ''); hdr('קובץ', 'ms', '%');
  for (const g of r.profile.topFiles) row(g.name, g.ms, g.pct);
  return L.join('\n') + '\n';
}

function main() {
  const [cmd, a, b] = process.argv.slice(2);
  const emit = (o) => console.log('@@RESULT@@' + JSON.stringify(o));
  if (cmd === 'run') return emit(runDoc(a, b || 'table'));
  if (cmd === 'export') return emit(exportDoc(a));
  if (cmd === 'inventory') return console.log(JSON.stringify(inventory(process.argv[3], process.argv[4]), null, 2));
  if (cmd === 'parse') return console.log(JSON.stringify(parseBench(), null, 2));
  if (cmd === 'b64') return console.log(JSON.stringify(b64Bench(), null, 2));
  if (cmd === 'all') return allCmd(process.argv.slice(3));
  console.error('שימוש: all | run <doc> <table|app> | inventory | parse | b64');
  process.exit(2);
}
if (require.main === module) main();
module.exports = { inventory, parseBench, b64Bench, runDoc, exportDoc, summarizeProfile, requiredFonts, loadCatalogs, FONT_KEYS };
