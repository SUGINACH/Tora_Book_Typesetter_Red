// tools/layout-parity/run-ours.js — הרצת RED על טקסט המבחן בנתיב החי + ייצוא PDF
//
// משחזר בדיוק את מה שהאפליקציה עושה בעלייה (IMUD defaults → importImudSettings),
// מודד בגופן האמיתי של הגוף (Guttman Rashi — כמו המקור: registerFont +
// measure-impl=font-metrics), מפיק דגם מבני (ours-model.json) ו-PDF (ours.pdf)
// באותו סכמון כמו audits/layout-reference.json להשוואה מתמטית מדויקת.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const RB = path.join(ROOT, 'red-build');
const AUD = path.join(ROOT, 'audits');

const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getSettingDefs, getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const { registerFont, unregisterFont } = require(path.join(RB, 'src/engine/typography/measure-api'));
const { exportPdf } = require(path.join(RB, 'src/engine/output/export-api'));

// ---------- הגדרות: הנתיב החי (כמו browser-entry.js + imud-library.js) ----------
function liveSettings() {
  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (!fs.existsSync(p)) continue;
    for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  const imp = importImudSettings(legacy, regKeys, { availableFonts: families });
  return imp.settings;
}

// ---------- ניקוי טקסט שורה להשוואה ----------
function lineText(words) {
  return (words || [])
    .map(w => String(w)
      .replace(/\uE000/g, '')   // MARK_TAG
      .replace(/\u00A0/g, ' '))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const TYPE_MAP = {
  'shaar-main': 'shaar-main', 'shaar-back': 'shaar-back', 'shaar-sub': 'shaar-sub',
  'toc-general': 'toc-general', 'toc-detailed': 'toc-detailed',
  'preface': 'chapter-open', 'sign-open': 'sign-open', 'regular': 'body'
};

function main() {
  const text = fs.readFileSync(process.argv[2] || path.join(AUD, 'no_long_test_text.txt'), 'utf8');
  const outDir = process.argv[3] || path.join(AUD, 'layout-parity-artifacts');
  fs.mkdirSync(outDir, { recursive: true });

  const fontPath = path.join(RB, 'ui/assets/imud/fonts/Guttman-Rashi-Normal.ttf');
  const fontBytes = fs.readFileSync(fontPath);
  const reg = registerFont('Guttman Rashi', fontBytes);
  if (!reg.ok) { console.error('registerFont failed:', reg.error); process.exit(2); }

  const settings = {
    ...getDefaultSettings(),
    ...liveSettings(),
    'body-font': 'Guttman Rashi',
    'measure-impl': 'font-metrics'
  };

  const t0 = Date.now();
  const result = typeset(text, settings, { noRecommendations: true });
  console.error(`typeset: ${result.pages.length} pages in ${Date.now() - t0}ms (hash ${result.layoutHash.slice(0, 12)})`);

  // ---------- דגם מבני ----------
  const pages = [];
  const paraSeq = [];
  let openPara = null;
  let lineSeq = [];   // רצף שורות קריאה (טור ימני → שמאלי, עמוד אחר עמוד)
  const tocSummary = { general: 0, detailed: 0, generalEntries: [], detailedEntries: [] };

  const flushPara = (end) => {
    if (!openPara) return;
    openPara.end = end;
    paraSeq.push(openPara);
    openPara = null;
  };

  for (const pg of result.pages) {
    const type = TYPE_MAP[pg.type] || pg.type || 'body';
    const header = pg.header && pg.header.slots
      ? {
          right: pg.header.slots.right ? pg.header.slots.right.text || null : null,
          center: pg.header.slots.center ? pg.header.slots.center.text || null : null,
          left: pg.header.slots.left ? pg.header.slots.left.text || null : null
        }
      : { right: null, center: null, left: null };

    // עמודי תוכן-עניינים: הערכים חיים ב-pg.toc.rows (לא בשורות הטור)
    let tocEntries = null;
    if (/^toc/.test(type) && pg.toc && Array.isArray(pg.toc.rows)) {
      tocEntries = pg.toc.rows.map(e => ({
        level: e.level, text: e.text, pageLabel: e.pageLabel, targetPage: e.targetPage
      }));
      const bucket = type === 'toc-general' ? 'general' : 'detailed';
      tocSummary[bucket] += tocEntries.length;
      tocSummary[bucket + 'Entries'].push(...tocEntries.slice(0, 400));
    }

    const pageCols = [];
    const nCols = (pg.columns || []).length;
    pg.columns.forEach((col, ci) => {
      const name = nCols >= 2 ? (ci === 0 ? 'right' : 'left') : 'single';
      const lines = [];
      for (const ln of col) {
        const txt = lineText(ln.words);
        if (!txt) continue;
        lines.push({ text: txt, widthPx: Math.round(ln.widthPx || 0), isLast: !!ln.isLast, kind: ln.kind || null });
        lineSeq.push({ page: pg.index, col: name, text: txt });

        // שחזור פסקאות מהשורות (isLast) — כותרות חותמות פסקה פתוחה
        if (ln.kind === 'heading') {
          flushPara(true);
        } else {
          if (!openPara) openPara = { lines: 0, words: 0, head: txt.split(' ').slice(0, 6).join(' ') };
          openPara.lines += 1;
          openPara.words += txt.split(' ').filter(Boolean).length;
          if (ln.isLast) flushPara(true);
        }
      }
      pageCols.push({ name, lines });
    });
    // פסקה חתוכה בין עמודים/טורים ממשיכה להצטבר — רק isLast=true או כותרת
    // חותמים פסקה (סה"כ המודל מתאים לרצף המאוחה של הייחוס).
    pages.push({
      index: pg.index, type,
      folio: pg.folioDisplay ? { text: pg.folioDisplay, numbered: true } : { text: null, numbered: false },
      header, tocEntries, columns: pageCols
    });
  }
  flushPara(false);

  const model = {
    meta: {
      source: 'ours-red',
      generator: 'tools/layout-parity/run-ours.js',
      text: 'audits/no_long_test_text.txt',
      pages: pages.length,
      engine: 'red-build typeset (live path: IMUD defaults + Guttman Rashi + font-metrics)',
      layoutHash: result.layoutHash
    },
    pages,
    document: {
      typeSeq: pages.map(p => p.type),
      folioSeq: pages.filter(p => p.folio.text).map(p => ({ page: p.index, text: p.folio.text })),
      paragraphSeq: paraSeq,
      lineSeq,
      toc: {
        generalCount: tocSummary.general,
        detailedCount: tocSummary.detailed,
        generalEntries: tocSummary.generalEntries,
        detailedEntries: tocSummary.detailedEntries
      }
    }
  };
  const modelPath = path.join(outDir, 'ours-model.json');
  fs.writeFileSync(modelPath, JSON.stringify(model));
  console.error(`model: ${modelPath} — ${paraSeq.length} paragraphs, ${lineSeq.length} lines`);

  // ---------- PDF באותן הגדרות בדיוק ----------
  const pdf = exportPdf(text, settings, fontBytes, 'Guttman Rashi');
  if (!pdf.ok) { console.error('exportPdf failed:', pdf.error); process.exit(2); }
  const pdfPath = path.join(outDir, 'ours.pdf');
  fs.writeFileSync(pdfPath, Buffer.from(pdf.bytes));
  console.error(`pdf: ${pdfPath} — ${(pdf.bytes.length / 1024).toFixed(0)} KB`);

  unregisterFont('Guttman Rashi');
}

main();
