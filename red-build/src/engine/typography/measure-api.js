// src/engine/typography/measure-api.js — Measurement single entry (REQ-LB-01) + Hebrew glyph-width metrics
'use strict';

/**
 * MeasureAPI — הכניסה היחידה למדידת רוחב/גובה. אסור לקרוא offsetHeight מפוזר (lint ב‑CI).
 * מימוש A = 'table' (טבלאות מכוילות — ברירת המחדל, המשך רציפות S1–S11);
 * מימוש B = 'font-metrics' (S12: טבלאות אמת מקובץ גופן שנטען — hmtx/cmap/kern/GPOS)
 * חתימה זהה; הפרופיל נרשם דרך registerFont ומופעל דרך ההגדרה measure-impl.
 */

const { charWidthEm, FONT_PROFILES } = require('./measure-table');
const fm = require('./font-metrics');

const DEFAULT_TRACKING = 0.02; // em

/** גופנים רשומים (פרופיל → פרנסר). ההרשמה מפורשת — אין טעינת רשת (offline). */
const registeredFonts = new Map();

/**
 * רישום גופן למדידת אמת (S12.1-5). קלט: בתים בלבד (Uint8Array/Buffer).
 * @returns {{ok:boolean, error?:string, profile?:object, glyphCount?:number, mappedChars?:number}}
 */
function registerFont(profileName, bytes) {
  const res = fm.parseFont(bytes);
  if (!res.ok) return { ok: false, error: res.error };
  registeredFonts.set(String(profileName), res.font);
  return { ok: true, profile: res.font, glyphCount: res.font.numGlyphs, mappedChars: res.font.charToGlyph.size };
}

/** הסרת גופן רשום (בדיקות). */
function unregisterFont(profileName) { registeredFonts.delete(String(profileName)); }
function clearRegisteredFonts() { registeredFonts.clear(); }

class MeasureAPI {
  constructor(settings, impl = 'table') {
    this.settings = settings;
    this.impl = impl === 'font-metrics' ? 'font-metrics' : 'table'; // 'table' | 'font-metrics'
    this.fontProfileName = null;
    this.fontProfile = null;
    this.fontFactor = 1;
    this.cache = new Map();
    this.stats = { calls: 0, hits: 0, fontFallbacks: 0 };
    if (this.impl === 'font-metrics') this._bindProfile();
  }

  /** קשירת פרופיל הגופן לפי שם הגופן בהגדרות; fallback שקוף לטבלה אם לא נרשם. */
  _bindProfile() {
    const name = this.settings['body-font'];
    if (name && registeredFonts.has(name)) {
      this.fontProfileName = name;
      this.fontProfile = registeredFonts.get(name);
      this.fontFactor = FONT_PROFILES[name] || 1;
    } else {
      // לא נרשם גופן — מימוש B נופל בשקיפות לטבלה (מדידה עקבית, לא כשל שקט)
      this.impl = 'table';
      this.stats.fontFallbacks++;
    }
  }

  _fontSpec(sizePt) {
    return sizePt || this.settings['body-font-size-pt'];
  }

