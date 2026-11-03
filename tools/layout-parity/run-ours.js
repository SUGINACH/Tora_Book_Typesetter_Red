// tools/layout-parity/run-ours.js — הרצת RED על טקסט המבחן בנתיב החי + ייצוא PDF
//
// **S4.9:** הנתיב החי כעת מפעיל את פורט מנוע המקור (legacy-imud-flow) כאשר
// ההגדרות מגיעות מ-default_settings.json המקורי — בדיוק כמו עליית האפליקציה
// (IMUD defaults → importImudSettings → layout-profile='imud').
// המודל המבני משקף את הסכמה של audits/layout-reference.json:
//   pages[] {type, folio, header, columns(גיאומטריה), lines(כל השורות עם col), paragraphs}
//   document {typeSeq, folioSeq, paragraphSeq, toc}
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
const { GEO } = require(path.join(RB, 'src/engine/layout/legacy-imud-flow'));

const PX = 0.75; // px→pt

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

// ---------- סיווג עמודים — אותם כללים נצפים כמו extract-reference.py ----------
function classifyOurs(pg, contentRowCount) {
  const t = pg.type;
  if (t === 'shaar-main' || t === 'shaar-back' || t === 'shaar-sub') return t;
  if (t === 'toc-general') return 'toc-general';
  if (t === 'toc-detailed') return 'toc-detailed';
  if (t === 'blank') return 'blank';
  if (t === 'preface') return 'chapter-open';
  if (t === 'sign-open') return contentRowCount < 12 ? 'sign-open' : 'body';
  return 'body';
}

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
  console.error(`typeset: ${result.pages.length} pages in ${Date.now() - t0}ms (hash ${String(result.layoutHash).slice(0, 12)}) [profile: ${result.legacyProfile ? 'imud-legacy' : 'dp'}]`);

  // ---------- דגם מבני (סכמת הייחוס) ----------
  const pages = [];
  const paraSeq = [];
  let openPara = null;
  const tocSummary = { general: 0, detailed: 0, generalEntries: [], detailedEntries: [] };

  const flushPara = () => {
    if (!openPara) return;
    paraSeq.push(openPara);
    openPara = null;
  };

  for (const pg of result.pages) {
    // ---- שורות העמוד בסכמת הייחוס: col + גיאומטריה ב-pt ----
    const lines = [];
    let bodyRowCount = 0;

    // טורי גוף (ימני/שמאלי; preface = single)
    const twoCol = (pg.type === 'regular' || pg.type === 'sign-open') &&
      pg.columns[0].length > 0 && pg.columns[1].length > 0;
    const colNames = pg.type === 'preface' ? ['single'] : ['right', 'left'];
    const colX = pg.type === 'preface'
      ? [{ x0: GEO.COL_L_X, x1: GEO.COL_L_X + 2 * GEO.COL_W + 13.48 }]
      : [{ x0: GEO.COL_R_X, x1: GEO.COL_R_X + GEO.COL_W }, { x0: GEO.COL_L_X, x1: GEO.COL_L_X + GEO.COL_W }];

    pg.columns.forEach((colLines, ci) => {
      const cn = colNames[ci] || 'single';
      const box = colX[ci] || colX[0];
      for (const ln of colLines) {
        if (!ln.words || !ln.words.length) continue;
        const txt = ln.words.join(' ');
        if (!txt.trim()) continue;
        const isBodyLine = ln.kind === 'paragraph';
        if (isBodyLine) bodyRowCount++;
        // **S4.9 (כמו חילוץ הייחוס):** מילת-החלון (1.5× גודל, בסיס משלה) היא
        // שורת טקסט נפרדת בחילוץ — הגליף שלה מופיע ב-p['lines'] כשורה עצמאית
        // לפני שורת הטקסט שלצידה.
        const hasWin = !!(ln.windowWords && ln.window && isBodyLine);
        if (hasWin) {
          lines.push({
            col: cn, text: ln.windowWords.join(' '), font: 'GuttmanRashiNormal',
            size: ln.sizePt * 1.5,
            x0: (box.x0 + GEO.COL_W - 60) * PX, x1: (box.x0 + GEO.COL_W) * PX,
            y0: ln.y * PX, y1: (ln.y + ln.heightPx) * PX,
            kind: 'body', textNoMarkers: ln.windowWords.join(' '),
            justified: false, widthPx: 60,
            _ln: { ...ln, paraId: ln.paraId, isLast: false, words: ln.windowWords, markerIdx: [] }
          });
        }
        const txtFull = txt;
        // טקסט ללא סמני הערות — לפי אינדקסים מדויקים מהמנוע (אותיות מניה
        // לגיטימיות בגוף אינן נפגעות)
        let noMarkers = '';
        if (isBodyLine) {
          const mset = new Set(ln.markerIdx || []);
          noMarkers = ln.words.filter((w, ix) => !mset.has(ix)).join(' ');
        }
        lines.push({
          col: cn, text: txtFull, font: 'GuttmanRashiNormal', size: ln.sizePt,
          x0: box.x0 * PX, x1: (box.x0 + GEO.COL_W) * PX,
          y0: (ln.y + (hasWin ? 5.5 : 0)) * PX, y1: (ln.y + ln.heightPx) * PX,
          kind: isBodyLine ? 'body' : (ln.kind === 'heading' ? 'heading-inline' : ln.kind),
          textNoMarkers: noMarkers,
          justified: false, widthPx: GEO.COL_W,
          _ln: ln
        });
      }
    });

    // פסים (סימן/h2/h0/h3) — col=null
    for (const b of (pg.bands || [])) {
      lines.push({
        col: null, text: b.text, font: 'GuttmanRashiNormal', size: b.sizePt,
        x0: GEO.COL_L_X * PX, x1: (GEO.COL_L_X + 2 * GEO.COL_W + 13.48) * PX,
        y0: b.y * PX, y1: (b.y + b.h) * PX, kind: 'heading-band', justified: false
      });
      bodyRowCount++;
    }

    // הערות צד — col=null (כמו הייחוס)
    for (const mn of (pg.marginNotes || [])) {
      for (const l of mn.lines) {
        lines.push({
          col: null, text: l.text, font: 'GuttmanRashiNormal', size: 6,
          x0: (mn.side === 'right' ? GEO.MARGIN_R_X : GEO.MARGIN_L_X) * PX,
          x1: (mn.side === 'right' ? GEO.MARGIN_R_X : GEO.MARGIN_L_X) + 0, // יתוקן להלן
          y0: l.y * PX, y1: (l.y + GEO.MN_PITCH) * PX, kind: 'margin-note', justified: false
        });
      }
    }
    // תיקון x1 להערות צד
    for (const l of lines) {
      if (l.kind === 'margin-note') {
        const w = l.text.length * 3; // קירוב; ההשוואה משתמשת בטקסט בלבד
        l.x1 = l.x0 + w;
      }
    }

    // מפריד הערות — הוסר (הגופן המוטמע חסר גליפי כוכבים; ראה legacy-projector)

    // הערות שוליים (תחתית) — col=null; טקסט ללא סמן לצרכי H1
    for (const fn of (pg.footnotes || [])) {
      let first = true;
      for (const l of fn.lines) {
        const ws = Array.isArray(l.words) ? l.words : String(l.words).split(' ');
        const fullText = (first ? fn.marker + ' ' : '') + ws.join(' ');
        lines.push({
          col: null, text: fullText, font: 'GuttmanRashiNormal', size: 8.5,
          x0: GEO.COL_L_X * PX, x1: (GEO.COL_L_X + 2 * GEO.COL_W + 13.48) * PX,
          y0: l.y * PX, y1: (l.y + GEO.FN_PITCH) * PX, kind: 'footnote',
          textNoMarkers: ws.join(' '), justified: false
        });
        first = false;
      }
    }

    // שורות תוכן-עניינים — כמו בייחוס: שורת כותרת (חד-פעולתית — החילוץ מחזיר
    // סדר מילים הפוך) + שורת מספר נפרדת ב-x0<70
    let tocEntries = null;
    if (pg.toc) {
      tocEntries = [];
      if (pg.toc.title) {
        lines.push({
          col: null, text: pg.toc.title, font: 'GuttmanRashiNormal', size: 17,
          x0: 240, x1: 355, y0: 232, y1: 249, kind: 'toc-title', justified: false
        });
      }
      for (const r of (pg.toc.rows || [])) {
        const reversed = r.text.split(' ').reverse().join(' ');
        lines.push({
          col: null, text: reversed, font: 'GuttmanRashiNormal', size: r.sizePt,
          x0: 120, x1: r.x1 * PX,
          y0: r.y * PX, y1: (r.y + 26) * PX, kind: 'toc-row', justified: false
        });
        if (r.folio) {
          lines.push({
            col: null, text: r.folio, font: 'GuttmanRashiNormal', size: 10.5,
            x0: 49.6, x1: 49.6 + 10,
            y0: (r.y + 0.3) * PX, y1: (r.y + 12) * PX, kind: 'toc-num', justified: false
          });
        }
        tocEntries.push({ level: r.level, text: r.text, pageLabel: r.folio, targetPage: null });
      }
      const bucket = pg.type === 'toc-general' ? 'general' : 'detailed';
      tocSummary[bucket] += tocEntries.length;
      tocSummary[bucket + 'Entries'].push(...tocEntries.slice(0, 400));
    }

    // שורות השערים — סדר לוגי; מהדורה+מחבר חד-פעולתיים אצל המקור (חילוץ הפוך)
    for (const g of (pg.gateLines || [])) {
      const txt = g.singleOp ? g.text.split(' ').reverse().join(' ') : g.text;
      lines.push({
        col: null, text: txt,
        font: 'GuttmanRashiNormal', size: g.sizePt,
        x0: 187, x1: 408, y0: g.y * PX, y1: (g.y + g.sizePt * 1.3 * (96 / 72)) * PX,
        kind: 'gate', justified: false
      });
    }

    // ---- סיווג + מספור ----
    const type = classifyOurs(pg, bodyRowCount);
    const header = pg.headerSlots
      ? { right: pg.headerSlots.right || null, center: pg.headerSlots.center || null, left: pg.headerSlots.left || null }
      : { right: null, center: null, left: null };

    pages.push({
      index: pg.index, type,
      folio: pg.folioDisplay ? { text: pg.folioDisplay, numbered: true } : { text: null, numbered: false },
      header, tocEntries, columns: [], lines,
      paragraphs: []
    });
  }

  // ---- פסקאות: איחוי לפי סדר קריאה (עמוד → טור ימני → שמאלי) ----
  for (const p of pages) {
    const byPara = new Map();
    const order = [];
    for (const cn of ['right', 'left', 'single']) {
      const colLines = p.lines.filter(l => l.col === cn);
      colLines.sort((a, b) => a.y0 - b.y0);
      for (const l of colLines) {
        if (l.kind !== 'body') continue;
        const pid = l._ln.paraId;
        if (pid == null) continue;
        if (!byPara.has(pid)) { byPara.set(pid, { lines: 0, words: 0, head: l.text.split(' ').slice(0, 6).join(' '), ended: false }); order.push(pid); }
        const pr = byPara.get(pid);
        pr.lines += 1;
        pr.words += l.text.split(' ').filter(Boolean).length;
        if (l._ln.isLast) pr.ended = true;
      }
    }
    for (const pid of order) {
      const pr = byPara.get(pid);
      const isOpen = openPara && openPara.pid === pid;
      if (isOpen) {
        openPara.lines += pr.lines;
        openPara.words += pr.words;
      } else {
        // איחוי כמו הייחוס: רצף חתיכות p-cut מכמה פסקאות נספר כפסקה אחת
        // עד שורת p-end — בלי לאפס בין פסקאות (החלפת pid לא סוגרת).
        if (openPara) {
          openPara.lines += pr.lines;
          openPara.words += pr.words;
        } else {
          openPara = { pid, lines: pr.lines, words: pr.words, head: pr.head };
        }
      }
      if (pr.ended) flushPara();
    }
    // **S4.9 (כמו הייחוס):** פסקה שנחתכה בין עמודים נסגרת בסוף העמוד —
    // האיחוי של הייחוס הוא בתוך העמוד בלבד (איחוי p-cut באותו עמוד).
    flushPara();
  }
  flushPara();

  const model = {
    meta: {
      source: 'ours-red', generator: 'tools/layout-parity/run-ours.js',
      text: 'audits/no_long_test_text.txt', pages: pages.length,
      engine: 'red-build legacy-imud-flow (live path: IMUD defaults + Guttman Rashi + font-metrics)',
      layoutHash: result.layoutHash
    },
    pages,
    document: {
      typeSeq: pages.map(p => p.type),
      folioSeq: pages.filter(p => p.folio.text).map(p => ({ page: p.index, text: p.folio.text })),
      paragraphSeq: paraSeq.map(p => ({ lines: p.lines, words: p.words, head: p.head })),
      toc: {
        generalCount: tocSummary.general, detailedCount: tocSummary.detailed,
        generalEntries: tocSummary.generalEntries, detailedEntries: tocSummary.detailedEntries
      }
    }
  };
  const modelPath = path.join(outDir, 'ours-model.json');
  fs.writeFileSync(modelPath, JSON.stringify(model, (k, v) => (k === '_ln' ? undefined : v)));
  console.error(`model: ${modelPath} — ${paraSeq.length} paragraphs, ${pages.length} pages`);

  // ---------- PDF באותן הגדרות בדיוק ----------
  const pdf = exportPdf(text, settings, fontBytes, 'Guttman Rashi');
  if (!pdf.ok) { console.error('exportPdf failed:', pdf.error); process.exit(2); }
  const pdfPath = path.join(outDir, 'ours.pdf');
  fs.writeFileSync(pdfPath, Buffer.from(pdf.bytes));
  console.error(`pdf: ${pdfPath} — ${(pdf.bytes.length / 1024).toFixed(0)} KB`);

  unregisterFont('Guttman Rashi');
}

main();
