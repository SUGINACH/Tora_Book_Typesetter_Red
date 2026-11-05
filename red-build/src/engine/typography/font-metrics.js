// src/engine/typography/font-metrics.js — TrueType/OpenType metrics parser (S12.1-5, REQ-LB-01 impl B)
'use strict';

/**
 * **שכבת המדידה המתמטית (מימוש B):** קריאת טבלאות אמת מקובץ גופן אמיתי —
 * רוחבי גליפים (hmtx/hhea/cmap), קרנינג (kern fmt0 + GPOS PairPos fmt1),
 * unitsPerEm (head), cap-height (OS/2 v≥2; נפילה ל־hhea.ascender×0.7), וזיהוי
 * סימנים מאפסי־רוחב (ניקוד — advance=0) לפי המפה עצמה.
 *
 * עצמאי לחלוטין: אין תלות חיצונית (HarfBuzz-WASM/fontkit אינם נדרשים —
 * אותה מטרה, טבלאות אמת, אפס תלות זרה; דוקטרינת הריפו). הפרנסר נבדק
 * מול אורקל צולב (fontTools) על גופן אמיתי (DejaVu) — ערכי האמת נעולים בבדיקות.
 *
 * דטרמיניזם: קריאה בלבד; אין Date/Math.random; סדר קבוע.
 */

const MAX_TABLES = 64;
const MAX_SEGMENTS = 8192; // cmap fmt4 הגנת שפיות
const MAX_GPOS_PAIRSETS = 4096;

function u8(b, o) { return b[o]; }
function u16(b, o) { return (b[o] << 8) | b[o + 1]; }
function s16(b, o) { const v = u16(b, o); return v >= 0x8000 ? v - 0x10000 : v; }
function u32(b, o) { return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; }
function tag(b, o) { return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]); }

/**
 * @param {Uint8Array|Buffer} bytes — בתי הגופן (TTF/OTF sfnt)
 * @returns {{ok:boolean, error?:string, font?:object}}
 */
function parseFont(bytes) {
  if (!bytes || bytes.length < 12) return { ok: false, error: 'too-small' };
  const b = bytes;
  const sfntVersion = u32(b, 0);
  if (sfntVersion !== 0x00010000 && sfntVersion !== 0x4F54544F /* 'OTTO' */ && sfntVersion !== 0x74746366 /* 'ttcf' */) {
    return { ok: false, error: `bad-sfnt-version:0x${sfntVersion.toString(16)}` };
  }
  if (sfntVersion === 0x74746366) return { ok: false, error: 'ttcf-collections-unsupported' };
  const numTables = u16(b, 4);
  if (numTables === 0 || numTables > MAX_TABLES) return { ok: false, error: `bad-table-count:${numTables}` };

  // תוכן העניינים של sfnt
  const tables = new Map(); // tag → {offset, length}
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (rec + 16 > b.length) return { ok: false, error: 'table-dir-truncated' };
    const t = tag(b, rec);
    const off = u32(b, rec + 8);
    const len = u32(b, rec + 12);
    if (off + len > b.length) return { ok: false, error: `table-out-of-range:${t}` };
    tables.set(t, { offset: off, length: len });
  }
  const need = ['head', 'maxp', 'hhea', 'hmtx', 'cmap'];
  for (const t of need) if (!tables.has(t)) return { ok: false, error: `missing-table:${t}` };

  // head: unitsPerEm + indexToLocFormat
  const hO = tables.get('head').offset;
  const unitsPerEm = u16(b, hO + 18);
  if (!(unitsPerEm >= 16 && unitsPerEm <= 16384)) return { ok: false, error: `bad-units-per-em:${unitsPerEm}` };
  const indexToLocFormat = s16(b, hO + 50);

  // maxp: numGlyphs
  const numGlyphs = u16(b, tables.get('maxp').offset + 4);
  if (numGlyphs === 0) return { ok: false, error: 'bad-num-glyphs:0' };

  // hhea: numberOfHMetrics + ascender/descender/lineGap
  const hhO = tables.get('hhea').offset;
  const numberOfHMetrics = u16(b, hhO + 34);
  const ascender = s16(b, hhO + 4);
  const descender = s16(b, hhO + 6);
  const lineGap = s16(b, hhO + 8);
  if (numberOfHMetrics === 0 || numberOfHMetrics > numGlyphs) return { ok: false, error: `bad-hmtx-count:${numberOfHMetrics}` };

  // hmtx: advance widths (+lsb)
  const hmO = tables.get('hmtx').offset;
  const advanceUnits = new Uint16Array(numGlyphs);
  for (let g = 0; g < numGlyphs; g++) {
    if (g < numberOfHMetrics) advanceUnits[g] = u16(b, hmO + g * 4);
    else advanceUnits[g] = advanceUnits[numberOfHMetrics - 1];
  }

  // cmap: Unicode → glyph (fmt 4 BMP + fmt 12 full)
  const charToGlyph = new Map();
  const cmErr = parseCmap(b, tables.get('cmap').offset, charToGlyph);
  if (cmErr) return { ok: false, error: `cmap:${cmErr}` };

  // OS/2 (אופציונלי): sCapHeight (v≥2, offset 88)
  let capHeight = null;
  if (tables.has('OS/2')) {
    const osO = tables.get('OS/2').offset;
    if (tables.get('OS/2').length >= 90) {
      const osVer = u16(b, osO);
      const cap = s16(b, osO + 88);
      if (osVer >= 2 && cap > 0) capHeight = cap;
    }
  }

  // kern fmt0 (אופציונלי) + GPOS PairPos fmt1 (אופציונלי) — מפות קרנינג בר־מילה (units)
  const kernPairs = new Map(); // "gidA,gidB" → units
  if (tables.has('kern')) parseKernFmt0(b, tables.get('kern').offset, tables.get('kern').length, kernPairs);
  if (tables.has('GPOS')) parseGposPairPos(b, tables.get('GPOS').offset, tables.get('GPOS').length, kernPairs);

  const font = {
    sfntVersion, unitsPerEm, numGlyphs, indexToLocFormat,
    numberOfHMetrics, ascender, descender, lineGap, capHeight,
    advanceUnits, charToGlyph, kernPairs,
    tables: Object.fromEntries([...tables.entries()].map(([t, v]) => [t, { ...v }])),
    bytes: b
  };
  return { ok: true, font };
}

