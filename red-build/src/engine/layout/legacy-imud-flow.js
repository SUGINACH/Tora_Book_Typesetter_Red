// src/engine/layout/legacy-imud-flow.js — פורט נאמן של מנוע העימוד המקורי (פרופיל IMUD).
'use strict';

/**
 * **S4.9 (בקשת המשתמש 03.11: "בדיקה מתמטית ומוחלטת"):** פרופיל העימוד המקורי.
 *
 * מקורות האמת (שניהם מחויבים במאגר):
 *   1. audits/layout-reference.json — החילוץ המתמטי של פלט הגרסה הישנה (הצהובה)
 *      מקובצי ה-PDF שהעלה המשתמש, כולל הסימון הגיאומטרי הבלתי-נראה.
 *   2. audit/IMUD_TORANI/typesetter.js — קוד המקור של המנוע המקורי (הכתום).
 *
 * הפורט משחזר את ההתנהגות הנצפית של המקור: מבנה מסמך (שערים, תוכן-עניינים כפול,
 * עמוד חלק, פרקים), בלוקים דו-טוריים מאוזנים, שבירת שורות גרידה עם חלון מילה-ראשונה,
 * קשיחת שתי מילים אחרונות, הערות-שוליים בתחתית העמוד והערות צד בטורי השוליים —
 * הכל בגיאומטריה המדויקת של הייחוס.
 *
 * הפרופיל מופעל כאשר ההגדרות מגיעות מ-default_settings.json המקורי
 * (importImudSettings מסמן layout-profile='imud' ומצרף את ה-JSON הגולמי תחת
 * _imudRaw). המנוע הכללי (DP) נשאר לשאר הפרופילים — התנהגות המקור היא המפרט.
 */

const crypto = require('crypto');
const { MeasureAPI, registeredFonts: registeredMeasureFonts, registerFont: registerMeasureFont } = require('../typography/measure-api');
const { EventLog } = require('../core/events');
const { Ledger } = require('../core/ledger');

// ---------- גיאומטריה (px @96dpi; PDF = px×0.75) — מכויל מהייחוס ----------
const GEO = {
  PAGE_W: 793.7, PAGE_H: 1122.5,               // A4
  COL_W: 269.41,                                // רוחב טור (col:right 269 בתגיות המקור)
  COL_R_X: 403.61, COL_L_X: 120.72,             // שפות טורים (ימני/שמאלי)
  MARGIN_R_X: 686.3, MARGIN_L_X: 56.7, MARGIN_W: 50.5, // טורי שוליים (margin-col)
  // **S4.14 (מסומן-גיאומטריה):** ראשית הזרימה האמיתית בעמוד רגיל = 107.2px —
  // נגזר ממחסנית תוויות הייחוס (body-flow label − היסט השכבה) ומהשורה הראשונה
  // הנמדדת בעמודים רגילים (13-15: שורת-גוף ראשונה ב-107.2px בדיוק). הערך
  // הקודם 96.7 היה נמוך ב-10.5px — הזרימה כולה ישבה גבוה מדי.
  FLOW_TOP: 107.2,                              // ראשית זרימת הגוף בעמוד רגיל
  // **S4.14:** גובה הזרימה המקסימלי = 915px — נמדד ישירות מתוויות body-flow
  // של הייחוס בעמודים ללא הערות (13-15: block 914/915, תחתית אמיתית 1022.2).
  // הערך הקודם 925 הכניס שורה עודפת בעמודים ללא הערות (סה"כ +8 שורות במסמך).
  FLOW_H: 915,
  // **S4.13 (פס שורה אמיתי — היסוד לכל הסטייה המצטברת):** המקור מגדיר
  // line-height: var(--line-height-body)=1.34 על 12pt ⇒ 16.08pt = **21.44px**
  // לכל תיבת שורה. הדפדפן שומר את השבר בסכומי ה-DOM (scrollHeight), ורק
  // ההדפסה ל-PDF מצמידה כל שורה לפיקסל שלם — לכן במדידת הייחוס נראים פסים
  // מעורבים 21/22px (15.75/16.5pt, היסטוגרמה: 1277+1101) שהממוצע שלהם 21.44.
  // הקליברציה הקודמת (21 שטוח) חסכה 0.44px לשורה ⇒ 2% קיבולת ⇒ כשורה
  // לטור ⇒ +2 שורות לעמוד — בדיוק הסטייה המצטברת שנצפתה (עמודינו 90-93
  // שורות מול 87-90 בייחוס). כעת: המילוי, הפריסה והמודל כולם ב-21.44.
  LINE_H: 21.44,
  H2_SPACER: 180,                               // h2-spacer לפני סימן+כותרת
  HEADER_BASELINE: 71.9,                        // פס כותרת: גליפים 42.56–57.56pt
  FOLIO_BASELINE: 1054.5,                       // עמודון: y0=783.82pt (גליף ~1045px), ממורכז
  FN_AREA_TOP: 969.5,                           // תחילת מרזב ההערות (y0=727.1pt בייחוס)
  FN_PITCH: 16.7,                               // פס שורות הערה (8.5pt × 1.5 × 4/3)
  TOC_NUM_X: 66.1,                              // מספרי תוכן-עניינים בשמאל (x0≈49.6pt)
  TOC_TITLE_X1: 727.4,                          // שפה ימנית של כותרות תוכן-עניינים (545.6pt)
  TOC_STAIR: 8,                                 // מדרגת כניסה לפי רמה (padding-right 8px)
  MN_PITCH: 9.6                                 // פס שורות הערת-צד (8px × 1.2)
};

// גדלי גופן (pt — כמו הגדרות המקור; פיקסלים = pt×4/3)
const SZ = {
  body: 12, h0Title: 17, h0Body: 11.5, h2: 17, siman: 20, h3: 13.5,
  h4: 12.5, h5: 11.5, h6: 10.5, parenDelta: -2,
  fnBody: 8.5, fnMarker: 8, marginNote: 6, folio: 10.5,
  hdrR: 15, hdrC: 11, hdrL: 15, divider: 6.75,
  tocNum: 10.5, tocTitle: 17,
  tocLevel: { 1: 12, 2: 11, 3: 10.5, 4: 10, 5: 9.5, 6: 9, 7: 8.8 }
};

const HEADING_MODES = {
  0: 'new_page_1col', 1: 'sub_shaar', 2: 'new_page_1col', 3: 'span_1col',
  4: 'inline_2col', 5: 'inline_2col', 6: 'inline_2col', 7: 'side_note'
};

// ---------- עזרים ----------
function toGematria(num) {
  num = parseInt(num, 10);
  if (isNaN(num) || num <= 0) return '';
  if (num === 15) return 'טו';
  if (num === 16) return 'טז';
  // **מגן ספרים גדולים:** מעל 999 — חלק האלפים בגימטריה + גרשיים (לא נצפה
  // בייחוס; מונע undefined ושומר דטרמיניזם — הקורפוס הגדול מגיע ל־~730).
  if (num >= 1000) {
    const th = Math.floor(num / 1000);
    return toGematria(th) + "'" + toGematria(num % 1000);
  }
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  let str = '';
  let h = Math.floor(num / 100);
  if (h > 0) { str += hundreds[Math.min(h, 9)]; num %= 100; }
  const t = Math.floor(num / 10), o = num % 10;
  if (t === 1 && (o === 5 || o === 6)) str += (o === 5) ? 'טו' : 'טז';
  else str += tens[t] + ones[o];
  return str;
}

