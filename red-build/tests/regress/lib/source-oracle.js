'use strict';
/**
 * אורקל מקור→פלט עצמאי לנתיב ה-legacy (legacyTypeset) — סוכן 4.
 *
 * למה אורקל נפרד: `contentPreserved` ו-ledger הם החשבונאות של המנוע עצמו.
 * `contentPreserved` סופר רק מילים שחסרות (מקור פחות פלט) — כפילות לעולם אינה
 * "חסר", ולכן הערה שמופיעה בעמוד שגוי או כותרת שנפלטת פעמיים עוברות בשקט
 * (R-01: כותרת אבדה והכותרת שאחריה הוכפלה; R-04: הערה נפלטה בעמוד שאין בו שורה של הפסקה שלה).
 * האורקל כאן מנתח את טקסט המקור בעצמו (ללא הטוקנייזר של המנוע) ומשווה:
 *   · לכל פסקה: רצף המילים בפלט (לפי tokenId/lineIdx) = רצף המילים במקור, בלי
 *     סמני הערה; שורות רציפות וייחודיות (lineIdx 0..n-1 בלי כפילות);
 *   · לכל כותרת בתוך עמודה: נפלטת, ולא פעמיים (כותרות קצרות);
 *   · לכל הערה (S4.9 / S4.24 — legacy-imud-flow.js): היא מופיעה בכל עמוד שבו יש שורות של הפסקה
 *     הנושאת אותה — גם בעמודי ההמשך של פסקה שנחצית (התנהגות המקור הנצפית; ה-PDF ההיסטורי מציג את אותה
 *     הערה בשני עמודי הפסקה) — ולא בעמוד שאין בו אף שורה של הפסקה (NOTE_GHOST), ולא יותר מפעם אחת בעמוד
 *     (NOTE_DUP); כל הערה נפלטת לפחות פעם אחת בעמוד של הפסקה (NOTE_LOST); סדר הפליטות החוקיות כסדר המקור.
 *     (בגרסה קודמת של האורקל — "כל הערה בדיוק פעם אחת" — סומנה בטעות חזרה חוקית כבאג "R-02"; בוטל.)
 *   · גיאומטריה (אופציונלי): אין חפיפת שורות, אין מילה מחוץ לעמוד, הגוף לא חודר
 *     למרזב ההערות.
 *
 * מודל המקור (התנהגות המקור ש-tokenizeDoc משחזר — legacy-imud-flow.js):
 *   · שורות מטא-דאטה בראש המסמך אינן גוף;
 *   · 'כותרת N - טקסט' = כותרת. הערות מקוננות וסוגר פותח ללא סוגר — מחוץ למודל; מסמכי הבדיקה נמנעים מהם.
 *     הערות-צד ('כותרת 7') והערות-סיום ('הערת סיום - …') אינן טוקנים של parseSource — ראו noteLinesOf /
 *     censusNotes / compareNoteLines (מודל נפרד: כל שורת הערת-סיום = הערה נפרדת [D-40, block-tokenizer];
 *     כותרות 7 רצופות נצברות ונצמדות לפסקה הבאה; הערות שנותרו בסוף המסמך = פסקה סינתטית);
 *   · שורה שמתחילה ב-'[' נדבקת לפסקה הקודמת (הדבקת בלוק-טקסט של המקור), אלא
 *     אם הקודם כותרת — אז היא פסקה עצמאית;
 *   · רווח לפני '[' נבלע; הערה = [ ... ] שטוחה (הסוגר הראשון סוגר).
 *
 * הקובץ מייצא רק פונקציות טהורות; אין בו קוד ייצור ואין תלות בהגדרות המנוע
 * מלבד המקרן הגיאומטרי (legacy-projector) לבדיקת הגיאומטריה.
 */

const HEADER_RE = /^(שם הספר|נושא מפורט|נושא|פרטי מהדורא|שם המחבר|מקום ושנת הוצאה|שמירת זכויות|פרטי הוצאה לאור|פרטי קשר|פרטים נוספים)\s*[-–—]/;
const HEADING_RE = /^כותרת\s*(\d+)\s*[-–—]\s*(.*)$/;
const IS_HEADING_LINE = (s) => /^כותרת\s*\d/.test(s.trim());

