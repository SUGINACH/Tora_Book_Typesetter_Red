// src/engine/output/geometry-projector.js — CP5 model → explicit geometry (S12.1-1, REQ-EXP-01)
'use strict';

/**
 * **מקור גיאומטריה יחיד:** הרנדרר החי (DOM) ממקם שורות בזרימת CSS; הפרויקטור
 * מחשב את אותן מיקומים **מפורש** ממודל CP5 (pages/lines/heightPx/columns) —
 * כך שההדפסה (PDF) והייצוא מקרינים מאותו מקור בלבד (הורג את מחלקת
 * live≠export של כל הגרסאות הקודמות).
 *
 * חוזה מיקום (תואם dom-renderer): טור = תיבה absolute מ־template.columns;
 * שורות נערמות מ־contentBox.top + spanOffset; גובה שורה = ln.heightPx.
 * מילים: RTL — יישור לפי המחלקות (right לשורה רגילה; שורה אחרונה לפי
 * body-last-line-align; קריעה/AQ ברווחים). PUA נאסף לפני הפלט (BRZ-13).
 */

const { scrubPUAText } = require('./dom-renderer');
const { MeasureAPI } = require('../typography/measure-api');
const { lineFontSizePt } = require('./line-font'); // **03.11(ג):** מקור יחיד — נצרך גם ע"י dom-renderer (תצוגה חיה + ייצוא); מיוצא הלאה לצרכנים קיימים

/**
 * הקרנת עמוד בודד לגיאומטריה מפורשת.
 * @param {object} page — עמוד CP5
 * @param {object} settings — הגדרות ממוזגות
 * @param {MeasureAPI} [api] — מדידה (נבנה אם לא הוזרק)
 * @returns {{width, height, contentBox, lines:Array, footnotes, folio, header, spanning}}
 */
function projectPage(page, settings, api) {
  const measure = api || new MeasureAPI(settings, 'table');
  const tpl = page.template;
  const spanOffset = page.spanning ? page.spanning.heightPx : 0;

  const out = {
    width: tpl.width,
    height: tpl.height,
    contentBox: { ...tpl.contentBox },
    columns: tpl.columns.map(c => ({ ...c })),
    lines: [],        // {x, y, w, h, words:[{text,x,w}], align, kind, level, isLast}
    footnotes: [],    // {y, marker, text}
    folio: null,      // {y, text}
    header: null,     // {y, parts}
    spanning: null
  };

  // פס חוצה־טורים — שורותיו ברוחב הפס (מעל הטורים)
  if (page.spanning && page.spanning.lines.length) {
    const left = Math.min(...tpl.columns.map(c => c.x));
    const right = Math.max(...tpl.columns.map(c => c.x + c.w));
    const band = { x: left, y: tpl.contentBox.top, w: right - left, h: page.spanning.heightPx, lines: [] };
    let y = tpl.contentBox.top;
    for (const ln of page.spanning.lines) {
      band.lines.push(projectLine(ln, band.x, y, band.w, settings, measure, 'right'));
      y += ln.heightPx || 0;
    }
    out.spanning = band;
  }

  // **S12 (REQ-EXP-03):** עמודי תוכן־העניינים — שורות בפריסת הרנדרר
  // (toc-rows: top 70, שורה ~24px) — כותרת השורה מימין, התווית משמאל.
  // מצויר גם ב־PDF וגם נכלל בחילוץ הטקסט — עמוד TOC לא ריק.
  if (page.type === 'toc-general' || page.type === 'toc-detail') {
    const rows = (page.toc && page.toc.rows) || [];
    let yi = 0;
    const rowH = 24;
    for (const row of rows) {
      const y = 70 + yi * rowH;
      if (row.kind === 'group') {
        let xi = 0;
        for (const it of row.items || []) {
          const text = [it.text, it.label || ''].filter(Boolean).join(' ');
          out.lines.push(fakeLine(text, 18 + xi, y, 60, rowH, settings, measure));
          xi += 80;
        }
      } else {
        const text = [row.text, row.label || ''].filter(Boolean).join(' ');
        out.lines.push(fakeLine(text, 18, y, tpl.width - 36, rowH, settings, measure));
      }
      yi++;
    }
  }

  // טורים ושורות הגוף
  page.columns.forEach((colLines, ci) => {
    const col = tpl.columns[ci] || { x: 0, w: 0 };
    let y = tpl.contentBox.top + spanOffset;
    for (const ln of colLines) {
      out.lines.push(projectLine(ln, col.x, y, col.w, settings, measure, lastAlignOf(ln, settings)));
      y += ln.heightPx || 0;
    }
  });

  // מרזב הערות — מגובה שמור מטה (fnReservedHeightPx) בתחתית תיבת התוכן
  if (page.footnotes && page.footnotes.length) {
    const fnSize = settings['body-font-size-pt'] * 0.8;
    const lh = Math.round(fnSize * (96 / 72) * 1.2);
    let y = tpl.contentBox.bottom - page.fnReservedHeightPx;
    for (const n of page.footnotes) {
      out.footnotes.push({ y, x: colLeftOf(tpl), w: colWidthOf(tpl), marker: scrubPUAText(String(n.marker || '')), text: scrubPUAText(String(n.text || '')), h: lh });
      y += lh;
    }
  }

  // גיליון
  if (page.folioDisplay) {
    // **D-81:** מיקום/רוחב מהמקור היחיד (הקרן, מדידה 10pt) — הכותב וה-ink-bbox צורכים אותו.
    const ft = scrubPUAText(String(page.folioDisplay));
    const fw = Math.max(1, Math.round(measure.measureTextWidth(ft, 10)));
    out.folio = { y: tpl.contentBox.bottom + 2, x: Math.round((tpl.width - fw) / 2), w: fw, sizePt: 10, text: ft };
  }

  // כותרת עליונה — סלוטים חיים (right/center/left) עם טקסט מפורש (D-61)
  if (page.header && page.header.slots) {
    const slots = ['right', 'center', 'left']
      .map(pos => ({ pos, ...page.header.slots[pos] }))
      .filter(s => s && s.text);
    if (slots.length) {
      // **D-81:** סלוט כותרת עליונה — מיקום/רוחב מפורשים מהמקור היחיד (9pt):
      // הכותב, הכותב החי ותיבת הדיו צורכים את אותם מספרים — לא עוד נוסחאות מקומיות.
      out.header = {
        y: Math.max(0, tpl.contentBox.top - 18),
        slots: slots.map(s => {
          const t = scrubPUAText(String(s.text || ''));
          const w = Math.max(1, Math.round(measure.measureTextWidth(t, 9)));
          const x = s.pos === 'right' ? tpl.width - 60 - w : s.pos === 'center' ? Math.round((tpl.width - w) / 2) : 60;
          return { pos: s.pos, align: s.align, text: t, x, w, sizePt: 9 };
        })
      };
    }
  }

  // **S12 (parity):** בסיסי שורות/מרזב/גיליון/כותרת — מודל תיבת שורה אחיד
  attachBaselines(out, settings, measure);

  return out;
}

