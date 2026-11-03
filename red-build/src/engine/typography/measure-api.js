// src/engine/typography/measure-api.js — Measurement single entry (REQ-LB-01) + Hebrew glyph-width metrics
'use strict';

/**
 * MeasureAPI — הכניסה היחידה למדידת רוחב/גובה. אסור לקרוא offsetHeight מפוזר (lint ב‑CI).
 * מימוש A = DOM oracle; מימוש B = מתמטי (טבלאות רוחב אותיות עבריות). חתימה זהה.
 */

const DEFAULT_TRACKING = 0.02; // em

// טבלת רוחות אותיות עברית (יחסיים ל‑em, קירוב Frank-Ruhl/David). נלקח מ־metrics כללי של גופני ספרות.
const HEBREW_WIDTHS = {
  'א': 0.66, 'ב': 0.58, 'ג': 0.56, 'ד': 0.62, 'ה': 0.60, 'ו': 0.42, 'ז': 0.44, 'ח': 0.70, 'ט': 0.60,
  'י': 0.32, 'כ': 0.58, 'ך': 0.58, 'ל': 0.52, 'מ': 0.70, 'ם': 0.72, 'נ': 0.60, 'ן': 0.60, 'ס': 0.62,
  'ע': 0.62, 'פ': 0.60, 'ף': 0.62, 'צ': 0.62, 'ץ': 0.64, 'ק': 0.64, 'ר': 0.52, 'ש': 0.66, 'ת': 0.60
};
const WIDE_MARKS = { ' ': 0.26, '\uE000': 0.26, '.': 0.24, ',': 0.24, ';': 0.24, ':': 0.24, '-': 0.34, '–': 0.5, '"': 0.28, "'": 0.16, '“': 0.4, '”': 0.4, '״': 0.36, '׳': 0.18, '[': 0.3, ']': 0.3, '(': 0.3, ')': 0.3 };

function charWidthEm(ch) {
  if (HEBREW_WIDTHS[ch] !== undefined) return HEBREW_WIDTHS[ch];
  const c = ch.codePointAt(0);
  if (c >= 0x0590 && c <= 0x05FF) return 0.5;   // ניקוד/תווים עבריים נוספים
  if (WIDE_MARKS[ch] !== undefined) return WIDE_MARKS[ch];
  if (/[A-Za-z0-9]/.test(ch)) return 0.52;
  return 0.4;
}

class MeasureAPI {
  constructor(settings, impl = 'math') {
    this.settings = settings;
    this.impl = impl; // 'math' | 'dom'
    this.cache = new Map();
    this.stats = { calls: 0, hits: 0 };
  }

  _fontSpec(sizePt) {
    return sizePt || this.settings['body-font-size-pt'];
  }

  /** רוחב טקסט ב‑px לפי גופן/גודל (impl B מתמטי; impl A ישתמש בדומה בעת רנדור). */
  measureTextWidth(text, sizePt = null, trackingEm = DEFAULT_TRACKING) {
    const size = this._fontSpec(sizePt);
    const key = `${size}|${trackingEm}|${text}`;
    this.stats.calls++;
    if (this.cache.has(key)) { this.stats.hits++; return this.cache.get(key); }
    let w = 0;
    for (const ch of text) w += charWidthEm(ch) + trackingEm;
    const px = Math.max(0, w * size * (96 / 72)); // pt→px
    this.cache.set(key, px);
    return px;
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

module.exports = { MeasureAPI, charWidthEm };
