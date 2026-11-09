// src/ui/test-doc-generator.js — מחולל מסמכי בדיקה (פער 1: נושא 16 ב"סיכום בקשות מAI" + SRS §16.1/§20.1)
'use strict';

/**
 * **רקע (בקשת המשתמש המקורית):** "ופצל את לחצן 'מסמך בדיקה' לשני לחצנים
 * 1. 'מסמך בדיקה קבוע' שיזריק את אותו מסמך בכל פעם. 2. 'מסמך בדידה רנדומלי'
 * שיזריק בכל פעם טקסט רנדומלי." — וכן "המסמך הסופי צריך להכיל לפחות 300 דפים
 * מסוגים שונים" לפי חמשת צירי העקה.
 *
 * **עקרונות:**
 * - **קבוע = דטרמיניסטי מלא:** זרע (seed) קבוע ⇒ אותם בתים בדיוק בכל לחיצה
 *   (מדיניות האפס-אקראיות של הפרויקט נשמרת — אין Math.random/Date.now בנתיב הקבוע).
 * - **רנדומלי = זרע טרי בכל קריאה:** (Date.now ^ Math.random) — מסמך חדש בכל לחיצה.
 * - **חמשת צירי העקה (SRS §20.1):** (1) טיפולוגיות עמוד — פרקים (H2), H3 חוצה
 *   בראש פרק ובאמצעו, גוף רגיל; (2) מדדי פסקה — שורה אחת, שתי שורות, ארוכות
 *   20+ שורות; (3) שילובי כותרות — H4/H5/H6 בראש/אמצע/סוף פרק, כולל רצפי
 *   כותרות; (4) צפיפויות הערות — 0, 1–5 קצרות, ענק חוצה-עמודים, ורצף
 *   [א][ב] (מקרה האינטגרציה ההיסטורי); (5) סוגריים עגולים — שורה אחת,
 *   רב-שורות וחוצה-טורים.
 * - **בלי הפרות מעוצבות:** אין מילים בלתי-ניתנות-לשבירה מלאכותיות (המסמך אמור
 *   להיות שקוף להגדרות ההגנות — "0 בעיות עימוד" נשמר גם עליו; העקה היא בהצטברות
 *   ובשילובים, לא בהפרות מכוונות).
 * - **טהור:** מודול ללא כל גישה למנוע/DOM (כלל F-06) — מחרוזות בלבד.
 */

/** mulberry32 — PRNG דטרמיניסטי קטן ומהיר (32 ביט, איכות מספקת לטקסט). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** הזרע הקבוע של מצב "קבוע" — אף פעם לא משתנה (נעילת הדטרמיניזם בין גרסאות פריסה). */
const FIXED_SEED = 0x54F2A17;

