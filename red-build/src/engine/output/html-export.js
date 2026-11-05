// src/engine/output/html-export.js — Standalone HTML export + offline guard (REQ-EXP, Orange exit-7 doctrine)
'use strict';

/**
 * ייצוא HTML עצמאי: CSS מוטמע, ללא תלות רשת. offline-guard: כל הפניה חיצונית → דחייה (exit 7 במנוע CLI).
 * סימוני page-break (⏎) אינם מיוצאים לעולם (F-01).
 */

const OFFLINE_PATTERNS = [
  /https?:\/\/(?!localhost)/i,
  /@import\s+url\(/i,
  /<link[^>]+href=["']https?:/i,
  /<script[^>]+src=["']https?:/i
];

/** בדיקת offline-guard על מחרוזת HTML; זורק עם פירוט אם נמצאה בקשה חיצונית. */
function assertOfflineSafe(html) {
  const hits = [];
  for (const re of OFFLINE_PATTERNS) {
    const m = html.match(re);
    if (m) hits.push({ pattern: re.source, sample: html.slice(Math.max(0, m.index - 20), m.index + 60) });
  }
  if (hits.length) {
    const err = new Error(`offline-guard: external references found (${hits.length})`);
    err.code = 'ERR_OFFLINE_GUARD';
    err.exitCode = 7; // Orange doctrine
    err.hits = hits;
    throw err;
  }
}

const BASE_CSS = `
html,body{margin:0;background:#3a3a3a;font-family:'Frank Ruhl Libre','David',serif;direction:rtl}
.book{display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px 0}
.page{background:#fff;color:#000;box-shadow:0 2px 12px rgba(0,0,0,.45);position:relative;overflow:hidden;padding:0}
.columns{position:absolute;top:0;left:0;right:0;bottom:0}
.column{position:absolute;top:0;bottom:0}
.line{white-space:normal;text-align:justify;text-justify:inter-word}
.line--last{text-align:center}
/* **S4.23 (דיווח משתמש — יישור שורות בתצוגה/ייצוא):** שורה בודדת בבלוק
   נחשבת "השורה האחרונה" לפי הוראת CSS — ו-justify לעולם אינו מותח אותה.
   כל .line הוא בלוק בן-שורה-אחת מתוכנן (השבירה נעשתה במנוע); לכן
   text-align:justify לבדו היה אפס-פעולה והשורות נשארו מרופטות בצד שמאל
   (נמדד: פערים 2..53px מקצה הטור). רק text-align-last:justify מותח
   אותה בפועל — אותה נוסחה של המקרן ל-PDF. לא על שורות אחרונות/כותרות
   (הן center מטבען, ו-line--last-right/stretch מוגדרות בנפרד). */
.line:not(.line--last):not(.line--heading):not(.band){text-align-last:justify}
/* **S4.24 (באג מרכוז פסים):** קווי הפס (class="line band …" — כותרות-רוחב,
   סימנים, שורות שער) נפגעו מהכלל לעיל: שורה בודדת בבלוק נחשבת "אחרונה"
   ו-text-align-last:justify דרס את ה-center — מילים פזורות מקצה לקצה
   (נמדד בחי: "כל הזכויות שמורות" מיושרת למלוא 378px; מילה בודדת כמו
   "הקדמה" נדבקת לקצה הימני — אסימטריה 494px). :not(.band) מחזיר את
   המרכוז; רינדור ה-DOM גם קובע text-align-last:auto ישירות ב-mkLine. */
.band{text-align-last:auto}
.running-head{display:flex;width:100%}
.head--sep-gray{border-bottom:1px solid #999}
.head--sep-black{border-bottom:1.5px solid #000}
.footnotes{position:absolute;bottom:8px;left:12px;right:12px;border-top:1px solid transparent;font-size:.8em}
.footnotes--continuous{border-top:none}
.fn-rule--regular{border-top:1px solid #000;height:0}
.fn-rule--circles{border-top:3px dotted #000;height:0}
.fn-rule--sparkle{border-top:2px dashed #6b6b6b;height:0}
.fn-rule--star{border-top:3px double #4a4a4a;height:0}
.fn-rule--diamond{border-top:2px solid #000;height:0;transform:scaleX(.6)}
.fn--continuation{color:#555;font-style:italic}
.folio{position:absolute;bottom:4px;width:100%;text-align:center;font-size:10pt}
.folio--outer-left{left:8px;width:auto;text-align:left}
.folio--outer-right{right:8px;width:auto;text-align:right}
.folio--outer{left:8px;width:auto;text-align:left}
/* **S5.1:** 'outer' מודע-זוגיות כמו pos-outer של המקור (style.css:1369:
   even=flex-start=ימין ב-RTL; odd=שמאל) — תיקון NUMPOS/bottom_outer. */
.page:nth-child(even) .folio--outer{left:auto;right:8px;text-align:right}
.folio--top{bottom:auto;top:4px}
.folio--in-header{bottom:auto;top:6px}
.page-num-badge{display:inline-flex;align-items:center;justify-content:center;padding:1px 4px;line-height:1}
.page-num-frame-circle{border:1.2px solid #333;border-radius:50%;min-width:22px;height:22px;padding:1px}
.page-num-frame-box{border:1.2px solid #333;border-radius:3px;min-width:22px;height:20px;padding:1px 4px}
.side-note{position:absolute;font-size:.75em;max-height:60%;overflow:hidden}
.col-divider{position:absolute;width:0;border-left:1px solid #999}
.col-divider--thin{border-left:1px solid #999}
.col-divider--dashed{border-left:1px dashed #999}
.col-divider--double{border-left:3px double #999}
.w--paren{color:#333}
/* **S4.15 (גופן מילת-החלון — כמו המקור):** .first-word-window של המקור —
   FrankReal משקל 900 בגודל 1.5em. הגיאומטריה (רוחב החלון+צמצום שתי
   השורות הראשונות) כבר במנוע (מדידת FrankReal-Bold.ttf — הוכח מסימון
   הייחוס: התאמה מושלמת ל-116 מילות-חלון); כאן רק הגופן החזותי.
   line-height:0.85 כמו המקור — תיבת השורה אינה מתנפחת (חפיפה אפס). */
.w--window{font-family:'FrankReal','Frank Ruhl Libre',serif;font-weight:900;line-height:.85}
.endnote-title{font-size:1.2em;font-weight:700;margin:8px 12px}
.endnote-list{font-size:.85em;padding:0 12px}
.endnote-note{margin:2px 0}
.toc-page-title{font-size:16pt;font-weight:700;margin:12px 18px 18px;text-align:center}
.toc-rows{position:absolute;top:70px;left:18px;right:18px;bottom:30px}
.toc-row{display:flex;align-items:baseline;text-decoration:none;color:inherit;gap:6px;margin:2px 0}
.toc-row .toc-dots{flex:1;border-bottom:1px dotted #000;min-width:24px;margin:0 6px 4px}
.toc-row .toc-label{min-width:30px;text-align:left}
.toc-row .toc-num{min-width:20px;color:#444}
.toc-lvl-1{font-size:12pt;font-weight:700}
.toc-lvl-2{font-size:11pt}
.toc-lvl-3{font-size:10.5pt;margin-right:16px}
.toc-lvl-4{font-size:10.5pt;margin-right:32px}
.toc-lvl-5{font-size:10.5pt;margin-right:48px}
.toc-lvl-6{font-size:10.5pt;margin-right:64px}
.toc-lvl-7{font-size:8.8pt;margin-right:80px;font-style:italic}
.toc-row--group{flex-wrap:wrap}
.toc-row--group .toc-item{display:inline-flex;gap:4px;text-decoration:none;color:inherit}
.toc-row--group .toc-item .grp-page{color:#333}
.toc-row--group .toc-item + .toc-item::before{content:'|';margin:0 6px;color:#777}
/* **03.11(ג) תיקון קטסטרופת התצוגה:** כללים שהיו חסרים — הטורים/הפסים/העיטורים
   ממוקמים ב-inline left/top/width/height ודורשים position:absolute גם בתצוגה
   החיה וגם בקובץ העצמאי. BASE_CSS הזה מוזרק גם לאפליקציה (browser-entry) —
   מקור שליטה יחיד לשני הנתיבים (F-09). */
.spanning-band{position:absolute}
.orn{position:absolute;background-repeat:no-repeat;background-position:center}
.deco{position:absolute;background-repeat:no-repeat;background-position:center}/* EXT-4: עיטורי הדף (שערים/רקעים) — ממוקמים מה-rectים (F-09) */
.shaar-main-box,.shaar-sub-box,.shaar-back-box{position:absolute;display:flex;align-items:center;justify-content:center;font-weight:700;text-align:center;padding:0 8px}
.custom-box{position:absolute;overflow:hidden}
.custom-image{position:absolute;background-repeat:no-repeat;background-size:100% 100%}
.line--last-right{text-align:right}
.line--last-stretch{text-align:justify}
/* **03.11(ד) — יישור שורות הגוף לשני הצדדים כמו המקור:** .main-column/p במקור
   הם text-align:justify; text-justify:inter-word ("טורים מיושרים באופן מושלם").
   עד כאן היה text-align:right — שורה ברוחב טור מלא שהטקסט שלה קצר יותר השאירה
   חור בצד שמאל ונתנה מראה "דחוק לימין" (דיווח משתמש 3). היישור סוגר את הפער
   בדיוק כפי שמנוע הפסקאות תכנן (המנוע שובר שורות לרוחב המידה; הדפדפן
   מותח רווחים לסגירת שארית). שורות אחרונות נשארות לפי body-last-line-align. */
/* **03.11(ד) — תוכן מובנה של עמודי השער (פורט CSS המקור):** */
.shaar-content{position:absolute;display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center;z-index:20}
.shaar-content--sub,.shaar-content--back{justify-content:center}
.bsd-header{font-family:'David Libre',serif;font-size:15pt;letter-spacing:5px;font-weight:700;margin-bottom:40px}
.book-title-main{line-height:1.1;margin:10px 0 40px 0;font-weight:400}
.shaar-content--sub .book-title-main,.shaar-content--back .book-title-main{margin:10px 0 15px 0}
.book-subtitle{font-weight:700;line-height:1.25}
.shaar-crown{width:180px;height:24px;margin:12px auto}
.shaar-crown svg{width:100%;height:100%;display:block}
.book-description{line-height:1.5;max-width:65%;margin:10px auto}
.book-sections-summary{line-height:1.5;border-top:1px solid #ccc;border-bottom:1px solid #ccc;padding:6px 12px;margin:8px 0;font-weight:700}
.author-block{line-height:1.3}
.publication-footer{font-weight:700;letter-spacing:1px}
.back-shaar-text-line{font-size:10.5pt;line-height:1.6;max-width:90%;margin:10px auto;color:#333}
.book-title-main--back{font-size:36pt}
.cs-counter{display:inline-block;min-width:1.4em;margin-inline-end:6px;font-weight:700;opacity:.7;font-size:.85em}
.footnote{margin:1px 0}
`;

/** בניית מסמך HTML עצמאי מעמודי ה‑DOM שכבר רוכמו (string-level; עובד גם Node-side). */
function buildStandaloneHtml(pagesHtml, settings, meta = {}) {
  const title = meta.title || settings['book-name'] || 'ספר';
  // **S12 (REQ-EXP-02):** כללי @page מרישום גדלי העמוד — הדפסה מדויקת מהקובץ העצמאי (אין רשת)
  const pageRules = meta.pageRules || '';
  // **03.11:** @font-face מוטמעים (data-URI) — מסופקים מה-UI; עוברים את offline-guard (אין http)
  const fontCss = meta.fontCss || '';
  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>${pageRules}${fontCss}${BASE_CSS}</style>
</head>
<body>
<main class="book">${pagesHtml.join('\n')}</main>
</body>
</html>`;
  if (settings['offline-guard']) assertOfflineSafe(html);
  return html;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = { buildStandaloneHtml, assertOfflineSafe, BASE_CSS };
