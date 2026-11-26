#!/usr/bin/env node
// tools/baseline/p67-classify.js — סיווג מדוד של פערי P6/P7 מול דוגמת ה-PDF ההיסטורית (סוכן 4; אבחון בלבד — D-98)
//
// מה זה: הכלי קורא את מודל הייחוס (audits/layout-reference.json) ואת מודל RED (ours-model.json שמפיק
// `node tools/layout-parity/run-ours.js`) ומחזיר **מדידות**, לא שיפוט ולא יעד:
//   1. שחזור P7/P6 (אותה לוגיקה כמו tools/layout-parity/compare.py, כולל difflib) — כדי שכל מספר פה ניתן להצלבה.
//   2. זהות תוכן: מולטיסט האסימונים בכל שורות הקריאה, ייחוס מול RED, **לפי סוג** — מילים · סימנים (אות בודדת: מספור הערות/סעיפים) ·
//      מספרי-עמוד ב-TOC. רק מספר-עמוד במקומו (סוף שורת TOC) נחשב הבדל מוסבר-מאליו; סימן שונה בגוף הטקסט מדווח בנפרד ואינו מוסתר.
//   3. פרופיל עמודים: לכל עמוד — שורות זהות / אותן מילים בשבירה שונה / רק מספרי-עמוד שונים / רק סימנים שונים / מילים שזזו בין עמודים.
//   4. טקסונומיית בלוקי P7 לפי **תנועת מילים** (יישור זרם-מילים מול זרם-מילים; סימנים ומספרי-עמוד מנורמלים ביישור): numeral
//      (מספרי עמוד ב-TOC) · title-page (עמודי שער) · rewrap (כל המילים מיושרות ונשארו באותו עמוד/טור — שבירת שורות בלבד) ·
//      spill (מיושרות אך עברו טור/עמוד — בשני צידי המעבר) · boundary (עד BOUNDARY_WORDS מילים ללא מקבילה — כשורה שחצתה גבול
//      טור/עמוד מעל טקסט אחר) · relocated (קטע גדול מכך). לכל בלוק גם markerDiff: אות סימן-הערה/סעיף שונה (מספור).
//   5. מפקד רווח-התאמה (FIT_EPS): לכל שורת גוף מוצדקת במלוא הרוחב בייחוס — כמה פיקסלים נותרו עד רוחב הטור, במדידת
//      המנוע עצמו. שורה שנכנסת ברווח [0, FIT_EPS) אינה ניתנת לייצור תחת שולי-הביטחון של D-92 (legacy-imud-flow.js).
//   6. ניסויים נגדיים בהעתק זמני של המאגר (הריפו אינו משתנה): --experiment-fit-eps (מה היה קורה לפערים אילו שולי D-92 שונים) ו-
//      --experiment-setting (אילו הגדרה אחת הייתה שונה — אימות סיבתי של הבדל מסוים, למשל fn-reset-mode=page מול ספרור ההערות).
//
// מגבלה ידועה: מספר-עמוד מזוהה לפי מקומו (אסימון אחרון בשורת TOC + אותיות-גימטריה תקינות). מילה שנראית כמספר ("לא", "על") ובמקרה
// היא האחרונה בשורת כותרת ב-TOC תסווג כמספר; אובדן מילה כזו יידווח כ-toc-numerals-only. סימן-הערה לא ניתן להבחנה ממילה בת אות אחת.
//
// מה זה לא: שער, ratchet או יעד. P6/P7 הם מרחק היסטורי מפלט של מנוע ישן (tools/layout-parity/README.md); הכלי אינו
// קובע שמשהו "באג" ואינו ממליץ לשנות את המנוע. סיווג סופי = סוכן 2 + הכרעת מנהל.
//
// שימוש (מהשורש):
//   node tools/layout-parity/run-ours.js                         # מפיק audits/layout-parity-artifacts/ours-model.json
//   node tools/baseline/p67-classify.js [--json out.json]
//   node tools/baseline/p67-classify.js --experiment-fit-eps 0,0.4   # ניסוי נגדי (כ-2 שניות לכל ערך)
//   node tools/baseline/p67-classify.js --experiment-setting "fn-reset-mode=page;fn-reset-mode=siman"   # תרחיש לכל מקטע בין ';' (k=v,k2=v2)
//   node tools/baseline/p67-classify.js --experiment-setting "imud.s-h1=50;imud.s-h1=36"               # קידומת imud. = מפתח גולמי של IMUD (settings._imudRaw)
//     הנתיב החי קורא חלק מהמפתחות רק מ-_imudRaw (readConfig: s-h1, s-sh-sub, …) וחלק מהרמה העליונה (fn-reset-mode); מפתח שנדרס במקום
//     הלא-נכון לא משנה דבר — לכן כל ריצה מסומנת "עמודים=קלט" כשטביעת העמודים שלה זהה למודל הקלט (אין השפעה: בקרה, או מפתח שלא נקרא).
//     (ה-layoutHash של המנוע אינו כולל את שורות עמודי השער, ולכן אינו קריטריון מספיק להשפעה.)
//   --ref F · --ours F · --root DIR · --eps N (ברירת מחדל: הקבוע שבקוד המנוע) · --no-measure
//   --parity-report F   אימות עקביות מול compare.py: יחס/ספירות P6/P7 חייבים להיות זהים (קוד יציאה 3 אם לא)
//   --text F            קובץ הקלט לניסוי (ברירת מחדל audits/no_long_test_text.txt)
// קוד יציאה: 0 הצלחה · 2 שגיאת קלט/שימוש · 3 אי-עקביות מול --parity-report.
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const SCHEMA = 'red-p67-classification-v1';
const PX = 0.75; // pt לפיקסל (96dpi)
const BODY_TYPES = new Set(['body', 'chapter-open']);
const BOUNDARY_WORDS = 12; // שורת גוף מחזיקה עד ~12 מילים: מעל זה זה כבר קטע שהוזז, לא גלישת-גבול של שורה

