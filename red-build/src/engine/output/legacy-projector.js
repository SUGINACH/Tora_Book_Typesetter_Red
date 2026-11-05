// src/engine/output/legacy-projector.js — הקרנת עמודי פרופיל IMUD לגיאומטריה מפורשת.
'use strict';

/**
 * **S4.9:** מקרן ייעודי לעמודי legacy-imud-flow. כל שורה מקבלת מיקום מפורש
 * (x/y/baseline/מילים עם רוחב וגודל פר-מילה) — מותאם לחוזה של writePdf
 * (pages/lines/footnotes/folio/header) ול-pdf_rows של compare.py.
 *
 * הגיאומטריה מקורה אחד: legacy-imud-flow (GEO/SZ) — מכויל מהייחוס.
 */

const { GEO, SZ, parenCenterRaisePx } = require('../layout/legacy-imud-flow');
const { MeasureAPI, registeredFonts, resolveMeasureImpl } = require('../typography/measure-api');
const { ornamentInk, parseSvgPaint, svgToPdfOps } = require('../decoration/ornament-ink'); // **EXT-4:** הדיו — מקור יחיד

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
  // **S4.24 (מילים של תווי-כיוון בלבד — הדבקה לשכן):** כמו ברינדור ה-DOM —
  // מילת RLM/LRM בלבד היא ברוחב אפס; הרווח שמפריד אותה משכנתה נכלל
  // ברוחב השורה ומזיז את המרכוז (זהה לבאג שנמדד ב-DOM החי, עמ' 572).
  // האינדקסים של markers/parenIdx/קצוות ממופים למילה המארחת.
  const FORMAT_WORD_RE = /^[\u200e\u200f\u2066-\u2069\u202a-\u202e\u00ad]+$/;
  let src = words, srcMap = null;
  if (words.some((w) => typeof w === 'string' && FORMAT_WORD_RE.test(w))) {
    const items = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (typeof w === 'string' && FORMAT_WORD_RE.test(w)) {
        if (items.length) { items[items.length - 1].text += w; continue; }
        items.push({ text: w, srcIdx: -1 });
        continue;
      }
      const it = { text: w, srcIdx: i };
      if (items.length === 1 && items[0].srcIdx === -1) { it.text = items[0].text + w; items[0] = it; }
      else items.push(it);
    }
    src = items.map((it) => it.text);
    srcMap = items.map((it) => it.srcIdx);
    const remapArr = (a) => (Array.isArray(a) ? srcMap.map((oi) => (oi >= 0 ? !!a[oi] : false)) : a);
    const remapSet = (s) => {
      if (!s) return s;
      const ns = new Set();
      srcMap.forEach((oi, ni) => { if (oi >= 0 && s.has(oi)) ns.add(ni); });
      return ns;
    };
    opts = {
      ...opts,
      markers: opts.markers ? remapArr(opts.markers) : opts.markers,
      parenIdx: remapSet(opts.parenIdx),
      parenStarts: remapArr(opts.parenStarts),
      parenEnds: remapArr(opts.parenEnds)
    };
  }
  const spaceW = api.measureTextWidth(' ', sizePt, 0);
  // **S4.24 (רווח בגודל הסוגריים):** כמו spaceBetween בשבירה — הרווח בין
  // שתי מילים ששני צדדיהן בתוך (...) נמדד/מוצג ב-10pt (סוגריים = span
  // בגודל מוקטן גם לרווחים הפנימיים — הוכחת S4.15 מהייחוס). בלי זאת
  // שורת-סוגריים רחבה מהטור בדיו וגולשת (נמדד: 4px, עמ' 403). justify
  // מחלק את העודף בחלקים שווים **מעל** הרווחים הטבעיים — בדיוק כמו
  // justify של CSS (התצוגה = הייצוא, כמו S4.23).
  const parenSpaceW = api.measureTextWidth(' ', SZ.body + SZ.parenDelta, 0);
  const placed = src.map((w, i) => {
    if (typeof w === 'object') return w; // כבר ממוקם (חלון/סמן)
    const isMarker = opts.markers && opts.markers[i];
    const isParen = opts.parenIdx && opts.parenIdx.has(i);
    // **EXT-17:** גודל מילת-הסמן בגוף — הגדרת המקור (note-marker-size, ברירת
    // מחדל 8) ולא נגזרת מגודל הגוף.
    const markerSz = opts.markerSize != null ? opts.markerSize : SZ.fnMarker;
    const sz = isMarker ? markerSz : (isParen ? SZ.body + SZ.parenDelta : sizePt);
    return { text: w, w: api.measureTextWidth(w, sz, 0), sizePt: sz, smallKind: isMarker ? 'marker' : (isParen ? 'paren' : null) };
  });
  const sumW = placed.reduce((a, w) => a + w.w, 0);
  const gaps = Math.max(0, placed.length - 1);
  let gapWs = null;
  let naturalSum = 0;
  if (gaps > 0) {
    gapWs = new Array(gaps);
    for (let g = 0; g < gaps; g++) {
      const inParen = !!(opts.parenEnds && opts.parenStarts && opts.parenEnds[g] && opts.parenStarts[g + 1]);
      gapWs[g] = inParen ? parenSpaceW : spaceW;
      naturalSum += gapWs[g];
    }
  }
  if (align === 'justify' && gaps > 0 && sumW + naturalSum < width) {
    const extra = (width - sumW - naturalSum) / gaps;
    for (let g = 0; g < gaps; g++) gapWs[g] += extra;
  }
  const lineW = sumW + naturalSum;
  let xRight;
  if (align === 'center') xRight = xLeft + (width + lineW) / 2;
  else xRight = xLeft + width;
  // **S4.26 (דיווח משתמש: "טקסט מוסגר ממוקם גבוה"):** סוגריים — מרכוז אנכי
  // מול הטקסט הרגיל (parenCenterRaisePx, אותו מודל תיבת-שורה כמו ה-DOM);
  // סמן-הערה נשאר מוגבה כמו super של המקור (0.33×גודל-השורה). בעבר שניהם
  // קיבלו את הגבהת הסמן — הסוגריים ישבו ~5.3px גבוה מדי.
  const parenRaise = parenCenterRaisePx(api.ascentEm(), sizePt, SZ.body + SZ.parenDelta);
  const out = [];
  let cursor = xRight;
  for (let k = 0; k < placed.length; k++) {
    const w = placed[k];
    cursor -= w.w;
    out.push({
      text: w.text, x: cursor, w: w.w,
      sizePt: w.sizePt,
      baselineY: w.smallKind === 'paren' ? baseY - parenRaise
        : (w.smallKind === 'marker' ? baseY - sizePt * (96 / 72) * 0.33 : baseY)
    });
    if (k < gaps) cursor -= gapWs[k];
  }
  return out;
}

