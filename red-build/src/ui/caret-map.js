// src/ui/caret-map.js — מיפוי דו־כיווני סמן↔עמוד (REQ-UI-05: "סנכרון סמן↔עמוד")
'use strict';

/**
 * מבוסס על חוזה הטוקנים של המנוע: כל שורת־גוף לא־ריקה ⇒ טוקן אחד בדיוק
 * (block-tokenizer); שורות העמודים נושאות tokenId. המפה מחברת:
 *   מיקום תו במקור ← שורת גוף ← טוקן ← העמוד שמכיל את שורותיו,
 * ובכיוון ההפוך: עמוד ← הטוקן הראשון בסדר הקריאה ← שורת מקור ← מיקום תו.
 *
 * פתיח המסמך (metadata) אינו טוקנים — מוצא מעבר לפתיח לפי אותו כלל
 * של dfa-lexer (שורה ריקה/כותרת/הערת־סיום סוגרות את הפתיח).
 */

const { lexDocument, HEADING_RE, ENDNOTE_PREFIX } = require('../engine/parser/dfa-lexer');

/** קווי המקור: מיקומי התחלה של כל שורה. */
function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}

function buildCaretMap(rawText, serializedResult) {
  const { bodyLines } = lexDocument(rawText);
  const tokens = serializedResult.tokens; // [{id, type, level, raw}] — סדר הפקוד
  const pages = serializedResult.pages;

  // tokenId → אינדקס עמוד ראשון שמכיל אותו (כולל פס חוצה־טורים — FWD-1)
  const pageByToken = new Map();
  const tokensByPage = new Map();
  for (const pg of pages) {
    const lines = [
      ...((pg.spanning && pg.spanning.lines) || []),
      ...(pg.columns || []).flat()
    ];
    const set = new Set();
    for (const ln of lines) {
      const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
      if (tok == null) continue;
      set.add(tok);
      if (!pageByToken.has(tok)) pageByToken.set(tok, pg.index);
    }
    tokensByPage.set(pg.index, [...set]);
  }

  // שורת־גוף לא־ריקה ↔ אינדקס טוקן מצטבר (כלל block-tokenizer: trim + לא ריק ⇒ טוקן)
  let nonEmpty = 0;
  const tokenAtBodyLine = new Array(bodyLines.length).fill(-1); // bodyLineIdx → tokenIdx (הטוקן של השורה עצמה)
  const lastTokenThrough = new Array(bodyLines.length).fill(-1); // bodyLineIdx → טוקן אחרון שנוצר עד וכולל שורה זו
  for (let i = 0; i < bodyLines.length; i++) {
    if (bodyLines[i].trim() !== '') { tokenAtBodyLine[i] = nonEmpty; nonEmpty++; }
    lastTokenThrough[i] = nonEmpty - 1;
  }

  const starts = lineStarts(rawText);
  const bodyStartLine = starts.length - bodyLines.length; // שורות הגוף הן סיומת השורות (הפתיח נזנח)

  /** מיקום תו ← אינדקס שורת־מקור */
  function lineOfChar(charIndex) {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= charIndex) lo = mid; else hi = mid - 1;
    }
    return lo;
  }

  /** טוקן ← עמוד; טוקן שלא הוצב (editorial) ← העמוד של הטוקן הקודם שהוצב */
  function pageOfTokenIdx(ti) {
    for (let k = ti; k >= 0; k--) {
      const p = pageByToken.get(tokens[k].id);
      if (p != null) return p;
    }
    return pages.length ? pages[0].index : null;
  }

  /** מיקום תו במקור ← אינדקס עמוד (כיוון א׳ של הסנכרון) */
  function caretToPage(charIndex) {
    if (!pages.length) return null;
    const line = lineOfChar(Math.max(0, Math.min(charIndex, rawText.length)));
    const bodyLine = line - bodyStartLine;
    if (bodyLine < 0) return pages[0].index; // פתיח המסמך — העמוד הראשון
    const ti = lastTokenThrough[Math.min(bodyLine, bodyLines.length - 1)];
    if (ti < 0) return pages[0].index;
    return pageOfTokenIdx(ti);
  }

  /** אינדקס עמוד ← מיקום תו במקור (תחילת שורת המקור של הטוקן הראשון; כיוון ב׳) */
  function pageToCaret(pageIndex) {
    const toks = tokensByPage.get(pageIndex);
    if (!toks || !toks.length) return null;
    const tokenId = toks[0];
    const ti = tokens.findIndex(t => t.id === tokenId);
    if (ti < 0) return null;
    // אינדקס שורת־גוף: מספר הטוקנים שנוצרו עד טוקן זה = מספר שורות לא־ריקות עד אליו
    let bodyLine = -1, count = 0;
    for (let i = 0; i < bodyLines.length; i++) {
      if (bodyLines[i].trim() !== '') {
        if (count === ti) { bodyLine = i; break; }
        count++;
      }
    }
    if (bodyLine < 0) return null;
    const rawLine = bodyStartLine + bodyLine;
    return starts[Math.min(rawLine, starts.length - 1)];
  }

  return { caretToPage, pageToCaret, pageByToken, tokensByPage, pageCount: pages.length };
}

module.exports = { buildCaretMap };