// ---------------------------------------------------------------------------------------------------------------
// נרמול — העתק של norm() מ-tools/layout-parity/compare.py (NFKC, הסרת ניקוד, פיסוק→רווח, כיווץ רווחים).
// אם compare.py משתנה, --parity-report מגלה סטייה (קוד 3).
// ---------------------------------------------------------------------------------------------------------------
function norm(s) {
  if (s === null || s === undefined) return '';
  return String(s).normalize('NFKC')
    .replace(/[֑-ׇ]/g, '')
    .replace(/["״׳'()[\].,;:!?־–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const words = (s) => (s ? s.split(' ').filter(Boolean) : []);
const bag = (s) => words(s).sort().join(' ');

// ערכי אותיות הגימטריה. צורות סופיות (ך ם ן ף ץ) אינן מופיעות במספרים — "שלום" אינו מספר.
const GEM = {
  א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9, י: 10, כ: 20, ל: 30, מ: 40, נ: 50,
  ס: 60, ע: 70, פ: 80, צ: 90, ק: 100, ר: 200, ש: 300, ת: 400
};
/**
 * אסימון שהוא מספר-אותיות תקין וקצר (1–4 אותיות): הערכים אינם עולים (קכג, לא, טו), רק ת חוזרת (תת = 800), בלי צורות סופיות.
 * שימו לב: גם מילים רגילות עומדות בכך (לא, מה, על, כי, זה) — לכן אין להסיק "מספר" מהאסימון לבדו אלא רק יחד עם מקומו (tokenKind).
 */
function isGematriaToken(tok) {
  if (!tok || tok.length > 4) return false;
  let prev = Infinity;
  for (const ch of tok) {
    const v = GEM[ch];
    if (!v || v > prev || (v === prev && v !== 400)) return false;
    prev = v;
  }
  return true;
}

const isTocType = (t) => String(t || '').startsWith('toc-');
/**
 * סוג אסימון לפי **מקומו** (לא לפי צורתו בלבד):
 *   n — מספר עמוד: האסימון האחרון בשורת קריאה של עמוד תוכן-עניינים, ואותיות-גימטריה תקינות;
 *   m — סימן: אות-גימטריה בודדת בכל מקום אחר (מספור הערות/סעיפים: "א.", "[ב]");
 *   w — מילה: כל השאר.
 * ההבחנה קובעת מה נחשב "הבדל מספרי הסבור מאליו" ומה הבדל תוכן: מילה שנשמטה בגוף הטקסט אינה מספר עמוד גם אם היא "לא" או "ב".
 */
function tokenKind(tok, lastInLine, tocPage) {
  if (tocPage && lastInLine && isGematriaToken(tok)) return 'n';
  if (tok.length === 1 && isGematriaToken(tok)) return 'm';
  return 'w';
}
/** אסימוני שורות הקריאה לפי סוג: { n: [...], m: [...], w: [...] }. types = אובייקט page.index → type של אותו צד. */
function kindedTokens(seq, types) {
  const out = { n: [], m: [], w: [] };
  for (const l of seq) {
    const toc = isTocType(types[l.page]);
    const ws = words(l.text);
    ws.forEach((t, i) => out[tokenKind(t, i === ws.length - 1, toc)].push(t));
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// difflib.SequenceMatcher(None, a, b, autojunk=False) — פורט נאמן (find_longest_match + get_matching_blocks).
// נבדק מול קובץ זהב שהופק מ-CPython (tests/fixtures/regress/p67/difflib-golden.json) — כולל שוברי שוויון.
// ---------------------------------------------------------------------------------------------------------------
function buildB2j(b) {
  const m = new Map();
  for (let j = 0; j < b.length; j++) {
    let l = m.get(b[j]);
    if (!l) m.set(b[j], (l = []));
    l.push(j);
  }
  return m;
}
function findLongestMatch(a, b, b2j, alo, ahi, blo, bhi) {
  let besti = alo, bestj = blo, bestsize = 0;
  let j2len = new Map();
  for (let i = alo; i < ahi; i++) {
    const newj2len = new Map();
    const js = b2j.get(a[i]);
    if (js) {
      for (const j of js) {
        if (j < blo) continue;
        if (j >= bhi) break;
        const k = (j2len.get(j - 1) || 0) + 1;
        newj2len.set(j, k);
        if (k > bestsize) { besti = i - k + 1; bestj = j - k + 1; bestsize = k; }
      }
    }
    j2len = newj2len;
  }
  while (besti > alo && bestj > blo && a[besti - 1] === b[bestj - 1]) { besti--; bestj--; bestsize++; }
  while (besti + bestsize < ahi && bestj + bestsize < bhi && a[besti + bestsize] === b[bestj + bestsize]) bestsize++;
  return [besti, bestj, bestsize];
}
/** כמו get_matching_blocks(): כולל הסנטינל [la, lb, 0] בסוף. */
function matchingBlocks(a, b) {
  const la = a.length, lb = b.length, b2j = buildB2j(b);
  const queue = [[0, la, 0, lb]];
  const found = [];
  while (queue.length) {
    const [alo, ahi, blo, bhi] = queue.pop();
    const [i, j, k] = findLongestMatch(a, b, b2j, alo, ahi, blo, bhi);
    if (k) {
      found.push([i, j, k]);
      if (alo < i && blo < j) queue.push([alo, i, blo, j]);
      if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi]);
    }
  }
  found.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]);
  const out = [];
  let i1 = 0, j1 = 0, k1 = 0;
  for (const [i2, j2, k2] of found) {
    if (i1 + k1 === i2 && j1 + k1 === j2) k1 += k2;
    else { if (k1) out.push([i1, j1, k1]); i1 = i2; j1 = j2; k1 = k2; }
  }
  if (k1) out.push([i1, j1, k1]);
  out.push([la, lb, 0]);
  return out;
}
function opcodes(a, b) {
  const out = [];
  let i = 0, j = 0;
  for (const [ai, bj, size] of matchingBlocks(a, b)) {
    let tag = '';
    if (i < ai && j < bj) tag = 'replace';
    else if (i < ai) tag = 'delete';
    else if (j < bj) tag = 'insert';
    if (tag) out.push([tag, i, ai, j, bj]);
    i = ai + size; j = bj + size;
    if (size) out.push(['equal', ai, i, bj, j]);
  }
  return out;
}
function ratio(a, b) {
  const t = a.length + b.length;
  if (!t) return 1;
  let m = 0;
  for (const blk of matchingBlocks(a, b)) m += blk[2];
  return (2 * m) / t;
}

// ---------------------------------------------------------------------------------------------------------------
// שורות קריאה — פורט של reading_lines() מ-compare.py (אשכול y ≤ 1.5pt, איחוי שורות-חלון, שוליים נפרדים),
// עם מיקום (עמוד/טור/y) לכל שורה.
// ---------------------------------------------------------------------------------------------------------------
function isWindowRow(r, colX0, colX1) {
  if (r.window) return true;
  const sz = Number(r.size) || 0;
  if (sz > 13 && colX0 !== null && colX1 !== null) return (r.x0 || 0) > colX0 + 40 && (r.x1 || 0) >= colX1 - 3;
  return false;
}
function mergeWindowRows(rows, colX0, colX1) {
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (isWindowRow(r, colX0, colX1) && i + 1 < rows.length) {
      out.push({ ...r, text: `${r.text || ''} ${rows[i + 1].text || ''}` });
      i++;
    } else out.push(r);
  }
  return out;
}
function clusterSorted(rows) {
  const sorted = rows.slice().sort((a, b) => a.y0 - b.y0);
  const out = [];
  for (let i = 0; i < sorted.length;) {
    let j = i + 1;
    while (j < sorted.length && sorted[j].y0 - sorted[j - 1].y0 <= 1.5) j++;
    const cluster = sorted.slice(i, j).sort((a, b) => (b.x0 || 0) - (a.x0 || 0));
    if (cluster.length === 1) out.push(cluster[0]);
    else out.push({ ...cluster[0], text: cluster.map((r) => (r.text || '').trim()).filter(Boolean).join(' ') });
    i = j;
  }
  return out;
}
/** @returns {{page:number,col:string,y:number,text:string,bag:string}[]} שורות קריאה מנורמלות (בלי ריקות). */
function readingLines(model) {
  const seq = [];
  for (const p of model.pages) {
    const noneRows = [], mright = [], mleft = [];
    const byCol = { right: [], left: [], single: [] };
    for (const ln of p.lines || []) {
      if (ln.col === 'right' || ln.col === 'left' || ln.col === 'single') byCol[ln.col].push(ln);
      else if (ln.size !== undefined && ln.size !== null && ln.size < 7) ((ln.x0 || 0) > 300 ? mright : mleft).push(ln);
      else noneRows.push(ln);
    }
    const push = (col, ln) => {
      const text = norm(ln.text);
      if (text) seq.push({ page: p.index, col, y: ln.y0, text, bag: bag(text) });
    };
    for (const name of ['right', 'left', 'single']) {
      let colX0 = null, colX1 = null;
      for (const c of p.columns || []) {
        if (c.name === name && c.x0 !== undefined && c.x0 !== null) { colX0 = c.x0; colX1 = c.x1 === undefined ? null : c.x1; break; }
      }
      for (const ln of mergeWindowRows(clusterSorted(byCol[name]), colX0, colX1)) push(name, ln);
    }
    for (const ln of clusterSorted(noneRows)) push('none', ln);
    for (const ln of clusterSorted(mright)) push('mright', ln);
    for (const ln of clusterSorted(mleft)) push('mleft', ln);
  }
  return seq;
}

