// src/engine/parser/dfa-lexer.js — Layer 1: metadata recognition ONLY in preamble (REQ-PAR-01)
'use strict';

const HEADING_RE = /^(כותרת\s*([0-7])|חלק\s+([א-ת]+)|הקדמה)\s*[-–—]\s*(.+)$/;
// **D-40 (תיקון P1-5):** הבחנה בין הערה ממוספרת לבין הוראת כותרת־מחלקה.
// ממוספרת:  `הערת סיום-1 - טקסט` / `הערת סיום 1 - טקסט`  (המספר = עוגן הסמן במקור)
// מחלקה:    `הערת סיום - כותרת`                      (הגדרת כותרת עמודי ההערות של החלק)
const ENDNOTE_PREFIX = /^הערת סיום\s*[-–—]/;
const ENDNOTE_NUMBERED = /^הערת\s*סיום\s*[-–—]?\s*([0-9]{1,4})\s*[-–—]\s*(.+)$/;
const ENDNOTE_CLASS = /^הערת\s*סיום\s*[-–—]\s*(.+)$/;
const METADATA_KEYS = ['ספר', 'נושא', 'מחבר', 'מהדורא', 'מקום', 'שנה', 'מהדורה', 'editors', 'title'];

/**
 * DFA states: PREAMBLE -> BODY. יציאה מ‑PREAMBLE: שורה ריקה או כותרת ראשונה.
 * שורה כמו `נושא - דין סוכה ישנה` באמצע המסמך נשארת פסקה (REQ-PAR-01 / לקח Z.ai).
 */
function lexDocument(rawText) {
  const lines = rawText.replace(/\r\n?/g, '\n').split('\n');
  const state = { phase: 'PREAMBLE' };
  const metadata = {};
  const body = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (state.phase === 'PREAMBLE') {
      if (trimmed === '') { state.phase = 'BODY'; continue; }
      if (HEADING_RE.test(trimmed) || ENDNOTE_PREFIX.test(trimmed)) {
        state.phase = 'BODY'; body.push(line); continue;
      }
      const m = trimmed.split(/\s+[-–—]\s+/);
      if (m.length >= 2 && METADATA_KEYS.includes(m[0].toLowerCase())) {
        metadata[m[0]] = m.slice(1).join(' - ');
        continue;
      }
      // שורה שאינה metadata → גם היא סוגרת את הפתיח
      state.phase = 'BODY';
      body.push(line);
      continue;
    }
    body.push(line);
  }
  return { metadata, bodyLines: body };
}

module.exports = { lexDocument, HEADING_RE, ENDNOTE_PREFIX, ENDNOTE_NUMBERED, ENDNOTE_CLASS, METADATA_KEYS };
