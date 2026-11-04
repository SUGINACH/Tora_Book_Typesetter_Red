// src/engine/output/legacy-projector.js — הקרנת עמודי פרופיל IMUD לגיאומטריה מפורשת.
'use strict';

/**
 * **S4.9:** מקרן ייעודי לעמודי legacy-imud-flow. כל שורה מקבלת מיקום מפורש
 * (x/y/baseline/מילים עם רוחב וגודל פר-מילה) — מותאם לחוזה של writePdf
 * (pages/lines/footnotes/folio/header) ול-pdf_rows של compare.py.
 *
 * הגיאומטריה מקורה אחד: legacy-imud-flow (GEO/SZ) — מכויל מהייחוס.
 */

const { GEO, SZ } = require('../layout/legacy-imud-flow');
const { MeasureAPI, registeredFonts } = require('../typography/measure-api');

const COL_R = { x: GEO.COL_R_X, w: GEO.COL_W };
const COL_L = { x: GEO.COL_L_X, w: GEO.COL_W };

/** בסיס שורה לפי מודל תיבת השורה של CSS (half-leading + ascent). */
function baselineOf(yTop, h, sizePt, ascentEm) {
  const sizePx = sizePt * (96 / 72);
  const contentH = (ascentEm + 0.2) * sizePx;
  const half = Math.max(0, (h - contentH) / 2);
  return yTop + half + ascentEm * sizePx;
}

/** מיקום מילים RTL מיושרות ברוחב נתון. מחזיר words:[{text,x,w,sizePt,baselineY,fontKey?}] */
function placeWords(words, api, xLeft, width, sizePt, align, baseY, opts = {}) {
  const spaceW = api.measureTextWidth(' ', sizePt, 0);
  const placed = words.map((w, i) => {
    if (typeof w === 'object') return w; // כבר ממוקם (חלון/סמן)
    const isMarker = opts.markers && opts.markers[i];
    const isParen = opts.parenIdx && opts.parenIdx.has(i);
    const sz = isMarker ? SZ.fnMarker : (isParen ? SZ.body + SZ.parenDelta : sizePt);
    return { text: w, w: api.measureTextWidth(w, sz, 0), sizePt: sz };
  });
  const sumW = placed.reduce((a, w) => a + w.w, 0);
  const gaps = Math.max(0, placed.length - 1);
  let gapW = spaceW;
  if (align === 'justify' && gaps > 0 && sumW + gaps * spaceW < width) {
    gapW = (width - sumW) / gaps;
  }
  const lineW = sumW + gaps * gapW;
  let xRight;
  if (align === 'center') xRight = xLeft + (width + lineW) / 2;
  else xRight = xLeft + width;
  const out = [];
  let cursor = xRight;
  for (const w of placed) {
    cursor -= w.w;
    out.push({
      text: w.text, x: cursor, w: w.w,
      sizePt: w.sizePt, baselineY: w.sizePt < sizePt ? baseY - sizePt * (96 / 72) * 0.33 : baseY
    });
    cursor -= gapW;
  }
  return out;
}

