// אודיט מתמטי מלא של העימוד — על ה-DOM החי (in-page).
// מכסה את כל בעיות העימוד שהוזכרו בפרויקט (WORKLOG/ISSUE_REGISTRY/דיווחי משתמש):
//  1. טקסטים אחד על השני (LINE_OVERLAP)          2. יישור שורות גוף — דיו בפועל (INK_NOT_JUSTIFIED)
//  3. גלישת תיבות/דיו מהטור (LINE_OUTSIDE/LINE_BELOW/INK_OUTSIDE)   4. גלישה בין טורים (GUTTER)
//  5. סדר שורות בטור (LINE_OUT_OF_ORDER)          6. מילת-חלון: ראשונה+ימין (WINDOW_*)
//  7. שורה אחרונה: לא מתוחה + ממורכזת             8. כותרת: ממורכזת, לא מתוחה
//  9. יישור בין הטורים — גריד בסיסים (tops)      10. פיץ' שורות (pitches)
// 11. הערות שוליים: חפיפה עם גוף/בינין             12. כותרות עליונות בכל עמודי התוכן
// 13. עמודי שער: קיום, סדר                        14. פוליו: קיום+גימטריה
// 15. גיאומטריית עמוד/טורים: אחידות, RTL          16. וירטואליזציה: placeholders
// 17. כיסוי מלא (COVERAGE)                        18. גופנים בפועל
// 19. nowrap על שורות גוף (שורש S4.23)            20. עמודי תוכן ריקים (בלי הערות)
// 21. פסים (bands): תיבה בעמוד, דיו בתיבה, מרכוז — S4.24
//
// **S5.2 (אכיפת נקודות-עיוורון — סקירה אדברסריאלית):** האודיט חולק לשתי שכבות —
// איסוף (דפדפן) ובדיקות טהורות (pure) — ונוספו 9 משפחות שהיו שקטות (false-green):
// 22. TOC_ROWS — שורות תוכן-עניינים: בתוך אזור המתיחה, בלי חפיפה (רצפה 21.5px —
//     ערימה חוקית של רמות 5/6/7 היא 24.5/23.6/23.25px), בלי התנגשות עם הגיליון/
//     הכותרת העליונה (במורשת: תיבה 26px, מתיחה 370.7/113.7→1005.7).
// 23. LINE_ABOVE_COLUMN — שורת גוף שראשית מעל ראשית הטור (דיו נודד לפס הכותרת);
//     בעבר נבדקו שמאל/ימין/מטה בלבד.
// 24. PITCH_UNIFORMITY — פס שורות-גוף עוקבות: שווה לגובה התיבה ±0.6px; מרווח-פסקה
//     חוקי 2..16px; פטור כשפס (band) יושב בין השורות (הוכח מהמודל: כל פיץ' >40.5px
//     הוא פס h3 בין פסקאות — 66.4=21.44+7+38, 73.4=+עוד מרווח, 104.4=פס כפול...).
// 25. BODY_FONT_UNIFORMITY — גודל גופן שורות-גוף: מודה אחת לכל סוג עמוד (body 16px
//     = 12pt; הקדמה 15.3px = 11.5pt — SZ.h0Body; הפרש >0.25px = בעיה).
// 26. FOLIO_SEQUENCE — רצף גיליונות בגימטריה (היפוך toHebrewNumber): עלייה בדיוק
//     +1 לכל עמוד נספר; דילוג מעבר למספר העמודים שביניהם / כפילות / ירידה = בעיה.
// 27. MARKER_NOTE_MATCH — מולטיסט גלובלי סמני-הערה בגוף מול פתיחות-הערה
//     (.w--fnmarker בשני הצדדים; המשכי-הערה נטולי-סמן אינם נספרים — חוקי;
//     הצגה חוזרת של הערה של פסקה חוצת-עמודים — חוקית כמו במקור, נספרת
//     בסטטיסטיקה בלבד). נתפסים: הערה אבודה, הערה יתומה, פתיחות חסרות.
// 28. TYPE_UNKNOWN — מסווג סוג העמוד החזיר 'unknown' = בעיה (בעבר שקט).
// 46. COLUMN_BOTTOMS_BALANCE — איזון תחתיות הטורים בסגירת בלוק (S6.3, בקשת
//     משתמש מפורשת: "אי איזון = שני טורים מאותו בלוק שאינם מסתיימים בגובה
//     זהה סימטרי"): שני טורים שנסגרים לפני תחתית הזרימה (או פס ההערות)
//     חייבים תחתיות זהות ±(2×פיץ'+4px) — גרנולריות שורות שלמות.
// 29. COLUMN_TOPS_ALIGN — עמוד דו-טורי ששני טוריו נפתחים בשורות גוף רגילות:
//     ראשי הטורים זהים ±2px (פטור כשפס/כותרת בין הראשים — הוכח מהמודל: 12 עמודים
//     עם פס h3 בין הטורים).
// 30. FN_RULE_PRESENT — בנתיב המודרני (.footnotes) עם הערות: קו המפריד קיים
//     (במורשת אין קו מטבעו — S4.9: "ההפרדה נשארת דרך ריווח התחתית בלבד").
// 31. WORDS_FLOOR (ספירה בדוח; נאכף ב-runner מול ה-fixture) — ספר שהתקצר בשקט.
//
// **S5.2 (שכבה טהורה + בדיקות רגישות):** כל הבדיקות רצות על מבנה נתונים שנאסף
// (pageData) — בלי גישת DOM — ולכן ניתן להוכיח ב-Node שכל גלאי אכן יורה
// (red-build/tests/e2e/audit-sensitivity.test.js). הדבק הדפדפני בסוף הקובץ
// נשאר זהה-התנהגותית: ה-eval מחזיר Promise<JSON>.
(function (root) {
  'use strict';

  // ═══════════════════ שכבת הבדיקות הטהורה (Node + דפדפן) ═══════════════════
  // pageData — כל הגיאומטריה יחסית לפינת העמוד (y יורד):
  //   page = { i, t, pw, ph, header:{text,top,bottom}|null, folio:{text,top,bottom}|null,
  //            gates, cols:[{x,y,w,h,lines:[line]}], bands:[{cls,x,y,w,h,ink,align,text}],
  //            tocRows:[{x,y,w,h,text}], tocInContainer, fns:[{x,y,w,h,markers,text,fs}],
  //            fnAreaN, fnRuleN, marginWords, words, dirOk, dirBad }
  //   line = { y,h,x,w, last,head,winWrap,custom, ink:{x,y,r,b}|null, wrapSpread,
  //            spanWraps:[{cls,spread}], style:{ta,tal,ws,fs,fam,dir}, words,
  //            window:{x,y,w,h}|null, markers:[{t,fs}], token, text }
  function createFullMathAudit() {
    const TYPES = ['shaar-main', 'shaar-back', 'shaar-sub', 'toc-general', 'toc-detail', 'blank', 'sign-open', 'preface', 'endnotes', 'h3-spread', 'filler', 'custom', 'regular'];
    // סוגי עמודי תוכן — רק עליהם חלות בדיקות זרימת-הגוף הקפדניות (LINE_ABOVE וכו')
    const CONTENT_TYPES = new Set(['regular', 'sign-open', 'preface', 'h3-spread']);
    // **S5.2:** גיאומטריית תוכן-העניינים של המורשת — מרואה מ-legacy-imud-flow
    // (TOC_FIRST_TOP/TOC_CONT_TOP/TOC_STRETCH_BOTTOM) + תיבת שורה 26px מהרנדרר.
    const TOC_FIRST_TOP = 370.7, TOC_CONT_TOP = 113.7, TOC_STRETCH_BOTTOM = 1005.7;
    // **S5.2 (תיקון סף חפיפה — נגד אזעקת-שווא):** תיבת ה-DOM של שורת TOC היא 26px
    // (position(...,26) ברנדרר, כיול S5.1), אבל המודל **עורם** שורות בגובה
    // tocRowH(level)=size×4/3×1.3+8 — לרמות 5/6/7: 24.47/23.6/23.25px (עמוד ה-TOC
    // האחרון ברצף אינו נמתח אלא נערם, makeTocPages). סף של 26−1.5=24.5 היה יורה
    // על ערימה חוקית של רמות 5/6! הרצפה החוקית המינימלית = 23.25 (רמה 7, הגדרה
    // מותאמת) − סובלנות 1.75 ⇒ 21.5 — גם ≥ המינימום הגס (~20px) שנדרש. באג המתיחה
    // (חלוקת הפס לפי יותר מדי שורות) נותן פסים ≪ 21.5 — ושם הבדיקה אמורה לירות.
    const TOC_ROW_H = 26, TOC_ROW_MIN_PITCH = 21.5;
    const FLOW_TOP = 107.2;              // ראשית זרימת הגוף (GEO.FLOW_TOP)
    // **S5.2:** מרווח-פסקה חוקי בין שורות-גוף עוקבות (יחידות שונות): 7 בסיסי,
    // כיווץ עד 2 (GAP_COMPRESS_FLOOR) ומתיחה עד 7+9 (JUSTIFY_MAX_GAP) — ±0.6 סביבות.
    const PARA_GAP_MIN = 1.4, PARA_GAP_MAX = 16.6;
    const PITCH_TOL = 0.6;

    const typeOfCls = (cls) => { const s = String(cls || ''); for (const t of TYPES) if (s.includes('page--' + t)) return t; return 'unknown'; };

    // ── **S5.2:** גימטריה ← מספר — היפוך toHebrewNumber (folio.js) ──
    // ט״ו/ט״ז נספרים טבעית (ט+ו=15); גרש בודד אחרי אות אחת = אות בודדת (א׳=1);
    // גרש ואחריו אותיות נוספות = אלפים (ה׳תש״ב=5702); גרשיים מוסרים; נתמכות מסגרות
    // (א) [א] ❖א❖ ◇א◇, קידומת "דף " (daf-hebrew) וספרות לועזיות (decimal).
    const GEM = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400 };
    function gematriaToNumber(txt) {
      let s = String(txt == null ? '' : txt).trim();
      if (!s) return null;
      s = s.replace(/^דף\s*/u, '')
        .replace(/^\(/, '').replace(/\)$/, '')
        .replace(/^\[/, '').replace(/\]$/, '')
        .replace(/[\u2766\u25C7]\s*/gu, '').replace(/\s*[\u2766\u25C7]$/gu, '')
        .trim();
      if (/^[0-9]+$/.test(s)) return parseInt(s, 10);
      if (!/^[\u05D0-\u05EA\u05F3\u05F4]+$/.test(s)) return null;
      const geresh = s.indexOf('\u05F3');
      if (geresh >= 0 && geresh < s.length - 1) {
        // אלפים: הקבוצה לפני הגרש ×1000 + השארית (ה׳תש״ב, א׳א)
        let th = 0;
        for (const ch of s.slice(0, geresh)) { const v = GEM[ch]; if (v == null) return null; th += v; }
        let rest = 0;
        for (const ch of s.slice(geresh + 1).replace(/\u05F4/g, '')) { const v = GEM[ch]; if (v == null) return null; rest += v; }
        return th * 1000 + rest;
      }
      s = s.replace(/[\u05F3\u05F4]/g, '');
      if (!s) return null;
      let sum = 0;
      for (const ch of s) { const v = GEM[ch]; if (v == null) return null; sum += v; }
      return sum >= 1 ? sum : null;
    }

    // ── מונים/סטטיסטיקה ──
    const mk = () => ({ n: 0, sum: 0, sumSq: 0, min: Infinity, max: -Infinity });
    const accAdd = (a, v) => { a.n++; a.sum += v; a.sumSq += v * v; if (v < a.min) a.min = v; if (v > a.max) a.max = v; };
    const fin = (a) => a.n ? { n: a.n, min: Math.round(a.min * 100) / 100, max: Math.round(a.max * 100) / 100, mean: +(a.sum / a.n).toFixed(3), std: +Math.sqrt(Math.max(0, a.sumSq / a.n - (a.sum / a.n) * (a.sum / a.n))).toFixed(3) } : null;

    const isPlainBody = (l) => !l.last && !l.head;

    /** **S5.2:** בדיקת עמוד בודד — כל הבדיקות הגיאומטריות מהגרסאות הקודמות + החדשות. */
    function checkPage(pg, ctx) {
      const { cnt, S } = ctx;
      const idx = pg.i;
      if (pg.t === 'unknown') cnt('TYPE_UNKNOWN', { type: 'TYPE_UNKNOWN', severity: 'high', page: idx, detail: 'מסווג סוג העמוד לא זיהה אף מחלקת page--* (בעבר עבר בשקט)' });
      if (pg.header) {
        if (pg.header.bottom > FLOW_TOP + 0.5 || pg.header.top < -0.5) cnt('HEADER_POSITION', { type: 'HEADER_POSITION', severity: 'high', page: idx, top: Math.round(pg.header.top * 10) / 10, bottom: Math.round(pg.header.bottom * 10) / 10 });
      }
      if (pg.folio) {
        S.folio.present++;
        if (/^[0-9]+$/.test(pg.folio.text)) S.folio.digits++; else if (/[\u0590-\u05FF]/.test(pg.folio.text)) S.folio.gematria++; else S.folio.other++;
        if (pg.folio.top < 1022.2 - 0.5 || pg.folio.bottom > 1122.5 + 2) cnt('FOLIO_POSITION', { type: 'FOLIO_POSITION', severity: 'high', page: idx, top: Math.round(pg.folio.top * 10) / 10, bottom: Math.round(pg.folio.bottom * 10) / 10 });
      } else S.folio.absent++;

      const cols = pg.cols || [];
      const colContent = cols.map((c) => c.lines.length);
      if (cols.length === 2 && colContent[0] > 0 && colContent[1] > 0) {
        const r0 = { x: cols[0].x, r: cols[0].x + cols[0].w }, r1 = { x: cols[1].x, r: cols[1].x + cols[1].w };
        if (r0.x < r1.x) cnt('COLUMN_ORDER_RTL', { type: 'COLUMN_ORDER_RTL', severity: 'high', page: idx, detail: 'הטור הראשון ב-DOM אינו הימני הפיזית' });
        if (Math.abs(cols[0].w - cols[1].w) > 1) cnt('COLUMN_WIDTH_MISMATCH', { type: 'COLUMN_WIDTH_MISMATCH', severity: 'medium', page: idx, d: Math.round(Math.abs(cols[0].w - cols[1].w) * 10) / 10 });
        pg.gutter = Math.round((r0.x - r1.r) * 10) / 10;
        if (r0.x - r1.r < 0) cnt('GUTTER_OVERLAP', { type: 'GUTTER_OVERLAP', severity: 'high', page: idx, d: Math.round((r0.x - r1.r) * 10) / 10 });
        if (/^(preface|toc|shaar)/.test(pg.t)) cnt('SINGLE_TYPE_TWO_CONTENT_COLS', { type: 'SINGLE_TYPE_TWO_CONTENT_COLS', severity: 'high', page: idx, t: pg.t, lines: colContent });
      }
      pg.colContent = colContent;
      for (const c of cols) {
        if (c.x + c.w > pg.pw + 2 || c.x < -2 || c.y + c.h > pg.ph + 2) cnt('COLUMN_OUTSIDE_PAGE', { type: 'COLUMN_OUTSIDE_PAGE', severity: 'high', page: idx });
      }

      // **S5.2 (29):** יישור ראשי הטורים — שני טורים שנפתחים בשורות גוף רגילות
      // (בלי כותרת בראש אף צד, בלי פס בין שני הראשים — פס חוצה-טורים מוריד
      // חוקית את ראשית הטור שמתחתיו; הוכח מהמודל: 12 עמודים כאלה, כולם עם פס).
      if (cols.length === 2 && colContent[0] > 0 && colContent[1] > 0 && CONTENT_TYPES.has(pg.t)) {
        const a = cols[0].lines[0], b = cols[1].lines[0];
        if (isPlainBody(a) && isPlainBody(b)) {
          const lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y);
          const bandBetween = (pg.bands || []).some((bb) => bb.y + bb.h > lo + 1 && bb.y < hi - 1);
          if (!bandBetween && hi - lo > 2) cnt('COLUMN_TOPS_ALIGN', { type: 'COLUMN_TOPS_ALIGN', severity: 'medium', page: idx, topR: Math.round(a.y * 10) / 10, topL: Math.round(b.y * 10) / 10, d: Math.round((hi - lo) * 10) / 10, detail: 'שני הטורים נפתחים בשורות גוף — הראשים חייבים להיות מיושרים (±2px)' });
        }
      }

      // **S6.3 (46 — בקשת משתמש מפורשת: "אי איזון = שני טורים מאותו בלוק
      // שאינם מסתיימים בגובה זהה סימטרי!!!"):** תחתיות הטורים בעמוד גוף
      // דו-טורי. כשהבלוק האחרון נסגר באמצע העמוד (שני הטורים מסתיימים לפני
      // תחתית הזרימה — או לפני פס ההערות בעמוד עם הערות), שני הטורים חייבים
      // להסתיים בגובה זהה סימטרי. הסבילות: שני פיצ'ים (32.2px) + 4px —
      // איזון בגבולות שורות שלמות מגיע לפיץ' אחד (16.08px) במקרה של ספירת
      // שורות אי-זוגית; מעבר לשני פיצ'ים = אי-איזון אמיתי שנראה לעין.
      // (טור שמאלי ריק לחלוטין מדווח במודל — ledger column-imbalance —
      // ואינו באוכלוסייה כאן: אין שורה אחרונה למדוד בטור הריק.)
      if (cols.length === 2 && colContent[0] > 0 && colContent[1] > 0 && CONTENT_TYPES.has(pg.t)) {
        const PITCH_TOL = 16.1;
        const lastR = cols[0].lines[cols[0].lines.length - 1];
        const lastL = cols[1].lines[cols[1].lines.length - 1];
        const bR = lastR.y + lastR.h, bL = lastL.y + lastL.h;
        const flowBottom = (pg.fnTopY != null && isFinite(pg.fnTopY)) ? pg.fnTopY : (cols[0].y + cols[0].h);
        const slackR = flowBottom - bR, slackL = flowBottom - bL;
        const d = Math.abs(bR - bL);
        // פטור פס (כמו ב-COLUMN_TOPS_ALIGN): פס חוצה-טורים שיושב בין שתי
        // התחתיות מסביר את ההפרש — הטור שמתחתיו נמשך חוקית (הוכח מהמבחנות:
        // מרווח-פסקה + פס h3 בין השורות).
        const bandBetweenBottoms = (pg.bands || []).some((bb) => bb.y + bb.h > Math.min(bR, bL) + 1 && bb.y < Math.max(bR, bL) - 1);
        if (!bandBetweenBottoms && Math.min(slackR, slackL) > PITCH_TOL + 2 && d > 2 * PITCH_TOL + 4) {
          cnt('COLUMN_BOTTOMS_BALANCE', { type: 'COLUMN_BOTTOMS_BALANCE', severity: 'medium', page: idx, bottomR: Math.round(bR * 10) / 10, bottomL: Math.round(bL * 10) / 10, d: Math.round(d * 10) / 10, slackR: Math.round(slackR), slackL: Math.round(slackL), detail: 'שני הטורים נסגרים באמצע העמוד ואינם מסתיימים בגובה זהה סימטרי (איזון טורים)' });
        }
      }

      const bodyBoxes = [];
      let totalLines = 0;
      let dirChecked = false;
      cols.forEach((c, ci) => {
        const lines = c.lines;
        totalLines += lines.length;
        let prev = null;
        for (const l of lines) {
          if (!dirChecked) { if (l.style.dir === 'rtl') S.dirOk++; else S.dirBad++; dirChecked = true; }
          const boxB = l.y + l.h, boxR = l.x + l.w;
          if (prev) {
            const ov = (prev.y + prev.h) - l.y;
            if (ov > 1.5) cnt('LINE_OVERLAP', { type: 'LINE_OVERLAP', severity: 'high', page: idx, col: ci, px: Math.round(ov), a: (prev.text || '').slice(0, 20), b: (l.text || '').slice(0, 20) });
          }
          // **S5.2 (23):** שורה מעל ראשית הטור — דיו שנודד לפס הכותרת העליונה.
          // רק עמודי תוכן (לעמודי שער/תוכן-עניינים גיאומטריה משלהם).
          if (CONTENT_TYPES.has(pg.t) && l.y < c.y - 2) cnt('LINE_ABOVE_COLUMN', { type: 'LINE_ABOVE_COLUMN', severity: 'high', page: idx, col: ci, dy: Math.round((c.y - l.y) * 10) / 10, text: (l.text || '').slice(0, 20) });
          if (boxR > c.x + c.w + 2 || l.x < c.x - 2) cnt('LINE_OUTSIDE_COLUMN', { type: 'LINE_OUTSIDE_COLUMN', severity: 'high', page: idx, col: ci, dx: Math.round(Math.max(boxR - (c.x + c.w), c.x - l.x)), text: (l.text || '').slice(0, 20) });
          if (boxB > c.y + c.h + 2) cnt('LINE_BELOW_COLUMN', { type: 'LINE_BELOW_COLUMN', severity: 'high', page: idx, col: ci, dy: Math.round(boxB - (c.y + c.h)), text: (l.text || '').slice(0, 20) });
          if (l.ink && (l.ink.r > c.x + c.w + 2.5 || l.ink.x < c.x - 2.5)) cnt('INK_OUTSIDE_COLUMN', { type: 'INK_OUTSIDE_COLUMN', severity: 'high', page: idx, col: ci, dx: Math.round(Math.max(l.ink.r - (c.x + c.w), c.x - l.ink.x)), text: (l.text || '').slice(0, 20) });
          if (prev && l.y < prev.y - 0.5) cnt('LINE_OUT_OF_ORDER', { type: 'LINE_OUT_OF_ORDER', severity: 'high', page: idx, col: ci, text: (l.text || '').slice(0, 20) });
          // **S5.2 (24):** אחידות פס — זוג שורות-גוף עוקבות (שתיהן רגילות; חלון-עטיפה
          // כן נבדק — תיבתו = גובה הפס). תיבות שחופפות מעבר ל-1.5px מדווחות כ-
          // LINE_OVERLAP בלבד (בלי כפילות דיווח); חפיפה קטנה מזו — כאן (פס שלילי).
          if (prev && isPlainBody(prev) && isPlainBody(l) && (prev.y + prev.h) - l.y <= 1.5) {
            const pitch = l.y - prev.y, expected = prev.h, excess = pitch - expected;
            const bandBetween = (pg.bands || []).some((bb) => bb.y + bb.h > prev.y + 1 && bb.y < l.y - 1);
            const ok = Math.abs(excess) <= PITCH_TOL || (excess >= PARA_GAP_MIN && excess <= PARA_GAP_MAX) || bandBetween;
            if (!ok) cnt('PITCH_UNIFORMITY', { type: 'PITCH_UNIFORMITY', severity: 'high', page: idx, col: ci, pitch: Math.round(pitch * 10) / 10, expected: Math.round(expected * 10) / 10, excess: Math.round(excess * 10) / 10, a: (prev.text || '').slice(0, 16), b: (l.text || '').slice(0, 16), detail: 'פס שורות-גוף עוקבות שונה מגובה התיבה (±0.6px) ואינו מרווח-פסקה חוקי (2..16px) ואין פס ביניהן' });
          }
          // **D-92:** עטיפת שורה מתוכננת בדפדפן — צמתי טקסט וספאנים בשני גבהים.
          if (l.wrapSpread > 3) cnt('WRAPPED_LINE', { type: 'WRAPPED_LINE', severity: 'high', page: idx, col: ci, spread: Math.round(l.wrapSpread * 10) / 10, text: (l.text || '').slice(0, 24) });
          for (const sw of (l.spanWraps || [])) {
            if (sw.spread > 3) cnt('WRAPPED_LINE', { type: 'WRAPPED_LINE', severity: 'high', page: idx, col: ci, span: String(sw.cls).slice(0, 24), spread: Math.round(sw.spread * 10) / 10, text: (l.text || '').slice(0, 24) });
          }

          // יישור/סגנון/גופן — שורות גוף מלאות (בלי אחרונה/כותרת/עטיפת-חלון)
          if (!l.last && !l.head && !l.winWrap && l.words >= 2 && l.ink) {
            const L = l.ink.x - c.x, Rg = (c.x + c.w) - l.ink.r;
            accAdd(S.bodyL, L); accAdd(S.bodyR, Rg);
            if (L > 3 || Rg > 3) cnt('INK_NOT_JUSTIFIED', { type: 'INK_NOT_JUSTIFIED', severity: 'high', page: idx, col: ci, leftGap: Math.round(L * 10) / 10, rightGap: Math.round(Rg * 10) / 10, text: (l.text || '').slice(0, 20) });
            if (l.style.ws === 'nowrap') { S.bodyStyle.nowrap++; cnt('NOWRAP_BODY_LINE', { type: 'NOWRAP_BODY_LINE', severity: 'high', page: idx, col: ci, text: (l.text || '').slice(0, 20) }); }
            else if (l.style.ta === 'justify' && l.style.tal === 'justify') S.bodyStyle.justifyOk++;
            else { S.bodyStyle.styleOther++; cnt('STYLE_NOT_JUSTIFIED', { type: 'STYLE_NOT_JUSTIFIED', severity: 'medium', page: idx, col: ci, ta: l.style.ta, tal: l.style.tal, text: (l.text || '').slice(0, 20) }); }
            const fs = Math.round(l.style.fs * 10) / 10;
            S.bodyFs[fs] = (S.bodyFs[fs] || 0) + 1;
            S.fontsUsed[l.style.fam] = (S.fontsUsed[l.style.fam] || 0) + 1;
            // **S5.2 (25):** סיווג לפי סוג עמוד — להקדמה גודל גוף משלה (11.5pt→15.3px)
            const bucket = pg.t === 'preface' ? 'preface' : 'body';
            S.bodyFsByBucket[bucket][fs] = (S.bodyFsByBucket[bucket][fs] || 0) + 1;
            S.bodyFsLines.push({ fs, bucket, page: idx, col: ci, custom: !!l.custom, text: (l.text || '').slice(0, 16) });
          }
          if (l.last && !l.winWrap && l.ink && l.words >= 2) {
            const key = l.style.ta + '/' + l.style.tal;
            S.lastAlign[key] = (S.lastAlign[key] || 0) + 1;
            if (l.style.tal === 'justify') cnt('LAST_LINE_JUSTIFIED', { type: 'LAST_LINE_JUSTIFIED', severity: 'medium', page: idx, col: ci, text: (l.text || '').slice(0, 20) });
            else if (l.style.ta === 'center') {
              const L = l.ink.x - c.x, Rg = (c.x + c.w) - l.ink.r;
              accAdd(S.lastSym, Math.abs(L - Rg));
              if (Math.abs(L - Rg) > 3) cnt('LAST_NOT_CENTERED', { type: 'LAST_NOT_CENTERED', severity: 'medium', page: idx, col: ci, asym: Math.round(Math.abs(L - Rg) * 10) / 10, text: (l.text || '').slice(0, 20) });
            } else if (l.style.ta === 'right' || l.style.ta === 'start') {
              const Rg = (c.x + c.w) - l.ink.r;
              if (Rg > 3) cnt('LAST_RIGHT_GAP', { type: 'LAST_RIGHT_GAP', severity: 'medium', page: idx, col: ci, gap: Math.round(Rg * 10) / 10, text: (l.text || '').slice(0, 20) });
            }
          }
          if (l.head && l.ink && l.words >= 2) {
            const ta = l.style.ta;
            S.headAlign[ta] = (S.headAlign[ta] || 0) + 1;
            if (ta === 'justify') cnt('HEAD_JUSTIFIED', { type: 'HEAD_JUSTIFIED', severity: 'medium', page: idx, col: ci, text: (l.text || '').slice(0, 20) });
            else if (ta === 'center') {
              const L = l.ink.x - c.x, Rg = (c.x + c.w) - l.ink.r;
              accAdd(S.headSym, Math.abs(L - Rg));
              if (Math.abs(L - Rg) > 3) cnt('HEAD_NOT_CENTERED', { type: 'HEAD_NOT_CENTERED', severity: 'medium', page: idx, col: ci, asym: Math.round(Math.abs(L - Rg) * 10) / 10, text: (l.text || '').slice(0, 20) });
            }
          }
          if (l.window) {
            const dR = (c.x + c.w) - (l.window.x + l.window.w);
            accAdd(S.winD, dR);
            if (dR > 3) cnt('WINDOW_WRONG_SIDE', { type: 'WINDOW_WRONG_SIDE', severity: 'high', page: idx, col: ci, distFromRight: Math.round(dR * 10) / 10, text: (l.text || '').slice(0, 20) });
            if (l.ink && l.window.x + l.window.w < l.ink.r - 3) cnt('WINDOW_NOT_FIRST', { type: 'WINDOW_NOT_FIRST', severity: 'medium', page: idx, col: ci, text: (l.text || '').slice(0, 20) });
          }
          for (const m of (l.markers || [])) { accAdd(S.markerFs, m.fs); }
          bodyBoxes.push({ x: l.x, r: boxR, y: l.y, b: boxB, tx: (l.text || '').slice(0, 20) });
          prev = l;
        }
      });
      pg.lines = totalLines;

      // הערות שוליים
      const fns = pg.fns || [];
      const fnRects = fns.map((f) => ({ ...f, b: f.y + f.h, r: f.x + f.w }));
      fnRects.sort((a, b) => a.y - b.y);
      for (let i = 1; i < fnRects.length; i++) {
        if (fnRects[i - 1].b - fnRects[i].y > 1) cnt('FN_OVERLAP', { type: 'FN_OVERLAP', severity: 'high', page: idx, px: Math.round(fnRects[i - 1].b - fnRects[i].y) });
      }
      for (const fr of fnRects) {
        for (const bb of bodyBoxes) {
          const ox = Math.min(fr.r, bb.r) - Math.max(fr.x, bb.x);
          const oy = Math.min(fr.b, bb.b) - Math.max(fr.y, bb.y);
          if (ox > 1 && oy > 1) { cnt('FN_OVERLAPS_BODY', { type: 'FN_OVERLAPS_BODY', severity: 'high', page: idx, fnTop: Math.round(fr.y), bodyText: bb.tx }); break; }
        }
        if (fr.b > pg.ph + 2) cnt('FN_BELOW_PAGE', { type: 'FN_BELOW_PAGE', severity: 'high', page: idx, dy: Math.round(fr.b - pg.ph) });
      }
      for (const f of fns) accAdd(S.fnFs, f.fs);

      if (pg.t === 'regular' && totalLines === 0 && fns.length === 0) cnt('EMPTY_PAGE', { type: 'EMPTY_PAGE', severity: 'high', page: idx });

      // פסים — תיבה בעמוד, דיו בתיבה, מרכוז
      for (const b of (pg.bands || [])) {
        if (b.x + b.w > pg.pw + 2 || b.x < -2 || b.y + b.h > pg.ph + 2) cnt('BAND_BOX_OUTSIDE_PAGE', { type: 'BAND_BOX_OUTSIDE_PAGE', severity: 'high', page: idx, cls: String(b.cls).slice(0, 40) });
        if (!b.ink) continue;
        if (b.ink.r > b.x + b.w + 2.5 || b.ink.x < b.x - 2.5) cnt('BAND_INK_OUTSIDE', { type: 'BAND_INK_OUTSIDE', severity: 'high', page: idx, dx: Math.round(Math.max(b.ink.r - (b.x + b.w), b.x - b.ink.x)), text: (b.text || '').slice(0, 20) });
        if (b.align === 'center') {
          const asymB = Math.abs((b.ink.x - b.x) - ((b.x + b.w) - b.ink.r));
          if (asymB > 3) cnt('BAND_NOT_CENTERED', { type: 'BAND_NOT_CENTERED', severity: 'medium', page: idx, asym: Math.round(asymB * 10) / 10, text: (b.text || '').slice(0, 20) });
        }
      }
    }

    /** **S5.2:** בדיקות מסמך — חוצות-עמודים (מבנה, גיליונות, סמנים, גופנים, TOC). */
    function checkDocument(pages, meta, ctx) {
      const { cnt, S } = ctx;
      const seq = pages.slice().sort((a, b) => a.i - b.i);
      const types = seq.map((p) => p.t);
      if (seq.length) {
        if (types[0] !== 'shaar-main' || types[1] !== 'shaar-back') cnt('SHAAR_ORDER', { type: 'SHAAR_ORDER', severity: 'high', got: types.slice(0, 3), expected: ['shaar-main', 'shaar-back', '…'] });
        if (!types.some((t) => t === 'shaar-sub')) cnt('NO_SHAAR_SUB', { type: 'NO_SHAAR_SUB', severity: 'medium' });
        const bodyPages = seq.filter((p) => /regular|sign-open|preface|h3-spread|toc/.test(p.t));
        const bodyNoHdr = bodyPages.filter((p) => !(p.header && p.header.text));
        if (bodyNoHdr.length) cnt('BODY_PAGES_WITHOUT_HEADER', { type: 'BODY_PAGES_WITHOUT_HEADER', severity: 'high', count: bodyNoHdr.length, pages: bodyNoHdr.map((p) => p.i).slice(0, 12) });
        const regNoFolio = seq.filter((p) => p.t === 'regular' && !p.folio);
        if (regNoFolio.length) cnt('FOLIO_MISSING', { type: 'FOLIO_MISSING', severity: 'medium', count: regNoFolio.length, pages: regNoFolio.map((p) => p.i).slice(0, 12) });
        const mainShaar = seq.find((p) => p.t === 'shaar-main');
        if (mainShaar && !mainShaar.gates) cnt('SHAAR_EMPTY', { type: 'SHAAR_EMPTY', severity: 'high', page: mainShaar.i });
      }

      // **S5.2 (26):** רצף גיליונות — מכונת המצבים של assignNumbers: כל עמוד נספר
      // מעלה את המספר ב-1; עמודים שאינם מציגים גיליון (שערים/פתיחות/blank) עדיין
      // יכולים להיספר — לכן דלתא חוקית היא 1..(1+מספר העמודים שביניהם).
      {
        let lastVal = null, lastIdx = null;
        for (const p of seq) {
          if (!p.folio || !p.folio.text) continue;
          const v = gematriaToNumber(p.folio.text);
          if (v == null) { cnt('FOLIO_SEQUENCE', { type: 'FOLIO_SEQUENCE', severity: 'high', page: p.i, text: p.folio.text, detail: 'טקסט גיליון לא ניתן לפענוח בגימטריה' }); continue; }
          if (lastVal != null) {
            const gap = p.i - lastIdx - 1;
            const delta = v - lastVal;
            if (delta === 0) cnt('FOLIO_SEQUENCE', { type: 'FOLIO_SEQUENCE', severity: 'high', page: p.i, text: p.folio.text, prev: lastVal, detail: 'גיליון משוכפל — שני עמודים רצופים עם אותו מספר' });
            else if (delta < 0) cnt('FOLIO_SEQUENCE', { type: 'FOLIO_SEQUENCE', severity: 'high', page: p.i, text: p.folio.text, prev: lastVal, detail: 'גיליון יורד — מספר העמוד קטן מקודמו' });
            else if (delta > 1 + gap) cnt('FOLIO_SEQUENCE', { type: 'FOLIO_SEQUENCE', severity: 'high', page: p.i, text: p.folio.text, prev: lastVal, delta, gap, detail: 'דילוג גיליון — המספר קפץ מעבר למספר העמודים שבין שני הגיליונות' });
          }
          lastVal = v; lastIdx = p.i;
        }
      }

      // **S5.2 (22):** שורות תוכן-עניינים — תחום המתיחה, חפיפות, התנגשויות.
      // עמוד TOC "ראשון ברצף" = קודמו איננו אותו סוג TOC (toc-general/toc-detail
      // הן שתי רצפות נפרדות) — כמו wrapTocPages של המורשת (first ? 370.7 : 113.7).
      {
        const prevTypeById = new Map();
        for (let k = 1; k < seq.length; k++) prevTypeById.set(seq[k].i, seq[k - 1].t);
        for (const p of seq) {
          const rows = (p.tocRows || []).slice().sort((a, b) => a.y - b.y);
          if (!rows.length) continue;
          const prevT = prevTypeById.get(p.i);
          const isFirstToc = prevT !== p.t;
          // במורשת השורות אבסולוטיות (בנות של העמוד); בנתיב המודרני הן בזרימה
          // בתוך .toc-rows — תחום המתיחה לא חל עליהן, אך חפיפה/התנגשות כן.
          if (!p.tocInContainer) {
            const top = isFirstToc ? TOC_FIRST_TOP : TOC_CONT_TOP;
            for (const row of rows) {
              if (row.y < top - 2 || row.y > TOC_STRETCH_BOTTOM + 2) cnt('TOC_ROWS', { type: 'TOC_ROWS', severity: 'high', page: p.i, y: Math.round(row.y * 10) / 10, top, detail: 'שורת תוכן-עניינים מחוץ לאזור המתיחה (' + top + '..' + TOC_STRETCH_BOTTOM + ')', text: (row.text || '').slice(0, 20) });
            }
          }
          for (let k = 1; k < rows.length; k++) {
            const pitch = rows[k].y - rows[k - 1].y;
            if (pitch < TOC_ROW_MIN_PITCH) cnt('TOC_ROWS', { type: 'TOC_ROWS', severity: 'high', page: p.i, y: Math.round(rows[k].y * 10) / 10, pitch: Math.round(pitch * 10) / 10, rowH: Math.round(rows[k].h * 10) / 10, detail: 'שורות תוכן-עניינים חופפות — מרחק ' + Math.round(pitch * 10) / 10 + 'px קטן מהרצפה החוקית (' + TOC_ROW_MIN_PITCH + 'px; ערימה חוקית ≥ 23.25px לפי tocRowH, תיבת DOM 26px); מתיחת ה-TOC דוחסת את השורות זו לזו', text: (rows[k].text || '').slice(0, 20) });
          }
          // התנגשות עם כותרת עליונה / גיליון (גם בנתיב המודרני)
          for (const row of rows) {
            for (const zone of [p.header ? { name: 'כותרת עליונה', y: p.header.top, b: p.header.bottom } : null, p.folio ? { name: 'גיליון', y: p.folio.top, b: p.folio.bottom } : null]) {
              if (!zone) continue;
              const oy = Math.min(row.y + row.h, zone.b) - Math.max(row.y, zone.y);
              if (oy > 1) cnt('TOC_ROWS', { type: 'TOC_ROWS', severity: 'high', page: p.i, y: Math.round(row.y * 10) / 10, detail: 'שורת תוכן-עניינים חופפת את ' + zone.name, text: (row.text || '').slice(0, 20) });
            }
          }
        }
      }

      // **S5.2 (27):** מולטיסט גלובלי — סמני הערה בגוף מול סמני פתיחת-הערה.
      // המשכי-הערה ('(המשך)') נטולי סמן מטבעם; הערה שנפתחת בעמוד העוקב חוקית —
      // לכן ההשוואה גלובלית (תופסת איבוד/יתום, לא הזחה).
      // **S5.2 (תיקון סמנטיקה — הצגה-חוזרת חוקית):** מקור האמת (enqueueNote/
      // requeueParaNotes במורשת): הערה של פסקה חוצת-עמודים **חוזרת בעמוד ההמשך
      // עם הסמן שוב** — הוכח מהייחוס (הערה-א מופיעה בעמ' 11 וגם 12; מספור פר-פרק
      // יציב). לכן שוויון מולטיסט מלא (bodyN === fnN) אינו אינווריאנט — הריצה החיה
      // הוכיחה זאת: 'יד.' בגוף ×1 (עמ' 567) וברישום ×2 (567+568, הצגה חוזרת חוקית).
      // האינווריאנט הנכון: (א) כל סמן-גוף מופיע ≥1 פעם כפתיחת-הערה (הערה שאבדה);
      // (ב) כל פתיחת-הערה מופיעה ≥1 פעם בגוף (הערה יתומה); (ג) פתיחות ≥ סמני-גוף
      // לכל מפתח (חסר = איבוד; עודף = הצגה חוזרת — חוקי, נספר בסטטיסטיקה).
      {
        const bodyMk = {}, fnMk = {};
        let bodyN = 0, fnN = 0;
        // **S5.2:** סמני גוף הם רשומות {t,fs}; סמני הערה — מחרוזות — נרמול למפתח אחיד
        const keyOf = (m) => (typeof m === 'string' ? m : (m && m.t));
        for (const p of seq) {
          for (const c of (p.cols || [])) for (const l of c.lines) {
            for (const m of (l.markers || [])) { const k = keyOf(m); if (k == null) continue; bodyMk[k] = (bodyMk[k] || 0) + 1; bodyN++; }
          }
          for (const f of (p.fns || [])) {
            for (const m of (f.markers || [])) { const k = keyOf(m); if (k == null) continue; fnMk[k] = (fnMk[k] || 0) + 1; fnN++; }
          }
        }
        let reDisplayed = 0;
        for (const k of new Set([...Object.keys(bodyMk), ...Object.keys(fnMk)])) {
          const b = bodyMk[k] || 0, f = fnMk[k] || 0;
          if (b === 0 && f === 0) continue;
          if (b > 0 && f === 0) {
            cnt('MARKER_NOTE_MATCH', { type: 'MARKER_NOTE_MATCH', severity: 'high', marker: k, inBody: b, inNotes: 0, detail: 'סמן הערה בגוף שאין לו אף פתיחת-הערה — ההערה אבדה' });
          } else if (f > 0 && b === 0) {
            cnt('MARKER_NOTE_MATCH', { type: 'MARKER_NOTE_MATCH', severity: 'high', marker: k, inBody: 0, inNotes: f, detail: 'פתיחת-הערה שאין לה סמן בגוף — הערה יתומה' });
          } else if (f < b) {
            cnt('MARKER_NOTE_MATCH', { type: 'MARKER_NOTE_MATCH', severity: 'high', marker: k, inBody: b, inNotes: f, detail: 'פתיחות-הערה פחות מסמני הגוף (' + f + '<' + b + ') — הערה אבדה בדרך' });
          } else if (f > b) {
            reDisplayed += f - b; // הצגה חוזרת חוקית (פסקה חוצת-עמודים — כמקור)
          }
        }
        S.markers.body = bodyN; S.markers.footnote = fnN; S.markers.reDisplayed = reDisplayed;
      }

      // **S5.2 (25):** אחידות גודל גופן שורות-גוף — מודה אחת לכל סבית (body/preface).
      // פטורים: שורות כותרת/אחרונות/עטיפת-חלון (כבר מחוץ לאוכלוסייה) ושורות
      // custom-style (גודל מותאם אישית מטבעו).
      {
        const modeOf = (map) => {
          let best = null, bestN = -1;
          for (const k of Object.keys(map)) if (map[k] > bestN) { bestN = map[k]; best = k; }
          return best != null ? parseFloat(best) : null;
        };
        const modes = {};
        for (const bucket of Object.keys(S.bodyFsByBucket)) {
          const mode = modeOf(S.bodyFsByBucket[bucket]);
          if (mode != null) modes[bucket] = mode;
        }
        S.bodyFontModes = modes;
        for (const rec of S.bodyFsLines) {
          if (rec.custom) continue;
          const mode = modes[rec.bucket];
          if (mode == null) continue;
          if (Math.abs(rec.fs - mode) > 0.25) cnt('BODY_FONT_UNIFORMITY', { type: 'BODY_FONT_UNIFORMITY', severity: 'medium', page: rec.page, col: rec.col, fs: rec.fs, mode, bucket: rec.bucket, text: rec.text, detail: 'גודל גופן שונה מהמודה של שורות הגוף באותו סוג עמוד (' + mode + 'px)' });
        }
      }

      // **S5.2 (30):** קו מפריד הערות בנתיב המודרני — אם במסמך יש אף .fn-rule
      // (הוכחה שההגדרה אינה 'none'), כל אזור הערות עם הערות חייב לשאת קו.
      {
        let anyRule = 0, areasWithFns = 0, areasMissing = 0;
        for (const p of seq) {
          anyRule += p.fnRuleN || 0;
          if ((p.fnAreaN || 0) > 0 && (p.fns || []).length > 0) areasWithFns++;
        }
        for (const p of seq) {
          if ((p.fnAreaN || 0) > 0 && (p.fns || []).length > 0 && anyRule > 0 && !(p.fnRuleN > 0)) {
            areasMissing++;
            cnt('FN_RULE_PRESENT', { type: 'FN_RULE_PRESENT', severity: 'medium', page: p.i, detail: 'לאזור ההערות בעמוד זה אין קו מפריד (.fn-rule) אף שבמסמך קווים קיימים' });
          }
        }
        S.fnRule = { areasWithFns, areasMissing, indeterminate: areasWithFns > 0 && anyRule === 0 };
      }

      // dir=rtl — נאכף (S5.1 A4)
      if (S.dirBad > 0) cnt('DIR_RTL_MISSING', { type: 'DIR_RTL_MISSING', severity: 'medium', n: S.dirBad });
      return seq;
    }

    /** **S5.2:** הרצה מלאה על pageData שנאסף — מחזירה דוח שלם (בלי DOM). */
    function finalizeChecks(pages, meta) {
      const problems = [];          // **S5.2 (תיקון הכיסוי):** רשימה מלאה, בלי תקרה —
      const P = [];                 // הרשימה הנשמרת בדוח נשארת תחומה (2000) לצורך גודל
      const CNT = {};
      const cnt = (type, entry) => {
        CNT[type] = (CNT[type] || 0) + 1;
        problems.push(entry);
        if (P.length < 2000) P.push(entry);
      };
      // בעיות איסוף (PLACEHOLDER_GEOMETRY / PAGE_INDEX_MISSING / NO_SCROLLER) —
      // הוזרקו בזמן הסריקה; מוזגות לפני הבדיקות כדי שהספירה והחומרה יהיו מלאות.
      for (const e of (meta.collectionProblems || [])) cnt(e.type, e);
      const S = {
        bodyL: mk(), bodyR: mk(), winD: mk(), lastSym: mk(), headSym: mk(), markerFs: mk(), fnFs: mk(),
        bodyFs: {}, bodyFsByBucket: { body: {}, preface: {} }, bodyFsLines: [],
        lastAlign: {}, headAlign: {}, bodyStyle: { justifyOk: 0, nowrap: 0, styleOther: 0 },
        folio: { present: 0, absent: 0, gematria: 0, digits: 0, other: 0 }, fontsUsed: {},
        dirOk: 0, dirBad: 0, markers: { body: 0, footnote: 0 }, fnRule: null, bodyFontModes: {}
      };
      const ctx = { cnt, S };
      const seq0 = pages.slice().sort((a, b) => a.i - b.i);
      for (const pg of seq0) checkPage(pg, ctx);
      const seq = checkDocument(seq0, meta, ctx);

      const missing = [];
      for (let i = 0; i < (meta.slots || seq.length); i++) if (!seq.some((p) => p.i === i)) missing.push(i);
      if (missing.length) cnt('COVERAGE', { type: 'COVERAGE', severity: 'high', count: missing.length, sample: missing.slice(0, 12) });

      // **S5.2 (תיקון הכיסוי):** bySeverity מחושב מהרשימה המלאה (בעבר — מהרשימה
      // הקצוצה, ולפני בדיקת dir — ספירה שקרית כשמעל 2000 בעיות).
      const bySeverity = {};
      for (const p of problems) bySeverity[p.severity] = (bySeverity[p.severity] || 0) + 1;
      const totalProblems = Object.values(CNT).reduce((s, v) => s + v, 0);
      const fontsUsedSet = Object.keys(S.fontsUsed);
      const stats = {
        bodyGapLeft: fin(S.bodyL), bodyGapRight: fin(S.bodyR), windowDistFromRight: fin(S.winD),
        lastCenterAsym: fin(S.lastSym), headCenterAsym: fin(S.headSym),
        markerFontSize: fin(S.markerFs), footnoteFontSize: fin(S.fnFs),
        bodyFontSizes: S.bodyFs, bodyFontModes: S.bodyFontModes, lastLineAlign: S.lastAlign, headingAlign: S.headAlign,
        bodyStyle: S.bodyStyle, folio: S.folio, fontsUsed: S.fontsUsed, markers: S.markers, fnRule: S.fnRule,
        dirRtlOk: S.dirOk, dirRtlBad: S.dirBad, counts: CNT, totalProblems: totalProblems
      };
      const types = seq.map((p) => p.t);
      const summary = {
        pages: seq.length, slots: meta.slots || seq.length, virtualized: !!meta.virtualized,
        sweep: meta.sweep || null, shaarPages: types.filter((t) => /shaar/.test(t)).length,
        bodyPagesWithHeader: (function () { const bp = seq.filter((p) => /regular|sign-open|preface|h3-spread|toc/.test(p.t)); return bp.filter((p) => p.header && p.header.text).length + '/' + bp.length; })(),
        totalLines: seq.reduce((s, p) => s + (p.lines || 0), 0),
        totalWords: seq.reduce((s, p) => s + (p.words || 0), 0),
        observedFonts: fontsUsedSet, problems: totalProblems, bySeverity, sweepMs: meta.sweepMs || null
      };
      return { problems, problemsCapped: P, CNT, S, stats, summary, seq };
    }

    return { typeOfCls, gematriaToNumber, checkPage, checkDocument, finalizeChecks, TYPES, CONTENT_TYPES };
  }

  const api = { createFullMathAudit: createFullMathAudit, version: 'S5.2' };
  if (typeof document === 'undefined' && typeof module !== 'undefined' && module.exports) {
    module.exports = api;             // Node — בדיקות רגישות (audit-sensitivity.test.js)
  } else {
    root.__fullMathAuditFactory = api; // דפדפן — לשימוש ידני/ניפוי
  }
})(typeof window !== 'undefined' ? window : globalThis);

