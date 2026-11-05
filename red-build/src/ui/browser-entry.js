// src/ui/browser-entry.js — כניסת הדפדפן (מרוכז ל־ui/app.bundle.js ע"י הבונה)
'use strict';

/**
 * מריץ את createApp עם Worker אמיתי (engine-worker.bundle.js) ומחבר את
 * יכולות הדפדפן בלבד: קובץ־פתוח לייבוא TXT/תבנית, הורדות Blob, מצב גופנים.
 * המנוע עצמו לא נטען כאן — רק ב־Worker (בלי לחסום את ה־UI — REQ-UI-03).
 */

const { createApp } = require('./app-shell');
const { workerTransport } = require('./worker-client');
const { WorkerEngineClient } = require('./worker-client');
const { createImudLibrary } = require('./imud-library');
const { BASE_CSS } = require('../engine/output/html-export');

/** **03.11(ג) תיקון קטסטרופת התצוגה:** הזרקת BASE_CSS — מקור הכללים של העמודים
 * (טורים/שורות/פסים/עיטורים/שערים) המשמש את הייצוא העצמאי — גם לתצוגה החיה.
 * בעבר התצוגה הסתמכה על styles.css שהכיל רק חלק מהכללים: בלי .column{position:absolute}
 * הטורים התמסדרו כבלוקים בזרימה (RTL) — הטקסט נדחק לימין ושכבות חפפו.
 * כללי הגלובל (html,body,.book) של המסמך העצמאי מוסרים — הם שייכים לקובץ המיוצא בלבד. */
function injectPageBaseCss() {
  const scoped = BASE_CSS
    .replace(/^html,body\{[^}]*\}\s*/m, '')
    .replace(/^\.book\{[^}]*\}\s*/m, '');
  const st = document.createElement('style');
  st.textContent = scoped;
  document.head.appendChild(st);
}

function downloadJson(name, json) {
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** הורדת פלט בינארי (PDF/ZIP) מהייצוא ב-Worker. */
function downloadBytes(name, bytes, mime) {
  const blob = new Blob([bytes], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function pickFile(accept, cb) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = accept;
  inp.addEventListener('change', () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => cb(String(r.result));
    r.readAsText(f, 'utf-8');
  });
  inp.click();
}

/** קובץ בינארי (DOCX) — קריאה כ־ArrayBuffer → Uint8Array (S11). */
function pickBinaryFile(accept, cb) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = accept;
  inp.addEventListener('change', () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => cb(new Uint8Array(r.result), f.name);
    r.readAsArrayBuffer(f);
  });
  inp.click();
}

