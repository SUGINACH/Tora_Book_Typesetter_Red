// tests/integration/source-variants.test.js — EXT-14/S4.2-4: מיגרציה lossless של כל וריאנטי המקור
'use strict';

/**
 * סגירת שער S4.2-4 (תכנית העבודה): "Migration test: load v1 exports (all 5 repos'
 * default_settings variants + user templates makom-bina) → upgrade lossless" —
 * נסגר כעת עם העתקת וריאנטי המקור מ-IMUD_TORANI/archive לתוך הריפו כ-fixtures
 * מחייבים (העתקה בתים-בתים, לא דוגמאות מצומצמות):
 *  - v19-baseline-6c5a7e1 (251 שורות, 250 מפתחות — הבסיס ההיסטורי)
 *  - v20.4-tip (244 שורות, 242 מפתחות — הגרסה "החתוכה"; תת-קבוצה של main)
 *  - v21-glm-11b2b55 (264 מפתחות — זהה ל-main; עובדה הנעל�ת מכאן)
 *  - makom-bina-v20.5 (250 מפתחות — תבנית המשתמש; מחסניות גופן בעברית + aq דלוק)
 * וריאנט main (264) כבר מחייב ב-imud-migration.test.js.
 *
 * ההוכחות: אפס unmapped בכל וריאנט; חשבונאות מלאה; ערכי ui-state נשמרים;
 * עובדות ההשוואה ההיסטוריות (v21≡main, v20.4⊂main) נעולות; המחסניות
 * העבריות של makom-bina נפתרות מול הקטלוג המוטמע; וכל וריאנט מעמד ספר אמת.
 */

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getSettingDefs } = require('../../src/engine/core/settings-registry');
const { typeset } = require('../../src/engine/core/pipeline');

