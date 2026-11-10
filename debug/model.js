// debug/model.js — תוצאת typeset() של RED → מודל גיאומטרי מתמטי (בלי DOM) + בונה דוח דיבאג
// מקור הגיאומטריה: geometry-projector של RED (projectDocument) — אותו מקור שממנו נוצרים ה-PDF והייצוא.
// קובץ זה רק קורא מהמנוע (require) ולא משנה אותו. Node בלבד (הדפדפן טוען את הדוח המוכן כ-JSON).
'use strict';

const SETTING_KEYS = [
  'page-size', 'margin-top-px', 'margin-bottom-px', 'grid-col-width-pct',
  'grid-margin-side-pct', 'grid-gutter-pct', 'body-font-size-pt', 'body-line-height', 'body-last-line-align'
];

function nearestCol(cols, x, w) {
  const cx = x + w / 2;
  let best = 0, bd = Infinity;
  cols.forEach((c, i) => {
    const d = cx >= c.x && cx <= c.x + c.w ? 0 : Math.min(Math.abs(cx - c.x), Math.abs(cx - c.x - c.w));
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

// col: אינדקס טור (סדר קריאה) | -1 פס חוצה-טורים | -2 הערת-צד (שוליים)
function compactLine(ln, col, band) {
  const words = ln.words || [];
  const ws = words.map(w => [w.x, w.w]);
  let inkL = null, inkR = null;
  for (const [x, w] of ws) {
    if (inkL === null || x < inkL) inkL = x;
    if (inkR === null || x + w > inkR) inkR = x + w;
  }
  return {
    x: ln.x, y: ln.y, w: ln.w, h: ln.h, kind: ln.kind, level: ln.level || null,
    isLast: !!ln.isLast, tokenId: ln.tokenId || null, align: ln.align || null, sizePt: ln.sizePt || null,
    col, band, nWords: ws.length, inkL, inkR,
    t: words.slice(0, 4).map(w => w.text).join(' ').slice(0, 30), ws
  };
}

/** @param {object} result — תוצאת typeset() (או ui-result-v1 מסוריאל) */
function buildModel(result, settings, opts) {
  opts = opts || {};
  const projector = opts.projector || require('../red-build/src/engine/output/geometry-projector');
  const s = settings || result.settings;
  const doc = projector.projectDocument(result, s);
  const pages = doc.pages.map((g, i) => {
    const cp = result.pages[i] || {};
    const tpl = cp.template || {};
    const cols = g.columns.map(c => ({ x: c.x, w: c.w }));
    const lines = [];
    if (g.spanning && g.spanning.lines) g.spanning.lines.forEach(ln => lines.push(compactLine(ln, -1, true)));
    g.lines.forEach(ln => lines.push(compactLine(ln, ln.kind === 'side-note' ? -2 : nearestCol(cols, ln.x, ln.w), false)));
    const cpFn = cp.footnotes || [];
    const sameFn = cpFn.length === g.footnotes.length; // גובה הערה נלקח ממודל CP5 רק כשהספירה תואמת
    return {
      index: i, type: cp.type || 'unknown', width: g.width, height: g.height,
      contentBox: { top: g.contentBox.top, bottom: g.contentBox.bottom, height: g.contentBox.height },
      columns: cols,
      gutter: tpl.gutter != null ? tpl.gutter : null,
      margins: tpl.margins ? { top: tpl.margins.top, bottom: tpl.margins.bottom, side: tpl.margins.side, outer: tpl.margins.outer } : null,
      chapterOpening: !!cp.chapterOpening,
      lines,
      footnotes: g.footnotes.map((f, j) => ({ x: f.x, y: f.y, w: f.w, h: sameFn ? cpFn[j].heightPx : null, marker: f.marker || null })),
      decorations: (g.decorations || []).filter(d => Number.isFinite(d.x) && Number.isFinite(d.y))
        .map(d => ({ x: d.x, y: d.y, w: d.w || 0, h: d.h || 0, kind: d.kind || 'decoration', inkType: d.inkType || null })),
      ink: doc.inkBounds && doc.inkBounds[i] ? doc.inkBounds[i] : null
    };
  });
  const settingsSubset = {};
  SETTING_KEYS.forEach(k => { if (s && s[k] !== undefined) settingsSubset[k] = s[k]; });
  return { schema: 'red-debug-model-v1', units: 'px', layoutHash: doc.layoutHash, settings: settingsSubset, pages };
}

/** דוח דיבאג מלא: מודל + audit + ציר שלבים + סיבתיות. אינו משנה את result. */
function buildDebugReport(result, opts) {
  opts = opts || {};
  const A = require('./geometry-audit');
  const C = require('./causality');
  const t0 = performance.now();
  const model = buildModel(result, opts.settings || result.settings, opts);
  const t1 = performance.now();
  const audit = A.auditModel(model, opts);
  const t2 = performance.now();
  const trace = result.events && result.events.toTraceV2 ? result.events.toTraceV2() : result.trace;
  const ledger = result.ledger && result.ledger.toSchemaV2 ? result.ledger.toSchemaV2() : result.ledger;
  const report = {
    schema: 'red-debug-report-v1',
    layoutHash: result.layoutHash,
    pageCount: model.pages.length,
    model, audit,
    timeline: C.buildTimeline(trace, ledger),
    causality: C.buildCausality(ledger),
    timing: { modelMs: Math.round((t1 - t0) * 10) / 10, auditMs: Math.round((t2 - t1) * 10) / 10 }
  };
  if (!opts.keepWords) model.pages.forEach(p => p.lines.forEach(l => { delete l.ws; }));
  return report;
}

module.exports = { buildModel, buildDebugReport, SETTING_KEYS };
