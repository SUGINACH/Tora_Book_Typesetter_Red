// src/engine/decoration/assets-import.js — Media support + manifest-less folder import (REQ-ORN-07)
'use strict';

/**
 * תמיכת מדיה לשערים (wrapShaarMedia — פורט V4/combined) + ייבוא תיקיית נכסים
 * ללא מניפסט (V2 webkitdirectory) עם אימות נתיבים בטוח.
 *
 * **אבטחה (Spec §9.5):** כל נתיב יחסי עובר isPathSafe — נדחים מעברי־ספריות (`..`),
 * נתיבים מוחלטים, קווים אחוריים, בתי־אפס וסכמות URL. קובץ SVG עובר חיטוי
 * (svg-sanitize) לפני שמירה — לעולם לא מאוחסן כמו שהוא.
 */

const { sanitizeSvg } = require('./svg-sanitize');
const { extractSetNumber, detectRole } = require('./theme-sets');

/** סיומות מדיה נתמכות: SVG + JPG/PNG (REQ-ORN-07). */
const MEDIA_EXTENSIONS = ['svg', 'jpg', 'jpeg', 'png'];

function extensionOf(name) {
  const m = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

function acceptsMedia(fileName) {
  return MEDIA_EXTENSIONS.includes(extensionOf(fileName));
}

/**
 * wrapShaarMedia — עטיפה אחידה למדיה שאינה SVG: פריט שער עם media (dataURI/URL)
 * במקום svg. SVG עדיין עובר חיטוי ונשמר בשדה svg.
 * @returns {{ok:boolean, item?:object, reason?:string}}
 */
function wrapShaarMedia(fileName, content) {
  if (!acceptsMedia(fileName)) {
    return { ok: false, reason: `unsupported-media:${extensionOf(fileName) || 'none'}` };
  }
  const ext = extensionOf(fileName);
  const base = String(fileName).replace(/\.[a-z0-9]+$/i, '');
  if (ext === 'svg') {
    const clean = sanitizeSvg(content);
    if (!clean.ok) return { ok: false, reason: `svg-rejected:${clean.reason}` };
    return { ok: true, item: { name: base, svg: clean.svg, role: detectRole(base), setNo: extractSetNumber(base) } };
  }
  // JPG/PNG: dataURI אם ניתן בינארי/בסיסי, אחרת מזהה אטום להמשך חיבור בצד הדפדפן
  const isData = typeof content === 'string' && /^data:image\/(png|jpe?g);base64,/i.test(content);
  const item = {
    name: base,
    mediaType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    media: isData ? content : null, // null ⇒ הצרכן (UI) יצרף blob נפרד — לא נזנק, מתועד
    role: detectRole(base),
    setNo: extractSetNumber(base)
  };
  return { ok: true, item };
}

/**
 * אימות נתיב בטוח (בדיקת שער S8.2 — ניסיון path traversal נדחה):
 * - אסור: `..` בכל מקטע, נתיב מוחלט (`/``, `C:`), קו אחורי, בית־אפס, סכמת URL.
 * - מותר: תתי־ספריות רגילות (assets/1 שער ראשי.svg).
 */
function isPathSafe(relPath) {
  const s = String(relPath || '');
  if (!s) return false;
  if (s.includes('\0')) return false;
  if (/[\\]/.test(s)) return false; // קו אחורי — החלפת מפריד חשודה
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return false; // סכמת URL (file:, http:)
  if (s.startsWith('/')) return false; // נתיב מוחלט
  const segs = s.split('/');
  for (const seg of segs) {
    if (seg === '' || seg === '.' ) return false;
    if (seg === '..') return false; // מעבר ספרייה כלפי מעלה — נדחה
  }
  return true;
}

/**
 * ייבוא תיקיית נכסים ללא מניפסט (webkitdirectory): רשימת קבצים שטוחה
 * עם webkitRelativePath. מניפסט אופציונלי (assets_manifest.json) אם קיים.
 * @param {Array<{name:string, webkitRelativePath?:string, content:string}>} files
 * @returns {{themeItems:Array, rejected:Array<{file:string, reason:string}>, manifest:object|null}}
 */
function importAssetFolder(files) {
  const rejected = [];
  const themeItems = [];
  let manifest = null;

  for (const f of files || []) {
    const rel = f.webkitRelativePath || f.name;
    if (!isPathSafe(rel)) {
      rejected.push({ file: rel, reason: 'path-unsafe' });
      continue;
    }
    const base = String(f.name || rel.split('/').pop());
    if (base === 'assets_manifest.json') {
      try { manifest = JSON.parse(f.content); } catch { rejected.push({ file: rel, reason: 'manifest-unparseable' }); }
      continue;
    }
    if (!acceptsMedia(base)) {
      rejected.push({ file: rel, reason: 'unsupported-media' });
      continue;
    }
    const wrapped = wrapShaarMedia(base, f.content);
    if (!wrapped.ok) {
      rejected.push({ file: rel, reason: wrapped.reason });
      continue;
    }
    wrapped.item.path = rel;
    themeItems.push(wrapped.item);
  }

  return { themeItems, rejected, manifest };
}

module.exports = { MEDIA_EXTENSIONS, extensionOf, acceptsMedia, wrapShaarMedia, isPathSafe, importAssetFolder };