/** cmap subtable parsing — fmt 4 (BMP) ו־fmt 12 (full); מדגים גם fmt 6 (מינימלי). */
function parseCmap(b, base, charToGlyph) {
  const numSub = u16(b, base + 2);
  if (numSub > 64) return `too-many-subtables:${numSub}`;
  let best4 = -1, best12 = -1;
  for (let i = 0; i < numSub; i++) {
    const rec = base + 4 + i * 8;
    const platform = u16(b, rec);
    const encoding = u16(b, rec + 2);
    const off = u32(b, rec + 4);
    const fmt = u16(b, base + off);
    const unicodeish = (platform === 3 && (encoding === 1 || encoding === 10)) || platform === 0;
    if (!unicodeish) continue;
    if (fmt === 4 && best4 < 0) best4 = base + off;
    if (fmt === 12 && best12 < 0) best12 = base + off;
  }
  if (best12 >= 0) {
    const e = parseCmap12(b, best12, charToGlyph);
    if (e) return e;
  }
  if (best4 >= 0) {
    const e = parseCmap4(b, best4, charToGlyph);
    if (e) return e;
  }
  if (charToGlyph.size === 0) return 'no-unicode-subtable';
  return null;
}

function parseCmap4(b, off, charToGlyph) {
  if (off + 14 > b.length) return 'fmt4-truncated';
  const segCountX2 = u16(b, off + 6);
  const segCount = segCountX2 / 2;
  if (segCount === 0 || segCount > MAX_SEGMENTS) return `fmt4-bad-segcount:${segCount}`;
  const endBase = off + 14;
  const startBase = endBase + segCountX2 + 2;
  const deltaBase = startBase + segCountX2;
  const rangeBase = deltaBase + segCountX2;
  if (rangeBase + segCountX2 > b.length) return 'fmt4-truncated-tables';
  for (let i = 0; i < segCount; i++) {
    const end = u16(b, endBase + i * 2);
    const start = u16(b, startBase + i * 2);
    const delta = s16(b, deltaBase + i * 2);
    const rangeOff = u16(b, rangeBase + i * 2);
    if (start > end) continue;
    if (end - start > 0xFFFF) continue; // הגנה
    for (let c = start; c <= end; c++) {
      let gid;
      if (rangeOff === 0) {
        gid = (c + delta) & 0xFFFF;
      } else {
        const gidPos = rangeBase + i * 2 + rangeOff + (c - start) * 2;
        if (gidPos + 2 > b.length) return 'fmt4-gid-out-of-range';
        gid = u16(b, gidPos);
        if (gid !== 0) gid = (gid + delta) & 0xFFFF;
      }
      if (gid !== 0 && !charToGlyph.has(c)) charToGlyph.set(c, gid);
    }
  }
  return null;
}