/** הקרנת עמוד legacy בודד. */
function projectLegacyPage(pg, settings, api, winApi) {
  const ascent = api.ascentEm();
  const out = {
    width: GEO.PAGE_W, height: GEO.PAGE_H,
    contentBox: { top: GEO.FLOW_TOP, bottom: GEO.FLOW_BOTTOM },
    columns: [COL_R, COL_L],
    lines: [], footnotes: [], folio: null, header: null, spanning: null
  };

  const isSingle = pg.type === 'preface' || pg.type === 'toc-general' || pg.type === 'toc-detailed'
    || pg.type.startsWith('shaar');
  const col0 = isSingle ? { x: GEO.COL_L_X, w: 2 * GEO.COL_W + 13.48 } : COL_R;

  // ---- פסים: סימן/כותרת h2/h0/h3 ממורכזים ברוחב הפס (552px) ----
  // **S4.9:** פיצול למילים (פעולת טקסט נפרדת לכל מילה) — החילוץ מחזיר סדר לוגי,
  // כמו שורות הכותרת בייחוס (לא הפוך כמו שורות ה-TOC החד-פעולתיות).
  const bandLeft = GEO.COL_L_X;
  const bandW = 2 * GEO.COL_W + 13.48;
  for (const b of (pg.bands || [])) {
    const baseY = baselineOf(b.y, b.h, b.sizePt, ascent);
    const words = placeWords(b.text.split(' '), api, bandLeft, bandW, b.sizePt, 'center', baseY);
    out.lines.push({
      x: bandLeft, y: b.y, w: bandW, h: b.h, words, align: 'center',
      kind: b.kind, level: null, isLast: false, sizePt: b.sizePt,
      baselineY: baseY, tokenId: b.tokenId != null ? b.tokenId : null
    });
  }

  // ---- תוכן השערים (ממורכז; מילים נפרדות — חילוץ לוגי, כמו בייחוס) ----
  for (const g of (pg.gateLines || [])) {
    const h = g.sizePt * (96 / 72) * 1.3;
    const baseY = baselineOf(g.y, h, g.sizePt, ascent);
    // **S4.9:** שורות המהדורה והמחבר בשער הראשי נכתבות אצל המקור כרצף אחד —
    // החילוץ מחזיר אותן בסדר מילים הפוך. שאר שורות השער מפוצלות למילים (לוגי).
    const singleOp = g.singleOp === true;
    const words = placeWords(singleOp ? [g.text] : g.text.split(' '), api, bandLeft, bandW, g.sizePt, 'center', baseY);
    out.lines.push({
      x: bandLeft, y: g.y, w: bandW, h, words, align: 'center',
      kind: 'gate', level: null, isLast: false, sizePt: g.sizePt, baselineY: baseY, tokenId: null
    });
  }

  // ---- טורי גוף ----
  pg.columns.forEach((colLines, ci) => {
    const col = ci === 0 ? col0 : COL_L;
    for (const ln of colLines) {
      // **S4.14 (יישור-עליון לכותרות inline — כמקור):** בייחוס גליפי הכותרת יושבים
      // בראש השורה (עמ' 11: h5 גליפים ב-781.1 = ראש השורה 780.5 + 0.6px), והמרווח
      // נשאר מתחת. מרכוז אנכי (baselineOf) הוריד את הגליפים 3.4px ותיבת 11.5pt
      // חדרה למילת-החלון התלויה שמעליה (חפיפה 2.1px × 11 זוגות — H2 נכשל).
      const baseY = ln.kind === 'heading'
        ? ln.y + 0.6 + ascent * ln.sizePt * (96 / 72)
        : baselineOf(ln.y, ln.heightPx, ln.sizePt, ascent);
      let words;
      if (ln.kind === 'heading') {
        // כותרת inline — מילים נפרדות (חילוץ לוגי, כמו בייחוס)
        const joined = ln.words.join(' ');
        words = placeWords(joined.split(' '), api, col.x, col.w, ln.sizePt, 'center', baseY);
      } else if (ln.window && ln.windowWords) {
        // שורת חלון: מילת החלון (1.5×) בשפה הימנית; הטקסט ברוחב מוקטן
        const winSz = ln.sizePt * 1.5;
        // **S4.15:** רוחב החלון מהמודל — המדידה שם ב-FrankReal-Bold 1.5×
        // (גופן החלון של המקור), לא בגופן הגוף. מקור יחיד: בלי הערך על
        // השורה (מודל ישן) — נפילה למדידה מקומית כמו קודם.
        const winW = ln.windowW || (api.measureTextWidth(ln.windowWords.join(' '), winSz, 0) + 6);
        // **S4.9→S4.15 (בסיס מילת-החלון כמו הייחוס):** בייחוס בסיס החלון יושב
        // כ-1.5pt מתחת לבסיס שורת הטקסט (עמ' 14: חלון 155.25 מול שורה 153.75)
        // — ולא מעליה. עם עליית הבסיס, תיבת 18pt (asc 751/desc 135 של
        // FrankReal) חורגת מחלון המיזוג של C2 (Δtop>7pt ⇒ שתי שורות נפרדות
        // ⇒ חפיפה מדומה 10.2pt). בסיס +2px מיישר את הגליפים כמקור ומנקה את C2.
        const winBase = baseY + 2;
        // **S4.15:** מילת-החלון נמדדת ומסומנת בגופן החלון (FrankReal-Bold —
        // כמו המקור) — הציור ב-PDF ב-/F2. המדידה במטריקות האמיתיות מונעת
        // חריגה מהשקע (גופן הגוף רחב ממנה בחלק מהמילים ⇒ חפיפות C2).
        const winMeasure = winApi || api;
        const winWords = ln.windowWords.map(w => ({
          text: w,
          w: winMeasure.measureTextWidth(w, winSz, 0),
          sizePt: winSz, fontKey: 'window'
        }));
        // מיקום מימין לשמאל בתוך השקע (ישור לשפה הימנית — כמקור)
        {
          let cx = col.x + col.w;
          for (const ww of winWords) {
            cx -= ww.w;
            ww.x = cx;
            ww.baselineY = winBase;
          }
        }
        const textW = col.w - winW;
        const textWords = placeWords(ln.words, api, col.x, textW, ln.sizePt,
          ln.isLast ? 'center' : 'justify', baseY);
        words = [...winWords, ...textWords];
      } else {
        const align = ln.isLast ? 'center' : 'justify';
        // **S4.9:** מילים בתוך (...) מרונדרות בגודל הסוגריים המוקטן — בדיוק
        // כפי שנמדדו בשבירה (אחרת השורה רחבה מהטור וגולשת מהעמוד).
        const parenIdx = new Set();
        {
          const stack = [];
          ln.words.forEach((w, i) => {
            if (w.startsWith('(')) stack.push(i);
            if (w.endsWith(')') && stack.length) {
              const from = stack.pop();
              for (let k = from; k <= i; k++) parenIdx.add(k);
            }
          });
        }
        words = placeWords(ln.words, api, col.x, col.w, ln.sizePt, align, baseY,
          { markers: ln.words.map(w => /^[א-ת]+\.$/.test(w)), parenIdx });
      }
      out.lines.push({
        x: col.x, y: ln.y, w: col.w, h: ln.heightPx, words,
        align: ln.kind === 'heading' ? 'center' : (ln.isLast ? 'center' : 'justify'),
        kind: ln.kind, level: ln.level || null, isLast: !!ln.isLast, sizePt: ln.sizePt,
        baselineY: baseY, tokenId: ln.tokenId != null ? ln.tokenId : null
      });
    }
  });

  // ---- הערות צד בטורי השוליים ----
  for (const mn of (pg.marginNotes || [])) {
    const x = mn.side === 'right' ? GEO.MARGIN_R_X : GEO.MARGIN_L_X;
    for (const l of mn.lines) {
      const baseY = baselineOf(l.y, GEO.MN_PITCH, SZ.marginNote, ascent);
      const words = placeWords(l.text.split(' '), api, x, GEO.MARGIN_W, SZ.marginNote, 'center', baseY);
      out.lines.push({
        x, y: l.y, w: GEO.MARGIN_W, h: GEO.MN_PITCH, words, align: 'center',
        kind: 'margin-note', level: null, isLast: false, sizePt: SZ.marginNote,
        baselineY: baseY, tokenId: null
      });
    }
  }

  // ---- מפריד הערות ----
  // **S4.9:** המקור השתמש ב-✧✧✧ מגופן דפדפן חלופי; הגופן המוטמע שלנו חד-לשוני
  // (אין גליפי כוכבים) — ההפרדה נשארת דרך ריווח התחתית בלבד.

  // ---- הערות שוליים (תחתית) ----
  for (const fn of (pg.footnotes || [])) {
    let x = GEO.COL_L_X + 2 * GEO.COL_W + 13.48;
    let baseY = null;
    const words = [];
    if (fn.marker) {
      const mw = api.measureTextWidth(fn.marker, SZ.fnBody, 0);
      x -= mw;
      words.push({ text: fn.marker, x, w: mw, sizePt: SZ.fnBody });
      x -= api.measureTextWidth(' ', SZ.fnBody, 0);
    }
    for (const l of fn.lines) {
      if (baseY === null) baseY = baselineOf(l.y, GEO.FN_PITCH, SZ.fnBody, ascent);
      const lw = api.measureTextWidth(l.words.join(' '), SZ.fnBody, 0);
      const x0 = Math.max(GEO.COL_L_X, x - lw);
      let cursor = x;
      const ws = [];
      for (let i = l.words.length - 1; i >= 0; i--) {
        const w = l.words[i];
        const ww = api.measureTextWidth(w, SZ.fnBody, 0);
        cursor -= ww;
        ws.push({ text: w, x: cursor, w: ww, sizePt: SZ.fnBody });
        cursor -= api.measureTextWidth(' ', SZ.fnBody, 0);
      }
      words.push(...ws);
      void x0; void lw;
    }
    if (words.length) {
      out.footnotes.push({ y: fn.lines[0].y, x: GEO.COL_L_X, w: 2 * GEO.COL_W + 13.48, marker: fn.marker, text: fn.lines.map(l => l.words.join(' ')).join(' '), words, baselineY: baseY, h: fn.lines.length * GEO.FN_PITCH });
    }
  }

  // ---- שורות תוכן-עניינים ----
  if (pg.toc) {
    if (pg.toc.title) {
      const y = GEO.FLOW_TOP + TOC_TITLE_Y_OFFSET;
      const baseY = baselineOf(y, 30, SZ.tocTitle, ascent);
      const words = placeWords([pg.toc.title], api, bandLeft, bandW, SZ.tocTitle, 'center', baseY);
      out.lines.push({
        x: bandLeft, y, w: bandW, h: 30, words, align: 'center', kind: 'toc-title',
        level: null, isLast: false, sizePt: SZ.tocTitle, baselineY: baseY, tokenId: null
      });
    }
    for (const r of (pg.toc.rows || [])) {
      const baseY = baselineOf(r.y, 26, r.sizePt, ascent);
      // כותרת מימין (במדרגות לפי רמה), מספר משמאל
      const tW = api.measureTextWidth(r.text, r.sizePt, 0);
      const textWords = placeWords([r.text], api, r.x1 - tW, tW, r.sizePt, 'right', baseY);
      const numW = api.measureTextWidth(r.folio, SZ.tocNum, 0);
      const numWords = r.folio ? placeWords([r.folio], api, GEO.TOC_NUM_X, numW, SZ.tocNum, 'left', baseY) : [];
      out.lines.push({
        x: GEO.TOC_NUM_X, y: r.y, w: r.x1 - GEO.TOC_NUM_X, h: 26,
        words: [...textWords, ...numWords], align: 'right', kind: 'toc-row',
        level: r.level, isLast: false, sizePt: r.sizePt, baselineY: baseY, tokenId: null
      });
    }
  }

  // ---- גיליון ----
  if (pg.folioDisplay) {
    const fw = api.measureTextWidth(pg.folioDisplay, SZ.folio, 0);
    out.folio = {
      y: GEO.FOLIO_BASELINE - 14, x: Math.round((GEO.PAGE_W - fw) / 2), w: fw,
      sizePt: SZ.folio, text: pg.folioDisplay, baselineY: GEO.FOLIO_BASELINE
    };
  }

  // ---- כותרת עליונה תלת-סלוטית ----
  if (pg.headerSlots && (pg.headerSlots.right || pg.headerSlots.center || pg.headerSlots.left)) {
    const slots = [];
    const mk = (pos, text, sizePt) => {
      if (!text) return;
      const w = api.measureTextWidth(text, sizePt, 0);
      let x;
      if (pos === 'right') x = GEO.COL_R_X + GEO.COL_W - 33 - w;
      else if (pos === 'left') x = GEO.COL_L_X + 33;
      else x = (GEO.PAGE_W - w) / 2;
      slots.push({ pos, text, x, w, sizePt });
    };
    mk('right', pg.headerSlots.right, SZ.hdrR);
    mk('center', pg.headerSlots.center, SZ.hdrC);
    mk('left', pg.headerSlots.left, SZ.hdrL);
    if (slots.length) {
      // **S4.9:** כל סלוט מתפצל למילים — חילוץ לוגי כמו בייחוס
      for (const s of slots) {
        const baseY = GEO.HEADER_BASELINE;
        s.words = placeWords(s.text.split(' '), api, s.x, s.w + 40, s.sizePt,
          s.pos === 'center' ? 'center' : (s.pos === 'right' ? 'right' : 'left'), baseY);
      }
      out.header = { y: GEO.HEADER_BASELINE - 14, baselineY: GEO.HEADER_BASELINE, slots };
    }
  }

  return out;
}

