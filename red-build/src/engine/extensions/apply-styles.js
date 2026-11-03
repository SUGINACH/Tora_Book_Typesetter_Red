// src/engine/extensions/apply-styles.js — התאמת טריגרים + מונים + טווחי inline (S11.1-1/2, REQ-PAR-06)
'use strict';

/**
 * מנוע ההחלה של סגנונות מותאמים. שלוש שכבות:
 *  1. matchBlockStyle — טריגר ברמת הפסקה (linePrefix / pattern / combinator AND|OR)
 *  2. matchInlineRanges — טריגר ברמת טווח בתוך הטקסט (inlineMarker «…», מפרידים שרירותיים)
 *  3. CustomStyleCounters — מונים לפי counterReset (part/page/never) —
 *     סימון יחיד דרך notes/markers.markerFor (מקור יחיד; לא מספר מדומה).
 *
 * דטרמיניזם: אין Date/Math.random; הסדר קבוע (סדר ההצהרה); first-match-wins.
 */

const { markerFor } = require('../notes/markers');

/** התאמת טריגר־עלים בודד (בלי combinator — עלה). */
function matchLeaf(spec, line) {
  if ('linePrefix' in spec) return typeof spec.linePrefix === 'string' && line.startsWith(spec.linePrefix);
  if ('pattern' in spec) {
    try { return new RegExp(spec.pattern).test(line); } catch (e) { return false; }
  }
  if ('inlineMarker' in spec) {
    // עלה inlineMarker בהקשר בלוק: הפסקה מכילה לפחות טווח פתוח+סגור תקין
    const ranges = inlineRanges(line, spec.inlineMarker);
    return ranges.length > 0;
  }
  return false;
}

/** התאמת טריגר כלשהו (רקורסיבי — combinator AND/OR). */
function matchTriggerSpec(spec, line) {
  if (!spec || typeof spec !== 'object') return false;
  if ('combinator' in spec) {
    const c = spec.combinator;
    if (!c || !Array.isArray(c.conditions)) return false;
    if (c.op === 'AND') return c.conditions.every(sub => matchTriggerSpec(sub, line));
    if (c.op === 'OR') return c.conditions.some(sub => matchTriggerSpec(sub, line));
    return false;
  }
  return matchLeaf(spec, line);
}

/** טווחי inlineMarker בשורה: זוגות open/close לא חופפים, בסדר הופעתם.
 * **S11:** מפריד סימטרי (open === close, כמו ~…~) — טוגל: מופע ראשון פותח,
 * הבא סוגר (לפי סדר ההופעה), ולהפך — מחסנית לא עוזרת כשהסניף הראשון
 * תמיד תופס קודם. */
function inlineRanges(line, marker) {
  if (!marker || typeof marker.open !== 'string' || typeof marker.close !== 'string') return [];
  const out = [];
  const stack = [];
  const symmetric = marker.open === marker.close;
  for (let i = 0; i < line.length; i++) {
    if (line.startsWith(marker.open, i)) {
      if (symmetric) {
        // טוגל: פתוח אם אין פתיחה תלויה; סגור אחרת
        if (stack.length) {
          const from = stack.pop();
          out.push({ from: from + marker.open.length, to: i }); // טווח התוכן בין המפרידים
        } else {
          stack.push(i);
        }
        i += marker.open.length - 1;
        continue;
      }
      stack.push(i); i += marker.open.length - 1;
    } else if (line.startsWith(marker.close, i)) {
      const from = stack.pop();
      if (from !== undefined) out.push({ from: from + marker.open.length, to: i }); // טווח התוכן בין המפרידים
      i += marker.close.length - 1;
    }
  }
  return out; // סדירות: לפי מקום הסגירה; stack לא־מזווג נשמר — ההתאמה תקפה רק לזוגות שנסגרו
}

/**
 * התאמת סגנון ברמת פסקה. first-match-wins לפי סדר ההצהרה (דטרמיניסטי).
 * @param {string} line — הטקסט השטוח של הפסקה (בלי הערות)
 * @param {Array} styles — רשימה מנורמלת מ־parseCustomStyles
 * @returns {{style, ranges}|null}
 */
function matchBlockStyle(line, styles) {
  for (const st of styles || []) {
    if (!st || !st.trigger) continue;
    if (matchTriggerSpec(st.trigger, line)) {
      return { style: st };
    }
  }
  return null;
}

/**
 * סגנוני inline תואמים לשורה (כמה סגנונות יכולים לתפוס טווחים שונים;
 * טווח חופף — הראשון בהצהרה זוכה; שאר נפסלים לאותו טווח).
 * @returns {Array<{styleId, ranges}>}
 */
function matchInlineStyles(line, styles) {
  const out = [];
  const taken = []; // טווחים שנתפסו {from,to}
  for (const st of styles || []) {
    if (!st || !st.trigger || !('inlineMarker' in st.trigger)) continue;
    if ('combinator' in st.trigger) continue; // קומבינטור נוסה ברמת הבלוק בלבד (תיעוד חוזה)
    const ranges = inlineRanges(line, st.trigger.inlineMarker)
      .filter(r => !taken.some(t => r.from < t.to && t.from < r.to)); // אי־חפיפה
    if (!ranges.length) continue;
    for (const r of ranges) taken.push(r);
    out.push({ styleId: st.id, style: st, ranges });
  }
  return out;
}

/**
 * מונה per-style: counterReset part/page/never; תבנית hebrew-geresh/decimal —
 * **markerFor של notes/markers (מקור יחיד — לא העתקה).**
 */
class CustomStyleCounters {
  constructor() {
    this.state = new Map(); // styleId → {seq, lastPart, lastPage}
  }
  /**
   * הסמן הבא של הסגנון.
   * @param {object} st — סגנון מנורמל (counter: {format, reset} | null)
   * @param {{part:number, page:number}} ctx — הקשר התוכן הנוכחי
   */
  nextMark(st, ctx) {
    if (!st || !st.counter || !st.counter.enabled) return null;
    const key = st.id;
    let s = this.state.get(key);
    if (!s) { s = { seq: 0, lastPart: null, lastPage: null }; this.state.set(key, s); }
    if (st.counter.reset === 'part' && s.lastPart != null && ctx.part !== s.lastPart) s.seq = 0;
    if (st.counter.reset === 'page' && s.lastPage != null && ctx.page !== s.lastPage) s.seq = 0;
    s.seq += 1; s.lastPart = ctx.part; s.lastPage = ctx.page;
    return markerFor(s.seq, st.counter.format === 'hebrew-geresh' ? 'hebrew-geresh' : 'decimal');
  }
}

/** רוחב גופן יחסי של סגנון לגוף — למדידת טווחי inline בגודל שונה. */
function inlineSizeFactor(styleSpec, bodySizePt) {
  if (!styleSpec || !styleSpec.fontSizePt) return 1;
  const base = Number(bodySizePt) || 14;
  return Math.max(0.25, Number(styleSpec.fontSizePt) / base);
}

module.exports = {
  matchBlockStyle, matchInlineStyles, matchTriggerSpec, inlineRanges,
  CustomStyleCounters, inlineSizeFactor
};
