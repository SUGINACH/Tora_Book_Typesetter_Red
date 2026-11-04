// src/engine/decoration/legacy-ornaments.js — **EXT-4 (שארית): חיבור ornament-plan לנתיב ה-legacy**
'use strict';

/**
 * הפאס שמשלים את החוליה החסרה בשרשרת העיטורים של פרופיל ה-IMUD:
 * הדיו קיים (ornament-ink — כולל פענוח imud: מספריות העיצובים המוטמעות),
 * ההקרנה קיימת (legacy-projector: pdfOps + data-URI מ-pg.decorations) —
 * ומה שחסר הוא ה**תכנון**: הפקת rectים של עיטורים על עמודי פתיחת-הסימן
 * של מנוע המורשת, לפי אותם מפתחות h2-orn-* שמיפוי ההגדרות מתרגם מהמקור
 * (h2-ornament-top-style וכו').
 *
 * **ברירות המחדל של המקור = 'none' לכל העיטורים** — בפרופיל ברירת-המחדל
 * הפאס הזה לא מייצר דבר (אפס שינוי; ה-parity וה-hash מוכחים כזהים).
 * החיבור מופעל רק כשההגדרות מזמנות עיטורים בפועל — ואז הוא מוכח בבדיקות.
 *
 * **אינווריאנט T1 (ניטרליות גיאומטרית):** הפאס רץ אחרי חישוב ה-layoutHash
 * של המורשת ואינו נוגע בטורים/בפסים — overlay-rects בלבד (דפוס D-47).
 * גובה העיטור אינו "מתגלה" בדיעבד (שיעור F-08): עיטור שאין לו מקום
 * חוקי בתוך אזור ה-h2 נדחה ונרשם — לא נדחק לתוך זרימת הגוף.
 */

const {
  h2OrnamentScope, h2OrnamentReservedHeight
} = require('./ornament-fit');

/** רוחב הפס (שני טורים + מרזב) — מקור: legacy-imud-flow GEO. */
const BAND_W = 552;
const BAND_X = 48.7; // GEO.COL_L_X — מרכז העמוד (A5 16x16... ליתר דיוק מוזרק מהקריאה)

/**
 * @param {Array} pages - עמודי המורשת (אחרי ההרכבה; pg.bands/pg.columns מוכנים)
 * @param {object} settings - הגדרות RED (כולל h2-orn-* הממופות מהמקור)
 * @param {Function} measureFn - (text, sizePx?) => widthPx
 * @param {object} io - { ledger, eventLog, bandX, bandW }
 * @returns {{planted:number, rejected:Array}}
 */