// ═══════════════════ הדבק הדפדפני — איסוף pageData + הרצת השכבה הטהורה ═══════════════════
// החוזה עם run-full-math.js / run.sh: ה-eval של הקובץ מחזיר Promise<string-JSON>.
if (typeof document !== 'undefined') {
(async function () {
  const t0 = Date.now();
  const factory = (typeof __fullMathAuditFactory !== 'undefined' ? __fullMathAuditFactory : window.__fullMathAuditFactory);
  const audit = factory.createFullMathAudit();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const settle = () => new Promise((res) => { let d = false; const fin = () => { if (!d) { d = true; res(); } }; try { requestAnimationFrame(() => requestAnimationFrame(fin)); } catch (e) {} setTimeout(fin, 120); });
  const R = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
  const rel = (rect, origin) => ({ x: rect.x - origin.x, y: rect.y - origin.y, w: rect.w, h: rect.h, r: rect.r - origin.x, b: rect.b - origin.y });
  const inkOf = (lineEl, origin) => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, cnt = 0;
    for (const ch of lineEl.childNodes) {
      let b = null;
      if (ch.nodeType === 3) { if (!ch.textContent || !ch.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(ch); b = rg.getBoundingClientRect(); }
      else if (ch.nodeType === 1) { if (!ch.textContent || !ch.textContent.trim()) continue; b = ch.getBoundingClientRect(); }
      if (!b || b.width <= 0) continue; cnt++;
      x0 = Math.min(x0, b.left); x1 = Math.max(x1, b.right); y0 = Math.min(y0, b.top); y1 = Math.max(y1, b.bottom);
    }
    return cnt ? { x: x0 - origin.x, y: y0 - origin.y, r: x1 - origin.x, b: y1 - origin.y, n: cnt } : null;
  };

  const report = { url: location.href, started: new Date().toISOString(), ua: navigator.userAgent, dpr: devicePixelRatio, vp: [innerWidth, innerHeight], assets: null, fonts: null, virtualized: null, sweep: null, problems: [], pages: [], stats: null, summary: null };
  // **S5.2:** רשימת משפחות הבדיקה — מופיעה בדוח עצמו (machine-readable) ולא רק בהערת הקובץ
  report.checkFamilies = ['LINE_OVERLAP', 'INK_NOT_JUSTIFIED', 'LINE_OUTSIDE_COLUMN', 'LINE_BELOW_COLUMN', 'LINE_ABOVE_COLUMN', 'GUTTER_OVERLAP', 'LINE_OUT_OF_ORDER', 'WINDOW_WRONG_SIDE', 'WINDOW_NOT_FIRST', 'LAST_LINE_JUSTIFIED', 'LAST_NOT_CENTERED', 'LAST_RIGHT_GAP', 'HEAD_JUSTIFIED', 'HEAD_NOT_CENTERED', 'HEADER_POSITION', 'FOLIO_POSITION', 'FOLIO_MISSING', 'FOLIO_SEQUENCE', 'FN_OVERLAP', 'FN_OVERLAPS_BODY', 'FN_BELOW_PAGE', 'FN_RULE_PRESENT', 'EMPTY_PAGE', 'BAND_BOX_OUTSIDE_PAGE', 'BAND_INK_OUTSIDE', 'BAND_NOT_CENTERED', 'TOC_ROWS', 'PITCH_UNIFORMITY', 'BODY_FONT_UNIFORMITY', 'MARKER_NOTE_MATCH', 'TYPE_UNKNOWN', 'COLUMN_TOPS_ALIGN', 'COLUMN_ORDER_RTL', 'COLUMN_WIDTH_MISMATCH', 'COLUMN_OUTSIDE_PAGE', 'SINGLE_TYPE_TWO_CONTENT_COLS', 'NOWRAP_BODY_LINE', 'STYLE_NOT_JUSTIFIED', 'WRAPPED_LINE', 'DIR_RTL_MISSING', 'PLACEHOLDER_GEOMETRY', 'PAGE_INDEX_MISSING', 'NO_SCROLLER', 'COVERAGE', 'NO_PAGES', 'SHAAR_ORDER', 'NO_SHAAR_SUB', 'SHAAR_EMPTY', 'BODY_PAGES_WITHOUT_HEADER', 'COLUMN_BOTTOMS_BALANCE'];
  const collectionProblems = [];

  try { await document.fonts.ready; } catch (e) {}
  report.assets = {
    appSrc: (document.querySelector('script[src*="app.bundle.js"]') || {}).src || null,
    keyResources: performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /app\.bundle|styles\.css|engine-worker/.test(n)).slice(0, 10)
  };
  const famStatus = {};
  try { for (const f of document.fonts) { const k = f.family + '|' + f.status; famStatus[k] = (famStatus[k] || 0) + 1; } } catch (e) {}
  report.fonts = {
    checkFrankRuhlLibre: document.fonts.check('16px "Frank Ruhl Libre"'),
    checkDavidLibre: document.fonts.check('16px "David Libre"'),
    checkNotoSerifHebrew: document.fonts.check('16px "Noto Serif Hebrew"'),
    faces: famStatus
  };

  const canvas = document.querySelector('.preview-canvas');
  const slots = canvas ? [...canvas.querySelectorAll(':scope > .preview-page')] : [...document.querySelectorAll('.page')];
  const n = slots.length;
  if (!n) { collectionProblems.push({ type: 'NO_PAGES', severity: 'high', detail: 'אף עמוד לא רונדר' }); report.problems = collectionProblems; report.summary = { pages: 0, slots: 0, problems: 1, bySeverity: { high: 1 }, counts: { NO_PAGES: 1 } }; return JSON.stringify(report); }
  const liveNow = () => (canvas ? [...canvas.querySelectorAll(':scope > .preview-page:not(.preview-page--placeholder)')] : [...document.querySelectorAll('.page')]);
  report.virtualized = liveNow().length < n;
  const phH = [];
  for (const ph of slots) {
    if (!/preview-page--placeholder/.test(String(ph.className))) continue;
    const r = R(ph); phH.push(Math.round(r.h * 10) / 10);
    if (r.w < 100 || r.h < 100) collectionProblems.push({ type: 'PLACEHOLDER_GEOMETRY', severity: 'medium', page: Number(ph.getAttribute('data-page-index')), w: Math.round(r.w), h: Math.round(r.h) });
  }
  report.placeholderHeights = phH.length ? { n: phH.length, min: Math.min.apply(null, phH), max: Math.max.apply(null, phH) } : null;

  const audited = new Map();
  const wc = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

  // ── איסוף עמוד חי ל-pageData (כל הגיאומטריה יחסית לעמוד; הבדיקות בשכבה הטהורה) ──
  function auditLive(pg) {
    // **S5.2 (P-11):** data-page-index חסר — בעבר Number(null)===0 והעמוד זויף
    // כעמוד 0 (דריסה שקטה של העמוד האמיתי); עכשיו — בעיה מדווחת ודילוג מפורש.
    const idxAttr = pg.getAttribute('data-page-index');
    const idx = Number(idxAttr);
    if (idxAttr == null || !Number.isFinite(idx)) {
      collectionProblems.push({ type: 'PAGE_INDEX_MISSING', severity: 'high', detail: 'לעמוד חסר data-page-index — לא ניתן לזהותו (בעבר זויף כעמוד 0)' });
      return;
    }
    if (audited.has(idx)) return;
    const pr = R(pg);
    const origin = { x: pr.x, y: pr.y };
    const info = { i: idx, t: audit.typeOfCls(pg.className), pw: Math.round(pr.w * 10) / 10, ph: Math.round(pr.h * 10) / 10, gates: 0, cols: [], bands: [], tocRows: [], fns: [], fnAreaN: 0, fnRuleN: 0, words: 0, dirOk: 0, dirBad: 0 };
    audited.set(idx, info);

    const hdr = pg.querySelector('.running-head');
    if (hdr) {
      const hr = rel(R(hdr), origin);
      info.header = { text: (hdr.textContent || '').trim().slice(0, 60) || null, top: hr.y, bottom: hr.b };
      info.h = info.header.text;
    }
    const fol = pg.querySelector('.folio');
    if (fol && (fol.textContent || '').trim()) {
      const fr = rel(R(fol), origin);
      info.folio = { text: (fol.textContent || '').trim(), top: fr.y, bottom: fr.b };
      info.fo = info.folio.text;
    }
    info.gates = [...pg.querySelectorAll('.band--gate')].filter((b) => (b.textContent || '').trim()).length;
    info.g = info.gates;

    // פסים (כולל שערים) — תיבה + דיו + יישור
    for (const b of pg.querySelectorAll('.band')) {
      const br = rel(R(b), origin);
      const bcs = getComputedStyle(b);
      const band = { cls: String(b.className), x: br.x, y: br.y, w: br.w, h: br.h, align: bcs.textAlign, text: (b.textContent || '').slice(0, 24), ink: null };
      band.ink = inkOf(b, origin);
      info.bands.push(band);
      info.words += wc(b.textContent);
    }

    // שורות תוכן-עניינים — מורשת: בנות של העמוד; מודרני: בתוך .toc-rows
    const tocWrap = pg.querySelector('.toc-rows');
    info.tocInContainer = !!(tocWrap && tocWrap.querySelector('.toc-row'));
    for (const rowEl of pg.querySelectorAll('.toc-row')) {
      const rr = rel(R(rowEl), origin);
      info.tocRows.push({ x: rr.x, y: rr.y, w: rr.w, h: rr.h, text: (rowEl.textContent || '').slice(0, 24) });
      info.words += wc(rowEl.textContent);
    }

    // אזור הערות מודרני (.footnotes) + קו מפריד (.fn-rule)
    for (const area of pg.querySelectorAll('.footnotes')) {
      info.fnAreaN++;
      if (area.querySelector('.fn-rule')) info.fnRuleN++;
    }

    const cols = [...pg.querySelectorAll('.column')];
    info.colsN = cols.length;
    info.mk = ''; info.mkList = []; info.mkn = 0;
    let totalLines = 0;
    cols.forEach((c, ci) => {
      const cr = rel(R(c), origin);
      const lines = [...c.children];
      // **S5.2 (תיקון עיוורון-רגרסיה):** גם y/h של הטור חייבים להיאסף — השכבה
      // הטהורה קוראת c.y/c.h (LINE_ABOVE_COLUMN, LINE_BELOW_COLUMN,
      // COLUMN_OUTSIDE_PAGE). בלעדיהם ההשוואות הן מול undefined→NaN והגלאים
      // **לעולם לא יורים** בריצה החיה (המבחנות ב-Node עברו כי הן מספקות y/h
      // בעצמן) — בדיוק ה-false-green שהשכבה הזאת נועדה למנוע.
      const colRec = { n: lines.length, x: Math.round(cr.x * 10) / 10, y: Math.round(cr.y * 10) / 10, w: Math.round(cr.w * 10) / 10, h: Math.round(cr.h * 10) / 10, tops: [], f: '', at: '', p: [], lines: [] };
      info.cols.push(colRec);
      totalLines += lines.length;
      let prevTop = null, prevFlag = null;
      for (const l of lines) {
        const cls = String(l.className);
        const lr = rel(R(l), origin);
        const cs = getComputedStyle(l);
        const ink = inkOf(l, origin);
        const winEl = l.querySelector ? l.querySelector('.w--window') : null;
        const mkEls = l.querySelectorAll ? [...l.querySelectorAll('.w--fnmarker')] : [];
        const rec = {
          y: lr.y, h: lr.h, x: lr.x, w: lr.w,
          last: /line--last/.test(cls), head: /line--heading/.test(cls),
          winWrap: /line--window-wrap/.test(cls), custom: /custom-style/.test(cls),
          ink, wrapSpread: 0, spanWraps: [],
          style: { ta: cs.textAlign, tal: cs.textAlignLast, ws: cs.whiteSpace, fs: parseFloat(cs.fontSize) || 0, fam: String(cs.fontFamily).split(',')[0].trim(), dir: l.getAttribute('dir') || '' },
          words: (l.textContent || '').trim().split(/\s+/).filter(Boolean).length,
          window: null, markers: [], token: l.getAttribute('data-token-id') || l.getAttribute('data-token') || null,
          text: (l.textContent || '').slice(0, 24)
        };
        // D-92: עטיפה בצמתי טקסט ובספאנים — נאספת כאן, נבדקת בשכבה הטהורה
        {
          let minTop = Infinity, maxTop = -Infinity, wn = 0;
          for (const ch of l.childNodes) {
            if (ch.nodeType !== 3) continue;
            if (!(ch.textContent || '').trim()) continue;
            const rg = document.createRange(); rg.selectNodeContents(ch);
            for (const rc of rg.getClientRects()) {
              if (rc.width <= 0.5) continue;
              wn++; if (rc.top < minTop) minTop = rc.top; if (rc.top > maxTop) maxTop = rc.top;
            }
          }
          if (wn >= 2) rec.wrapSpread = maxTop - minTop;
        }
        for (const sp of l.querySelectorAll('span')) {
          if (!(sp.textContent || '').trim()) continue;
          const rg2 = document.createRange(); rg2.selectNodeContents(sp);
          let sMin = Infinity, sMax = -Infinity, sN = 0;
          for (const rc of rg2.getClientRects()) {
            if (rc.width <= 0.5) continue;
            sN++; if (rc.top < sMin) sMin = rc.top; if (rc.top > sMax) sMax = rc.top;
          }
          if (sN >= 2) rec.spanWraps.push({ cls: String(sp.className).slice(0, 24), spread: sMax - sMin });
        }
        if (winEl) {
          const wr = rel(R(winEl), origin);
          rec.window = { x: wr.x, y: wr.y, w: wr.w, h: wr.h };
        }
        for (const m of mkEls) rec.markers.push({ t: (m.textContent || '').trim(), fs: parseFloat(getComputedStyle(m).fontSize) || 0 });
        info.words += wc(l.textContent);

        const base = rec.last ? 'l' : (rec.head ? 'h' : 'b');
        colRec.tops.push(Math.round((lr.y + origin.y) * 10));  // אבסולוטי — כמו determinism-sweep
        colRec.f += base;
        colRec.at += (rec.window ? 'w' : '-') + (rec.markers.length ? 'm' : '-');
        if (prevTop !== null && base === 'b' && prevFlag === 'b') colRec.p.push(Math.round((rec.y - prevTop) * 10) / 10);
        prevTop = rec.y; prevFlag = base;
        colRec.lines.push(rec);
      }
    });
    // סמני הערה בגוף — מרוכזים מרשומות השורות (למולטיסט הגלובלי)
    for (const colRec of info.cols) {
      for (const l of (colRec.lines || [])) for (const m of l.markers) { info.mk += m.t; info.mkList.push(m.t); info.mkn++; }
    }
    info.lines = totalLines;

    // הערות שוליים (מורשת: בנות של העמוד) — תיבה + כל סמני הפתיחה שבתוכן
    // **S5.2 (27):** בזרימה רציפה כל ההערות של העמוד באלמנט אחד — המילה-הראשונה
    // של textContent תפסה רק את הסמן הראשון (132 מול 82 בקורפוס!). עכשיו נאספים
    // כל ספאני .w--fnmarker — בדיוק פתיחות-ההערות.
    const fns = [...pg.querySelectorAll('.footnote')];
    info.fn = fns.length;
    info.fnMk = ''; info.fnMkList = [];
    // **S6.3 (46):** ראשית פס ההערות — התחתית האפקטיבית של הזרימה בעמודי הערות
    let fnTopY = Infinity;
    for (const f of fns) { const fr0 = rel(R(f), origin); if (fr0.y < fnTopY) fnTopY = fr0.y; }
    if (fns.length && isFinite(fnTopY)) info.fnTopY = Math.round(fnTopY * 10) / 10;
    for (const f of fns) {
      const fr = rel(R(f), origin);
      const fcs = getComputedStyle(f);
      const markers = [...f.querySelectorAll('.w--fnmarker')].map((m) => (m.textContent || '').trim()).filter(Boolean);
      // נפילה (נתיב מודרני בלי ספאנים): המילה הראשונה של הטקסט. **S5.2 (תיקון
      // המשכים):** אלמנט המשך (.fn--continuation — מורשת block ומודרני כאחד) אינו
      // פתיחת-הערה ואסור לו לתרום סמן למולטיסט: במודרני ההמשך מציג את הסמן
      // בשנית (S7.1.3) ובמורשת block הוא נפתח ב-'(המשך)' בלבד — שניהם היו
      // מזייפים "סמן בהערות בלי סמן בגוף" (או כפילות). המולטיסט משווה
      // **פתיחות** מול סמני-גוף — המשכים מחוץ לאוכלוסייה מטבעם.
      if (!markers.length && !/fn--continuation/.test(String(f.className))) {
        const first = (f.textContent || '').trim().replace(/^\(המשך\)\s*/, '').split(/[\s\u200F]+/)[0] || '';
        if (first && !/^\(המשך\)$/.test(first)) markers.push(first);
      }
      info.fns.push({ x: fr.x, y: fr.y, w: fr.w, h: fr.h, markers, text: (f.textContent || '').slice(0, 24), fs: parseFloat(fcs.fontSize) || 0 });
      info.fnMk += markers.join('');
      info.fnMkList.push(...markers);
      info.words += wc(f.textContent);
    }
    // הערות צד — נספרות לספירת המילים בלבד
    for (const mn of pg.querySelectorAll('.margin-note')) info.words += wc(mn.textContent);
    info.marginWords = 0;
  }

  // ── סריקה ──
  if (!report.virtualized) {
    for (const pg of liveNow()) auditLive(pg);
  } else {
    const panel = document.querySelector('.tab-panel[data-tab="preview"]');
    let scroller = null;
    for (const cand of [panel, canvas]) if (cand && cand.scrollHeight > cand.clientHeight + 10) { scroller = cand; break; }
    if (!scroller) {
      collectionProblems.push({ type: 'NO_SCROLLER', severity: 'high', detail: 'וירטואלי ללא אלמנט גולל' });
      for (const pg of liveNow()) auditLive(pg);
    } else {
      const maxScroll = () => scroller.scrollHeight - scroller.clientHeight;
      const step = Math.max(1, Math.min(3, Math.ceil(n / 300)));
      let steps = 0; const t1 = Date.now();
      for (let target = 0; target < n; target += step) {
        scroller.scrollTop = Math.round(((target + 0.5) / n) * maxScroll());
        await settle(); await sleep(20);
        for (const pg of liveNow()) auditLive(pg); steps++;
      }
      scroller.scrollTop = maxScroll(); await settle(); await sleep(20);
      for (const pg of liveNow()) auditLive(pg);
      report.sweep = { steps: steps + 1, step: step, ms: Date.now() - t1, scroller: String(scroller.className) };
    }
  }

  // ── הרצת השכבה הטהורה על הנתונים שנאספו ──
  const pages = [...audited.values()].sort((a, b) => a.i - b.i);
  const out = audit.finalizeChecks(pages, {
    slots: n, virtualized: report.virtualized, sweep: report.sweep,
    sweepMs: Date.now() - t0, collectionProblems
  });
  report.problems = out.problemsCapped;
  report.totalProblems = out.summary.problems;
  // הדוח הציבורי — רשומות קומפקטיות (אותו מבנה כמו קודם; tops אבסולוטיים
  // להשוואת הדטרמיניזם מול determinism-sweep).
  report.pages = out.seq.map((p) => ({
    i: p.i, t: p.t, pw: p.pw, ph: p.ph,
    h: p.header ? p.header.text : null, fo: p.folio ? p.folio.text : null,
    g: p.gates, colsN: p.cols.length, cols: p.cols.map((c) => ({ n: c.n, x: c.x, w: c.w, tops: c.tops, f: c.f, at: c.at, p: c.p })),
    fn: p.fns.length, fnMk: p.fnMk || '', fnMkList: p.fnMkList || [], mk: p.mk || '', mkList: p.mkList || [], mkn: p.mkn || 0,
    colContent: p.colContent, lines: p.lines, words: p.words,
    tocRows: p.tocRows.length, fnAreaN: p.fnAreaN, fnRuleN: p.fnRuleN, gutter: p.gutter
  }));
  report.stats = out.stats;
  report.summary = out.summary;
  return JSON.stringify(report);
})()
}
