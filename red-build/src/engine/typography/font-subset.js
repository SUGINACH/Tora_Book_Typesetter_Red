// src/engine/typography/font-subset.js — TrueType subsetting for exports (S12.1-8, REQ-EXP)
'use strict';

/**
 * מצמום גופן לגליפים שבשימוש בלבד — תקציב גודל לייצוא (PDF/HTML).
 * שומר: head/hhea/maxp/hmtx/cmap/glyf/loca/OS/2 (+cvt/fpgm/prep כשיש — רמזים).
 * לוקח מהפרנסר (font-metrics) את המיפויים; בונה גופן חדש עצמאי תקני.
 *
 * **בדיקת tofu (0 סימנים חסרים):** הפרנסר עצמו משמש בודק — קריאה חוזרת
 * של התת־גופן חייבת למפות כל תו מבוקש לגליף בעל קווי מתאר לא־ריקים.
 */

const fm = require('./font-metrics');

function u16(v) { return [(v >> 8) & 0xFF, v & 0xFF]; }
function s16v(v) { return u16(v < 0 ? v + 0x10000 : v); }
function u32v(v) { return [(v >>> 24) & 0xFF, (v >>> 16) & 0xFF, (v >>> 8) & 0xFF, v & 0xFF]; }
function str4(s) { return [s.charCodeAt(0), s.charCodeAt(1), s.charCodeAt(2), s.charCodeAt(3)]; }
function rdU16(b, o) { return (b[o] << 8) | b[o + 1]; }
function rdS16(b, o) { const v = rdU16(b, o); return v >= 0x8000 ? v - 0x10000 : v; }
function rdU32(b, o) { return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; }

/**
 * בניית תת־גופן.
 * @param {object} font — תוצר parseFont().font
 * @param {Array<string>} chars — התווים הנדרשים (כולל רווח)
 * @returns {{ok:boolean, error?:string, bytes?:Buffer, kept:number, dropped:number, widthsUnits?:Map}}
 */
