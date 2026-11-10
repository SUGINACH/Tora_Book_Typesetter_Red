// src/ui/run-info.js — זהות הריצה האחרונה לתצוגה (סוכן 1, תוכנית האב §7.1)
'use strict';

/**
 * טהור: בלי DOM ובלי מנוע (F-06). ממיר תוצאה מסוריאליזת פרוטוקול (ui-result-v1) + נתוני ריצה שבצד ה־UI
 * לאובייקט תצוגה אחד המשמש את פס המצב ואת לשונית הבדיקה — מקור יחיד לערכים המוצגים.
 * אין כאן שום שינוי בחוזה ה־Worker: layoutHash ו־contentHashIn כבר מוחזרים היום ב־serializeTypesetResult.
 */

/** משך לתצוגה: מתחת לשנייה — מילישניות; אחרת — שניות בשתי ספרות. */
function formatDuration(ms) {
  if (!(Number.isFinite(ms) && ms >= 0)) return '—';
  return ms < 1000 ? `${Math.round(ms)} מילישניות` : `${(ms / 1000).toFixed(2)} שניות`;
}

/**
 * @param {object} result תוצאה מסוריאליזת פרוטוקול
 * @param {{n?:number, jobId?:string, ms?:number}} meta נתוני ריצה שבצד ה־UI (מונה, מזהה עבודה, זמן כולל)
 */
function buildRunInfo(result, meta) {
  const m = meta || {};
  return {
    n: m.n != null ? m.n : null,
    jobId: m.jobId || null,
    ms: Number.isFinite(m.ms) ? m.ms : null,
    elapsedLabel: formatDuration(m.ms),
    layoutHash: (result && result.layoutHash) || null,
    contentHashIn: (result && result.contentHashIn) || null
  };
}

module.exports = { formatDuration, buildRunInfo };
