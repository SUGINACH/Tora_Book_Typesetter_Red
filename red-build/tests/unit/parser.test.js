// tests/unit/parser.test.js — Gate S2: שכבת הפיענוח (REQ-PAR-01..05)
// נכתב מאפס לפי המפרט; כולל וקטורי "מטא־דאטה באמצע המסמך" (לקח Z.ai) וסוגריים מקוננים/חוצי גבול.
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const { lexDocument, HEADING_RE } = require('../../src/engine/parser/dfa-lexer');
const { scanBrackets } = require('../../src/engine/parser/bracket-scanner');
const { tokenize, contentHash, normalizeText } = require('../../src/engine/parser/block-tokenizer');

describe('REQ-PAR-01 metadata only in preamble', () => {
  it('preamble metadata is captured', () => {
    const doc = 'ספר - משלי\nנושא - דין סוכה\n\nכותרת 1 - פרק א\nטקסט רגיל.';
    const { metadata, bodyLines } = lexDocument(doc);
    assertEq(metadata['ספר'], 'משלי');
    assertEq(metadata['נושא'], 'דין סוכה');
    assert(bodyLines.some(l => l.includes('כותרת 1')), 'heading stays in body');
  });

  it('mid-document `נושא - ...` line remains a PARAGRAPH (Z.ai bug class)', () => {
    const doc = 'ספר - משלי\n\nכותרת 1 - פרק א\nנושא - דין סוכה ישנה באמצע המסמך\n';
    const { metadata, bodyLines } = lexDocument(doc);
    assert(!('נושא' in metadata), 'no metadata leak from body');
    const tokens = tokenize(bodyLines.filter(l => l.trim()));
    const metaLine = tokens.find(t => t.raw && t.raw.startsWith('נושא'));
    assert(metaLine && metaLine.type === 'paragraph', 'mid-doc key-like line is paragraph');
  });

  it('first heading exits preamble even without blank line', () => {
    const doc = 'ספר - משלי\nכותרת 2 - סימן א\nגוף';
    const { metadata, bodyLines } = lexDocument(doc);
    assertEq(metadata['ספר'], 'משלי');
    assert(HEADING_RE.test(bodyLines[0]), 'heading line goes to body');
  });

  it('non-metadata first line closes preamble quietly', () => {
    const doc = 'זו אינה מטא-שורה\nנושא - לא נאסף כי הפתיח נסגר\n';
    const { metadata } = lexDocument(doc);
    assertEq(Object.keys(metadata).length, 0);
  });

  // **S4.5 (ביקורת 03.11, סקירה 2):** טקסט ברירת המחדל האמיתי של IMUD_TORANI (app.js)
  // כ-fixture מחייב — בעבר שם הספר - לא זוהה, הפתיח נסגר, וכל שורות המטא ירדו לגוף.
  it('S4.5: טקסט ברירת המחדל המקורי — כל ששת שדות המטא מזוהים (fixture אמיתי)', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'imud_default_text.txt'), 'utf8');
    const { metadata, bodyLines } = lexDocument(src);
    assertEq(metadata['שם הספר'], 'ספר מלכי המלוכה', 'שם הספר (המזהה הארוך)');
    assertEq(metadata['נושא'], 'ביאורים וחידושים עמוקים על מסכתות הש"ס');
    assertEq(metadata['נושא מפורט'], 'בירור שיטות הראשונים והאחרונים ובירורי הלכות למעשה');
    assertEq(metadata['פרטי מהדורא'], 'מהדורה שניה ומורחבת בסייעתא דשמיא');
    assertEq(metadata['שם המחבר'], 'הצעיר ידידיה בר אבא הלוי');
    assertEq(metadata['מקום ושנת הוצאה'], 'ירושלים עיה"ק תובב"א שנת ה\'תשפ"ו');
    // שום שורת מטא לא דלפה לגוף:
    for (const key of ['שם הספר', 'נושא מפורט', 'פרטי מהדורא', 'שם המחבר', 'מקום ושנת הוצאה']) {
      assert(!bodyLines.some(l => l.trim().startsWith(key)), `השורה של ${key} לא בגוף`);
    }
    // H0–H7 מזוהים; הערת הסיום הרגילה = תוכן; הערת השוליים בתוחמים
    const tokens = tokenize(bodyLines.filter(l => l.trim()));
    const levels = tokens.filter(t => t.type === 'heading').map(t => t.level).sort();
    for (const lv of [0, 1, 2, 3, 4, 5, 7]) assert(levels.includes(lv), `כותרת ${lv} מזוהה`);
    const en = tokens.find(t => t.type === 'endnote' && /מורחבת המרוכזת/.test(t.text || ''));
    assert(en, 'הערת סיום רגילה נשמרת כתוכן (הסמנטיקה המקורית)');
    const para = tokens.find(t => t.type === 'paragraph' && t.notes && t.notes.length);
    assert(para && /הערת שוליים בתחתית/.test(para.notes[0].split('\uE000').join(' ')), 'הערת שוליים בתוחמים נחלצה');
  });
});