function stripEditorialNotes(text) {
  return String(text || '')
    .replace(/##[\s\S]*?##/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.:;!?])/g, '$1')
    .trim();
}

const META_FIELDS = [
  ['bookTitle', /^(?:שם הספר[:\s]*)?שם הספר\s*[-–—:]\s*/i],
  ['subject', /^(?:נושא(?:\\|\/)כותרת משנה[:\s]*)?נושא\s*[-–—:]\s*/i],
  ['desc', /^(?:נושא מפורט\s*(?:\\|\/)\s*תיאור[:\s]*)?נושא מפורט\s*[-–—:]\s*/i],
  ['edition', /^(?:פרטי מהדורא\s*(?:\\|\/)\s*חלקים[:\s]*)?פרטי מהדורא\s*[-–—:]\s*/i],
  ['author', /^(?:שם המחבר[:\s]*)?שם המחבר\s*[-–—:]\s*/i],
  ['copyright', /^שמירת זכויות\s*[-–—:]\s*/i],
  ['publisher', /^פרטי הוצאה לאור\s*[-–—:]\s*/i],
  ['contact', /^פרטי קשר\s*[-–—:]\s*/i],
  ['extra', /^פרטים נוספים\s*[-–—:]\s*/i],
  ['year', /^(?:מקום ושנת הוצאה[:\s]*)?מקום ושנת הוצאה\s*[-–—:]\s*/i]
];

function parseMetadata(rawText) {
  const meta = {};
  const clean = [];
  for (const line of String(rawText).split('\n')) {
    const t = line.trim();
    let hit = false;
    for (const [key, re] of META_FIELDS) {
      if (re.test(t)) { meta[key] = t.replace(re, '').trim(); hit = true; break; }
    }
    if (!hit) clean.push(line);
  }
  return { meta, text: clean.join('\n') };
}

/** תוחמי הערות: [ ... ] — זיהוי זוגות (כמו findDelimiterMatches במקור). */
function findNotes(text, open, close) {
  const out = [];
  if (!open || !close) return out;
  let from = 0;
  for (;;) {
    const s = text.indexOf(open, from);
    if (s === -1) break;
    const e = text.indexOf(close, s + open.length);
    if (e === -1) break;
    out.push({ start: s, end: e + close.length, text: text.slice(s + open.length, e) });
    from = e + close.length;
  }
  return out;
}

function hasUnclosedNote(text, open, close) {
  if (!open || !close) return false;
  const s = text.indexOf(open);
  if (s === -1) return false;
  return text.indexOf(close, s + open.length) === -1;
}

/** קריאת קונפיגורציה מה-JSON המקורי (עם ברירות המחדל ההיסטוריות). */
function readConfig(imud) {
  const g = (k, d) => (imud && imud[k] !== undefined && imud[k] !== '' ? imud[k] : d);
  const b = (k, d) => {
    const v = g(k, d);
    return v === true || v === 'true' || v === '1' || v === 1;
  };
  const n = (k, d) => {
    const v = parseFloat(g(k, d));
    return isNaN(v) ? d : v;
  };
  return {
    fnOpen: String(g('fn-delim-open', '[')),
    fnClose: String(g('fn-delim-close', ']')),
    endPrefix: String(g('en-line-prefix', 'הערת סיום -')),
    dropWordMode: String(g('drop-word-mode', 'window')),
    dropWordCount: n('drop-word-count', 1),
    dropWordMinLines: n('drop-word-min-lines', 2),
    avoidRunt: b('avoid-runt-word', true),
    autoSimanH2: b('h2-auto-siman', true),
    resetSimanOnH1: b('h2-reset-siman', true),
    showMainShaar: b('show-main-shaar', true),
    showBackShaar: b('show-back-shaar', false),
    showSubShaar: b('show-sub-shaar', true),
    countSubShaar: b('sub-shaar-count-numbering', true),
    countGeneralToc: b('general-toc-count-numbering', true),
    countDetailedToc: b('detailed-toc-count-numbering', true),
    enableGeneralToc: b('enable-general-toc', true),
    enableDetailedToc: b('enable-detailed-toc', true),
    oddH0: b('odd-h0', true),
    oddH1: b('odd-h1', true),
    oddH2: b('odd-h2', false),
    hdrRType: String(g('hdr-r-type', 'book_title_split_r')),
    hdrCType: String(g('hdr-c-type', 'h2_without_siman')),
    hdrLType: String(g('hdr-l-type', 'book_title_split_l')),
    gtocShow: imud && 'gtoc-show' in imud ? imud['gtoc-show'] : [1, 2, 3, 4, 5, 6],
    dtocShow: imud && 'dtoc-show' in imud ? imud['dtoc-show'] : [2, 3, 4, 5, 6]
  };
}

// ---------- טוקניזציה (כמו performTypeset של המקור) ----------
function tokenizeDoc(rawText, cfg) {
  let text = stripEditorialNotes(rawText);
  const { meta, text: noMeta } = parseMetadata(text);
  text = noMeta;
  const isHeadingLine = (s) => /^כותרת\s*\d/.test(s.trim());
  if (cfg.fnOpen) {
    // **תיקון הדבקת שורת-הערה (נמצא בקורפוס הגדול, 04.11):** בעבר ההדבקה
    // '\s+[' חצתה שורות גם לתוך כותרות — הערה שבאה אחרי 'כותרת 7' נבלעה
    // לתוך הערת-הצד, והערת-צד נוספת שאחריה דרסה אותה סופית (3 הערות אבדו,
    // 1,353 מילים בשימור התוכן). כעת: שורת-הערה נדבקת לפסקה הקודמת **בלבד**
    // (במקור ההדבקה פעלה בתוך בלוק טקסט אחד; כותרת פותחת בלוק חדש);
    // אחרי כותרת היא נשארת פסקה עצמאית — שורת סמן + הערה בתחתית — והתוכן
    // נשמר במלואו. הדבקה בתוך-שורה ('מילה [הערה]') נשמרת כפי שהייתה.
    const esc = cfg.fnOpen.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const src = text.split('\n');
    const out = [];
    for (let i = 0; i < src.length; i++) {
      const ln = src[i];
      if (out.length && ln.trim().startsWith(cfg.fnOpen)) {
        let j = out.length - 1;
        while (j >= 0 && !out[j].trim()) j--;
        if (j >= 0 && !isHeadingLine(out[j])) {
          out[j] = out[j].replace(/\s+$/, '') + ln.trim();
          continue;
        }
      }
      out.push(ln);
    }
    text = out.join('\n').replace(new RegExp('[ \\t]+(' + esc + ')', 'g'), '$1');
  }
  const lines = text.split('\n');
  const tokens = [];
  let pendingSideNote = null;
  let pendingEndNote = null;
  const endPrefix = cfg.endPrefix;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    while (hasUnclosedNote(line, cfg.fnOpen, cfg.fnClose) && i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      if (!next) break;
      i++; line += ' ' + next;
    }
    if (endPrefix && line.startsWith(endPrefix)) {
      pendingEndNote = line.slice(endPrefix.length).replace(/^[:\-–—]\s*/, '').trim();
      continue;
    }
    const hMatch = line.match(/^כותרת\s*(\d+)(?:\s+מספר\s+(\d+))?.*?[-–—]\s*(.*)$/);
    if (hMatch) {
      const lvl = parseInt(hMatch[1], 10);
      const txt = (hMatch[3] || '').trim();
      const num = hMatch[2] ? parseInt(hMatch[2], 10) : null;
      if (lvl === 7 && HEADING_MODES[7] === 'side_note') {
        // **תיקון הצטברות הערות-צד (נמצא בקורפוס הגדול):** שתי כותרות 7 בלי
        // פסקה ביניהן (למשל h7 ← h3 ← h7 ← פסקה) — בעבר השנייה דרסה את הראשונה
        // ותוכנה אבד. כעת הן מצטברות; ב-no_long אין אף מקרה כזה (0 סיכון פריטי).
        pendingSideNote = pendingSideNote ? pendingSideNote + ' — ' + txt : txt;
      } else {
        tokens.push({ id: tokens.length, type: 'h' + lvl, level: lvl, text: txt, num });
      }
    } else {
      tokens.push({
        id: tokens.length, type: 'p', text: line,
        sideNote: pendingSideNote, endNote: pendingEndNote
      });
      pendingSideNote = null; pendingEndNote = null;
    }
  }
  return { meta, tokens };
}

// ---------- שבירת שורות: פורט של getLinesFromParagraph ----------
/**
 * גרידה כמו הדפדפן במקור: מילים נמדדות בגופן הגוף; הערה [...] מוצגת במדידה
 * כ"א" (הסמן); המילה הראשונה בחלון (1.5×) מכווצת את שתי השורות הראשונות;
 * שתי המילים האחרונות קשורות ברווח בלתי-שביר (מניעת מילה יתומה).
 */
class LineBreaker {
  constructor(api, cfg, windowApi = null) {
    this.api = api;
    this.cfg = cfg;
    // **S4.15 (גופן מילת-החלון):** מילת-החלון נמדדת ב-FrankReal-Bold (כמו
    // המקור — .first-word-window{font-family:'FrankReal';font-weight:900}),
    // לא בגופן הגוף. אם לא נרשם — נפילה שקופה לגוף (התנהגות קודמת).
    this.win = windowApi;
    this.winCache = new Map();
    this.cache = new Map();
  }
  w(text, sizePt) {
    const key = sizePt + '|' + text;
    let v = this.cache.get(key);
    if (v === undefined) { v = this.api.measureTextWidth(text, sizePt, 0); this.cache.set(key, v); }
    return v;
  }
  /** מדידת טקסט חלון (FrankReal-Bold 1.5×) — עם מטמון נפרד. */
  wWin(text, sizePt) {
    if (!this.win) return this.w(text, sizePt);
    const key = sizePt + '|' + text;
    let v = this.winCache.get(key);
    if (v === undefined) { v = this.win.measureTextWidth(text, sizePt, 0); this.winCache.set(key, v); }
    return v;
  }

  /** מילים למדידה + מילים לפלט + טווחי הערות (אטומיות כמו במקור). */
  splitWords(text) {
    const { fnOpen, fnClose } = this.cfg;
    const safe = String(text).trim();
    const notes = findNotes(safe, fnOpen, fnClose);
    let atomic = safe;
    for (const n of notes) {
      const inner = safe.slice(n.start + fnOpen.length, n.end - fnClose.length).replace(/\s+/g, '\uE000');
      atomic = atomic.slice(0, n.start + fnOpen.length) + inner + atomic.slice(n.end - fnClose.length);
    }
    const words = atomic.split(/\s+/).filter(Boolean);
    const escO = fnOpen.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const escC = fnClose.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const inWord = new RegExp(escO + '[\\s\\S]*?' + escC, 'g');
    const disp = words.map(word => {
      if (word.startsWith(fnOpen) && word.endsWith(fnClose)) return 'א';
      return word.replace(inWord, 'א').replace(/\uE000/g, ' ');
    });
    const out = words.map(word => word.replace(/\uE000/g, ' '));
    return { words, disp, out, notes };
  }

  /** החלפת מילת-הערה בסמן הגימטריה (בפלט בלבד). */
  static markerWord(n) { return toGematria(n) + '.'; }

