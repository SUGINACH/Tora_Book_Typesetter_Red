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
  NOTE_LOST: 'NOTE_LOST', // הערה מהמקור לא נפלטה (באף עמוד של הפסקה הנושאת אותה)
  NOTE_GHOST: 'NOTE_GHOST', // הערה נפלטה בעמוד שאין בו אף שורה של הפסקה הנושאת אותה (R-04; S4.24)
  NOTE_DUP: 'NOTE_DUP', // אותה הערה נפלטה באותו עמוד יותר פעמים ממספר הפסקאות הנושאות אותה בעמוד
  NOTE_ORDER: 'NOTE_ORDER', // אותן הערות (פליטות חוקיות), סדר שונה מהמקור
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

/**
 * כיסוי הערות לפי עמוד הפסקה (S4.9): בכל עמוד שיש בו שורות של פסקה נושאת-הערה, צריכה להופיע יחידה של כל אחת מהערותיה
 * (שלמה או חלק — המשך/קטע של הערה ארוכה). המשלים של 'רפאים' (הערה בלי פסקה) — כאן פסקה בלי הערה.
 * מדידה **אינפורמטיבית** (לא נבדקת כהפרה): במסמכים עם הערות ענקיות (מעל עמוד) או בעמוד ההערות-הסיום יש חסרים גם בבסיס
 * (very_long: 1; מסמך הבדיקה: 17 בעמוד האחרון) — לכן משווים בין עצים (tools/baseline/impact.js), לא קובעים סף מוחלט.
 * ההשוואה לפי טקסט: יחידה "מכסה" הערה אם הטקסט שלה מוכל בטקסט ההערה או להפך (שלילי-כוזב אפשרי, חיובי-כוזב לא).
 * @param census תוצאת censusOutput
 * @param owners Map<tokenId, string[]> — ownersFromItems / ownersFromTokens
 * @returns {{pairs:number, missing:Array<{tokenId:number,page:number,words:number}>}} page הוא אינדקס עמוד מבוסס-0
 */
function ownerPageCoverage(census, owners) {
  const unitsBy = new Map();
  for (const u of census.units) { const t = u.words.join(' '); if (!t) continue; if (!unitsBy.has(u.page)) unitsBy.set(u.page, []); unitsBy.get(u.page).push(t); }
  let pairs = 0;
  const missing = [];
  for (const [tid, notes] of owners) {
    const m = census.paras.get(tid);
    if (!m) continue;
    const pgs = new Set(); for (const l of m.values()) pgs.add(l.page);
    for (const p of pgs) for (const t of notes) {
      pairs++;
      const us = unitsBy.get(p) || [];
      if (!us.some((u) => t.includes(u) || u.includes(t))) missing.push({ tokenId: tid, page: p, words: t.split(' ').length });
    }
  }
  return { pairs, missing };
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

module.exports = { V, parseSource, censusOutput, compareToSource, geometryViolations, splitNotes, parenScope, paraParenFlags, ownersFromItems, ownersFromTokens, classifyNotes, ownerPageCoverage, docBuilder, META, SHORT_HEADING_MAX_CHARS };
