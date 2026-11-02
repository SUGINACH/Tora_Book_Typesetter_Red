// src/engine/decoration/numbering-audit.js — Numbering invariants: pn-sequence / pn-overflow (S9.1.6)
'use strict';

/**
 * בודק אינווריאנטים עקביות מספור (S9.1.6): "sequence monotonic, no dup/skip except
 * declared blanks; feeds audit kind pn-*".
 *
 * **pn-sequence** — הפרות סדר בסדרת המספור:
 *  1. סודי העמודים הנספרים חייבים להיות 1..N בדיוק (ללא דילוג/כפילות).
 *  2. הערך האפקטיבי (סוד − start‑idx + initial) חייב להתאים לנוסחה לכל עמוד.
 *  3. הגיליונות המוצגים חייבים להיות מונוטוניים עולים בקפידה (בתוך עמודים נספרים).
 *  "declared blanks" (מותרים במפורש ואינם הפרה): עמוד לא‑נספר לפי תבנית/צ׳קבוקס
 *  (shaar/toc/endnotes/custom), עמוד פתיחת פרק (D-36 — נספר ואינו מוצג), סוד < start‑idx
 *  (נוסחת V1) ו‑position=none.
 *
 * **pn-overflow** — גלישת גיליון: טקסט הגיליון הממוסגר רחב מהתקציב (30% מרוחב תיבת
 * התוכן) או מרוחב העמוד כולו — מצב שהיה נשבר בפועל ב־daf-hebrew + מסגרות + מספרי אלפים.
 *
 * כל הפרה → ledger.create(kind, ...) + מעבר persists — אף אבחון לא מושתק (כלל 3).
 */

const FOLIO_BUDGET_PCT = 0.30; // 30% מרוחב תיבת התוכן — תקציב גיליון

/**
 * @param {Array} pages - עמודי הפלט (עם template.contentBox)
 * @param {Array} numbers - תוצר assignNumbers (מקביל לאינדקסים של pages)
 * @param {object} settings
 * @param {Function} measure - (text, sizePt?) => רוחב px
 * @param {object} io - { ledger, eventLog }
 * @returns {{sequence:Array, overflow:Array}}
 */
function auditNumbering(pages, numbers, settings, measure, io = {}) {
  const { ledger, eventLog } = io;
  const sequence = [];
  const overflow = [];

  // ---- pn-sequence: סודים רציפים + נוסחה + מונוטוניות תצוגה ----
  const counted = [];
  numbers.forEach((n, i) => { if (n.counted) counted.push({ i, ...n }); });
  const startIdx = Math.max(1, Math.round(settings['page-num-start-idx'] || 1));
  const initialValue = Math.round(settings['page-num-initial-value'] || 1);
  let expectedOrdinal = 0;
  let prevVisible = null;
  for (const c of counted) {
    expectedOrdinal++;
    if (c.ordinal !== expectedOrdinal) {
      sequence.push({ page: c.i, expected: expectedOrdinal, got: c.ordinal, why: 'ordinal-skip-or-dup' });
      expectedOrdinal = c.ordinal; // המשך בדיקה מהערך שהתקבל
    }
    const wantEffective = c.ordinal - startIdx + initialValue;
    if (c.page !== wantEffective) {
      sequence.push({ page: c.i, expected: wantEffective, got: c.page, why: 'effective-formula-mismatch' });
    }
    if (c.display && prevVisible !== null && !(c.page > prevVisible)) {
      sequence.push({ page: c.i, prev: prevVisible, got: c.page, why: 'display-not-monotonic' });
    }
    if (c.display) prevVisible = c.page;
  }

  // ---- pn-overflow: רוחב גיליון בתקציב ----
  pages.forEach((pg, i) => {
    const n = numbers[i];
    if (!n || !n.display) return;
    const contentW = pg.template && pg.template.contentBox
      ? (pg.template.contentBox.right - pg.template.contentBox.left) || pg.template.width
      : (pg.template ? pg.template.width : 794);
    const budget = Math.max(40, contentW * FOLIO_BUDGET_PCT);
    const w = measure(n.display);
    if (w > budget) {
      overflow.push({ page: i, widthPx: Math.round(w), budgetPx: Math.round(budget), text: n.display });
    }
  });

  // ---- ledger wiring (כל הפרה נרשמת; אין השתקה) ----
  if (ledger) {
    for (const s of sequence) {
      const rec = ledger.create('pn-sequence', `page:${s.page}`, s.page, s, 'folio');
      ledger.transition(rec.issue_id, 'persists', 'folio', `numbering sequence violation (${s.why})`);
    }
    for (const o of overflow) {
      const rec = ledger.create('pn-overflow', `page:${o.page}`, o.page, o, 'folio');
      ledger.transition(rec.issue_id, 'persists', 'folio', `folio display ${o.widthPx}px > budget ${o.budgetPx}px`);
    }
  }
  if (eventLog) {
    eventLog.emit('folio', 'pn-audit', { sequence: sequence.length, overflow: overflow.length, counted: counted.length });
  }
  return { sequence, overflow };
}

module.exports = { auditNumbering, FOLIO_BUDGET_PCT };
