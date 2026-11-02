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
.line{white-space:normal;text-align:right}
.line--last{text-align:center}
.running-head{display:flex;width:100%}
.head--sep-gray{border-bottom:1px solid #999}
.head--sep-black{border-bottom:1.5px solid #000}
.footnotes{position:absolute;bottom:8px;left:12px;right:12px;border-top:1px solid transparent;font-size:.8em}
.fn-rule--regular{border-top:1px solid #000;height:0}
.fn-rule--circles{border-top:3px dotted #000;height:0}
.folio{position:absolute;bottom:4px;width:100%;text-align:center}
.folio--outer-left{left:8px;width:auto;text-align:left}
.folio--outer-right{right:8px;width:auto;text-align:right}
.side-note{position:absolute;font-size:.75em;width:18%;max-height:60%;overflow:hidden}
.toc-entry{display:flex;justify-content:space-between}
.toc-entry .dots{flex:1;border-bottom:1px dotted #000;margin:0 6px 4px}
`;

/** בניית מסמך HTML עצמאי מעמודי ה‑DOM שכבר רוכמו (string-level; עובד גם Node-side). */
function buildStandaloneHtml(pagesHtml, settings, meta = {}) {
  const title = meta.title || settings['book-name'] || 'ספר';
  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>${BASE_CSS}</style>
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
