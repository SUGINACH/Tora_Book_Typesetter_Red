// tests/fixtures/generate_canonical_corpus.js — יוצר את מסמך הקורפוס הקנוני (דטרמיניסטי).
// הקורפוס ההיסטורי (5,702 שורות, Orange) אינו זמין כקובץ עצמאי; עד שייובא —
// זה הקורפוס הקנוני של RED: 4 חלקים, כותרות 0–7, הערות [..], סוגריים, הערות צד,
// הוראות כותרת־מחלקה והערות ממוספרות. דטרמיניסטי לחלוטין (אין רנדום).
'use strict';

const fs = require('fs');
const path = require('path');

const WORDS = [
  'תורה', 'חכמה', 'בינה', 'דעת', 'מלכות', 'גבורה', 'חסד', 'אמת', 'שלום', 'ברכה',
  'לימוד', 'הלכה', 'אגדה', 'פשט', 'רמז', 'דרש', 'סוד', 'עמל', 'שבת', 'מצווה'
];
const pick = (i) => WORDS[i % WORDS.length];
const sentence = (i, n) => Array.from({ length: n }, (_, k) => pick(i * 7 + k * 3)).join(' ') + '.';

let out = [];
out.push('ספר - ספר הקורפוס הקנוני');
out.push('נושא - מסמך רגרסיה קנוני לבדיקות המנוע');
out.push('מחבר - מערכת הבדיקות של RED');
out.push('');
out.push('הקדמה - פתח דבר');
out.push(sentence(1, 9) + ' ' + sentence(2, 8));
out.push('');

const PARTS = 8;
for (let part = 1; part <= PARTS; part++) {
  out.push(`כותרת 1 - חלק ${part}: ענייני החלק`);
  out.push(`כותרת 2 - סימן א של חלק ${part}`);
  for (let p = 0; p < 10; p++) {
    const i = part * 100 + p;
    out.push(`פסקה ${p + 1} של חלק ${part} ${sentence(i, 10)} (ביאור בסוגריים למילה ${pick(i)}) ${sentence(i + 1, 6)}`);
    if (p === 2) out.push(`פסקה עם הערת גוף ${sentence(i + 2, 7)} [הערת הגוף מספר ${p} של חלק ${part}] והמשך הפסקה עוד קצת.`);
    if (p === 4) out.push(`כותרת 3 - ענף ב של חלק ${part}`);
  }
  out.push(`כותרת 7 - ביאור צד לחלק ${part}: דברי חכמים ז"ל`);
  out.push(`פסקת סיום של חלק ${part} ${sentence(part * 200, 9)}`);
  out.push(`הערת סיום - הערות סיום של חלק ${part}`);
  for (let e = 1; e <= 5; e++) {
    out.push(`הערת סיום-${e} - זו הערה ממוספרת ${e} של חלק ${part} ${sentence(part * 300 + e, 8)}`);
  }
  out.push('');
}

const corpus = out.join('\n').trim() + '\n';
const target = path.join(__dirname, 'canonical_corpus.txt');
fs.writeFileSync(target, corpus, 'utf8');
console.log(`canonical corpus written: ${target} (${corpus.split('\n').length} lines, ${corpus.length} chars)`);