// ---------------------------------------------------------------------------------------------------------------
// שחזור P6 / P7 (אותה הגדרה כמו compare.py)
// ---------------------------------------------------------------------------------------------------------------
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
function reproduceP6(ref, ours) {
  const rp = ref.document.paragraphSeq, op = ours.document.paragraphSeq;
  const head3 = (p) => norm(words(norm(p.head || '')).slice(0, 3).join(' '));
  const rh = rp.map(head3), oh = op.map(head3);
  let headAligned = 0, linesMatch = 0, wordsMatch = 0;
  for (const [tag, i1, i2, j1, j2] of opcodes(rh, oh)) {
    if (tag !== 'equal') continue;
    headAligned += i2 - i1;
    for (let k = 0; k < i2 - i1; k++) {
      if (rp[i1 + k].lines === op[j1 + k].lines) linesMatch++;
      if (rp[i1 + k].words === op[j1 + k].words) wordsMatch++;
    }
    void j2;
  }
  return {
    refCount: rp.length, oursCount: op.length, headAligned, linesMatch, wordsMatch,
    refTotalLines: sum(rp, (p) => p.lines), oursTotalLines: sum(op, (p) => p.lines),
    refTotalWords: sum(rp, (p) => p.words), oursTotalWords: sum(op, (p) => p.words)
  };
}

// ---------------------------------------------------------------------------------------------------------------
// ניתוח
// ---------------------------------------------------------------------------------------------------------------
function multisetDiff(a, b) { // a − b
  const m = new Map();
  for (const w of a) m.set(w, (m.get(w) || 0) + 1);
  for (const w of b) if (m.has(w)) { const n = m.get(w) - 1; if (n) m.set(w, n); else m.delete(w); }
  return m;
}
const topEntries = (m, n = 30) => [...m.entries()].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).slice(0, n);
const sameSeq = (a, b) => a.length === b.length && a.every((w, i) => w === b[i]);
const trunc = (s, n = 90) => (s.length > n ? `${s.slice(0, n)}…` : s);

const KIND_NAMES = { w: 'words', m: 'markers', n: 'tocNumerals' };
const msTotal = (m) => [...m.values()].reduce((s, n) => s + n, 0);
const sameMs = (x, y) => multisetDiff(x, y).size === 0 && multisetDiff(y, x).size === 0;

/**
 * הבדלי אסימונים בין שתי רשימות שורות לפי סוג (tokenKind), אחרי **ביטול היפוכי-סוג**: אסימון שהוא "עודף" בצד אחד בסוג אחד ובצד השני
 * בסוג אחר (למשל מילה שנראית כמספר, שהשבירה הזיזה מסוף שורת TOC לאמצעה) אינו הבדל תוכן — סך הספירות שלו שווה.
 * @returns {{diff:{w:{onlyRef:Map,onlyOurs:Map},m:object,n:object}, ref:{n:string[],m:string[],w:string[]}, ours:object}}
 */
function kindDiff(rl, refTypes, ol, oursTypes) {
  const a = kindedTokens(rl, refTypes), b = kindedTokens(ol, oursTypes);
  const kinds = Object.keys(KIND_NAMES), diff = {};
  for (const k of kinds) diff[k] = { onlyRef: multisetDiff(a[k], b[k]), onlyOurs: multisetDiff(b[k], a[k]) };
  const tokens = new Set();
  for (const k of kinds) for (const side of ['onlyRef', 'onlyOurs']) for (const t of diff[k][side].keys()) tokens.add(t);
  const sumSide = (t, side) => kinds.reduce((sum, k) => sum + (diff[k][side].get(t) || 0), 0);
  const drop = (t, side, n) => {
    let left = n;
    for (const k of kinds) {
      const m = diff[k][side], have = m.get(t) || 0, x = Math.min(have, left);
      if (x) { if (have - x) m.set(t, have - x); else m.delete(t); left -= x; }
    }
  };
  for (const t of tokens) {
    const c = Math.min(sumSide(t, 'onlyRef'), sumSide(t, 'onlyOurs'));
    if (c) { drop(t, 'onlyRef', c); drop(t, 'onlyOurs', c); }
  }
  return { diff, ref: a, ours: b };
}
const emptyDiff = (x) => x.onlyRef.size === 0 && x.onlyOurs.size === 0;

/**
 * זהות תוכן ייחוס מול RED — הבדלי אסימונים לפי סוג: מילים / סימנים (אות בודדת: מספור הערות וסעיפים) / מספרי-עמוד ב-TOC.
 * פסק: identical · toc-numerals-only (רק מספרי עמוד שונים) · markers-differ (המילים זהות; סימני הערה/סעיף שונים) · differs (מילים שונות).
 * "מספר עמוד" נחשב מוסבר-מאליו רק במקומו (סוף שורת TOC). סימן שונה בגוף הטקסט הוא ממצא נפרד — אינו מוסתר תחת "מספרים".
 */
function contentIdentity(R, O, refTypes, oursTypes) {
  const { diff, ref: a, ours: b } = kindDiff(R, refTypes, O, oursTypes);
  const byKind = {};
  for (const k of Object.keys(KIND_NAMES)) {
    byKind[KIND_NAMES[k]] = {
      refTokens: a[k].length, oursTokens: b[k].length, onlyRefTotal: msTotal(diff[k].onlyRef), onlyOursTotal: msTotal(diff[k].onlyOurs),
      onlyRef: topEntries(diff[k].onlyRef), onlyOurs: topEntries(diff[k].onlyOurs)
    };
  }
  let verdict = 'identical';
  if (!emptyDiff(diff.w)) verdict = 'differs';
  else if (!emptyDiff(diff.m)) verdict = 'markers-differ';
  else if (!emptyDiff(diff.n)) verdict = 'toc-numerals-only';
  const markerTokens = new Set([...diff.m.onlyRef.keys(), ...diff.m.onlyOurs.keys()]);
  return {
    verdict, refTokens: a.w.length + a.m.length + a.n.length, oursTokens: b.w.length + b.m.length + b.n.length, byKind,
    markerPages: markerPageDiffs(R, O, refTypes, oursTypes, markerTokens)
  };
}
/** עמודים (ייחוס עמוד k מול RED עמוד k) שבהם ספירת סימן מהקבוצה השונה-גלובלית אינה שווה: [{page, ref:{א:2}, ours:{ב:2}}]. */
function markerPageDiffs(R, O, refTypes, oursTypes, only) {
  if (!only.size) return [];
  const per = (seq, types) => {
    const m = new Map();
    for (const l of seq) {
      const toc = isTocType(types[l.page]);
      const ws = words(l.text);
      ws.forEach((t, i) => {
        if (!only.has(t) || tokenKind(t, i === ws.length - 1, toc) !== 'm') return;
        const d = m.get(l.page) || {};
        d[t] = (d[t] || 0) + 1;
        m.set(l.page, d);
      });
    }
    return m;
  };
  const a = per(R, refTypes), b = per(O, oursTypes);
  const out = [];
  for (const page of [...new Set([...a.keys(), ...b.keys()])].sort((x, y) => x - y)) {
    const ra = a.get(page) || {}, ob = b.get(page) || {};
    if (JSON.stringify(Object.entries(ra).sort()) !== JSON.stringify(Object.entries(ob).sort())) out.push({ page, ref: ra, ours: ob });
  }
  return out;
}

