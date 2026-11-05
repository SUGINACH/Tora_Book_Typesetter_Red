// src/engine/output/pdf-writer.js — Pure-JS PDF 1.4 writer (S12.1-3, REQ-EXP-03)
'use strict';

/**
 * כותב PDF מהקרנת הגיאומטריה (geometry-projector — מקור יחיד) + תת־גופן
 * TrueType מוטמע (CIDFontType2 + ToUnicode — טקסט אמיתי נבחר/מופק).
 *
 * יכולות (חוזה S12.1-3):
 *  - MediaBox/TrimBox/BleedBox מרישום גדלי העמוד (מ״מ→pt) + export-bleed-mm;
 *  - סימני חיתוך (pdf-crop-marks) — קווים מחוץ לתבנית החיתוך ב־4 פינות;
 *  - עץ סימניות (Outlines) ממודל הכותרות — H1 רמה 1, H2 רמה 2 תחתיו;
 *  - יעדי קישור לחיצים משורות ה־TOC (Link/GoTo → עמוד הכותרת);
 *  - טקסט אמיתי לכל מילה (BT/Tf/Td/Tj) — RTL מוצב מפורש;
 *  - דטרמיניזם: אין תאריך/מזהים אקראיים; סדר אובייקטים קבוע; ייצוא כפול ⇒ בתים זהים.
 *
 * עצמאי לחלוטין — אפס תלות חיצונית (אותה דוקטרינה כמו zip-writer/xml-lite).
 * מוכן גם לצינור הדפסת Chromium: ה־HTML העצמאי (html-export) כולל את אותם
 * כללי @page; ה־PDF הכתוב כאן הוא המסלול המנועי המלא (סימניות+קישורים).
 */

const PX_TO_PT = 72 / 96;
const MM_TO_PT = 72 / 25.4;

/** כתיבת מסמך PDF — אוסף אובייקטים ומרכיב xref מדויק. */
class PdfBuilder {
  constructor() {
    this.objects = new Map(); // id → Buffer (האובייקט בלבד, בלי "N 0 obj")
    this.nextId = 1;
  }
  reserve() { return this.nextId++; }
  put(id, content) {
    this.objects.set(id, Buffer.isBuffer(content) ? content : Buffer.from(content, 'latin1'));
    return id;
  }
  add(content) { return this.put(this.reserve(), content); }
  build() {
    const parts = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
    let pos = parts[0].length;
    const offsets = new Map();
    const maxId = Math.max(0, ...this.objects.keys());
    for (let id = 1; id <= maxId; id++) {
      if (!this.objects.has(id)) continue;
      const head = Buffer.from(`${id} 0 obj\n`, 'latin1');
      const body = this.objects.get(id);
      const tail = Buffer.from('\nendobj\n', 'latin1');
      offsets.set(id, pos);
      pos += head.length + body.length + tail.length;
      parts.push(head, body, tail);
    }
    const xrefPos = pos;
    let xref = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
    for (let id = 1; id <= maxId; id++) {
      if (offsets.has(id)) xref += `${String(offsets.get(id)).padStart(10, '0')} 00000 n \n`;
      else xref += `0000000000 65535 f \n`;
    }
    parts.push(Buffer.from(xref, 'latin1'));
    parts.push(Buffer.from(`trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`, 'latin1'));
    return Buffer.concat(parts);
  }
}

function escapePdfText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
function round2(v) { return Math.round(v * 100) / 100; }

/** **כותרת סימנייה עברית:** מחרוזת טקסט PDF לא־לטינית ⇒ UTF-16BE עם BOM
 * כמחרוזת הקסדצימלית (חוזה PDF 1.4 §3.8.4) — קוראים מציגים עברית תקינה. */
function pdfTitleHex(s) {
  let out = 'FEFF';
  for (const ch of String(s)) {
    const cp = ch.codePointAt(0);
    if (cp > 0xFFFF) {
      const v = cp - 0x10000;
      const hi = 0xD800 + (v >> 10), lo = 0xDC00 + (v & 0x3FF);
      out += hi.toString(16).padStart(4, '0') + lo.toString(16).padStart(4, '0');
    } else {
      out += cp.toString(16).padStart(4, '0');
    }
  }
  return `<${out.toUpperCase()}>`;
}