/** קודי הפרות — יציבים, כדי שבדיקות יוכלו לסנן לפי סוג. */
const V = Object.freeze({
  TOKEN_COUNT: 'TOKEN_COUNT', // מספר הטוקנים ≠ מספר פריטי המקור (פסקה התמזגה/התפצלה)
  TOKEN_TYPE: 'TOKEN_TYPE', // סוג הטוקן ≠ סוג פריט המקור
  PARA_LOST: 'PARA_LOST', // פסקה לא נפלטה בכלל
  PARA_LINES: 'PARA_LINES', // lineIdx כפול או לא רציף
  PARA_WORDS: 'PARA_WORDS', // רצף המילים בפלט ≠ המקור
  MARKER_COUNT: 'MARKER_COUNT', // מספר סמני ההערה בפסקה ≠ מספר ההערות במקור
  PAREN_SCOPE: 'PAREN_SCOPE', // דגלי הסוגריים (parenFlags) ≠ המילים שבתוך ( ) במקור
  HEADING_LOST: 'HEADING_LOST', // כותרת (h4–h6) לא נפלטה
  HEADING_DUP: 'HEADING_DUP', // כותרת קצרה נפלטה יותר מפעם אחת
  NOTE_LOST: 'NOTE_LOST', // הערה מהמקור לא נפלטה (באף עמוד של הפסקה הנושאת אותה)
  NOTE_GHOST: 'NOTE_GHOST', // הערה נפלטה בעמוד שאין בו אף שורה של הפסקה הנושאת אותה (R-04; S4.24)
  NOTE_DUP: 'NOTE_DUP', // אותה הערה נפלטה באותו עמוד יותר פעמים ממספר הפסקאות הנושאות אותה בעמוד
  NOTE_ORDER: 'NOTE_ORDER', // אותן הערות (פליטות חוקיות), סדר שונה מהמקור
  CONTENT_PRESERVED: 'CONTENT_PRESERVED', // contentPreserved !== true
  LEDGER_LOSS: 'LEDGER_LOSS', // ledger מדווח content-loss
  GEO_OVERLAP: 'GEO_OVERLAP', // חפיפת שורות באותו טור
  GEO_OUTSIDE: 'GEO_OUTSIDE', // מילה/שורה מחוץ לעמוד
  GEO_BODY_FN: 'GEO_BODY_FN', // הגוף חודר למרזב ההערות
  ENDNOTE_LOST: 'ENDNOTE_LOST', // שורת 'הערת סיום -' מהמקור לא נפלטה בעמודי הערות-הסיום (R-05)
  ENDNOTE_DUP: 'ENDNOTE_DUP', // הערת-סיום נפלטה יותר פעמים ממופעיה במקור
  ENDNOTE_TEXT: 'ENDNOTE_TEXT', // בעמודי הערות-הסיום יש הערה שאינה במקור (טקסט שונה/קטוע)
  ENDNOTE_ORDER: 'ENDNOTE_ORDER', // אותן הערות-סיום, סדר שונה מהמקור
  ENDNOTE_MARKER: 'ENDNOTE_MARKER', // סמן הערת-סיום כפול או חסר
  SIDENOTE_LOST: 'SIDENOTE_LOST', // הערת-צד ('כותרת 7') לא נפלטה בשוליים
  SIDENOTE_PAGE: 'SIDENOTE_PAGE', // הערת-צד נפלטה בעמוד שבו אין את תחילת הפסקה הבעלים
  SIDENOTE_DUP: 'SIDENOTE_DUP', // הערת-צד נפלטה יותר פעמים ממספר בעליה בעמוד
  SIDENOTE_TEXT: 'SIDENOTE_TEXT' // בשוליים יש הערה שאינה במקור
});

const words = (s) => String(s).split(/\s+/).filter(Boolean);

/** הערות שטוחות: [ ... ] — הסוגר הראשון סוגר. מחזיר גוף (בלי הערות) והערות. */
function splitNotes(line) {
  const notes = [];
  const body = line.replace(/\[([^\]]*)\]/g, (_, n) => { notes.push(n); return ' '; });
  return { body, notes };
}

/**
 * ניתוח מקור → פריטים. כולל את הדבקת שורת-הערה (ראה כותרת הקובץ).
 * @returns {Array<{kind:'h',level:number,text:string}|{kind:'p',words:string[],notes:string[][]}>}
 */
/** שורות המקור אחרי הסרת הפתיח (מטא-דאטה) והדבקת שורות-הערה — הבסיס המשותף ל-parseSource ול-noteLinesOf. */
function sourceLines(text) {
  const raw = String(text).split(/\r?\n/);
  let i = 0;
  while (i < raw.length && (!raw[i].trim() || HEADER_RE.test(raw[i].trim()))) i++;
  // הדבקה: שורה שמתחילה ב-'[' נדבקת לשורה הקודמת הלא-ריקה אם אינה כותרת
  const lines = [];
  for (; i < raw.length; i++) {
    const ln = raw[i];
    if (lines.length && ln.trim().startsWith('[')) {
      let j = lines.length - 1;
      while (j >= 0 && !lines[j].trim()) j--;
      if (j >= 0 && !IS_HEADING_LINE(lines[j])) { lines[j] = lines[j].replace(/\s+$/, '') + ln.trim(); continue; }
    }
    lines.push(ln);
  }
  return lines;
}

function parseSource(text) {
  const lines = sourceLines(text);
  const items = [];
  for (const l of lines) {
    const t = l.trim();
    if (!t) continue;
    const m = t.match(HEADING_RE);
    if (m) { items.push({ kind: 'h', level: +m[1], text: m[2].trim() }); continue; }
    const { body, notes } = splitNotes(t);
    items.push({ kind: 'p', words: words(body), notes: notes.map(words), pflags: paraParenFlags(t) });
  }
  return items;
}

/**
 * [מודל ישן, ברמת מילות-הגוף — נשמר לתאימות; ה-oracle משתמש ב-paraParenFlags]
 * דגל "בתוך סוגריים" לכל מילת גוף במקור. מילה שפותחת ב-'(' או סוגרת ב-')' או
 * נמצאת ביניהן מסומנת. אם הסוגריים בפסקה אינם מאוזנים — null (מחוץ למודל).
 */
function parenScope(ws) {
  let depth = 0;
  const flags = [];
  for (const w of ws) {
    const open = (w.match(/\(/g) || []).length;
    const close = (w.match(/\)/g) || []).length;
    const before = depth;
    depth += open - close;
    if (depth < 0) return null;
    flags.push(before > 0 || open > 0 || close > 0);
  }
  return depth === 0 ? flags : null;
}