function buildSubset(font, chars) {
  if (!font || !font.bytes) return { ok: false, error: 'no-font' };
  const b = font.bytes;

  // 1) קבוצת הגליפים: .notdef + כל גליף ממופה מהתווים המבוקשים
  const gidSet = new Set([0]);
  const charsKept = [];
  for (const ch of chars || []) {
    const g = fm.glyphIdOf(font, ch);
    if (g !== 0) { gidSet.add(g); charsKept.push(ch); }
  }
  const gids = [...gidSet].sort((a, c) => a - c);
  const gidToNew = new Map(gids.map((g, i) => [g, i])); // ישן → חדש

  // 2) glyf/loca מקוריים — העתקת קווי מתאר כמו שהם
  const locFormat = font.indexToLocFormat;
  const locaOff = font.tables.loca ? font.tables.loca.offset : null;
  const glyfOff = font.tables.glyf ? font.tables.glyf.offset : null;
  if (locaOff == null || glyfOff == null) return { ok: false, error: 'no-glyf-loca' };
  const glyphLen = (g) => {
    const s = locFormat === 0 ? rdU16(b, locaOff + g * 2) * 2 : rdU32(b, locaOff + g * 4);
    const e = locFormat === 0 ? rdU16(b, locaOff + (g + 1) * 2) * 2 : rdU32(b, locaOff + (g + 1) * 4);
    return e - s;
  };
  const glyphBytes = (g) => {
    const s = locFormat === 0 ? rdU16(b, locaOff + g * 2) * 2 : rdU32(b, locaOff + g * 4);
    return b.slice(glyfOff + s, glyfOff + s + glyphLen(g));
  };

  // תת־glyf: מרווחים לפי קווי מתאר; loca קצר (÷2) אם אפשר, אחרת ארוך
  const newGlyphs = gids.map(g => glyphBytes(g));
  const glyfParts = [];
  const newLoca = [0];
  let acc = 0;
  for (const g of newGlyphs) {
    glyfParts.push(g);
    acc += g.length;
    if (acc & 3) { const pad = 4 - (acc & 3); glyfParts.push(Buffer.alloc(pad)); acc += pad; }
    newLoca.push(acc);
  }
  const newGlyf = Buffer.concat(glyfParts);
  const useShortLoca = newLoca.every(v => v <= 0xFFFF * 2) && newGlyf.length <= 0x1FFFE;
  const newLocaBytes = [];
  for (const v of newLoca) {
    if (useShortLoca) newLocaBytes.push(...u16(Math.round(v / 2)));
    else newLocaBytes.push(...u32v(v));
  }

  // 3) hmtx חדש (numberOfHMetrics = מספר הגליפים החדש)
  const oldHm = font.tables.hmtx.offset;
  const oldLSB = (g) => {
    if (g < font.numberOfHMetrics) return rdS16(b, oldHm + g * 4 + 2);
    return rdS16(b, oldHm + font.numberOfHMetrics * 4 + (g - font.numberOfHMetrics) * 2);
  };
  const newHmtx = [];
  const widthsUnits = new Map(); // gid חדש → advance units (ל־W ב־PDF)
  for (const g of gids) {
    const ng = gidToNew.get(g);
    const adv = font.advanceUnits[g] || 0;
    newHmtx.push(...u16(adv), ...s16v(oldLSB(g)));
    widthsUnits.set(ng, adv);
  }

  // 4) cmap חדש — fmt4 על התווים שנשמרו (מקודpoints → gid חדש)
  const kept = charsKept.map(ch => ({ cp: ch.codePointAt(0), ng: gidToNew.get(fm.glyphIdOf(font, ch)) }))
    .sort((a, c) => a.cp - c.cp);
  const segs = [];
  let run = null;
  for (const k of kept) {
    if (run && k.cp === run.end + 1 && k.ng === run.ngEnd + 1) { run.end = k.cp; run.ngEnd = k.ng; }
    else { if (run) segs.push(run); run = { start: k.cp, end: k.cp, ngStart: k.ng, ngEnd: k.ng }; }
  }
  if (run) segs.push(run);
  const segCount = segs.length + 1; // + reserved 0xFFFF
  const sub4Len = 16 + segCount * 8;
  const pow2 = Math.pow(2, Math.floor(Math.log2(segCount)));
  const sub4 = [
    ...u16(4), ...u16(sub4Len), ...u16(0), ...u16(segCount * 2),
    ...u16(2 * pow2), ...u16(Math.floor(Math.log2(segCount))), ...u16(segCount * 2 - 2 * pow2),
    ...segs.map(s => u16(s.end)).flat(), ...u16(0xFFFF), ...u16(0),
    ...segs.map(s => u16(s.start)).flat(), ...u16(0xFFFF),
    ...segs.map(s => s16v(s.ngStart - s.start)).flat(), ...s16v(1),
    ...new Array(segCount).fill(0).flatMap(() => u16(0))
  ];
  const newCmap = [...u16(0), ...u16(1), ...u16(3), ...u16(1), ...u32v(12), ...sub4];

  // 5) head העתקה (indexToLocFormat מותאם) + hhea/maxp/OS/2 מקור (numberOfHMetrics מותאם)
  const head = Buffer.from(b.slice(font.tables.head.offset, font.tables.head.offset + font.tables.head.length));
  head[50] = 0; head[51] = useShortLoca ? 0 : 1;
  const hhea = Buffer.from(b.slice(font.tables.hhea.offset, font.tables.hhea.offset + font.tables.hhea.length));
  hhea[34] = (gids.length >> 8) & 0xFF; hhea[35] = gids.length & 0xFF;
  const maxp = Buffer.from(b.slice(font.tables.maxp.offset, font.tables.maxp.offset + font.tables.maxp.length));
  maxp[4] = (gids.length >> 8) & 0xFF; maxp[5] = gids.length & 0xFF;
  const os2 = font.tables['OS/2'] ? Buffer.from(b.slice(font.tables['OS/2'].offset, font.tables['OS/2'].offset + font.tables['OS/2'].length)) : null;
  const name = font.tables.name ? Buffer.from(b.slice(font.tables.name.offset, font.tables.name.offset + font.tables.name.length)) : null;
  const post = font.tables.post ? Buffer.from(b.slice(font.tables.post.offset, font.tables.post.offset + font.tables.post.length)) : null;
  // רמזים (hinting) — מועתקים כמו שהם (תקינות רינדור בגדלים קטנים)
  const cvt = font.tables.cvt ? Buffer.from(b.slice(font.tables.cvt.offset, font.tables.cvt.offset + font.tables.cvt.length)) : null;
  const fpgm = font.tables.fpgm ? Buffer.from(b.slice(font.tables.fpgm.offset, font.tables.fpgm.offset + font.tables.fpgm.length)) : null;
  const prep = font.tables.prep ? Buffer.from(b.slice(font.tables.prep.offset, font.tables.prep.offset + font.tables.prep.length)) : null;

  // 6) הרכבה
  const tables = [
    ...(os2 ? [['OS/2', os2]] : []),
    ['cmap', Buffer.from(newCmap)],
    ...(cvt ? [['cvt ', cvt]] : []),
    ...(fpgm ? [['fpgm', fpgm]] : []),
    ['glyf', newGlyf],
    ['head', head],
    ['hhea', hhea],
    ['hmtx', Buffer.from(newHmtx)],
    ['loca', Buffer.from(newLocaBytes)],
    ['maxp', maxp],
    ...(name ? [['name', name]] : []),
    ...(post ? [['post', post]] : []),
    ...(prep ? [['prep', prep]] : [])
  ];
  const n = tables.length;
  let off = 12 + n * 16;
  const entries = tables.map(([t, data]) => {
    const e = { t, offset: off, length: data.length, data };
    off += data.length;
    if (off & 3) off += 4 - (off & 3);
    return e;
  });
  const out = [];
  out.push(...u32v(0x00010000), ...u16(n), ...u16(16 * n), ...u16(0), ...u16(0));
  for (const e of entries) out.push(...str4(e.t), ...u32v(0), ...u32v(e.offset), ...u32v(e.length));
  for (const e of entries) {
    // **D-83:** טבלת גופן (glyf/cmap) עשויה לחרוג ממגבלת הארגומנטים של V8 (~125K)
    // בספרים גדולים — הזרקה בלולאה בלבד (אותו תיקון כמו בבדיקת שימור התוכן).
    for (let i = 0; i < e.data.length; i++) out.push(e.data[i]);
    while (out.length & 3) out.push(0);
  }
  const bytes = Buffer.from(out);

  // 7) **בדיקת tofu עצמית:** הפרנסר קורא את התוצר; כל תו מבוקש ממופה; קווי מתאר לא ריקים
  const back = fm.parseFont(bytes);
  if (!back.ok) return { ok: false, error: `subset-reparse-failed:${back.error}` };
  const loca2 = back.font.indexToLocFormat === 0
    ? (g) => rdU16(bytes, back.font.tables.loca.offset + g * 2) * 2
    : (g) => rdU32(bytes, back.font.tables.loca.offset + g * 4);
  for (const ch of chars || []) {
    const g = fm.glyphIdOf(back.font, ch);
    if (g === 0) return { ok: false, error: `tofu:${ch.codePointAt(0).toString(16)}` };
    const advNew = fm.advanceUnitsOf(back.font, ch);
    // **tofu = לא ממופה או (ריק מקווי־מתאר וגם חסר רוחב).** רווח וכיוצא בו —
    // גליף ריק חוקי עם advance חיובי (אין לו קווי מתאר מטבעו); לא tofu.
    const len = loca2(g + 1) - loca2(g);
    if (len <= 0 && advNew === 0) return { ok: false, error: `tofu-empty:${ch.codePointAt(0).toString(16)}` };
    const advOld = fm.advanceUnitsOf(font, ch);
    if (advOld !== advNew) return { ok: false, error: `width-drift:${ch.codePointAt(0).toString(16)}:${advNew}!=${advOld}` };
  }

  return {
    ok: true, bytes,
    kept: gids.length,
    dropped: font.numGlyphs - gids.length,
    widthsUnits,
    unitsPerEm: font.unitsPerEm,
    mappedChars: charsKept.length
  };
}

/**
 * מלאי התווים של טקסט (למצמום) — ייחודיים, כולל רווח תמיד.
 * סמנים פנימיים (PUA) ותווי בקרה (C0/DEL) מוסרים — לעולם לא נצייר גליף
 * עבורם (שורות מוצבות מפורש; BRZ-13).
 */
function charInventory(text) {
  const set = new Set([' ']);
  for (const ch of String(text || '')) {
    const c = ch.codePointAt(0);
    if (c >= 0xE000 && c <= 0xF8FF) continue; // PUA — פנימי
    if (c < 0x20 || c === 0x7F) continue;     // בקרה — לא גליף
    set.add(ch);
  }
  return [...set];
}

module.exports = { buildSubset, charInventory };
