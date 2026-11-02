// src/engine/decoration/page-decorations.js — Theme/shaar/background box placement (S6, REQ-ORN-06, PT-03)
'use strict';

/**
 * מקום יחיד שבו מלוי עיטורי־דף נקבע: ערכת נושא, שערים (ראשי/משנה/אחורי),
 * ורקעים לפי סוג דף. אין פיצול ל‑"shaar boxes" נפרד — מנגנון אחד, צרכן אחד.
 *
 * עקרונות נגד באגי העבר (מ‑Gold/Green/Orange):
 * - D-11: אין הצטברות עיטורים; כל תבנית מקבלת מקום אחד בלבד לכל מלוי.
 * - F-09: אין !important; השליטה רק דרך מחלקות + inline שנכתב מכאן.
 * - PT-03: ארבעת מקטעי shaar_back הם עצמאיים — כל אחד נכבה בנפרד.
 */

/** 4 המקטעים העצמאיים של שער אחורי (PT-03). */
const SHAAR_BACK_SEGMENTS = ['frame', 'title-box', 'body-box', 'footer-ornament'];

/**
 * החלטת מלוי לעימוד דף — פונקציה טהורה (ללא DOM), דטרמיניסטית.
 * @param {object} page - { type: 'regular'|'shaar-main'|'shaar-sub'|'shaar-back'|... , index }
 * @param {object} settings - registry defaults+user
 * @returns {{ slots: Array<{slot:string, asset:string|null, cssClass:string}>, themeSetId:string }}
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
      push('shaar-sub', null, 'deco--themed');
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
      // regular / preface / sign-open …: רקע לפי background-page-type
      const bgType = settings['background-page-type'] || 'regular';
      const wantsBg =
        (bgType === 'preface-open' && page.type === 'preface') ||
        (bgType === 'sign-open' && page.type === 'sign-open') ||
        (bgType === 'regular');
      if (wantsBg && settings['background-image']) {
        push('page-background', settings['background-image'], 'deco--background');
      }
      break;
    }
  }

  return { slots, themeSetId };
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

module.exports = { planDecorations, applyDecorationSlots, SHAAR_BACK_SEGMENTS };
