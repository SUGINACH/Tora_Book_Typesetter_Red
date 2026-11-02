// src/engine/decoration/headers-builder.js — Running heads recto/verso 3×2 (REQ-HDR-01/02, S9)
'use strict';

/**
 * **S9 (D-61) — עצמאות מלאה של כל סלוט:** לכל אחד מששת הסלוטים (recto/verso × ימין/מרכז/שמאל):
 * מקור, יישור, גופן, גודל, רוחב% וטקסט־מותאם — כולל סלוט המרכז בו־ורסו
 * (**תיקון IMUD bc7892f נעול לנצח:** בכל הגרסאות הקודמות הפקדים של סלוט‑המרכז‑בו־ורסו
 * היו קיימים ב‑UI אך לא נקראו מעולם — גודל הגופן והטקסט המותאם הוזנקו).
 *
 * מקורות (REQ-HDR-02): none / book-name (חלק ראשי לפי פיצול במקף) / book-name-rest
 * (החלק שאחרי המקף) / h1 (מצב main|full לפי hdr-h1-title-mode) / h2 / page-num /
 * first-word / last-word / first-last-words (פורט IMUD fillHeaderFirstLastWords:
 * "ראשונה – אחרונה") / custom (טקסט מותאם **לסלוט זה**).
 */

/** חלוקת שם במקף ראשון: main = לפני המקף, rest = אחריו (Orange extractH1TitleMain ✓). */
function extractH1TitleMain(text, mode = 'main') {
  if (mode === 'full') return text;
  const parts = String(text).split(/\s+[-–—]\s+/);
  return parts[0] || text;
}
function extractTitleRest(text) {
  const parts = String(text).split(/\s+[-–—]\s+/);
  return parts.length > 1 ? parts.slice(1).join(' – ') : '';
}

/** גידוע מעגליות same_as (Orange c49b79e): מפת ירושה חד‑כיוונית + seen-set.
 *  ב‑Red הירושה היחידה היא verso→recto (header-verso-same-as-recto), כך שמבנית
 *  אין מעגל — אך הגידוע מפורש ונבדק כך שהוספת ירושה עתידית לא תוכל ליצור לולאה. */
function resolveSameAs(side, settings) {
  const seen = new Set([side]);
  let cur = side;
  while (cur === 'verso' && settings['header-verso-same-as-recto']) {
    cur = 'recto';
    if (seen.has(cur)) return side; // מעגליות — נשברת: חזרה לצד המקורי
    seen.add(cur);
  }
  return cur;
}

/** ניקוי פיסוק קצה (פורט TRIM מ־IMUD fillHeaderFirstLastWords):
 *  מילת פתיחה/סיום של עמוד לא נפתחת או מסתיימת בסימני פיסוק/מרכאות/סוגריים. */
const EDGE_PUNCT = /^[\s"'“”‘’(){}\[\]<>.,;:!?\-–—…]+|[\s"'“”‘’(){}\[\]<>.,;:!?\-–—…]+$/g;
function trimEdgePunctuation(word) {
  return String(word == null ? '' : word).replace(EDGE_PUNCT, '');
}

/** פורט fillHeaderFirstLastWords (IMUD, הועבר מ‑V20.4): "מילה ראשונה – מילה אחרונה".
 *  עמוד ללא טקסט ⇒ ריק. מילה יחידה ⇒ היא בלבד. */
function firstLastWordsText(firstWord, lastWord) {
  const f = trimEdgePunctuation(firstWord);
  const l = trimEdgePunctuation(lastWord);
  if (f && l && f !== l) return `${f} \u2013 ${l}`;
  return f || l;
}

function resolveSlot(source, ctx, settings, slotKey) {
  switch (source) {
    case 'none': return '';
    case 'book-name': return extractH1TitleMain(ctx.bookName || '', 'main');
    case 'book-name-rest': return extractTitleRest(ctx.bookName || '');
    case 'h1': return extractH1TitleMain(ctx.h1 || '', settings['hdr-h1-title-mode']);
    case 'h2': return ctx.h2 || '';
    case 'page-num': return ctx.pageNumber || '';
    case 'first-word': return ctx.firstWord || '';
    case 'last-word': return ctx.lastWord || '';
    case 'first-last-words': return firstLastWordsText(ctx.firstWord, ctx.lastWord);
    case 'custom': return slotKey ? String(settings[slotKey] || '') : (ctx.customText || '');
    default: return '';
  }
}

/** האם העמוד נפתח בכותרת H2/H3 (שורת התוכן הראשונה בסדר קריאה) — לכותרת הייעודית. */
function pageOpensWithH2H3(page) {
  const lv = page && page.opensWithHeadingLevel;
  return lv === 2 || lv === 3;
}

/**
 * בניית כותרת עליונה לעמוד.
 * @param {object} page - {index,isRecto,type,firstWord,lastWord,h1,h2,pageNumberDisplay,
 *                          opensWithHeadingLevel,template:{hasRunningHead}}
 * @param {object} settings
 * @param {object} ctx - {bookName}
 * @returns {{side,slots:{right,center,left},separator}|null}
 *          slot = {source,text,align,widthPct,font,sizePt,customText}
 */
function buildHeader(page, settings, ctx) {
  if (!settings['header-enabled'] || !page.template.hasRunningHead) return null;
  const physical = page.isRecto ? 'recto' : 'verso';
  // REQ-HDR-02: עמוד הנפתח ב‑H2/H3 + header-opening-dedicated ⇒ סלוטי מקור ייעודיים
  const dedicated = settings['header-opening-dedicated'] === true && pageOpensWithH2H3(page);
  // **D-36 + REQ-HDR-02:** עמוד פתיחה (פרק/סימן) ללא כותרת עליונה — אלא אם הופעלה
  // הכותרת הייעודית לפותחות H2/H3 (ברירת מחדל כבויה — התנהגות ≤S8 נשמרת).
  if (page.chapterOpening && !dedicated) return null;
  const sourceSide = dedicated ? 'opening' : resolveSameAs(physical, settings);
  // טקסט מותאם תמיד מהצד הפיזי של העמוד (סלוטי הפתיחה יורשים — D-61)
  const customSide = dedicated ? physical : sourceSide;
  const out = { side: physical, dedicated, slots: {} };
  for (const pos of ['right', 'center', 'left']) {
    // מקור: מהצד החל על העמוד (opening/recto/verso אחרי ירושה); גופן/גודל/יישור/רוחב — תמיד מהצד הפיזי (D-61)
    const source = settings[`header-${sourceSide}-${pos}-source`];
    const customText = settings[`header-${customSide}-${pos}-custom-text`];
    out.slots[pos] = {
      source,
      text: resolveSlot(source, {
        ...ctx,
        pageNumber: page.pageNumberDisplay,
        firstWord: page.firstWord,
        lastWord: page.lastWord,
        customText,
      }, settings, `header-${customSide}-${pos}-custom-text`),
      align: settings[`header-${physical}-${pos}-align`],
      widthPct: settings[`header-${physical}-${pos}-width-pct`],
      font: settings[`header-${physical}-${pos}-font`],
      sizePt: settings[`header-${physical}-${pos}-size-pt`],
      customText,
    };
  }
  out.separator = settings['header-separator-line'];
  return out;
}

module.exports = {
  buildHeader, extractH1TitleMain, extractTitleRest, resolveSlot,
  resolveSameAs, firstLastWordsText, pageOpensWithH2H3, trimEdgePunctuation,
};
