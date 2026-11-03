// src/engine/layout/headings-escort.js — החלטת מצב כותרות + ליווי (S5.1; נרשם S4)
// heading-{0..7}-mode: full-width | regular | side-note | new-page
'use strict';

/**
 * המרת mode של כותרת להחלטת פריסה מבנית. מרכז locus אחד — אסור לפצל אתר החלטה (D-09).
 * @returns {{fullWidth:boolean, forcePageBreak:boolean, asSideNote:boolean}}
 */
function headingLayoutDecision(level, settings) {
  const mode = settings[`heading-${level}-mode`] || 'regular';
  return {
    fullWidth: mode === 'full-width' && level >= 1, // H0 always full width anyway (PT rules)
    forcePageBreak: mode === 'new-page',
    asSideNote: mode === 'side-note' || level === 7, // ברירת מחדל H7 = הערת צד (BRZ)
  };
}

/**
 * עיבוד מקדים של רשימת בלוקים: דגלי זרימה לפני DP (לא אחרי — lesson V23 "post-hoc flags").
 * ממיר mode → flags על הבלוק עצמו, כך ש‑dp-planner קורא דגלים בלבד.
 */
function applyHeadingModes(blocks, settings) {
  for (const b of blocks) {
    if (b.kind !== 'heading') continue;
    const d = headingLayoutDecision(b.level, settings);
    b.fullWidth = d.fullWidth || b.level === 0;
    b.forcePageBreakBefore = d.forcePageBreak;
    b.asSideNote = d.asSideNote;
  }
  return blocks;
}

module.exports = { headingLayoutDecision, applyHeadingModes };
