// src/engine/layout/balancing.js — AutoQuality (Gold port, שלוש שכבות) + איזון גלובלי אופטימלי (EXT-8) + chapter-end modes
'use strict';

/**
 * AQ: stretchBy{Word,Letter,Heading}Spacing עם caps מוצהרים;
 * Clamp overshoot 20px (REQ-BAL-07); balance-chapter-end {balance|stretch|natural} (REQ-BAL-03).
 */

// (moveLineForward אינו נדרש עוד באיזון: optimalSplit מכסה את מרחב המצבים כולו — EXT-8)

const { colCapacityOf } = require('./column-flow'); // **S5.2 (P-2):** קיבולת הטור — מקור יחיד

function usedHeight(col) {
  // **EXT-20:** גובה בפועל — כולל מקדם ה-AQ האנכי (לפני ה-AQ כל המקדמים 1).
  return col.reduce((s, ln) => s + ln.heightPx * (ln.aqStretch || 1), 0);
}

/** הערכת "איזון" עמוד: הפרש גובה טורים. */
function pageImbalance(page) {
  if (!page.columns || page.columns.length < 2) return 0;
  return Math.abs(usedHeight(page.columns[0]) - usedHeight(page.columns[1]));
}

/**
 * **EXT-8 — חלוקה גלובלית אופטימלית של טורי העמוד (הוכחה מתמטית):**
 * כל מצב חוקי של שני טורים — אחרי כל רצף הזזות moveLineForward חוקיות —
 * הוא **פיצול רציף** של רצף הקריאה: col0 = seq[0..k), col1 = seq[k..n).
 * (הוכחה: moveLineForward מעביר אך ורק את סוף col0 לראש col1 או את ראש col1
 * לסוף col0; אינדוקציה על מספר המהלכים שומרת על רציפות ועל סדר seq.)
 * לכן מרחב המצבים החוקי הוא בדיוק k ∈ [0..n], והמינימום הגלובלי של
 * ‏|H0(k) − H1(k)| בכפוף לקיבולת שני הטורים נמצא בזמן O(n) בסכומי קידום —
 * במקום הטיפוס הגרידי שורה-שורה שנעצר במינימום מקומי/בקיבולת.
 * סדר העדפות לקסיקוגרפי: (1) גבול-תפר נקי מ-widow/orphan, (2) |Δ| מינימלי,
 * (3) תנועה מינימלית מהפיצול הנוכחי (יציבות/דטרמיניזם).
 * @returns {{k:number, delta:number, clean:boolean}|null} — null אם אין פיצול חוקי-קיבולת
 */
function optimalSplit(cols, opts = {}) {
  const cap = opts.cap != null ? opts.cap : Number.POSITIVE_INFINITY;
  const extraLast = opts.extraLast || 0; // תקציב הערות של העמוד — על הטור האחרון (P1-8)
  const c0 = cols[0] || [], c1 = cols[1] || [];
  const seq = [...c0, ...c1];
  const n = seq.length;
  if (!n) return null;
  const h = (ln) => (ln.heightPx || 0) * (ln.aqStretch || 1);
  const pre = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + h(seq[i]);
  const total = pre[n];
  const k0 = c0.length;

  // גבול-תפר נקי (ווידוא/יתום קלאסיים, מבוסס ריצות tokenId):
  //  - widow-bottom: לבלוק שחוצה את הגבול יש **שורה אחת בדיוק** בתחתית col0
  //    (השורה שלפני הגבול היא ראשונת הריצה שלו ב-seq).
  //  - widow-top: לבלוק שחוצה את הגבול יש **שורה אחת בדיוק** בראש col1 והיא
  //    גם אחרונת הבלוק (הריצה מסתיימת מיד אחריה).
  // לא נעזר בדגלי part ('first'/'rest') — הם מוטבעים לכל שורות הצ'אנק
  // ב-pushLinks ואינם מעידים על מיקום בבלוק (נלכד בניפוי EXT-8: כל 39
  // שורות הפיצול נשאו part='first' וסימנו כל גבול פנימי כ-widow).
  const cleanBoundary = (k) => {
    if (k > 0 && k < n) {
      const lt = seq[k - 1].meta && seq[k - 1].meta.tokenId;
      const rt = seq[k].meta && seq[k].meta.tokenId;
      if (lt != null && lt === rt) { // הבלוק ממשיך מעבר לגבול
        if (k - 2 < 0 || (seq[k - 2].meta && seq[k - 2].meta.tokenId) !== lt) return false; // widow-bottom
        if (k + 1 >= n || (seq[k + 1].meta && seq[k + 1].meta.tokenId) !== rt) return false; // widow-top
      }
    }
    return true;
  };

  let best = null;
  for (let k = 0; k <= n; k++) {
    const H0 = pre[k];
    const H1 = total - pre[k] + extraLast;
    if (H0 > cap + 0.5 || H1 > cap + 0.5) continue; // קיבולת קשה (REQ-BAL-09)
    const delta = Math.abs(H0 - H1);
    const clean = cleanBoundary(k);
    const score = (clean ? 0 : 1) * 1e9 + delta;
    if (
      !best ||
      score < best.score - 1e-9 ||
      (Math.abs(score - best.score) <= 1e-9 && Math.abs(k - k0) < Math.abs(best.k - k0))
    ) {
      best = { k, delta, clean, score };
    }
  }
  return best;
}