/** mv = {unmatched, moved} — תנועת מילים של הבלוק לפי יישור הזרמים (ראו blockTaxonomy). refTypes/oursTypes: page.index → type, לכל צד. */
function classifyBlock(rl, ol, refTypes, oursTypes, mv) {
  const kinds = new Set([...rl.map((l) => refTypes[l.page]), ...ol.map((l) => oursTypes[l.page])].map((k) => k || ''));
  const allKind = (prefix) => kinds.size > 0 && [...kinds].every((k) => k.startsWith(prefix));
  if (allKind('toc-')) {
    // numeral: רק מספרי-עמוד (אסימון אחרון בשורת TOC) שונים — כל המילים והסימנים בבלוק זהים בין הצדדים
    const d = kindDiff(rl, refTypes, ol, oursTypes).diff;
    if (emptyDiff(d.w) && emptyDiff(d.m) && !emptyDiff(d.n)) return 'numeral';
  }
  if (allKind('shaar')) return 'title-page';
  if (mv.unmatched > BOUNDARY_WORDS) return 'relocated';
  if (mv.unmatched) return 'boundary';
  if (mv.moved) return 'spill';
  return 'rewrap';
}

const describeLine = (l) => ({ page: l.page, col: l.col, y: Math.round(l.y * 10) / 10, text: trunc(l.text) });

/** מיפוי page.index → type (לכל צד בנפרד: מספר העמודים/הסדר עשוי להיות שונה). */
const typesOf = (pages) => { const t = {}; for (const p of pages) t[p.index] = p.type; return t; };

/**
 * סטטוס עמוד (ייחוס עמוד k מול RED עמוד k): identical (כל השורות זהות) · rewrap (אותן מילים, שבירה אחרת) · numerals (TOC: רק מספרי עמוד
 * שונים) · markers (המילים זהות, סימני הערה/סעיף שונים) · words-moved (מילים עברו בין עמודים).
 */
function pageProfile(R, O, refPages, oursPages, refTypes, oursTypes) {
  const by = (seq) => { const d = new Map(); for (const l of seq) { if (!d.has(l.page)) d.set(l.page, []); d.get(l.page).push(l); } return d; };
  const rb = by(R), ob = by(O);
  const typeSeqEqual = refPages.length === oursPages.length && refPages.every((p, i) => p.type === oursPages[i].type);
  let cum = 0;
  const pages = refPages.map((p, idx) => {
    const r = rb.get(p.index) || [], o = ob.get(oursPages[idx] ? oursPages[idx].index : p.index) || [];
    const rw = r.flatMap((l) => words(l.text)), ow = o.flatMap((l) => words(l.text));
    const identicalLines = r.length === o.length && r.every((l, i) => l.bag === o[i].bag);
    const d = kindDiff(r, refTypes, o, oursTypes).diff;
    let status = 'words-moved';
    if (identicalLines) status = 'identical';
    else if (sameMs(rw, ow)) status = 'rewrap';
    else if (emptyDiff(d.w) && emptyDiff(d.m)) status = 'numerals';
    else if (emptyDiff(d.w)) status = 'markers';
    const delta = ow.length - rw.length;
    cum += delta;
    return {
      index: p.index, type: p.type, refLines: r.length, oursLines: o.length, refWords: rw.length, oursWords: ow.length,
      status, deltaWords: delta, cumDeltaWords: cum
    };
  });
  const firstBody = (pred) => { const p = pages.find((x) => BODY_TYPES.has(x.type) && pred(x)); return p ? p.index : null; };
  // נקודות סנכרון: עמוד גוף שהסטייה המצטברת בו חוזרת ל-0 אחרי שהייתה שונה מ-0 (קצה מקטע שבו הטקסט נקלט מחדש)
  const resync = [];
  let was = false;
  for (const p of pages) {
    if (!BODY_TYPES.has(p.type)) continue;
    if (p.cumDeltaWords !== 0) was = true;
    else if (was) { resync.push(p.index); was = false; }
  }
  return {
    typeSeqEqual, pages,
    summary: {
      firstBreakDiffBodyPage: firstBody((p) => p.status !== 'identical'),
      firstWordsMovedBodyPage: firstBody((p) => p.status === 'words-moved'),
      resyncPages: resync,
      maxAbsCumDeltaWords: pages.reduce((m, p) => Math.max(m, Math.abs(p.cumDeltaWords)), 0),
      statusCounts: pages.reduce((c, p) => { c[p.status] = (c[p.status] || 0) + 1; return c; }, {})
    }
  };
}

// בזרם היישור מספרי-עמוד וסימנים מוחלפים בממלא-מקום — הטקסונומיה מודדת **לאן הטקסט זז**, לא איזו אות מוצגת בסימן/במספר (הבדלים כאלה
// מדווחים בנפרד ב-contentIdentity). בלי זה סימן-הערה שונה ("א" מול "ב") היה נספר כמילה ללא-מקבילה ומנפח את סוג boundary.
const NORM_N = '\u0000n', NORM_M = '\u0000m';
/** זרם מילים שטוח (עם ממלאי-מקום לסימנים/מספרים) + אינדקס שורה לכל מילה + היסט תחילת-שורה. */
function wordIndex(seq, types) {
  const toks = [], line = [], start = [];
  seq.forEach((l, li) => {
    start.push(toks.length);
    const toc = isTocType(types[l.page]);
    const ws = words(l.text);
    ws.forEach((w, i) => {
      const k = tokenKind(w, i === ws.length - 1, toc);
      toks.push(k === 'n' ? NORM_N : k === 'm' ? NORM_M : w);
      line.push(li);
    });
  });
  start.push(toks.length);
  return { toks, line, start };
}
/** יישור זרם-מילים ייחוס מול RED (difflib) — מילה מיושרת = זוג (i,j) בבלוק "שווה". */
function alignStreams(R, O, refTypes, oursTypes) {
  const a = wordIndex(R, refTypes), b = wordIndex(O, oursTypes);
  const refToOurs = new Int32Array(a.toks.length).fill(-1), oursToRef = new Int32Array(b.toks.length).fill(-1);
  const blocks = matchingBlocks(a.toks, b.toks);
  let matched = 0;
  for (const [i, j, k] of blocks) { matched += k; for (let t = 0; t < k; t++) { refToOurs[i + t] = j + t; oursToRef[j + t] = i + t; } }
  return { a, b, refToOurs, oursToRef, matched, blocks };
}
// אזור = עמוד + קבוצת-טור (ימין/שמאל/שוליים/אחר). 'single' בייחוס ו-'none' אצלנו (TOC, שערים, הערות-תחתית) = אותו אזור.
const regionOf = (l) => `${l.page}/${l.col === 'right' || l.col === 'left' ? l.col : (l.col === 'mright' || l.col === 'mleft' ? 'm' : 'x')}`;

