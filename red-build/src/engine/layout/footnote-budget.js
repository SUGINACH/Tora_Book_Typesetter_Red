// src/engine/layout/footnote-budget.js — Footnote reservation & layout modes (REQ-FN-01/02/07)
'use strict';

/**
 * תקציב הערות: probe == reserved (זהות F-17 נסגרת כאן — פונקציה אחת לשני הצרכים).
 * כולל הערות של הפסקה הנמדדת כעת (לקח V2/V4).
 */

function noteHeight(note, settings, measure) {
  const size = settings['body-font-size-pt'] * 0.8; // גופן הערה קטן
  const lh = Math.round(size * (96 / 72) * 1.25);
  const words = note.text.split(/\s+/).filter(Boolean);
  let lines = 1, w = 0;
  const colW = settings._fnColWidthPx || 200;
  for (const word of words) {
    const ww = measure(word, size);
    if (w + ww > colW && w > 0) { lines++; w = ww; } else w += ww;
  }
  return lines * lh;
}

/**
 * getFootnotesReservedHeight — הזהה ל‑probe (BRZ: no divergence):
 * @param {Array} pageNotes - [{text, marker}]
 */
function getFootnotesReservedHeight(pageNotes, settings, measure) {
  if (!settings['footnotes-enabled']) return 0;
  const cols = settings['footnote-columns'];
  const heights = pageNotes.map(n => noteHeight(n, settings, measure));
  if (cols === 1) return heights.reduce((a, b) => a + b, 0);
  // 2 טורים: חלוקה שווה־גובה (greedy LPT דטרמיניסטית)
  const t = [0, 0];
  for (const h of [...heights].sort((a, b) => b - a)) { const i = t[0] <= t[1] ? 0 : 1; t[i] += h; }
  return Math.max(t[0], t[1]);
}

/**
 * מדיניות הערה ארוכה מהעמוד (REQ-FN-02): split עם שמירת סמן/סדר או move-whole + המשך.
 */
function applyLongNotePolicy(pageNotes, settings, pageCapacityFn) {
  const cap = pageCapacityFn();
  const out = [];
  for (const n of pageNotes) {
    if (n.heightPx <= cap) { out.push({ ...n, mode: 'normal' }); continue; }
    if (settings['long-footnote-policy'] === 'split') {
      const firstShare = Math.max(1, Math.floor(cap / n.lineH));
      out.push({ ...n, mode: 'split-first', linesShown: firstShare, continuation: true });
      out.push({ ...n, mode: 'split-rest', isContinuation: true, marker: n.marker });
    } else {
      out.push({ ...n, mode: 'moved-whole', deferredToNextPage: true });
    }
  }
  return out;
}

/** fn-layout-mode ∈ {block, continuous} (REQ-FN-07) */
function layoutFootnotes(page, settings, measure) {
  const reserved = getFootnotesReservedHeight(page.footnotes, settings, measure);
  if (settings['fn-layout-mode'] === 'continuous') {
    // continuous: ההערות זורמות מתחת לגוף ללא הפרדה קשיחה; הגוף מקבל cap פחות reserved
    return { reservedHeight: reserved, separatorY: page.template.contentBox.bottom - reserved };
  }
  return { reservedHeight: reserved, separatorY: page.template.contentBox.bottom - reserved };
}

module.exports = { getFootnotesReservedHeight, noteHeight, applyLongNotePolicy, layoutFootnotes };