const FLOW_BOTTOM_DEFAULT = GEO.FLOW_TOP + GEO.FLOW_H;
const TOC_TITLE_Y_OFFSET = 136; // כותרת ה-TOC ב-309px = FLOW_TOP+212.4 — מכויל

/** הקרנת מסמך legacy שלם. */
function projectLegacyDocument(result, settings) {
  const impl = settings['measure-impl'] === 'font-metrics' ? 'font-metrics' : 'table';
  const api = new MeasureAPI(settings, impl);
  // **S4.15 (גופן מילת-החלון בהקרנה):** מילות-החלון נמדדות ומסומנות בגופן
  // המקור (FrankReal-Bold) — הציור ב-PDF ב-/F2 והרוחב האמיתי (בלי זה הגליפים
  // של גוף הטקסט רחבים מהשקע שנשמר וחודרים לשורה — 1886 חפיפות בקורפוס).
  // הגופן נרשם ע"י legacyTypeset מ-env.windowFontBytes באותו תהליך.
  let winApi = null;
  const winName = registeredFonts.has('FrankReal-Bold') ? 'FrankReal-Bold'
    : (registeredFonts.has('FrankReal') ? 'FrankReal' : null);
  if (impl === 'font-metrics' && winName) {
    winApi = new MeasureAPI({ 'body-font': winName, 'body-font-size-pt': SZ.body }, 'font-metrics');
  }
  const pages = result.pages.map(p => projectLegacyPage(p, settings, api, winApi));
  return { pages, inkBounds: pages.map(() => null), layoutHash: result.layoutHash };
}

module.exports = { projectLegacyPage, projectLegacyDocument };