function blockTaxonomy(R, O, refTypes, oursTypes, align) {
  const ops = opcodes(R.map((l) => l.bag), O.map((l) => l.bag));
  const byClass = {};
  const examples = {};
  const blocks = [];
  let markerDiffBlocks = 0;
  const { a, b, refToOurs, oursToRef } = align;
  for (const [tag, i1, i2, j1, j2] of ops) {
    if (tag === 'equal') continue;
    const rl = R.slice(i1, i2), ol = O.slice(j1, j2);
    // unmatched = מילים ללא מקבילה בזרם · moved = מילים מיושרות שמקבילתן באזור אחר (עמוד/טור). הספירה סימטרית: גם הבלוק שאליו
    // הטקסט הגיע נחשב "spill" ולא "rewrap".
    let unmatched = 0, moved = 0;
    for (let w = a.start[i1]; w < a.start[i2]; w++) {
      const j = refToOurs[w];
      if (j < 0) unmatched++; else if (regionOf(R[a.line[w]]) !== regionOf(O[b.line[j]])) moved++;
    }
    for (let w = b.start[j1]; w < b.start[j2]; w++) {
      const i = oursToRef[w];
      if (i < 0) unmatched++; else if (regionOf(O[b.line[w]]) !== regionOf(R[a.line[i]])) moved++;
    }
    const cls = classifyBlock(rl, ol, refTypes, oursTypes, { unmatched, moved });
    const c = (byClass[cls] = byClass[cls] || { blocks: 0, refLines: 0, oursLines: 0 });
    c.blocks++; c.refLines += rl.length; c.oursLines += ol.length;
    // markerDiff: בבלוק יש סימן הערה/סעיף שאות שונה בין הצדדים (מספור) — תכונה בנוסף לסוג התנועה, לא במקומו
    const markerDiff = !emptyDiff(kindDiff(rl, refTypes, ol, oursTypes).diff.m);
    if (markerDiff) markerDiffBlocks++;
    const blk = { tag, cls, markerDiff, unmatchedWords: unmatched, movedWords: moved, refRange: [i1, i2], oursRange: [j1, j2], ref: rl.slice(0, 3).map(describeLine), ours: ol.slice(0, 3).map(describeLine) };
    blocks.push(blk);
    (examples[cls] = examples[cls] || []);
    if (examples[cls].length < 3) examples[cls].push(blk);
  }
  const firstBody = blocks.find((blk) => blk.ref.some((l) => BODY_TYPES.has(refTypes[l.page])) || blk.ours.some((l) => BODY_TYPES.has(oursTypes[l.page])));
  return { total: blocks.length, markerDiffBlocks, byClass, examples, firstBody: firstBody || null, ratio: ratio(R.map((l) => l.bag), O.map((l) => l.bag)), blocks };
}

function streamAlignment(align) {
  const { a, b } = align;
  const ops = opcodes(a.toks, b.toks).filter((o) => o[0] !== 'equal');
  const byTag = {};
  for (const o of ops) byTag[o[0]] = (byTag[o[0]] || 0) + 1;
  const t = a.toks.length + b.toks.length;
  return { ratio: t ? (2 * align.matched) / t : 1, refWords: a.toks.length, oursWords: b.toks.length, nonEqualOpcodes: ops.length, byTag };
}

/** רוחב טור הגוף בפיקסלים — מהגיאומטריה של הייחוס (x1−x0 של עמודי גוף), חציון. */
function bodyColumnPx(ref) {
  const ws = [];
  for (const p of ref.pages) if (p.type === 'body') for (const c of p.columns || []) ws.push(Math.round(((c.x1 - c.x0) / PX) * 100) / 100);
  ws.sort((a, b) => a - b);
  return ws.length ? ws[Math.floor(ws.length / 2)] : null;
}

/**
 * מפקד רווח-התאמה: שורות גוף מוצדקות במלוא הרוחב (12pt, טור ימין/שמאל) בייחוס. slack = רוחב הטור − הרוחב הטבעי של
 * הטקסט במדידת המנוע. עיקרון: שורה מוצדקת היא תמיד ≤ רוחב הטור (הצדקה רק מרחיבה רווחים) ⇒ slack ≥ 0; שורה ב-[0, eps)
 * נכנסה בייחוס אך תידחה אצלנו (FIT_EPS = D-92). slack < −artifactPx = ארטיפקט חילוץ (רווחים סביב סוגריים/פסיקים) — מוחרג.
 */
function fitCensus(ref, measure, opts = {}) {
  const eps = opts.eps, artifactPx = opts.artifactPx === undefined ? 1 : opts.artifactPx;
  const W = opts.width || bodyColumnPx(ref);
  const colOrder = { right: 0, left: 1 };
  const cands = [];
  for (const p of ref.pages) {
    if (!BODY_TYPES.has(p.type)) continue;
    for (const l of p.lines || []) {
      if (l.col !== 'right' && l.col !== 'left') continue;
      if (l.font !== 'GuttmanRashiNormal' || Math.abs((l.size || 0) - 12) > 0.05) continue;
      if (!l.justified || l.x1 - l.x0 < 195) continue;
      const w = measure(l.text);
      cands.push({ page: p.index, col: l.col, y: l.y0, text: l.text, widthPx: w, slack: W - w });
    }
  }
  cands.sort((a, b) => a.page - b.page || colOrder[a.col] - colOrder[b.col] || a.y - b.y);
  const unreliable = cands.filter((c) => c.slack < -artifactPx);
  const reliable = cands.filter((c) => c.slack >= -artifactPx);
  const inBand = reliable.filter((c) => c.slack >= 0 && c.slack < eps);
  const edges = [-Infinity, -artifactPx, 0, eps / 2, eps, 1.5, 3, 6, 12, Infinity];
  const histogram = [];
  for (let i = 0; i + 1 < edges.length; i++) {
    histogram.push({ from: edges[i], to: edges[i + 1], lines: cands.filter((c) => c.slack >= edges[i] && c.slack < edges[i + 1]).length });
  }
  const show = (c) => ({ page: c.page, col: c.col, y: Math.round(c.y * 10) / 10, widthPx: Math.round(c.widthPx * 1000) / 1000, slackPx: Math.round(c.slack * 1000) / 1000, text: trunc(c.text) });
  return {
    available: true, eps, artifactPx, columnWidthPx: W, candidates: cands.length, unreliable: unreliable.length,
    reliable: reliable.length, inBand: inBand.length,
    inBandShare: reliable.length ? Math.round((inBand.length / reliable.length) * 10000) / 10000 : 0,
    histogram, firstInBand: inBand.length ? show(inBand[0]) : null, inBandLines: inBand.map(show)
  };
}

/** כמה בלוקי P7 מכילים לפחות שורת-ייחוס אחת בתחום ה-eps (חסם תחתון להשפעה ישירה). */
function blocksTouchedByBand(R, tax, census) {
  if (!census || !census.available) return null;
  const touched = new Set();
  const inBlock = (idx) => tax.blocks.findIndex((b) => idx >= b.refRange[0] && idx < b.refRange[1]);
  // התאמה לפי (עמוד, טור, y±1.5) — שורות הקריאה שומרות את y0 של השורה הימנית ביותר באשכול
  for (const c of census.inBandLines) {
    const idx = R.findIndex((l) => l.page === c.page && l.col === c.col && Math.abs(l.y - c.y) <= 1.5);
    if (idx >= 0) { const b = inBlock(idx); if (b >= 0) touched.add(b); }
  }
  return touched.size;
}

