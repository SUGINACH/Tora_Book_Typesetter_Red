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

/** מחרוזת CID הקסדצימלית לטקסט (Identity-H: 2 בתים לגליף).
 * **RTL:** PDF מתקדם שמאלה מ־Td; לכן התווים נפלטים בסדר **ויזואלי**
 * (התו הלוגי האחרון ראשון = השמאלי ביותר) — המילה מרונדרת נכון לקורא עברי. */
function cidHex(text, font) {
  const chars = [...String(text)].filter(ch => {
    const cp = ch.codePointAt(0);
    return cp >= 0x20 && cp !== 0x7F;
  });
  let out = '';
  for (let i = chars.length - 1; i >= 0; i--) {
    const g = font.cidOf(chars[i]);
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
 * @param {object} opts.settings — pdf-crop-marks, export-bleed-mm
 * @param {Array} [opts.outline] — [{title, page, level}] — סימניות מכותרות
 * @param {Array} [opts.tocLinks] — [{page, x, y, w, h, targetPage}] — קישורי TOC (px מהמקרן)
 * @returns {Buffer}
 */
function writePdf(opts) {
  const { pages, pageSizeMm, font, settings, outline, tocLinks } = opts;
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
    const emitWord = (text, xPx, yPx, sizePt) => {
      const gidHex = cidHex(text, font);
      if (!gidHex) return;
      ops.push(`BT /F1 ${round2(sizePt)} Tf ${round2(xPx * PX_TO_PT)} ${round2(hPt - yPx * PX_TO_PT)} Td <${gidHex}> Tj ET`);
    };
    const emitLines = (lines) => {
      for (const ln of lines) {
        // **S12 (parity):** בסיס השורה מהמקרן (מודל תיבת שורה CSS — half-leading+ascent)
        const baselineY = ln.baselineY != null ? ln.baselineY : ln.y + ln.h - ln.sizePt * (96 / 72) * 0.78;
        // **S4.9 (legacy IMUD):** מילים עם גודל/בסיס משלהן (מילת-חלון 1.5×, סמני הערות)
        for (const w of ln.words) emitWord(w.text, w.x, w.baselineY != null ? w.baselineY : baselineY, w.sizePt || ln.sizePt);
      }
    };
    if (pg.spanning) emitLines(pg.spanning.lines);
    emitLines(pg.lines);
    // מרזב הערות — סמן + מילות ההערה (מימין לשמאל); בסיס מהמקרן
    for (const fn of pg.footnotes) {
      if (fn.words && fn.words.length) {
        // **S4.9 (legacy IMUD):** מילים עם מיקום מפורש מהמקרן
        for (const w of fn.words) emitWord(w.text, w.x, fn.baselineY, w.sizePt || 8.5);
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
        emitWord(s.text, x, y, s.sizePt || 9);
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

  // ---- עמודים ----
  const mediabox = `[0 0 ${round2(wPt)} ${round2(hPt)}]`;
  const bleedbox = `[${round2(-bleedPt)} ${round2(-bleedPt)} ${round2(wPt + bleedPt)} ${round2(hPt + bleedPt)}]`;
  pages.forEach((pg, i) => {
    const annots = linkIds.get(i) || [];
    const annotsStr = annots.length ? ` /Annots [${annots.map(id => `${id} 0 R`).join(' ')}]` : '';
    pdf.put(pageIds[i], `<< /Type /Page /Parent ${ID.pages} 0 R /MediaBox ${mediabox} /TrimBox ${mediabox} /BleedBox ${bleedbox} /Resources << /Font << /F1 ${ID.type0} 0 R >> >> /Contents ${contentIds[i]} 0 R${annotsStr} >>`);
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

module.exports = { writePdf, PdfBuilder, PX_TO_PT, MM_TO_PT };