/** מאגרי מילים — עברית אמיתית באורכים מגוונים (2–11 תווים) לריאליזם טיפוגרפי. */
const WORDS = [
  'תורה', 'הלכה', 'סוגיה', 'שיעור', 'דין', 'טעם', 'פשט', 'דרש', 'רמז', 'סוד',
  'גמרא', 'משנה', 'ברייתא', 'תוספות', 'ראשונים', 'אחרונים', 'פוסקים', 'שולחן', 'ערוך', 'רמב"ם',
  'פרשה', 'פסוק', 'פסוקים', 'מפרשים', 'מדרש', 'זוהר', 'קבלה', 'מוסר', 'חסידות', 'אמונה',
  'ברכה', 'תפילה', 'שבת', 'מועד', 'כשרות', 'טהרה', 'נישואין', 'קידושין', 'גיטין', 'נזיקין',
  'לימוד', 'שיעורים', 'עיון', 'בקיאות', 'חברותא', 'בית', 'מדרש', 'ישיבה', 'כולל', 'שיחה',
  'מחבר', 'עורך', 'מהדורה', 'דפוס', 'נוסח', 'מקור', 'עדות', 'כתב', 'יד', 'ספר',
  'אור', 'חכמה', 'דעת', 'בינה', 'חסד', 'גבורה', 'תפארת', 'נצח', 'הוד', 'יסוד',
  'מלכות', 'שמים', 'ארץ', 'ים', 'הר', 'מדבר', 'נהר', 'עיר', 'כפר', 'שדה',
  'יום', 'לילה', 'בוקר', 'ערב', 'שנה', 'חודש', 'שבוע', 'שעה', 'רגע', 'עת',
  'אדם', 'איש', 'אשה', 'בן', 'בת', 'אב', 'אם', 'אח', 'אחות', 'רע',
  'דבר', 'מילה', 'מחשבה', 'הבנה', 'שאלה', 'תשובה', 'ספק', 'ודאות', 'מחלוקת', 'הסכמה',
  'גדול', 'קטן', 'קדוש', 'טהור', 'חי', 'טוב', 'ישר', 'אמת', 'שלום', 'אמת'
];
/** מילים ארוכות יותר — לעקת רוחב שורה גבוהה (בלי חריגה מלאכותית). */
const LONG_WORDS = [
  'להתבוננות', 'התבארותו', 'מתורגמים', 'התחייבות', 'להשגחה', 'בהתאחדות', 'להתקדשות',
  'התעמקות', 'להידמות', 'התכוונות', 'להבחנות', 'התאמצות', 'להתייחסות', 'השתלשלות',
  'להתחברות', 'התעוררות', 'להתקרבות', 'התנדבות', 'להשתלמות', 'התמדה'
];
/** מילים מוטמעות-מקף — עקת יחידת-מילה מורכבת. */
const HYPHEN_WORDS = ['על-פי', 'אין-סוף', 'כל-שכן', 'צריך-עיון', 'שלא-כדין', 'יש-אומרים', 'קושיה-ראשונה'];
/** זוגות NBSP (צמדים) — עקת יחידה מודבקת (BRZ-11). */
const NBSP_PAIRS = ['מסכת\u00A0שבת', 'רבי\u00A0עקיבא', 'בבא\u00A0קמא', 'רבי\u00A0יוחנן', 'שולחן\u00A0ערוך', 'יורה\u00A0דעה'];

const SENTENCE_ENDS = ['.', '.', '.', '.', '.', ':', ';', '?', '!'];
const CONNECTORS = ['שכן', 'אולם', 'אך', 'כי', 'אף', 'גם', 'עוד', 'הרי', 'הן', 'אמנם'];

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length) % arr.length]; }
function randInt(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }
function chance(rng, p) { return rng() < p; }

/** מילה בודדת מהמאגרים (לפעמים ארוכה/מוטמעת/מודבקת). */
function word(rng) {
  const r = rng();
  if (r < 0.04) return pick(rng, LONG_WORDS);
  if (r < 0.07) return pick(rng, HYPHEN_WORDS);
  if (r < 0.09) return pick(rng, NBSP_PAIRS);
  return pick(rng, WORDS);
}

/** משפט אחד: 5–12 מילים, מסתיים בפיסוק. */
function sentence(rng) {
  const n = randInt(rng, 5, 12);
  const parts = [];
  if (chance(rng, 0.25)) parts.push(pick(rng, CONNECTORS));
  while (parts.length < n) parts.push(word(rng));
  return parts.join(' ') + pick(rng, SENTENCE_ENDS);
}

/** פסקה בת ~targetWords מילים. */
function paragraphText(rng, targetWords) {
  const parts = [];
  let count = 0;
  while (count < targetWords) {
    const s = sentence(rng);
    parts.push(s);
    count += s.split(/\s+/).length;
  }
  return parts.join(' ');
}

/** הערת שוליים קצרה (4–10 מילים). */
function shortNote(rng) { return paragraphText(rng, randInt(rng, 4, 10)).replace(/[.?:;!]$/, ''); }

/** הערת-ענק — חוצה מרזבים ועמודים (120–200 מילים). */
function massiveNote(rng) { return paragraphText(rng, randInt(rng, 120, 200)).replace(/[.?:;!]$/, ''); }

