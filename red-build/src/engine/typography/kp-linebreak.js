// src/engine/typography/kp-linebreak.js — Knuth-Plass optimal line breaking (REQ-LB-02/03/07)
'use strict';

/**
 * מימוש KP: boxes/glues/penalties, badness³, עונשי runt/widow/orphan, active-list DP.
 * - אין מקף סוף־שורה (no hyphenation — אסור בספרות תורנית).
 * - \u00A0 = צמידת NBSP (protectors); \uE000 = רווח אטומי בתוך הערה — ההערה אינה נקרעת (REQ-LB-04).
 * - RTL מדידה: rect.right − colRect.left (לקח Z.ai #5) — מתמטי כאן; DOM oracle יזהה.
 */

const INF = Number.POSITIVE_INFINITY;
const STRETCH_RATIO = 0.6;   // מתיחות רווח יחסית
const SHRINK_RATIO = 0.5;    // כיווץ רווח יחסית
const LINE_DEMERIT = 100;    // עלות בסיס לכל שורה: ברירת מחדל במודל ragged — ה־DP
                            // ממזער מספר שורות (הרינדור מצייר מרווחים טבעיים).
// השלמת ביקורת 03.11 (D-79): הרינדור של המנוע ragged (יישור לימין; מרווחים
// טבעיים ב-DOM וב-PDF). לכן במודל השבירה כל שורה מקבלת "מתיחת סוף-שורה"
// כמו \raggedright של TeX — אחרת שורה במילה בודדת (stretch=0 ⇒ ratio=0)
// היא "חינם" וה־DP מתפוצץ לשורות מילה-בודדת. כשהשורות מיושרות בפועל
// (align=stretch) ניתן לכבות: opts.raggedEnd=false.
const RAGGED_END_STRETCH_FACTOR = 10; // × maxWidthPx — מתיחה גדולה סופית-מעשית

function buildItems(words, measure) {
  const items = [];
  const sp = measure(' ');
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    // יחידת NBSP פוצלת לתת־קופסאות עם **אי־שבירה אסורה** (INF penalty) ביניהן:
    // כך DP רואה את הרוחב האמיתי (כולל רווחים פנימיים) אך לעולם לא קורע את הצמד.
    // (לקח V23: רוחב חסר של unit צמוד → מדידת שורה שגויה → badness מוטה.)
    // U+E000 (רווח אטומי בתוך הערה) אינו מקום שבירה כלל — נשמר בתוך תת־הקופסה
    // ומוחלף ל‑NBSP רק בפליטה; כך unit שלם לעולם לא נקרע (REQ-LB-04).
    const parts = w.split('\u00A0');
    for (let k = 0; k < parts.length; k++) {
      if (k > 0) items.push({ kind: 'penalty', forbidden: true, cost: INF });
      // **S5.2 (תיקון 4 — תיבת פנטום 1px):** חלק ריק (NBSP כפול, פתיחה/סיום
      // ב-NBSP) נמדד עכשיו ברוחב 0 — בעבר Math.max(1,…) יצר תיבת 1px שאינה
      // קיימת בדיו והעלתה את רוחב השורה. אין חשש מכניסה לרווח: מנגנוני ה-badness
      // מוגנים (effStretch>0 / shrink>0 — ראה breakLines) וההתקדמות מובטחת
      // (תיבה ריקה אינה מקום שבירה; הטוקן שלה משוחזר עם ה-NBSP שלו).
      items.push({ kind: 'box', text: parts[k].replace(/\uE000/g, '\u00A0'), width: Math.max(0, measure(parts[k])) });
      if (k < parts.length - 1) items.push({ kind: 'glue', width: sp, stretch: sp * STRETCH_RATIO, shrink: sp * SHRINK_RATIO, internal: true });
    }
    if (i < words.length - 1) {
      items.push({ kind: 'glue', width: sp, stretch: sp * STRETCH_RATIO, shrink: sp * SHRINK_RATIO });
    }
  }
  items.push({ kind: 'penalty', final: true }); // סיום פסקה — שבירה חובה
  return items;
}