const NOTE_SENTINEL = String.fromCharCode(1);

/**
 * דגלי "בתוך סוגריים" לכל חלק-גוף כפי שהמנוע פולט אותו, ברמת **המילה המקורית**: מילה מופרדת-ברווחים
 * (כולל ההערה שבתוכה; רווח לפני '[' נבלע, כמו בטוקנייזר המקורי) שנוגעת בטווח סוגריים — כל חלקיה
 * (קידומת/סיומת סביב הערה) מסומנים, כי במנוע (S4.19) "דגל הסוגריים של המילה המקורית מועבר לכל חלקיה".
 * הסמן עצמו אינו נספר (המנוע מוציא אותו מהגוף). מחזיר מערך מקביל ל-words(body) או null אם הסוגריים
 * אינם מאוזנים (מחוץ למודל). מילה = כל רצף ללא רווח; סוגריים בתוך טקסט ההערה אינם נספרים.
 */
function paraParenFlags(textWithNotes) {
  const marked = String(textWithNotes)
    .replace(/\[([^\]]*)\]/g, NOTE_SENTINEL)
    .replace(new RegExp('\\s+(?=' + NOTE_SENTINEL + ')', 'g'), '');
  const flags = [];
  let depth = 0;
  for (const w of marked.split(/\s+/).filter(Boolean)) {
    const bare = w.split(NOTE_SENTINEL).join('');
    const open = (bare.match(/\(/g) || []).length;
    const close = (bare.match(/\)/g) || []).length;
    const before = depth;
    depth += open - close;
    if (depth < 0) return null;
    const f = before > 0 || open > 0 || close > 0;
    const parts = w.split(NOTE_SENTINEL).filter(Boolean).length;
    for (let k = 0; k < parts; k++) flags.push(f);
  }
  return depth === 0 ? flags : null;
}

/**
 * מפקד הפלט: לכל פסקה (לפי tokenId) המילים בסדר lineIdx בלי סמנים; פליטות
 * כותרות; יחידות הערה (סמן + מילים; המשך '(המשך)' מצטרף ליחידה האחרונה).
 */
function censusOutput(result) {
  const paras = new Map(); // tokenId → Map(lineIdx → {words, markers})
  const headingEmissions = new Map(); // tokenId → [{page,text}]
  const units = []; // [{marker, words, page}]
  let lineDup = 0;
  result.pages.forEach((p, pi) => {
    // עמודי הערות-הסיום נושאים פריטי 'paragraph' עם tokenId של הפסקה הבעלים ו-lineIdx=null — אינם שורות גוף של
    // אותה פסקה; ספירתם כאן שיבשה את עמודי הבעלים (כיסוי/רפאים) ואת lineDup. הם נמנים ב-censusNotes.
    for (const col of (p.type === 'endnotes' ? [] : (p.columns || []))) {
      for (const it of col) {
        if (it.kind === 'paragraph') {
          if (!paras.has(it.tokenId)) paras.set(it.tokenId, new Map());
          const m = paras.get(it.tokenId);
          if (m.has(it.lineIdx)) lineDup++;
          const mk = new Set(it.markerIdx || []);
          const ws = [];
          const pf = []; // דגל סוגריים לכל מילה ב-ws (null = מילת חלון: אין דגל במנוע)
          (it.windowWords || []).forEach((w) => { ws.push(w); pf.push(null); });
          (it.words || []).forEach((w, k) => { if (!mk.has(k)) { ws.push(w); pf.push(it.parenFlags ? !!it.parenFlags[k] : null); } });
          m.set(it.lineIdx, { words: ws, parens: pf, markers: (it.markerIdx || []).length, page: pi });
        } else if (it.kind === 'heading') {
          if (!headingEmissions.has(it.tokenId)) headingEmissions.set(it.tokenId, []);
          headingEmissions.get(it.tokenId).push({ page: pi, text: (it.words || []).join(' ') });
        }
      }
    }
    for (const f of p.footnotes || []) {
      for (const ln of f.lines || []) {
        for (const w of ln.words || []) {
          if (w.mk) { units.push({ marker: w.t, words: [], page: pi }); continue; }
          if (w.gap || w.t === '' || w.t === '(המשך)') continue;
          if (!units.length) units.push({ marker: null, words: [], page: pi });
          units[units.length - 1].words.push(w.t);
        }
      }
    }
  });
  return { paras, headingEmissions, units, lineDup };
}

// ───────────────────────── הערות-סיום והערות-צד (כותרת 7) ─────────────────────────
// מודל מקור נפרד מ-parseSource: שורות אלה אינן טוקנים של פסקה/כותרת ב-parseSource, והמנוע מטפל בהן בטוקניזציה
// (pendingSideNote / pendingEndNote ב-tokenizeDoc) — המקום שבו מילים יכולות להיעלם *לפני* ש-contentPreserved
// של המנוע (פלט מול טוקנים) מתחיל לספור. לכן המודל כאן נגזר מטקסט המקור בלבד:
//   · 'הערת סיום - טקסט' — כל שורה היא הערה נפרדת, בסדר המקור (D-40; block-tokenizer: endnote לכל שורה; "הערת סיום =
//     תוכן — שום טקסט לא נעלם בשקט");
//   · 'כותרת 7 - טקסט' — הערת-צד של הפסקה הבאה; כותרות 7 רצופות (גם כשביניהן כותרות אחרות) נצברות להערה אחת;
//   · הערות (צד/סיום) שנותרו בסוף המסמך ללא פסקה — המנוע פולט פסקה סינתטית בסוף (S5.2 F4): הערות-הצד כגוף הפסקה;
//   · הערות עורך ##…## מוסרות כליל (REQ-PAR-03) לפני כל ניתוח.
// מחוץ למודל: מקף בתוך הערת-המקור של כותרת ('כותרת 7 מספר N (מקור – x – y) - …', O-5), ושורות מטא-דאטה באמצע המסמך
// (ברירת מחדל: נשארות פסקה כמו REQ-PAR-01; metaAnywhere:true מדמה את המנוע שצורך אותן — O-6).