describe('REQ-PAR-02 balanced bracket scanner', () => {
  it('nested brackets produce correct pair count and no unmatched', () => {
    // 2 פותחים ו‑2 סוגרים בלבד: 'א [ב [ג] ד] ה' — קינון מלא, ללא יתרים
    const segs = [{ text: 'א [ב [ג] ד] ה', paraIndex: 0 }];
    const r = scanBrackets(segs);
    assertEq(r.pairs.length, 2, 'two matched pairs');
    assertEq(r.unmatchedClosers.length, 0);
    assertEq(r.unmatchedOpeners.length, 0);
    const outer = r.pairs.find(p => p.open === 2);
    assert(outer, 'outer pair starts at pos 2');
  });

  it('unmatched closer is REPORTED, never auto-fixed', () => {
    const r = scanBrackets([{ text: 'טקסט ] ללא פותח', paraIndex: 0 }]);
    assertEq(r.unmatchedClosers.length, 1);
    assert(/מקור/.test(r.unmatchedClosers[0].note), 'doctrine note attached');
  });

  it('cross-paragraph ranges are flagged', () => {
    const r = scanBrackets([
      { text: 'פסקה א מתחילה [הערה ש', paraIndex: 0 },
      { text: 'מסתיימת בפסקה ב]', paraIndex: 1 }
    ]);
    assertEq(r.scopeMap.crossParagraphCount, 1);
  });

  it('consecutive pairs [א][ב] remain separate notes (REQ-PAR-04)', () => {
    const tokens = tokenize(['טקסט [א][ב] סוף']);
    const p = tokens[0];
    assertEq(p.notes.length, 2, 'two separate notes');
    assertEq(p.notes[0], 'א');
    assertEq(p.notes[1], 'ב');
    const refCount = p.parts.filter(x => x.kind === 'note-ref').length;
    assertEq(refCount, 2, 'count conservation: two refs');
  });
});