function parseCmap12(b, off, charToGlyph) {
  if (off + 16 > b.length) return 'fmt12-truncated';
  const nGroups = u32(b, off + 12);
  if (nGroups > 65536) return `fmt12-bad-groups:${nGroups}`;
  for (let i = 0; i < nGroups; i++) {
    const rec = off + 16 + i * 12;
    if (rec + 12 > b.length) return 'fmt12-truncated-groups';
    const start = u32(b, rec), end = u32(b, rec + 4), gid = u32(b, rec + 8);
    if (end < start || end - start > 0x10FFFF) continue;
    for (let c = start; c <= end; c++) {
      const g = gid + (c - start);
      if (g !== 0 && !charToGlyph.has(c)) charToGlyph.set(c, g);
    }
  }
  return null;
}

/** kern table — מטפל רק בפורמט 0 (subtable version 0); שאר הפורמטים נדלגים בשקיפות. */
function parseKernFmt0(b, off, len, kernPairs) {
  if (off + 4 > b.length) return;
  const nTables = u16(b, off + 2);
  let p = off + 4;
  for (let i = 0; i < nTables && p + 6 <= b.length; i++) {
    const version = u16(b, p);
    const length = u16(b, p + 2);
    const coverage = u16(b, p + 4);
    const format = coverage >> 8;
    if (format === 0 && version === 0 && p + 14 <= b.length) {
      const nPairs = u16(b, p + 6);
      if (nPairs <= MAX_GPOS_PAIRSETS) {
        for (let k = 0; k < nPairs; k++) {
          const rec = p + 14 + k * 6;
          if (rec + 6 > b.length || rec >= off + len) break;
          const left = u16(b, rec), right = u16(b, rec + 2), value = s16(b, rec + 4);
          if (value !== 0) kernPairs.set(`${left},${right}`, value);
        }
      }
    }
    if (length === 0) break;
    p += length;
  }
}

/**
 * GPOS (v1.0) — נתיב מינימלי אמין: LookupList → Lookup type 2 (PairPos) format 1,
 * ValueFormat1=XAdvance בלבד (0x0004), Coverage fmt 1/2. שאר הסוגים נדלגים בשקיפות
 * (רשומים בדגל). זה מכסה את משפחת הקרנינג הסטנדרטית (GSUB לא נדרש למדידת רוחב).
 */
function parseGposPairPos(b, off, len, kernPairs) {
  if (off + 10 > b.length) return;
  const ver = u32(b, off);
  if (ver !== 0x00010000) return;
  const lookupListOff = u16(b, off + 8);
  const ll = off + lookupListOff;
  if (ll + 2 > b.length) return;
  const lookups = u16(b, ll);
  if (lookups > 256) return;
  for (let i = 0; i < lookups; i++) {
    const lOff = ll + u16(b, ll + 2 + i * 2);
    if (lOff + 8 > b.length) continue;
    const type = u16(b, lOff);
    if (type !== 2) continue; // PairPos בלבד
    const subCount = u16(b, lOff + 4);
    if (subCount > 64) continue;
    for (let s = 0; s < subCount; s++) {
      const sOff = lOff + u16(b, lOff + 6 + s * 2);
      parsePairPosSubtable(b, sOff, kernPairs);
    }
  }
}

function parsePairPosSubtable(b, off, kernPairs) {
  if (off + 10 > b.length) return;
  const fmt = u16(b, off);
  if (fmt !== 1) return; // format 2 (matrix) — נדלג (נדיר בקרנינג לטיני/עברי)
  const covOff = u16(b, off + 2);
  const vf1 = u16(b, off + 4);
  const vf2 = u16(b, off + 6);
  const setCount = u16(b, off + 8);
  if (setCount > MAX_GPOS_PAIRSETS) return;
  if (vf1 !== 0x0004 || vf2 !== 0) return; // XAdvance בלבד — חוזה הקרנינג שלנו
  const covGids = coverageGlyphs(b, off + covOff);
  if (!covGids) return;
  for (let i = 0; i < setCount && i < covGids.length; i++) {
    const left = covGids[i];
    const psOff = off + u16(b, off + 10 + i * 2);
    if (psOff + 2 > b.length) continue;
    const pvCount = u16(b, psOff);
    if (pvCount > MAX_GPOS_PAIRSETS) continue;
    for (let k = 0; k < pvCount; k++) {
      const rec = psOff + 2 + k * 6; // gid2(2) + value1 XAdvance(2) + value2(2 — ריק כי vf2=0)
      if (rec + 6 > b.length) break;
      const right = u16(b, rec);
      const xAdv = s16(b, rec + 2);
      if (xAdv !== 0) kernPairs.set(`${left},${right}`, xAdv);
    }
  }
}

