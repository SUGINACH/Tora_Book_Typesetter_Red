// src/audit/scanners.js — Anti‑patcha scanners: dead-control / phantom-key / orphan-mechanism (S4.1.4, REQ-GOV-05)
'use strict';

const { registry } = require('../engine/core/settings-registry');
const fs = require('fs');
const path = require('path');

/**
 * תיקון S4.1.4: מציאת צרכנים גם בכתיב דינמי — template literal או concat:
 *   settings[\`toc-level-\${lvl}-show\`]  →  גוף התבנית 'toc-level-' … '-show'
 * נבנה רשימת תבניות מתוך כל ה־src, וכל key שנמצא בתוך קטע `settings[...]`
 * (כולל ביטויים מורכבים בתוך הסוגריים) נחשב נצרך.
 */
function collectDynamicPatterns(allSrc) {
  // תפוס כל settings[ ... ] כולל nested brackets ע"י ספירת סוגריים
  const slices = [];
  for (const src of allSrc) {
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
  }
  return slices;
}

function matchesDynamic(keyId, dynamicSlices) {
  for (const slice of dynamicSlices) {
    if (!slice.includes('$')) continue; // רק תבניות דינמיות
    // חלוקת הגוף לגזרות קבועות סביב ${...}: "toc-level-" + expr + "-show"
    const parts = slice.split(/\$\{[^}]*\}/g).map(s => s.replace(/[`'"]/g, '').trim()).filter(Boolean);
    if (!parts.length) continue;
    // כל הגזרות הקבועות חייבות להופיע בזהות ובסדר בתוך שם ה‑key
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
 * סורקים כ‑CI job קבוע. מודעות ל‑dynamic ids: צרכן שנכתב `prefix + '-w'` נחשב מודפס אם
 * ה‑prefix מופיע כ־template literal/concat ב‑src.
 * @param {string} srcRoot - נתיב שורש src
 */
function scanConsumers(srcRoot) {
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js')) files.push(p);
    }
  })(srcRoot);
  const all = files.map(f => ({ f, src: fs.readFileSync(f, 'utf8') }));
  const dynamicSlices = collectDynamicPatterns(all.map(a => a.src));

  const results = { deadControls: [], phantomKeys: [], orphanMechanisms: [] };
  const mechanismUse = new Map(); // consumer module id -> used?

  for (const r of registry) {
    // A key is "consumed" if settings['id'] / settings["id"] appears literally,
    // OR matches a dynamic template settings[`prefix${expr}suffix`] (S4.1.4 fix)
    const quoted = [`'${r.id}'`, `"${r.id}"`, `\`${r.id}\``];
    const consumedBy = all.filter(({ src }) => quoted.some(q => src.includes(q)));
    const dynHit = !consumedBy.length && matchesDynamic(r.id, dynamicSlices);
    if (!consumedBy.length && !dynHit) results.phantomKeys.push({ id: r.id, reason: 'no source reference to this key string (literal or dynamic)' });
    for (const c of r.consumers || []) {
      if (!mechanismUse.has(c)) mechanismUse.set(c, false);
      // consumer module file exists?
      const modPath = path.join(srcRoot, 'engine', c + '.js');
      if (!fs.existsSync(modPath)) results.orphanMechanisms.push({ id: r.id, consumer: c, reason: 'consumer module missing' });
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

module.exports = { scanConsumers };