function analyze(ref, ours, opts = {}) {
  const R = readingLines(ref), O = readingLines(ours);
  const refPages = ref.pages, oursPages = ours.pages;
  const refTypes = typesOf(refPages), oursTypes = typesOf(oursPages);
  const profile = pageProfile(R, O, refPages, oursPages, refTypes, oursTypes);
  const align = alignStreams(R, O, refTypes, oursTypes);
  const tax = blockTaxonomy(R, O, refTypes, oursTypes, align);
  const out = {
    schema: SCHEMA,
    reproduction: {
      p7: { ratio: Math.round(tax.ratio * 10000) / 10000, refLines: R.length, oursLines: O.length, nonEqualBlocks: tax.total },
      p6: reproduceP6(ref, ours),
      typeSeqEqual: profile.typeSeqEqual
    },
    content: contentIdentity(R, O, refTypes, oursTypes),
    pages: profile.pages,
    pageSummary: profile.summary,
    blocks: { total: tax.total, markerDiffBlocks: tax.markerDiffBlocks, byClass: tax.byClass, examples: tax.examples, firstBody: tax.firstBody },
    streams: streamAlignment(align)
  };
  if (opts.measure) {
    out.fit = fitCensus(ref, opts.measure, { eps: opts.eps, artifactPx: opts.artifactPx });
    out.fit.blocksTouched = blocksTouchedByBand(R, tax, out.fit);
    const fb = tax.firstBody;
    if (fb && out.fit.firstInBand) {
      const f = out.fit.firstInBand;
      out.fit.firstBodyBlockContainsFirstInBand = fb.ref.some((l) => l.page === f.page && l.col === f.col && Math.abs(l.y - f.y) <= 1.5);
    }
  } else out.fit = { available: false };
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// מדידת המנוע (אותו מנגנון כמו run-ours.js: גופן Guttman Rashi 12pt, מדידת font-metrics, בלי מרווח אותיות)
// ---------------------------------------------------------------------------------------------------------------
function engineMeasure(root) {
  const rb = path.join(root, 'red-build');
  const api = path.join(rb, 'src/engine/typography/measure-api.js');
  const font = path.join(rb, 'ui/assets/imud/fonts/Guttman-Rashi-Normal.ttf');
  if (!fs.existsSync(api) || !fs.existsSync(font)) return null;
  const { MeasureAPI, registerFont } = require(api);
  const { getDefaultSettings } = require(path.join(rb, 'src/engine/core/settings-registry'));
  const reg = registerFont('Guttman Rashi', fs.readFileSync(font));
  if (!reg.ok) return null;
  const m = new MeasureAPI({ ...getDefaultSettings(), 'body-font': 'Guttman Rashi', 'measure-impl': 'font-metrics' }, 'font-metrics');
  return (text) => m.measureTextWidth(text, 12, 0);
}
const FIT_EPS_RE = /^const FIT_EPS = ([0-9.]+);/m;
function engineFitEps(root) {
  const f = path.join(root, 'red-build/src/engine/layout/legacy-imud-flow.js');
  if (!fs.existsSync(f)) return null;
  const m = FIT_EPS_RE.exec(fs.readFileSync(f, 'utf8'));
  return m ? parseFloat(m[1]) : null;
}

// ---------------------------------------------------------------------------------------------------------------
// ניסוי נגדי: העתק זמני של המאגר עם knob אחד שונה (FIT_EPS במנוע, או דריסת הגדרה ב-harness) → run-ours.js → ניתוח. הריפו אינו נכתב.
// ---------------------------------------------------------------------------------------------------------------
function rewriteFitEps(source, eps) {
  if (!FIT_EPS_RE.test(source)) throw new Error('FIT_EPS לא נמצא ב-legacy-imud-flow.js (התבנית השתנתה — לעדכן את הכלי)');
  return source.replace(FIT_EPS_RE, `const FIT_EPS = ${eps};`);
}
// העוגן ב-run-ours.js שאחריו מוזרקות הדריסות (בסוף אובייקט ההגדרות, כדי שינצחו)
const SETTINGS_ANCHOR = "'measure-impl': 'font-metrics'\n  };";
// קידומת למפתח גולמי של IMUD: הנתיב החי (readConfig ב-legacy-imud-flow.js) קורא חלק מהמפתחות (s-h1, …) רק מ-settings._imudRaw.
const IMUD_PREFIX = 'imud.';
function injectSettings(harnessSource, overrides) {
  if (harnessSource.split(SETTINGS_ANCHOR).length !== 2) throw new Error('עוגן ההגדרות לא נמצא (פעם אחת) ב-run-ours.js — לעדכן את injectSettings');
  const top = {}, raw = {};
  for (const [k, v] of Object.entries(overrides)) {
    if (k.startsWith(IMUD_PREFIX)) raw[k.slice(IMUD_PREFIX.length)] = v; else top[k] = v;
  }
  const rawStmt = Object.keys(raw).length ? `\n  settings._imudRaw = { ...(settings._imudRaw || {}), ...${JSON.stringify(raw)} };` : '';
  return harnessSource.replace(SETTINGS_ANCHOR, () => `'measure-impl': 'font-metrics',\n    ...${JSON.stringify(top)}\n  };${rawStmt}`);
}
/** "k=v,k2=v2;k=v3" → [{k:v,k2:v2},{k:v3}] — תרחיש לכל מקטע בין ';'. ערכים: מספר / true / false / מחרוזת. */
function parseSettingScenarios(spec) {
  const val = (x) => (x === 'true' ? true : x === 'false' ? false : x !== '' && Number.isFinite(Number(x)) ? Number(x) : x);
  return String(spec).split(';').map((sc) => sc.trim()).filter(Boolean).map((sc) => {
    const o = {};
    for (const pair of sc.split(',')) {
      const i = pair.indexOf('=');
      if (i <= 0) throw new Error(`זוג לא תקין "${pair}" — הפורמט: key=value`);
      o[pair.slice(0, i).trim()] = val(pair.slice(i + 1).trim());
    }
    return o;
  });
}
/**
 * מזהי ההגדרות המוכרים (למניעת ניסוי "שקט" עם שם שגוי): מזהי הרישום + מפתחות ההגדרות ההיסטוריות של IMUD (default_settings.json) —
 * הנתיב החי (legacy-imud-flow) קורא חלק מהן ישירות (למשל fn-reset-mode). null אם אין רישום בשורש.
 */
function knownSettingIds(root) {
  try {
    const ids = new Set(require(path.join(root, 'red-build/src/engine/core/settings-registry')).getSettingDefs().map((d) => d.id));
    const legacy = path.join(root, 'red-build/ui/assets/imud/default_settings.json');
    if (fs.existsSync(legacy)) for (const k of Object.keys(JSON.parse(fs.readFileSync(legacy, 'utf8')))) ids.add(k);
    return ids;
  } catch (e) { return null; }
}
/** מפתחות ה-IMUD הגולמיים (default_settings.json) — היעד התקף לקידומת imud.; null אם הקובץ לא קיים בשורש. */
function knownImudKeys(root) {
  try {
    const legacy = path.join(root, 'red-build/ui/assets/imud/default_settings.json');
    return fs.existsSync(legacy) ? new Set(Object.keys(JSON.parse(fs.readFileSync(legacy, 'utf8')))) : null;
  } catch (e) { return null; }
}
/** שמות הדריסות שאינם מוכרים (רשימה ריקה = הכול מוכר או שאין רישום לבדוק מולו). קידומת imud. נבדקת מול מפתחות ה-IMUD הגולמיים בלבד. */
function unknownSettingKeys(root, scenarios) {
  const known = knownSettingIds(root), imud = knownImudKeys(root);
  const bad = [];
  for (const k of scenarios.flatMap((sc) => Object.keys(sc))) {
    if (k.startsWith(IMUD_PREFIX)) { if (imud && !imud.has(k.slice(IMUD_PREFIX.length))) bad.push(k); } else if (known && !known.has(k)) bad.push(k);
  }
  return [...new Set(bad)];
}
/** טביעת אצבע של תוכן העמודים במודל (שורות+קואורדינטות, כולל עמודי שער) — לזיהוי ריצה ניסויית שלא שינתה דבר. */
const pagesSha256 = (model) => crypto.createHash('sha256').update(JSON.stringify(model.pages)).digest('hex');
/** תרחיש בודד: scenario = { fitEps?: number, settings?: object }. */
function runScenario(root, scenario, textPath, refModel) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p67-exp-'));
  try {
    fs.mkdirSync(path.join(tmp, 'red-build'), { recursive: true });
    for (const e of fs.readdirSync(path.join(root, 'red-build'))) {
      if (e === 'src') continue;
      fs.symlinkSync(path.join(root, 'red-build', e), path.join(tmp, 'red-build', e));
    }
    fs.cpSync(path.join(root, 'red-build/src'), path.join(tmp, 'red-build/src'), { recursive: true });
    if (scenario.fitEps !== undefined) {
      const flow = path.join(tmp, 'red-build/src/engine/layout/legacy-imud-flow.js');
      fs.writeFileSync(flow, rewriteFitEps(fs.readFileSync(flow, 'utf8'), scenario.fitEps));
    }
    fs.mkdirSync(path.join(tmp, 'tools/layout-parity'), { recursive: true });
    let harness = fs.readFileSync(path.join(root, 'tools/layout-parity/run-ours.js'), 'utf8');
    if (scenario.settings) harness = injectSettings(harness, scenario.settings);
    fs.writeFileSync(path.join(tmp, 'tools/layout-parity/run-ours.js'), harness);
    fs.symlinkSync(path.join(root, 'audits'), path.join(tmp, 'audits'));
    const outDir = path.join(tmp, 'out');
    const r = spawnSync(process.execPath, [path.join(tmp, 'tools/layout-parity/run-ours.js'), textPath, outDir], { cwd: tmp, encoding: 'utf8', maxBuffer: 1 << 26 });
    if (r.status !== 0) throw new Error(`run-ours נכשל (${JSON.stringify(scenario)}): ${(r.stderr || '').slice(-400)}`);
    const model = JSON.parse(fs.readFileSync(path.join(outDir, 'ours-model.json'), 'utf8'));
    const a = analyze(refModel, model, {});
    return {
      layoutHash: model.meta.layoutHash, pagesSha256: pagesSha256(model), p7: a.reproduction.p7, p6: a.reproduction.p6, blocksByClass: a.blocks.byClass,
      firstBreakDiffBodyPage: a.pageSummary.firstBreakDiffBodyPage, firstWordsMovedBodyPage: a.pageSummary.firstWordsMovedBodyPage,
      pageStatusCounts: a.pageSummary.statusCounts, contentVerdict: a.content.verdict,
      wordsDiff: a.content.byKind.words.onlyRefTotal + a.content.byKind.words.onlyOursTotal,
      markersDiff: a.content.byKind.markers.onlyRefTotal + a.content.byKind.markers.onlyOursTotal,
      tocNumeralsDiff: a.content.byKind.tocNumerals.onlyRefTotal + a.content.byKind.tocNumerals.onlyOursTotal,
      markerPages: a.content.markerPages.map((m) => m.page)
    };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
function runFitEpsExperiment(root, epsList, textPath, refModel) {
  return epsList.map((eps) => ({ eps, ...runScenario(root, { fitEps: eps }, textPath, refModel) }));
}
function runSettingExperiment(root, scenarios, textPath, refModel) {
  return scenarios.map((settings) => ({ settings, ...runScenario(root, { settings }, textPath, refModel) }));
}

// ---------------------------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------------------------
function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-measure') o.noMeasure = true;
    else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else o._.push(a);
  }
  return o;
}
const sha256 = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const pct = (x) => `${(x * 100).toFixed(1)}%`;

