// src/engine/extensions/style-schema.js — Custom Text Styles schema + validation (S11.1-1, REQ-PAR-06)
'use strict';

/**
 * חוזה סגנונות מותאמים (REQ-PAR-06): trigger (linePrefix/inlineMarker/pattern/combinator
 * AND/OR), layoutMode ∈ {regular, full-width, side-note, footnote, endnote, new-location},
 * style מלא, counterReset, linkedOrnaments.
 *
 * **אימות עם שגיאות עבריות קריאות־לאדם** (§8.3: "הודעות שגיאה מובנות") — כל שגיאה:
 * {code, path, styleId, message} כאשר message הוא משפט עברי מלא המציין מה בדיוק
 * לא תקין ומה התקין. אין שגיאות כלליות מהסוג "invalid JSON".
 *
 * דטרמיניזם: אין Date/Math.random; סדר האימות קבוע; הודעות קבועות.
 */

const LAYOUT_MODES = ['regular', 'full-width', 'side-note', 'footnote', 'endnote', 'new-location'];
const ORNAMENTS = ['pyramid', 'lance', 'shoshanta', 'scroll'];
const COUNTER_FORMATS = ['hebrew-geresh', 'decimal'];
const COUNTER_RESETS = ['part', 'page', 'never'];
const STYLE_PROPS = [
  'fontName', 'fontSizePt', 'bold', 'italic', 'color', 'background',
  'border', 'indentEm', 'align', 'letterSpacingEm', 'textTransform'
];
const ALIGNS = ['right', 'center', 'left', 'stretch'];
const TRANSFORMS = ['none', 'small-caps'];

/** תווית עברית לשדה — משמשת את הודעות השגיאה ואת חיפוש ההרחבות. */
const FIELD_LABELS = {
  id: 'מזהה', name: 'שם', trigger: 'טריגר', layoutMode: 'מצב פריסה', style: 'סגנון',
  counter: 'מונה', linkedOrnaments: 'עיטורים מקושרים'
};

function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

/**
 * אימות טריגר בודד (רקורסיבי לקומבינטור). טריגר תקין = בדיוק אחד מ:
 * linePrefix | inlineMarker | pattern | combinator.
 * @returns {boolean} ok
 */
function validateTrigger(tr, styleId, errors, path) {
  if (tr == null) {
    errors.push({ code: 'trigger-empty', path, styleId, message: `הסגנון «${styleId}» אינו מגדיר טריגר — חובה אחד מ: linePrefix, inlineMarker, pattern או combinator.` });
    return false;
  }
  if (!isPlainObject(tr)) {
    errors.push({ code: 'trigger-not-object', path, styleId, message: `הטריגר של הסגנון «${styleId}» חייב להיות אובייקט, לא ${Array.isArray(tr) ? 'מערך' : typeof tr}.` });
    return false;
  }
  const has = (k) => Object.prototype.hasOwnProperty.call(tr, k);
  const leaves = ['linePrefix', 'inlineMarker', 'pattern'].filter(has);
  const isComb = has('combinator');
  const given = leaves.length + (isComb ? 1 : 0);
  if (given > 1) {
    errors.push({ code: 'trigger-ambiguous', path, styleId, message: `הסגנון «${styleId}» מגדיר ${given} טריגרים עץ־בעץ — חובה בדיוק אחד (לשילוב תנאים השתמש ב־combinator).` });
    return false;
  }
  if (isComb) {
    const c = tr.combinator;
    if (!isPlainObject(c) || !['AND', 'OR'].includes(c.op)) {
      errors.push({ code: 'combinator-bad-op', path: `${path}.combinator.op`, styleId, message: `בסגנון «${styleId}»: op של combinator חייב להיות AND או OR (קיבל ${JSON.stringify(c && c.op)}).` });
      return false;
    }
    if (!Array.isArray(c.conditions) || c.conditions.length < 2) {
      errors.push({ code: 'combinator-few-conditions', path: `${path}.combinator.conditions`, styleId, message: `בסגנון «${styleId}»: ל־combinator ${c.op} דרושים לפחות שני תנאים (קיבל ${Array.isArray(c.conditions) ? c.conditions.length : 0}).` });
      return false;
    }
    let ok = true;
    for (let i = 0; i < c.conditions.length; i++) {
      ok = validateTrigger(c.conditions[i], styleId, errors, `${path}.combinator.conditions[${i}]`) && ok;
    }
    return ok;
  }
  if (has('linePrefix')) {
    const v = tr.linePrefix;
    if (typeof v !== 'string' || !v.trim()) {
      errors.push({ code: 'linePrefix-bad', path: `${path}.linePrefix`, styleId, message: `בסגנון «${styleId}»: linePrefix חייב להיות מחרוזת לא ריקה (למשל "צד:").` });
      return false;
    }
    return true;
  }
  if (has('inlineMarker')) {
    const m = tr.inlineMarker;
    // **S11 (§8 "כל סוגי הטקסט נתונים לבחירת המשתמש"):** מפריד סימטרי (open === close,
    // כמו ~…~ או *…*) חוקי — הזיווג במחסנית מבחין פתיחה/סגירה לפי סדר ההופעה.
    if (!isPlainObject(m) || typeof m.open !== 'string' || typeof m.close !== 'string' || !m.open || !m.close) {
      errors.push({ code: 'inlineMarker-bad', path: `${path}.inlineMarker`, styleId, message: `בסגנון «${styleId}»: inlineMarker חייב לכלול open ו־close — שתי מחרוזות לא ריקות (זהות או שונות; למשל open:"«", close:"»" או שניהם "~").` });
      return false;
    }
    return true;
  }
  // pattern
  const p = tr.pattern;
  if (typeof p !== 'string' || !p) {
    errors.push({ code: 'pattern-bad', path: `${path}.pattern`, styleId, message: `בסגנון «${styleId}»: pattern חייב להיות מחרוזת של ביטוי־רגולרי לא ריקה.` });
    return false;
  }
  try { new RegExp(p); } catch (e) {
    errors.push({ code: 'pattern-invalid', path: `${path}.pattern`, styleId, message: `בסגנון «${styleId}»: הביטוי «${p}» אינו תקין — ${e.message}.` });
    return false;
  }
  return true;
}