const DASH_ONLY = /^[-–—]+$/;
/** כותרת כפי שמופיעה בקורפוסים האמיתיים: גם 'כותרת N מספר M - טקסט' (דריסת מספור) ו-'כותרת N (מקור: …) - טקסט' (הערת מקור) — ללא אלה זהה ל-HEADING_RE. */
const NOTE_HEADING_RE = /^כותרת\s*(\d+)(?:\s+מספר\s+\d+)?(?:\s*\([^)]*\))?\s*[-–—]\s*(.*)$/;
/** מפתח השוואה: מילים → טקסט; רווח לפני פיסוק נבלע (אותו נרמול ש-stripEditorialNotes של המנוע מחיל על המקור). */
const normKey = (ws) => ws.join(' ').replace(/\s+([,.:;!?])/g, '$1').trim();

/**
 * @returns {{ends:Array<{words:string[],owner:number}>, sides:Array<{words:string[],owner:number}>, tokenCount:number, tokenLines:string[]}}
 *   owner = אינדקס הטוקן (פריט מקור) של הפסקה שנושאת את ההערה; owner===tokenCount ⇒ זנב סינתטי.
 *   tokenCount חייב להיות שווה למספר הטוקנים של המנוע (פחות זנב סינתטי) — אחרת המודל לא מיושר והבדיקה אינה אמינה.
 */