function planLegacyOrnaments(pages, settings, measureFn, io = {}) {
  const ledger = io.ledger, eventLog = io.eventLog;
  const bandX = io.bandX != null ? io.bandX : BAND_X;
  const bandW = io.bandW != null ? io.bandW : BAND_W;
  // ראש זרימת הגוף של עמוד h2 — מחושב בצד הזרימה (FLOW_TOP + גובה אזור-h2
  // לפי פטור-span); ברירת מחדל שמרנית: מתחת לפס הכותרת.
  const flowTopOf = io.flowTopOf || ((pg, title) => title.y + title.h);
  const out = { planted: 0, rejected: [] };
  const scope = h2OrnamentScope(settings);
  if (!scope.any) return out; // ברירות המחדל של המקור — אין עיטורים (אפס התערבות)

  for (const pg of pages) {
    const title = (pg.bands || []).find(b => b.kind === 'h2-title');
    if (!title) continue; // עיטורי h2 בלבד בחיבור זה (עמודי פתיחת סימן)
    const siman = (pg.bands || []).find(b => b.kind === 'h2-siman');
    const topBand = siman || title;

    const h2FontPx = title.sizePt * (96 / 72);
    let titleW = 0;
    try { titleW = measureFn(title.text, title.sizePt); } catch { titleW = 0; }
    const titleWpx = Math.max(40, titleW || 0);
    const { scale, ornW, ornH, margins } = h2OrnamentReservedHeight(titleWpx, settings, h2FontPx);
    if (ornW <= 0 || ornH <= 0) continue;

    pg.decorations = pg.decorations || [];
    const centerX = bandX + bandW / 2;
    const kindTop = settings['h2-orn-top'];
    const kindBottom = settings['h2-orn-bottom'];
    const kindSide = settings['h2-orn-side'];

    // גבולות אזור-h2 חוקיים: מעל הפס העליון, ועד ראש זרימת הגוף של העמוד
    const flowTop = flowTopOf(pg, title);

    // ---------- עיטור עליון (מעל הסימן/הכותרת; REQ-ORN-01/02) ----------
    if (scope.signTop && kindTop && kindTop !== 'none') {
      const y = topBand.y - margins.top - ornH;
      if (y >= 60) { // לא מטפס מעל אזור הכותרת העליונה של העמוד
        const x = centerX - ornW / 2;
        pg.decorations.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, w: ornW, h: ornH, kind: 'h2-orn-top', slot: 'sign-top', kindStyle: kindTop });
        out.planted++;
      } else {
        out.rejected.push({ page: pg.folioDisplay || pg.index, slot: 'sign-top', reason: 'no-room-above', ornH });
        if (ledger) ledger.create('ornament-rejected', `legacy-h2-top@${pg.index}`, pg.index, { reason: 'no-room-above', ornH }, 'ornaments');
      }
    }

    // ---------- עיטור תחתון (מתחת לכותרת; בתוך אזור ה-h2 בלבד — שיעור F-08) ----------
    if (scope.signBottom && kindBottom && kindBottom !== 'none') {
      const y = title.y + title.h + margins.bottom;
      if (y + ornH <= flowTop - 1) { // חייב להיכנס לאזור — לא לחדור לזרימת הגוף
        const x = centerX - ornW / 2;
        pg.decorations.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, w: ornW, h: ornH, kind: 'h2-orn-bottom', slot: 'sign-bottom', kindStyle: kindBottom });
        out.planted++;
      } else {
        out.rejected.push({ page: pg.folioDisplay || pg.index, slot: 'sign-bottom', reason: 'no-room-below', ornH, flowTop });
        if (ledger) ledger.create('ornament-rejected', `legacy-h2-bottom@${pg.index}`, pg.index, { reason: 'no-room-below', ornH }, 'ornaments');
      }
    }

    // ---------- עיטורי צד (משני צדי הכותרת; ממורכזים אנכית לפס) ----------
    if (scope.titleSide && kindSide && kindSide !== 'none') {
      const gap = Math.max(4, Math.round(h2FontPx * 0.15));
      const y = title.y + (title.h - ornH) / 2;
      const halfTitle = (titleWpx * (scale > 0 ? 1 : 1)) / 2;
      const rightX = centerX + halfTitle + gap;
      const leftX = centerX - halfTitle - gap - ornW;
      if (rightX + ornW <= bandX + bandW && leftX >= bandX) {
        pg.decorations.push({ x: Math.round(rightX * 100) / 100, y: Math.round(y * 100) / 100, w: ornW, h: ornH, kind: 'h2-orn-side', slot: 'side-r', kindStyle: kindSide });
        pg.decorations.push({ x: Math.round(leftX * 100) / 100, y: Math.round(y * 100) / 100, w: ornW, h: ornH, kind: 'h2-orn-side', slot: 'side-l', kindStyle: kindSide });
        out.planted += 2;
      } else {
        out.rejected.push({ page: pg.folioDisplay || pg.index, slot: 'side', reason: 'title-too-wide', titleW: titleWpx });
        if (ledger) ledger.create('ornament-rejected', `legacy-h2-side@${pg.index}`, pg.index, { reason: 'title-too-wide', titleW: titleWpx }, 'ornaments');
      }
    }
  }
  if (eventLog && out.planted) {
    eventLog.emit('ornaments', 'legacy-h2-ornaments', { planted: out.planted, rejected: out.rejected.length });
  }
  return out;
}

module.exports = { planLegacyOrnaments };
