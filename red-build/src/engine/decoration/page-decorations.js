// src/engine/decoration/page-decorations.js — Theme/shaar/background box placement (S6, REQ-ORN-06/08, PT-03)
'use strict';

/**
 * מקום יחיד שבו מלוי עיטורי־דף נקבע: ערכת נושא, שערים (ראשי/משנה/אחורי),
 * ורקעים לפי סוג דף. אין פיצול ל‑"shaar boxes" נפרד — מנגנון אחד, צרכן אחד.
 *
 * עקרונות נגד באגי העבר (מ‑Gold/Green/Orange):
 * - D-11: אין הצטברות עיטורים; כל תבנית מקבלת מקום אחד בלבד לכל מלוי.
 * - F-09: אין !important; השליטה רק דרך מחלקות + inline שנכתב מכאן.
 * - PT-03: ארבעת מקטעי shaar_back הם עצמאיים — כל אחד נכבה בנפרד.
 *
 * **S8 (REQ-ORN-08):** פאנל רקעים מוזג לתוך פאנל נושאים — 3 סוגי עמודים
 * (רגיל / פתיחת הקדמה / פתיחת סימן); color/texture/image + opacity; insets במ"מ.
 */

/** 4 המקטעים העצמאיים של שער אחורי (PT-03). */
const SHAAR_BACK_SEGMENTS = ['frame', 'title-box', 'body-box', 'footer-ornament'];

/** 3 סוגי העמודים לרקעים (REQ-ORN-08). */
const BACKGROUND_PAGE_CLASSES = ['regular', 'preface-open', 'sign-open'];

const { MM_TO_PX } = require('../layout/page-templates');

/** תנאי התאמת סוג־עמוד למחלקת רקע. */
function backgroundClassForPage(page) {
  if (page.type === 'preface' && page.chapterOpening) return 'preface-open';
  if (page.type === 'sign-open') return 'sign-open';
  return 'regular';
}

/**
 * החלטת רקע לפי מחלקת העמוד (REQ-ORN-08): הרקע שהוגדר למחלקה שאליה
 * העמוד שייך בלבד. inset במ"מ מומר לפיקסלים כאן — מקור יחיד.
 * @returns {{image:string|null, texture:string|null, insetPx:number}|null}
 */
function planBackground(page, settings) {
  const cls = backgroundClassForPage(page);
  const target = settings['background-page-type'] || 'regular';
  if (cls !== target) return null; // הרקע שייך למחלקה אחרת
  const image = settings['background-image'] || null;
  const texture = settings['background-texture'] || null;
  if (!image && !texture) return null;
  const insetMm = Math.max(0, Number(settings['background-inset-mm']) || 0);
  return { image, texture, insetPx: Math.round(insetMm * MM_TO_PX) };
}

/**
 * החלטת מלוי לעימוד דף — פונקציה טהורה (ללא DOM), דטרמיניסטית.
 * @param {object} page - { type: 'regular'|'shaar-main'|'shaar-sub'|'shaar-back'|... , index }
 * @param {object} settings - registry defaults+user
 * @returns {{ slots: Array<{slot:string, asset:string|null, cssClass:string}>, themeSetId:string, background:object|null }}
 */
function planDecorations(page, settings) {
  const themeSetId = settings['theme-set-id'] || 'default';
  const slots = [];

  const push = (slot, asset, modifier) => {
    // הגנה D-11: slot תפוס כבר → לא מוסיפים שוב
    if (slots.some(s => s.slot === slot)) return;
    slots.push({
      slot,
      asset: asset || null,
      cssClass: `deco deco--${slot}${modifier ? ` ${modifier}` : ''}${asset ? '' : ' deco--empty'}`
    });
  };

  switch (page.type) {
    case 'shaar-main': {
      const img = settings['shaar-main-image'];
      push('shaar-main', img, 'deco--themed');
      break;
    }
    case 'shaar-sub': {
      push('shaar-sub', settings['shaar-sub-image'] || null, 'deco--themed');
      break;
    }
    case 'shaar-back': {
      // PT-03: אם הכבה ראשית — אף מקטע לא מוצב; אחרת 4 מקטעים עצמאיים
      if (settings['shaar-back-enabled'] !== false) {
        for (const seg of SHAAR_BACK_SEGMENTS) push(`shaar-back-${seg}`, null, 'deco--segment');
      }
      break;
    }
    default: {
      // regular / preface / sign-open …: רקע לפי מחלקת העמוד (REQ-ORN-08)
      const bg = planBackground(page, settings);
      if (bg && bg.image) push('page-background', bg.image, 'deco--background');
      if (bg && bg.texture) push('page-texture', bg.texture, 'deco--texture');
      break;
    }
  }

  return { slots, themeSetId, background: planBackground(page, settings) };
}

/**
 * החלת התוכנית על דם־DOM (אלמנט השורש של הדף). נקי: מוחק קודם, מציב פעם אחת.
 * @param {object} rootEl - article.page
 * @param {object} doc - document
 * @param {Array} slots - מתוצר planDecorations
 */
function applyDecorationSlots(rootEl, doc, slots) {
  // ניקוי מקומי — מונע כפילויות בין ריצות (rollback-aware)
  for (const old of Array.from(rootEl.querySelectorAll('.deco'))) old.remove();
  for (const s of slots) {
    if (!s.asset) continue; // deco--empty נשמר לתיעוד בלבד, לא יוצר node
    const el = doc.createElement('div');
    el.className = s.cssClass;
    el.dataset.slot = s.slot;
    el.style.backgroundImage = `url("${s.asset}")`;
    rootEl.appendChild(el);
  }
}

module.exports = {
  planDecorations, applyDecorationSlots, planBackground, backgroundClassForPage,
  SHAAR_BACK_SEGMENTS, BACKGROUND_PAGE_CLASSES
};
