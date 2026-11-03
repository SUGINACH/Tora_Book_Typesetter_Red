// src/engine/decoration/svg-sanitize.js — SVG sanitizer + CSP hook (S8.1 task 10; full pass S13)
'use strict';

/**
 * חיטוי SVG (Spec §9.5 "sanitized SVG"): רשימת־היתרים, לא רשימת־חסימות.
 * נשללים: <script>, <foreignObject>, תגי אנימציה עם לולאות (set/animate עם begin=never/indefinite
 * אינם סיכון גיאומטרי אך נשללים כאן בשל דטרמיניזם), מאפייני on*, javascript:, data:text/html,
 * והפניות חיצוניות (href/xlink:href למקור שאינו מקומי).
 *
 * מדיניות zero-randomness/דטרמיניזם: הפלט קבוע לקלט נתון.
 */

/** תגים מותרים (רשימת־היתרים). */
const ALLOWED_TAGS = new Set([
  'svg', 'g', 'defs', 'title', 'desc', 'path', 'rect', 'circle', 'ellipse', 'line',
  'polyline', 'polygon', 'text', 'tspan', 'linearGradient', 'radialGradient', 'stop',
  'clipPath', 'mask', 'pattern', 'use', 'symbol', 'image', 'marker', 'style'
]);

/** מאפיינים מותרים כללית (קידומות גם ב־xlink:). */
const ALLOWED_ATTRS = new Set([
  'id', 'class', 'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'width', 'height', 'transform', 'viewBox', 'fill', 'fill-opacity', 'fill-rule',
  'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin',
  'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'points', 'gradientUnits',
  'gradientTransform', 'offset', 'stop-color', 'stop-opacity', 'clip-path',
  'clip-rule', 'mask', 'clipPathUnits', 'patternUnits', 'preserveAspectRatio',
  'font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline',
  'dx', 'dy', 'rotate', 'textLength', 'lengthAdjust', 'xmlns', 'xmlns:xlink',
  'version', 'xml:space', 'style'
]);

/** @returns {{ok:boolean, svg:string, removed:string[], reason?:string}} */
function sanitizeSvg(svgText) {
  const src = String(svgText || '');
  if (!src.trim()) return { ok: false, svg: '', removed: [], reason: 'empty' };
  if (!/<svg[\s>]/i.test(src)) return { ok: false, svg: '', removed: [], reason: 'not-svg' };
  const removed = [];
  let out = src;

  // 1) שלילת בלוקים מסוכנים תחילה (תגים שלמים עם תוכנם) — לפני כל פירוק
  for (const tag of ['script', 'foreignobject', 'animate', 'animatetransform', 'animatemotion', 'set', 'handler', 'listener']) {
    const re = new RegExp(`<${tag}(\\s[^>]*)?>[\\s\\S]*?<\\/${tag}\\s*>|<${tag}(\\s[^>]*)?\\/>`, 'gi');
    out = out.replace(re, () => { removed.push(`tag:${tag}`); return ''; });
  }

  // 2) מעבר תג־תג: השמטת תגים שאינם ברשימת־ההיתרים (עם תוכנם ליחידים מסוכנים)
  out = out.replace(/<\/?([a-zA-Z:][-a-zA-Z0-9:_]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (whole, tag) => {
    const t = String(tag).toLowerCase();
    if (ALLOWED_TAGS.has(t)) return whole;
    removed.push(`tag:${t}`);
    return '';
  });

  // 3) מאפיינים: on*, javascript:, והפניות חיצוניות
  out = out.replace(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g, (whole, name, _q, dq, sq) => {
    const n = String(name).toLowerCase();
    const val = String(dq != null ? dq : sq);
    if (n.startsWith('on')) { removed.push(`attr:${n}`); return ''; }
    if (!ALLOWED_ATTRS.has(n) && !n.startsWith('xlink:')) { removed.push(`attr:${n}`); return ''; }
    const v = val.trim().toLowerCase();
    if (v.includes('javascript:') || v.includes('data:text/html') || v.startsWith('vbscript:')) {
      removed.push(`attr-url:${n}`);
      return '';
    }
    // href/xlink:href: מותרים רק עצמים פנימיים (#id) — אין מקורות חיצוניים
    if (n === 'href' || n === 'xlink:href') {
      if (!val.trim().startsWith('#')) { removed.push(`ext-ref:${n}`); return ''; }
    }
    return whole;
  });

  // 4) בלוקי <style>: הסרת url(...) חיצוניים ו־expression()
  out = out.replace(/<style([^>]*)>([\s\S]*?)<\/style\s*>/gi, (whole, attrs, css) => {
    if (/url\(\s*['"]?\s*(https?:|file:|\/\/)/i.test(css) || /expression\s*\(/i.test(css)) {
      removed.push('style:external-url');
      return '<style></style>';
    }
    return whole;
  });

  if (!/<svg[\s>]/i.test(out)) return { ok: false, svg: '', removed, reason: 'svg-stripped' };
  return { ok: true, svg: out, removed };
}

/**
 * CSP hook (S13 ישלים): מסמך CSP מומלץ להטמעת שערי SVG חיצוניים.
 * אין eval, אין מקורות חיצוניים; blob/data לתמונות בלבד.
 */
function svgCspDirective() {
  return "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; frame-src 'none'";
}

module.exports = { sanitizeSvg, svgCspDirective, ALLOWED_TAGS, ALLOWED_ATTRS };
