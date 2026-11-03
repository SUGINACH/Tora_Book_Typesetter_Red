// src/engine/output/zip-writer.js — כותב ZIP דטרמיניסטי (S12.1-4; שימוש גם ב־S11 לבדיקות DOCX)
'use strict';

/**
 * ZIP בשיטת STORE בלבד — **בתים זהים בין יצוא לייצוא** (modulo timestamps normalized):
 * חותמות זמן קבועות (DOS 1980-01-01 = 0x0021), אין מקורות אקראיים, סדר רשומות
 * קבוע. **אריזה מובנית (structured templating):** הרשומות מסופקות כרשימת
 * {name, data} — לא החלפות regex על מחרוזת (תקלת packer של Yellow נמנעת מראש).
 *
 * שמות: אימות safeName (עקבי עם zip-reader) — רשומה בלתי־חוקית זורקת מיד
 * (לא מושתקת): אין path traversal בחבילות שלנו.
 */

const { crc32, safeName } = require('../import/zip-reader');

const FIXED_DOS_TIME = 0x0021; // 00:00:00? — 1980-01-01 תקני: date=0x0021 (ינואר 1, 1980)
const FIXED_DOS_DATE = 0x0021;

/** רשומת ZIP בודדת (local header + data). */
function localEntry(name, data) {
  const nameBuf = Buffer.from(name, 'utf8');
  const crc = crc32(data);
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50, 0);   // signature
  head.writeUInt16LE(20, 4);           // version needed
  head.writeUInt16LE(0, 6);            // flags
  head.writeUInt16LE(0, 8);            // method: STORE
  head.writeUInt16LE(FIXED_DOS_TIME, 10);
  head.writeUInt16LE(FIXED_DOS_DATE, 12);
  head.writeUInt32LE(crc >>> 0, 14);
  head.writeUInt32LE(data.length, 18); // comp size == size (STORE)
  head.writeUInt32LE(data.length, 22);
  head.writeUInt16LE(nameBuf.length, 26);
  head.writeUInt16LE(0, 28);           // extra len
  return Buffer.concat([head, nameBuf, data]);
}

/** רשומת central-directory בודדת. */
function centralEntry(name, data, localOffset) {
  const nameBuf = Buffer.from(name, 'utf8');
  const crc = crc32(data);
  const head = Buffer.alloc(46);
  head.writeUInt32LE(0x02014b50, 0);
  head.writeUInt16LE(20, 4);           // version made by
  head.writeUInt16LE(20, 6);           // version needed
  head.writeUInt16LE(0, 8);            // flags
  head.writeUInt16LE(0, 10);           // method STORE
  head.writeUInt16LE(FIXED_DOS_TIME, 12);
  head.writeUInt16LE(FIXED_DOS_DATE, 14);
  head.writeUInt32LE(crc >>> 0, 16);
  head.writeUInt32LE(data.length, 20);
  head.writeUInt32LE(data.length, 24);
  head.writeUInt16LE(nameBuf.length, 28);
  head.writeUInt16LE(0, 30);           // extra
  head.writeUInt16LE(0, 32);           // comment
  head.writeUInt16LE(0, 34);           // disk start
  head.writeUInt16LE(0, 36);           // internal attrs
  head.writeUInt32LE(0, 38);           // external attrs
  head.writeUInt32LE(localOffset, 42);
  return Buffer.concat([head, nameBuf]);
}

/**
 * בניית ארכיון מרשימת רשומות.
 * @param {Array<{name:string, data:Buffer|string}>} entries
 * @returns {Buffer}
 */
function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  const seen = new Set();
  for (const e of entries || []) {
    const name = safeName(e.name);
    if (name == null) throw new Error(`zip-writer: illegal entry name: ${JSON.stringify(e.name)}`);
    if (seen.has(name)) throw new Error(`zip-writer: duplicate entry name: ${name}`);
    seen.add(name);
    const data = Buffer.isBuffer(e.data) ? e.data : Buffer.from(String(e.data), 'utf8');
    const l = localEntry(name, data);
    locals.push(l);
    centrals.push(centralEntry(name, data, offset));
    offset += l.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);            // disk
  eocd.writeUInt16LE(0, 6);            // cd disk
  eocd.writeUInt16LE(centrals.length, 8);
  eocd.writeUInt16LE(centrals.length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(offset, 16);      // cd offset
  eocd.writeUInt16LE(0, 20);           // comment len
  return Buffer.concat([...locals, cd, eocd]);
}

module.exports = { buildZip };
