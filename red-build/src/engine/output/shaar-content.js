// src/engine/output/shaar-content.js — מודל תוכן עמודי השער (03.11(ד))
'use strict';

/**
 * **מקור יחיד (F-09) לתוכן המובנה של עמודי השער** — פורט renderMainShaar/
 * renderSubShaar/renderBackShaar של הפרויקט המקורי. נצרך על ידי שני הנתיבים:
 * dom-renderer (תצוגה חיה + ייצוא HTML) ו-geometry-projector (ייצוא PDF) —
 * כך שהשער נראה אותו דבר בכל הפלטים (עד כאן ההיטל לא כלל את תוכן השער
 * וה־PDF הראה עמודים ריקים).
 *
 * המודל: תיבה (מ"מ של המקור) + רשימת בלוקים (טקסט/גודל/משקל) + אופן פריסה:
 * 'between' = flex space-between (שער ראשי: בס״ד למעלה, שנה למטה), 'center'
 * = flex ממורכז (שער־משנה/אחורי). העיטור (כתר) הוא בלוק גרפי ללא טקסט —
 * ה-DOM מצייר אותו; ההיטל מדלג (במקור לא היה ייצוא PDF כלל).
 */

const MM_TO_PX = 96 / 25.4;

/** תיבת השער לפי הסוג — מיקומי המקור (מ"מ → פיקסלים). */
function shaarBoxOf(type) {
  const mm = (v) => Math.round(v * MM_TO_PX);
  if (type === 'shaar-main') {
    return { top: mm(20), bottom: mm(16), right: mm(15), left: mm(15), mode: 'between' };
  }
  if (type === 'shaar-sub') {
    return { top: mm(20), bottom: mm(20), right: mm(95), left: mm(15), mode: 'center' };
  }
  // shaar-back
  return { top: mm(22), bottom: mm(18), right: mm(15), left: mm(95), mode: 'center' };
}

/** פיצול מקף של כותרת חלק (renderSubShaar המקורי): main=לפני, sub=אחרי. */
function splitPartTitle(text) {
  let titleMain = String(text || '');
  let titleSub = '';
  if (/[-–—]/.test(titleMain)) {
    const parts = titleMain.split(/[-–—]/);
    titleMain = parts[0].trim();
    titleSub = parts.slice(1).join(' - ').trim();
  }
  return { titleMain, titleSub };
}

/**
 * בניית בלוקי תוכן השער. גישה מילולית להגדרות (דרישת סורק ה-phantom-key).
 * @param {object} page - עמוד CP5 (shaarInfo.title לשער־משנה, _metadata למטא)
 * @param {object} settings
 * @param {object} [metadata] - מטא המסמך (גובר _metadata)
 * @returns {{mode:string, box:object, blocks:Array<{cls,text,sizePt,bold,graphic}>}|null}
 */
function buildShaarBlocks(page, settings, metadata) {
  if (!page || !page.type || !/^shaar-/.test(page.type)) return null;
  const meta = metadata || page._metadata || {};
  const bookTitle = settings['imud-book-title'] || meta['שם הספר'] || meta['ספר'] || meta['title'] || 'שם הספר';
  const subtitle = settings['imud-book-subtitle'] || meta['נושא'] || '';
  const desc = settings['imud-book-desc'] || meta['נושא מפורט'] || '';
  const sections = settings['imud-book-sections'] || meta['פרטי מהדורא'] || '';
  const author = settings['imud-book-author'] || meta['שם המחבר'] || '';
  const year = settings['imud-book-year'] || meta['מקום ושנת הוצאה'] || '';
  const backRaw = settings['shaar-back-text'] || meta['שמירת זכויות'] || 'כל הזכויות שמורות למחבר.';

  const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 12; };
  const box = shaarBoxOf(page.type);
  const B = [];

  if (page.type === 'shaar-main') {
    B.push({ cls: 'bsd-header', text: 'בס״ד', sizePt: num(settings['shaar-year-size-pt']), bold: true, letterSpacingPx: 5 });
    B.push({ cls: 'book-title-main', text: bookTitle, sizePt: num(settings['shaar-title-size-pt']) });
    B.push({ cls: 'book-subtitle', text: subtitle, sizePt: num(settings['shaar-subtitle-size-pt']), bold: true });
    B.push({ cls: 'shaar-crown', text: '', sizePt: 0, graphic: 'crown-main' });
    B.push({ cls: 'book-description', text: desc, sizePt: num(settings['shaar-desc-size-pt']) });
    B.push({ cls: 'book-sections-summary', text: sections, sizePt: num(settings['shaar-sections-size-pt']), bold: true });
    B.push({ cls: 'author-block', text: author, sizePt: num(settings['shaar-author-size-pt']) });
    B.push({ cls: 'publication-footer', text: year, sizePt: num(settings['shaar-year-size-pt']), bold: true, letterSpacingPx: 1 });
  } else if (page.type === 'shaar-sub') {
    const { titleMain, titleSub } = splitPartTitle(page.shaarInfo && page.shaarInfo.title);
    B.push({ cls: 'book-title-main', text: titleMain, sizePt: 36 });
    if (titleSub) {
      B.push({ cls: 'shaar-crown', text: '', sizePt: 0, graphic: 'crown-sub' });
      B.push({ cls: 'book-subtitle', text: titleSub, sizePt: num(settings['shaar-subtitle-size-pt']), bold: true });
    }
  } else {
    B.push({ cls: 'book-title-main book-title-main--back', text: bookTitle, sizePt: 36 });
    const lines = String(backRaw).split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach((l, i) => B.push({
      cls: 'back-shaar-text-line', text: l,
      sizePt: i === 0 ? 13 : num(settings['shaar-back-text-size-pt']), bold: i === 0
    }));
    if (author) B.push({ cls: 'author-block', text: author, sizePt: num(settings['shaar-author-size-pt']) });
    if (year) B.push({ cls: 'publication-footer', text: year, sizePt: num(settings['shaar-year-size-pt']), bold: true });
  }
  return { mode: box.mode, box, blocks: B.filter(b => b.graphic || String(b.text || '').length) };
}

/** משפחות הגופן של הבלוקים — לפי ההגדרות (גישה מילולית לסורק). */
function shaarFontOf(cls, settings) {
  switch (true) {
    case cls.includes('bsd-header'):
    case cls.includes('publication-footer'): return settings['shaar-year-font'];
    case cls.includes('book-title-main'): return settings['shaar-title-font'];
    case cls.includes('book-subtitle'): return settings['shaar-subtitle-font'];
    case cls.includes('book-description'): return settings['shaar-desc-font'];
    case cls.includes('book-sections-summary'): return settings['shaar-sections-font'];
    case cls.includes('author-block'): return settings['shaar-author-font'];
    case cls.includes('back-shaar-text-line'): return settings['shaar-back-text-font'];
    default: return '';
  }
}

module.exports = { buildShaarBlocks, shaarBoxOf, shaarFontOf, splitPartTitle, MM_TO_PX };