function boot() {
  const mount = document.getElementById('app');
  if (!mount) return;
  injectPageBaseCss();
  const ASSET_VERSION = '2026-11-06-s5.2'; // cache-busting: מנע גרסה מיושנת מהמטמון אחרי פריסה
  // **S5.2:** התעבורה מקבלת מפעל () => new Worker(url) במקום מופע קיים —
  // cancel/קריסה (terminate) נטרלו בעבר את המנוע לצמיתות; עכשיו הפוסט הבא
  // בונה מופע חדש מאותו URL (כולל ?v=). בלי זה כל בקשה אחרי ביטול הוחברה
  // ל-Worker מת והאפליקציה נתקעה ב"מנוע: עמל…".
  const engine = new WorkerEngineClient(workerTransport(() => new Worker(`engine-worker.bundle.js?v=${ASSET_VERSION}`)));
  const imud = createImudLibrary(engine);
  const app = createApp(document, {
    engineClient: engine,
    fontStatus: (typeof document !== 'undefined' && document.fonts) ? 'loading' : 'ready',
    // **03.11:** ייצוא PDF/ZIP במנוע ה־Worker + הורדה בפועל בדפדפן
    remoteExport: true,
    onExportFile: (kind, data, name) => {
      if (kind === 'html') downloadText(name || 'book.html', data, 'text/html');
      else if (kind === 'pdf') downloadBytes(name || 'book.pdf', data, 'application/pdf');
      else if (kind === 'zip') downloadBytes(name || 'book-project.zip', data, 'application/zip');
    },
    getExportFont: async (family) => {
      // **03.11(ג):** הגוף המבוקש לא בספרייה (למשל שם אנגלי כשהקטלוג בעברית) —
      // נפילה מפורשת לגופן יציב מהסט המוטמע (ברירות מחדל בעברית של IMUD),
      // כך שייצוא PDF עובד מהקופסה גם בלי בחירת גופן מהספרייה. ההודעה מדווחת.
      // **S5.2:** מחסנית גופן ("David Libre, serif") — loadFont היה נכשל בשקט
      // לפני שהיה בקטלוג; loadFontStack פותר את המחסנית למשפחה המוטמעת
      // הראשונה, והשם שמוחזר הוא המשפחה שפועלה בפועל (מדידה/ייצוא עקביים).
      const buf = await imud.loadFontStack(family);
      if (buf) {
        const resolved = (typeof imud.resolveFamily === 'function' && imud.resolveFamily(family)) || String(family).split(',')[0].trim();
        return { name: resolved, bytes: buf };
      }
      const fb = await imud.loadDefaultExportFont();
      return fb ? { name: fb.family, bytes: fb.bytes, fallbackFor: family } : null;
    },
    getExportFontCss: () => imud.exportFontCss(),
    // **03.11:** ספריית העיצובים — לפיקרים בפאנל הבורר
    imudLibrary: imud,
    onRequestTxtImport: () => pickFile('.txt,text/plain', (text) => app.onDocumentAction('import-txt', text)),
    onRequestDocxImport: () => pickBinaryFile('.docx', (bytes, name) => app.importDocxFile(bytes, name)), // **S11**
    onRequestExtensionsImport: () => pickFile('.json,application/json', (json) => app.extensions.importFromText(json, 'הרחבות.json')), // **S11**
    onSaveExtensions: (json) => downloadJson('tora-extensions.json', json), // **S11**
    onSaveTemplate: (json) => downloadJson('settings-template.json', json),
    onLoadTemplate: () => pickFile('.json,application/json', (json) => {
      try {
        app.loadTemplateJson(json);
      } catch (e) {
        alert('טעינת התבנית נכשלה: ' + (e && e.message ? e.message : e));
      }
    }),
    onDebugDownload: (json, pageIndex) => downloadJson(`page-debug-${pageIndex + 1}.json`, JSON.stringify(json, null, 2)),
    onOpenBuilder: () => { /* הבורר חי בפאנל ההגדרות (settings-panel) מאז 03.11 */ }
  });
  mount.appendChild(app.root);
  // **S5.2:** נתיב כשל טעינה של ה-Worker — בעבר לא היה כלל: הסטטוס היה תקוע
  // ב"עמל…" לנצח בלי הודעה. הלקוח כבר דחה את ההבטחות שבטיסה (reject in-flight);
  // כאן נדווח למשתמש בעברית בפס המצב. ה-respawn מאחורי הקלעים: הפוסט הבא יבנה מופע חדש.
  engine.onError(() => {
    app.status.setEngineState('error', {
      message: 'טעינת מנוע העימוד נכשלה — תבוצע הפעלה מחדש בפעולה הבאה. אם הבעיה חוזרת, רעננו את הדף (F5).'
    });
  });
  // **S5.2 (4):** עימוד האתחול אחרי החלת ברירות המחדל — לא לדרוס עימוד פעיל
  // של המשתמש (הדבקה במהלך האתחול): נמתין לפנוי, ואז נעמוד עם ההגדרות הטריות.
  // חסם עליון (~10 שניות) — אחריו ממשיכים בכל זאת; ה-single-flight בטוח מ-S5.2.
  function retypesetWhenIdle(attempt = 0) {
    if (engine.busy && attempt < 200) { setTimeout(() => retypesetWhenIdle(attempt + 1), 50); return; }
    app.onExplicitRetypeset();
  }
  // אחרי ההרכבה: קטלוג הפונטים מתעדכן בפיקרים ברגע שהספרייה נטענת (TDZ-safe)
  imud.loadFontCatalog().then((families) => {
    app.refreshFontCatalog && app.refreshFontCatalog(families);
  }).catch(() => { /* ספרייה לא זמינה (למשל מקומי בלי assets) — ממשק בסיסי */ });
  // **03.11(ד) — "שום דבר מהגדרות ברירת המחדל אינו קיים" (דיווח משתמש 3):**
  // האפליקציה עולה עם ברירות המחדל הגנריות של RED. ברירות המחדל של הפרויקט
  // המקורי (264 מפתחות: גופני עיצוב, שערים, כותרות עליונות, יישורים) מוטמעות
  // בנכסים — ועתה מוחלות אוטומטית בעלייה, כך שספר חדש נראה כמו המקור מהשנייה
  // הראשונה (David Libre/Frank Ruhl Libre/Bellefair, שער ראשי+אחורי+משנה,
  // כותרות עליונות בכל עמוד). כשל טעינה (למשל פתיחה מקומית בלי assets) —
  // נשארות ברירות RED, האפליקציה עובדת; ההודעה מתועדת במצב.
  imud.loadFontCatalog().then(() => imud.loadLegacyDefaults()).then(({ settings: imported }) => {
    return app.applyLegacyDefaults(imported, { source: 'boot', retypeset: false });
  }).then(() => {
    // עימוד מפורש רק אם כבר יש טקסט בעורך (עלייה עם מסמך שמור)
    if (app.getText && app.getText().trim()) retypesetWhenIdle();
  }).catch(() => { /* נכסים לא זמינים — ברירות RED, מתועד */ });
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => app.status.setFonts('ready'));
  }
  if (typeof window !== 'undefined') window.__toraApp = app; // לניפוי ידני
}

function downloadText(name, text, mime) {
  const blob = new Blob([text], { type: mime || 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

module.exports = { createApp, workerTransport };
