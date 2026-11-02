// src/ui/callgraph-scan.js — סריקת call-graph של F-06 (REQ-UI-02: "אין עימוד אוטומטי מכל בקרה")
'use strict';

/**
 * **F-06 (כלל ברזל, מסורת כל הגרסאות):** אף בקרת UI אינה רשאית להפעיל את
 * המנוע בעקיפין. הסריקה הסטטית בונה גרף קריאות מקובצי ה־UI ומאתרת כל
 * קריאה לשמות המנוע מחוץ לנתיבים המותרים:
 *
 * נתיבים מותרים (allowlist) — מפורשים ומינימליים:
 *   - worker-client.js          — שער המנוע היחיד (requestTypeset עצמו).
 *   - engine-worker-main.js     — צד ה־Worker (שם המנוע רץ; אינו בקרה).
 *   - app-shell.js: onExplicitRetypeset — ה־⚡ בלבד (נתיב מיידי, בלי debounce).
 *   - app-shell.js: onDocumentAction    — פעולות מסמך מפורשות (הדבקה/ייבוא/פתיחה).
 *
 * כל קריאה אחרת ל־typeset/requestTypeset/postToEngine/runEngine ⇒ הפרה.
 * הפלט — artifact של גרף הקריאות — נשמר לעדות (שער S10.2, call-graph artifact).
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN = ['typeset', 'requestTypeset', 'postToEngine', 'runEngine'];

/** הסרת הערות במודעות־מחרוזות (בלי לגעת בתוכן מחרוזות) — כדי שהערות לא יזייפו תוצאה. */
function stripComments(src) {
  let out = '';
  let i = 0, str = null;
  while (i < src.length) {
    const ch = src[i], next = src[i + 1];
    if (str) {
      out += ch;
      if (ch === '\\') { out += next || ''; i += 2; continue; }
      if (ch === str) str = null;
      i++;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') { str = ch; out += ch; i++; continue; }
    if (ch === '/' && next === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (ch === '/' && next === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    out += ch; i++;
  }
  return out;
}

/** חילוץ היקפי פונקציות בהתאמת סוגריים (ללא תלות בפרשר — מספיק לקוד שלנו). */
function extractFunctionScopes(src) {
  const scopes = [];
  const fnRe = /function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(\s*\)\s*=>\s*\{/g;
  let m;
  while ((m = fnRe.exec(src)) !== null) {
    const name = m[1] || m[2] || '<anonymous>';
    const bodyStart = src.indexOf('{', m.index + m[0].length - 1);
    if (bodyStart < 0) continue;
    let depth = 0, i = bodyStart;
    while (i < src.length) {
      const ch = src[i];
      if (ch === '\'' || ch === '"' || ch === '`') { // דילוג מחרוזות
        const q = ch; i++;
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      } else if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) break; }
      i++;
    }
    const from = bodyStart, to = i + 1;
    const line = src.slice(0, m.index).split('\n').length;
    scopes.push({ name, from, to, line });
  }
  return scopes;
}

/** כל מופעי הקריאות האסורות עם מיקום (לייחוס להיקף הפנימי ביותר). */
function findForbiddenCallSites(src) {
  const sites = [];
  for (const name of FORBIDDEN) {
    const re = new RegExp(`(?<![\\w$])${name}\\s*\\(`, 'g');
    let m;
    while ((m = re.exec(src)) !== null) sites.push({ name, index: m.index });
  }
  return sites;
}

/**
 * הסריקה.
 * @param {string} uiRoot - תיקיית src/ui
 * @param {string} browserApp - קובץ ui/app.js (bootstrap דפדפן) אם קיים
 * @returns {{files:string[], edges:Array, violations:Array, allowed:Array}}
 */
function scanControlTriggers(uiRoot, browserApp) {
  const files = fs.readdirSync(uiRoot).filter(f => f.endsWith('.js')).map(f => path.join(uiRoot, f));
  if (browserApp && fs.existsSync(browserApp)) files.push(browserApp);

  const violations = [];
  const allowed = [];
  const edges = [];

  // קובצי בקרות טהורות — אפס סובלנות: אפילו לא קריאה אחת לשם מנוע (בקוד, לא בהערות)
  const PURE_CONTROL_FILES = new Set([
    'settings-panel.js', 'editor-tab.js', 'preview-tab.js', 'testing-tab.js',
    'status-strip.js', 'caret-map.js', 'retypeset-policy.js', 'worker-protocol.js',
    'bindings.generated.js'
  ]);
  // שערי המנוע — שם הקריאה מותרת (הם עצמם הנתיב המפורש)
  const GATEWAY_FILES = new Set(['worker-client.js', 'engine-worker-main.js']);

  for (const file of files) {
    const base = path.basename(file);
    const src = stripComments(fs.readFileSync(file, 'utf8'));

    if (PURE_CONTROL_FILES.has(base)) {
      const sites = findForbiddenCallSites(src);
      for (const s of sites) {
        violations.push({ file: base, fn: '<module>', callee: s.name, line: null, reason: 'קובץ בקרות טהור — אסורה כל קריאה למנוע (F-06)' });
        edges.push({ file: base, fn: '<module>', callee: s.name, line: null });
      }
      continue;
    }

    const scopes = extractFunctionScopes(src);
    const sites = findForbiddenCallSites(src);
    for (const s of sites) {
      // ייחוס להיקף הפנימי ביותר שמכיל את הקריאה (לא לכל המקיפים — מונע דיווח כפול)
      let owner = null;
      for (const sc of scopes) {
        if (s.index >= sc.from && s.index < sc.to) {
          if (!owner || (sc.to - sc.from) < (owner.to - owner.from)) owner = sc;
        }
      }
      const fnName = owner ? owner.name : '<module>';
      const line = owner ? owner.line : null;
      edges.push({ file: base, fn: fnName, callee: s.name, line });
      const isGateway = GATEWAY_FILES.has(base);
      const isAppShellAllowed = (base === 'app-shell.js') && (fnName === 'onExplicitRetypeset' || fnName === 'onDocumentAction');
      if (isGateway || isAppShellAllowed) {
        allowed.push({ file: base, fn: fnName, callee: s.name });
      } else {
        violations.push({ file: base, fn: fnName, callee: s.name, line, reason: 'קריאה למנוע מחוץ לנתיב המפורש (⚡ / פעולת מסמך / שער ה־Worker)' });
      }
    }
  }
  return { files: files.map(f => path.basename(f)), edges, violations, allowed };
}

module.exports = { scanControlTriggers, FORBIDDEN, stripComments };