/** סוגריים עגולים — kind: 'short' | 'multi' | 'cross'. */
function paren(rng, kind) {
  const n = kind === 'short' ? randInt(rng, 3, 8) : (kind === 'multi' ? randInt(rng, 15, 40) : randInt(rng, 50, 120));
  return '(' + paragraphText(rng, n).replace(/[.?:;!]$/, '') + ')';
}

/**
 * פסקת גוף אחת עם עטיפת הערות/סוגריים לפי הגרלת הצירים.
 * @returns {string} שורת פסקה אחת (בלי כותרת)
 */
function bodyParagraph(rng, kind) {
  const target = kind === 'tiny' ? randInt(rng, 3, 6)
    : kind === 'short' ? randInt(rng, 10, 18)
    : kind === 'long' ? randInt(rng, 150, 260)
    : randInt(rng, 30, 80);
  const chunks = [];
  const words = paragraphText(rng, target).split(' ');
  // פיצול לשני חצאים לצורך הזרקת סוגריים/הערות באמצע טבעי
  const half = Math.max(1, Math.floor(words.length / 2));
  const firstHalf = words.slice(0, half).join(' ');
  const secondHalf = words.slice(half).join(' ');

  chunks.push(firstHalf);

  // ציר 5 — סוגריים עגולים
  const pr = rng();
  if (pr < 0.16) chunks.push(paren(rng, 'short'));
  else if (pr < 0.26) chunks.push(paren(rng, 'multi'));
  else if (pr < 0.31) chunks.push(paren(rng, 'cross'));

  // ציר 4 — הערות שוליים
  const fr = rng();
  if (fr < 0.30) {
    // אין הערה
  } else if (fr < 0.55) {
    chunks.push('[' + shortNote(rng) + ']');
  } else if (fr < 0.75) {
    const n = randInt(rng, 2, 5);
    for (let i = 0; i < n; i++) chunks.push('[' + shortNote(rng) + ']');
  } else if (fr < 0.88) {
    // רצף מוכר מההיסטוריה: [טקסט][טקסט] בלי רווח ביניהם
    chunks.push('[' + shortNote(rng) + '][' + shortNote(rng) + ']');
  } else {
    chunks.push('[' + massiveNote(rng) + ']');
  }

  chunks.push(secondHalf);
  return chunks.filter(Boolean).join(' ');
}

/** כותרת פרק ממוספרת. */
function chapterTitle(rng, idx) {
  const topics = ['עקרונות הלימוד', 'דיני שבת', 'הלכות תפילה', 'דיני כשרות', 'ענייני מועדים',
    'הלכות ברכות', 'דיני ממונות', 'ענייני טהרה', 'הלכות אישות', 'דיני נזיקין',
    'עקרונות הפסיקה', 'מנהגי ישראל', 'תיקוני חצות', 'ענייני חינוך', 'הלכות צדקה',
    'דיני עדות', 'ענייני תשובה', 'הלכות אבלות', 'דיני סעודה', 'ענייני קידוש החודש'];
  const gematria = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'יג', 'יד', 'טו', 'טז',
    'יז', 'יח', 'יט', 'כ', 'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל', 'לא', 'לב', 'לג', 'לד', 'לה', 'לו'];
  return `פרק ${gematria[(idx - 1) % gematria.length]} — ${pick(rng, topics)}`;
}

/**
 * בלוק כותרת-משנה (ציר 3) — טקסט כותרת מגוון.
 * @param {number} level 3..7
 */
function subHeadingText(rng, level) {
  const h3 = ['כללים והגדרות', 'מחלוקת הראשונים', 'שיטת הרמב"ם', 'דעת השולחן ערוך', 'ביאור הסוגיה', 'השלכות מעשיות'];
  const h456 = ['טעם הדין', 'גדרי הדין', 'מקור הדין', 'חילוקי דינים', 'דין נוסף', 'לשון הפוסקים', 'שאלה נפרדת', 'ראיה מהגמרא'];
  const h7 = ['מהות המצווה', 'טעם המנהג', 'יסוד העניין', 'מקור ההלכה', 'גדר הדין', 'שורש העניין'];
  return pick(rng, level === 3 ? h3 : level === 7 ? h7 : h456);
}

