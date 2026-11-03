// src/engine/audit/text-edits.js — עריכות טקסט להמלצות עריכה (S11; טהור — בלי תלות במנוע)
'use strict';

/**
 * החלת עריכת העברת־מילה על שורות המקור — מקור יחיד להמלצות־העריכה (engine)
 * ולהחלתן ב־UI (app-shell). מודול טהור: אין pipeline, אין מדידה — רק המרת מערך שורות.
 *
 *  - move-word-down: המילה הראשונה של שורת fromLine (הפסקה הבאה) → סוף שורת toLine (פסקת הממצא)
 *  - move-word-up:   המילה האחרונה של שורת fromLine (פסקת הממצא) → ראש שורת toLine (הפסקה הבאה)
 */

function wordsOf(line) { return String(line != null ? line : '').trim().split(/\s+/).filter(Boolean); }

/**
 * @param {string[]} lines — שורות המקור (מקור אמת: הטקסט המוצג בעורך)
 * @param {{type:'move-word-down'|'move-word-up', fromLine:number, toLine:number}} edit
 * @returns {string|null} — המסמך הערוך (join '\n'), או null אם לא ניתן להחיל
 */
function applyEdit(lines, edit) {
  if (!Array.isArray(lines) || !edit) return null;
  const next = lines.slice();
  const fi = edit.fromLine, ti = edit.toLine;
  if (!Number.isInteger(fi) || !Number.isInteger(ti) || fi < 0 || ti < 0 || fi >= next.length || ti >= next.length) return null;
  if (fi === ti) return null;
  const from = wordsOf(next[fi]);
  const to = wordsOf(next[ti]);
  if (edit.type === 'move-word-down') {
    // fromLine = הפסקה הבאה (מסירה את ראשונה); toLine = פסקת הממצא (מקבלת בסוף)
    const w = from.shift();
    if (!w) return null;
    to.push(w);
    next[ti] = to.join(' ');
    next[fi] = from.join(' ');
  } else if (edit.type === 'move-word-up') {
    // fromLine = פסקת הממצא (מסירה את אחרונה); toLine = הפסקה הבאה (מקבלת בראש)
    const w = from.pop();
    if (!w) return null;
    to.unshift(w);
    next[fi] = from.join(' ');
    next[ti] = to.join(' ');
  } else {
    return null;
  }
  return next.join('\n');
}

module.exports = { applyEdit, wordsOf };