/** **D-89 (דיווח משתמש: "כיוון הסוגריים בכל המופעים הפוך"):** חיקוי ה-bidi
 * של הדפדפן למילה עברית שמצוירת בסדר ויזואלי:
 *  - אותיות עברית/ניטרליים מהופכים (התו הלוגי הראשון בצד ימין) — כמו קודם;
 *  - ריצות ספרות/לטינית נשארות בסדר לוגי (קריאות שמאל→ימין). בלי זה מספר
 *    הטלפון 052-7666666 הוצג הפוך (6666667-250) — מדגם ה-CUTOVER, עמ' 2.
 *    פיסוק מספרי קצר (.,-+/:;%) בין שתי ריצות LTR נבלע לתוכן (1.5, 052-7666666);
 *    פיסוק עוקב/קודם (סוף משפט) נשאר בהקשר RTL — כמו UAX#9 בדפדפן.
 *  - סוגריים מכוונים בהקשר RTL משוקפים (Bidi Mirrored, UAX#9 §3.1.4):
 *    '(' לוגי מצויר כגליף ')' בקצה ימין של הרץ — "נפתח" כלפי כיוון הקריאה.
 *    סוגריים בתוך ריצת LTR (ספרות) אינם משוקפים.
 * המודול מיוצא לבדיקות (visualOrderRtl) — מקור יחיד לשני הצרכנים העתידיים. */
const LTR_RE = /[0-9A-Za-z]/;
const BRACKET_MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<' };
// פיסוק ביניים (CS/ES — נבלע במספר רק **בין** שתי ריצות LTR: 052-7666666, 1.5)
const NUM_MID_GLUE = '.,-+/:;';
// פיסוק עוקב/קודם מסוג ET (W5 — נדבק למספר גם בקצה: 1.5%, $20)
const NUM_ET_GLUE = '%$#°₪';

function visualOrderRtl(chars) {
  // חלוקה לריצות LTR/שאר
  const runs = [];
  for (const ch of chars) {
    const l = LTR_RE.test(ch);
    if (runs.length && runs[runs.length - 1].ltr === l) runs[runs.length - 1].chars.push(ch);
    else runs.push({ ltr: l, chars: [ch] });
  }
  // בליעת פיסוק בין/בקצה ריצות LTR — חלק מהמספר (052-7666666, 1.5, 1.5%).
  // פיסוק ביניים נבלע רק כשריצת LTR באה אחריו; פיסוק ET נבלע גם בקצה (W5).
  const merged = [];
  for (const r of runs) {
    const prev = merged[merged.length - 1];
    const isMid = r.chars.length <= 3 && r.chars.every(c => NUM_MID_GLUE.includes(c));
    const isEt = r.chars.length <= 3 && r.chars.every(c => NUM_ET_GLUE.includes(c));
    if (!r.ltr && prev && prev.ltr && (isMid || isEt)) {
      prev._glue = (prev._glue || []).concat(r.chars); // עדיין לא ידוע אם תבוא LTR אחרי
      continue;
    }
    if (r.ltr && prev && prev._glue) { prev.chars.push(...prev._glue, ...r.chars); prev._glue = null; continue; }
    if (prev && prev._glue) {
      // לא באה LTR אחרי הפיסוק: ET נדבק למספר שלפניו (1.5%); ביניים — הקשר RTL (סוף משפט)
      if (prev._glue.every(c => NUM_ET_GLUE.includes(c))) { prev.chars.push(...prev._glue); }
      else merged.push({ ltr: false, chars: prev._glue });
      prev._glue = null;
    }
    merged.push({ ltr: r.ltr, chars: r.chars.slice() });
  }
  const tail = merged[merged.length - 1];
  if (tail && tail._glue) {
    if (tail._glue.every(c => NUM_ET_GLUE.includes(c))) { tail.chars.push(...tail._glue); }
    else merged.push({ ltr: false, chars: tail._glue }); // פיסוק עוקב בלי LTR אחריו — הקשר RTL
    tail._glue = null;
  }
  // סדר ויזואלי: היפוך סדר הריצות; RTL — היפוך פנימי + שיקוף סוגריים; LTR — כמו שהוא
  const out = [];
  for (let i = merged.length - 1; i >= 0; i--) {
    const r = merged[i];
    if (r.ltr) { out.push(...r.chars); continue; }
    for (let j = r.chars.length - 1; j >= 0; j--) out.push(BRACKET_MIRROR[r.chars[j]] || r.chars[j]);
  }
  return out;
}

/** מחרוזת CID הקסדצימלית לטקסט (Identity-H: 2 בתים לגליף).
 * **RTL:** PDF מתקדם ימינה מ־Td ברוחבים חיוביים; לכן התווים נפלטים בסדר
 * **ויזואלי** (חילוץ לוגי אחרון ראשון = השמאלי ביותר) — דרך visualOrderRtl
 * (D-89: ריצות LTR שלמות + שיקוף סוגריים) — המילה מרונדרת נכון לקורא עברי. */