const FX = path.join(__dirname, '..', 'fixtures');
const ASSETS = path.join(__dirname, '..', '..', 'ui', 'assets', 'imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
const AVAILABLE = new Set(CATALOG.map(e => e.family));
const RED = new Set(getSettingDefs().map(r => r.id));
const CORPUS = fs.readFileSync(path.join(FX, 'imud_default_text.txt'), 'utf8');

const VARIANTS = {
  'v19-baseline': 'imud_default_settings_v19.json',
  'v20.4-tip': 'imud_default_settings_v20_4.json',
  'v21-glm': 'imud_default_settings_v21.json',
  'makom-bina-v20.5': 'imud_default_settings_makom_bina.json'
};
const MAIN = JSON.parse(fs.readFileSync(path.join(FX, 'imud_default_settings.json'), 'utf8'));
const loadVariant = (f) => JSON.parse(fs.readFileSync(path.join(FX, f), 'utf8'));
const importVariant = (f) => importImudSettings(loadVariant(f), RED, { availableFonts: AVAILABLE });

describe('EXT-14/S4.2-4 — מיגרציה lossless של כל וריאנטי default_settings מהמקור', () => {
  it('כל הווריאנטים מוטמעים כ-fixtures מחייבים (בתים-בתים מהארכיון)', () => {
    for (const [name, f] of Object.entries(VARIANTS)) {
      assert(fs.existsSync(path.join(FX, f)), `${name}: ה-fixture קיים (${f})`);
    }
  });

  it('אפס unmapped בכל וריאנט; חשבונאות מלאה; ערכי ui-state נשמרים כערכים', () => {
    for (const [name, f] of Object.entries(VARIANTS)) {
      const raw = loadVariant(f);
      const { unmapped, report, uiState, settings } = importVariant(f);
      assertEq(unmapped, [], `${name}: אף מפתח לא unmapped`);
      assertEq(report.mapped + report.merged + report.uiState + report.removed, Object.keys(raw).length,
        `${name}: הספירה מכסה את כל ${Object.keys(raw).length} המפתחות`);
      assert(Object.keys(uiState).length === report.uiState, `${name}: ערכי uiState נשמרים`);
      assert(settings['_legacy-ui-state'], `${name}: _legacy-ui-state קיים`);
      // כל מפתח היעד ברישום RED או מפתח פנימי מתועד
      for (const k of Object.keys(settings)) {
        assert(RED.has(k) || k.startsWith('_'), `${name}: היעד ${k} חוקי`);
      }
      console.log(`  [variant:${name}] keys=${Object.keys(raw).length} mapped=${report.mapped} merged=${report.merged} ui-state=${report.uiState} removed=${report.removed}`);
    }
  });

  it('עובדות השוואה היסטוריות נעולות: v21≡main (0 הבדלי ערכים); v20.4⊂main (תת-קבוצה)', () => {
    // Monster §: "IMUD-main ≡ Gold בהגדרות (keys+values, 0 הבדלים)" — נעילה מתוך הריפו
    const v21 = loadVariant(VARIANTS['v21-glm']);
    let valueDiffs = 0;
    for (const k of new Set([...Object.keys(v21), ...Object.keys(MAIN)])) {
      if (String(v21[k]) !== String(MAIN[k])) valueDiffs++;
    }
    assertEq(valueDiffs, 0, 'v21-glm ≡ main: אפס הבדלי מפתחות/ערכים (כמו בדוח ההשוואה)');
    // v20.4: "V20.3/V20.4 settings חתוכים" — כל מפתחיהם קיימים ב-main ללא שינוי ערכים
    const v204 = loadVariant(VARIANTS['v20.4-tip']);
    for (const k of Object.keys(v204)) {
      assert(k in MAIN, `v20.4⊂main: ${k}`);
      assertEq(String(v204[k]), String(MAIN[k]), `v20.4 ${k}: ערך זהה ל-main (חיתוך בלבד, לא שינוי)`);
    }
  });

  it('v19: המאפיינים ההיסטוריים שורדים — hdr-c-type=spear מגיע לפרופיל המורשת; שדות ההעלאה ב-ui-state', () => {
    const { settings } = importVariant(VARIANTS['v19-baseline']);
    // readConfig קורא hdr-c-type מה-JSON הגולמי — spear (עיטור חנית) מגיע למנוע.
    // הערה היסטורית: ב-v19 כותרות הזוגי/אי-זוגי עוד לא נפרדו (hdr-distinct-even-odd=false)
    const raw = settings['_imudRaw'];
    assertEq(raw['hdr-c-type'], 'spear', 'v19: hdr-c-type=spear (עיטור חנית) מגיע ל-readConfig');
    assertEq(raw['hdr-distinct-even-odd'], false, 'v19: hdr-distinct-even-odd=false (ההפרדה נוספה רק ב-main)');
    // שדות העלאת הקבצים (לא קיימים ב-main — רק ב-v19/makom) נשמרים, לא נזרקים
    const ui = settings['_legacy-ui-state'];
    assert('file-builder-main-svg' in ui, 'v19: file-builder-main-svg נשמר');
    assert('assets-folder-input' in ui, 'v19: assets-folder-input נשמר');
  });

  it('makom-bina: מחסניות הגופן העבריות נפתרות מול הקטלוג המוטמע; קונפיגורציית הכותרות שורדת', () => {
    const raw = loadVariant(VARIANTS['makom-bina-v20.5']);
    const { settings } = importVariant(VARIANTS['makom-bina-v20.5']);
    // המקור של התבנית משתמש בשמות משפחה עבריים ("'אלפא שחור', ...") — והם בקטלוג
    assert(raw['f-h0'].includes('אלפא שחור'), 'makom: מחסנית f-h0 בעברית (כמו במקור)');
    assert(AVAILABLE.has('אלפא שחור'), 'makom: אלפא שחור בקטלוג המוטמע');
    assertEq(settings['heading-0-font'], 'אלפא שחור', 'makom: המחסנית נפתרת למשפחה המוטמעת');
    // תבנית המשתמש קדם-הפרדת-כותרות: hdr-r=h1, hdr-l=h2, מרכז=spear — מגיע ל-readConfig
    assertEq(settings['_imudRaw']['hdr-r-type'], 'h1', 'makom: hdr-r-type=h1');
    assertEq(settings['_imudRaw']['hdr-l-type'], 'h2', 'makom: hdr-l-type=h2');
    assertEq(settings['_imudRaw']['hdr-c-type'], 'spear', 'makom: hdr-c-type=spear');
  });

  it('כל וריאנט מעמד ספר אמת ללא קריסה (פרופיל המורשת + שימור)', () => {
    for (const [name, f] of Object.entries(VARIANTS)) {
      const { settings } = importVariant(f);
      const r = typeset(CORPUS, settings, { noRecommendations: true });
      assert(r.legacyProfile === true, `${name}: פרופיל המורשת הופעל`);
      assert(r.contentPreserved === true, `${name}: שימור תוכן`);
      assert(r.pages.length > 0, `${name}: יש עמודים`);
      console.log(`  [variant:${name}] typeset: pages=${r.pages.length} hash=${r.layoutHash.slice(0, 12)}`);
    }
  });
});

report('source-variants');
