// src/engine/import/zip-reader.js — קורא ZIP ללא תלות חיצונית (S11.1-3, DOCX import)
'use strict';

/**
 * קורא ZIP מינימלי לייבוא DOCX: פורמט STORE(0) + DEFLATE(8).
 * **סביבת-אגנוסטית (תיקון 03.11 — "Buffer is not defined" בדפדפן):** אין כל
 * שימוש ב-Buffer/שיטותיו — Uint8Array טהור + פונקציות עזר פרטיות (u16le/u32le/
 * utf8Decode). עובד זהה ב-Node (Buffer הוא sub-class של Uint8Array) ובדפדפן.
 * node:zlib (מובנה, לא תלות חיצונית) משמש כשקיים; אחרת המנפח הטהור להלן.
 * **אבטחה (S13 pass):**
 *  - path traversal: שמות רשומות עם ../ או / אבסולוטי או בריחת תחילית — נדחים
 *    ברשימה (denied) ולא נפתחים לעולם;
 *  - החזרת רשומות מנורמלות בלבד (שמות יחסיים נקיים);
 *  - אין eval; אין כתיבה לדיסק — הכל בזיכרון.
 */

// ---------- עזרי בתים ללא Buffer (זהה לפלט readUInt16LE/readUInt32LE) ----------
function u16le(b, o) { return b[o] | (b[o + 1] << 8); }
function u32le(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
function u8sub(b, s, e) { return b.subarray ? b.subarray(s, e) : b.slice(s, e); }

/** פענוח UTF-8 טהור (TextDecoder כשקיים — אחרת מימוש ידני; תואם Buffer.toString('utf8')). */
function utf8Decode(bytes) {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(bytes);
  let s = '';
  for (let i = 0; i < bytes.length;) {
    const c = bytes[i];
    if (c < 0x80) { s += String.fromCharCode(c); i++; }
    else if (c < 0xe0) { s += String.fromCharCode(((c & 0x1f) << 6) | (bytes[i + 1] & 0x3f)); i += 2; }
    else if (c < 0xf0) { s += String.fromCharCode(((c & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)); i += 3; }
    else {
      const cp = ((c & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
      const off = cp - 0x10000;
      s += String.fromCharCode(0xd800 + (off >> 10), 0xdc00 + (off & 0x3ff));
      i += 4;
    }
  }
  return s;
}

const zlib = (() => {
  try { return require('zlib'); } catch (e) { return null; } // בדפדפן אין zlib — מנפח טהור
})();

// =====================================================================
// מנפח raw-DEFLATE טהור (BTYPE 00/01/10) — גיבוי לסביבות בלי zlib (דפדפן).
// אותו פלט כמו zlib.inflateRawSync; מבחן השקילות בבדיקות S11 (both-paths).
// =====================================================================
class BitReader {
  constructor(buf, startByte) {
    this.buf = buf; this.pos = startByte << 3; this.bit = 0; // מספרי ביט מוחלטים
  }
  read(count) {
    let v = 0;
    for (let i = 0; i < count; i++) {
      const byteIdx = this.pos >> 3;
      if (byteIdx >= this.buf.length) throw new Error('deflate: out-of-input');
      const bit = (this.buf[byteIdx] >> (this.pos & 7)) & 1;
      v |= bit << i;
      this.pos++;
    }
    return v;
  }
  alignByte() { this.pos = (this.pos + 7) & ~7; }
}

function buildHuffman(lengths) {
  // קודי canonical Huffman לפי טבלאות אורך (DEFLATE spec 3.2.2)
  const maxLen = 15;
  const counts = new Array(maxLen + 1).fill(0);
  for (const l of lengths) counts[l]++;
  counts[0] = 0;
  const next = new Array(maxLen + 2).fill(0);
  let code = 0;
  for (let b = 1; b <= maxLen; b++) { code = (code + counts[b - 1]) << 1; next[b] = code; }
  const map = new Map();
  for (let sym = 0; sym < lengths.length; sym++) {
    const l = lengths[sym];
    if (l === 0) continue;
    const c = next[l]++;
    map.set((c << 4) | l, sym); // מפתח: code<<4|len — פענוח לפי סדר עולה
  }
  return { map, counts, lengths };
}

function decodeSymbol(br, huff) {
  // קריאה ביט־ביט־ביט ובניית קוד — ללא טבלה הפוכה (פשוט ונכון; קלטים קטנים)
  let code = 0, len = 0;
  for (;;) {
    code = (code << 1) | br.read(1);
    len++;
    if (len > 15) throw new Error('deflate: bad-code');
    const sym = huff.map.get((code << 4) | len);
    if (sym !== undefined) return sym;
  }
}

const LEN_BASE = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
const LEN_EXTRA = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
const DIST_BASE = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
const DIST_EXTRA = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

function fixedLitHuff() {
  const lengths = [];
  for (let i = 0; i < 144; i++) lengths.push(8);
  for (let i = 144; i < 256; i++) lengths.push(9);
  for (let i = 256; i < 280; i++) lengths.push(7);
  for (let i = 280; i < 288; i++) lengths.push(8);
  return buildHuffman(lengths);
}
function fixedDistHuff() { return buildHuffman(new Array(30).fill(5)); }

/** מנפח raw DEFLATE טהור. הפלט כולו במערך אחד עד הסוף (backref ≤32K תקין תמיד). @returns {Uint8Array} */
function inflateRawPure(buf, startByte = 0, expectedSize = -1) {
  const br = new BitReader(buf, startByte);
  const out = [];
  const pushByte = (b) => { out.push(b); };

  for (;;) {
    const final = br.read(1);
    const btype = br.read(2);
    if (btype === 0) {
      br.alignByte();
      const lenPos = br.pos >> 3;
      if (lenPos + 4 > buf.length) throw new Error('deflate: stored-header-oob');
      const len = buf[lenPos] | (buf[lenPos + 1] << 8);
      const nlen = buf[lenPos + 2] | (buf[lenPos + 3] << 8);
      if ((len ^ 0xFFFF) !== nlen) throw new Error('deflate: stored-nlen-mismatch');
      const dataStart = lenPos + 4;
      if (dataStart + len > buf.length) throw new Error('deflate: stored-oob');
      for (let i = 0; i < len; i++) pushByte(buf[dataStart + i]);
      br.pos = (dataStart + len) << 3;
    } else if (btype === 1 || btype === 2) {
      let litHuff, distHuff;
      if (btype === 1) {
        litHuff = fixedLitHuff(); distHuff = fixedDistHuff();
      } else {
        const hlit = br.read(5) + 257;
        const hdist = br.read(5) + 1;
        const hclen = br.read(4) + 4;
        const ORDER = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
        const clLengths = new Array(19).fill(0);
        for (let i = 0; i < hclen; i++) clLengths[ORDER[i]] = br.read(3);
        const clHuff = buildHuffman(clLengths);
        const lengths = [];
        let prev = 0;
        const total = hlit + hdist;
        while (lengths.length < total) {
          const sym = decodeSymbol(br, clHuff);
          if (sym < 16) { lengths.push(sym); prev = sym; }
          else if (sym === 16) { const rep = 3 + br.read(2); for (let i = 0; i < rep && lengths.length < total; i++) lengths.push(prev); }
          else if (sym === 17) { const rep = 3 + br.read(3); for (let i = 0; i < rep && lengths.length < total; i++) lengths.push(0); prev = 0; }
          else { const rep = 11 + br.read(7); for (let i = 0; i < rep && lengths.length < total; i++) lengths.push(0); prev = 0; }
        }
        litHuff = buildHuffman(lengths.slice(0, hlit));
        distHuff = buildHuffman(lengths.slice(hlit));
      }
      // פענוח סמלים (LZ77: backref עד 32K לאחור — תקין תמיד במערך היחיד)
      for (;;) {
        const sym = decodeSymbol(br, litHuff);
        if (sym < 256) {
          pushByte(sym);
        } else if (sym === 256) {
          break;
        } else {
          const li = sym - 257;
          if (li >= LEN_BASE.length) throw new Error('deflate: bad-length-symbol');
          const len = LEN_BASE[li] + (LEN_EXTRA[li] ? br.read(LEN_EXTRA[li]) : 0);
          const dsym = decodeSymbol(br, distHuff);
          if (dsym >= DIST_BASE.length) throw new Error('deflate: bad-dist-symbol');
          const dist = DIST_BASE[dsym] + (DIST_EXTRA[dsym] ? br.read(DIST_EXTRA[dsym]) : 0);
          if (dist > out.length) throw new Error('deflate: dist-too-far');
          const srcPos = out.length - dist;
          for (let i = 0; i < len; i++) pushByte(out[srcPos + i]);
        }
      }
    } else {
      throw new Error('deflate: bad-btype');
    }
    if (final) break;
    if (expectedSize >= 0 && out.length >= expectedSize) break;
  }
  return Uint8Array.from(out);
}

/** מנפח: zlib אם קיים (Node), אחרת המנפח הטהור (דפדפן). @returns {Uint8Array} */
function inflateRaw(data) {
  if (zlib) {
    const out = zlib.inflateRawSync(data); // Node: מחזיר Buffer (Uint8Array) — זהה פונקציונלית
    return out;
  }
  return inflateRawPure(data, 0, -1);
}

/** CRC32 של ZIP — לאימות שלמות רשומות (optional check; לא חוסם). */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/** נורמליזציה + מדיניות שמות: רק נתיבים יחסיים פנימיים. */
function safeName(raw) {
  const name = String(raw || '').replace(/\\/g, '/');
  if (!name || name.endsWith('/')) return null;      // תיקייה
  if (name.startsWith('/')) return null;              // אבסולוטי
  const parts = name.split('/');
  if (parts.some(p => p === '..')) return null;       // traversal
  if (/^[a-zA-Z]:/.test(name)) return null;           // כונן
  if (/[<>:"|?*\u0000]/.test(name)) return null;      // תווים אסורים
  return name;
}

/**
 * פתיחת ארכיון ZIP מזיכרון — **ללא Buffer** (דפדפן ו-Node כאחד; תיקון 03.11).
 * @param {Buffer|Uint8Array} bytes
 * @returns {{ok:boolean, entries:Array<{name:string, data:Uint8Array, method:number, size:number}>, denied:Array<string>, error:string|null}}
 */
function readZip(bytes) {
  const buf = bytes; // Buffer (Node) הוא Uint8Array — אינדוקסציה זהה; שום דבר לא נדרש כאן
  const denied = [];
  const entries = [];
  // מציאת EOCD (End Of Central Directory) — מהסוף, חתימה 0x06054b50
  let eocd = -1;
  const minLen = 22;
  for (let i = buf.length - minLen; i >= Math.max(0, buf.length - minLen - 65536); i--) {
    if (u32le(buf, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return { ok: false, entries: [], denied: [], error: 'not-a-zip' };
  const totalEntries = u16le(buf, eocd + 10);
  const cdOffset = u32le(buf, eocd + 16);

  let p = cdOffset;
  for (let n = 0; n < totalEntries; n++) {
    if (p + 46 > buf.length || u32le(buf, p) !== 0x02014b50) {
      return { ok: false, entries, denied, error: `bad-central-directory@${n}` };
    }
    const method = u16le(buf, p + 10);
    const compSize = u32le(buf, p + 20);
    const nameLen = u16le(buf, p + 28);
    const extraLen = u16le(buf, p + 30);
    const commentLen = u16le(buf, p + 32);
    const localOffset = u32le(buf, p + 42);
    const rawName = utf8Decode(u8sub(buf, p + 46, p + 46 + nameLen));
    const name = safeName(rawName);
    if (name == null) { denied.push(rawName); p += 46 + nameLen + extraLen + commentLen; continue; }

    // קריאת ה-local header והנתונים
    if (localOffset + 30 > buf.length || u32le(buf, localOffset) !== 0x04034b50) {
      return { ok: false, entries, denied, error: `bad-local-header:${name}` };
    }
    const lhNameLen = u16le(buf, localOffset + 26);
    const lhExtraLen = u16le(buf, localOffset + 28);
    const dataStart = localOffset + 30 + lhNameLen + lhExtraLen;
    // **S6.0 (R9 — קריאה קטועה בשקט):** compSize עלול לחרוג מהקובץ
    // (ZIP קטוע/פגום) — subarray קוצץ בשקט והרשומה הוחזרה חלקית כתקינה.
    if (dataStart + compSize > buf.length) {
      return { ok: false, entries, denied, error: `truncated-entry:${name}` };
    }
    const raw = u8sub(buf, dataStart, dataStart + compSize);
    let data;
    try {
      if (method === 0) data = Uint8Array.from(raw);
      else if (method === 8) data = inflateRaw(raw);
      else return { ok: false, entries, denied, error: `unsupported-method:${method}:${name}` };
    } catch (e) {
      return { ok: false, entries, denied, error: `inflate-failed:${name}` };
    }
    // **S6.0 (R9 — פצצת ZIP):** תקרת פריסה לרשומה (64MB) — מנע הקפאת
    // לשונית של 42KB→4GB; ו-CRC מהמדריך המרכזי נשמר לאימות (verifyCrc
    // היה מת — storedCrc מעולם לא אוכלס).
    if (data.length > 64 * 1024 * 1024) {
      return { ok: false, entries, denied, error: `entry-too-large:${name}` };
    }
    const entry = { name, data, method, size: data.length, storedCrc: u32le(buf, p + 16) };
    if (crc32(entry.data) !== entry.storedCrc) {
      return { ok: false, entries, denied, error: `crc-mismatch:${name}` };
    }
    entries.push(entry);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return { ok: true, entries, denied, error: null };
}

/** אימות CRC של רשומה (best-effort; מחזיר בוליאני). */
function verifyCrc(entry) {
  return crc32(entry.data) === entry.storedCrc;
}

module.exports = { readZip, safeName, crc32, verifyCrc, inflateRaw, inflateRawPure, utf8Decode };