/**
 * פרק אחד שלם — רצף בלוקים מעורבב לפי הצירים.
 * @param {number} chapterIdx מספר הפרק (1-based) — להבטחת כיסוי רמות הכותרות ברוטציה
 * @returns {string[]} שורות הפרק (בלי שורת ה-כותרת 2)
 */
function chapterLines(rng, opts, chapterIdx) {
  const lines = [];
  const nBlocks = opts.compact ? randInt(rng, 6, 9) : randInt(rng, 28, 42);
  let blocksSinceHeading = 0;

  // ציר 1 — H3 חוצה בראש הפרק (אחרי פסקת פתיחה קצרה) או באמצע
  const h3AtTop = chance(rng, 0.5);
  // ציר 3 — הבטחת כיסוי: כל פרק מקבל כותרת-משנה מובטחת ברמה מתחלפת (4/5/6)
  // בעמדה אמצעית; פרק 1 מקבל גם כותרת-צד (H7) מובטחת — שום רמה לא חסרה לעולם.
  const guaranteedLvl = 4 + ((chapterIdx - 1) % 3);
  const guaranteedAt = Math.floor(nBlocks / 2);
  const docFirst = chapterIdx === 1;

  for (let i = 0; i < nBlocks; i++) {
    const r = rng();
    const isTop = i < 2;
    const isBottom = i >= nBlocks - 2;

    // פסקת-עקה מובטחת בפרק הראשון של המצומצם (לפני כל ענף אחר — אף ענף
    // אחר לא יכול לבלוע את האינדקס הזה): רצף [א][ב] + סוגריים חוצי-טורים
    if (docFirst && opts.compact && i === 3) {
      lines.push(`${paragraphText(rng, 12)} ${paren(rng, 'cross')} [${shortNote(rng)}][${shortNote(rng)}] ${paragraphText(rng, 10)}`);
      blocksSinceHeading++;
      continue;
    }

    // ציר 1 — כותרת צד (H7) מובטחת בפרק הראשון (i=0 — לפני כל ענף כותרת אחר)
    if (docFirst && i === 0) {
      lines.push(`כותרת 7 - ${subHeadingText(rng, 7)}`);
      // נופל להמשך — H7 תמיד לפני פסקה
    }

    if (h3AtTop && i === 1) {
      lines.push(`כותרת 3 - ${subHeadingText(rng, 3)}`);
      blocksSinceHeading = 0;
      continue;
    }
    if (!h3AtTop && i === Math.floor(nBlocks / 4)) {
      lines.push(`כותרת 3 - ${subHeadingText(rng, 3)}`);
      blocksSinceHeading = 0;
      continue;
    }

    // ציר 3 — כותרת משנה מובטחת בעמדה האמצעית (רוטציה 4/5/6 בין פרקים)
    if (i === guaranteedAt) {
      lines.push(`כותרת ${guaranteedLvl} - ${subHeadingText(rng, guaranteedLvl)}`);
      if (chance(rng, 0.25)) { // רצף כותרות — עקת escort
        lines.push(`כותרת ${Math.min(6, guaranteedLvl + 1)} - ${subHeadingText(rng, Math.min(6, guaranteedLvl + 1))}`);
      }
      blocksSinceHeading = 0;
      continue;
    }

    // ציר 3 — כותרות משנה מוגרלות בעמדות מגוונות
    if (blocksSinceHeading >= 2 && r < 0.22) {
      const lvl = isTop ? randInt(rng, 4, 5) : isBottom ? randInt(rng, 5, 6) : randInt(rng, 4, 6);
      lines.push(`כותרת ${lvl} - ${subHeadingText(rng, lvl)}`);
      if (chance(rng, 0.25)) { // רצף כותרות — עקת escort
        lines.push(`כותרת ${Math.min(6, lvl + 1)} - ${subHeadingText(rng, lvl + 1)}`);
      }
      blocksSinceHeading = 0;
      continue;
    }

    // ציר 1 — כותרות צד (H7) מוגרלות בהמשך
    if (blocksSinceHeading >= 1 && r < 0.27) {
      lines.push(`כותרת 7 - ${subHeadingText(rng, 7)}`);
    }

    // ציר 2 — מדדי פסקה מגוונים
    const pr = rng();
    const kind = opts.compact
      ? (pr < 0.14 ? 'tiny' : pr < 0.30 ? 'short' : pr < 0.44 ? 'long' : 'medium')
      : (pr < 0.08 ? 'tiny' : pr < 0.20 ? 'short' : pr < 0.50 ? 'long' : 'medium');
    lines.push(bodyParagraph(rng, kind));
    blocksSinceHeading++;
  }

  // הערות סיום בחלק מהפרקים
  if (chance(rng, opts.compact ? 0.5 : 0.33)) {
    const n = randInt(rng, 2, 6);
    for (let i = 0; i < n; i++) {
      lines.push(`הערת סיום - ${paragraphText(rng, randInt(rng, 8, 25))}`);
    }
  }
  return lines;
}

