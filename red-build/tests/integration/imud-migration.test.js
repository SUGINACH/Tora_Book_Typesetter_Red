// tests/integration/imud-migration.test.js — S4.5-ד: מיפוי default_settings.json של המקור (03.11)
'use strict';

/**
 * שער קבלה חדש (ביקורת 03.11, סקירה 2): כל מפתח בקובץ ההגדרות המקורי של IMUD_TORANI
 * מקבל disposition מפורש (mapped/merged/ui-state/removed+סיבה) — אין "לא מוכר".
 * הקובץ האמיתי (264 מפתחות) הועתק לתוך המאגר כ-fixture מחייב; הבדיקה טוענת אותו
 * ולא מסתפקת בדוגמאות מצומצמות.
 */

const { describe, it, assert, assertEq, report } = require('../harness');
const fs = require('fs');
const path = require('path');
const { importImudSettings, dispositionOf, DISPOSITIONS } = require('../../src/engine/core/legacy-settings-map');
const { getDefaultSettings, getSettingDefs, findKey } = require('../../src/engine/core/settings-registry');

const LEGACY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'imud_default_settings.json'), 'utf8'));
const RED_KEYS = new Set(getSettingDefs().map(r => r.id));

describe('S4.5-ד: מיפוי default_settings.json המקורי — 100% disposition', () => {
  it('לכל מפתח בקובץ האמיתי יש disposition מפורש או כלל משפחה מנומק', () => {
    const missing = Object.keys(LEGACY).filter(k => !dispositionOf(k));
    assertEq(missing, [], `מפתחות בלי disposition: ${missing.join(', ')}`);
  });

  it('ייבוא מלא: אין unmapped; כל מפתח היעד קיים ברישום RED (מפתחות פנימיים _ מותרים)', () => {
    const { settings, unmapped, report, uiState } = importImudSettings(LEGACY, RED_KEYS);
    assertEq(unmapped, [], 'אף מפתח לא נותר ללא החלטה');
    for (const k of Object.keys(settings)) {
      assert(RED_KEYS.has(k) || k.startsWith('_'), `היעד ${k} קיים ברישום RED או מפתח פנימי מתועד`);
    }
    // פירוט כמותי — מתועד בפלט:
    console.log(`  dispositions: mapped=${report.mapped} merged=${report.merged} ui-state=${report.uiState} removed=${report.removed} (מתוך ${Object.keys(LEGACY).length})`);
    assert(report.mapped >= 35, 'מיפויי-ערך מהותיים (טיפוגרפיה/מזהים/מספור) — לא רק סיווג UI');
    assert(report.mapped + report.merged + report.uiState + report.removed === Object.keys(LEGACY).length, 'הספירה מכסה את כל המפתחות');
    // **S4.6 (ביקורת 3):** ערכי ui-state נשמרים — לא רק נספרים (בעבר אובדן שקט של 186 ערכים)
    assert(Object.keys(uiState).length === report.uiState, 'אובייקט uiState מכיל בדיוק את ערכי מצב ה-UI');
    assert(settings['_legacy-ui-state'] && settings['_legacy-ui-state']['inp-book-desc'] === LEGACY['inp-book-desc'], 'ערכי UI מוטמעים ב-_legacy-ui-state');
  });

  it('ערכי המקור מוחלים במדויק (בדיקות נקודתיות מהביקורת)', () => {
    const { settings } = importImudSettings(LEGACY, RED_KEYS);
    assertEq(settings['body-font'], 'Guttman Rashi', 'font-body ⇒ משפחה ראשונה');
    assertEq(settings['body-font-size-pt'], 12, 'size-body=12 (לא 14 — המקור מוחל)');
    assertEq(settings['body-line-height'], 1.34, 'line-height-body=1.34');
    assertEq(settings['first-word-mode'], 'drop', 'drop-word-mode=window ⇒ drop');
    assertEq(settings['first-word-font'], 'FrankReal', 'font-first-word ⇒ FrankReal (מפתח חדש)');
    assertEq(settings['first-word-size-em'], 1.5, 'size-first-word=1.5 (מפתח חדש)');
    assertEq(settings['first-word-threshold-lines'], 2, 'drop-word-min-lines=2');
    assertEq(settings['dh-auto-detect'], false, 'auto-dh=false (המקור — לא true)');
    assertEq(settings['en-line-prefix'], 'הערת סיום -', 'מזהה הערות הסיום');
    assertEq(settings['fn-delim-open'], '[', 'תוחם פתיחה');
    assertEq(settings['fn-delim-close'], ']', 'תוחם סגירה');
    assertEq(settings['footnote-separator-rule'], 'star', 'note-rule-style=star');
    assertEq(settings['runt-min-width-pct'], 20, 'avoid-runt-word=true ⇒ 20%');
    assertEq(settings['heading-7-mode'], 'side-note', 'mode-h7=side_note');
    assertEq(settings['show-shaar-sub'], true, 'mode-h1=sub_shaar ⇒ שערי משנה דלוקים');
    assertEq(settings['page-num-format'], 'gematria', 'מספור גימטריה');
    assert(settings['h2-top-offset'] > 150, `h2-top-distance 22% ⇒ ~229px (קיבלנו ${settings['h2-top-offset']})`);
    // **S4.6 (ביקורת 3):** הגדרות עיצוב שסווגו בטעות כ-ui-state מגיעות עכשיו למנוע
    assertEq(settings['heading-0-font'], 'AlphaBlack', 'f-h0 ⇒ heading-0-font (משפחה ראשונה)');
    assertEq(settings['heading-0-size-pt'], 26, 's-h0=26 ⇒ heading-0-size-pt');
    assertEq(settings['heading-2-size-pt'], 17, 's-h2=17 ⇒ heading-2-size-pt');
    assertEq(settings['f-note-body-font'], 'Frank Ruhl Libre', 'f-note-body ⇒ f-note-body-font');
    assertEq(settings['header-recto-right-font'], 'Livorna', 'f-hdr-r ⇒ header-recto-right-font');
    assertEq(settings['header-recto-right-size-pt'], 15, 's-hdr-r=15 ⇒ header-recto-right-size-pt');
    assertEq(settings['header-verso-right-font'], 'Livorna', 'f-hdr-verso-r ⇒ header-verso-right-font');
    assertEq(settings['imud-book-title'], 'ספר מלכי המלוכה', 'inp-book-title ⇒ imud-book-title (נצרך בשער)');
    // h2-title-orn-mode=none בקובץ המלא: המפתח הישיר h2-orn-scope=both גובר (קדימות מפורשת);
    // שימור ה-none עצמו נבדק להלן על אובייקט מינימלי בלי המפתח הישיר.
    const soloNone = importImudSettings({ 'h2-title-orn-mode': 'none' }, RED_KEYS);
    assertEq(soloNone.settings['h2-orn-scope'], 'none', 'h2-title-orn-mode=none (בלי מפתח ישיר) ⇒ none — לא both (בעבר היפוך ההגדרה)');
  });

  it('S4.6: pctToPx לפי גיאומטריה אמיתית — contentHeightPx מועבר ב-opts', () => {
    const a = importImudSettings({ 'h2-top-distance': '22%' }, null, { contentHeightPx: 1027 });
    assertEq(a.settings['h2-top-offset'], 226, '22% מ-1027px (גובה תיבת A4 בפועל) ⇒ 226');
    const b = importImudSettings({ 'h2-top-distance': '22%' }, null, {});
    assertEq(b.settings['h2-top-offset'], 229, 'ברירת מחדל 1040 ⇒ 229 (תאימות לאחור)');
  });

  it('S4.6: round-trip שלם — הגדרות מיובאות + ערכי UI שורדים מיזוג וטעינה חוזרת', () => {
    const { mergeWithDefaults } = require('../../src/engine/output/project-io');
    const imp = importImudSettings(LEGACY, RED_KEYS);
    const { merged, unknownKeys } = mergeWithDefaults(imp.settings);
    assertEq(unknownKeys, [], 'אין מפתחות לא מוכרים לאחר המיפוי (מפתחות _ פנימיים — לא "לא מוכרים")');
    assert(merged['_legacy-ui-state'] && merged['_legacy-ui-state']['dim-h2-top-w'] === '65%', 'ערכי ה-UI שורדים את המיזוג (לא אובדים)');
    assertEq(merged['body-font-size-pt'], 12, 'הערך המיובא גובר על ברירת המחדל');
  });

  it('ההגדרות המיובאות עוברות מיזוג מלא עם ברירות המחדל של RED (round-trip)', () => {
    const { mergeWithDefaults } = require('../../src/engine/output/project-io');
    const { settings } = importImudSettings(LEGACY, RED_KEYS);
    const { merged, unknownKeys } = mergeWithDefaults(settings);
    assertEq(unknownKeys, [], 'אין מפתחות לא מוכרים לאחר המיפוי');
    assertEq(merged['body-font-size-pt'], 12, 'הערך המיובא גובר על ברירת המחדל');
    assertEq(merged['en-line-prefix'], 'הערת סיום -');
    // המנוע רץ עם ההגדרות המיובאות בלי קריסה:
    const { typeset } = require('../../src/engine/core/pipeline');
    const r = typeset('ספר - בדיקת ייבוא\n\nכותרת 2 - סימן\nפסקה לבדיקה עם [הערה] בתוכה.\nהערת סיום - הערת סיום רגילה.', merged);
    assert(r.contentPreserved === true, 'שימור תוכן תחת הגדרות המקור');
  });

  it('החלטות הסרה מנומקות — כל removed כולל סיבה והפניית מעקב', () => {
    for (const [k, d] of Object.entries(DISPOSITIONS)) {
      if (d.kind === 'removed') {
        assert(d.reason && d.reason.length > 10, `${k}: סיבת הסרה מנומקת`);
        assert(d.issue, `${k}: הפניית מעקב (issue)`);
      }
    }
  });
});

report('imud-migration');
