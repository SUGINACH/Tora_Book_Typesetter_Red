// src/audit/scanners.js — Anti‑patcha scanners: dead-control / phantom-key / orphan-mechanism (S4.1.4, REQ-GOV-05)
'use strict';

const { registry } = require('../engine/core/settings-registry');
const fs = require('fs');
const path = require('path');

/**
 * **תיקון P0-5:** בעבר הסורק חיפש את מחרוזת המפתח בכל קובצי המקור, כולל קובץ
 * הרישום עצמו (settings-registry.js) — שמכיל את כל מזהי המפתחות כמחרוזות
 * מפורשות K(id, ...). לכן כל מפתח נחשב "נצרך" מעצם הגדרתו והסריקה לא יכלה
 * להיכשל לעולם — שער ירוק־שקרי מבני.
 * כעת: (1) קובץ הרישום מוחרג מהיקף הסריקה; (2) צריכה = גישה אמיתית
 * settings[...] (מילולית או דינמית) בקובץ אחר — אזכור בתגובה/מחרוזת בדיקה
 * אינו נחשב.
 */

/** קבצים שאסור לספור אותם כ"צרכנים" — מגדירים את הרישום עצמו. */
const REGISTRY_FILES = new Set(['settings-registry.js']);

/** איסוף כל קטעי הגישה settings[ ... ] (כולל סוגריים מקוננים) מקובץ מקור. */
function collectAccessSlices(src) {
  const slices = [];
  let i = 0;
  while ((i = src.indexOf('settings[', i)) !== -1) {
    const start = i + 'settings['.length;
    let depth = 1, j = start;
    while (j < src.length && depth > 0) {
      if (src[j] === '[') depth++;
      else if (src[j] === ']') depth--;
      j++;
    }
    slices.push(src.slice(start, j - 1));
    i = start;
  }
  return slices;
}

/** תבניות דינמיות: `toc-level-${lvl}-show` ⇒ גזרות קבועות סביב ${...}. */
function matchesDynamic(keyId, dynamicSlices) {
  for (const slice of dynamicSlices) {
    if (!slice.includes('$')) continue;
    const parts = slice.split(/\$\{[^}]*\}/g).map(s => s.replace(/[`'"]/g, '').trim()).filter(Boolean);
    if (!parts.length) continue;
    let at = 0, ok = true;
    for (const p of parts) {
      const idx = keyId.indexOf(p, at);
      if (idx === -1) { ok = false; break; }
      at = idx + p.length;
    }
    if (ok) return true;
  }
  return false;
}

/**
 * סורקים כ‑CI job קבוע.
 * @param {string} srcRoot - נתיב שורש src
 * @returns {{deadControls:Array, phantomKeys:Array, orphanMechanisms:Array, consumedBy:Map}}
 */
function scanConsumers(srcRoot) {
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js')) files.push(p);
    }
  })(srcRoot);

  // כל הקבצים למעט קובץ הרישום עצמו — רק אלה יכולים להיות "צרכנים" (P0-5)
  const consumers = files.filter(f => !REGISTRY_FILES.has(path.basename(f)));
  const all = consumers.map(f => ({ f, src: fs.readFileSync(f, 'utf8') }));

  // פרוסות גישה מילוליות + דינמיות, לפי קובץ
  const access = all.map(({ f, src }) => ({ f, slices: collectAccessSlices(src) }));
  const dynamicSlices = access.flatMap(a => a.slices).filter(s => s.includes('$'));

  const results = { deadControls: [], phantomKeys: [], orphanMechanisms: [], consumedBy: new Map() };
  const mechanismUse = new Map();

  for (const r of registry) {
    // צריכה אמיתית: גישה settings['id'] מילולית בקובץ צרכן (הפרוסה עם המרכאות
    // שווה למזהה בלי המרכאות), או התאמת תבנית דינמית
    const litFiles = access
      .filter(a => a.slices.some(s => s.replace(/['"`]/g, '') === r.id))
      .map(a => a.f);
    const dynHit = litFiles.length === 0 && matchesDynamic(r.id, dynamicSlices);
    const consumed = litFiles.length > 0 || dynHit;
    results.consumedBy.set(r.id, consumed ? (litFiles.length ? litFiles : ['<dynamic>']) : []);
    if (!consumed) {
      results.phantomKeys.push({ id: r.id, reason: 'no real settings[...] access outside the registry file (literal or dynamic)' });
    }
    for (const c of r.consumers || []) {
      if (!mechanismUse.has(c)) mechanismUse.set(c, false);
      const modPath = path.join(srcRoot, 'engine', c + '.js');
      if (!fs.existsSync(modPath) && !fs.existsSync(path.join(srcRoot, c + '.js'))) {
        results.orphanMechanisms.push({ id: r.id, consumer: c, reason: 'consumer module missing on disk' });
      }
    }
  }

  // dead controls: control id must appear in some UI html/js binding
  const uiFiles = all.filter(({ f }) => f.includes(path.sep + 'ui' + path.sep)).map(a => a.src).join('\n');
  const anyHtml = files.filter(f => f.endsWith('.html')).map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const bindSources = uiFiles + '\n' + anyHtml;
  for (const r of registry) {
    if (bindSources && !bindSources.includes(r.control)) {
      results.deadControls.push({ id: r.id, control: r.control, reason: 'control id not found in UI bindings (UI may not be built yet)' });
    }
  }

  return results;
}

module.exports = { scanConsumers, REGISTRY_FILES };