/**
 * מחולל מסמך הבדיקה.
 * @param {{mode?:'fixed'|'random', seed?:number, scale?:'full'|'small'}} [opts]
 *   mode fixed (ברירת מחדל) — דטרמיניסטי מלא; random — זרע טרי בכל קריאה.
 *   seed מפורש עוקף את שניהם (לבדיקות).
 *   scale full (ברירת מחדל) — ~35 פרקים, מאות עמודים; small — 3 פרקים לבדיקות.
 * @returns {string} המסמך המלא בפורמט הקלט של המנוע (כותרת N - …, [הערות], (סוגריים), הערת סיום - …)
 */
function generateTestDocument(opts = {}) {
  const mode = opts.mode === 'random' ? 'random' : 'fixed';
  const scale = opts.scale === 'small' ? 'small' : 'full';
  const seed = Number.isFinite(opts.seed)
    ? (opts.seed >>> 0)
    : (mode === 'random'
      ? (((Date.now() >>> 0) ^ (Math.floor(Math.random() * 0xFFFFFFFF) >>> 0)) >>> 0) || 1
      : FIXED_SEED);
  const rng = mulberry32(seed);

  const out = [];
  // ---- פתיח (מטא-נתונים — נסגר בשורה ריקה) ----
  // הערה: הכותרת אינה כוללת את המצב (קבוע/רנדומלי) — המצב נקבע מהזרע בלבד,
  // כך ש-seed זהה ⇒ מסמך זהה בתים-בתים (ההבחנה מדווחת בהודעת ההזרקה ב-UI).
  out.push(`שם הספר - מסמך בדיקה (${scale === 'small' ? 'מצומצם' : 'מלא'} — חמשת צירי העקה)`);
  out.push('נושא - העמדת מנוע העימוד בכל מקרי הקצה');
  out.push(`נושא מפורט - ${paragraphText(rng, randInt(rng, 8, 16))}`);
  out.push('שם המחבר - מחולל מסמכי הבדיקה');
  out.push('מקום ושנת הוצאה - ירושלים תשפ"ו');
  out.push('');

  // ---- גוף: פרקים ----
  const nChapters = scale === 'small' ? 3 : randInt(rng, 48, 56);
  for (let c = 1; c <= nChapters; c++) {
    out.push(`כותרת 2 - ${chapterTitle(rng, c)}`);
    for (const line of chapterLines(rng, { compact: scale === 'small' }, c)) out.push(line);
    if (c < nChapters) out.push('');
  }

  // ---- הוראת כותרת עמודי הערות-הסיום (צורת הרבים בלבד — D-40) ----
  out.push('');
  out.push('הערות סיום - הערות המחבר');
  out.push(paragraphText(rng, randInt(rng, 10, 20)));

  return out.join('\n');
}

module.exports = { generateTestDocument, FIXED_SEED, mulberry32 };
