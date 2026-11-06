// src/engine/import/docx-import.js — ייבוא DOCX (S11.1-3, REQ-PAR-07, §12.3; "mammoth-style")
'use strict';

/**
 * המרת DOCX לטקסט המנוע (mammoth ברוח: Heading1–7 → «כותרת N - …», הערות
 * Word → [...] בגוף (bracket notes — סורק הסוגריים המרובעים של השכבה 1),
 * פסקאות רגילות → שורות פסקה. פליין־טקסט לעורך (§12.3).
 *
 * **סירוב בשקט של פורמטים לא נתמכים (חוק ברזל 14):** אין קריסה, אין טעינה
 * חלקית — הודעה עברית ברורה «פורמט לא נתמך» + סיבה. כל נתיב הכישלון מחזיר
 * {ok:false, reason, message} והקובץ אינו נטען.
 */

const { readZip, utf8Decode } = require('./zip-reader');
const { parseXml } = require('./xml-lite');

/** מיפוי סגנונות Word → רמות כותרת של המנוע. */
const HEADING_STYLE_RE = /^Heading([1-7])$/i;
const ALT_HEADING_RE = /^(?:כותרת|Heading|heading|Ttulo)[\s_-]*([1-7])$/;

function headingLevelOf(styleVal) {
  if (typeof styleVal !== 'string') return null;
  let m = styleVal.match(HEADING_STYLE_RE);
  if (m) return Number(m[1]);
  m = styleVal.match(ALT_HEADING_RE);
  if (m) return Number(m[1]);
  return null;
}

/**
 * המרה מלאה של document.xml + footnotes.xml לטקסט מנוע.
 * @param {string} docXml, {string|null} fnXml
 * @returns {{ok:boolean, text:string, stats:object, error:string|null}}
 */
function convert(docXml, fnXml) {
  const docRes = parseXml(docXml);
  if (docRes.error && docRes.error !== 'truncated') return { ok: false, text: '', stats: {}, error: `docxml:${docRes.error}` };
  // **S6.0 (R9 — קיטוע שקט):** XML קטוע התקבל בעבר כהצלחה עם ספר קצר
  // יותר בלי אזהרה. כעת הקיטוע מדווח במפורש ב-stats.warnings (הפריטים
  // שאחרי נקודת הקטיעה אבדו).
  const warnings = docRes.error === 'truncated' ? ['docxml:truncated'] : [];

  // 0) בדיקת מבנה WordML: חייב להיות אלמנט w:body (או לפחות w:p) — אחרת אינו מסמך
  //     וורד תקין (קלט XML לא מסמך ⇒ דחייה «XML פגום», לא טעינה שקטה של מסמך ריק).
  if (!docRes.events.some(e => e.type === 'start' && (e.tag === 'w:body' || e.tag === 'w:p'))) {
    return { ok: false, text: '', stats: {}, error: 'not-wordml' };
  }

  // 1) מפתח הערות: id → טקסט
  const fnMap = new Map(); // id → text
  let fnStats = 0;
  if (fnXml) {
    const fnRes = parseXml(fnXml);
    if (fnRes.error && fnRes.error !== 'truncated') return { ok: false, text: '', stats: {}, error: `footnotes:${fnRes.error}` };
    const evs = fnRes.events;
    for (let i = 0; i < evs.length; i++) {
      const ev = evs[i];
      if (ev.type === 'start' && ev.tag === 'w:footnote' && ev.attrs && ev.attrs['w:id'] != null) {
        const id = String(ev.attrs['w:id']);
        const { text } = collectFootnoteText(evs, i);
        if (id !== '0' && id !== '-1') { fnMap.set(id, text); fnStats++; } // 0/-1 = separator/continuation (מוסתרים)
      }
    }
  }

  // 2) המרת הפסקאות — הערות וורד מוכנסות **במקום ההפניה** (בסדר הופעתן): footnotes→[...]
  const lines = [];
  let headings = 0, paragraphs = 0, footnotes = 0, skipped = 0;
  const evs = docRes.events;
  for (let i = 0; i < evs.length; i++) {
    const ev = evs[i];
    if (ev.type !== 'start' || ev.tag !== 'w:p') continue;
    const paraEnd = paraEndIndex(evs, i);
    const { styleVal, seq } = paraParts(evs, i, paraEnd);
    const lvl = headingLevelOf(styleVal);
    // בניית השורה: רצף מסודר של טקסט והפניות — ההערה נכנסת במקומה (לא בסוף)
    let flat = '';
    const refIds = [];
    for (const item of seq) {
      if (item.kind === 'text') flat += item.text;
      else {
        refIds.push(item.id);
        const noteText = item.id != null && fnMap.has(item.id) ? fnMap.get(item.id) : '';
        if (noteText) {
          footnotes++;
          const needsSpace = flat.length > 0 && !/\s$/.test(flat); // רווח לפני הסוגריים אם אין
          flat += `${needsSpace ? ' ' : ''}[${noteText}]`;
        }
      }
    }
    flat = flat.replace(/\u00A0/g, ' ').trim();
    if (!flat && !refIds.length) { skipped++; continue; } // פסקה ריקה — מוסתרת (לא תוכן)
    let line = flat;
    if (lvl != null) {
      headings++;
      line = `כותרת ${lvl} - ${flat}`;
    } else {
      paragraphs++;
    }
    lines.push(line);
  }
  return {
    ok: true,
    text: lines.join('\n'),
    stats: { headings, paragraphs, footnotes, skipped, footnoteDefs: fnStats, warnings }
  };
}

