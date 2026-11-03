// src/engine/decoration/custom-pages.js — PT-09 custom page types: JSON parse + geometry (S8.1 task 9)
'use strict';

/**
 * עמודים מותאמים אישית (PT-09): JSON עם רקע/תיבות/תמונות/מיקום קבוע.
 * מיקום: לפני/אחרי שער ראשי, לפני/אחרי חלק (מספר), או בסוף המסמך.
 * "האם נספר" — דגל counted לכל עמוד.
 *
 * תוכן קבוע = טקסט חופשי בתיבות (לא עובר טוקניזציה — אינו חלק מזרימת הגוף;
 * לכן אינו נספר בשימור התוכן — מתועד בפירוש).
 */

const { MM_TO_PX } = require('../layout/page-templates');

/** מקומות הצבה חוקיים. */
const POSITIONS = ['before-shaar-main', 'after-shaar-main', 'before-part', 'after-part', 'end'];

/**
 * פענוח ואימות הגדרות עמודים מותאמים.
 * @param {string|object} json - או מערך הגדרות, או {pages:[...]}
 * @returns {{ok:boolean, pages:Array, errors:Array}}
 */
function parseCustomPageTypes(json) {
  let raw;
  try {
    raw = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (e) {
    return { ok: false, pages: [], errors: [`unparseable-json:${e.message}`] };
  }
  const defs = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.pages) ? raw.pages : null);
  if (!defs) return { ok: false, pages: [], errors: ['expected-array-or-{pages}'] };

  const errors = [];
  const seenIds = new Set();
  const pages = [];
  defs.forEach((d, i) => {
    const where = `#${i}`;
    if (!d || typeof d !== 'object') { errors.push(`${where}:not-an-object`); return; }
    const id = String(d.id || `custom-${i + 1}`);
    if (seenIds.has(id)) { errors.push(`${where}:duplicate-id:${id}`); return; } // ייחודיות id — כפילים נדחים (שיעור packer)
    seenIds.add(id);
    const pos = d.position || 'end';
    const at = String(pos.at || pos || 'end');
    if (!POSITIONS.includes(at)) { errors.push(`${where}:bad-position:${at}`); return; }
    let part = null;
    if ((at === 'before-part' || at === 'after-part')) {
      part = Number(pos.part != null ? pos.part : d.part);
      if (!Number.isInteger(part) || part < 1) { errors.push(`${where}:bad-part-number`); return; }
    }
    const boxes = Array.isArray(d.boxes) ? d.boxes.filter(b => b && Number.isFinite(Number(b.x)) && Number.isFinite(Number(b.y))
      && Number.isFinite(Number(b.w)) && Number.isFinite(Number(b.h))) : [];
    if (Array.isArray(d.boxes) && d.boxes.length !== boxes.length) {
      errors.push(`${where}:boxes-invalid-dropped:${d.boxes.length - boxes.length}`);
    }
    const images = Array.isArray(d.images) ? d.images.filter(im => im && im.src && Number.isFinite(Number(im.x)) && Number.isFinite(Number(im.y))
      && Number.isFinite(Number(im.w)) && Number.isFinite(Number(im.h))) : [];
    if (Array.isArray(d.images) && d.images.length !== images.length) {
      errors.push(`${where}:images-invalid-dropped:${d.images.length - images.length}`);
    }
    pages.push({
      id, type: 'custom',
      name: typeof d.name === 'string' && d.name.trim() ? d.name.trim() : null, // **S11 (§8.3):** כותרת קריאה לאדם (תקציר שיתוף/רשימת UI)
      position: { at: at, part },
      counted: d.counted !== false, // ברירת מחדל: נספר (PT-09)
      background: typeof d.background === 'string' ? d.background : null,
      boxes: boxes.map(b => ({ text: String(b.text || ''), x: Number(b.x), y: Number(b.y), w: Number(b.w), h: Number(b.h) })),
      images: images.map(im => ({ src: String(im.src), x: Number(im.x), y: Number(im.y), w: Number(im.w), h: Number(im.h) }))
    });
  });

  return { ok: errors.length === 0, pages, errors };
}

/**
 * מיקום העמודים המותאמים ברצף המסמך: מחזיר עמודים להכנסה לפי נקודות עיגון.
 * @param {Array} customDefs - תוצר parseCustomPageTypes().pages
 * @param {{partsCount:number, hasShaarMain:boolean}} docStructure
 * @returns {{start:Array, beforePart:Map<number,Array>, afterPart:Map<number,Array>, end:Array}}
 */
function planCustomPages(customDefs, docStructure) {
  const out = { start: [], beforePart: new Map(), afterPart: new Map(), end: [] };
  for (const d of customDefs || []) {
    switch (d.position.at) {
      // **S11 (תיקון שער 5):** לפני השער הראשי — וגם כשאין שער כזה (בלי ערכת נושא):
      // העמוד המותאם פותח את המסמך, לפני הפתיחה/התוכן. הסרת התניה מגדירה את
      // ההתנהגות המובטחת בשער: "עמוד לוגו לפני הפתיחה מוצב ונספר" גם במסמכים
      // צנועים בלי שער־ערכת (העיגון המבני היחיד שקיים תמיד הוא ראש המסמך).
      case 'before-shaar-main': out.start.push(d); break;
      case 'after-shaar-main': out.start.push(d); break; // אחרי שער ראשי/בראש המסמך אם אין
      case 'before-part': {
        const k = d.position.part;
        if (k <= (docStructure.partsCount || 0)) {
          if (!out.beforePart.has(k)) out.beforePart.set(k, []);
          out.beforePart.get(k).push(d);
        }
        break;
      }
      case 'after-part': {
        const k = d.position.part;
        if (!out.afterPart.has(k)) out.afterPart.set(k, []);
        out.afterPart.get(k).push(d);
        break;
      }
      case 'end': out.end.push(d); break;
    }
  }
  return out;
}

/**
 * גיאומטריית עמוד מותאם: תיבות ותמונות במ"מ → פיקסלים (mm × MM_TO_PX).
 * תוכן קבוע; אין טורים; counted לפי ההגדרה.
 */
function buildCustomPageGeometry(def, settings) {
  void settings;
  return {
    type: 'custom',
    customId: def.id,
    counted: def.counted !== false,
    background: def.background || null,
    boxes: (def.boxes || []).map(b => ({
      text: b.text, x: Math.round(b.x * MM_TO_PX), y: Math.round(b.y * MM_TO_PX),
      w: Math.round(b.w * MM_TO_PX), h: Math.round(b.h * MM_TO_PX)
    })),
    images: (def.images || []).map(im => ({
      src: im.src, x: Math.round(im.x * MM_TO_PX), y: Math.round(im.y * MM_TO_PX),
      w: Math.round(im.w * MM_TO_PX), h: Math.round(im.h * MM_TO_PX)
    }))
  };
}

module.exports = { POSITIONS, parseCustomPageTypes, planCustomPages, buildCustomPageGeometry };