/**
 * איזון מלא של עמוד — **החלוקה הגלובללית האופטימלית (EXT-8)**: אם Δ>maxDelta
 * נבחר פיצול הממזער את |Δ| על כל הפיצולים החוקיים-קיבולתית (הוכחה ב-optimalSplit),
 * בהעדפת גבול-תפר נקי ובתנועה מינימלית. שמירת סדר הקריאה מובנית (פיצול רציף).
 * נסיגה אם אין פיצול חוקי (rollback integrity REQ-BAL-09).
 * @returns {{changed:boolean, before:number, after:number}}
 */
function balancePage(page, maxDelta) {
  const before = pageImbalance(page);
  if (before <= maxDelta) return { changed: false, before, after: before, moves: 0 };
  if (!page.columns || page.columns.length < 2) return { changed: false, before, after: before };
  // **S5.2 (P-2 — קיבולת מאוחדת):** colCapacityOf (column-flow) — כולל הפס
  // החוצה־טורים; תקציב ההערות עובר כ-extraLast של הטור האחרון (כמו ב-dp-planner,
  // P1-8) — בעבר חושב מ-contentBox.height גולמי והתעלם משניהם.
  const cap = colCapacityOf(page, { fnBudget: false });
  const best = optimalSplit(page.columns, { cap, extraLast: page.fnReservedHeightPx || 0 });
  if (!best || best.k === page.columns[0].length) {
    // אין פיצול חוקי-קיבולת, או שהנוכחי כבר האופטימלי — לא מדווח שינוי
    return { changed: false, before, after: before, rollback_reason: best ? 'at-optimum' : 'capacity' };
  }
  const seq = [...page.columns[0], ...page.columns[1]];
  const k0 = page.columns[0].length;
  page.columns[0] = seq.slice(0, best.k);
  page.columns[1] = seq.slice(best.k);
  const after = pageImbalance(page);
  return { changed: true, moves: Math.abs(best.k - k0), before, after, optimal: true, cleanBoundary: best.clean };
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
 * AutoQuality (פורטר מ‑Gold; כל הגבולות מה‑registry).
 * **EXT-20 — מתיחה אנכית אמיתית:** מקדם ה-AQ הוא מקדם **גובה-שורה**
 * (interline): ‏`aqStretch = cap/used` מעוגן לגבולות השלב, ו-usedHeight כבר
 * מחשב אותו — המתיחה מגיעה ליעדה (תחתית הטור) גם במודל, גם ב-DOM
 * וגם בפרויקטור. בעבר המקדם חושב מהגובה החסר אך הוחל כ-wordSpacing
 * אופקי — usedHeight לא השתנה והיעד מעולם לא הושג; שלושת נתיבי התצוגה
 * פירשו אותו אחרת. כעת שדה אחד, משמעות אחת, שלושה צרכנים זהים.
 */
const AQ_STAGES = ['word-spacing', 'letter-spacing', 'heading-spacing'];

/** \u05d2\u05d1\u05d5\u05dc\u05d5\u05ea \u05de\u05d5\u05db\u05e8\u05d6\u05ea \u05d0\u05d7\u05e8\u05ea \u05dc\u05db\u05dc \u05e9\u05dc\u05d1 — \u05d2\u05d9\u05e9\u05d4 \u05de\u05e4\u05d5\u05e8\u05e9\u05ea (settings['aq-*'])
 * \u05db\u05da \u05e9\u05d4\u05e1\u05d5\u05e8\u05e7 \u05e8\u05d5\u05d0\u05d4 \u05e6\u05e8\u05d9\u05db\u05d4 \u05d0\u05de\u05d9\u05ea\u05d4 (\u05d1\u05e2\u05d1\u05e8 \u05d4\u05d9\u05d4 \u05d0\u05d9\u05e0\u05d3\u05d5\u05e7\u05d8\u05e8\u05d9\u05d9\u05d0\u05df \u05e9\u05d4\u05e1\u05d5\u05e8\u05e7 \u05dc\u05d0 \u05e8\u05d0\u05d4 — P0-5). */
function stageBounds(settings, stage) {
  switch (stage) {
    case 'word-spacing': return [settings['aq-word-spacing-min'], settings['aq-word-spacing-max']];
    case 'letter-spacing': return [settings['aq-letter-spacing-min'], settings['aq-letter-spacing-max']];
    case 'heading-spacing': return [settings['aq-heading-spacing-min'], settings['aq-heading-spacing-max']];
    default: return [0.95, 1.05];
  }
}

function autoQualityPass(pages, settings, eventLog) {
  if (!settings['aq-enabled']) return { applied: 0 };
  const clamp = settings['aq-overshoot-clamp-px'];
  // D-46 (תיקון P1-1 "מפתח מת"): שני המפתחים נצרכים כעת בפועל —
  // aq-stretch-to-bottom=false ⇒ אין מתיחה כלל; aq-compress-first ⇒ כיווץ לפני מתיחה.
  const mayStretch = settings['aq-stretch-to-bottom'] !== false;
  const compressFirst = settings['aq-compress-first'] !== false;
  let applied = 0;
  for (const page of pages) {
    for (let c = 0; c < page.columns.length; c++) {
      const lines = page.columns[c];
      const used = usedHeight(lines);
      if (!lines.length) continue;
      // **S5.2 (P-2):** קיבולת אפקטיבית פר-טור — כולל הפס החוצה־טורים ותקציב
      // ההערות (על הטור האחרון). המתיחה עד לתחתית האמיתית של הטור.
      const cap = colCapacityOf(page, { colIndex: c });
      const deficit = cap - used;
      if (deficit > 4 && mayStretch) {
        const perLine = deficit / lines.length;
        const rawFactor = 1 + perLine / (lines[0].heightPx || 1);
        for (const stage of AQ_STAGES) {
          const [lo, hi] = stageBounds(settings, stage);
          const factor = Math.min(hi, Math.max(lo, rawFactor));
          if (Math.abs(factor - 1) < 1e-4) continue;
          const newUsed = used * factor;
          if (newUsed - cap > clamp) continue; // clamp 20px — class ch3p4/p17/ch72p9 הוכחד
          if (settings['aq-shared-load']) {
            if (stage !== 'word-spacing') continue;
          } else if (factor >= hi && stage !== 'word-spacing') continue;
          for (const ln of lines) ln.aqStretch = factor;
          applied++;
          eventLog.emit('justify', `aq-${stage}`, { page: page.index, col: c, factor: Number(factor.toFixed(4)) }, page.index);
          break;
        }
      } else if (deficit < -4 && compressFirst) {
        // עודף מעל התקרה ⇒ כיווץ עד min (כיווץ לפני מתיחה — compress-first)
        const overflow = -deficit;
        const perLine = overflow / lines.length;
        const rawFactor = Math.max(0.8, 1 - perLine / (lines[0].heightPx || 1));
        for (const stage of AQ_STAGES) {
          const [lo, hi] = stageBounds(settings, stage);
          const factor = Math.max(lo, Math.min(hi, rawFactor));
          if (Math.abs(factor - 1) < 1e-4) continue;
          for (const ln of lines) ln.aqStretch = factor;
          applied++;
          eventLog.emit('justify', `aq-${stage}-compress`, { page: page.index, col: c, factor: Number(factor.toFixed(4)) }, page.index);
          break;
        }
      }
    }
  }
  return { applied };
}

module.exports = { balancePage, optimalSplit, pageImbalance, applyChapterEndMode, autoQualityPass, usedHeight };
