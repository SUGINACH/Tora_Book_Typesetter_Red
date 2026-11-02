// src/engine/layout/endnote-pages.js — Endnote pagination engine (REQ-FN-03/04, S7.1.1)
'use strict';

const { PAGE_TYPES } = require('./page-templates');

/**
 * בניית עמודי "הערות" / "הערות (המשך)" בסוף כל חלק:
 * - איפוס מונים per-part; כותרת + עיטורי צד; 1/2 טורים לפי הגדרה;
 * - יישור שורה אחרונה לפי גופן גוף ההערה (f/s-note-body).
 * @param {Array} endnotes - [{text, part}] (מטוקני endnote מהparser)
 * @param {object} settings - כולל _endnoteColCapPx (תקציב טור, pipeline מזרים מהtemplate)
 */
function buildEndnotePages(endnotes, settings, measure, lineHeightPx) {
  if (!settings['endnotes-enabled'] || !endnotes.length) return [];
  const byPart = new Map();
  for (const n of endnotes) {
    const part = n.part || 1;
    if (!byPart.has(part)) byPart.set(part, []);
    byPart.get(part).push(n);
  }

  const pages = [];
  const cap = settings._endnoteColCapPx || Number.POSITIVE_INFINITY;
  for (const [part, notes] of [...byPart.entries()].sort((a, b) => a[0] - b[0])) {
    let pageIndex = 0;
    let page = mkPage(PAGE_TYPES.ENDNOTES, part, pageIndex, title(settings, false));
    let usedY = 0;
    for (let ni = 0; ni < notes.length; ni++) {
      const n = notes[ni];
      // מספור per-part: המונים מתאפסים בכל חלק (counter reset policy 'part')
      const markerIndex = ni + 1;
      const h = estimateNoteHeight(n.text, settings, measure, lineHeightPx);
      if (usedY > 0 && usedY + h > cap) {
        pages.push(page);
        pageIndex++;
        page = mkPage(PAGE_TYPES.ENDNOTES, part, pageIndex, title(settings, true));
        usedY = 0;
      }
      page.notes.push({ ...n, marker: formatMarker(markerIndex, settings), heightPx: h });
      usedY += h;
    }
    pages.push(page);
  }
  return pages;
}

function mkPage(type, part, idx, heading) {
  return { type, part, subIndex: idx, heading, notes: [], columns: [[], []] };
}

function title(settings, isContinuation) {
  const base = settings['endnote-title-text'] || 'הערות';
  return isContinuation ? `${base} (המשך)` : base;
}

function formatMarker(i, settings) {
  switch (settings['footnote-marker-style']) {
    case 'decimal': return String(i);
    case 'asterisk': return '*'.repeat(1 + (i % 3));
    case 'parenthesis': return `(${toHebOrDec(i, settings)})`;
    default: return toHebOrDec(i, settings);
  }
}

function toHebOrDec(i, settings) {
  if (settings['page-num-format'] === 'decimal') return String(i);
  const { toHebrewNumber } = require('../decoration/folio');
  return toHebrewNumber(i);
}

function estimateNoteHeight(text, settings, measure, lineHeightPx) {
  const size = settings['body-font-size-pt'] * 0.8;
  const words = text.split(/\s+/).filter(Boolean);
  let lines = 1, w = 0;
  const colW = settings._endnoteColWidthPx || 300;
  for (const word of words) {
    const ww = measure(word, size);
    if (w + ww > colW && w > 0) { lines++; w = ww + measure(' ', size); } else w += ww + measure(' ', size);
  }
  return lines * lineHeightPx(size);
}

module.exports = { buildEndnotePages, formatMarker };