function validateStyle(st, styleId, errors, path) {
  if (!isPlainObject(st)) {
    errors.push({ code: 'style-not-object', path, styleId, message: `הסגנון החזותי של «${styleId}» חייב להיות אובייקט (fontSizePt, bold, color וכו').` });
    return false;
  }
  let ok = true;
  for (const k of Object.keys(st)) {
    if (!STYLE_PROPS.includes(k)) {
      errors.push({ code: 'style-unknown-prop', path: `${path}.${k}`, styleId, message: `בסגנון «${styleId}»: המאפיין «${k}» אינו מוכר. המאפיינים החוקיים: ${STYLE_PROPS.join(', ')}.` });
      ok = false;
    }
  }
  if ('fontSizePt' in st && !(Number(st.fontSizePt) >= 6 && Number(st.fontSizePt) <= 48)) {
    errors.push({ code: 'style-bad-size', path: `${path}.fontSizePt`, styleId, message: `בסגנון «${styleId}»: גודל גופן חייב להיות בטווח 6–48 (קיבל ${JSON.stringify(st.fontSizePt)}).` });
    ok = false;
  }
  if ('color' in st && !/^#[0-9a-fA-F]{3,8}$/.test(String(st.color))) {
    errors.push({ code: 'style-bad-color', path: `${path}.color`, styleId, message: `בסגנון «${styleId}»: צבע חייב להיות הקסדצימלי כמו #1a1a1a (קיבל ${JSON.stringify(st.color)}).` });
    ok = false;
  }
  if ('background' in st && !/^#[0-9a-fA-F]{3,8}$/.test(String(st.background))) {
    errors.push({ code: 'style-bad-background', path: `${path}.background`, styleId, message: `בסגנון «${styleId}»: רקע חייב להיות הקסדצימלי (קיבל ${JSON.stringify(st.background)}).` });
    ok = false;
  }
  if ('align' in st && !ALIGNS.includes(st.align)) {
    errors.push({ code: 'style-bad-align', path: `${path}.align`, styleId, message: `בסגנון «${styleId}»: יישור חייב להיות אחד מ ${ALIGNS.join(', ')} (קיבל ${JSON.stringify(st.align)}).` });
    ok = false;
  }
  if ('textTransform' in st && !TRANSFORMS.includes(st.textTransform)) {
    errors.push({ code: 'style-bad-transform', path: `${path}.textTransform`, styleId, message: `בסגנון «${styleId}»: textTransform חייב להיות none או small-caps.` });
    ok = false;
  }
  for (const k of ['bold', 'italic']) {
    if (k in st && typeof st[k] !== 'boolean') {
      errors.push({ code: 'style-bad-bool', path: `${path}.${k}`, styleId, message: `בסגנון «${styleId}»: ${k} חייב להיות true/false.` });
      ok = false;
    }
  }
  return ok;
}

