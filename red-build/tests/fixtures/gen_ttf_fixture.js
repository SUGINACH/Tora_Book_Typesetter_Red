#!/usr/bin/env node
// tests/fixtures/gen_ttf_fixture.js — בונה גופן TrueType מינימלי תקני עם ערכי אמת ידועים (S12)
'use strict';

/**
 * גופן סינתטי בקנה אחד עם טבלת הרוחבים המכוילת של המנוע (unitsPerEm=1000,
 * advance = ערך_טבלה × 1000 — שלמים מדויקים) + זוג קרנינג אחד + גליף ריק
 * לכל תו (glyf length 0 — חוקי; לא נועד לתצוגה אלא למדידה/פרנסר).
 *
 * מטרה: בדיקת הפרנסר מול אמת מוחלטת שאנחנו קובעים (לא קריאה עצמית־מעצמה):
 * כל טעות בפרנסינג — סדר בתים, חיתוך cmap, סקאלת unitsPerEm, קרנינג — תיתפס.
 */

const { HEBREW_WIDTHS, WIDE_MARKS } = require('../../src/engine/typography/measure-table');

// תווי הקורפוס: אותיות עבריות + סימנים + ספרות/לטיניות בסיסיות
function corpusChars() {
  const set = new Set();
  for (const ch of Object.keys(HEBREW_WIDTHS)) set.add(ch);
  for (const ch of Object.keys(WIDE_MARKS)) set.add(ch);
  for (let c = 0x30; c <= 0x39; c++) set.add(String.fromCharCode(c)); // ספרות
  for (let c = 0x41; c <= 0x5A; c++) set.add(String.fromCharCode(c)); // A-Z
  for (let c = 0x61; c <= 0x7A; c++) set.add(String.fromCharCode(c)); // a-z
  set.add('ְ'); set.add('ִ'); // ניקוד מאפס־רוחב (sheva, hirik) — advance=0 בפיקסטשור
  return [...set].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
}

/** רוחב (units) לפי טבלת המנוע — שלם מדויק (×1000). ניקוד ⇒ 0. */
function advanceUnitsFor(ch) {
  if (ch === 'ְ' || ch === 'ִ') return 0;
  if (HEBREW_WIDTHS[ch] !== undefined) return Math.round(HEBREW_WIDTHS[ch] * 1000);
  if (WIDE_MARKS[ch] !== undefined) return Math.round(WIDE_MARKS[ch] * 1000);
  if (/[A-Za-z0-9]/.test(ch)) return 520;
  return 400;
}

// ---- בינארי ----
function u16(v) { return [(v >> 8) & 0xFF, v & 0xFF]; }
function s16(v) { return u16(v < 0 ? v + 0x10000 : v); }
function u32(v) { return [(v >>> 24) & 0xFF, (v >>> 16) & 0xFF, (v >>> 8) & 0xFF, v & 0xFF]; }
function str4(s) { return [s.charCodeAt(0), s.charCodeAt(1), s.charCodeAt(2), s.charCodeAt(3)]; }

/**
 * בונה TTF מינימלי תקני: head, hhea, maxp, hmtx, cmap(fmt4), glyf, loca, OS/2, name, post.
 * glyph 0 = .notdef; glyph 1..n = תווי הקורפוס (לפי סדר codepoint).
 * @param {{kern?:boolean}} [opts] — kern:false משמט את צמד הקרנינג (לבדיקת שקילות A↔B:
 *   impl B מודד קרנינג וimpl A (טבלה) לא — פיקסטשור עם kern אינו שקול מדידה).
 * @returns {{bytes:Buffer, groundTruth:{unitsPerEm, advances:Object, kernPair:[string,string,number], capHeight:number}}}
 */
