// src/engine/layout/balancing.js — AutoQuality (Gold port, שלוש שכבות) + StretchPageToBottom clamp + chapter-end modes
'use strict';

/**
 * AQ: stretchByWordSpacing / letterSpacing / headingSpacing עם caps מוצהרים;
 * Clamp overshoot 20px (REQ-BAL-07); balance-chapter-end {balance|stretch|natural} (REQ-BAL-03).
 */

function usedHeight(col) { return col.reduce((s, ln) => s + ln.heightPx, 0); }

/** הערכת "איזון" עמוד: הפרש גובה טורים. */
function pageImbalance(page) {
  if (!page.columns || page.columns.length < 2) return 0;
  return Math.abs(usedHeight(page.columns[0]) - usedHeight(page.columns[1]));
}

/**
 * איזון מלא של עמוד: הזזת שורות עד Δ≤maxDelta; נסיגה אם נוצר חריגת תקציב (rollback integrity REQ-BAL-09).
 * @returns {{changed:boolean, before:number, after:number}}
 */
function balancePage(page, maxDelta) {
  const before = pageImbalance(page);
  const snapshot = page.columns.map(c => c.slice());
  let guard = 0;
  while (pageImbalance(page) > maxDelta && guard++ < 500) {
    const a = usedHeight(page.columns[0]), b = usedHeight(page.columns[1]);
    const hi = a >= b ? 0 : 1, lo = 1 - hi;
    if (!page.columns[hi].length) break;
    const moved = page.columns[hi].pop();
    page.columns[lo].unshift(moved);
    // hard reject: אם נוצרה חריגת cap → rollback מלא
    const cap = page.template.contentBox.height;
    if (page.columns.some(c => usedHeight(c) > cap + 0.5)) {
      page.columns = snapshot;
      return { changed: false, before, after: before, rollback_reason: 'capacity' };
    }
  }
  return { changed: true, before, after: pageImbalance(page) };
}

/**
 * balance-chapter-end mode ∈ {balance, stretch, natural} (REQ-BAL-03):
 * - balance: איזון רגיל
 * - stretch: איזון + AQ word-spacing (עד cap)
 * - natural: ללא איזון בסוף פרק (K-4: אין למתוח פרק קצר רק למילוי)
 */
function applyChapterEndMode(page, mode, settings, eventLog) {
  if (mode === 'natural') { eventLog.emit('balance', 'chapter-end-natural', { page: page.index }); return { mode, delta: pageImbalance(page) }; }
  const r = balancePage(page, settings['imbalance-max-delta-px']);
  if (mode === 'stretch' && settings['aq-enabled']) {
    autoQualityPass([page], settings, eventLog);
  }
  eventLog.emit('balance', `chapter-end-${mode}`, { page: page.index, ...r });
  return { mode, ...r };
}

/**
 * AutoQuality (פורטר מ‑Gold; כל הגבולות מה‑registry):
 * מתיחות word/letter/heading spacing בטווחים המוצהרים בלבד + clamp overshoot.
 */
function autoQualityPass(pages, settings, eventLog) {
  if (!settings['aq-enabled']) return { applied: 0 };
  const wsMin = settings['aq-word-spacing-min'], wsMax = settings['aq-word-spacing-max'];
  const clamp = settings['aq-overshoot-clamp-px'];
  let applied = 0;
  for (const page of pages) {
    const cap = page.template.contentBox.height;
    for (let c = 0; c < page.columns.length; c++) {
      const used = usedHeight(page.columns[c]);
      const deficit = cap - used;
      if (deficit <= 4) continue;
      // בונוס מתיחה: scaling גובה שורה ≤ wsMax תוך שמירה על clamp
      const lines = page.columns[c];
      if (!lines.length) continue;
      const perLine = deficit / lines.length;
      const factor = Math.min(wsMax, Math.max(wsMin, 1 + perLine / (lines[0].heightPx || 1)));
      if (factor > 1 && factor <= wsMax) {
        const newUsed = used * factor;
        if (newUsed - cap <= clamp) { // clamp 20px — class ch3p4/p17/ch72p9 הוכחד
          for (const ln of lines) ln.aqStretch = factor;
          applied++;
          eventLog.emit('justify', 'aq-stretch', { page: page.index, col: c, factor: Number(factor.toFixed(4)) }, page.index);
        }
      }
    }
  }
  return { applied };
}

module.exports = { balancePage, pageImbalance, applyChapterEndMode, autoQualityPass, usedHeight };