/** Coverage table fmt 1/2 → מערך gid-ים לפי אינדקס. */
function coverageGlyphs(b, off) {
  if (off + 4 > b.length) return null;
  const fmt = u16(b, off);
  const out = [];
  if (fmt === 1) {
    const count = u16(b, off + 2);
    if (count > MAX_GPOS_PAIRSETS) return null;
    for (let i = 0; i < count; i++) {
      if (off + 4 + i * 2 + 2 > b.length) return null;
      out.push(u16(b, off + 4 + i * 2));
    }
    return out;
  }
  if (fmt === 2) {
    const ranges = u16(b, off + 2);
    if (ranges > 4096) return null;
    for (let i = 0; i < ranges; i++) {
      const rec = off + 4 + i * 6;
      if (rec + 6 > b.length) return null;
      const start = u16(b, rec), end = u16(b, rec + 2), startCov = u16(b, rec + 4);
      if (end < start || end - start > 0xFFFF) continue;
      for (let g = start; g <= end; g++) out[g - start + startCov] = g;
    }
    // מלא חורים (undefined) ב־-1 — סימון לא־קיים
    for (let i = 0; i < out.length; i++) if (out[i] === undefined) out[i] = -1;
    return out;
  }
  return null;
}

// ============ שכבת שאילתות (המידע שמעניין את המדידה) ============

/** **S4.26:** גופן ה-fallback לגליפים חסרים — כמו מחסנית ה-CSS בדפדפן. */
let missingGlyphFallbackFont = null;
function setMissingGlyphFallbackFont(font) { missingGlyphFallbackFont = font || null; }

/** **S4.26:** רוחב-גליף-חסר בגופן ה-fallback (em) — 0 אם אין fallback/גם בו חסר. */
function missingGlyphFallbackEm(ch) {
  if (!missingGlyphFallbackFont) return 0;
  return advanceEmOf(missingGlyphFallbackFont, ch);
}

/** מזהה גליף של תו (או 0 = .notdef). */
function glyphIdOf(font, ch) {
  const cp = typeof ch === 'number' ? ch : ch.codePointAt(0);
  const g = font.charToGlyph.get(cp);
  return g === undefined ? 0 : g;
}

/** רוחב advance ביחידות גופן (0 ללא מיפוי). */
function advanceUnitsOf(font, ch) {
  const g = glyphIdOf(font, ch);
  if (g === 0 || g >= font.numGlyphs) {
    // **S4.26 (גליפים חסרים — fallback כמו הדפדפן):** לגופנים תורניים
    // (למשל גוטמן רש"י) אין גליפים לפיסוק בסיסי (' . ׳) — הדפדפן מצייר
    // אותם במשפחת ה-fallback שבמחסנית ('Frank Ruhl Libre'); המדידה
    // בלי זה החזירה 0 ושורות ממורכזות נבדקו צרות מהרינדור (נצפה:
    // INK_OUTSIDE 3px בשורת "הרי בהכרח שהם גדרים... וכו'."). המרה
    // ליחידות הגופן הראשי משמרת את היחס הנכון בשרשרת.
    if (missingGlyphFallbackFont && missingGlyphFallbackFont !== font) {
      const em = advanceEmOf(missingGlyphFallbackFont, ch);
      if (em > 0) return em * font.unitsPerEm;
    }
    return 0;
  }
  return font.advanceUnits[g];
}

/** רוחב advance ב־em (יחסי ל־unitsPerEm). */
function advanceEmOf(font, ch) {
  return advanceUnitsOf(font, ch) / font.unitsPerEm;
}

/** קרנינג בין שני תווים ביחידות גופן (0 כשאין ערך/מיפוי). */
function kernUnitsOf(font, a, b) {
  const ga = glyphIdOf(font, a), gb = glyphIdOf(font, b);
  if (ga === 0 || gb === 0) return 0;
  const v = font.kernPairs.get(`${ga},${gb}`);
  return v === undefined ? 0 : v;
}

/** cap-height ב־em (מטבלת OS/2 אמיתית; נפילה: ascender×0.7 — קירוב ספרות מוכר). */
function capHeightEmOf(font) {
  if (font.capHeight != null) return font.capHeight / font.unitsPerEm;
  return (font.ascender / font.unitsPerEm) * 0.7;
}

/** האם תו הוא סימן מאפס־רוחב (ניקוד/טעמים): ממופה עם advance=0. */
function isZeroAdvanceMark(font, ch) {
  const g = glyphIdOf(font, ch);
  return g !== 0 && font.advanceUnits[g] === 0;
}

module.exports = {
  parseFont, glyphIdOf, advanceUnitsOf, advanceEmOf, kernUnitsOf,
  capHeightEmOf, isZeroAdvanceMark, setMissingGlyphFallbackFont, missingGlyphFallbackEm
};
