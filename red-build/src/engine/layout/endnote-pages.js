// src/engine/layout/endnote-pages.js — Endnote pagination engine (REQ-FN-03/04, S7.1.1)
'use strict';

const { PAGE_TYPES, buildPageTemplate } = require('./page-templates');
const { markerFor } = require('../notes/markers');

/** פרופילי רוחב גופן לגוף ההערה (f-note-body-font). */
const NOTE_FONT_FACTORS = { 'David HB': 1.06, 'David': 1.04, 'Narkisim': 1.10, 'Nachlieli': 0.96, 'Alef': 1.02, 'Rubin': 1.05 };

/**
 * בניית עמודי "הערות" / "…(המשך)" בסוף כל חלק:
 * - איפוס מונים per-part (counter reset policy; continuous ⇒ מונה כללי);
 * - כותרת: הוראת כותרת־מחלקה (D-40) אם ניתנה, אחרת endnote-title-text;
 * - 1/2 טורים לפי endnote-columns;
 * - f-note-body-font משפיע על מדידת רוחב מילה בגוף ההערה;
 * - סמן: markerFor לפי footnote-marker-style — **אותו מקור סמכות like the body**
 *   (בעבר היו שלושה ממירים שונים — אי־עקביות מספור, P1-3).
 * @param {Array} endnotes - [{text, part, num?, marker?, fromInline?, noteIndex?}]
 * @param {object} settings - כולל _endnoteColCapPx, _endnoteColWidthPx, _endnoteTitleByPart (Map part→title)
 */
function buildEndnotePages(endnotes, settings, measure, lineHeightPx, hooks = {}) {
  const eventLog = hooks.eventLog || null;
  const ledger = hooks.ledger || null;
  if (!settings['endnotes-enabled'] || !endnotes.length) return [];

  const byPart = new Map();
  const order = [];
  for (const n of endnotes) {
    const part = n.part || 1;
    if (!byPart.has(part)) { byPart.set(part, []); order.push(part); }
    byPart.get(part).push(n);
  }
  order.sort((a, b) => a - b);

  // מדיניות איפוס: continuous ⇒ מונה כללי; part/section/page ⇒ per-part (D-41)
  const continuous = settings['footnote-reset-policy'] === 'continuous';
  let globalSeq = 0;
  const perPartSeq = new Map();

  const style = settings['footnote-marker-style'];
  const cols = settings['endnote-columns'] === 2 ? 2 : 1;
  const cap = settings._endnoteColCapPx || Number.POSITIVE_INFINITY;
  const colW = (settings._endnoteColWidthPx || 300) / cols;
  const fontFactor = NOTE_FONT_FACTORS[settings['f-note-body-font']] || 1;

  const pages = [];
  for (const part of order) {
    const notes = byPart.get(part);
    const titleBase = (settings._endnoteTitleByPart && settings._endnoteTitleByPart.get(part))
      || settings['endnote-title-text'] || 'הערות';
    let pageIndex = 0;
    let page = mkPage(PAGE_TYPES.ENDNOTES, part, pageIndex, title(settings, titleBase, false), cols);
    let usedY = 0;
    for (let ni = 0; ni < notes.length; ni++) {
      const n = notes[ni];
      // סמן: מהגוף (inline-refs — marker שהוקצה בpipeline) או לפי מספר המקור/מיקום
      let marker = n.marker;
      if (!marker) {
        if (continuous) { globalSeq++; marker = markerFor(globalSeq, style); }
        else {
          const s = (perPartSeq.get(part) || 0) + 1;
          perPartSeq.set(part, s);
          marker = markerFor(n.num != null ? n.num : s, style);
        }
      }
      const h = estimateNoteHeight(n.text, settings, measure, lineHeightPx, colW, fontFactor);
      if (usedY > 0 && usedY + h > cap) {
        pages.push(page);
        pageIndex++;
        page = mkPage(PAGE_TYPES.ENDNOTES, part, pageIndex, title(settings, titleBase, true), cols);
        usedY = 0;
      }
      page.notes.push({ ...n, marker, heightPx: h });
      usedY += h;
    }
    if (page.notes.length) pages.push(page);
  }

  if (eventLog) eventLog.emit('notes-budget', 'endnote-pages-built', { pages: pages.length, parts: order.length });
  if (ledger && pages.length === 0 && endnotes.length) {
    const rec = ledger.create('endnote-pagination', 'endnotes', null, { notes: endnotes.length, pages: 0 }, 'notes-budget');
    ledger.transition(rec.issue_id, 'persists', 'notes-budget', 'notes exist but no pages built');
  }
  return pages;
}

function mkPage(type, part, idx, heading, cols) {
  return {
    type, part, subIndex: idx, heading, notes: [],
    columns: Array.from({ length: cols }, () => []),
    footnotes: [], sideNotes: [], headingsOnPage: [],
    balanceInfo: null, fnReservedHeightPx: 0,
    chapterOpening: false,
    isEndnotes: true
  };
}

function title(settings, base, isContinuation) {
  return isContinuation ? `${base} (המשך)` : base;
}

/** גובה הערה בעמודי ההערות — כולל פקטור גופן ורוחב טור אפקטיבי. */
function estimateNoteHeight(text, settings, measure, lineHeightPx, colW, fontFactor = 1) {
  const size = settings['body-font-size-pt'] * 0.8;
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let lines = 1, w = 0;
  for (const word of words) {
    const ww = measure(word, size) * fontFactor;
    if (w + ww > colW && w > 0) { lines++; w = ww; } else w += ww;
  }
  return lines * lineHeightPx(size);
}

module.exports = { buildEndnotePages, estimateNoteHeight, NOTE_FONT_FACTORS };