function validateCounter(ct, styleId, errors, path) {
  if (ct == null) return true; // אין מונה — תקין
  if (!isPlainObject(ct)) {
    errors.push({ code: 'counter-not-object', path, styleId, message: `המונה של «${styleId}» חייב להיות אובייקט {enabled, format, reset}.` });
    return false;
  }
  let ok = true;
  if ('format' in ct && !COUNTER_FORMATS.includes(ct.format)) {
    errors.push({ code: 'counter-bad-format', path: `${path}.format`, styleId, message: `בסגנון «${styleId}»: תבנית מונה חייבת להיות hebrew-geresh או decimal (קיבל ${JSON.stringify(ct.format)}).` });
    ok = false;
  }
  if ('reset' in ct && !COUNTER_RESETS.includes(ct.reset)) {
    errors.push({ code: 'counter-bad-reset', path: `${path}.reset`, styleId, message: `בסגנון «${styleId}»: מדיניות איפוס חייבת להיות part, page או never (קיבל ${JSON.stringify(ct.reset)}).` });
    ok = false;
  }
  if ('enabled' in ct && typeof ct.enabled !== 'boolean') {
    errors.push({ code: 'counter-bad-enabled', path: `${path}.enabled`, styleId, message: `בסגנון «${styleId}»: enabled חייב להיות true/false.` });
    ok = false;
  }
  return ok;
}

function validateOrnaments(lo, styleId, errors, path) {
  if (lo == null) return true;
  if (!isPlainObject(lo)) {
    errors.push({ code: 'ornaments-not-object', path, styleId, message: `העיטורים המקושרים של «${styleId}» חייבים להיות אובייקט {top, bottom}.` });
    return false;
  }
  let ok = true;
  for (const k of Object.keys(lo)) {
    if (!['top', 'bottom'].includes(k)) {
      errors.push({ code: 'ornament-unknown-slot', path: `${path}.${k}`, styleId, message: `בסגנון «${styleId}»: חריץ עיטור חייב להיות top או bottom (קיבל «${k}»).` });
      ok = false;
    } else if (lo[k] !== null && !ORNAMENTS.includes(lo[k])) {
      errors.push({ code: 'ornament-unknown-kind', path: `${path}.${k}`, styleId, message: `בסגנון «${styleId}»: סוג עיטור חייב להיות אחד מ ${ORNAMENTS.join(', ')} (קיבל ${JSON.stringify(lo[k])}).` });
      ok = false;
    }
  }
  return ok;
}

/**
 * פענוח + אימות רשימת סגנונות מותאמים.
 * @param {string|object} json — מערך, או {styles:[...]}
 * @returns {{ok:boolean, styles:Array, errors:Array}} — styles מנורמלים (defaults מלאים)
 */
