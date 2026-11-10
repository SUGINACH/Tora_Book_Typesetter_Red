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
const { DocumentStructureError } = require('../../src/engine/parser/document-structure');

function assertStructurallyInvalidCorpus(raw, label) {
  let error = null;
  try { typeset(raw, getDefaultSettings(), { noRecommendations: true }); }
  catch (caught) { error = caught; }
  assert(error instanceof DocumentStructureError, label + ': must be rejected by source preflight');
  assertEq(error.code, 'INVALID_DOCUMENT_STRUCTURE', label + ': error code');
  const counts = error.issues.reduce((acc, issue) => {
    acc[issue.code] = (acc[issue.code] || 0) + 1;
    return acc;
  }, {});
  assertEq(counts['heading-chain-not-increasing'] || 0, 5, label + ': five non-increasing heading transitions');
  assertEq(counts['heading-title-no-meaningful-text'] || 0, 7, label + ': seven marker-only H6 titles');
}

const REAL_DIR = path.join(__dirname, '..', 'fixtures', 'real');
const REAL_FILES = ['no_long_test_text.txt', 'mid_long_test_text.txt', 'long_test_text.txt'];

// The 363K-word source is preserved as a D-100 negative control; it must be rejected.
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

  (veryLongAvailable ? it : it.skip)('very_long_test_text.txt: 363K-word malformed source is rejected before layout (D-100)', () => {
    const raw = fs.readFileSync(VERY_LONG, 'utf8');
    assertStructurallyInvalidCorpus(raw, 'audits/very_long_test_text.txt');
  });

  // **FWD-4 (05.11 — הקורפוס ההיסטורי של Orange התקבל ויובא):** הקובץ המקורי
  // מ-IMUD_TORANI/text_files_for_typesetter_tests/very_long_test_text.txt —
  // 5,702 שורות, בתים-בתים (md5 ‏d961a8cad4e31df592d80828b36a490d). שונה מהעותק
  // שב-audits/ (שנערך: נוסף "מספר N" לכותרות כפולות ורווחים כפולים נורמלו) —
  // כאן הקלט ההיסטורי האמיתי: כותרות עם טקסט זהה חוזר (בלי מספור מבדיל),
  // רווחים כפולים, סוף-שורה LF. המנוע חייב להתמודד עם שניהם בלי קריסה ובלי
  // איבוד — הבדלי העריכה אינם רשות להתנהגות שונה.
  it('FWD-4: הקורפוס ההיסטורי של Orange (5,702 שורות, בתים-בתים) — שני הנתיבים, שימור, דטרמיניזם', () => {
    const HIST = path.join(REAL_DIR, 'orange_very_long_test_text.txt');
    const raw = fs.readFileSync(HIST, 'utf8');
    // זהות היסטורית: המאפיינים המבדילים מהעותק הנורמל
    assertEq(raw.split('\n').length, 5703, '5,702 שורות + שורת סיום (המקור)');
    const lines = raw.split('\n');
    assertEq(lines[0], 'שם הספר - מקום בינה', 'כותרת המקור');
    // כותרות כפולות בלי מספור מבדיל — המאפיין שנערך מחוץ לקורפוס ההיסטורי
    // (בעותק שב-audits/ קיבלו כל הכותרות החוזרות "מספר N"; במקור הן חוזרות זהות)
    const dupHead = lines.filter(l => l === 'כותרת 6 - *').length;
    assert(dupHead === 6, `כותרת 6 - * חוזרת 6 פעמים במקור (מצאנו ${dupHead})`);
    const dupSum = lines.filter(l => l === 'כותרת 4 - סיכום').length;
    assert(dupSum === 4, `כותרת 4 - סיכום חוזרת 4 פעמים (מצאנו ${dupSum})`);
    assert(/  /.test(raw), 'רוושים כפולים נשמרים כבמקור');
    // בעותק הנורמל שב-audits/ כל כותרת חוזרת קיבלה "מספר N" — שם "כותרת 6 - *"
    // מופיעה פעם אחת לכל היותר; כאן היא חוזרת זהה 6 פעמים (המקור ההיסטורי).


    assertStructurallyInvalidCorpus(raw, 'Orange historical source / DP');
    const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
    const { getSettingDefs } = require('../../src/engine/core/settings-registry');
    const LEGACY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
    const imp = importImudSettings(LEGACY, new Set(getSettingDefs().map(r => r.id)));
    let legacyError = null;
    try { typeset(raw, imp.settings, { noRecommendations: true }); }
    catch (caught) { legacyError = caught; }
    assert(legacyError instanceof DocumentStructureError, 'Legacy path must also reject malformed source');
    assertEq(legacyError.code, 'INVALID_DOCUMENT_STRUCTURE', 'Legacy preflight error code');
  });
});

report('long-real-text');
