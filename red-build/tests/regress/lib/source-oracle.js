'use strict';
/**
 * אורקל מקור→פלט עצמאי לנתיב ה-legacy (legacyTypeset) — סוכן 4.
 *
 * למה אורקל נפרד: `contentPreserved` ו-ledger הם החשבונאות של המנוע עצמו.
 * `contentPreserved` סופר רק מילים שחסרות (מקור פחות פלט) — כפילות לעולם אינה
 * "חסר", ולכן הערה שמופיעה פעמיים או כותרת שנפלטת פעמיים עוברות בשקט
 * (R-01: כותרת אבדה והכותרת שאחריה הוכפלה; R-02: הערה הוכפלה בעמוד הבא).
 * האורקל כאן מנתח את טקסט המקור בעצמו (ללא הטוקנייזר של המנוע) ומשווה:
 *   · לכל פסקה: רצף המילים בפלט (לפי tokenId/lineIdx) = רצף המילים במקור, בלי
 *     סמני הערה; שורות רציפות וייחודיות (lineIdx 0..n-1 בלי כפילות);
 *   · לכל כותרת בתוך עמודה: נפלטת, ולא פעמיים (כותרות קצרות);
 *   · לכל הערה: בדיוק יחידה אחת בפלט (עם המשכי '(המשך)' מאוחדים), בסדר המקור;
 *   · גיאומטריה (אופציונלי): אין חפיפת שורות, אין מילה מחוץ לעמוד, הגוף לא חודר
 *     למרזב ההערות.
 *
 * מודל המקור (התנהגות המקור ש-tokenizeDoc משחזר — legacy-imud-flow.js):
 *   · שורות מטא-דאטה בראש המסמך אינן גוף;
 *   · 'כותרת N - טקסט' = כותרת. N=7 (הערת-צד), הערות-סיום, הערות מקוננות וסוגר
 *     פותח ללא סוגר — מחוץ למודל; מסמכי הבדיקה נמנעים מהם;
 *   · שורה שמתחילה ב-'[' נדבקת לפסקה הקודמת (הדבקת בלוק-טקסט של המקור), אלא
 *     אם הקודם כותרת — אז היא פסקה עצמאית;
 *   · רווח לפני '[' נבלע; הערה = [ ... ] שטוחה (הסוגר הראשון סוגר).
 *
 * הקובץ מייצא רק פונקציות טהורות; אין בו קוד ייצור ואין תלות בהגדרות המנוע
 * מלבד המקרן הגיאומטרי (legacy-projector) לבדיקת הגיאומטריה.
 */

const HEADER_RE = /^(שם הספר|נושא מפורט|נושא|שם המחבר|מקום ושנת הוצאה)\s*[-–—]/;
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
  NOTE_LOST: 'NOTE_LOST', // הערה מהמקור לא נפלטה
  NOTE_DUP: 'NOTE_DUP', // הערה נפלטה יותר פעמים מהמופעים שלה במקור
  NOTE_ORDER: 'NOTE_ORDER', // אותן הערות, סדר שונה
  CONTENT_PRESERVED: 'CONTENT_PRESERVED', // contentPreserved !== true
  LEDGER_LOSS: 'LEDGER_LOSS', // ledger מדווח content-loss
  GEO_OVERLAP: 'GEO_OVERLAP', // חפיפת שורות באותו טור
  GEO_OUTSIDE: 'GEO_OUTSIDE', // מילה/שורה מחוץ לעמוד
  GEO_BODY_FN: 'GEO_BODY_FN' // הגוף חודר למרזב ההערות
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
function parseSource(text) {
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
  const items = [];
  for (const l of lines) {
    const t = l.trim();
    if (!t) continue;
    const m = t.match(HEADING_RE);
    if (m) { items.push({ kind: 'h', level: +m[1], text: m[2].trim() }); continue; }
    const { body, notes } = splitNotes(t);
    items.push({ kind: 'p', words: words(body), notes: notes.map(words) });
  }
  return items;
}

/**
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
    for (const col of p.columns || []) {
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
    const pfSrc = parenScope(s.words);
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

  // הערות: מולטיסט לפי טקסט (אובדן/כפילות), ואם שווה — סדר
  const srcNotes = items.filter((x) => x.kind === 'p').flatMap((x) => x.notes).map((ws) => ws.join(' '));
  const outNotes = out.units.map((u) => u.words.join(' '));
  const count = (arr) => { const c = new Map(); for (const k of arr) c.set(k, (c.get(k) || 0) + 1); return c; };
  const sc = count(srcNotes), oc = count(outNotes);
  let multisetEqual = true;
  for (const [k, c] of oc) {
    const s = sc.get(k) || 0;
    if (c > s) { multisetEqual = false; add(V.NOTE_DUP, `הערה "${k.split(' ').slice(0, 6).join(' ')}…" (${k.split(' ').length} מילים) נפלטה ×${c} ומופיעה במקור ×${s}`); }
  }
  for (const [k, c] of sc) {
    const o = oc.get(k) || 0;
    if (o < c) { multisetEqual = false; add(V.NOTE_LOST, `הערה "${k.split(' ').slice(0, 6).join(' ')}…" (${k.split(' ').length} מילים) במקור ×${c}, בפלט ×${o}`); }
  }
  if (multisetEqual && srcNotes.some((k, i) => k !== outNotes[i])) add(V.NOTE_ORDER, 'אותן הערות אך בסדר שונה מהמקור');

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

module.exports = { V, parseSource, censusOutput, compareToSource, geometryViolations, splitNotes, parenScope, docBuilder, META, SHORT_HEADING_MAX_CHARS };