function buildTtfFixture(opts = {}) {
  const withKern = opts.kern !== false;
  const chars = corpusChars();
  const unitsPerEm = 1000;
  const nGlyphs = chars.length + 1; // + .notdef
  const gidOf = new Map(chars.map((ch, i) => [ch, i + 1]));

  // קרנינג לדוגמה: א+ב = −40 units (−0.04em)
  const KERN_VALUE = -40;
  const kernPair = ['א', 'ב', KERN_VALUE];

  const capHeightUnits = 700; // OS/2 v2 sCapHeight

  // ---- head (54 bytes) — פריסה מפורשת לפי חוזה הטבלה ----
  const put16On = (arr, off, v) => { const a = v < 0 ? v + 0x10000 : v; arr[off] = (a >> 8) & 0xFF; arr[off + 1] = a & 0xFF; };
  const put32On = (arr, off, v) => { arr[off] = (v >>> 24) & 0xFF; arr[off + 1] = (v >>> 16) & 0xFF; arr[off + 2] = (v >>> 8) & 0xFF; arr[off + 3] = v & 0xFF; };
  const head = new Array(54).fill(0);
  put32On(head, 0, 0x00010000);   // version
  put32On(head, 4, 0x00010000);   // fontRevision
  put32On(head, 8, 0);            // checkSumAdjustment
  put32On(head, 12, 0x5F0F3CF5);  // magicNumber
  put16On(head, 16, 0);           // flags
  put16On(head, 18, unitsPerEm);  // unitsPerEm @18
  // 20..35: created/modified (LONGDATETIME ×2) — אפסים
  put16On(head, 36, 0); put16On(head, 38, 0); put16On(head, 40, 1000); put16On(head, 42, 1000); // xMin yMin xMax yMax
  put16On(head, 44, 0);           // macStyle
  put16On(head, 46, 8);           // lowestRecPPEM
  put16On(head, 48, 0);           // fontDirectionHint
  put16On(head, 50, 0);           // indexToLocFormat = 0 (short)
  put16On(head, 52, 0);           // glyphDataFormat

  // ---- hhea (36 bytes) — פריסה מפורשת ----
  const hhea = new Array(36).fill(0);
  put32On(hhea, 0, 0x00010000);   // version
  put16On(hhea, 4, 800);          // ascender
  put16On(hhea, 6, -200);         // descender
  put16On(hhea, 8, 0);            // lineGap
  put16On(hhea, 10, 500);         // advanceWidthMax
  put16On(hhea, 34, nGlyphs);     // numberOfHMetrics @34

  // ---- maxp (32 bytes) ----
  const maxp = [...u32(0x00010000), ...u16(nGlyphs)];
  while (maxp.length < 32) maxp.push(0);

  // ---- hmtx: (advance, lsb) לכל גליף ----
  const hmtx = [];
  hmtx.push(...u16(500), ...s16(0)); // .notdef
  for (const ch of chars) { hmtx.push(...u16(advanceUnitsFor(ch)), ...s16(0)); }

  // ---- cmap: fmt4 subtable אחד (platform 3 encoding 1) — קטעים רציפים + קטע שמור 0xFFFF ----
  const segments = [];
  let segStart = 0;
  for (let i = 1; i <= chars.length; i++) {
    const prev = chars[i - 1].codePointAt(0);
    const cur = i < chars.length ? chars[i].codePointAt(0) : null;
    if (cur === null || cur !== prev + 1) {
      segments.push({ start: chars[segStart].codePointAt(0), end: prev, firstIdx: segStart + 1 });
      segStart = i;
    }
  }
  const segCount = segments.length + 1; // + קטע שמור 0xFFFF (חוזה fmt4)
  const endCodes = [...segments.map(s => s.end), 0xFFFF];
  const startCodes = [...segments.map(s => s.start), 0xFFFF];
  const deltas = [...segments.map(s => s.firstIdx - s.start), 1]; // gid = cp + delta (reserved: 0xFFFF+1→0)
  const rangeOffs = new Array(segCount).fill(0);
  const sub4Len = 16 + segCount * 8;
  const pow2 = Math.pow(2, Math.floor(Math.log2(segCount)));
  const sub4 = [
    ...u16(4), ...u16(sub4Len), ...u16(0),
    ...u16(segCount * 2),
    ...u16(2 * pow2),        // searchRange
    ...u16(Math.floor(Math.log2(segCount))), // entrySelector
    ...u16(2 * segCount - 2 * pow2), // rangeShift
    ...endCodes.flatMap(u16),
    ...u16(0), // reservedPad
    ...startCodes.flatMap(u16),
    ...deltas.flatMap(s16),
    ...rangeOffs.flatMap(u16)
  ];
  if (sub4.length !== sub4Len) throw new Error(`fmt4 length mismatch: ${sub4.length} != ${sub4Len}`);
  const cmap = [
    ...u16(0), ...u16(1), ...u16(3), ...u16(1), ...u32(12),
    ...sub4
  ];

  // ---- glyf/loca: גליפים ריקים (length 0) ----
  const glyf = new Array(0); // ריק לגמרי — כל הגליפים באורך 0
  const loca = [];
  for (let i = 0; i <= nGlyphs; i++) loca.push(...u16(0)); // short loca: offset/2 — הכל 0

  // ---- kern (fmt 0): זוג אחד — אלא אם opts.kern:false (תת-טבלה עם 0 צמדים) ----
  const nPairs = withKern ? 1 : 0;
  const subLen = 14 + (withKern ? 6 : 0);
  const kernSub = [
    ...u16(0), ...u16(subLen), ...u16(1), // version, length, coverage (format 0, horizontal)
    ...u16(nPairs), ...u16(0), ...u16(0), // nPairs, searchRange, entrySelector
    ...u16(0),                          // rangeShift
    ...(withKern ? [...u16(gidOf.get('א')), ...u16(gidOf.get('ב')), ...s16(KERN_VALUE)] : [])
  ];
  const kern = [
    ...u16(0), ...u16(1), // version, nTables
    ...kernSub
  ];

  // ---- OS/2 (v2, 96 bytes) — פריסה מפורשת; מאומת מול גופן אמיתי (sCapHeight@88) ----
  const os2 = new Array(96).fill(0);
  put16On(os2, 0, 2);              // version 2 (יש sCapHeight)
  put16On(os2, 2, 600);            // xAvgCharWidth
  put16On(os2, 88, capHeightUnits); // sCapHeight @88 (חוזה OS/2 v2)

  // ---- name + post (מינימליים; חוקיים לקוראים) ----
  const name = [...u16(0), ...u16(0), ...u16(6)]; // no name records
  const post = [...u32(0x00030000), ...u32(0), ...u16(0), ...u16(0), ...s16(0), ...s16(0), ...s16(0), ...s16(0), ...u32(0), ...u32(0), ...u32(0), ...u32(0), ...u32(0)];

  const tables = [
    ['OS/2', Buffer.from(os2)],
    ['cmap', Buffer.from(cmap)],
    ['glyf', Buffer.from(glyf)],
    ['head', Buffer.from(head)],
    ['hhea', Buffer.from(hhea)],
    ['hmtx', Buffer.from(hmtx)],
    ['kern', Buffer.from(kern)],
    ['loca', Buffer.from(loca)],
    ['maxp', Buffer.from(maxp)],
    ['name', Buffer.from(name)],
    ['post', Buffer.from(post)]
  ];

  // ---- sfnt assembly ----
  const n = tables.length;
  const dirLen = 12 + n * 16;
  let off = dirLen;
  const entries = tables.map(([tagStr, data]) => {
    const entry = { tagStr, offset: off, length: data.length, data };
    off += data.length;
    if (off & 3) off += 4 - (off & 3); // align 4
    return entry;
  });
  const out = [];
  out.push(...u32(0x00010000), ...u16(n), ...u16(16 * n), ...u16(0), ...u16(0));
  for (const e of entries) {
    // רשומת ספרייה = 16 בתים בדיוק: tag(4) + checksum(4) + offset(4) + length(4)
    out.push(...str4(e.tagStr), ...u32(0), ...u32(e.offset), ...u32(e.length));
  }
  for (const e of entries) {
    out.push(...e.data);
    while (out.length & 3) out.push(0);
  }
  const bytes = Buffer.from(out);

  const groundTruth = {
    unitsPerEm,
    numGlyphs: nGlyphs,
    advances: Object.fromEntries(chars.map(ch => [ch, advanceUnitsFor(ch)])),
    kernPair, capHeight: capHeightUnits,
    ascent: 800, descent: -200,
    chars
  };
  return { bytes, groundTruth };
}

if (require.main === module) {
  const { bytes, groundTruth } = buildTtfFixture();
  const fs = require('fs');
  const out = process.argv[2] || __dirname + '/metrics-fixture.ttf';
  fs.writeFileSync(out, bytes);
  console.log(`ttf fixture written: ${out} (${bytes.length} bytes, ${groundTruth.numGlyphs} glyphs, ${groundTruth.chars.length} chars)`);
}

module.exports = { buildTtfFixture, corpusChars, advanceUnitsFor };