function cidHex(text, font) {
  const chars = [...String(text)].filter(ch => {
    const cp = ch.codePointAt(0);
    return cp >= 0x20 && cp !== 0x7F;
  });
  let out = '';
  for (const ch of visualOrderRtl(chars)) {
    const g = font.cidOf(ch);
    if (g === 0) continue;
    out += g.toString(16).padStart(4, '0');
  }
  return out;
}

/** ToUnicode CMap — מיפוי gid → Unicode (חילוץ טקסט אמיתי ב־pdftotext). */
function buildToUnicode(font) {
  const lines = [
    '/CIDInit /ProcSet findresource begin',
    '12 dict begin',
    'begincmap',
    '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def',
    '/CMapName /Adobe-Identity-UCS def',
    '/CMapType 2 def',
    '1 begincodespacerange',
    '<0000> <FFFF>',
    'endcodespacerange'
  ];
  const entries = [];
  for (const [ch, gid] of font.charToGidEntries()) {
    if (gid === 0) continue;
    entries.push(`<${gid.toString(16).padStart(4, '0')}> <${ch.codePointAt(0).toString(16).padStart(4, '0')}>`);
  }
  for (let i = 0; i < entries.length; i += 100) {
    const chunk = entries.slice(i, i + 100);
    lines.push(`${chunk.length} beginbfchar`, ...chunk, 'endbfchar');
  }
  lines.push('endcmap', 'CMapName currentdict /CMap defineresource pop', 'end', 'end');
  return lines.join('\n');
}

/**
 * כתיבת מסמך PDF שלם.
 * @param {object} opts
 * @param {Array} opts.pages — תוצר projectPage() לכל עמוד
 * @param {{w:number,h:number}} opts.pageSizeMm — גודל עמוד במ״מ (מרישום גדלי העמוד)
 * @param {object} opts.font — {subsetBytes, widthsUnits:Map(gid→units), unitsPerEm, cidOf:(ch)=>gid, charToGidEntries:()=>[ch,gid][]}
 * @param {object} [opts.font2] — **S4.15:** גופן משני (FrankReal-Bold — מילות-חלון):
 *   אותה צורה; מילים עם fontKey==='window' נציירות בו (/F2). בלעדיו — הכל ב-/F1.
 * @param {object} opts.settings — pdf-crop-marks, export-bleed-mm
 * @param {Array} [opts.outline] — [{title, page, level}] — סימניות מכותרות
 * @param {Array} [opts.tocLinks] — [{page, x, y, w, h, targetPage}] — קישורי TOC (px מהמקרן)
 * @returns {Buffer}
 */
