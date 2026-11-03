// src/engine/parser/block-tokenizer.js — H0–H7 / P / endnote / editorial tokens (REQ-PAR-03/04, CP1)
'use strict';

const crypto = require('crypto');
const { HEADING_RE, ENDNOTE_PREFIX, ENDNOTE_NUMBERED, ENDNOTE_CLASS } = require('./dfa-lexer');
const { scanBrackets } = require('./bracket-scanner');

const ATOMIC_SPACE = '\uE000'; // V3/V4 breakthrough: רווח אטומי בתוך הערה — למדידה בלבד

/** נרמול גרשים/מרכאות + ניקוי PUA פנימי (REQ-PAR-05; Z.ai fixes). */
function normalizeText(s) {
  return s
    .replace(/[\u2018\u2019]/g, '"')            // חילוף מרכאות לועזיות
    .replace(/\u05F4/g, '\u05F3')               // גרשיים → גרש (כלל one-way לפי Z.ai fix)
    .replace(/[\uE000-\uF8FF]/g, (ch) => ch);   // PUA נשמר לבדיקה per-char; U+E000 מוסר לפני render בשלב output
}

let tokenSeq = 0;
function mkToken(type, payload) {
  return { id: `t${++tokenSeq}`, type, ...payload };
}

/**
 * Tokenizer: שורות → טוקנים.
 * - כותרת N - … (N∈0..7) → heading (מקף חובה; בלי מקף = פסקה בשקט)
 * - `##…##` → editorial — מוסר לחלוטין מהפלט אך נרשם ל‑audit
 * - `הערת סיום - …` → endnote
 * - `[a][b]` רצופים → הערות נפרדות (REQ-PAR-04)
 * - בתוך `[...]`: רווחים → \uE000 (אטומי, REQ-LB-04)
 */
function tokenize(bodyLines) {
  tokenSeq = 0;
  const tokens = [];
  for (const raw of bodyLines) {
    let line = normalizeText(raw.trim()); // editable: editorial ##…## מוסר מהשורה (Spec §7)
    if (!line) continue;

    let m = line.match(HEADING_RE);
    if (m) {
      const level = m[2] !== undefined ? Number(m[2]) : (m[1] === 'הקדמה' ? 0 : 1);
      tokens.push(mkToken('heading', { level, text: m[4] || m[0], raw: line }));
      continue;
    }
    // **D-40 (תיקון P1-5):** הבחנה ממוספר/מחלקה — בעבר כל שורה "הערת סיום - X"
    // פוענחה כהערת תוכן, וכותרת המחלקה ("הערות סיום") נהפכה להערה פיקטיבית
    // ונותרה כשורה זרה בגוף הטקסט. כעת: ממוספרת ⇒ {num, text}; מחלקה ⇒ הוראה
    // (directive) המגדירה את כותרת עמודי ההערות של החלק — לא תוכן, לא גוף.
    const mNum = line.match(ENDNOTE_NUMBERED);
    if (mNum) {
      tokens.push(mkToken('endnote', { num: Number(mNum[1]), text: mNum[2].trim(), raw: line }));
      continue;
    }
    if (ENDNOTE_CLASS.test(line) && !/\d/.test(line.slice(0, 14))) {
      tokens.push(mkToken('endnote-class', { title: line.match(ENDNOTE_CLASS)[1].trim(), raw: line }));
      continue;
    }
    if (ENDNOTE_PREFIX.test(line)) {
      tokens.push(mkToken('endnote', { text: line.replace(ENDNOTE_PREFIX, '').trim(), raw: line }));
      continue;
    }
    // editorial ##…## — הסרה מלאה (נרשם; לעולם לא נגלה בפלט — Spec §7)
    const editorial = line.match(/##(.+?)##/g);
    if (editorial) {
      for (const e of editorial) tokens.push(mkToken('editorial', { text: e.slice(2, -2), removed: true }));
      line = line.replace(/##.+?##/g, ' ').replace(/\s+/g, ' ').trim();
      if (!line) continue;
    }

    // חילוץ הערות [..] עם מחסנית; זוגות רצופים → הערות נפרדות
    const segs = scanBrackets([{ text: line, paraIndex: tokens.length }]);
    let cursor = 0;
    const parts = [];
    const notes = [];
    // בנייה לפי pairs משמאל לימין (outermost first)
    const outer = segs.pairs.filter(p => p.depth === 1).sort((a, b) => a.open - b.open); // חיצוניים בלבד (depth 1)
    for (const p of outer) {
      const before = line.slice(cursor, p.open).trim();
      if (before) parts.push({ kind: 'text', value: before });
      const noteText = line.slice(p.open + 1, p.close).trim().replace(/ +/g, ATOMIC_SPACE);
      notes.push(noteText);
      parts.push({ kind: 'note-ref', noteIndex: notes.length - 1 });
      cursor = p.close + 1;
    }
    const tail = line.slice(cursor).trim();
    if (tail) parts.push({ kind: 'text', value: tail });

    tokens.push(mkToken('paragraph', { parts, notes, unmatchedClosers: segs.unmatchedClosers, raw: line }));
  }
  return tokens;
}

/** CP1: hash של מולטיסט הטוקנים — עקרון שימור תוכן (BRZ-15). */
function contentHash(tokens) {
  const stable = JSON.stringify(tokens.flatMap(t => {
    if (t.type === 'paragraph') return [['P', ...t.parts.map(p => p.kind === 'text' ? p.value : `⟦${t.notes[p.noteIndex]}⟧`), String(t.notes.length)]];
    if (t.type === 'heading') return [['H', String(t.level), t.text]];
    if (t.type === 'endnote') return [['EN', String(t.num || ''), t.text]];
    if (t.type === 'endnote-class') return []; // directive — לא תוכן (D-40)
    return [];
  }));
  return crypto.createHash('sha256').update(stable, 'utf8').digest('hex');
}

module.exports = { tokenize, contentHash, normalizeText, ATOMIC_SPACE };
