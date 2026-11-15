// src/ui/text-decode.js — פענוח קובץ טקסט מיובא בלי השחתה שקטה (סוכן 1, שלמות קלט)
'use strict';

/**
 * **הבעיה:** FileReader.readAsText(file, 'utf-8') מחליף בייטים לא־תקינים ב־U+FFFD בשקט. קובץ עברית בקידוד
 * Windows-1255 (ברירת המחדל "ANSI" של פנקס רשימות בעברית) הופך ל־"����" — והמנוע מעמד את הקלט הפגום
 * ומצהיר "שימור תוכן: שלם" (יחסית לקלט שכבר הושחת בייבוא).
 *
 * **הפתרון:** BOM ⇒ הקידוד המוצהר; אחרת UTF-8 קפדני (fatal); נכשל ⇒ Windows-1255. הפונקציה מדווחת
 * איזה קידוד נבחר, האם הייתה נפילה, וכמה תווי U+FFFD נותרו — כדי שה־UI יתריע במקום לשתוק.
 * טהור: בלי DOM ובלי מנוע (F-06).
 *
 * @param {Uint8Array|ArrayBuffer} input
 * @returns {{text:string, encoding:string, fallback:boolean, replacementChars:number}}
 */
function decodeTextBytes(input) {
  const u8 = input instanceof Uint8Array ? input : new Uint8Array(input || 0);
  const dec = (label, bytes, o) => new TextDecoder(label, o).decode(bytes);
  let text;
  let encoding;
  let fallback = false;
  if (u8.length >= 3 && u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF) {
    encoding = 'utf-8-bom';
    text = dec('utf-8', u8.subarray(3));
  } else if (u8.length >= 2 && u8[0] === 0xFF && u8[1] === 0xFE) {
    encoding = 'utf-16le';
    text = dec('utf-16le', u8.subarray(2));
  } else if (u8.length >= 2 && u8[0] === 0xFE && u8[1] === 0xFF) {
    encoding = 'utf-16be';
    text = dec('utf-16be', u8.subarray(2));
  } else {
    try {
      text = dec('utf-8', u8, { fatal: true });
      encoding = 'utf-8';
    } catch (e) {
      text = dec('windows-1255', u8);
      encoding = 'windows-1255';
      fallback = true;
    }
  }
  const replacementChars = (text.match(/\uFFFD/g) || []).length;
  return { text, encoding, fallback, replacementChars };
}

module.exports = { decodeTextBytes };