function badness(ratio) {
  if (!isFinite(ratio)) return 0;
  if (ratio < -1) return INF;               // אי־אפשר לכווץ מעל הגבול
  const r = Math.abs(ratio);
  if (r <= 1) return Math.round(Math.pow(r * 100, 3) / 10000); // 0..100
  return 100 + Math.round(Math.pow((r - 1) * 100, 2) / 100);   // דחיסה/מתיחת יתר
}

/**
 * @param {string[]} words - מילות הפסקה (NBSP כבר הוצמד ע"י protectors)
 * @param {number} maxWidthPx
 * @param {(t:string)=>number} measure
 * @param {number} lineHeightPx
 * @param {{runtMinPct?:number}} opts
 * @returns {Array<{words:string[], widthPx:number, heightPx:number, isLast:boolean}>}
 */
function breakLines(words, maxWidthPx, measure, lineHeightPx, opts = {}) {
  // **03.11 (ביקורת):** חיבור ההגדרה — runt-min-width-pct מגיע כ-runts מה-pipeline
  // וכ-runtMinPct מקריאות ישירות; שניהם נקראים (בעבר רק runtMinPct נקרא וההגדרה לא השפיעה).
  const runts = opts.runtMinPct != null ? opts.runtMinPct : (opts.runts != null ? opts.runts : 50);
  const items = buildItems(words, measure);
  const n = items.length;
  const cost = new Array(n + 1).fill(INF);
  const parent = new Array(n + 1).fill(-1);
  cost[0] = 0;

  for (let i = 0; i < n; i++) {
    if (cost[i] === INF) continue;
    if (items[i].kind === 'glue' && !items[i].internal) { // דלג על glue רגיל בהתחלת שורה;
      // glue פנימי (בתוך יחידת NBSP) אסור לדלג — הרוחב שלו חלק בלתי נפרד מהצמד.
      if (cost[i + 1] > cost[i]) { cost[i + 1] = cost[i]; parent[i + 1] = i; }
      continue;
    }
    let w = 0, stretch = 0, shrink = 0;
    for (let j = i; j < n; j++) {
      const it = items[j];
      if (it.kind === 'box') w += it.width;
      // **תיקון שורש (ביקורת 03.11): רוחב glue נכלל ברוחב הטבעי של השורה —
      // כמו ב-TeX (Σ תיבות + Σ רווחים). בעבר נצברו רק stretch/shrink ⇒ ה־DP
      // "חשב" ששורה נכנסת בעוד רוחבה הטבעי (כולל רווחים) חורג מהטור.
      else if (it.kind === 'glue') { w += it.width; stretch += it.stretch; shrink += it.shrink; }
      else if (it.kind === 'penalty') {
        if (it.forbidden) continue; // תוך-יחידה: אין כאן מקום שבירה (legalCut כבר מבטל); ההצברה נמשכת
        // סיום שורה (penalty סופי של הפסקה) — good break.
        // **תיקון שורש (ביקורת 03.11): השבירה הסופית היא צומת סוף-הפסקה n —
        // בעבר נכתבה ל-cost[j] (אינדקס הפריט עצמו, n−1) ⇒ cost[n] נותר INF לעולם
        // ⇒ ה־DP מעולם לא סיפק פתרון וכל שבירות השורות במנוע מאז S1 יצאו מהגיבוי
        // הגרידי (עם באג ה-NBSP). התיקון מחיה את Knuth-Plass בפועל.
        const slack = maxWidthPx - w;
        // raggedEnd: מתיחת סוף-שורה (D-79) — שורות ragged אינן נמדדות במתיחת
        // בין-מילים אלא בכניסה טבעית; היתרה עד לקצה הטור "נבלעת" במתיחת הסוף.
        const raggedEnd = opts.raggedEnd !== false;
        const effStretch = stretch + (raggedEnd ? maxWidthPx * RAGGED_END_STRETCH_FACTOR : 0);
        const ratio = slack >= 0 ? (effStretch > 0 ? slack / effStretch : 0) : (shrink > 0 ? slack / shrink : -2);
        let b = badness(ratio);
        if (b < INF && w < maxWidthPx * (runts / 100)) b += 60; // עונש runt בשורת הסיום
        if (b < INF) {
          const cand = cost[i] + b + LINE_DEMERIT;
          if (cand < cost[n]) { cost[n] = cand; parent[n] = i; }
        }
        break;
      }
      // **S5.1 (D-92-DP):** הדפדפן מרנדר רוחב טבעי (white-space:normal) —
      // שורה שרוחבה הטבעי חורג מהטור נעטפת בתצוגה (טקסט-על-טקסט) גם אם
      // היישוב יכול לכווץ רווחים ב-PDF. לכן המבחן ברוחב הטבעי, בלי shrink.
      // **S5.2 (תיקון 3 — המבחן היה מרחיב, לא שמרני):** בעבר `w > maxWidth+0.75`
      // אִפשר קווים ברוחב טבעי עד maxWidth+0.75px (ובכך גם קבלת חיתוכים עם
      // slack שלילי דרך כיווץ) — בזמן ש-FIT_EPS של המורשת שמרן (limit−eps).
      // כעת החיתוך נעצר מוקדם: שורה שאינה נכנסת ב-maxWidth−0.75 אינה מוארכת
      // עוד, וכל קו מקובל הוא ברוחב טבעי ≤ maxWidth−0.75 (גם בסוף פסקה —
      // הפנלטי הסופי נמדר רק אחרי שכל הפריטים עברו את אותו מבחן). מילה רחבה
      // מהטור עדיין יוצאת כשורה בפני עצמה דרך הגיבוי הגרידי (greedyFallback —
      // התקדמות מובטחת, טוקן בודד אינו נחסם: pushTok עם toks ריק אינו מוסף).
      if (w > maxWidthPx - 0.75) break; // חריגה שאינה ניתנת לתיקון — שמרני כמו FIT_EPS

      if (it.kind === 'box') {
        // מקומות שבירה חוקיים נקבעים **מבנית מראש** (static legal-cuts): cut בצומת c חוקי
        // רק אם items[c-1] הוא glue לא־פנימי ו‑items[c] תיבה שפותחת יחידה חדשה.
        // זה מבטל את באג V23: lock תלוי-נקודת-התחלה על צמתים משותפים ל‑DP.
        // (תיקון S3: הבדיקה הייתה בתוך הלולאה עם אינדקס שגוי j+2 — כל השברים נחסמו.)
        const cut = j + 1; // נקודת שבירה חוקית: אחרי תיבה, לפני ה‑glue העוקב
        if (!(items[cut].kind === 'glue' && !items[cut].internal && items[cut + 1] && items[cut + 1].kind === 'box')) continue;
        const slack = maxWidthPx - w;
        // **S5.2 (תיקון 3 — שמרנות בקבלת חיתוך):** קו שאינו נכנס ברוחב הטבעי
        // (slack < −FIT_EPS) הוא בלתי-אפשרי — badness INF, לא "כיווץ". המבחן
        // השמרני למעלה אמור למנוע הגעה לכאן; השמירה הכפולה מתעדת את הכוונה.
        if (slack < -0.75) continue;
        const raggedEnd = opts.raggedEnd !== false;
        const effStretch = stretch + (raggedEnd ? maxWidthPx * RAGGED_END_STRETCH_FACTOR : 0);
        const ratio = slack >= 0 ? (effStretch > 0 ? slack / effStretch : 0) : (shrink > 0 ? slack / shrink : -2);
        const b = badness(ratio);
        if (b >= INF) continue;
        const cand = cost[i] + b + LINE_DEMERIT;
        if (cand < cost[cut]) { cost[cut] = cand; parent[cut] = i; }
      }
    }
  }

  if (cost[n] === INF) return greedyFallback(items, maxWidthPx, measure, lineHeightPx);

  const cuts = [];
  let p = n;
  while (p > 0 && parent[p] >= 0) { cuts.push([parent[p], p]); p = parent[p]; }
  cuts.reverse();

  const lines = [];
  for (let k = 0; k < cuts.length; k++) {
    const [a, b] = cuts[k];
    // תת־קופסאות של אותה יחידת NBSP מאוחדות חזרה עם \u00A0 (הצמד שומר על זהותו)
    const rawBoxes = items.slice(a, b).filter(x => x.kind === 'box');
    const toks = [];
    let cur = null, prevPenaltyForbidden = false;
    for (let idx = a; idx < b; idx++) {
      const it = items[idx];
      if (it.kind === 'penalty' && it.forbidden) { prevPenaltyForbidden = true; continue; }
      if (it.kind !== 'box') continue;
      if (cur !== null && prevPenaltyForbidden) { cur += '\u00A0' + it.text; prevPenaltyForbidden = false; }
      else { if (cur !== null) toks.push(cur); cur = it.text; prevPenaltyForbidden = false; }
    }
    if (cur !== null) toks.push(cur);
    void rawBoxes;
    if (!toks.length) continue;
    // רוחב אמיתי: סכום תת־הקופסאות + רווחי ה‑glue שביניהן (כולל internal)
    let widthPx = 0;
    for (let idx = a; idx < b; idx++) {
      const it = items[idx];
      if (it.kind === 'box') widthPx += it.width;
      else if (it.kind === 'glue') widthPx += it.width;
    }
    lines.push({ words: toks, widthPx, heightPx: lineHeightPx, isLast: k === cuts.length - 1 });
  }
  return lines;
}

