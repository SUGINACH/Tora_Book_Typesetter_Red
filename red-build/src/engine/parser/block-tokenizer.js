// src/engine/parser/block-tokenizer.js — H0–H7 / P / endnote / editorial tokens (REQ-PAR-03/04, CP1)
'use strict';

const crypto = require('crypto');
const { HEADING_RE, ENDNOTE_CLASS_RE, DEFAULT_ENDNOTE_PREFIX, compileEndnotePrefix } = require('./dfa-lexer');
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
 * - `הערת סיום - …` → **endnote (תוכן!)** — הסמנטיקה המקורית (S4.5, תיקון D-40):
 *   הקידומת מגדירה את הטקסט שאחריה כהערת סיום. במסמך המודפס הקידומת עצמה
 *   אינה מופיעה (כלל פענוח, לא עיטור — מסמך chat-v20.3 ההיסטורי).
 * - `הערת סיום-1 - טקסט` → endnote ממוספרת (D-40; עוגן סמן).
 * - `הערות סיום - כותרת` (רבים!) → הוראת כותרת עמודי ההערות — הצורה היחידה
 *   שאינה מתנגשת עם מזהה התוכן (ביקורת 03.11: הצורה הקודמת בלעה הערות אמיתיות).
 * - תוחמי הערות השוליים מוגדרים: opts.fnOpen/fnClose (ברירת מחדל [ ]).
 * - `[a][b]` רצופים → הערות נפרדות (REQ-PAR-04)
 * - בתוך `[...]`: רווחים → \uE000 (אטומי, REQ-LB-04)
 * @param {string[]} bodyLines
 * @param {object} [opts] — { endnotePrefix, endnotePrefixRe, fnOpen, fnClose } (S4.5)
 */