function writePdf(opts) {
  const { pages, pageSizeMm, font, font2, font3, font4, settings, outline, tocLinks } = opts;
  const pdf = new PdfBuilder();

  const wPt = pageSizeMm.w * MM_TO_PT;
  const hPt = pageSizeMm.h * MM_TO_PT;
  const bleedPt = (Number(settings['export-bleed-mm']) || 0) * MM_TO_PT;
  const cropMarks = settings['pdf-crop-marks'] === true;
  const pageCount = pages.length;

  // ---- הקצאת מזהים דטרמיניסטית מראש ----
  // מפת מזהים קבוע: 1 קטלוג, 2 דפים, 3 Type0, 4 CIDFont, 5 FontDescriptor,
  // 6 FontFile2 (stream), 7 ToUnicode (stream), 8 Outlines; 9 שמור; 10+ דינמי.
  const ID = {
    catalog: 1, pages: 2, type0: 3, cidFont: 4, fontDescriptor: 5, fontFile: 6, toUnicode: 7, outlines: 8
  };
  pdf.nextId = 10;
  // **S4.15:** מזהי הגופן המשני (קבועים — דטרמיניזם): 9 היה שמור; 4 נוספים דינמיים
  // מיד אחריו, לפני הדפים — סדר קבוע לכל הרצות.
  if (font2) {
    ID.type0b = 9;
    ID.cidFontb = pdf.reserve();
    ID.fontDescriptorb = pdf.reserve();
    ID.fontFileb = pdf.reserve();
    ID.toUnicodeb = pdf.reserve();
  }
  // **S4.26:** מזהי הגופן השלישי (DavidLibre-Bold — כותרות) — אחרי אלו של
  // font2, סדר קבוע לפני הדפים (דטרמיניזם).
  if (font3) {
    ID.type0c = pdf.reserve();
    ID.cidFontc = pdf.reserve();
    ID.fontDescriptorc = pdf.reserve();
    ID.fontFilec = pdf.reserve();
    ID.toUnicodec = pdf.reserve();
  }
  // **S4.26:** מזהי הגופן הרביעי (Frank Ruhl Libre — fallback לפיסוק שחסר
  // בגוף הראשי, כמו מחסנית ה-CSS בדפדפן).
  if (font4) {
    ID.type0d = pdf.reserve();
    ID.cidFontd = pdf.reserve();
    ID.fontDescriptord = pdf.reserve();
    ID.fontFiled = pdf.reserve();
    ID.toUnicoded = pdf.reserve();
  }
  const pageIds = pages.map(() => pdf.reserve());
  const contentIds = pages.map(() => pdf.reserve());
  const linkIds = new Map(); // pageIndex → [ids]
  for (const link of tocLinks || []) {
    if (!linkIds.has(link.page)) linkIds.set(link.page, []);
    linkIds.get(link.page).push(pdf.reserve());
  }
  const outlineItems = (outline || []).map(o => ({ ...o, id: pdf.reserve() }));

  // ---- עץ הסימניות: היררכיה לפי level ----
  const stack = [];
  const roots = [];
  for (const it of outlineItems) {
    while (stack.length && stack[stack.length - 1].level >= it.level) stack.pop();
    it.parent = stack.length ? stack[stack.length - 1] : null;
    it.children = [];
    if (!it.parent) roots.push(it); else it.parent.children.push(it);
    stack.push(it);
  }
  const flatOrder = [];
  const walk = (list) => { for (const x of list) { flatOrder.push(x); walk(x.children); } };
  walk(roots);
  for (const list of [roots, ...flatOrder.filter(f => f.children.length).map(f => f.children)]) {
    for (let i = 0; i < list.length; i++) { list[i].prev = list[i - 1] || null; list[i].next = list[i + 1] || null; }
  }

  // ---- תוכן לכל עמוד (content streams) ----
  const contents = pages.map((pg) => {
    const ops = [];
    // **D-89 (צבע פר-מילה):** rgb 0..1 על המילה (כותרת עליונה בכחול-הייחוס
    // #0F1749, בלוקי השער האחורי) — ברירת מחדל שחור (0 0 0 rg מרומז ב-PDF).
    const emitWord = (text, xPx, yPx, sizePt, fontKey, color) => {
      // **S4.15:** מילת-חלון בגופן המשני (FrankReal-Bold) — כמו המקור;
      // **S4.26:** כותרות בגופן השלישי (DavidLibre-Bold — כמו הייחוס);
      // **S4.26 (פיצול גליפים):** תווים שחסרים בגוף הראשי (פיסוק בסיסי
      // בגוטמן רש"י: ' . ׳) מצוירים בגופן ה-fallback (/F4) — המשך אותה
      // פעולת טקסט, העט ממשיך מאליו אחרי כל Tj.
      const useF2 = font2 && fontKey === 'window';
      const useF3 = font3 && fontKey === 'heading';
      const f = useF2 ? font2 : (useF3 ? font3 : font);
      const chars = [...String(text)].filter(ch => {
        const cp = ch.codePointAt(0);
        return cp >= 0x20 && cp !== 0x7F;
      });
      const visual = visualOrderRtl(chars);
      if (!visual.length) return;
      if (font4 && f !== font2 && f !== font3) {
        const runs = [];
        for (const ch of visual) {
          const useFb = f.cidOf(ch) === 0 && font4.cidOf(ch) !== 0;
          const key = useFb ? 'fb' : 'main';
          if (runs.length && runs[runs.length - 1].key === key) runs[runs.length - 1].chars.push(ch);
          else runs.push({ key, chars: [ch] });
        }
        if (runs.length > 1 || (runs[0] && runs[0].key === 'fb')) {
          if (Array.isArray(color) && color.length === 3) {
            ops.push(`${round2(color[0])} ${round2(color[1])} ${round2(color[2])} rg`);
          }
          ops.push(`BT ${round2(xPx * PX_TO_PT)} ${round2(hPt - yPx * PX_TO_PT)} Td`);
          for (const run of runs) {
            const rf = run.key === 'fb' ? font4 : f;
            let hex = '';
            for (const ch of run.chars) {
              const g = rf.cidOf(ch);
              if (g) hex += g.toString(16).padStart(4, '0');
            }
            if (hex) ops.push(`/${run.key === 'fb' ? 'F4' : (useF3 ? 'F3' : 'F1')} ${round2(sizePt)} Tf <${hex}> Tj`);
          }
          ops.push('ET');
          return;
        }
      }
      let out = '';
      for (const ch of visual) {
        const g = f.cidOf(ch);
        if (g === 0) continue;
        out += g.toString(16).padStart(4, '0');
      }
      if (!out) return;
      if (Array.isArray(color) && color.length === 3) {
        ops.push(`${round2(color[0])} ${round2(color[1])} ${round2(color[2])} rg`);
      }
      ops.push(`BT ${useF2 ? '/F2' : (useF3 ? '/F3' : '/F1')} ${round2(sizePt)} Tf ${round2(xPx * PX_TO_PT)} ${round2(hPt - yPx * PX_TO_PT)} Td <${out}> Tj ET`);
    };
    const emitLines = (lines) => {
      for (const ln of lines) {
        // **S12 (parity):** בסיס השורה מהמקרן (מודל תיבת שורה CSS — half-leading+ascent)
        const baselineY = ln.baselineY != null ? ln.baselineY : ln.y + ln.h - ln.sizePt * (96 / 72) * 0.78;
        // **S4.9 (legacy IMUD):** מילים עם גודל/בסיס משלהן (מילת-חלון 1.5×, סמני הערות)
        for (const w of ln.words) emitWord(w.text, w.x, w.baselineY != null ? w.baselineY : baselineY, w.sizePt || ln.sizePt, w.fontKey, w.color);
      }
    };
    if (pg.spanning) emitLines(pg.spanning.lines);
    emitLines(pg.lines);
    // מרזב הערות — סמן + מילות ההערה (מימין לשמאל); בסיס מהמקרן
    for (const fn of pg.footnotes) {
      if (fn.words && fn.words.length) {
        // **D-89 (דיווח משתמש: "בהערות השוליים יש מילים אחת על השניה"):**
        // בסיס פר-מילה מהמקרן (פר-שורה) — בעבר baselineY אחד לכל ההערה
        // וכל שורות הערה רבת-שורות נערמו זו על זו.
        for (const w of fn.words) emitWord(w.text, w.x, w.baselineY != null ? w.baselineY : fn.baselineY, w.sizePt || 8.5, w.fontKey, w.color);
        continue;
      }
      const fs = 11;
      const baseY = fn.baselineY != null ? fn.baselineY : fn.y + 9;
      let x = fn.x + fn.w - 4;
      if (fn.marker) { emitWord(fn.marker, x - 14, baseY, fs); x -= 18; }
      let cx = x;
      for (const w of fn.text.split(/\s+/).filter(Boolean)) {
        cx -= 8.2;
        emitWord(w, cx, baseY, fs);
      }
    }
    // גיליון — מקור יחיד (D-81): מיקום/רוחב מהקרן; נפילה לנוסחה הישנה רק אם חסר
    if (pg.folio && pg.folio.text) {
      const fw = pg.folio.w != null ? pg.folio.w : pg.folio.text.length * 6;
      const fx = pg.folio.x != null ? pg.folio.x : pg.width / 2 - fw / 2;
      const fy = pg.folio.baselineY != null ? pg.folio.baselineY : pg.folio.y + 10;
      emitWord(pg.folio.text, fx, fy, 10);
    }
    // כותרת עליונה — סלוטים לפי מיקום פיזי מהקרן (D-81); נפילה מתועדת לנוסחה הישנה
    if (pg.header) {
      for (const s of pg.header.slots) {
        const sw = s.w != null ? s.w : s.text.length * 5.5;
        const x = s.x != null ? s.x : (s.pos === 'right' ? pg.width - 60 - sw : s.pos === 'center' ? (pg.width - sw) / 2 : 60);
        const y = pg.header.baselineY != null ? pg.header.baselineY : pg.header.y + 10;
        // **D-89:** סלוט legacy עם מילים ממוקמות מהמקרן — בסיס/צבע פר-מילה;
        // נפילה לנוסחה הישנה רק כשאין מילים (נתיב DP).
        if (s.words && s.words.length) {
          for (const w of s.words) emitWord(w.text, w.x, w.baselineY != null ? w.baselineY : y, w.sizePt || s.sizePt || 9, w.fontKey, w.color);
          continue;
        }
        emitWord(s.text, x, y, s.sizePt || 9, null, s.color);
      }
    }
    // **EXT-4 (ציור עיטורים):** פעולות הציור מגיעות מוכנות מהפרויקטור
    // (d.pdfOps — פוענחו שם מה-SVG במקור היחיד ornament-ink; הכותב עצמו
    // חף-תלויות ואוסף אובייקטים בלבד). תמונות רסטר אינן מצוירות כאן (מתועד).
    if (pg.decorations && pg.decorations.length) {
      for (const d of pg.decorations) {
        if (Array.isArray(d.pdfOps)) ops.push(...d.pdfOps);
      }
    }
    // סימני חיתוך (חוץ ל־TrimBox; אורך 5מ״מ)
    if (cropMarks) {
      const m = 5 * MM_TO_PT;
      ops.push('0.6 w 0 G');
      ops.push(`0 ${round2(hPt - m)} m ${round2(m)} ${round2(hPt - m)} l S`);
      ops.push(`${round2(m)} ${round2(hPt - m)} m ${round2(m)} ${round2(hPt)} l S`);
      ops.push(`${round2(wPt - m)} ${round2(hPt - m)} m ${round2(wPt)} ${round2(hPt - m)} l S`);
      ops.push(`${round2(wPt)} ${round2(hPt - m)} m ${round2(wPt)} ${round2(hPt)} l S`);
      ops.push(`0 ${round2(m)} m ${round2(m)} ${round2(m)} l S`);
      ops.push(`${round2(m)} ${round2(m)} m ${round2(m)} 0 l S`);
      ops.push(`${round2(wPt - m)} ${round2(m)} m ${round2(wPt)} ${round2(m)} l S`);
      ops.push(`${round2(wPt)} ${round2(m)} m ${round2(wPt)} 0 l S`);
    }
    return Buffer.from(ops.join('\n'), 'latin1');
  });

  // ---- הרכבה: קטלוג, דפים, גופן ----
  const catalogKids = pageIds.map(id => `${id} 0 R`).join(' ');
  const outlinesRef = (outlineItems.length) ? ` /Outlines ${ID.outlines} 0 R /PageMode /UseOutlines` : '';
  pdf.put(ID.catalog, `<< /Type /Catalog /Pages ${ID.pages} 0 R${outlinesRef} >>`);
  pdf.put(ID.pages, `<< /Type /Pages /Count ${pageCount} /Kids [${catalogKids}] >>`);

  // W: לפי חוזה PDF — צורה 1: `c [w1 w2 … wn]` (רצף רוחבים בסוגריים); יחידות פר 1000
  const wArray = [];
  let run = null;
  let prevGid = -10;
  for (const g of [...font.widthsUnits.keys()].sort((a, b) => a - b)) {
    const wv = Math.round((font.widthsUnits.get(g) / font.unitsPerEm) * 1000);
    if (g === prevGid + 1 && run) run.push(wv);
    else { if (run) wArray.push(run); run = [g, wv]; }
    prevGid = g;
  }
  if (run) wArray.push(run);
  const wStr = wArray.map(r => `${r[0]} [${r.slice(1).join(' ')}]`).join(' ');

  pdf.put(ID.type0, `<< /Type /Font /Subtype /Type0 /BaseFont /ToraBook /Encoding /Identity-H /DescendantFonts [${ID.cidFont} 0 R] /ToUnicode ${ID.toUnicode} 0 R >>`);
  pdf.put(ID.cidFont, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ToraBook /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ID.fontDescriptor} 0 R /DW 1000 /W [${wStr}] >>`);
  pdf.put(ID.fontDescriptor, `<< /Type /FontDescriptor /FontName /ToraBook /Flags 4 /FontBBox [-200 -300 1200 1000] /ItalicAngle 0 /Ascent 800 /Descent -200 /CapHeight 700 /StemV 80 /FontFile2 ${ID.fontFile} 0 R >>`);
  const ffStream = Buffer.concat([
    Buffer.from(`<< /Length ${font.subsetBytes.length} /Length1 ${font.subsetBytes.length} >>\nstream\n`, 'latin1'),
    font.subsetBytes,
    Buffer.from('\nendstream', 'latin1')
  ]);
  pdf.put(ID.fontFile, ffStream); // 5
  const toUni = buildToUnicode(font);
  pdf.put(ID.toUnicode, `<< /Length ${toUni.length} >>\nstream\n${toUni}\nendstream`); // 6

  // **S4.15:** הגופן המשני (FrankReal-Bold — מילות-חלון) — אותם אובייקטים בשמות שונים
  if (font2) {
    const wArray2 = [];
    let run2 = null;
    let prevGid2 = -10;
    for (const g of [...font2.widthsUnits.keys()].sort((a, b) => a - b)) {
      const wv = Math.round((font2.widthsUnits.get(g) / font2.unitsPerEm) * 1000);
      if (g === prevGid2 + 1 && run2) run2.push(wv);
      else { if (run2) wArray2.push(run2); run2 = [g, wv]; }
      prevGid2 = g;
    }
    if (run2) wArray2.push(run2);
    const wStr2 = wArray2.map(r => `${r[0]} [${r.slice(1).join(' ')}]`).join(' ');
    pdf.put(ID.type0b, `<< /Type /Font /Subtype /Type0 /BaseFont /ToraWin /Encoding /Identity-H /DescendantFonts [${ID.cidFontb} 0 R] /ToUnicode ${ID.toUnicodeb} 0 R >>`);
    pdf.put(ID.cidFontb, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ToraWin /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ID.fontDescriptorb} 0 R /DW 1000 /W [${wStr2}] >>`);
    pdf.put(ID.fontDescriptorb, `<< /Type /FontDescriptor /FontName /ToraWin /Flags 4 /FontBBox [-200 -300 1200 1000] /ItalicAngle 0 /Ascent 751 /Descent -135 /CapHeight 700 /StemV 120 /FontFile2 ${ID.fontFileb} 0 R >>`);
    const ff2 = Buffer.concat([
      Buffer.from(`<< /Length ${font2.subsetBytes.length} /Length1 ${font2.subsetBytes.length} >>\nstream\n`, 'latin1'),
      font2.subsetBytes,
      Buffer.from('\nendstream', 'latin1')
    ]);
    pdf.put(ID.fontFileb, ff2);
    const toUni2 = buildToUnicode(font2);
    pdf.put(ID.toUnicodeb, `<< /Length ${toUni2.length} >>\nstream\n${toUni2}\nendstream`);
  }

  // **S4.26:** הגופן הרביעי (Frank Ruhl Libre — fallback לפיסוק) — אותם
  // אובייקטים בשמות שונים (מטריקות: asc 1000/1000, desc −200/1000).
  if (font4) {
    const wArray4 = [];
    let run4 = null;
    let prevGid4 = -10;
    for (const g of [...font4.widthsUnits.keys()].sort((a, b) => a - b)) {
      const wv = Math.round((font4.widthsUnits.get(g) / font4.unitsPerEm) * 1000);
      if (g === prevGid4 + 1 && run4) run4.push(wv);
      else { if (run4) wArray4.push(run4); run4 = [g, wv]; }
      prevGid4 = g;
    }
    if (run4) wArray4.push(run4);
    const wStr4 = wArray4.map(r => `${r[0]} [${r.slice(1).join(' ')}]`).join(' ');
    pdf.put(ID.type0d, `<< /Type /Font /Subtype /Type0 /BaseFont /ToraPunct /Encoding /Identity-H /DescendantFonts [${ID.cidFontd} 0 R] /ToUnicode ${ID.toUnicoded} 0 R >>`);
    pdf.put(ID.cidFontd, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ToraPunct /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ID.fontDescriptord} 0 R /DW 1000 /W [${wStr4}] >>`);
    pdf.put(ID.fontDescriptord, `<< /Type /FontDescriptor /FontName /ToraPunct /Flags 4 /FontBBox [-200 -300 1200 1000] /ItalicAngle 0 /Ascent 1000 /Descent -200 /CapHeight 700 /StemV 80 /FontFile2 ${ID.fontFiled} 0 R >>`);
    const ff4 = Buffer.concat([
      Buffer.from(`<< /Length ${font4.subsetBytes.length} /Length1 ${font4.subsetBytes.length} >>\nstream\n`, 'latin1'),
      font4.subsetBytes,
      Buffer.from('\nendstream', 'latin1')
    ]);
    pdf.put(ID.fontFiled, ff4);
    const toUni4 = buildToUnicode(font4);
    pdf.put(ID.toUnicoded, `<< /Length ${toUni4.length} >>\nstream\n${toUni4}\nendstream`);
  }

  // **S4.26:** הגופן השלישי (DavidLibre-Bold — כותרות/TOC) — אותם אובייקטים
  // בשמות שונים (מטריקות אמת: ascender 1599/2048=781, descender −449/2048=−219).
  if (font3) {
    const wArray3 = [];
    let run3 = null;
    let prevGid3 = -10;
    for (const g of [...font3.widthsUnits.keys()].sort((a, b) => a - b)) {
      const wv = Math.round((font3.widthsUnits.get(g) / font3.unitsPerEm) * 1000);
      if (g === prevGid3 + 1 && run3) run3.push(wv);
      else { if (run3) wArray3.push(run3); run3 = [g, wv]; }
      prevGid3 = g;
    }
    if (run3) wArray3.push(run3);
    const wStr3 = wArray3.map(r => `${r[0]} [${r.slice(1).join(' ')}]`).join(' ');
    pdf.put(ID.type0c, `<< /Type /Font /Subtype /Type0 /BaseFont /ToraHead /Encoding /Identity-H /DescendantFonts [${ID.cidFontc} 0 R] /ToUnicode ${ID.toUnicodec} 0 R >>`);
    pdf.put(ID.cidFontc, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ToraHead /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ID.fontDescriptorc} 0 R /DW 1000 /W [${wStr3}] >>`);
    pdf.put(ID.fontDescriptorc, `<< /Type /FontDescriptor /FontName /ToraHead /Flags 4 /FontBBox [-200 -300 1200 1000] /ItalicAngle 0 /Ascent 781 /Descent -219 /CapHeight 700 /StemV 120 /FontFile2 ${ID.fontFilec} 0 R >>`);
    const ff3 = Buffer.concat([
      Buffer.from(`<< /Length ${font3.subsetBytes.length} /Length1 ${font3.subsetBytes.length} >>\nstream\n`, 'latin1'),
      font3.subsetBytes,
      Buffer.from('\nendstream', 'latin1')
    ]);
    pdf.put(ID.fontFilec, ff3);
    const toUni3 = buildToUnicode(font3);
    pdf.put(ID.toUnicodec, `<< /Length ${toUni3.length} >>\nstream\n${toUni3}\nendstream`);
  }

  // ---- עמודים ----
  const mediabox = `[0 0 ${round2(wPt)} ${round2(hPt)}]`;
  const bleedbox = `[${round2(-bleedPt)} ${round2(-bleedPt)} ${round2(wPt + bleedPt)} ${round2(hPt + bleedPt)}]`;
  pages.forEach((pg, i) => {
    const annots = linkIds.get(i) || [];
    const annotsStr = annots.length ? ` /Annots [${annots.map(id => `${id} 0 R`).join(' ')}]` : '';
    const fontRes = font2 && font3 && font4
      ? `/Font << /F1 ${ID.type0} 0 R /F2 ${ID.type0b} 0 R /F3 ${ID.type0c} 0 R /F4 ${ID.type0d} 0 R >>`
      : (font2 && font3
        ? `/Font << /F1 ${ID.type0} 0 R /F2 ${ID.type0b} 0 R /F3 ${ID.type0c} 0 R >>`
        : (font2
          ? `/Font << /F1 ${ID.type0} 0 R /F2 ${ID.type0b} 0 R ${font4 ? `/F4 ${ID.type0d} 0 R` : ''} >>`
          : `/Font << /F1 ${ID.type0} 0 R ${font3 ? `/F3 ${ID.type0c} 0 R` : ''} ${font4 ? `/F4 ${ID.type0d} 0 R` : ''} >>`));
    pdf.put(pageIds[i], `<< /Type /Page /Parent ${ID.pages} 0 R /MediaBox ${mediabox} /TrimBox ${mediabox} /BleedBox ${bleedbox} /Resources << ${fontRes} >> /Contents ${contentIds[i]} 0 R${annotsStr} >>`);
    pdf.put(contentIds[i], Buffer.concat([
      Buffer.from(`<< /Length ${contents[i].length} >>\nstream\n`, 'latin1'),
      contents[i],
      Buffer.from('\nendstream', 'latin1')
    ]));
  });

  // ---- קישורי TOC ----
  let linkCursor = 0;
  for (const link of tocLinks || []) {
    const id = linkIds.get(link.page)[0] ? null : null;
    void id;
  }
  // סדר הקצאת הקישורים: לפי סדר tocLinks (אותו סדר בשמור המזהים)
  {
    const perPage = new Map();
    for (const link of tocLinks || []) {
      if (!perPage.has(link.page)) perPage.set(link.page, []);
      perPage.get(link.page).push(link);
    }
    for (const [pgIdx, links] of perPage) {
      const ids = linkIds.get(pgIdx);
      links.forEach((link, j) => {
        const x1 = link.x * PX_TO_PT, y1 = hPt - (link.y + link.h) * PX_TO_PT;
        const x2 = (link.x + link.w) * PX_TO_PT, y2 = hPt - link.y * PX_TO_PT;
        pdf.put(ids[j], `<< /Type /Annot /Subtype /Link /Rect [${round2(x1)} ${round2(y1)} ${round2(x2)} ${round2(y2)}] /Border [0 0 0] /Dest [${pageIds[link.targetPage]} 0 R /XYZ null null null] >>`);
      });
    }
    void linkCursor;
  }

  // ---- סימניות ----
  if (outlineItems.length) {
    pdf.put(ID.outlines, `<< /Type /Outlines /First ${roots[0].id} 0 R /Last ${roots[roots.length - 1].id} 0 R /Count ${flatOrder.length} >>`);
    for (const it of flatOrder) {
      const parts = [
        '<< /Title ' + pdfTitleHex(it.title),
        `/Parent ${it.parent ? it.parent.id : ID.outlines} 0 R`,
        `/Dest [${pageIds[it.page]} 0 R /XYZ null null null]`,
        `/Count ${it.children.length}`
      ];
      if (it.prev) parts.push(`/Prev ${it.prev.id} 0 R`);
      if (it.next) parts.push(`/Next ${it.next.id} 0 R`);
      if (it.children.length) parts.push(`/First ${it.children[0].id} 0 R /Last ${it.children[it.children.length - 1].id} 0 R`);
      pdf.put(it.id, parts.join(' ') + ' >>');
    }
  } else {
    pdf.put(ID.outlines, `<< /Type /Outlines /Count 0 >>`);
  }

  return pdf.build();
}

module.exports = { writePdf, PdfBuilder, PX_TO_PT, MM_TO_PT, visualOrderRtl, BRACKET_MIRROR };