function colLeftOf(tpl) { return Math.min(...tpl.columns.map(c => c.x)); }
function colWidthOf(tpl) {
  const left = Math.min(...tpl.columns.map(c => c.x));
  const right = Math.max(...tpl.columns.map(c => c.x + c.w));
  return right - left;
}

/** יישור שורה אחרונה לפי ההגדרה (ברירת מחדל center — תואם BASE_CSS). */
function lastAlignOf(ln, settings) {
  if (!ln.isLast) return 'justify';
  const mode = settings['body-last-line-align'] || 'center';
  return mode === 'stretch' ? 'justify' : mode; // stretch בשורה אחרונה = יישור מלא כמו רגילה
}

/**
 * הקרנת שורה בודדת: מילים עם מיקומי x מפורשים (RTL — מימין לשמאל).
 * @param {string} align — 'justify' | 'right' | 'center'
 */
function projectLine(ln, colX, y, colW, settings, measure, align) {
  const sizePt = lineFontSizePt(ln, settings);
  const words = (ln.words || []).map(w => scrubPUAText(String(w).replace(/\u00A0/g, ' '))).filter(Boolean);
  const spaceW = measure.measureTextWidth(' ', sizePt, 0);
  const widths = words.map(w => measure.measureTextWidth(w, sizePt));
  const sumW = widths.reduce((s, w) => s + w, 0);
  const gaps = Math.max(0, words.length - 1);

  // רוחב רווחים: שורת יישור מלאה מפרשת לרוחב הטור (לפחות רווח בסיס);
  // שורה אחרונה — רווח בסיס. AQ stretch מיושם במרווח (הקירוב של המנוע ב־CSS wordSpacing).
  let gapW = spaceW;
  if (align === 'justify' && gaps > 0 && sumW + gaps * spaceW < colW) {
    gapW = (colW - sumW) / gaps;
  }
  if (ln.aqStretch && ln.aqStretch !== 1 && align !== 'justify') {
    gapW = spaceW * ln.aqStretch;
  }

  const lineW = sumW + gaps * gapW;
  let xRight; // הקצה הימני של השורה
  if (align === 'center') xRight = colX + (colW + lineW) / 2;
  else if (align === 'right') xRight = colX + colW;
  else xRight = colX + colW; // justify: מילה ראשונה נצמדת לימין, האחרונה לשמאל

  const wordPos = [];
  let cursor = xRight;
  for (let i = 0; i < words.length; i++) {
    cursor -= widths[i];
    wordPos.push({ text: words[i], x: cursor, w: widths[i] });
    cursor -= gapW;
  }

  return {
    x: colX, y, w: colW, h: ln.heightPx || 0,
    words: wordPos, align, kind: ln.kind || 'paragraph',
    level: ln.level, isLast: !!ln.isLast, sizePt,
    tokenId: ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId),
    // **S12 (parity):** קו בסיס לפי מודל תיבת השורה של CSS —
    // half-leading + ascent (מפרופיל הגופן/מכויל) — אותו חוזה ל־PDF ולרסטר.
    baselineY: null
  };
}