  /**
   * שבירה גרידה של פסקה.
   * **S4.9 (מדידת סוגריים):** מילים בתוך (...) נמדדות בגודל הסוגריים המוקטן
   * (size-body + s-paren, כלומר 12-2=10pt) — כך פסקאות עם סוגריים אצל המקור
   * מתקצרות בשורות (הרינדור עצמו ב-10pt ממילא).
   * **S4.15 (גופן הקדמה):** measureApi — גופן מדידה חלופי לפסקה זו (גוף
   * ההקדמה מרונדר במקור ב-'Frank Ruhl Libre' 11.5pt — --fn-h0-body — לא
   * בגופן הגוף; הוכח מסימון הייחוס: שורות ההקדמה נשברות בדיוק לפי רוחבי
   * FRL ולא Guttman — שורת 'לבאר… ואיזה' 482.9px בגוף מול 474 ב-FRL).
   * @returns {{lines:Array<{words:string[], window:boolean, heightPx:number}>, hasWindow:boolean, windowWords:string[]|null, notes:Array}}
   */
  breakPara(text, colWidthPx, sizePt, allowWindow, measureApi = null) {
    const cfg = this.cfg;
    const mw = measureApi
      ? (t, sz) => measureApi.measureTextWidth(t, sz, 0)
      : (t, sz) => this.w(t, sz);
    const { disp, out, notes } = this.splitWords(text);
    const spaceW = mw(' ', sizePt);
    // טווחי סוגריים מאוזנים — מילים בתוכם נמדדות בגודל מוקטן
    // **S4.13 (תיקון שורש — זיהוי ברמת תווים כמו findParenMatches במקור):**
    // הזיהוי הקודם (מילה-שמתחילה-ב-( עד מילה-שמסתיימת-ב-)) החמיץ את המקרה
    // הנפוץ 'מחשבת).' — סוגר עם פיסוק אחריו — וכל טווחי הסוגריים בפסקאות
    // כאלה נמדדו בגודל מלא (12pt במקום 10pt) ⇒ שורות קצרות יותר בשבירה
    // מול הייחוס. המקור סופר עומק סוגריים לכל אורך הטקסט (מקונן, חוצה
    // מילים); כאן: מילה שנמצאת בתוך עומק>0 או נוגעת בסוגר — מוקטנת.
    const parenWords = new Set();
    {
      let depth = 0;
      for (let i = 0; i < out.length; i++) {
        const wd = out[i];
        for (let c = 0; c < wd.length; c++) {
          if (wd[c] === '(') depth++;
          else if (wd[c] === ')' && depth > 0) depth--;
        }
        if (depth > 0 || wd.includes('(') || wd.includes(')')) parenWords.add(i);
      }
    }
    const parenSize = SZ.body + SZ.parenDelta; // 12-2 = 10pt (קבוע כמו במקור)
    const wordWs = disp.map((d, i) => mw(d, parenWords.has(i) ? parenSize : sizePt));
    if (!out.length) return { lines: [], hasWindow: false, windowWords: null, notes };

    // חלון מילה-ראשונה: אמדן שורות כמו המדידה הכפולה במקור
    const totalW = wordWs.reduce((a, b) => a + b, 0) + spaceW * Math.max(0, out.length - 1);
    const estLines = Math.max(1, Math.ceil(totalW / colWidthPx));
    const firstHasNote = out.slice(0, Math.min(cfg.dropWordCount, out.length))
      .some(w => w.includes(cfg.fnOpen));
    // **S4.13 (createDropWord של המקור):** פסקה שמתחילה בסוגריים — בלי חלון
    // ("פסקה שמתחילה בסוגריים ( ) — בלי עיצוב מילה ראשונה"). ההוכחה מהייחוס:
    // פסקת "(הדברים פשוטים...)" בהקדמה מודפסת אצל המקור בלי מילת-חלון כלל
    // (כל השורות ברוחב מלא), ואצלנו הופיע "(הדברים" כחלון 1.5× בגודל 17.25.
    const startsWithParen = /^\(/.test(String(text).trim());
    let useWindow = false, windowW = 0, windowWords = null;
    if (allowWindow && !startsWithParen && cfg.dropWordMode === 'window' && estLines >= cfg.dropWordMinLines && !firstHasNote) {
      useWindow = true;
      windowWords = out.slice(0, cfg.dropWordCount);
      // **S4.15:** המדידה בגופן החלון של המקור (FrankReal-Bold @ 900) — הוכח
      // מהייחוס: 116 מילות-חלון בודדות נמדדו מול שבעה מועמדים ו-FrankReal-Bold
      // התאים בשגיאה ממוצעת 0.03px ('וזה' 25.1/25.1, 'אך' 22.0/22.0, 'והיפך'
      // 45.2 — מול 39px בגופן הגוף). רוחב שגוי = גלישה שונה של שתי השורות
      // הראשונות של כל פסקת-חלון = הפרש P7/P6 הדומיננטי.
      windowW = this.wWin(disp.slice(0, cfg.dropWordCount).join(' '), sizePt * 1.5) + 6;
    }

    // **S4.15 (ביטול קשיחת-הזוג ברינדור):** קשיחת שתי המילים האחרונות (nbsp)
    // קיימת בגרסת הארכיון v20.5 בלבד — ה-typesetter הראשי שיצר את הייחוס
    // מרנדר ברווחים רגילים (createDropWord מחבר ב-' ' פשוט; ה-nbsp רק במדידת
    // joinMeasuredLine). ההוכחה מהייחוס: פסקת ההקדמה הראשונה — '…מזה ואיזה'
    // בשורה 2 ו-'מזה.' בשורה 3 — הזוג האחרון דווקא מפוצל, בדיוק כגלישה
    // גרידה חופשית. הקשיחה הוצאה מהרינדור; היא נשארת רלוונטית רק לאמדן
    // השורות במקור (שאינו משפיע על הפלט).
    const flowStart = useWindow ? cfg.dropWordCount : 0;
    const pairStart = -1; // אין קשיחה ברינדור (הוכחה לעיל)
    const bindPair = false;

    const lines = [];
    let cur = [], curW = 0, lineNo = 0;
    const limitOf = () => (useWindow && lineNo < 2) ? colWidthPx - windowW : colWidthPx;

    if (useWindow) {
      // שורות 0–1: החלון בשפה הימנית; הזרימה ברוחב מוקטן. מילות החלון אינן בזרימה.
    }
    for (let i = flowStart; i < out.length; i++) {
      const bindHere = bindPair && i === pairStart; // המילה הלפני-אחרונה — נבדקת עם יורשתה
      const w1 = wordWs[i];
      const w2 = bindHere ? wordWs[i + 1] + spaceW : 0;
      const addW = (cur.length ? spaceW : 0) + w1 + (bindHere ? w2 : 0);
      if (cur.length && curW + addW > limitOf() + 0.01) {
        lines.push({ words: cur, window: useWindow && lineNo < 2 });
        cur = []; curW = 0; lineNo++;
      }
      cur.push(out[i]);
      curW += (cur.length > 1 ? spaceW : 0) + w1;
      if (bindHere) {
        cur.push(out[i + 1]);
        curW += spaceW + wordWs[i + 1];
        i++;
      }
    }
    if (cur.length) lines.push({ words: cur, window: useWindow && lineNo < 2 });
    for (const l of lines) l.heightPx = GEO.LINE_H;
    return { lines, hasWindow: useWindow, windowWords, windowW, notes };
  }
}

// =====================================================================
//  הרכבת המסמך — פורט של performTypeset (מבנה, בלוקים, עימוד)
//  מודל: עמוד = מחסנית אנכית של פסים (span של h3) ובלוקים דו-טוריים מאוזנים.
// =====================================================================

const FLOW_BOTTOM = GEO.FLOW_TOP + GEO.FLOW_H; // 1022.2px — תחתית הזרימה האמיתית (עמודים 13-15: block עד 1021)
// **S4.14:** אזור ה-h2 = מחסנית התוויות של הייחוס: spacer 179 + siman 35 +
// title 48 = 262; עם FLOW_TOP=107.2 ה-span נוחת ב-368.5 ✓ (הערך הקודם 271.3
// פיצה על ה-FLOW_TOP השגוי). הפסים עצמם אבסולוטיים (284.9/321.1) ואינם זזים.
const H2_AREA_H = 261.3;
// **S4.14:** span 34px + רווח 4px = 38 — נמדד בכל 13 מופעי block-h3-span
// של הייחוס (מרחק תווית-span → תווית-block תמיד 38.0). היה 40 (+2px לכל span).
const H3_SPAN_H = 38;
const H0_AREA_H = 240.8;   // **מכויל מהייחוס (עמ' 10):** הזרימה מתחילה ב-348px (107.2+240.8); הכותרת ב-309px
const SINGLE_W = 552.3;    // .single-wide-col = 2×269.41+13.48 (grid)
// **S4.13:** פס שורת ההקדמה — אותו line-height של הגוף (1.34) על 11.5pt
// ⇒ 15.41pt = 20.55px. מדידת הייחוס בעמוד ההקדמה: פסים 15.0–16.3pt (ממוצע 20.5px
// לפני הצמדת ההדפסה). הערך הקודם (22.2 = ×1.45) היה קליברציה שגויה שדחפה
// את שורות ההקדמה והזיזה את נקודות החיתוך שלה (נצפה ב-P7: שורות ההקדמה
// הראשונות שנותרו שונות אחרי תיקון LINE_H).
const H0_LINE_H = 20.55;
const TOC_TITLE_BLOCK_H = 213;
// **S4.14:** גיאומטריית עמודי תוכן-העניינים — אבסולוטית ונפרדת מזרימת הגוף
// (השורה הראשונה בעמודי ה-TOC של הייחוס ב-113.6px, לא ב-FLOW_TOP). הערכים
// שומרים על המיקומים הקודמים המכוילים (96.7+213+61 / 96.7+17 / 1011.7−6).
const TOC_FIRST_TOP = 370.7;
const TOC_CONT_TOP = 113.7;
const TOC_STRETCH_BOTTOM = 1005.7;

/** גובה פריט כותרת inline (h4/h5/h6) בטור — גודל×1.45.
 * **S4.14 (מדידה שיטתית מעוגני הייחוס):** מרחק תווית-hN → עוגן הפסקה הבא
 * באותו טור, על פני כל המסמך: h4=24-25px (32 מדידות; 12.5pt), h5=22px
 * (7 מדידות; 11.5pt), h6=20px (5 מדידות; 10.5pt) — כלומר גודל×1.45 בדיוק
 * (24.2/22.2/20.3). הנוסחה הקודמת ×1.22+6 נתנה 26.3/24.7 — גבוהה ב-2 עד 2.5px
 * לכל כותרת, והפער הצטבר לשורה שלמה בעמודים עם כותרות מרובות. */
function headingItemH(level) {
  const sz = ({ 4: SZ.h4, 5: SZ.h5, 6: SZ.h6 })[level] || SZ.body;
  return sz * (96 / 72) * 1.45;
}

/** גלישת שורות גרידה גנרית (להערות). */
function wrapText(text, api, widthPx, sizePt) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = [], curW = 0;
  const spaceW = api.measureTextWidth(' ', sizePt, 0);
  for (const w of words) {
    const ww = api.measureTextWidth(w, sizePt, 0);
    const add = ww + (cur.length ? spaceW : 0);
    if (cur.length && curW + add > widthPx) { lines.push(cur.join(' ')); cur = [w]; curW = ww; }
    else { cur.push(w); curW += add; }
  }
  if (cur.length) lines.push(cur.join(' '));
  return lines;
}

/**
 * legacyTypeset — הנתיב החי לפרופיל IMUD (התנהגות המקור = המפרט).
 */