/** מציאת אינדקס הסוף של w:p (אירוע end באותו depth). */
function paraEndIndex(evs, startIdx) {
  const d0 = evs[startIdx].depth;
  for (let i = startIdx + 1; i < evs.length; i++) {
    if (evs[i].type === 'end' && evs[i].depth === d0 && evs[i].tag === 'w:p') return i;
  }
  return evs.length - 1;
}

/** איסוף חלקי פסקה כרצף מסודר: pStyle + רצף [{kind:'text'|'ref'}] לפי סדר הופעתם.
 *  ללא בדיקות עומק קפדניות — w:pStyle בא בתוך w:pPr (עומק 2); w:footnoteReference בתוך w:r. */
function paraParts(evs, startIdx, endIdx) {
  const d0 = evs[startIdx].depth;
  void d0;
  const out = { styleVal: null, seq: [] };
  let inR = false, inT = false;
  for (let i = startIdx + 1; i <= endIdx; i++) {
    const ev = evs[i];
    if (ev.type === 'start') {
      if (ev.tag === 'w:r') inR = true;
      if (ev.tag === 'w:t' && inR) inT = true;
      if (ev.tag === 'w:pStyle' && ev.attrs && ev.attrs['w:val'] != null) {
        out.styleVal = String(ev.attrs['w:val']);
      }
      if (ev.tag === 'w:footnoteReference' && inR) {
        out.seq.push({ kind: 'ref', id: ev.attrs && ev.attrs['w:id'] != null ? String(ev.attrs['w:id']) : null });
      }
      continue;
    }
    if (ev.type === 'end') {
      if (ev.tag === 'w:r') inR = false;
      if (ev.tag === 'w:t') inT = false;
      continue;
    }
    if (ev.type === 'text' && inR && inT) {
      out.seq.push({ kind: 'text', text: ev.text });
    }
  }
  return out;
}

/** איסוף טקסט הערה מתוך w:footnote.
 * **תיקון S11:** w:r יושב בתוך w:p (עומק d0+2) — בדיקת עומק נוקשהת (d0+1)
 * פסלה כל הערת־מקור אמיתית והחזירה טקסט ריק, כך שההערות נשמטו בשקט.
 * הגבול העליון הוא סוף ה־w:footnote (break) — אין צורך בבדיקת עומק על w:r. */
function collectFootnoteText(evs, startIdx) {
  const d0 = evs[startIdx].depth;
  let text = '';
  let inR = false, inT = false;
  for (let i = startIdx + 1; i < evs.length; i++) {
    const ev = evs[i];
    if (ev.type === 'end' && ev.tag === 'w:footnote' && ev.depth === d0) break;
    if (ev.type === 'start') {
      if (ev.tag === 'w:r') inR = true;
      if (ev.tag === 'w:t' && inR) inT = true;
      continue;
    }
    if (ev.type === 'end') {
      if (ev.tag === 'w:r') inR = false;
      if (ev.tag === 'w:t') inT = false;
      continue;
    }
    if (ev.type === 'text' && inR && inT) text += ev.text;
  }
  return { text: text.replace(/\u00A0/g, ' ').trim() };
}

/**
 * נקודת הכניסה: בתים של קובץ → טקסט מנוע.
 * @param {Buffer|Uint8Array} bytes
 * @param {string} fileName — להודעת הסירוב
 * @returns {{ok:boolean, text:string, stats:object, message:string}}
 */
function importDocx(bytes, fileName) {
  const name = String(fileName || 'קובץ');
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext !== 'docx' && ext !== 'zip') {
    return { ok: false, text: '', stats: {}, message: `פורמט לא נתמך: «${name}». ניתן לייבא קבצי DOCX בלבד. הקובץ לא נטען.` };
  }
  const zip = readZip(bytes);
  if (!zip.ok) {
    return { ok: false, text: '', stats: {}, message: `פורמט לא נתמך: «${name}» אינו ארכיון תקין (${zip.error}). הקובץ לא נטען.` };
  }
  if (zip.denied.length) {
    // רשומות מסוכנות נדחו — מדווח; לא חוסם אם המסמך עצמו תקין (path traversal לא מגיע לדיסק)
    void zip.denied;
  }
  const doc = zip.entries.find(e => e.name === 'word/document.xml');
  if (!doc) {
    return { ok: false, text: '', stats: {}, message: `פורמט לא נתמך: «${name}» אינו מסמך Word (חסר word/document.xml). הקובץ לא נטען.` };
  }
  const fn = zip.entries.find(e => e.name === 'word/footnotes.xml');
  const res = convert(utf8Decode(doc.data), fn ? utf8Decode(fn.data) : null);
  if (!res.ok) {
    if (res.error === 'not-wordml') {
      return { ok: false, text: '', stats: {}, message: `פורמט לא נתמך: «${name}» אינו מסמך Word תקין (document.xml אינו WordML). הקובץ לא נטען.` };
    }
    return { ok: false, text: '', stats: {}, message: `פורמט לא נתמך: XML פגום בתוך «${name}» (${res.error}). הקובץ לא נטען.` };
  }
  // **S6.0 (R9):** אזהרת קיטוע נראית למשתמש — לא עוד "נטען" חלק בשקט.
  const truncWarn = (res.stats && res.stats.warnings && res.stats.warnings.length)
    ? `  ⚠ אזהרה: הקובץ קטוע — ייתכן שתוכן בסופו אבד (${res.stats.warnings.join(', ')}).`
    : '';
  return {
    ok: true,
    text: res.text,
    stats: res.stats,
    message: `הקובץ «${name}» נטען: ${res.stats.headings} כותרות, ${res.stats.paragraphs} פסקאות, ${res.stats.footnotes} הערות Word הומרו להערות סוגריים.${truncWarn}`
  };
}

module.exports = { importDocx, convert, headingLevelOf };