function parseCustomStyles(json) {
  let raw;
  try {
    raw = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (e) {
    return { ok: false, styles: [], errors: [{ code: 'unparseable-json', path: '$', styleId: null, message: `הקובץ אינו JSON תקין — ${e.message}. כדאי לבדוק פסיקים ומרכאות כפולות.` }] };
  }
  const list = Array.isArray(raw) ? raw : (isPlainObject(raw) && Array.isArray(raw.styles) ? raw.styles : null);
  if (!list) {
    return { ok: false, styles: [], errors: [{ code: 'bad-shape', path: '$', styleId: null, message: 'קובץ הסגנונות חייב להיות מערך, או אובייקט עם שדה styles (למשל {"styles":[...]}).' }] };
  }
  const errors = [];
  const seenIds = new Set();
  const styles = [];
  list.forEach((d, i) => {
    const where = `styles[${i}]`;
    if (!isPlainObject(d)) {
      errors.push({ code: 'style-not-object', path: where, styleId: null, message: `הסגנון במקום ${i} אינו אובייקט — נדחה.` });
      return;
    }
    const id = typeof d.id === 'string' && d.id.trim() ? d.id.trim() : null;
    if (!id) {
      errors.push({ code: 'missing-id', path: `${where}.id`, styleId: null, message: `לסגנון במקום ${i} חסר מזהה (id) — חובה שם ייחודי כמו "quote".` });
      return;
    }
    if (seenIds.has(id)) {
      errors.push({ code: 'duplicate-id', path: `${where}.id`, styleId: id, message: `מזהה הסגנון «${id}» מופיע פעמיים — מזהים חייבים להיות ייחודיים.` });
      return;
    }
    seenIds.add(id);
    let ok = true;
    ok = validateTrigger(d.trigger, id, errors, `${where}.trigger`) && ok;
    const layoutMode = d.layoutMode || 'regular';
    if (!LAYOUT_MODES.includes(layoutMode)) {
      errors.push({ code: 'bad-layout-mode', path: `${where}.layoutMode`, styleId: id, message: `בסגנון «${id}»: מצב פריסה חייב להיות אחד מ ${LAYOUT_MODES.join(', ')} (קיבל ${JSON.stringify(d.layoutMode)}).` });
      ok = false;
    }
    if ('style' in d) ok = validateStyle(d.style, id, errors, `${where}.style`) && ok;
    ok = validateCounter(d.counter, id, errors, `${where}.counter`) && ok;
    ok = validateOrnaments(d.linkedOrnaments, id, errors, `${where}.linkedOrnaments`) && ok;
    if (!ok) return; // סגנון פגום — לא נכנס לרשימה (הודעותיו כבר נרשמו)
    styles.push({
      id,
      name: typeof d.name === 'string' && d.name.trim() ? d.name.trim() : id,
      trigger: d.trigger,
      layoutMode,
      style: d.style || {},
      counter: d.counter && d.counter.enabled ? {
        enabled: true,
        format: d.counter.format || 'decimal',
        reset: d.counter.reset || 'never'
      } : null,
      linkedOrnaments: d.linkedOrnaments || null
    });
  });
  return { ok: errors.length === 0, styles, errors };
}

/**
 * אימות רשימת תמונות מוטמעות (embedded images §8.3). src חייב data: URI —
 * offline-guard: הפניית http(s) חיצונית נדחית עם הודעה עברית (Orange exit-7 doctrine).
 */
function validateImages(list) {
  const errors = [];
  const images = [];
  if (!Array.isArray(list)) return { ok: true, images, errors };
  const seenIds = new Set();
  list.forEach((im, i) => {
    const where = `images[${i}]`;
    if (!isPlainObject(im) || typeof im.id !== 'string' || !im.id.trim()) {
      errors.push({ code: 'image-missing-id', path: where, styleId: null, message: `לתמונה במקום ${i} חסר מזהה (id) — נדחתה.` });
      return;
    }
    if (seenIds.has(im.id)) {
      errors.push({ code: 'image-duplicate-id', path: `${where}.id`, styleId: im.id, message: `מזהה התמונה «${im.id}» מופיע פעמיים.` });
      return;
    }
    seenIds.add(im.id);
    const src = typeof im.src === 'string' ? im.src : '';
    if (!src) {
      errors.push({ code: 'image-missing-src', path: `${where}.src`, styleId: im.id, message: `לתמונה «${im.id}» חסר מקור (src).` });
      return;
    }
    if (/^https?:\/\//i.test(src)) {
      errors.push({ code: 'image-external-src', path: `${where}.src`, styleId: im.id, message: `התמונה «${im.id}» מפנה לכתובת חיצונית — אסור (מנוע אופליין). יש להטמיע תמונות כ־data: URI בלבד.` });
      return;
    }
    if (!src.startsWith('data:')) {
      errors.push({ code: 'image-bad-src', path: `${where}.src`, styleId: im.id, message: `מקור התמונה «${im.id}» חייב להתחיל ב־data: (קיבל «${src.slice(0, 24)}…»).` });
      return;
    }
    const w = Number(im.w), h = Number(im.h);
    if (!(w > 0 && h > 0)) {
      errors.push({ code: 'image-bad-dims', path: where, styleId: im.id, message: `לתמונה «${im.id}» חסרים ממדים תקינים (w/h חיוביים במ״מ).` });
      return;
    }
    images.push({ id: im.id, src, w, h, alt: typeof im.alt === 'string' ? im.alt : '' });
  });
  return { ok: errors.length === 0, images, errors };
}

module.exports = {
  LAYOUT_MODES, ORNAMENTS, STYLE_PROPS, FIELD_LABELS,
  parseCustomStyles, validateImages
};