function tokenize(bodyLines, opts = {}) {
  tokenSeq = 0;
  // מזהה הערת הסיום: ביטוי מוכן (מה-lexer) או בנוי מהקידומת; '' ⇒ מבוטל
  const endnoteRe = opts.endnotePrefixRe instanceof RegExp
    ? opts.endnotePrefixRe
    : compileEndnotePrefix(opts.endnotePrefix != null ? opts.endnotePrefix : DEFAULT_ENDNOTE_PREFIX);
  const endnoteNumRe = (() => {
    // ממוספרת: `הערת סיום-1 - טקסט` — נבנית מאותה קידומת (ללא המקף האחרון) + מספר + מקף
    const p = String(opts.endnotePrefix != null ? opts.endnotePrefix : DEFAULT_ENDNOTE_PREFIX).trim() || DEFAULT_ENDNOTE_PREFIX;
    const base = p.replace(/[-–—]\s*$/, '').trim();
    if (!base) return null;
    const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
    return new RegExp('^' + esc + '\\s*[-–—]?\\s*([0-9]{1,4})\\s*[-–—]\\s*(.+)$');
  })();
  const fnOpen = opts.fnOpen != null ? String(opts.fnOpen) : '[';
  const fnClose = opts.fnClose != null ? String(opts.fnClose) : ']';
  // S4.5: תוחם ריק/רווחים ⇒ הזיהוי מבוטל — scanBrackets מקבל את הערך הגולמי
  // (לא fallback ל-[) כדי שביטול מפורש לא ייהפך בטעות לזיהוי ברירת מחדל.
  const fnEnabled = fnOpen.trim().length > 0 && fnClose.trim().length > 0;
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
    // **S4.5 (תיקון D-40 — ביקורת 03.11):** סדר הבדיקות שהוחזר לסמנטיקה המקורית:
    // 1) ממוספרת (עוגן) 2) תוכן (כל שורה המתחילה בקידומת = הערה!) 3) הוראת
    // כותרת — רק בצורת הרבים «הערות סיום - …» שאינה יכולה להתנגש עם הקידומת.
    if (endnoteNumRe) {
      const mNum = line.match(endnoteNumRe);
      if (mNum) {
        tokens.push(mkToken('endnote', { num: Number(mNum[1]), text: mNum[2].trim(), raw: line }));
        continue;
      }
    }
    if (endnoteRe) {
      const mEnd = line.match(endnoteRe);
      if (mEnd && mEnd[1] && mEnd[1].trim()) {
        tokens.push(mkToken('endnote', { text: mEnd[1].trim(), raw: line }));
        continue;
      }
    }
    const mCls = line.match(ENDNOTE_CLASS_RE);
    if (mCls) {
      tokens.push(mkToken('endnote-class', { title: mCls[1].trim(), raw: line }));
      continue;
    }
    // editorial ##…## — הסרה מלאה (נרשם; לעולם לא נגלה בפלט — Spec §7)
    const editorial = line.match(/##(.+?)##/g);
    if (editorial) {
      for (const e of editorial) tokens.push(mkToken('editorial', { text: e.slice(2, -2), removed: true }));
      line = line.replace(/##.+?##/g, ' ').replace(/\s+/g, ' ').trim();
      if (!line) continue;
    }

    // חילוץ הערות [..] עם מחסנית; זוגות רצופים → הערות נפרדות; תוחמים מוגדרים (S4.5)
    const segs = scanBrackets([{ text: line, paraIndex: tokens.length }], { open: fnOpen, close: fnClose });
    let cursor = 0;
    const parts = [];
    const notes = [];
    // בנייה לפי pairs משמאל לימין (outermost first)
    const outer = segs.pairs.filter(p => p.depth === 1).sort((a, b) => a.open - b.open); // חיצוניים בלבד (depth 1)
    const openCh = fnEnabled ? fnOpen : '[';
    const closeCh = fnEnabled ? fnClose : ']';
    for (const p of outer) {
      const before = line.slice(cursor, p.open).trim();
      if (before) parts.push({ kind: 'text', value: before });
      // **S4.6 (ביקורת 3):** חיתוך לפי תחילת הסוגר + אורכו בפועל (closeStart/closeLen
      // מהסורק) — נכון גם לתוחמים מרובי-תווים (']]'/END) ולצורה העברית ]ם. בעבר
      // נוסף אורך התוחם המוגדר למיקום התו האחרון — קיצוץ/דילוג תווים בתוחם ארוך.
      const cs = p.closeStart != null ? p.closeStart : p.close;
      const cl = p.closeLen != null ? p.closeLen : closeCh.length;
      const noteText = line.slice(p.open + openCh.length, cs).trim().replace(/ +/g, ATOMIC_SPACE);
      notes.push(noteText);
      parts.push({ kind: 'note-ref', noteIndex: notes.length - 1 });
      cursor = cs + cl;
    }
    const tail = line.slice(cursor).trim();
    if (tail) parts.push({ kind: 'text', value: tail });

    tokens.push(mkToken('paragraph', { parts, notes, unmatchedClosers: segs.unmatchedClosers, raw: line }));
  }
  return tokens;
}

/** CP1: hash של מולטיסט הטוקנים — עקרון שימור תוכן (BRZ-15).
 * **S4.5 (ביקורת 03.11):** כותרת הוראת ההערות (endnote-class) נכנסת לחשיבון —
 * היא טקסט שמופיע בפלט (כותרת עמודי ההערות); השמטתה איפשרה בעבר לתוכן
 * שסווג בטעות כהוראה להיעלם בלי שה-hash יתריע. */
function contentHash(tokens) {
  const stable = JSON.stringify(tokens.flatMap(t => {
    if (t.type === 'paragraph') return [['P', ...t.parts.map(p => p.kind === 'text' ? p.value : `⟦${t.notes[p.noteIndex]}⟧`), String(t.notes.length)]];
    if (t.type === 'heading') return [['H', String(t.level), t.text]];
    if (t.type === 'endnote') return [['EN', String(t.num || ''), t.text]];
    if (t.type === 'endnote-class') return [['ENH', t.title]]; // directive — כותרתו תוכן מוצג (S4.5)
    return [];
  }));
  return crypto.createHash('sha256').update(stable, 'utf8').digest('hex');
}

module.exports = { tokenize, contentHash, normalizeText, ATOMIC_SPACE };
