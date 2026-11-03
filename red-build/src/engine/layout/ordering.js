// src/engine/layout/ordering.js — Reading-order-preserving column moves (P0-3; D-49)
'use strict';

/**
 * הזזת שורה בין טורים תוך **שמירת סדר הקריאה בלבד** (תיקון P0-3):
 * סדר קריאה: col0 (ימני, נקרא ראשון) מלמעלה למטה, ואז col1.
 *  - טור מוקדם (col0) גבוה יותר ⇒ pop מסופו → unshift לראש col1 (הזזת הגבול קדימה).
 *  - טור מאוחר (col1) גבוה יותר ⇒ shift מראשו → push לסוף col0 (הזזת הגבול אחורה —
 *    השורה עדיין אחרי כל col0 ולפני שאר col1).
 * שתי ההזזות שומרות את סדר המילים בדיוק; בעבר האיזון העביר שורה **אחורה**
 * בסדר הקריאה (הצגת סוף פסקה לפני תחילתה) — רגרסיה שלא הייתה באף גרסה קודמת.
 * מודול עצמאי ללא תלויות — נצרך ע"י dp-planner וגם balancing (מניעת תלות מעגלית).
 */
function moveLineForward(cols, hi, lo) {
  if (hi === lo || cols.length < 2) return false;
  if (hi === 0 && lo === 1) {           // col0 גבוה: סוף col0 → ראש col1
    if (!cols[0] || !cols[0].length) return false;
    cols[1].unshift(cols[0].pop());
    return true;
  }
  if (hi === 1 && lo === 0) {           // col1 גבוה: ראש col1 → סוף col0
    if (!cols[1] || !cols[1].length) return false;
    cols[0].push(cols[1].shift());
    return true;
  }
  return false;
}

module.exports = { moveLineForward };
