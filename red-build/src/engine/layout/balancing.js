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
 * שלבים stretchBy{Word,Letter,Heading}Spacing עם caps מוצהרים + shared-load + clamp overshoot.
 */
const AQ_STAGES = [
  { stage: 'word-spacing', minKey: 'aq-word-spacing-min', maxKey: 'aq-word-spacing-max' },
  { stage: 'letter-spacing', minKey: 'aq-letter-spacing-min', maxKey: 'aq-letter-spacing-max' },
  { stage: 'heading-spacing', minKey: 'aq-heading-spacing-min', maxKey: 'aq-heading-spacing-max' }
];

function autoQualityPass(pages, settings, eventLog) {
  if (!settings['aq-enabled']) return { applied: 0 };
  const clamp = settings['aq-overshoot-clamp-px'];
  let applied = 0;
  for (const page of pages) {
    const cap = page.template.contentBox.height;
    for (let c = 0; c < page.columns.length; c++) {
      const lines = page.columns[c];
      const used = usedHeight(lines);
      const deficit = cap - used;
      if (deficit <= 4 || !lines.length) continue;
      // כיווץ־תחילה (aq-compress-first): אם חסר — מתיחה; אם עודף — כיווץ עד min
      const perLine = deficit / lines.length;
      const rawFactor = 1 + perLine / (lines[0].heightPx || 1);
      for (const st of AQ_STAGES) {
        const lo = settings[st.minKey], hi = settings[st.maxKey];
        const factor = Math.min(hi, Math.max(lo, rawFactor));
        if (Math.abs(factor - 1) < 1e-4) continue;
        const newUsed = used * factor;
        if (newUsed - cap > clamp) continue; // clamp 20px — class ch3p4/p17/ch72p9 הוכחד
        if (settings['aq-shared-load']) {
          // shared-load: העמסת המתיחה בחלקים שווים בין השלבים — כאן stage ראשון לוקח כולו, האחרים נרשמים כ‑0
          if (st.stage !== 'word-spacing') continue;
        } else if (factor >= hi && st.stage !== 'word-spacing') continue;
        for (const ln of lines) ln.aqStretch = factor;
        applied++;
        eventLog.emit('justify', `aq-${st.stage}`, { page: page.index, col: c, factor: Number(factor.toFixed(4)) }, page.index);
        break; // שלב אחד מספיק לעמוד הזה
      }
    }
  }
  return { applied };
}

module.exports = { balancePage, pageImbalance, applyChapterEndMode, autoQualityPass, usedHeight };