describe('REQ-PAR-03 block tokenizer', () => {
  it('H0–H7 with mandatory dash; no dash = silent paragraph', () => {
    const tokens = tokenize(['כותרת 3 - שלוש', 'כותרת 3 בלי מקף', 'הקדמה - פתיחה', 'חלק א - ראשון']);
    assertEq(tokens[0].type, 'heading'); assertEq(tokens[0].level, 3);
    assertEq(tokens[1].type, 'paragraph', 'dash-less heading line is paragraph');
    assertEq(tokens[2].level, 0, 'הקדמה is H0');
    assertEq(tokens[3].level, 1, 'חלק is H1');
  });

  it('endnote prefix (no number) tokenized as class directive (D-40, תיקון P1-5)', () => {
    // **S4.5 (תיקון 03.11 — הפיכת D-40):** הסמנטיקה המקורית הוחזרה — שורה
    // המתחילה בקידומת (יחיד: «הערת סיום -») היא **תוכן הערה**, לא הוראה.
    // בעבר סווגה כהוראת כותרת ⇒ הטקסט נעלם מהפלט ומ-contentHash בשקט.
    const tokens = tokenize(['הערת סיום - הערה מסדר סוף']);
    assertEq(tokens[0].type, 'endnote', 'singular prefix line = endnote CONTENT');
    assertEq(tokens[0].text, 'הערה מסדר סוף');
    assertEq(tokens[0].title, undefined);
  });

  it('S4.5: plural «הערות סיום - …» is the class directive (no collision with content)', () => {
    const tokens = tokenize(['הערות סיום - הערות החלק הראשון']);
    assertEq(tokens[0].type, 'endnote-class', 'plural form = directive');
    assertEq(tokens[0].title, 'הערות החלק הראשון');
    // וה-hash כולל את כותרת ההוראה — שום טקסט לא נעלם בשקט (S4.5)
    const h1 = contentHash(tokens);
    const h2 = contentHash([{ ...tokens[0], title: 'כותרת אחרת' }]);
    assert(h1 !== h2, 'contentHash responds to directive title');
  });

  it('S4.5: configurable identifiers — prefix and delimiters from opts', () => {
    // קידומת מותאמת: «הערה - » (הברירה של chat-v20.3) — והקידומת הרגילה כבר לא פועלת
    const a = tokenize(['הערה - תוכן ההערה שלי'], { endnotePrefix: 'הערה -' });
    assertEq(a[0].type, 'endnote');
    assertEq(a[0].text, 'תוכן ההערה שלי');
    const b = tokenize(['הערת סיום - זו כבר לא הערה אלא פסקה'], { endnotePrefix: 'הערה -' });
    assertEq(b[0].type, 'paragraph', 'old prefix no longer special when overridden');
    // קידומת ריקה מבטלת זיהוי לגמרי
    const c = tokenize(['הערת סיום - טקסט רגיל לחלוטין'], { endnotePrefix: '' });
    assertEq(c[0].type, 'paragraph', 'empty prefix disables detection');
    // תוחמים מותאמים: ( ) במקום [ ]
    const d = tokenize(['טקסט (הערה בתוחמים מותאמים) המשך'], { fnOpen: '(', fnClose: ')' });
    assertEq(d[0].notes.length, 1);
    assertEq(d[0].notes[0].split('\uE000').join(' '), 'הערה בתוחמים מותאמים');
    // תוחם ריק מבטל הערות שוליים
    const e = tokenize(['טקסט [שלא יפורש כהערה] המשך'], { fnOpen: '', fnClose: '' });
    assertEq(e[0].notes.length, 0);
    assert(e[0].parts.some(p => p.kind === 'text' && /\[/.test(p.value)), 'brackets stay as plain text');
  });

  it('numbered endnote (D-40): num stripped from text, kept as anchor', () => {
    const tokens = tokenize(['הערת סיום-1 - זאת הערת הסיום הראשונה עם טקסט ארוך יותר.']);
    assertEq(tokens[0].type, 'endnote');
    assertEq(tokens[0].num, 1);
    assertEq(tokens[0].text, 'זאת הערת הסיום הראשונה עם טקסט ארוך יותר.');
    const tokens2 = tokenize(['הערת סיום 2 - טקסט הערה']); // צורת רווח
    assertEq(tokens2[0].num, 2);
    assertEq(tokens2[0].text, 'טקסט הערה');
  });

  it('title starting with a digit is not a class directive (safe side: note, never lost)', () => {
    const tokens = tokenize(['הערת סיום - 2026 סיכום שנה']);
    // לא צורת ממוספרת (אין מקף אחרי המספר) ולא כותרת נקייה — נשמר כהערה (לא הוראה)
    assertEq(tokens[0].type, 'endnote');
    assertEq(tokens[0].text, '2026 סיכום שנה');
  });

  it('editorial ##…## removed entirely but recorded', () => {
    const tokens = tokenize(['גוף ## הערת מערכת ## ממשיך']);
    const ed = tokens.filter(t => t.type === 'editorial');
    assertEq(ed.length, 1, 'editorial recorded');
    const para = tokens.find(t => t.type === 'paragraph');
    assert(para.raw.indexOf('##') === -1, 'no editorial markers survive in paragraph raw');
    assert(!para.raw.includes('הערת מערכת'), 'editorial text stripped from body');
  });

  it('inside-note spaces become atomic U+E000 (measure-only, REQ-LB-04)', () => {
    const tokens = tokenize(['טקסט [הערה ארוכה עם רווחים]']);
    assert(/\uE000/.test(tokens[0].notes[0]), 'atomic space substituted');
  });
});

describe('REQ-PAR-05 character hygiene', () => {
  it('gereshayim normalized one-way to geresh', () => {
    assertEq(normalizeText('טוב\u05F4'), 'טוב\u05F3');
  });
  it('curly latin quotes folded to straight quote', () => {
    assertEq(normalizeText('a\u2018b\u2019c'), 'a"b"c');
  });
});

describe('CP1 content hash (BRZ-15 foundation)', () => {
  it('hash stable for identical documents, differs on content change', () => {
    const a = tokenize(['x [y]', 'כותרת 1 - p']);
    const b = tokenize(['x [y]', 'כותרת 1 - p']);
    const c = tokenize(['x [y z]', 'כותרת 1 - p']);
    assertEq(contentHash(a), contentHash(b));
    assert(contentHash(a) !== contentHash(c), 'content change alters hash');
  });
});

report('parser');