/**
 * מסלול גיבוי (כשה־DP לא מצא פתרון אפשרי, למשל מילה רחבה מהעמודה — אין מקף).
 * תיקון שורש (ביקורת 03.11, S13): בגיבוי חלים **אותם איסורי שבירה** כמו במסלול
 * הראשי — בעבר כל penalty חתם שורה, כולל `forbidden` (בין תתי־קופסות של יחידת
 * NBSP) ⇒ היחידה נקרעה בין שורות **ואיבדה את \u00A0 שלה** (אובדן תוכן, BRZ-15;
 * ורוחב פנימי נמדד כרווח רגיל). כעת:
 * 1. penalty אסור לעולם אינו מסיים שורה — היחידה משוחזרת כטוקן אחד עם \u00A0
 *    (זהה לשחזור המסלור הראשי).
 * 2. רוחב טוקן נצבר מהפריטים (תיבות + glue פנימי 0.26em) — זהה למסלור הראשי,
 *    לא מדידה מחודשת של מחרוזת NBSP (הייתה מודדת 0.4em פנימי — עיוות רוחב).
 * 3. התקדמות מובטחת: טוקן שגולש פותח שורה חדשה; טוקן רחב מהעמודה נשאר לבד
 *    בשורה משלו — אין לולאה ואין דילוג תוכן. מעבר אחד על הפריטים.
 */