/** השלמת baselineY לכל שורות העמוד (לאחר ההקרנה) — מקור מדידה אחד. */
function attachBaselines(page, settings, measure) {
  const ascent = measure.ascentEm(), descent = measure.descentEm();
  for (const ln of [...(page.spanning ? page.spanning.lines : []), ...page.lines]) {
    const sizePx = ln.sizePt * (96 / 72);
    const contentH = (ascent + descent) * sizePx;
    const halfLeading = (ln.h - contentH) / 2;
    ln.baselineY = ln.y + Math.max(0, halfLeading) + ascent * sizePx;
    ln.ascentPx = ascent * sizePx;
    ln.descentPx = descent * sizePx;
  }
  if (page.footnotes) {
    for (const fn of page.footnotes) { fn.baselineY = fn.y + ascent * 11 * (96 / 72); }
  }
  if (page.folio) page.folio.baselineY = page.folio.y + 10;
  if (page.header) page.header.baselineY = page.header.y + 10;
}

/** שורה מלאכותית (TOC/עזר) — מילה אחת מימין לשמאל; מיקום מפורש. */
function fakeLine(text, x, y, w, h, settings, measure) {
  const sizePt = 12;
  const words = String(text || '').split(/\s+/).filter(Boolean).map(w2 => scrubPUAText(w2));
  const widths = words.map(w2 => measure.measureTextWidth(w2, sizePt, 0));
  const gapW = measure.measureTextWidth(' ', sizePt, 0);
  let cursor = x + w;
  const wordPos = [];
  for (let i = 0; i < words.length; i++) {
    cursor -= widths[i];
    wordPos.push({ text: words[i], x: cursor, w: widths[i] });
    cursor -= gapW;
  }
  return { x, y, w, h, words: wordPos, align: 'right', kind: 'toc-row', level: null, isLast: false, sizePt, baselineY: null, tokenId: null };
}

/**
 * הקרנת מסמך שלם (כל העמודים) + תיבת דיו (ink bbox) לכל עמוד —
 * לבדיקת ה־parity (raster מול מודל).
 */
function projectDocument(result, settings, api) {
  const pages = result.pages.map(p => projectPage(p, settings, api));
  const ascent = (api || new MeasureAPI(settings, 'table')).ascentEm();
  const descent = (api || new MeasureAPI(settings, 'table')).descentEm();
  const inkBounds = pages.map(pg => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const acc = (x, y, w, h) => {
      if (x < minX) minX = x; if (x + w > maxX) maxX = x + w;
      if (y < minY) minY = y; if (y + h > maxY) maxY = y + h;
    };
    for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
      for (const w of ln.words) {
        if (!w.text.trim()) continue;
        const sizePx = ln.sizePt * (96 / 72);
        // דיו צמוד לגליפים: בסיס − (ascent×0.93) עד בסיס + descent; צדדים — תיבת המילה
        acc(w.x, ln.baselineY - ascent * sizePx * 0.93, w.w, (ascent * 0.93 + descent) * sizePx);
      }
    }
    for (const fn of pg.footnotes) if ((fn.marker + fn.text).trim()) acc(fn.x, fn.baselineY - 9, fn.w, 14);
    // **D-81:** כל טקסט מצויר נכנס לתיבת הדיו — גם גיליון וגם סלוטי כותרת עליונה,
    // במיקום/רוחב של המקור היחיד (הקרן). בעבר הכותרת לא נצברה כלל ⇒ המודל היה
    // צר מהרסטר בעמודים עם כותרת — פער שנחשף בחיזוק בדיקת הקבלה (S13, 03.11).
    if (pg.folio && pg.folio.text) {
      const w = pg.folio.w != null ? pg.folio.w : Math.max(20, pg.folio.text.length * 6);
      const x = pg.folio.x != null ? pg.folio.x : (pg.width - w) / 2;
      const by = pg.folio.baselineY != null ? pg.folio.baselineY : pg.folio.y + 10;
      acc(x, by - 10, w, 16);
    }
    if (pg.header) {
      for (const s of pg.header.slots || []) {
        if (!s.text || !s.text.trim()) continue;
        const w = s.w != null ? s.w : s.text.length * 5.5;
        const x = s.x != null ? s.x : (s.pos === 'right' ? pg.width - 60 - w : s.pos === 'center' ? (pg.width - w) / 2 : 60);
        const by = pg.header.baselineY != null ? pg.header.baselineY : pg.header.y + 10;
        acc(x, by - 10, w, 15);
      }
    }
    if (minX === Infinity) return null;
    return { minX, minY, maxX, maxY };
  });
  return { pages, inkBounds, layoutHash: result.layoutHash };
}

module.exports = { projectPage, projectLine, projectDocument, lineFontSizePt, attachBaselines };