  /**
   * **S4.16 (תיקון שורש — מדידת ניקוד):** סימן משולב הממופה בגופן עם advance=0
   * (ניקוד עברי: דגש/תנועות/טעמים) הוא **שכבת-אפס אמיתית** — כך מודד אותו
   * הדפדפן (hmtx=0, שכבת-גליף על הבסיס). בעבר נפל לסל העברי של הטבלה (0.5em
   * = 6pt בגוף 12) ⇒ מילה מנוקדת כמו המצוּוֶה נמדדה רחבה ב~12pt, שבירת השורות
   * נגררה מילה-מילה והדריפט הצטבר לכל העימוד (P7 0.919). מבחינים עתה בין
   * "לא ממופה כלל" (fallback מכויל — מונה fontFallbacks) לבין "ממופה
   * עם advance=0" (אפס אמיתי).
   */
  _charEm(ch) {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      const gid = fm.glyphIdOf(this.fontProfile, ch);
      if (gid !== 0 && gid < this.fontProfile.numGlyphs) {
        // ממופה בגופן — רוחב hmtx אמיתי (כולל 0 לניקוד)
        return (fm.advanceUnitsOf(this.fontProfile, ch) / this.fontProfile.unitsPerEm) * this.fontFactor;
      }
      this.stats.fontFallbacks++;
      return charWidthEm(ch);
    }
    return charWidthEm(ch);
  }

  /** סימן משולב ממופה עם advance=0 (ניקוד): שכבת-אפס — לא חלק מאשכול מדידה. */
  _isMappedMark(ch) {
    if (this.impl !== 'font-metrics' || !this.fontProfile) return false;
    const gid = fm.glyphIdOf(this.fontProfile, ch);
    return gid !== 0 && gid < this.fontProfile.numGlyphs
      && fm.advanceUnitsOf(this.fontProfile, ch) === 0;
  }

  /** קרנינג בין תווים סמוכים ב־em (מימוש A: 0 תמיד — כמו S1–S11). */
  _kernEm(a, b) {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      const k = fm.kernUnitsOf(this.fontProfile, a, b);
      if (k !== 0) return (k / this.fontProfile.unitsPerEm) * this.fontFactor;
    }
    return 0;
  }

  /**
   * רוחב טקסט ב‑px. מימוש B כולל קרנינג בר־מילה (hmtx + kern/GPOS) —
   * ההבדל היחיד מ־A בנוסף לרוחבי הגליפים עצמם.
   */
  measureTextWidth(text, sizePt = null, trackingEm = DEFAULT_TRACKING) {
    const size = this._fontSpec(sizePt);
    const key = `${this.impl}|${this.fontProfileName || ''}|${size}|${trackingEm}|${text}`;
    this.stats.calls++;
    if (this.cache.has(key)) { this.stats.hits++; return this.cache.get(key); }
    const str = String(text);
    let w = 0;
    let prev = null;
    for (const ch of str) {
      // **S4.16:** ניקוד ממופה (advance=0) — אין רוחב, אין tracking ואין קרנינג
      // (הסימן נצמד לבסיס שלו; letter-spacing אינו חל על סימנים משולבים במדידת
      // הדפדפן). prev נשאר הבסיס האחרון — קרנינג בין בסיסים דרך הניקוד נשמר.
      if (this._isMappedMark(ch)) continue;
      if (prev !== null) w += this._kernEm(prev, ch);
      w += this._charEm(ch) + trackingEm;
      prev = ch;
    }
    const px = Math.max(0, w * size * (96 / 72)); // pt→px
    this.cache.set(key, px);
    return px;
  }

  /**
   * **S12.1-6 — cap-height מטבלאות אמת** (OS/2 sCapHeight; נפילה: ascender×0.7).
   * משמש את יישור המילה הראשונה (dropword) במקום הקירוב הקבוע.
   */
  capHeightEm() {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      return fm.capHeightEmOf(this.fontProfile) * this.fontFactor;
    }
    return 0.7; // הקירוב ההיסטורי (תיעוד dropword CSS)
  }

  /** **S12 (parity גיאומטרי):** ascent/descent ב־em — מפרופיל הגופן (hhea)
   * כשנטען, אחרת הפרופיל המכויל (0.80/0.20 — תואם קו הבסיס ההיסטורי). */
  ascentEm() {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      return (this.fontProfile.ascender / this.fontProfile.unitsPerEm) * this.fontFactor;
    }
    return 0.80;
  }
  descentEm() {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      return Math.abs(this.fontProfile.descender / this.fontProfile.unitsPerEm) * this.fontFactor;
    }
    return 0.20;
  }

  /** שורת "גובה" אחידה (baseline grid): fontSize × lineHeight (BRZ-2). */
  lineHeightPx(sizePt = null) {
    const size = this._fontSpec(sizePt);
    return Math.round(size * (96 / 72) * this.settings['body-line-height']);
  }

  /**
   * מיקום שורות אופטימלי (KP) → מערך שורות עם רוחבים.
   * @param {Function} [measureOverride] - הזרקת פונקציית מדידה (למשל פרופיל רוחב־גופן מהpipeline) — L1: entry יחיד דרך ההזרקה.
   * @returns {Array<{words:string[], widthPx:number, badness:number}>}
   */
  layoutLines(words, maxWidthPx, sizePt = null, opts = {}, measureOverride = null) {
    const knuth = require('./kp-linebreak');
    const measure = measureOverride || ((t) => this.measureTextWidth(t, sizePt));
    return knuth.breakLines(words, maxWidthPx, measure, this.lineHeightPx(sizePt), opts);
  }

  cacheStats() { return { ...this.stats, hitRate: this.stats.calls ? this.stats.hits / this.stats.calls : 0 }; }
}

module.exports = {
  MeasureAPI, registerFont, unregisterFont, clearRegisteredFonts,
  charWidthEm, registeredFonts
};