function greedyFallback(items, maxWidthPx, measure, lineHeightPx) {
  const space = measure(' ');
  const lines = [];
  let toks = [];            // טוקנים של השורה הנוכחית
  let w = 0;                // רוחב השורה (כולל רווחים בין טוקנים)
  let cur = null, curW = 0, joinNext = false;  // טוקן בבנייה + רוחבו מהפריטים

  const flush = () => {
    if (!toks.length) return;
    lines.push({ words: toks, widthPx: w, heightPx: lineHeightPx, isLast: false });
    toks = []; w = 0;
  };
  const pushTok = () => {
    if (cur === null) return;
    const sp = toks.length ? space : 0;
    // **S5.1 (D-92-DP):** רווח-ביטחון גם בגיבוי הגרידי — כמו FIT_EPS במורשת.
    if (toks.length && w + sp + curW > maxWidthPx - 0.75) flush(); // הטוקן הבא ייפתח שורה חדשה
    toks.push(cur); w += sp + curW;
    cur = null; curW = 0; joinNext = false;
  };

  for (const it of items) {
    if (it.kind === 'penalty') {
      if (it.final) continue;            // סוף פסקה — הטיפול שלאחר הלולאה סוגר את האחרון
      if (it.forbidden) { joinNext = true; continue; } // אין חיתוך בתוך יחידה — לעולם
      continue;
    }
    if (it.kind === 'glue') {
      if (it.internal && cur !== null) { curW += it.width; } // רווח פנימי בתוך היחידה
      continue; // glue רגיל בין טוקנים: רוחבו נכנס כ־sp בעת pushTok
    }
    if (it.kind !== 'box') continue;
    if (cur !== null && joinNext) { cur += '\u00A0' + it.text; curW += it.width; joinNext = false; } // המשך הצמד — ואיפוס: המילה הרגילה הבאה לא תיבלע
    else { pushTok(); cur = it.text; curW = it.width; }
  }
  pushTok(); flush();
  if (lines.length) lines[lines.length - 1].isLast = true;
  return lines;
}

module.exports = { breakLines, badness, STRETCH_RATIO, SHRINK_RATIO };
