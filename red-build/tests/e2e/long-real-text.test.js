// tests/e2e/long-real-text.test.js — D-83/D-84: ספרי־אמת ארוכים (קריסת מחסנית + קורפוס אמת)
'use strict';

/**
 * רקע (03.11, דוח משתמש חי מה-Pages): ייבוא ספר אמת ועימודו קרס בהודעה
 * "engine: Maximum call stack size exceeded". שורש: gOut.push(...outWordsOfAll())
 * בבדיקת שימור־התוכן שבסוף ה-pipeline — spread על מערך של כל מילות הספר
 * (291,719 מילים) חרג ממגבלת הארגומנטים של V8 (125,154). בדיקת העומס הסינתטית
 * (735 עמודים = 33,750 מילים בלבד!) מעולם לא הגיעה לסדר הגודל הזה — לכן לא תפסה.
 *
 * הקורפוס כאן: קבצי בדיקה אמיתיים מ-IMUD_TORANI/text_files_for_typesetter_tests
 * (פורמט "מקום בינה" — מטא-דאטה + כותרות ממוספרות), בעלות "כל הזכויות הפקר"
 * לפי כותרת הקובץ עצמו. long_test_text.txt הוא הקובץ ששחזר את הקריסה בפועל.
 */

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');

const REAL_DIR = path.join(__dirname, '..', 'fixtures', 'real');
const REAL_FILES = ['no_long_test_text.txt', 'mid_long_test_text.txt', 'long_test_text.txt'];

// **04.11 (בקשת משתמש: "כל הבדיקות צריכות להיעשות על הקובץ ה'גדול מאוד'"):**
// הקורפוס הגדול מאוד — 3.4MB, 2,571 כותרות, 10 חלקים, 363K מילים. נצרך ישירות
// מ-audits/ (בלי לשכפל 3.4MB לתוך fixtures). זה הקורפוס שחשף את שלושת באגי
// ההערות שתוקנו ב-legacy-imud-flow (כפילות בעמוד, מיזוג הערות סמוכות,
// בליעת הערה לתוך הערת-צד + דריסה) — ראה audits/very-long-artifacts/corpus-report.json
// ואת הוורקפלו layout-parity.yml (job: very-long-corpus) לאימות האינווריאנטים
// המוחלטים המלא (C1..C11) מול אותו קובץ בדיוק.
const VERY_LONG = path.join(__dirname, '..', '..', '..', 'audits', 'very_long_test_text.txt');
const veryLongAvailable = fs.existsSync(VERY_LONG);

describe('D-83 — ספרי־אמת ארוכים: עימוד מלא ללא קריסת מחסנית', () => {

  for (const file of REAL_FILES) {
    it(`${file}: עימוד מלא, שימור תוכן, דטרמיניזם`, () => {
      const raw = fs.readFileSync(path.join(REAL_DIR, file), 'utf8');
      const words = raw.split(/\s+/).filter(Boolean).length;
      const result = typeset(raw, getDefaultSettings());
      assert(result.pages.length > 0, 'חייבים להיות עמודים');
      assert(result.contentPreserved === true, `שימור תוכן נכשל (${file})`);
      assert(result.retreat.converged || result.retreat.compromise ||
        [...result.ledger.issues.values()].some(r => r.kind === 'rollback-compromise'),
        'אי-התכנסות חייבת להיות מתועדת');
      // הרצה שנייה — דטרמיניזם גם בסדר גודל של ספר שלם
      const again = typeset(raw, getDefaultSettings());
      assert(result.layoutHash === again.layoutHash, `hash שונה בין ריצות (${file})`);
      assertEq(result.pages.length, again.pages.length, 'מספר עמודים יציב');
      // תיעוד בקונסולה ל- artifact ידני
      console.log(`  [real] ${file}: words=${words} pages=${result.pages.length} hash=${result.layoutHash.slice(0, 12)}`);
    });
  }

  it('רגרסיית סף: מסמך סינתטי מעל מגבלת הארגומנטים של V8 (125,154) — בדיוק המלכודת של D-83', () => {
    // 130,000 מילים — מעל המגבלה; בקוד הישן היה זורק RangeError בהכרח
    const sentences = [
      'הלכות שבת ועירובין בביאור מעמיק עם ציטוטי ראשונים ואחרונים',
      'והנה ביארנו את גדרי ההוצאה מרשות לרשות באריכות רבה',
      'ודברי חז"ל מבוארים כפשטם וכפי שיטת רבינו הגדול זצ"ל',
      'ומעתה נבוא לבאר את הנפקא מינה למעשה בעניין תחומי שבת',
      'וכל האמור לעיל בא ללמד על סדר הדורות ושיטת הפוסקים'
    ];
    const paras = [];
    let w = 0;
    while (w < 130000) {
      const s = sentences[paras.length % sentences.length];
      paras.push(s);
      w += s.split(' ').length;
    }
    // מבנה מסמך מינימלי תקין: מטא-דאטה + כותרת + פסקאות
    const doc = ['שם הספר - מקום בינה', 'כותרת 1 מספר 1 - הוצאה ורשויות'].concat(paras).join('\n');
    const result = typeset(doc, getDefaultSettings());
    assert(result.pages.length >= 350, `ספר 130K מילים ⇒ מאות עמודים (קיבלנו ${result.pages.length})`);
    assert(result.contentPreserved === true, 'שימור תוכן גם מעל סף V8');
  });

  // **04.11 — הקובץ ה"גדול מאוד" בנתיב ה-DP (הנתיב החי של העימוד הכללי):**
  // מנוע המורשת (legacy-imud-flow) נבדק על אותו קובץ בוורקפלו layout-parity
  // (run-ours.js --determinism + verify-corpus.py — 11/11 אינווריאנטים מוחלטים).
  // כאן נבדק אותו בנתיב ה-DP: סקאלה מלאה, שימור, דטרמיניזם כפול.
  (veryLongAvailable ? it : it.skip)('very_long_test_text.txt: ספר שלם (363K מילים) בנתיב DP — סקאלה, שימור, דטרמיניזם', () => {
    const raw = fs.readFileSync(VERY_LONG, 'utf8');
    const t0 = Date.now();
    const result = typeset(raw, getDefaultSettings(), { noRecommendations: true });
    const dt = Date.now() - t0;
    assert(result.pages.length >= 900, `ספר 363K מילים ⇒ מעל 900 עמודים (קיבלנו ${result.pages.length})`);
    assert(result.contentPreserved === true, 'שימור תוכן בסקאלה מלאה');
    assert(dt < 120000, `זמן עימוד סביר (<2 דק׳; קיבלנו ${dt}ms)`);
    const again = typeset(raw, getDefaultSettings(), { noRecommendations: true });
    assert(result.layoutHash === again.layoutHash, 'hash זהה בין ריצות גם בספר הגדול');
    assertEq(result.pages.length, again.pages.length, 'מספר עמודים יציב');
    console.log(`  [real] very_long: words=${raw.split(/\s+/).filter(Boolean).length} pages=${result.pages.length} hash=${result.layoutHash.slice(0, 12)} ${dt}ms`);
  });

});

report('long-real-text');