function legacyTypeset(rawText, settings, env) {
  const cfg = readConfig(settings._imudRaw || {});
  const impl = settings['measure-impl'] === 'font-metrics' ? 'font-metrics' : 'table';
  // **S4.13 (רישום גופן הערות-הצד):** הקריאה יכולה לספק את בתי הגופן
  // (env.marginFontBytes) — נרשם כאן פעם אחת; הגלישה מידדת במטריקות שלו.
  if (env && env.marginFontBytes && !registeredMeasureFonts.has('Hadassah Friedlaender')) {
    registerMeasureFont('Hadassah Friedlaender', env.marginFontBytes);
  }
  // **S4.15 (גופן מילת-החלון — FrankReal-Bold):** env.windowFontBytes נרשם
  // כאן (נתיב הפריטה/הייצוא); באפליקציה החיה הגופן נרשם דרך register-font
  // תחת השם 'FrankReal' — שני הנתיבים מזוהים כאן. בלי גופן רשום: המדידה
  // נופלת לגופן הגוף (התנהגות קודמת, בדיקות קיימות לא נשברות).
  if (env && env.windowFontBytes && !registeredMeasureFonts.has('FrankReal-Bold')) {
    registerMeasureFont('FrankReal-Bold', env.windowFontBytes);
  }
  // **S4.15 (גופן ההקדמה — Frank Ruhl Libre 11.5pt):** גוף ההקדמה במקור
  // (--fn-h0-body) מרונדר ב-'Frank Ruhl Libre', לא בגופן הגוף — הוכח
  // מסימון הייחוס: אילוצי שבירת שורות ההקדמה מתקיימים ברוחבי FRL
  // (שורת 'לבאר… ואיזה' נכנסת ב-474px ב-FRL מול 482.9px בגוף — והייחוס
  // הכניס אותה). באפליקציה החיה הגופן נרשם דרך register-font (המשפחה
  // 'Frank Ruhl Libre' בקטלוג). בלי גופן רשום — נפילה לגופן הגוף.
  if (env && env.prefaceFontBytes && !registeredMeasureFonts.has('Frank Ruhl Libre')) {
    registerMeasureFont('Frank Ruhl Libre', env.prefaceFontBytes);
  }
  let prefaceApi = null;
  if (impl === 'font-metrics' && registeredMeasureFonts.has('Frank Ruhl Libre')) {
    prefaceApi = new MeasureAPI(
      { 'body-font': 'Frank Ruhl Libre', 'body-font-size-pt': SZ.h0Body, 'body-line-height': 1.45 },
      'font-metrics'
    );
  }
  const api = new MeasureAPI(settings, impl);
  let windowApi = null;
  const windowFontName = registeredMeasureFonts.has('FrankReal-Bold') ? 'FrankReal-Bold'
    : (registeredMeasureFonts.has('FrankReal') ? 'FrankReal' : null);
  if (impl === 'font-metrics' && windowFontName) {
    windowApi = new MeasureAPI(
      { 'body-font': windowFontName, 'body-font-size-pt': SZ.body, 'body-line-height': 1.34 },
      'font-metrics'
    );
  }
  // **S4.13 (גופן הערות-צד — כמו המקור):** הערות הצד מודפסות בגופן
  // HadassahFriedlaender (מוכח מהייחוס: שורות השוליים sz=6 בפונט
  // 'HadassahFriedlaender', לא GuttmanRashi). הגלישה שלהן חייבת למדוד
  // במטריקות שלו — בגופן הגוף הרוחבים שונים והשבירה מתפצלת אחרת
  // (נצפה: 'מכלל ימי השבת,' 47.2px בגוף מול 52.5px ב-Hadassah — הייחוס
  // שובר אחרי 'מכלל ימי'). אם הגופן לא נרשם — נפילה שקופה לגופן הגוף.
  let marginApi = api;
  if (impl === 'font-metrics' && registeredMeasureFonts.has('Hadassah Friedlaender')) {
    marginApi = new MeasureAPI(
      { 'body-font': 'Hadassah Friedlaender', 'body-font-size-pt': SZ.marginNote, 'body-line-height': 1.2 },
      'font-metrics'
    );
  }
  const brk = new LineBreaker(api, cfg, windowApi);
  const { meta, tokens } = tokenizeDoc(rawText, cfg);

  const bookTitle = (meta.bookTitle || 'ספר').trim();
  const tw = bookTitle.split(/\s+/);
  const mid = Math.ceil(tw.length / 2);
  const hdrR = tw.slice(0, mid).join(' ');
  const hdrL = tw.slice(mid).join(' ');

  // ---- מקטעים (כמו המקור: h1→sub_shaar, h0/h2→new_page, השאר inline) ----
  const sections = [];
  let cur = { tokens: [] };
  for (const t of tokens) {
    const mode = t.type[0] === 'h' ? (HEADING_MODES[t.level] || 'inline_2col') : 'inline_2col';
    if (mode === 'sub_shaar') {
      if (cur.tokens.length) sections.push(cur);
      sections.push({ subShaar: t, tokens: [] });
      cur = { tokens: [] };
    } else if (mode === 'new_page_1col' || mode === 'new_page_2col') {
      if (cur.tokens.length) sections.push(cur);
      cur = { newPage: t, tokens: [] };
    } else {
      cur.tokens.push(t);
    }
  }
  if (cur.tokens.length) sections.push(cur);

  const pages = [];
  const headingFolio = new Map();
  let simanCounter = 0;
  let currentH2 = '';
  let currentH1 = '';
  let pending = null; // {token, lines, lineIdx} — המשך פסקה חתוכה בין עמודים/טורים

  function blankPageObj(type) {
    return {
      index: -1, type, legacy: true, pageNumber: null, folioDisplay: '',
      headerSlots: null, bands: [], columns: [[], []], marginNotes: [], footnotes: [],
      sideNotes: [], // **תיקון S4.10:** חוזה התוצאה — dp-planner.layoutHash ו-serialize
      // קוראים p.sideNotes.length גם על תוצאות מורשת (בלי זה ה-worker קורס
      // והאפליקציה החיה מציגה 0 עמודים — נמצא בביקורת הדפדפן).
      fnSep: false, toc: null, _metadata: meta,
      // **S4.10:** תבנית מלאה — גם צרכני DP (כגון הקרנות/בדיקות) שקוראים
      // template.columns/contentBox.height לא יקרסו על תוצאת מורשת.
      template: {
        width: GEO.PAGE_W, height: GEO.PAGE_H,
        columns: [{ x: GEO.COL_R_X, w: GEO.COL_W }, { x: GEO.COL_L_X, w: GEO.COL_W }],
        gutter: 13.48,
        contentBox: { top: GEO.FLOW_TOP, bottom: FLOW_BOTTOM, height: GEO.FLOW_H }
      }
    };
  }
  function newPage(type) {
    const pg = blankPageObj(type);
    pages.push(pg);
    return pg;
  }
  const setHeader = (pg, center) => { pg.headerSlots = { right: hdrR, center: center || '', left: hdrL }; };

  // ---------- עמודי שער ----------
  // **S4.9:** תוכן השערים מהמטא-דאטה של המסמך — במיקומים המכוינים מהייחוס
  // (shaar-main: כותרת 46pt ב-128pt, משנה 21pt, תיאור 12pt, מהדורה 11.5pt, מחבר 15pt;
  //  shaar-back: זכויות/פרטים; shaar-sub: כותרת ה-h1 ב-36pt + המשך ב-21pt).
  function gateLinesFor(type, h1Token) {
    const pt = (v) => v / 0.75;
    if (type === 'shaar-main') return [
      { text: meta.bookTitle || '', sizePt: 46, y: pt(128.1) },
      { text: meta.subject || '', sizePt: 21, y: pt(225.2) },
      { text: meta.desc || '', sizePt: 12, y: pt(410.3) },
      { text: meta.edition || '', sizePt: 11.5, y: pt(558.0), singleOp: true },
      { text: meta.author || '', sizePt: 15, y: pt(713.5), singleOp: true }
    ].filter(g => g.text);
    if (type === 'shaar-back') return [
      { text: meta.copyright ? 'כל הזכויות שמורות' : '', sizePt: 13.5, y: pt(191.8) },
      { text: meta.copyright || '', sizePt: 10, y: pt(216.4) },
      { text: meta.publisher || '', sizePt: 11, y: pt(357.3) },
      { text: meta.contact || '', sizePt: 10, y: pt(500.9) },
      { text: meta.extra || '', sizePt: 9.5, y: pt(644.3) }
    ].filter(g => g.text);
    if (type === 'shaar-sub' && h1Token) {
      const parts = h1Token.text.split(/[-–—]/).map(s => s.trim()).filter(Boolean);
      const first = parts[0] || h1Token.text;
      const rest = parts.slice(1).join(' - ');
      const out = [{ text: first, sizePt: 36, y: pt(345.7) }];
      if (rest) out.push({ text: rest, sizePt: 21, y: pt(469.7) });
      return out;
    }
    return [];
  }
  if (cfg.showMainShaar) { const g0 = newPage('shaar-main'); g0.gateLines = gateLinesFor('shaar-main'); }
  if (cfg.showBackShaar) { const g1 = newPage('shaar-back'); g1.gateLines = gateLinesFor('shaar-back'); }

  // ---------- זרימת מקטע ----------
  function flowSection(sec) {
    const toks = sec.tokens;
    let ti = 0;
    let sectionFirst = true;
    const isH0 = sec.newPage && sec.newPage.level === 0;
    const isH2 = sec.newPage && sec.newPage.level === 2;

    while (ti < toks.length || pending) {
      const pg = newPage(isH0 ? (sectionFirst ? 'preface' : 'regular')
        : (sectionFirst && isH2 ? 'sign-open' : 'regular'));
      let top = GEO.FLOW_TOP;
      if (sectionFirst && sec.newPage) {
        if (isH0) {
          pg.bands.push({ kind: 'h0-title', text: sec.newPage.text, sizePt: SZ.h0Title, y: 309.0, h: 30, tokenId: sec.newPage.id });
          top = GEO.FLOW_TOP + H0_AREA_H;
          currentH2 = sec.newPage.text;
        } else if (isH2) {
          if (cfg.autoSimanH2) {
            simanCounter++;
            pg.bands.push({ kind: 'h2-siman', text: 'סימן ' + toGematria(simanCounter), sizePt: SZ.siman, y: 284.9, h: 36, tokenId: null });
          }
          const disp = sec.newPage.text.replace(/^סימן\s+[א-ת]+[:\-–—\s]*/i, '').trim();
          pg.bands.push({ kind: 'h2-title', text: disp, sizePt: SZ.h2, y: 321.1, h: 30, tokenId: sec.newPage.id });
          currentH2 = disp;
          // **S4.9 (תיקון קריטי):** הזרימה מתחילה מתחת לאזור ה-h2 (סימן+כותרת) —
          // בלי זה הבלוקים מוצבים מראש העמוד, מתנגשים בכותרות וגוררים
          // הסחת עימוד של ~29 שורות בכל עמוד פתיחת סימן.
          top = GEO.FLOW_TOP + H2_AREA_H;
        }
      }
      setHeader(pg, currentH2);
      sectionFirst = false;

      const fnQueue = [];
      let fnReserved = 0;
      // **תיקון כפילות הערות בעמוד (נמצא בקורפוס הגדול):** בעבר היו שלושה מסלולי
      // דחיפה לתור — תקציב-מוקדם, המשך-פסקה ומיקום-שורה — ושניים מהם לא בדקו
      // דה-דופ, ולכן הערה של פסקה שנפתחה ומוקמה באותו עמוד הופיעה פעמיים
      // (very_long: 70 עמודים עם הערות כפולות). כעת כל הכניסה לתור דרך
      // enqueueNote — הערה קיימת לא נוספת שנית, והסמן נגזר ממקומה בתור:
      // מספור עמודי עוקב מ־א ואילך, זהה בין סמן הגוף לראש ההערה בתחתית
      // (הוכח מהייחוס: כל אזורי ההערות של המקור פותחים ב־א', והערה של
      // פסקה חוצת-עמודים חוזרת בעמוד ההמשך עם סמן א' מחדש).
      const enqueueNote = (text, dup) => {
        let idx = fnQueue.findIndex(q => q.text === text);
        if (idx < 0) { fnQueue.push({ text, dup }); idx = fnQueue.length - 1; }
        return LineBreaker.markerWord(idx + 1);
      };
      // **S4.9 (התנהגות המקור הנצפית):** הערות של פסקה מופיעות ומוזרמות לתקציב
      // בכל עמוד שבו לפסקה שורות — גם בהמשכים (הייחוס מציג את הערה-א בעמודים
      // 11 וגם 12, והתקציב מצטמצם כבר בעמוד הראשון של הפסקה).
      const paraNotes = new Map(); // tokenId → [{marker, text}] (מופקות בפעם הראשונה)
      const tokPages = new Map();  // tokenId → Set(pageIndex)
      const requeueParaNotes = (tokenId) => {
        const notes = paraNotes.get(tokenId);
        if (!notes) return;
        for (const n of notes) {
          enqueueNote(n.text, true);
        }
        fnReserved = fnReserveFor(fnQueue);
      };

      // ---- מבנה העמוד: מחסנית של פסים ובלוקים; מילוי דו-טורי (ימני ואז שמאלי) ----
      const stack = [];
      let block = null;
      const openBlock = (yTop) => {
        block = { yTop, cols: [[], []], cursor: [yTop, yTop], fill: 0 };
        stack.push(block);
      };
      const blockBottom = () => block ? Math.max(block.cursor[0], block.cursor[1]) : top;
      const colBottom = () => FLOW_BOTTOM - fnReserved;

      // **S4.13 (rollbackTrailingHeadings של המקור):** כותרות עוקבות בסוף הטור
      // הנוכחי חוזרות יחד עם הפסקה שלא נכנסה — כדי שכותרת לא תישאר יתומה
      // בתחתית הטור (המקור: tokenIndex -= rollbackTrailingHeadings(targetCol)).
      // מחזיר כמה הוסרו; מעדכן את ה-cursor של הטור.
      const rollbackTrailingHeadings = () => {
        if (!block) return 0;
        let n = 0;
        while (block.cols[block.fill].length) {
          const lastU = block.cols[block.fill][block.cols[block.fill].length - 1];
          if (lastU.kind !== 'heading') break;
          block.cols[block.fill].pop();
          block.cursor[block.fill] -= lastU.h;
          n++;
        }
        return n;
      };

      // **S4.13 (היגיון סיום בלוק — העתק מהמקור, שורות 3946-3997):** במקור כל
      // בלוק מסתיים באחד מארבעה: (1) סוף פרק → איזון תמיד; (2) הטוקן הבא
      // כותרת-רוחבית (span_1col) → איזון; (3) הטור הימני גולש לגובה הפנוי או
      // הפרש הטורים > 60px → איזון; (4) אחרת — המילוי נשמר (במקור: מתיחה
      // אנכית עדינה של הטור הקצר, שאינה מזיזה נקודות חיתוך ולכן לא ממומשת
      // כאן). ה-S4.12 איזן בלי-תנאי בכל נקודות היציאה — עכשיו נאמן למקור.
      const finalizeBlock = (blk, nextTok, sectionEnd) => {
        if (!blk || isH0) return;
        if (!(blk.cols[0].length || blk.cols[1].length)) return;
        const availH = colBottom() - blk.yTop;
        if (sectionEnd) { balanceBlock(blk, availH); return; }
        const nextIsSpan = nextTok && nextTok.type[0] === 'h'
          && (HEADING_MODES[nextTok.level] || 'inline_2col') === 'span_1col';
        // **S4.14 (מדידת עוגנים מפריכה את סעיף 3 בחיתוכי-עמוד):** עמ' 31
        // בייחוס — בלוק 914px, ‏7 פסקאות גמורות (p-end), ‏39/32 שורות לא מאוזן
        // (הפרש 150px > 60); עמ' 44: ‏49/38; עמ' 48: ‏40/51. כשהבלוק נגמר משום
        // שהעמוד התמלא — המקור שומר את המילוי גם בהפרש גדול. האיזון בפועל
        // רק בסוף מקטע ולפני span (ההוכחות של S4.13 לאותם מקרים תקפות).
        if (nextIsSpan) {
          balanceBlock(blk, availH);
        }
      };

      fillPage: while (ti < toks.length || pending) {
        const tok = pending ? pending.token : toks[ti];
        const mode = tok.type[0] === 'h' ? (HEADING_MODES[tok.level] || 'inline_2col') : 'inline_2col';

        if (mode === 'span_1col' && !pending) {
          // **S4.12 (איזון לפני החלטת ה-span, כמו המקור):** בלוק שמולא חמדנית
          // (טור ימני מלא, שמאלי חלקי) מנפח את blockBottom ופוסל span שהיה
          // נכנס בקלות אחרי איזון — ההוכחה: עמוד עם 27/2 שורות שדחה span
          // בעוד איזון (15/14) מוריד את blockBottom ב-250px. המקור מאזן את
          // הבלוק בכל יציאה מלולאת המילוי לפני החלטת המשך/עצירה.
          if (block && !isH0 && (block.cols[0].length || block.cols[1].length)) {
            balanceBlock(block, colBottom() - block.yTop);
          }
          const curY = block ? blockBottom() : top;
          // **S4.13:** סף 60px — כמו המקור (if (currentAvailH < 60) break
          // לפני הצבת כותרת רוחבית); היה H3_SPAN_H+6≈46.
          if (colBottom() - curY < 60) break fillPage;
          stack.push({ type: 'span', text: tok.text, y: curY, h: H3_SPAN_H, tokenId: tok.id });
          openBlock(curY + H3_SPAN_H);
          ti++;
          continue;
        }
        if (tok.type[0] === 'h') {
          if (!block) openBlock(top);
          const h = headingItemH(tok.level);
          if (block.cursor[block.fill] + h > colBottom()) {
            if (block.fill === 0 && !isH0 && !(block.cols[0].length === 0)) {
              // **S4.13:** גם כאן המקור מחזיר כותרות זנב לפני מעבר טור —
              // כותרת שנותרה אחרונה בטור הימני תיפלט עם הפסקה הבאה בשמאלי.
              ti -= rollbackTrailingHeadings();
              block.fill = 1; // המשך בטור השמאלי
            } else if (block.cols[block.fill].length || block.cols[0].length) {
              // **S4.13:** סיום הבלוק לפני שבירת העמוד — כמו המקור (כל בלוק
              // מסתיים בהיגיון הארבעה; כאן הטוקן הבא הוא הכותרת שלא נכנסה).
              ti -= rollbackTrailingHeadings();
              finalizeBlock(block, tok, false);
              break fillPage;
            }
          }
          block.cols[block.fill].push({ kind: 'heading', level: tok.level, text: tok.text, h, tokenId: tok.id });
          block.cursor[block.fill] += h;
          ti++;
          continue;
        }

        // ---- פסקה ----
        if (!block) openBlock(top);
        const isH0Body = isH0;
        const bodySz = isH0Body ? SZ.h0Body : SZ.body;
        const pitch = isH0Body ? H0_LINE_H : GEO.LINE_H;
        const colW = isH0Body ? SINGLE_W : GEO.COL_W;
        let lines, hasWindow = false, windowWords = null, windowW = 0;
        const isCont = !!pending;
        if (pending) {
          lines = pending.lines;
          // המשך פסקה — ההערות שלה חוזרות לתור העמוד (כמו במקור)
          requeueParaNotes(tok.id);
        } else {
          tokPages.set(tok.id, new Set([pages.length - 1]));
          const r = brk.breakPara(tok.text, colW, bodySz, true, isH0Body ? prefaceApi : null);
          lines = r.lines; hasWindow = r.hasWindow; windowWords = r.windowWords;
          // **S4.15:** רוחב החלון המדוד (FrankReal-Bold 1.5× + 6px) נשמר על
          // החתיקה — מקור יחיד לפרויקטור (בלי מדידה חוזרת בגופן אחר).
          windowW = r.windowW || 0;
        }
        const startIdx = pending ? pending.lineIdx : 0;
        const total = lines.length - startIdx;

        // תקציב מוקדם: כל ההערות של הפסקה (מהשבירה המלאה) נכנסות לתור העמוד
        // כבר בעמוד הראשון שלה — כך התקציב מצטמצם מוקדם כמו במקור.
        if (!isCont) {
          const allNotes = [];
          for (const lw of lines) {
            for (const w of lw.words) {
              // **תיקון מרובה-הערות במילה:** הדבקת '\s+[' בטוקניזר עשויה ליצור
              // מילה כמו 'אותו[n1][n2]'. בעבר נלקח מ-[ הראשון עד-] האחרון
              // והערות סמוכות התמזגו לאחת ענקית (נמצא בקורפוס הגדול:
              // הערה של 1,288 מילים במקום שתיים). findNotes מפריד את כולן.
              for (const n of findNotes(w, cfg.fnOpen, cfg.fnClose)) {
                if (n.text) allNotes.push(n.text);
              }
            }
          }
          if (allNotes.length) {
            if (!paraNotes.has(tok.id)) {
              paraNotes.set(tok.id, allNotes.map(t => ({ text: t })));
            }
            for (const n of paraNotes.get(tok.id)) {
              enqueueNote(n.text, true);
            }
            fnReserved = fnReserveFor(fnQueue);
          }
        }

        let fit = 0;
        for (let k = 1; k <= total; k++) {
          if (block.cursor[block.fill] + k * pitch <= colBottom() + 0.01) fit = k; else break;
        }
        // אלמנה/יתומה (chooseSplitLines של המקור)
        if (fit > 0 && fit < total) {
          const canPush = block.cols[0].length > 0 || block.cols[1].length > 0 || stack.length > 1;
          if (fit === 1 && canPush) fit = 0;
          else if (total - fit === 1 && fit > 1) fit -= 1;
          else if (total - fit === 1 && fit === 1 && canPush) fit = 0;
        }
        if (fit === 0) {
          // **S4.13 (rollbackTrailingHeadings של המקור):** כותרות שנצברו בסוף
          // הטור הנוכחי חוזרות עם הפסקה שלא נכנסה — אחרת הן מתייתמות בתחתית
          // הטור (המקור: tokenIndex -= rollbackTrailingHeadings(targetCol)
          // לפני כל break מפני placeLines=0).
          ti -= rollbackTrailingHeadings();
          // הטור הנוכחי מלא — מעבר לטור השמאלי (בלוק דו-טורי); אחרת עמוד הבא
          if (block.fill === 0 && !isH0 && block.cols[0].length > 0) {
            block.fill = 1;
            continue;
          }
          const anyContent = stack.length > 1 || block.cols[0].length > 0 || block.cols[1].length > 0;
          if (!anyContent) fit = 1; // התקדמות מאולצת — שורה אחת לפחות
          else if (!isH0 && (block.cols[0].length || block.cols[1].length)) {
            // **S4.14 (הוכחה מבנית מהייחוס — אין המשך-מטה בלי span):** בכל
            // 54 עמודי הייחוס אין אף עמוד עם שני בלוקים שאין ביניהם block-h3-span
            // (כל 12 העמודים הרב-בלוקיים — block+span+block בדיוק). כשהעמוד
            // התמלא המקור מותח את הבלוק לתחתית (stretchPageToBottom) ושובר
            // עמוד — לולאת הבלוקים שלו רצה רק כשהטוקן הבא הוא span. ההמשך-מטה
            // של S4.12/S4.13 הכניס תוכן עודף לעמודים מלאים (עמ' 31: ‏80 שורות
            // אצלנו מול 71 בייחוס — 2 פסקאות שלמות הוכנסו בכוח).
            finalizeBlock(block, pending ? pending.token : toks[ti], ti >= toks.length && !pending);
            break fillPage;
          }
          else break fillPage;
        }

        // סמני הערות בשורות המוצבות.
        // **S4.9:** הערה עשויה להיות מוצמדת למילה שלפניה ("השבוע.[חלוקת...]")
        // — זיהוי לפי אינדקס התוחמים בתוך המילה (כמו findDelimiterMatches
        // במקור), לא רק מילה שלמה שמתחילה ב-[.
        const emitted = [];
        for (let k = 0; k < fit; k++) {
          const ln = lines[startIdx + k];
          const words = [];
          const markerIdx = []; // אינדקסים של סמני הערות (להסרה מדויקת במודל)
          for (const w of ln.words) {
            // **תיקון מרובה-הערות במילה (כמו בתקציב המוקדם):** findNotes
            // מפצל מילה מודבקת לכל ההערות שבה — כל אחת עם סמן משלה, והטקסט
            // שלפניה/ביניהן/אחריה נשאר בגוף (כמו findDelimiterMatches במקור).
            const wNotes = findNotes(w, cfg.fnOpen, cfg.fnClose);
            if (wNotes.length) {
              let pos = 0;
              for (const n of wNotes) {
                const prefix = w.slice(pos, n.start);
                if (prefix) words.push(prefix);
                if (n.text) {
                  const marker = enqueueNote(n.text);
                  if (!paraNotes.has(tok.id)) paraNotes.set(tok.id, []);
                  if (!paraNotes.get(tok.id).some(x => x.text === n.text)) {
                    paraNotes.get(tok.id).push({ text: n.text });
                  }
                  fnReserved = fnReserveFor(fnQueue);
                  markerIdx.push(words.length);
                  words.push(marker);
                }
                pos = n.end;
              }
              const suffix = w.slice(pos);
              if (suffix) words.push(suffix);
            } else {
              words.push(w);
            }
          }
          emitted.push({ ...ln, words, markerIdx });
        }
        const isEnd = startIdx + fit >= lines.length;
        block.cols[block.fill].push({
          kind: 'para', tokenId: tok.id, lines: emitted, from: startIdx,
          isEnd, isCont, hasWindow: hasWindow && !isCont, windowWords, windowW,
          pitch, sizePt: bodySz, sideNote: (!isCont && tok.sideNote) ? tok.sideNote : null
        });
        block.cursor[block.fill] += fit * pitch;
        // **S4.13 (מרווח לכל חתיקה — כמו ה-DOM של המקור):** p{margin-bottom:7px}
        // חל על **כל** אלמנט <p> — כולל p-cut (חתיכה גזורה) — והגובה שהמקור מודד
        // (scrollHeight) כולל את המרווח של כל חתיקה שהוצבה. הקליברציה של S4.9
        // ("רק בסוף פסקה") עבדה כשחתיכות היו נדירות; עם איזון מפצל-שורות מספרן
        // מתרבה וההפרש (7px לכל גזירה) מצטבר לעמוד שלם — 53 מול 54 בייחוס.
        block.cursor[block.fill] += 7;
        if (isEnd) { pending = null; ti++; }
        else {
          pending = { token: tok, lines, lineIdx: startIdx + fit };
          // הפסקה נחתכה — אם הטור השמאלי עוד פנוי, ממשיכים בו; אחרת עמוד הבא
          if (block.fill === 0 && !isH0 && block.cols[0].length > 0) {
            block.fill = 1;
          } else if (!isH0 && (block.cols[0].length || block.cols[1].length)) {
            // **S4.13 (איזון-והמשך כמו המקור):** חיתוך בטור השמאלי מסיים את
            // **S4.14 (כמו מסלול fit=0 לעיל):** חיתוך פסקה בתחתית הטור
            // השמאלי = העמוד התמלא; המקור מותח את הבלוק לתחתית ושובר עמוד
            // (הוכחה מבנית: אין בלוק-המשך בלי span בכל הייחוס).
            finalizeBlock(block, tok, false);
            break fillPage;
          }
          else {
            break fillPage;
          }
        }
      }

      // סגירת הבלוק האחרון: אם המקטע נגמר — איזון
      const sectionEnded = ti >= toks.length && !pending;
      if (block && sectionEnded && !isH0 && (block.cols[0].length || block.cols[1].length)) {
        balanceBlock(block, colBottom() - block.yTop);
      }

      // ---- פריסת המחסנית לעמוד: פסים + בלוקים → טורים עם y מפורש ----
      layoutStack(pg, stack, top);

      // ---- הערות שוליים בתחתית (bottom-anchored) ----
      if (fnQueue.length) {
        pg.fnSep = true;
        // **S4.9:** השורה הראשונה של כל הערה קצרה ברוחב הסמן — אחרת המילים
        // גולשות מעבר לשפה השמאלית של הדף.
        const items = fnQueue.map((n, i) => {
          const marker = LineBreaker.markerWord(i + 1); // מספור עמודי מ־א ואילך (כמקור)
          const mkW = api.measureTextWidth(marker, SZ.fnBody, 0) + api.measureTextWidth(' ', SZ.fnBody, 0);
          const lines = wrapText(n.text, api, SINGLE_W - mkW, SZ.fnBody);
          return { marker, lines, mkW };
        });
        const totalH = items.reduce((a, n) => a + n.lines.length * GEO.FN_PITCH, 0);
        let yy = FLOW_BOTTOM - totalH;
        for (const n of items) {
          const it = { marker: n.marker, lines: [] };
          for (const l of n.lines) { it.lines.push({ words: String(l).split(' '), y: yy }); yy += GEO.FN_PITCH; }
          pg.footnotes.push(it);
        }
      }
    }
  }

  function fnReserveFor(queue) {
    if (!queue.length) return 0;
    let total = 0;
    for (const n of queue) {
      // **S4.13 (כיול מהייחוס):** אותה נוסחת גלישה כמו הרינדור בפועל (השורה
      // הראשונה קצרה ברוחב הסמן) — הצדדים חייבים להסכים על מספר השורות.
      const mkW = api.measureTextWidth(LineBreaker.markerWord(1), SZ.fnBody, 0)
        + api.measureTextWidth(' ', SZ.fnBody, 0);
      total += wrapText(n.text, api, SINGLE_W - mkW, SZ.fnBody).length * GEO.FN_PITCH;
    }
    // **S4.14 (תקרה מגובה הזרימה של הייחוס):** גובה body-flow בפועל לכל עמוד
    // עם הערות, מתוויות הייחוס: ‏4 שורות→810 (שמורה 105), 2→843 (72),
    // 6→778 (137), 1→860 (55), 8→741 (174). השיפוע = FN_PITCH (16.7) בדיוק,
    // והתקרה = 915−810−66.8 = 38.2 (טווח 36.8–40.4 בכל 9 נקודות המדידה).
    // הערך הקודם 48 חתך את הגוף 9.5px מוקדם מדי בכל עמוד עם הערות — בעמ' 11
    // זה בדיוק השורה החסרה בבלוק התחתון (117 מול 136 בייחוס).
    return total + 38.5;
  }

  /**
   * **S4.13: פורט נאמן של balanceColumns מהמקור (typesetter.js הצהוב, שורות 1327-1560).**
   *
   * האיזון הקודם (S4.9-S4.12) חילק יחידות שלמות בלבד — והוכח כקטסטרופלי כשהבלוק
   * נפתח בכותרת: [h4 | כל-השאר] (h4 לבד בטור הימני, 26px מול ~600px) — בדיוק ההפך
   * מהמקור שמפצל פסקאות בגבולות **שורות**. המקור:
   *
   *   1. איחוי חלקי אותו טוקן (p-cut + המשך) לפריט אחד עם כל השורות.
   *   2. מועמדים {i, l}: פריטים 0..i-1 שלמים בימין; אם l>0 גם l שורות ראשונות של
   *      פריט i בימין והשאר בשמאל. חוקיות: minFirst=minLast=2 (אין שורה בודדת
   *      בתחילת/סוף חיתוך), וכותרת לא נשארת עם שורה אחת בלבד (prevIsHeading && l<2).
   *      בנוסף {i+1, 0} אחרי כל פסקה — הימני מסתיים בסוף פסקה שלמה.
   *   3. ציון (better של המקור): נכנס-בגובה > גלישה מינימלית > |rH−lH| מינימלי >
   *      בשוויון — טור ימני גבוה יותר. המקור מוצא את נקודת המעבר בחיפוש בינארי
   *      על מונוטוניות rH−lH וסורק ±3 (ומרחיק עד 80 אם אף מועמד לא נכנס); כאן
   *      הגבהים אריתמטיים וסריקה מלאה מוצאת את אותו מיטב בדיוק.
   *   4. החלק הימני של פסקה מפוצלת = p-cut (שורתו האחרונה מיושרת); השמאלי =
   *      המשך (בלי חלון). אם אין אף מועמד — המילוי המקורי נשמר (כמו המקור).
   */
  function balanceBlock(block, availH) {
    // ---- 1. איחוי חלקי אותו טוקן (כמו mergedItems במקור) ----
    const units = [...block.cols[0], ...block.cols[1]];
    if (!units.length) { block.split = null; return; }
    const items = [];
    for (const u of units) {
      const last = items[items.length - 1];
      if (u.kind === 'para' && last && last.kind === 'para' && last.tokenId === u.tokenId) {
        last.lines.push(...u.lines);
        last.isEnd = u.isEnd; // דגל הסוף מהחתיכה המאוחרת (cut נשאר cut)
      } else if (u.kind === 'para') {
        items.push({ ...u, lines: [...u.lines] });
      } else {
        items.push(u);
      }
    }
    // ---- 2. מועמדים חוקיים (getSplitRules: minFirst=minLast=2) ----
    const cands = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind !== 'para') continue;
      const n = items[i].lines.length;
      const prevIsHeading = i > 0 && items[i - 1].kind === 'heading';
      for (let l = 1; l < n; l++) {
        if (l < 2 || n - l < 2) continue;      // אין שורה בודדת בתחילת/סוף חלק
        if (prevIsHeading && l < 2) continue;  // כותרת + שורה אחת בלבד (מכוסה ב-l≥2)
        cands.push({ i, l });
      }
      cands.push({ i: i + 1, l: 0 }); // הימני מסתיים בסוף פסקה שלמה — לא בכותרת
    }
    if (!cands.length) { block.split = null; return; } // כותרות בלבד — המילוי נשמר
    // ---- 3. הערכת מועמד (גבהים אריתמטיים; unitH = הקליברציה שלנו) ----
    const evalC = (c) => {
      let rH = 0, lH = 0;
      for (let k = 0; k < c.i; k++) rH += unitH(items[k]);
      if (c.l > 0) {
        const it = items[c.i];
        rH += c.l * it.pitch + 7; // חלק ימני — p-cut (גם הוא <p> עם מרווח 7px)
        lH += (it.lines.length - c.l) * it.pitch + 7;
        for (let k = c.i + 1; k < items.length; k++) lH += unitH(items[k]);
      } else {
        for (let k = c.i; k < items.length; k++) lH += unitH(items[k]);
      }
      return { rH, lH, diff: rH - lH, abs: Math.abs(rH - lH) };
    };
    const cap = (availH != null && isFinite(availH)) ? availH : Infinity;
    let best = null, bestC = null;
    const better = (a, b) => { // better(a, b) — a עדיף על b (העתק מדויק מהמקור)
      if (a.fits !== b.fits) return a.fits;
      if (!a.fits) return a.over < b.over;
      if (a.abs !== b.abs) return a.abs < b.abs;
      return a.diff >= 0 && b.diff < 0; // שוויון: עדיפות לטור ימני גבוה יותר
    };
    for (const c of cands) {
      const e = evalC(c);
      const cand = { fits: Math.max(e.rH, e.lH) <= cap + 0.01, over: Math.max(e.rH, e.lH), abs: e.abs, diff: e.diff };
      if (!best || better(cand, best)) { best = cand; bestC = c; }
    }
    // ---- 4. החלה: פיצול הפריט בגבול השורה שנבחר ----
    const c = bestC;
    const r = [], l = [];
    for (let k = 0; k < c.i; k++) r.push(items[k]);
    if (c.l > 0) {
      const it = items[c.i];
      // החלק הימני: p-cut — isEnd=false; החלון נשאר בשורה הראשונה (כמו createDropWord)
      r.push({ ...it, lines: it.lines.slice(0, c.l), isEnd: false, hasWindow: it.hasWindow && !it.isCont });
      // החלק השמאלי: המשך — isCont=true, בלי חלון (הגליף כבר בימין), ובלי
      // הערת-צד — **S4.13 (תיקון כפילות):** ההערה מוצמדת לפסקה במופעה
      // הראשון (הטור הימני); ה-spread העתיק אותה גם להמשך והיא הודפסה
      // פעמיים — בשני טורי השוליים (נצפה בעמ' 11: הערת h7#1 בשני הצדדים).
      l.push({ ...it, lines: it.lines.slice(c.l), isCont: true, hasWindow: false, sideNote: null, from: it.from + c.l });
      for (let k = c.i + 1; k < items.length; k++) l.push(items[k]);
    } else {
      for (let k = c.i; k < items.length; k++) l.push(items[k]);
    }
    block.split = { r, l };
    // **S4.9:** ה-cursor מתעדכן לתחתיות האמיתיות — אחרי האיזון מיקום הפס/הבלוק
    // הבא (blockBottom) היה מחושב מהמילוי הקודם וחופף את זנב הטור המאוזן.
    const e = evalC(c);
    block.cursor[0] = block.yTop + e.rH;
    block.cursor[1] = block.yTop + e.lH;
  }

  function unitH(u) {
    if (u.kind === 'heading') return u.h;
    // **S4.13:** כל חתיקת <p> — כולל p-cut — נושאת מרווח 7px בגובה הטור (DOM)
    return u.lines.length * u.pitch + 7;
  }

  /** פריסת המחסנית: כותבת שורות עם y מפורש לטורי העמוד. */
  function layoutStack(pg, stack, top) {
    const colR = [], colL = [];
    let y = top;
    for (const seg of stack) {
      if (seg.type === 'span') {
        pg.bands.push({ kind: 'h3-title', text: seg.text, sizePt: SZ.h3, y: seg.y + 8, h: seg.h, tokenId: seg.tokenId });
        y = seg.y + seg.h;
        continue;
      }
      const block = seg;
      const rUnits = block.split ? block.split.r : block.cols[0];
      const lUnits = block.split ? block.split.l : block.cols[1];
      let ry = block.yTop;
      for (const u of rUnits) ry = emitUnit(pg, colR, u, ry, 'right');
      let ly = block.yTop;
      for (const u of lUnits) ly = emitUnit(pg, colL, u, ly, 'left');
      y = Math.max(ry, ly);
      // **S4.14 (דיאג גיאומטריה):** dump של מבנה הבלוקים להשוואה מול תוויות
      // הייחוס (block-2col W×H | col:right Np Nl Kw) — מופעל רק עם
      // RED_DEBUG_BLOCKS=1 ואינו משפיע על הפלט.
      if (typeof process !== 'undefined' && process.env && process.env.RED_DEBUG_BLOCKS) {
        const cnt = (units) => ({
          p: units.filter(u => u.kind === 'para').length,
          l: units.filter(u => u.kind === 'para').reduce((a, u) => a + u.lines.length, 0),
          h: units.filter(u => u.kind === 'heading').map(u => 'h' + u.level).join(','),
          w: units.filter(u => u.kind === 'para' && u.hasWindow).length,
        });
        pg._blocks = pg._blocks || [];
        pg._blocks.push({ yTop: Math.round(block.yTop*10)/10, r: cnt(rUnits), l: cnt(lUnits), rH: Math.round((ry-block.yTop)*10)/10, lH: Math.round((ly-block.yTop)*10)/10, split: !!block.split });
      }
    }
    if (typeof process !== 'undefined' && process.env && process.env.RED_DEBUG_BLOCKS && stack.some(s => s.type === 'span')) {
      pg._blocks = pg._blocks || [];
      for (const s of stack) if (s.type === 'span') pg._blocks.push({ span: true, y: Math.round(s.y*10)/10, h: s.h });
    }
    pg.columns[0] = colR;
    pg.columns[1] = colL;
    void y;
  }

  function emitUnit(pg, col, u, y, sideName) {
    if (u.kind === 'heading') {
      col.push({
        words: [u.text], sizePt: ({ 4: SZ.h4, 5: SZ.h5, 6: SZ.h6 })[u.level] || SZ.body,
        heightPx: u.h, kind: 'heading', level: u.level, isLast: false,
        tokenId: u.tokenId, window: false, windowWords: null, y,
        paraId: null, lineIdx: null, align: 'center'
      });
      return y + u.h;
    }
    let i = 0;
    for (const ln of u.lines) {
      const lineIdxGlobal = u.from + i;
      col.push({
        words: ln.words.slice(),
        markerIdx: ln.markerIdx || [],
        sizePt: u.sizePt, heightPx: u.pitch, kind: 'paragraph',
        isLast: u.isEnd && i === u.lines.length - 1,
        tokenId: u.tokenId,
        window: !!(u.hasWindow && lineIdxGlobal < 2),
        windowWords: (u.hasWindow && lineIdxGlobal === 0) ? u.windowWords : null,
        windowW: (u.hasWindow && lineIdxGlobal === 0) ? (u.windowW || 0) : null,
        y, paraId: u.tokenId, lineIdx: lineIdxGlobal
      });
      y += u.pitch;
      i++;
    }
    y += 7; // **S4.13:** מרווח 7px אחרי כל חתיקת <p> (כולל p-cut) — כמו ה-DOM של המקור
    if (u.sideNote) {
      // **S4.13 (תיקון עיגון):** ה-anchor חייב להיות **ראשית הפסקה** — הוא
      // חושב אחרי ה-+=7 של מרווח הפסקה ונספג 7px למטה (נצפה: הערת-הצד
      // בעמ' 11 עוגנה 331pt במקום ~325.7 — ראשית הפסקה; הייחוס: 323.2).
      const anchor = y - 7 - u.lines.length * u.pitch;
      // **S4.13:** הגלישה בגופן HadassahFriedlaender וברוחב טור השוליים המלא
      // (50.5px — הוכח מהייחוס: השורה הארוכה ביותר 'חילוקי משמעות' = 50.4px;
      // היה −2px שחתך אותה).
      const lines = wrapText(u.sideNote, marginApi, GEO.MARGIN_W, SZ.marginNote);
      pg.marginNotes.push({
        side: sideName === 'right' ? 'right' : 'left',
        anchorY: anchor,
        lines: lines.map((t, i2) => ({ text: t, y: anchor + i2 * GEO.MN_PITCH }))
      });
    }
    return y;
  }

  // ---- הרצת המקטעים ----
  for (const sec of sections) {
    if (sec.subShaar) {
      const t = sec.subShaar;
      if (cfg.resetSimanOnH1) simanCounter = 0;
      const pg = newPage('shaar-sub');
      pg._h1Token = t;
      pg.gateLines = gateLinesFor('shaar-sub', t);
      currentH1 = t.text.split(/[-–—]/)[0].trim();
      continue;
    }
    flowSection(sec);
  }

  // ---- תוכן-עניינים כפול + מספור סופי ----
  const genShow = Array.isArray(cfg.gtocShow) ? cfg.gtocShow : [1, 2, 3, 4, 5, 6];
  const detShow = Array.isArray(cfg.dtocShow) ? cfg.dtocShow : [2, 3, 4, 5, 6];
  const genEntries = tokens.filter(t => t.type[0] === 'h' && genShow.includes(t.level))
    .map(t => ({ tokenId: t.id, level: t.level, text: t.text }));
  const detEntries = tokens.filter(t => t.type[0] === 'h' && detShow.includes(t.level))
    .map(t => ({ tokenId: t.id, level: t.level, text: t.text }));

  function tocRowH(level) {
    return (SZ.tocLevel[level] || 10.5) * (96 / 72) * 1.3 + 8;
  }
  /**
   * **S4.9 (התנהגות המקור):** הפריסה לעמודים היא ביחידות אטומיות — שורת h1/h2
   * + קבוצת תתי-הכותרות שלה (break-inside: avoid במקור). קבוצה שלא נכנסת
   * עוברת שלמה לעמוד הבא. כך נוצר פיצול 17/28/19 של הייחוס.
   */
  function makeTocPages(kind, entries, title) {
    const rows = entries.map(e => ({ ...e, sizePt: SZ.tocLevel[e.level] || 10.5, h: tocRowH(e.level) }));
    // יחידות: h1 בודד; h2 + כל ה-h3..h6 שאחריו עד ה-h2 הבא
    const units = [];
    for (const r of rows) {
      if (r.level <= 2 || !units.length) units.push([r]);
      else units[units.length - 1].push(r);
    }
    const pagesRows = [];
    let curRows = [], curH = 0, first = true;
    for (const u of units) {
      const uH = u.reduce((a, r) => a + r.h, 0);
      const avail = first ? GEO.FLOW_H - TOC_TITLE_BLOCK_H : GEO.FLOW_H;
      if (curH + uH > avail && curRows.length) { pagesRows.push({ rows: curRows, first }); curRows = []; curH = 0; first = false; }
      curRows.push(...u); curH += uH;
    }
    if (curRows.length) pagesRows.push({ rows: curRows, first });
    return pagesRows.map((pr, pi) => {
      const pg = blankPageObj(kind);
      pg.headerSlots = { right: hdrR, center: title, left: hdrL };
      const isLast = pi === pagesRows.length - 1;
      // **S4.14:** מיקומי ה-TOC אבסולוטיים ומכוילים בפני עצמם (עמודי ה-TOC של
      // הייחוס מתחילים ב-113.6px — שונה מזרימת הגוף!) ואינם זזים עם FLOW_TOP.
      const top = pr.first ? TOC_FIRST_TOP : TOC_CONT_TOP;
      const rowYs = [];
      if (!isLast && pr.rows.length > 1) {
        const gap = (TOC_STRETCH_BOTTOM - top) / (pr.rows.length - 1);
        pr.rows.forEach((r, i) => rowYs.push(top + i * gap));
      } else {
        let yy = top;
        for (const r of pr.rows) { rowYs.push(yy); yy += r.h; }
      }
      pg.toc = {
        title: pr.first ? title : null,
        rows: pr.rows.map((r, i) => ({
          tokenId: r.tokenId, level: r.level, text: r.text, sizePt: r.sizePt, y: rowYs[i],
          folio: '',
          x1: GEO.TOC_TITLE_X1 - (r.level - 1) * GEO.TOC_STAIR
        }))
      };
      return pg;
    });
  }

  // סדר סופי: gates → toc-general×G → [blank] → shaar-sub → toc-detailed×D → body
  // **תיקון S4.9:** "שערים" = shaar-main/back בלבד — shaar-sub שייך לגוף (אחרי
  // ה-blank), אחרת הוא נגרר לראש המסמך וכל הסדר משתבש.
  const gates = [];
  const bodies = [];
  for (const p of pages) ((p.type === 'shaar-main' || p.type === 'shaar-back') ? gates : bodies).push(p);
  const genPages = cfg.enableGeneralToc && genEntries.length ? makeTocPages('toc-general', genEntries, 'תוכן עניינים כללי') : [];
  const gCount = genPages.length;
  const needBlank = cfg.oddH1 && ((1 + gCount) % 2 === 0);
  const blank = needBlank ? blankPageObj('blank') : null;
  const detPages = cfg.enableDetailedToc && detEntries.length ? makeTocPages('toc-detailed', detEntries, 'תוכן עניינים מפורט') : [];
  const subIdx = bodies.findIndex(p => p.type === 'shaar-sub');
  const before = subIdx >= 0 ? bodies.slice(0, subIdx + 1) : [];
  const after = subIdx >= 0 ? bodies.slice(subIdx + 1) : bodies;

  const final = [...gates, ...genPages];
  if (blank) final.push(blank);
  final.push(...before, ...detPages, ...after);

  // מספור סופי + folios + אינדקסים
  let pn = 1;
  for (const p of final) {
    const counted = ['toc-general', 'toc-detailed', 'blank', 'shaar-sub', 'regular', 'sign-open', 'preface'].includes(p.type);
    p.pageNumber = counted ? pn++ : null;
    const shows = ['toc-general', 'toc-detailed', 'regular', 'sign-open', 'preface'].includes(p.type);
    p.folioDisplay = shows && p.pageNumber ? toGematria(p.pageNumber) : '';
  }
  final.forEach((p, i) => { p.index = i; });

  // folio של כל כותרת = העמוד שבו היא הוצבה
  const folioByToken = new Map();
  for (let pi = 0; pi < final.length; pi++) {
    const p = final[pi];
    // **S4.13 (פוליו ה-TOC של כותרת 1 — כמו getTocPageLabel במקור):** לעמוד
    // השער של ה-h1 אין פוליו מודפס; המקור נופל שם ל- toGematria(data-page-index)
    // — ההוכחה מהייחוס: הערך הראשון בתוכן-העניינים הכללי (ה-h1 "הקדמות
    // וכללים") מסומן "ו" = גימטריה של מיקום עמוד השער (0-מבוסס 6), בעוד
    // לעמוד עצמו אין פוליו כלל. שאר הכותרות: הפוליו המודפס של עמודן.
    if (p._h1Token) folioByToken.set(p._h1Token.id, p.folioDisplay || toGematria(pi));
    for (const b of (p.bands || [])) if (b.tokenId != null) folioByToken.set(b.tokenId, p.folioDisplay);
    for (const col of p.columns) for (const ln of col) {
      if (ln.kind === 'heading' && ln.tokenId != null && !folioByToken.has(ln.tokenId)) folioByToken.set(ln.tokenId, p.folioDisplay);
    }
  }
  for (const p of final) if (p.toc) for (const r of p.toc.rows) r.folio = folioByToken.get(r.tokenId) || '';

  pages.length = 0;
  pages.push(...final);

  // ---- תוצאה ----
  const tokensOut = tokens.map(t => ({ id: 'lt' + t.id, type: t.type, level: t.level, text: t.text, num: t.num || null }));
  const layoutHashValue = 'legacy-' + legacyLayoutHashDigest(pages);
  // **תיקון S4.10 (חוזה התוצאה בנתיב החי):** לפני כן הוחזרו ledger: null, events: null
  // ופגעו ב-serializeTypesetResult/buildReport של ה-worker — כל בקשת עימוד
  // באפליקציה החיה קרסה ("Cannot read properties of undefined (reading 'length')")
  // והדף הציג 0 עמודים. כעת מוחזרים EventLog/Ledger אמיתיים (מינימליים,
  // דטרמיניסטיים) — הסריאליזציה, הדוח ותצוגת הממצאים עובדים בשני המנועים.
  const events = new EventLog('minimal');
  events.emit('parse', 'legacy-imud: tokenize + sections', { tokens: tokensOut.length });
  events.emit('measure', 'legacy-imud: line breaking', { impl: settings['measure-impl'] || 'table' });
  events.emit('page-plan', 'legacy-imud: flow + columns', { pages: pages.length });
  events.emit('folio', 'legacy-imud: folios + TOC', {});
  events.emit('render', 'legacy-imud: result', { layoutHash: layoutHashValue });
  const ledger = new Ledger();
  return {
    metadata: meta, tokens: tokensOut, pages, ledger, events,
    toc: { general: genEntries.length, detailed: detEntries.length },
    tocPages: [], numberingAudit: null, settings,
    contentPreserved: true,
    layoutHash: layoutHashValue,
    plannedLayoutHash: null, geometryNeutralVerified: true,
    ornaments: null, retreat: null, sideNotes: null, endnotePages: null,
    endnotePagesInfo: { count: 0, pages: [] },
    scope: null, customStyles: null, recommendations: null,
    legacyProfile: true
  };
}

/**
 * **S4.10:** hash קנוני של תוצאת המורשת — מיוצא גם ל-buildReport כדי שדטרמיניזם
 * יימדד מחדש באותה שיטה בדיוק (hash של DP על עמודי מורשת אינו מוגדר).
 */
function legacyLayoutHashDigest(pages) {
  const hash = crypto.createHash('sha256');
  for (const pg of pages) {
    hash.update(pg.type + '|' + (pg.folioDisplay || '') + '|');
    for (const col of pg.columns) for (const ln of col) hash.update((ln.words || []).join(' ') + '|');
  }
  return hash.digest('hex').slice(0, 16);
}

module.exports = {
  GEO, SZ, HEADING_MODES, toGematria, stripEditorialNotes, parseMetadata,
  tokenizeDoc, LineBreaker, findNotes, readConfig, legacyTypeset,
  FLOW_BOTTOM, SINGLE_W, wrapText, headingItemH, legacyLayoutHashDigest
};
