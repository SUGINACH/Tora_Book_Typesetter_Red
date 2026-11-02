// src/engine/decoration/toc-builder.js — TOC general/detail, leader dots, clickable entries (REQ-HDR-05)
'use strict';

/**
 * בניית רשומות TOC מ‑AST: per-level show/inline/group; דפים בעברית לפי folio.
 * @param {Array} headings - [{level, text, page}]
 * @param {object} settings
 */
function buildTocEntries(headings, settings, numbersByIndex) {
  const entries = [];
  for (const h of headings) {
    if (!settings[`toc-level-${h.level}-show`]) continue;
    const num = numbersByIndex[h.page];
    entries.push({
      level: h.level,
      text: h.text,
      pageLabel: num && num.display ? num.display : '',
      inline: !!settings[`toc-level-${h.level}-inline`],
      targetPage: h.page, // ל‑PDF bookmark / קישור פנימי
      leaderDots: true,
    });
  }
  return entries;
}

/** כללי + מפורט: general = רמות 1–2; detail = כל הרמות. */
function splitGeneralDetail(entries) {
  return {
    general: entries.filter(e => e.level <= 2),
    detail: entries,
  };
}

module.exports = { buildTocEntries, splitGeneralDetail };