function noteLinesOf(text, { endPrefix = 'הערת סיום -', metaAnywhere = false } = {}) {
  const lines = sourceLines(String(text).replace(/##[\s\S]*?##/g, ''));
  const ends = [], sides = [], tokenLines = [];
  let pendE = [], pendS = [], tok = 0;
  const unclosed = (x) => { const o = x.indexOf('['); return o !== -1 && x.indexOf(']', o + 1) === -1; };
  for (let i = 0; i < lines.length; i++) {
    let t = lines[i].trim();
    if (!t) continue;
    if (metaAnywhere && HEADER_RE.test(t)) continue; // המנוע (parseMetadata) צורך שורות מטא-דאטה גם באמצע המסמך — O-6 ב-README
    // הערה שנפתחה ב-'[' ולא נסגרה נמשכת לשורות הבאות (עד סגירה או שורה ריקה) — הערת שוליים חוצת-שורות במקור
    while (unclosed(t) && i + 1 < lines.length && lines[i + 1].trim()) { i++; t += ' ' + lines[i].trim(); }
    if (endPrefix && t.startsWith(endPrefix)) {
      const e = { words: words(t.slice(endPrefix.length).replace(/^[:\-–—]\s*/, '')), owner: null };
      ends.push(e); pendE.push(e);
      continue;
    }
    const m = t.match(NOTE_HEADING_RE);
    if (m && +m[1] === 7) {
      const s = { words: words(m[2]), owner: null };
      sides.push(s); pendS.push(s);
      continue;
    }
    if (!m) { // פסקה — צורכת את ההערות הממתינות
      for (const e of pendE) e.owner = tok;
      for (const s of pendS) s.owner = tok;
      pendE = []; pendS = [];
    }
    tokenLines.push(t);
    tok++;
  }
  for (const e of pendE) e.owner = tok;
  for (const s of pendS) s.owner = tok;
  return { ends, sides, tokenCount: tok, tokenLines };
}

/**
 * מפקד הערות בפלט: הערות-סיום (עמודי type 'endnotes', לפי סדר הפליטה; '(המשך)' מצטרף להערה האחרונה) והערות-צד
 * (marginNotes לכל עמוד).
 * @returns {{endNotes:Array<{marker:string|null,words:string[],page:number}>, margins:Array<{page:number,side:string,anchorY:number,words:string[]}>}}
 */
function censusNotes(result) {
  const endNotes = [];
  const margins = [];
  result.pages.forEach((p, pi) => {
    if (p.type === 'endnotes') {
      for (const col of p.columns || []) {
        for (const it of col) {
          if (it.kind !== 'paragraph') continue;
          const mk = new Set(it.markerIdx || []);
          const ws = (it.words || []).filter((w, k) => !mk.has(k));
          const li = (it.markerIdx || [])[0];
          const label = li == null ? null : it.words[li];
          if (label != null && label !== '(המשך)') endNotes.push({ marker: label, words: ws.slice(), page: pi });
          else {
            if (!endNotes.length) endNotes.push({ marker: null, words: [], page: pi });
            endNotes[endNotes.length - 1].words.push(...ws);
          }
        }
      }
    }
    for (const mn of p.marginNotes || []) {
      margins.push({ page: pi, side: mn.side, anchorY: mn.anchorY, words: (mn.lines || []).flatMap((l) => words(l.text)) });
    }
  });
  return { endNotes, margins };
}

/**
 * משווה הערות-סיום והערות-צד שבפלט למודל המקור (noteLinesOf). מחזיר רשימת הפרות {code, detail}; ריקה = תקין.
 *   · הערות-סיום: כל שורת מקור מופיעה בעמודי ההערות בדיוק פעם אחת, בטקסט המלא ובסדר המקור; סמנים ייחודיים;
 *   · הערות-צד: כל קבוצה (כותרות 7 רצופות) מופיעה בשוליים של העמוד שבו שורה 0 של הפסקה הבעלים (בדיוק פעם);
 *     קבוצה בזנב — כגוף הפסקה הסינתטית האחרונה;
 *   · contentPreserved ו-ledger (כמו compareToSource) — חשבונאות המנוע חייבת להסכים עם האורקל.
 * @param {object} model תוצאת noteLinesOf
 * @param {object} result תוצאת legacyTypeset
 */
function compareNoteLines(model, result) {
  const v = [];
  const add = (code, detail) => v.push({ code, detail });
  const snip = (t) => String(t).split(' ').slice(0, 6).join(' ');
  const cn = censusNotes(result);
  const co = censusOutput(result);
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);

  // ── הערות-סיום ──
  const srcKeys = model.ends.map((e) => normKey(e.words));
  const outKeys = cn.endNotes.map((e) => normKey(words(e.words.join(' '))));
  const sc = new Map(), oc = new Map();
  srcKeys.forEach((k) => bump(sc, k)); outKeys.forEach((k) => bump(oc, k));
  let enBroken = false;
  for (const [k, n] of sc) {
    const got = oc.get(k) || 0;
    if (got < n) { enBroken = true; add(V.ENDNOTE_LOST, `הערת-סיום "${snip(k)}…" (${k.split(' ').length} מילים) במקור ×${n}, בעמודי ההערות ×${got}`); }
  }
  for (const [k, n] of oc) {
    const exp = sc.get(k) || 0;
    if (exp === 0) { enBroken = true; add(V.ENDNOTE_TEXT, `בעמודי ההערות יש הערה "${snip(k)}…" (${k.split(' ').length} מילים) שאינה במקור`); }
    else if (n > exp) { enBroken = true; add(V.ENDNOTE_DUP, `הערת-סיום "${snip(k)}…" נפלטה ×${n} (במקור ×${exp})`); }
  }
  if (!enBroken && srcKeys.some((k, i) => k !== outKeys[i])) add(V.ENDNOTE_ORDER, 'אותן הערות-סיום אך בסדר שונה מהמקור');
  const markers = cn.endNotes.map((e) => e.marker);
  if (markers.some((m) => m == null) || new Set(markers).size !== markers.length) add(V.ENDNOTE_MARKER, `סמני הערות-הסיום כפולים או חסרים: ${markers.slice(0, 8).join(',')}`);

  // ── הערות-צד ──
  const keyOfSide = (ws) => normKey(ws.filter((w) => !DASH_ONLY.test(w))); // המפריד שהמנוע מוסיף בצבירה (—) אינו חלק מהמקור
  const groups = new Map(); // owner → [side]
  for (const s of model.sides) { if (!groups.has(s.owner)) groups.set(s.owner, []); groups.get(s.owner).push(s); }
  const expPages = new Map(); // מפתח → [עמוד]
  for (const [owner, ss] of groups) {
    const key = keyOfSide(ss.flatMap((s) => s.words));
    if (!key) continue; // כותרת 7 ריקה — אין מה להציג
    if (owner >= model.tokenCount) { // זנב סינתטי: הערות-הצד הופכות לגוף הפסקה האחרונה
      const m = co.paras.get(owner);
      const got = m ? normKey([...m.keys()].sort((a, b) => a - b).flatMap((k) => m.get(k).words).filter((w) => !DASH_ONLY.test(w))) : '';
      if (got !== key) add(V.SIDENOTE_LOST, `הערת-צד בזנב המסמך "${snip(key)}…" אינה בפסקה הסינתטית האחרונה (בפלט: "${snip(got)}")`);
      continue;
    }
    const m = co.paras.get(owner);
    const first = m && m.get(0);
    if (!first) { add(V.SIDENOTE_LOST, `הערת-צד "${snip(key)}…": לפסקה הבעלים (טוקן ${owner}) אין שורה 0 בפלט`); continue; }
    if (!expPages.has(key)) expPages.set(key, []);
    expPages.get(key).push(first.page);
  }
  const actPages = new Map();
  for (const mg of cn.margins) {
    const key = keyOfSide(mg.words);
    if (!key) continue;
    if (!actPages.has(key)) actPages.set(key, []);
    actPages.get(key).push(mg.page);
  }
  const removeOnce = (arr, x) => { const i = arr.indexOf(x); if (i >= 0) arr.splice(i, 1); return i >= 0; };
  for (const [key, exp] of expPages) {
    const act = (actPages.get(key) || []).slice();
    const restExp = [];
    for (const pg of exp) if (!removeOnce(act, pg)) restExp.push(pg);
    while (restExp.length && act.length) { // אותו טקסט קיים — בעמוד אחר
      const e = restExp.shift(), a = act.shift();
      add(V.SIDENOTE_PAGE, `הערת-צד "${snip(key)}…" צריכה להיות בעמוד ${e + 1} (תחילת הפסקה), נפלטה בעמוד ${a + 1}`);
    }
    for (const e of restExp) add(V.SIDENOTE_LOST, `הערת-צד "${snip(key)}…" (${key.split(' ').length} מילים) לא נפלטה בשוליים (עמוד הפסקה ${e + 1})`);
    for (const a of act) add(V.SIDENOTE_DUP, `הערת-צד "${snip(key)}…" נפלטה פעם נוספת בעמוד ${a + 1}`);
    actPages.delete(key);
  }
  for (const [key, pgs] of actPages) add(V.SIDENOTE_TEXT, `בשוליים יש הערה "${snip(key)}…" (עמ' ${pgs.map((x) => x + 1).join(',')}) שאינה במקור`);

  // חשבונאות המנוע חייבת להסכים עם האורקל
  if (result.contentPreserved !== true) add(V.CONTENT_PRESERVED, `contentPreserved=${result.contentPreserved}`);
  const loss = [...result.ledger.issues.values()].filter((x) => x.kind === 'content-loss');
  if (loss.length) add(V.LEDGER_LOSS, `ledger content-loss ×${loss.length}`);
  return v;
}

const noteText = (ws) => (Array.isArray(ws) ? ws : words(ws)).join(' ');

/** בעלי ההערות לפי פריטי המקור (parseSource): tokenId = אינדקס הפריט. מפה בסדר המסמך. */
function ownersFromItems(items) {
  const m = new Map();
  items.forEach((x, i) => { if (x.kind === 'p' && x.notes.length) m.set(i, x.notes.map(noteText).filter(Boolean)); });
  return m;
}

/**
 * בעלי ההערות לפי טקסט הטוקנים של המנוע (`result.tokens`; הטקסט כולל את [ההערה] הגולמית) — לקורפוסים אמיתיים
 * שמשתמשים בתחביר מחוץ לדקדוק האורקל (שורות כותרת-עמוד, 'כותרת 0/1/7', הערות-סיום). הבעלות כאן פחות בלתי-תלויה
 * (הטוקנייזר של המנוע קובע איזו פסקה נושאת איזו הערה) אך מספיקה לבדיקת העמוד.
 */
function ownersFromTokens(result) {
  const m = new Map();
  result.tokens.forEach((t, i) => {
    if (t.type !== 'p') return;
    const ns = splitNotes(String(t.text)).notes.map(noteText).filter(Boolean);
    if (ns.length) m.set(i, ns); // tokenId בפריטי הפלט = אינדקס הטוקן (כמו ב-compareToSource)
  });
  return m;
}

/**
 * סיווג פליטות ההערות לפי עמודי הפסקה הבעלים (ראו כותרת הקובץ; S4.9 / S4.24 ב-legacy-imud-flow.js).
 *   · חוקית — הפסקה הנושאת את ההערה יש לה שורות בעמוד הפליטה (כולל חזרה בעמוד המשך של פסקה שנחצית);
 *   · רפאים (ghost) — אין לאף פסקה הנושאת את ההערה שורה בעמוד הפליטה;
 *   · כפילות (dup) — באותו עמוד יותר פליטות ממספר הפסקאות הנושאות את ההערה שיש להן שורות בעמוד;
 *   · אבודה (lost) — פחות פליטות חוקיות ממופעי ההערה במקור.
 * הסיווג לפי **טקסט** ההערה: אם אותו טקסט מופיע בפסקה אחרת שיש לה שורות באותו עמוד — רפאים בעמוד הזה אינם
 * נתפסים (שלילי-כוזב אפשרי, לעולם לא חיובי-כוזב); מסמכי הבדיקה משתמשים במילים ייחודיות ולכן אינם חשופים לכך.
 * @param census תוצאת censusOutput
 * @param owners Map<tokenId, string[]> — ownersFromItems / ownersFromTokens
 * @returns {{ghost:Array,dup:Array,lost:Array,orderViolation:boolean,emissions:number,legal:number,repeats:number}}
 *   repeats = פליטות חוקיות מעבר למופע אחד לכל הערה במקור = חזרות S4.9 בעמודי המשך (מידע; אינו הפרה)
 */
function classifyNotes(census, owners) {
  const pagesOf = new Map();
  for (const [tid, m] of census.paras) { const s = new Set(); for (const l of m.values()) s.add(l.page); pagesOf.set(tid, s); }
  const bump = (map, a, b) => { let m = map.get(a); if (!m) map.set(a, (m = new Map())); m.set(b, (m.get(b) || 0) + 1); };
  const allowed = new Map(); // עמוד → Map(טקסט → מספר זוגות פסקה×הערה שיש לפסקה שורות בעמוד)
  const srcCount = new Map(); // טקסט → מספר מופעים במקור
  const ownerPages = new Map(); // טקסט → Set(עמודי הפסקאות הנושאות)
  const srcSeq = [];
  for (const [tid, notes] of owners) {
    const pgs = pagesOf.get(tid) || new Set();
    for (const t of notes) {
      srcSeq.push(t);
      srcCount.set(t, (srcCount.get(t) || 0) + 1);
      if (!ownerPages.has(t)) ownerPages.set(t, new Set());
      for (const p of pgs) { bump(allowed, p, t); ownerPages.get(t).add(p); }
    }
  }
  const emitted = new Map(); // עמוד → Map(טקסט → פליטות); יחידה נספרת בעמוד שבו היא נפתחה (המשכי '(המשך)' מאוחדים)
  const seq = [];
  for (const u of census.units) { const t = u.words.join(' '); if (!t) continue; bump(emitted, u.page, t); seq.push({ page: u.page, text: t }); }
  const allowedAt = (page, t) => (allowed.get(page) || new Map()).get(t) || 0;
  const ghost = [], dup = [];
  let legal = 0;
  const legalByText = new Map();
  for (const [page, m] of emitted) {
    for (const [t, e] of m) {
      const a = allowedAt(page, t);
      if (a === 0) { ghost.push({ page, text: t, count: e, ownerPages: [...(ownerPages.get(t) || [])].sort((x, y) => x - y) }); continue; }
      if (e > a) dup.push({ page, text: t, count: e, allowed: a });
      const ok = Math.min(e, a);
      legal += ok;
      legalByText.set(t, (legalByText.get(t) || 0) + ok);
    }
  }
  const lost = [];
  for (const [t, c] of srcCount) { const got = legalByText.get(t) || 0; if (got < c) lost.push({ text: t, src: c, got }); }
  // סדר: הפליטה החוקית הראשונה של כל מופע-מקור, לפי סדר הפלט
  const kc = new Map(), kept = [];
  for (const e of seq) {
    if (allowedAt(e.page, e.text) === 0) continue;
    const c = kc.get(e.text) || 0;
    if (c < (srcCount.get(e.text) || 0)) { kc.set(e.text, c + 1); kept.push(e.text); }
  }
  const orderViolation = !lost.length && kept.length === srcSeq.length && kept.some((t, i) => t !== srcSeq[i]);
  return { ghost, dup, lost, orderViolation, emissions: seq.length, legal, repeats: Math.max(0, legal - srcSeq.length) };
}

const SHORT_HEADING_MAX_CHARS = 20; // כותרת ארוכה יכולה להיפלט בכמה שורות

/**
 * משווה פלט למקור. מחזיר רשימת הפרות {code, detail}; רשימה ריקה = תקין.
 * @param {Array} items תוצאת parseSource
 * @param {object} result תוצאת legacyTypeset
 */
function compareToSource(items, result) {
  const v = [];
  const add = (code, detail) => v.push({ code, detail });
  const out = censusOutput(result);
  const toks = result.tokens;
  if (toks.length !== items.length) add(V.TOKEN_COUNT, `tokens=${toks.length} ≠ פריטי מקור=${items.length}`);
  const n = Math.min(toks.length, items.length);
  for (let i = 0; i < n; i++) {
    const s = items[i], t = toks[i];
    if (s.kind === 'h') {
      if (t.type !== 'h' + s.level) add(V.TOKEN_TYPE, `פריט ${i}: כותרת ${s.level} ↔ טוקן ${t.type}`);
      continue;
    }
    if (t.type !== 'p') { add(V.TOKEN_TYPE, `פריט ${i}: פסקה ↔ טוקן ${t.type}`); continue; }
    const m = out.paras.get(i);
    if (!m) { if (s.words.length) add(V.PARA_LOST, `פסקה ${i} אבדה (${s.words.length} מילים)`); continue; }
    const idxs = [...m.keys()].sort((a, b) => a - b);
    if (!idxs.every((x, k) => x === k)) add(V.PARA_LINES, `פסקה ${i}: lineIdx לא רציף: ${idxs.join(',')}`);
    const got = idxs.flatMap((k) => m.get(k).words);
    if (got.length !== s.words.length || got.some((w, k) => w !== s.words[k])) {
      let k = 0;
      while (k < got.length && k < s.words.length && got[k] === s.words[k]) k++;
      add(V.PARA_WORDS, `פסקה ${i}: מקור ${s.words.length} מילים, פלט ${got.length}; סטייה ראשונה במילה ${k}: "${s.words[k]}" ↔ "${got[k]}"`);
    }
    const pfOut = idxs.flatMap((k) => m.get(k).parens);
    const pfSrc = s.pflags !== undefined ? s.pflags : parenScope(s.words);
    if (pfSrc && pfOut.length === pfSrc.length && got.length === s.words.length) {
      const bad = pfSrc.findIndex((f, k) => pfOut[k] !== null && pfOut[k] !== f);
      if (bad >= 0) add(V.PAREN_SCOPE, `פסקה ${i}: דגל סוגריים שגוי במילה ${bad} "${s.words[bad]}" (מקור=${pfSrc[bad]}, פלט=${pfOut[bad]})`);
    }
    const mc = idxs.reduce((a, k) => a + m.get(k).markers, 0);
    if (mc !== s.notes.length) add(V.MARKER_COUNT, `פסקה ${i}: סמנים בפלט=${mc} ≠ הערות במקור=${s.notes.length}`);
  }
  if (out.lineDup) add(V.PARA_LINES, `שורות פסקה כפולות: ${out.lineDup}`);

  // כותרות בתוך עמודה
  toks.forEach((t, i) => {
    if (!/^h[4-7]$/.test(t.type)) return;
    const em = out.headingEmissions.get(i) || [];
    const len = String(t.text || '').replace(/\s+/g, ' ').trim().length;
    if (em.length === 0) add(V.HEADING_LOST, `כותרת ${t.type}#${i} "${t.text}" לא נפלטה`);
    else if (em.length > 1 && len <= SHORT_HEADING_MAX_CHARS) add(V.HEADING_DUP, `כותרת ${t.type}#${i} "${t.text}" נפלטה ×${em.length}`);
  });

  // הערות (S4.9 / S4.24): סיווג לפי עמודי הפסקה הבעלים — רפאים / כפילות באותו עמוד / אבודה / סדר
  const cn = classifyNotes(out, ownersFromItems(items));
  const snip = (t) => t.split(' ').slice(0, 6).join(' ');
  for (const g of cn.ghost) add(V.NOTE_GHOST, `הערה "${snip(g.text)}…" (${g.text.split(' ').length} מילים) נפלטה בעמוד ${g.page + 1}${g.count > 1 ? ` ×${g.count}` : ''} ולפסקה הנושאת אותה אין שורות בעמוד זה (עמודי הפסקה: ${g.ownerPages.map((x) => x + 1).join(',') || 'אין'})`);
  for (const d of cn.dup) add(V.NOTE_DUP, `הערה "${snip(d.text)}…" (${d.text.split(' ').length} מילים) נפלטה ×${d.count} בעמוד ${d.page + 1} (מותר ×${d.allowed})`);
  for (const l of cn.lost) add(V.NOTE_LOST, `הערה "${snip(l.text)}…" (${l.text.split(' ').length} מילים) במקור ×${l.src}, בפלט (בעמודי הפסקה) ×${l.got}`);
  if (cn.orderViolation) add(V.NOTE_ORDER, 'אותן הערות אך בסדר שונה מהמקור');

  if (result.contentPreserved !== true) add(V.CONTENT_PRESERVED, `contentPreserved=${result.contentPreserved}`);
  const loss = [...result.ledger.issues.values()].filter((x) => x.kind === 'content-loss');
  if (loss.length) add(V.LEDGER_LOSS, `ledger content-loss ×${loss.length}`);
  return v;
}

/**
 * בדיקות גיאומטריה על ההקרנה (אותה הקרנה שממנה נבנה ה-PDF).
 * @param {object} result תוצאת legacyTypeset
 * @param {object} settings ההגדרות שבהן נוצרה התוצאה
 */
function geometryViolations(result, settings) {
  const { projectLegacyDocument } = require('../../../src/engine/output/legacy-projector');
  const v = [];
  const add = (code, detail) => v.push({ code, detail });
  const proj = projectLegacyDocument(result, settings);
  proj.pages.forEach((pg, pi) => {
    const body = pg.lines.filter((l) => l.kind === 'paragraph' || l.kind === 'heading');
    const cols = new Map();
    for (const ln of body) {
      const key = Math.round(ln.x * 10) / 10;
      if (!cols.has(key)) cols.set(key, []);
      cols.get(key).push(ln);
    }
    for (const lns of cols.values()) {
      lns.sort((a, b) => a.y - b.y);
      for (let i = 1; i < lns.length; i++) {
        if (lns[i].y < lns[i - 1].y + lns[i - 1].h - 0.5) add(V.GEO_OVERLAP, `עמוד ${pi}: חפיפת שורות y=${lns[i].y.toFixed(1)} מול ${(lns[i - 1].y + lns[i - 1].h).toFixed(1)}`);
      }
    }
    for (const ln of [...pg.lines, ...(pg.spanning ? pg.spanning.lines : [])]) {
      for (const w of ln.words) {
        if (w.x < -0.5 || w.x + w.w > pg.width + 0.5) add(V.GEO_OUTSIDE, `עמוד ${pi}: מילה "${w.text}" מחוץ לעמוד (x=${w.x.toFixed(1)}, w=${w.w.toFixed(1)})`);
      }
      if (ln.y < -0.5 || ln.y + ln.h > pg.height + 0.5) add(V.GEO_OUTSIDE, `עמוד ${pi}: שורה מחוץ לעמוד (y=${ln.y.toFixed(1)})`);
    }
    if (pg.footnotes && pg.footnotes.length && body.length) {
      const fnTop = Math.min(...pg.footnotes.map((f) => f.y));
      const bodyBottom = Math.max(...body.map((l) => l.y + l.h));
      if (bodyBottom > fnTop + 0.5) add(V.GEO_BODY_FN, `עמוד ${pi}: הגוף (${bodyBottom.toFixed(1)}) חודר למרזב ההערות (${fnTop.toFixed(1)})`);
    }
  });
  return v;
}

const META = [
  'שם הספר - בדיקה',
  'נושא - נושא',
  'נושא מפורט - מפורט.',
  'שם המחבר - מחבר',
  'מקום ושנת הוצאה - ירושלים תשפ"ו',
  ''
].join('\n');

/**
 * בונה מסמכים דטרמיניסטיים עם מילים ייחודיות גלובלית (ת1, ת2, …): כל החלפה
 * של סדר או כפילות הופכת לגלויה. בנאי חדש לכל מסמך (המונה מתאפס).
 */
function docBuilder() {
  let n = 0;
  const w = (c = 1) => Array.from({ length: c }, () => 'ת' + (++n)).join(' ');
  return { w, doc: (body) => META + '\n' + body };
}

module.exports = { V, parseSource, censusOutput, compareToSource, geometryViolations, splitNotes, parenScope, paraParenFlags, ownersFromItems, ownersFromTokens, classifyNotes, docBuilder, META, SHORT_HEADING_MAX_CHARS };

// הרחבות מפקד ההערות (סוכן 4) — הצהרה נפרדת כדי שלא תתנגש בשורת הייצוא הראשית כשענפים אחרים מוסיפים אליה.
Object.assign(module.exports, { noteLinesOf, censusNotes, compareNoteLines, sourceLines, normKey });
