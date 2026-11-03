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
  const worker = new Worker('engine-worker.bundle.js');
  const engine = new WorkerEngineClient(workerTransport(worker));
  // **03.11 (EXT-14):** ספריית נכסי IMUD — פונטים/עיצובים/ברירות מחדל מקוריות.
  const imud = createImudLibrary(engine);
  const app = createApp(document, {
    transport: workerTransport(worker),
    fontStatus: (typeof document !== 'undefined' && document.fonts) ? 'loading' : 'ready',
    // **03.11:** ייצוא PDF/ZIP במנוע ה־Worker + הורדה בפועל בדפדפן
    remoteExport: true,
    onExportFile: (kind, data, name) => {
      if (kind === 'html') downloadText(name || 'book.html', data, 'text/html');
      else if (kind === 'pdf') downloadBytes(name || 'book.pdf', data, 'application/pdf');
      else if (kind === 'zip') downloadBytes(name || 'book-project.zip', data, 'application/zip');
    },
    getExportFont: async (family) => {
      const buf = await imud.loadFont(family);
      return buf ? { name: family, bytes: buf } : null;
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
  // אחרי ההרכבה: קטלוג הפונטים מתעדכן בפיקרים ברגע שהספרייה נטענת (TDZ-safe)
  imud.loadFontCatalog().then((families) => {
    app.refreshFontCatalog && app.refreshFontCatalog(families);
  }).catch(() => { /* ספרייה לא זמינה (למשל מקומי בלי assets) — ממשק בסיסי */ });
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