/** הקרנת עמוד legacy בודד. */
function projectLegacyPage(pg, settings, api, winApi, headingApi = null) {
  // **S4.26:** headingApi — מדידת/ציור כותרות ב-DavidLibre-Bold (כמו הייחוס
  // וכמו ה-DOM); בלי גופן רשום — גופן הגוף (התנהגות קודמת).
  const hApi = headingApi || api;
  // **EXT-17:** גדלי סמני ההערות מהגדרות המקור (ברירות המחדל: 8/8). ההגדרות
  // של פרופיל IMUD מגיעות ב-_imudRaw (כמו readConfig של העימוד עצמו).
  const imudSet = (settings && settings._imudRaw) || settings || {};
  const projCfg = {
    markerSize: Number(imudSet['note-marker-size']) || 8,
    listingSize: Number(imudSet['note-listing-num-size']) || 8
  };
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
    // **S4.26:** כותרות בגופן הכותרות (DavidLibre-Bold) — מדידה וציור (/F3)
    const words = placeWords(b.text.split(' '), hApi, bandLeft, bandW, b.sizePt, 'center', baseY);
    if (headingApi) for (const w of words) w.fontKey = 'heading';
    out.lines.push({
      x: bandLeft, y: b.y, w: bandW, h: b.h, words, align: 'center',
      kind: b.kind, level: null, isLast: false, sizePt: b.sizePt,
      baselineY: baseY, tokenId: b.tokenId != null ? b.tokenId : null
    });
  }

  // ---- תוכן השערים (ממורכז; מילים נפרדות — חילוץ לוגי, כמו בייחוס) ----
  // **D-89 (עיצוב שערים):** תיבת התוכן של כל שער לפי תיבות השער של המקור
  // (resolveShaarBoxStyle/renderSubShaar/renderBackShaar) — שער-המשנה והשער
  // האחורי ממורכזים בתיבה שמחוץ לפאנל האפור, לא ברוחב הפס המלא:
  //  - sub:  left:15mm / right:95mm ⇒ מרכז 245.7px=184.2pt (נמדד בייחוס עמ' 7: 184 ✓)
  //  - back: מרכז 548px=411pt (נמדד בייחוס עמ' 2: 411 ✓)
  //  - main: left:15mm / right:15mm ⇒ מרכז 396.85px=297.6pt (נמדד עמ' 1: 298 ✓)
  const MMpx = 96 / 25.4;
  const GATE_BOX = {
    'shaar-main': { x: 15 * MMpx, w: GEO.PAGE_W - 30 * MMpx },
    'shaar-back': { x: 95 * MMpx, w: 377.98 },
    'shaar-sub': { x: 15 * MMpx, w: GEO.PAGE_W - 110 * MMpx }
  };
  const gbox = GATE_BOX[pg.type] || { x: bandLeft, w: bandW };
  for (const g of (pg.gateLines || [])) {
    const h = g.sizePt * (96 / 72) * 1.3;
    const baseY = baselineOf(g.y, h, g.sizePt, ascent);
    // **S4.9:** שורות המהדורה והמחבר בשער הראשי נכתבות אצל המקור כרצף אחד —
    // החילוץ מחזיר אותן בסדר מילים הפוך. שאר שורות השער מפוצלות למילים (לוגי).
    const singleOp = g.singleOp === true;
    const words = placeWords(singleOp ? [g.text] : g.text.split(' '), api, gbox.x, gbox.w, g.sizePt, 'center', baseY);
    // **D-89 (עיצוב שערים):** צבע פר-שורה מהמודל — בלוקי השער האחורי
    // (#111/#222/#1e3a8a/#334155/#64748b — הצבעים הקבועים של renderBackShaar
    // במקור, שנמדדו בייחוס עמ' 2) וכו'.
    if (Array.isArray(g.color)) for (const w of words) w.color = g.color;
    out.lines.push({
      x: gbox.x, y: g.y, w: gbox.w, h, words, align: 'center',
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
        // כותרת inline — מילים נפרדות (חילוץ לוגי, כמו בייחוס); גופן הכותרות
        const joined = ln.words.join(' ');
        words = placeWords(joined.split(' '), hApi, col.x, col.w, ln.sizePt, 'center', baseY);
        if (headingApi) for (const w of words) w.fontKey = 'heading';
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
        // **S4.19:** דגלי סוגריים מהמודל — גם בשורות החלון (הסוגריים נפתחים
        // לא פעם בשורות 0-1 של פסקת-חלון; הזיהוי הפר-שורתי הקודם פספס טווחים
        // שנפתחו בשורה קודמת).
        const winParenIdx = new Set();
        if (ln.parenFlags && ln.parenFlags.length === ln.words.length) {
          ln.parenFlags.forEach((p, i) => { if (p) winParenIdx.add(i); });
        }
        const textWords = placeWords(ln.words, api, col.x, textW, ln.sizePt,
          ln.isLast ? 'center' : 'justify', baseY, { parenIdx: winParenIdx,
            parenStarts: Array.isArray(ln.parenStarts) && ln.parenStarts.length === ln.words.length ? ln.parenStarts : null,
            parenEnds: Array.isArray(ln.parenEnds) && ln.parenEnds.length === ln.words.length ? ln.parenEnds : null });
        words = [...winWords, ...textWords];
      } else {
        const align = ln.isLast ? 'center' : 'justify';
        // **S4.26 (חלון שקוע — שורה 1):** שורה 1 של פסקת-חלון (window בלי
        // windowWords) נמדדה במודל ברוחב מוקטן (limitOf של breakPara) —
        // וגם כאן הטקסט מקבל את הרוחב המוקטן ועוטף את מילת-החלון (כמו
        // float:right במקור); עד כאן נמתחה לרוחב מלא.
        const lineW = (ln.window && !ln.windowWords && ln.windowW)
          ? Math.max(40, col.w - ln.windowW) : col.w;
        // **S4.9:** מילים בתוך (...) מרונדרות בגודל הסוגריים המוקטן — בדיוק
        // כפי שנמדדו בשבירה (אחרת השורה רחבה מהטור וגולשת מהעמוד).
        // **S4.19 (סוגריים רב-שורתיים):** הזיהוי הקודם היה פר-שורה (מילה
        // שנפתחת ב'(' עד מילה שנסגרת ב-')' **באותה שורה**) — טווח שנפתח בשורה
        // אחת ונסגר באחרת רונדר בגודל הגוף (11.5pt בהקדמה מול 10pt בייחוס —
        // עמ' 10: 'כהרבה מדיני התורה…'). כעת הדגלים מגיעים מהמודל (חישוב
        // עומק-תווים על כל הפסקה ב-breakPara) — מקור יחיד למדידה ולרינדור.
        const parenIdx = new Set();
        if (ln.parenFlags && ln.parenFlags.length === ln.words.length) {
          ln.parenFlags.forEach((p, i) => { if (p) parenIdx.add(i); });
        } else {
          const stack = [];
          ln.words.forEach((w, i) => {
            if (w.startsWith('(')) stack.push(i);
            if (w.endsWith(')') && stack.length) {
              const from = stack.pop();
              for (let k = from; k <= i; k++) parenIdx.add(k);
            }
          });
        }
        // **D-89 (דיווח משתמש: "כל מילה שצמודה לנקודה מופיעה בגופן קטן"):**
        // זיהוי סמני-ההערה מהמודל בלבד (markerIdx — אינדקסים מדויקים של
        // הסמנים שהוזרקו ב-legacy-imud-flow), עם ולידציית צורה נגד סטיית
        // אינדקס. הביטוי הקודם /^[א-ת]+\.$/ תפס **כל מילה עברית המסתיימת
        // בנקודה** (סוף משפט!) והקטין אותה ל-8pt — 744 מילים בקורפוס
        // ההשוואה. בלי דגל מהמודל — שום מילה לא מוקטנת: מספור האיות
        // ("א. ב. ג." בגוף המשפט) נשאר בגודל הגוף — כפי שנמדד בייחוס
        // (עמ' 12: 91 סמני איות ב-12.0pt = גודל הגוף; רק סמני ההערות
        // האמיתיים — מהסוגריים — ב-6–8pt).
        const markerIdxSet = Array.isArray(ln.markerIdx) ? new Set(ln.markerIdx) : null;
        const MARKER_WORD_RE = /^[א-ת]{1,3}[.:]?$/; // א. / בק. — גימטריה קצרה (±מפריד)
        const isMarkerWord = (w, i) => !!(markerIdxSet && markerIdxSet.has(i) && MARKER_WORD_RE.test(w));
        words = placeWords(ln.words, api, col.x, lineW, ln.sizePt, align, baseY,
          { markers: ln.words.map((w, i) => isMarkerWord(w, i)), parenIdx,
            parenStarts: Array.isArray(ln.parenStarts) && ln.parenStarts.length === ln.words.length ? ln.parenStarts : null,
            parenEnds: Array.isArray(ln.parenEnds) && ln.parenEnds.length === ln.words.length ? ln.parenEnds : null,
            markerSize: projCfg.markerSize });
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
  // **D-89:** צבע הערות-הצד — #404040 כמו שנמדד בייחוס (6pt, עמ' 12/31: המחלקה
  // margin-note במקור מעוצבת באפור כהה).
  const MARGIN_NOTE_COLOR = [64 / 255, 64 / 255, 64 / 255];
  for (const mn of (pg.marginNotes || [])) {
    const x = mn.side === 'right' ? GEO.MARGIN_R_X : GEO.MARGIN_L_X;
    for (const l of mn.lines) {
      const baseY = baselineOf(l.y, GEO.MN_PITCH, SZ.marginNote, ascent);
      const words = placeWords(l.text.split(' '), api, x, GEO.MARGIN_W, SZ.marginNote, 'center', baseY);
      for (const w of words) w.color = MARGIN_NOTE_COLOR;
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
  // **D-89 (דיווח משתמש: "בהערות השוליים יש מילים אחת על השניה"):**
  // בעבר כל שורות ההערה שורטטו על בסיס אחד (baselineOf של השורה הראשונה)
  // וכל שורה התחילה מאותו x — הערה רבת-שורות נערמה כולה על עצמה.
  // כעת: בסיס פר-שורה (l.y), השורה הראשונה נגרעת מרוחב הסמן ומיושרת
  // לשני הצדדים עד הסמן, שורות הביניים מיושרות לרוחב מלא, והשורה
  // האחרונה מיושרת לשפה הימנית — כפי שנמדד בייחוס (עמ' 31: שורה-1
  // x:91–494 מיושרת; שורה-2 x:383–505 מיושרת-ימין; סמן '.א' ב-x:496–505).
  for (const fn of (pg.footnotes || [])) {
    // **S4.26 (זרימה רציפה):** כל ההערות בזרם אחד — סמנים בגודל הרישום,
    // יישוב לשני הצדדים בכל שורה חוץ מהאחרונה (לימין), המשך ב-'(המשך)'
    // בלי אות סימון. שורות הזרימה מהמודל (fnFlowFor) — מקור יחיד.
    if (fn.continuous) {
      const rightEdge = GEO.COL_L_X + 2 * GEO.COL_W + 13.48;
      const spaceW = api.measureTextWidth(' ', SZ.fnBody, 0);
      const usableW = rightEdge - GEO.COL_L_X;
      const words = [];
      fn.lines.forEach((l, li) => {
        const baseY = baselineOf(l.y, GEO.FN_PITCH, SZ.fnBody, ascent);
        const isLast = li === fn.lines.length - 1;
        const toks = (l.words || []).filter(t => !t.gap);
        const ws = toks.map(t => ({
          text: t.t,
          sizePt: t.mk ? projCfg.listingSize : SZ.fnBody,
          w: api.measureTextWidth(t.t, t.mk ? projCfg.listingSize : SZ.fnBody, 0)
        }));
        const sumW = ws.reduce((a, w) => a + w.w, 0);
        const gaps = Math.max(0, ws.length - 1);
        let gapW = spaceW;
        if (!isLast && gaps > 0 && sumW + gaps * spaceW < usableW) {
          gapW = (usableW - sumW) / gaps; // יישוב לשני הצדדים — כמו הגוף
        }
        let cursor = rightEdge;
        for (let i = ws.length - 1; i >= 0; i--) {
          cursor -= ws[i].w;
          words.push({ text: ws[i].text, x: cursor, w: ws[i].w, sizePt: ws[i].sizePt, baselineY: baseY });
          cursor -= gapW;
        }
      });
      if (words.length) {
        out.footnotes.push({
          y: fn.lines[0].y, x: GEO.COL_L_X, w: 2 * GEO.COL_W + 13.48, marker: '',
          text: fn.lines.flatMap(l => (l.words || []).filter(t => !t.gap).map(t => t.t)).join(' '),
          words, baselineY: null, h: fn.lines.length * GEO.FN_PITCH
        });
      }
      continue;
    }
    const rightEdge = GEO.COL_L_X + 2 * GEO.COL_W + 13.48;
    const spaceW = api.measureTextWidth(' ', SZ.fnBody, 0);
    const words = [];
    let firstBase = null;
    let firstRight = rightEdge;
    // **S4.24:** המשך הערה מקוצצת — '(המשך)' לפני הסמן (כמו ה-DOM והנתיב המודרני)
    if (fn.cont) {
      const pTxt = '(המשך)';
      const pw = api.measureTextWidth(pTxt, SZ.fnBody, 0);
      firstRight -= pw;
      words.push({ text: pTxt, x: firstRight, w: pw, sizePt: SZ.fnBody, baselineY: null });
      firstRight -= spaceW;
    }
    if (fn.marker) {
      // **EXT-17:** סמן הרישום בגודל עצמאי (note-listing-num-size, ברירת מחדל 8).
      const msz = projCfg.listingSize;
      const mw = api.measureTextWidth(fn.marker, msz, 0);
      firstRight -= mw;
      words.push({ text: fn.marker, x: firstRight, w: mw, sizePt: msz, baselineY: null });
      firstRight -= spaceW;
    }
    fn.lines.forEach((l, li) => {
      const baseY = baselineOf(l.y, GEO.FN_PITCH, SZ.fnBody, ascent);
      if (firstBase === null) {
        firstBase = baseY;
        if (words.length) words[0].baselineY = firstBase; // הסמן על בסיס השורה הראשונה
      }
      const isLast = li === fn.lines.length - 1;
      const lineRight = li === 0 ? firstRight : rightEdge;
      const usableW = Math.max(0, lineRight - GEO.COL_L_X);
      const ws = l.words.map(w => ({ text: w, w: api.measureTextWidth(w, SZ.fnBody, 0) }));
      const sumW = ws.reduce((a, w) => a + w.w, 0);
      const gaps = Math.max(0, ws.length - 1);
      let gapW = spaceW;
      if (!isLast && gaps > 0 && sumW + gaps * spaceW < usableW) {
        gapW = (usableW - sumW) / gaps; // יישוב לשני הצדדים (כמו הייחוס)
      }
      let cursor = lineRight;
      for (let i = ws.length - 1; i >= 0; i--) {
        cursor -= ws[i].w;
        words.push({ text: ws[i].text, x: cursor, w: ws[i].w, sizePt: SZ.fnBody, baselineY: baseY });
        cursor -= gapW;
      }
    });
    if (words.length) {
      out.footnotes.push({ y: fn.lines[0].y, x: GEO.COL_L_X, w: 2 * GEO.COL_W + 13.48, marker: fn.marker, text: fn.lines.map(l => l.words.join(' ')).join(' '), words, baselineY: firstBase, h: fn.lines.length * GEO.FN_PITCH });
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
      // כותרת מימין (במדרגות לפי רמה), מספר משמאל; **S4.26:** בגופן הכותרות
      // (DavidLibre-Bold — כמו הייחוס: כל שורות ה-TOC ב-DavidLibre-Bold)
      const tW = hApi.measureTextWidth(r.text, r.sizePt, 0);
      const textWords = placeWords([r.text], hApi, r.x1 - tW, tW, r.sizePt, 'right', baseY);
      if (headingApi) for (const w of textWords) w.fontKey = 'heading';
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
  // **D-89:** צבע הכותרת — כחול-הייחוס #0F1749 (נמדד בייחוס בכל עמודי
  // הגוף/התוכן: הגליפים מצוירים כקטועים ב-(15,23,73)) — ברירת מחדל
  // שחורה כשאין (נתיב DP).
  const HDR_COLOR = [15 / 255, 23 / 255, 73 / 255];
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
        s.color = pg.headerSlots.color || HDR_COLOR;
        for (const w of s.words) w.color = s.color;
      }
      out.header = { y: GEO.HEADER_BASELINE - 14, baselineY: GEO.HEADER_BASELINE, slots };
    }
  }

  // **EXT-4 (הדיו — נתיב legacy):** אם למודל ה-legacy יש rectים של עיטורים
  // (טרם מיוצרים כברירת מחדל — הגדרות המקור ללא עיטורים; התשתית מוכנה
  // לחיבור ornament-plan בעתיד) — הם מוקרנים עם אותו דיו (ornament-ink)
  // כמו בנתיב ה-DP: pdfOps לכותב ה-PDF ו-data-URI ל-DOM.
  if (pg.decorations && pg.decorations.length) {
    const hPt = out.height * (72 / 96);
    const PX_TO_PT = 72 / 96;
    const r2 = (v) => Math.round(v * 100) / 100;
    const cssColor = (c) => `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
    out.decorations = pg.decorations.map((d) => {
      const ink = d.image ? { type: 'image', uri: d.image } : ornamentInk(d.kindStyle);
      let paint = null, pdfOps = null;
      if (ink && ink.type === 'svg') {
        paint = parseSvgPaint(ink.svg);
        if (paint) pdfOps = svgToPdfOps(paint, d, hPt, PX_TO_PT);
      } else if (ink && ink.type === 'rect') {
        // **D-89:** מלבן בצבע אחיד — פאנלי השערים, מסגרות וכלל הכותרת.
        const yTop = hPt - (d.y + d.h) * PX_TO_PT;
        pdfOps = [`${r2(ink.color[0])} ${r2(ink.color[1])} ${r2(ink.color[2])} rg ${r2(d.x * PX_TO_PT)} ${r2(yTop)} ${r2(d.w * PX_TO_PT)} ${r2(d.h * PX_TO_PT)} re f`];
      } else if (ink && ink.type === 'rule') {
        const yTop = hPt - (d.y + d.h) * PX_TO_PT;
        pdfOps = [`0 0 0 rg ${r2(d.x * PX_TO_PT)} ${r2(yTop)} ${r2(d.w * PX_TO_PT)} ${Math.max(0.5, r2(d.h * PX_TO_PT))} re f`];
      }
      return {
        x: d.x, y: d.y, w: d.w, h: d.h, kind: d.kind || null, slot: d.slot || null,
        kindStyle: d.kindStyle || null, inkType: ink ? ink.type : null,
        inkUri: ink && ink.uri ? ink.uri : null,
        inkColor: ink && ink.type === 'rect' ? cssColor(ink.color) : null,
        paint, pdfOps
      };
    });
  }

  return out;
}

const FLOW_BOTTOM_DEFAULT = GEO.FLOW_TOP + GEO.FLOW_H;
const TOC_TITLE_Y_OFFSET = 136; // כותרת ה-TOC ב-309px = FLOW_TOP+212.4 — מכויל

/** הקרנת מסמך legacy שלם. */
function projectLegacyDocument(result, settings) {
  // **EXT-13:** אותו מקור מדידה כמו העימוד (legacyTypeset) — הקרנה ומילוי
  // לא יכולים להתפצל: רוחב שורה שונה ביניהם = חפיפות/גלישות מדומות.
  const impl = resolveMeasureImpl(settings);
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
  // **S4.26 (גופן כותרות בהקרנה):** DavidLibre-Bold — אותו גופן כמו המדידה
  // ב-legacyTypeset (env.headingFontBytes) וכמו ה-DOM; הציור ב-/F3.
  let headingApi = null;
  if (impl === 'font-metrics' && registeredFonts.has('DavidLibre-Bold')) {
    headingApi = new MeasureAPI({ 'body-font': 'DavidLibre-Bold', 'body-font-size-pt': SZ.body }, 'font-metrics');
  }
  const pages = result.pages.map(p => projectLegacyPage(p, settings, api, winApi, headingApi));
  return { pages, inkBounds: pages.map(() => null), layoutHash: result.layoutHash };
}

module.exports = { projectLegacyPage, projectLegacyDocument };