function summaryText(res, extra) {
  const p7 = res.reproduction.p7, p6 = res.reproduction.p6, c = res.content, ps = res.pageSummary;
  const L = [];
  L.push(`P67-CLASSIFY (${SCHEMA}) — אבחון בלבד, לא שער ולא יעד`);
  L.push(`P7 (שבירת שורות): יחס ${p7.ratio} · ${p7.refLines} שורות בייחוס מול ${p7.oursLines} · ${p7.nonEqualBlocks} בלוקים שונים`);
  L.push(`P6 (פסקאות): ${p6.refCount} מול ${p6.oursCount} · ראשים מיושרים ${p6.headAligned} · שורות תואמות ${p6.linesMatch} · מילים תואמות ${p6.wordsMatch} · מילים סה"כ ${p6.refTotalWords} מול ${p6.oursTotalWords}`);
  const kd = (k) => `${c.byKind[k].onlyRefTotal}/${c.byKind[k].onlyOursTotal}`;
  L.push(`תוכן: ${c.verdict} — אסימונים ${c.refTokens} בייחוס, ${c.oursTokens} אצלנו · הבדלים (רק-ייחוס/רק-RED): מילים ${kd('words')} · סימני הערה/סעיף ${kd('markers')} · מספרי עמוד ב-TOC ${kd('tocNumerals')}`);
  if (c.markerPages.length) L.push(`  סימנים שונים בעמודים: ${c.markerPages.map((m) => `${m.page} (ייחוס ${Object.entries(m.ref).map(([k, v]) => `${k}×${v}`).join(',') || '—'} · RED ${Object.entries(m.ours).map(([k, v]) => `${k}×${v}`).join(',') || '—'})`).join(' ; ')}`);
  L.push(`זרם מילים ברצף: דמיון ${res.streams.ratio.toFixed(4)} · ${res.streams.nonEqualOpcodes} קטעים שונים`);
  L.push(`עמודי גוף: שבירות שונות מעמ' ${ps.firstBreakDiffBodyPage} · מילים שזזו בין עמודים מעמ' ${ps.firstWordsMovedBodyPage} · נקודות סנכרון: ${ps.resyncPages.join(', ') || '—'} · סטייה מצטברת מרבית ${ps.maxAbsCumDeltaWords} מילים`);
  L.push(`סטטוס עמודים: ${Object.entries(ps.statusCounts).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  L.push(`בלוקים לפי סוג: ${Object.entries(res.blocks.byClass).map(([k, v]) => `${k}=${v.blocks}`).join(' · ')} · מהם עם הבדל בסימני הערה/סעיף: ${res.blocks.markerDiffBlocks}`);
  const fb = res.blocks.firstBody;
  if (fb) L.push(`הבלוק הראשון בגוף: ${fb.cls} — ייחוס עמ' ${fb.ref[0] ? fb.ref[0].page : '—'} (${fb.ref[0] ? fb.ref[0].col : ''}, y=${fb.ref[0] ? fb.ref[0].y : ''}) · "${fb.ref[0] ? fb.ref[0].text : ''}"`);
  if (res.fit.available) {
    const f = res.fit;
    L.push(`רווח-התאמה (eps=${f.eps}px, רוחב טור ${f.columnWidthPx}px): ${f.inBand} מתוך ${f.reliable} שורות מוצדקות-מלאות מהימנות (${pct(f.inBandShare)}) ברווח [0,${f.eps}) — לא ניתנות לייצור תחת השוליים; ${f.unreliable} הוחרגו (ארטיפקט חילוץ); בלוקי P7 שנוגעים בהן ≥ ${f.blocksTouched}`);
    if (f.firstInBand) L.push(`  השורה הראשונה בתחום: עמ' ${f.firstInBand.page} ${f.firstInBand.col} y=${f.firstInBand.y} · רוחב ${f.firstInBand.widthPx}px · רווח ${f.firstInBand.slackPx}px · ${f.firstBodyBlockContainsFirstInBand ? 'נמצאת בבלוק הגוף הראשון' : 'אינה בבלוק הגוף הראשון'}`);
  } else L.push('מפקד רווח-התאמה: לא זמין (אין מנוע/גופן בשורש, או --no-measure)');
  for (const ex of extra || []) {
    L.push(`ניסוי נגדי — ${ex.knob} (העתק זמני; הריפו לא שונה):`);
    L.push('  תרחיש                          P7     שורות(ייחוס/RED)  בלוקים  שבירה-ראשונה  זרימה-ראשונה  P6(ראשים/שורות/מילים)  תוכן: פסק (מילים/סימנים/מספרי-TOC)');
    for (const e of ex.runs) {
      const label = e.settings ? JSON.stringify(e.settings) : `FIT_EPS=${e.eps}`;
      L.push(`  ${label.padEnd(30)} ${e.p7.ratio.toFixed(4)} ${e.p7.refLines}/${e.p7.oursLines}   ${String(e.p7.nonEqualBlocks).padEnd(6)}  עמ' ${e.firstBreakDiffBodyPage}          עמ' ${e.firstWordsMovedBodyPage}          ${e.p6.headAligned}/${e.p6.linesMatch}/${e.p6.wordsMatch}        ${e.contentVerdict} (${e.wordsDiff}/${e.markersDiff}/${e.tocNumeralsDiff})${e.samePagesAsInput ? '  ◄ עמודים=קלט (אין השפעה)' : ''}`);
    }
  }
  return L.join('\n');
}

function checkParityReport(res, reportFile) {
  const rep = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
  const chk = (id) => (rep.checks || []).find((c) => c.id === id);
  const p7 = chk('P7'), p6 = chk('P6');
  const problems = [];
  if (!p7 || !p6) problems.push('P6/P7 לא נמצאו בדוח');
  else {
    const eq = (name, a, b) => { if (a !== b) problems.push(`${name}: הכלי ${a} ≠ compare.py ${b}`); };
    eq('P7.ratio', res.reproduction.p7.ratio, p7.ratio);
    eq('P7.refLines', res.reproduction.p7.refLines, p7.refLines);
    eq('P7.oursLines', res.reproduction.p7.oursLines, p7.oursLines);
    for (const k of ['refCount', 'oursCount', 'headAligned', 'linesMatch', 'wordsMatch', 'refTotalLines', 'oursTotalLines', 'refTotalWords', 'oursTotalWords']) eq(`P6.${k}`, res.reproduction.p6[k], p6[k]);
  }
  return problems;
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const root = path.resolve(o.root || path.join(__dirname, '..', '..'));
  const refFile = path.resolve(root, o.ref || 'audits/layout-reference.json');
  const oursFile = path.resolve(root, o.ours || 'audits/layout-parity-artifacts/ours-model.json');
  for (const [name, f] of [['הייחוס', refFile], ['מודל RED', oursFile]]) {
    if (!fs.existsSync(f)) {
      console.error(`p67-classify: ${name} לא נמצא: ${f}${name === 'מודל RED' ? '\n  להפקה: node tools/layout-parity/run-ours.js' : ''}`);
      process.exit(2);
    }
  }
  const ref = JSON.parse(fs.readFileSync(refFile, 'utf8'));
  const ours = JSON.parse(fs.readFileSync(oursFile, 'utf8'));
  const eps = o.eps !== undefined ? parseFloat(o.eps) : engineFitEps(root);
  const measure = o.noMeasure || eps === null ? null : engineMeasure(root);
  const res = analyze(ref, ours, { measure, eps });
  res.inputs = {
    ref: path.relative(root, refFile), refSha256: sha256(refFile), ours: path.relative(root, oursFile),
    oursSha256: sha256(oursFile), oursLayoutHash: (ours.meta || {}).layoutHash || null, oursText: (ours.meta || {}).text || null,
    oursPagesSha256: pagesSha256(ours), engineFitEps: engineFitEps(root)
  };
  const text = path.resolve(root, o.text || 'audits/no_long_test_text.txt');
  const experiments = [];
  if (o['experiment-fit-eps'] !== undefined) {
    const list = String(o['experiment-fit-eps']).split(',').map((x) => parseFloat(x.trim())).filter((n) => Number.isFinite(n));
    if (!list.length) { console.error('p67-classify: --experiment-fit-eps דורש רשימת מספרים, למשל 0,0.4'); process.exit(2); }
    experiments.push({ knob: 'FIT_EPS (red-build/src/engine/layout/legacy-imud-flow.js)', note: 'מדידת הסתמכות בלבד — לא המלצה לשנות', runs: runFitEpsExperiment(root, list, text, ref) });
  }
  if (o['experiment-setting'] !== undefined) {
    let scenarios;
    try { scenarios = parseSettingScenarios(o['experiment-setting']); } catch (e) { console.error(`p67-classify: --experiment-setting: ${e.message}`); process.exit(2); }
    if (!scenarios.length) { console.error('p67-classify: --experiment-setting דורש תרחיש אחד לפחות, למשל footnote-reset-policy=page'); process.exit(2); }
    const unknown = unknownSettingKeys(root, scenarios);
    if (unknown.length) { console.error(`p67-classify: הגדרות לא מוכרות במנוע: ${unknown.join(', ')}`); process.exit(2); }
    experiments.push({ knob: 'דריסת הגדרות ב-harness (tools/layout-parity/run-ours.js)', note: 'מדידת הסתמכות בלבד — לא המלצה לשנות ברירת מחדל', runs: runSettingExperiment(root, scenarios, text, ref) });
  }
  // ריצה שטביעת העמודים שלה זהה למודל הקלט לא שינתה דבר (בקרה, או הגדרה שהנתיב החי לא קורא מהמקום שבו נדרסה) — מסומנת במפורש, לא נשארת "שקטה".
  for (const ex of experiments) for (const r of ex.runs) r.samePagesAsInput = r.pagesSha256 === res.inputs.oursPagesSha256;
  if (experiments.length) res.experiments = experiments;
  const extra = experiments;
  if (o.json) fs.writeFileSync(path.resolve(o.json), `${JSON.stringify(res, null, 2)}\n`);
  console.log(summaryText(res, extra));
  if (o['parity-report']) {
    const problems = checkParityReport(res, path.resolve(o['parity-report']));
    if (problems.length) { console.error(`p67-classify: אי-עקביות מול compare.py:\n  ${problems.join('\n  ')}`); process.exit(3); }
    console.log('עקביות מול compare.py: P6/P7 זהים ✓');
  }
}

module.exports = {
  SCHEMA, BOUNDARY_WORDS, norm, bag, isGematriaToken, tokenKind, kindedTokens, kindDiff, typesOf, matchingBlocks, opcodes, ratio, readingLines, reproduceP6,
  contentIdentity, classifyBlock, pageProfile, alignStreams, blockTaxonomy, streamAlignment, bodyColumnPx, fitCensus, analyze, engineMeasure, engineFitEps, rewriteFitEps,
  injectSettings, parseSettingScenarios, knownSettingIds, knownImudKeys, unknownSettingKeys, IMUD_PREFIX, pagesSha256, runScenario, runFitEpsExperiment, runSettingExperiment, checkParityReport
};

if (require.main === module) main();
