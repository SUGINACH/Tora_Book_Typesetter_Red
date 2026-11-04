// tests/integration/setting-sets.test.js — EXT-14: ערכות סגנון-ספר מהמקור (setting_sets)
'use strict';

/**
 * סגירת שארית EXT-14 (05.11): "הטמעת ערכות נושא שלמות (theme-sets) מקבצי ה-shaar"
 * — בפועל מדובר בערכות הגדרות-ספר מלאות מהמקור: setting_sets/תלמוד|פרשנות|קונטרס.json
 * (249 מפתחות; המקור החליף ביניהן דרך הדרופדאון style-set-select ב-settings-manager.js).
 *
 * החוזה כאן: כל ערכה עוברת את **אותה** טבלת disposition של importImudSettings —
 * אין מסלול ייבוא מיוחד. ההבדלים חייבים להגיע למנוע בנתיב שבו הם חיים:
 *  - פרופיל המורשת נצמד לגיאומטריה **המדודה מקובצי הייחוס** (החלטה מתועדת —
 *    הייחוס הוא המפרט; הגדלות/שוליים פרמטריים אינם משנים אותה). שם מוכח
 *    ההבדל המוצרך: show-back-shaar=false ⇒ אין עמוד שער-אחורי בכל הערכות
 *    (מול ברירת המחדל שכן מכניסה אותו).
 *  - נתיב ה-DP: ההבדלים הפרמטריים (s-h0=22/24/30 ⇒ heading-0-size-pt) חיים
 *    ומייצרים שלוש פריסות שונות בפועל (hash שונה) — ההטמעה אמיתית, לא קישוט.
 */

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getDefaultSettings, getSettingDefs } = require('../../src/engine/core/settings-registry');
const { typeset } = require('../../src/engine/core/pipeline');

const ASSETS = path.join(__dirname, '..', '..', 'ui', 'assets', 'imud');
const SETS_DIR = path.join(ASSETS, 'setting_sets');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
const AVAILABLE = new Set(CATALOG.map(e => e.family));
const SETS = ['תלמוד', 'פרשנות', 'קונטרס'];
const CORPUS = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'imud_default_text.txt'), 'utf8');

const loadSet = (name) => JSON.parse(fs.readFileSync(path.join(SETS_DIR, `${name}.json`), 'utf8'));
const importSet = (name) => importImudSettings(
  loadSet(name),
  new Set(getSettingDefs().map(r => r.id)),
  { availableFonts: AVAILABLE }
);

describe('EXT-14 — ערכות סגנון-ספר מהמקור: הטמעה + ייבוא lossless', () => {
  it('שלוש הערכות מוטמעות בריפו (249 מפתחות כמו במקור)', () => {
    for (const name of SETS) {
      const p = path.join(SETS_DIR, `${name}.json`);
      assert(fs.existsSync(p), `הערכה מוטמעת: ${name}.json`);
      const set = loadSet(name);
      assertEq(Object.keys(set).length, 249, `${name}: 249 מפתחות כמו במקור`);
    }
  });

  it('ייבוא lossless לכל ערכה: אף מפתח לא נותר ללא החלטה; ערכי UI נשמרים', () => {
    for (const name of SETS) {
      const set = loadSet(name);
      const { settings, unmapped, report, uiState } = importSet(name);
      assertEq(unmapped, [], `${name}: אף מפתח לא unmapped`);
      assertEq(report.mapped + report.merged + report.uiState + report.removed, Object.keys(set).length,
        `${name}: הספירה מכסה הכול`);
      assert(Object.keys(uiState).length === report.uiState, `${name}: ערכי uiState נשמרים כערכים`);
      assert(settings['_legacy-ui-state'], `${name}: _legacy-ui-state קיים`);
      // שדות העלאת-הקבצים של הערכות (file-*/assets-folder-input — לא ב-default_settings)
      // מקבלים disposition מכלל המשפחה וערכיהם נשמרים, לא נזרקים
      assert(settings['_legacy-ui-state']['assets-folder-input'] === set['assets-folder-input'],
        `${name}: assets-folder-input נשמר ב-ui-state`);
      assert(settings['_legacy-ui-state']['file-sec-div-img'] === set['file-sec-div-img'],
        `${name}: file-sec-div-img נשמר ב-ui-state`);
      console.log(`  [set:${name}] mapped=${report.mapped} merged=${report.merged} ui-state=${report.uiState} removed=${report.removed}`);
    }
  });

  it('הבדלי העיצוב שורדים את הייבוא בנתיב שבו הם חיים', () => {
    // תלמוד: H0=22, בלי שער אחורי, יישור שורה אחרונה לימין
    const t = importSet('תלמוד').settings;
    assertEq(t['heading-0-size-pt'], 22, 'תלמוד: s-h0=22 ⇒ heading-0-size-pt');
    assertEq(t['shaar-back-enabled'], false, 'תלמוד: show-back-shaar=false ⇒ shaar-back-enabled');
    assertEq(t['body-last-line-align'], 'right', 'תלמוד: יישור אחרון ימינה');
    // פרשנות: H0=24, בלי פתיחת-חלק באי-זוגי (odd-h1 מוצרך בפרופיל המורשת
    // מה-JSON הגולמי _imudRaw — readConfig b('odd-h1') — לא ממפתח RED)
    const p = importSet('פרשנות').settings;
    assertEq(p['heading-0-size-pt'], 24, 'פרשנות: s-h0=24');
    assertEq(p['_imudRaw']['odd-h1'], false, 'פרשנות: odd-h1=false מגיע לפרופיל המורשת (_imudRaw)');
    assertEq(p['_legacy-ui-state']['odd-h1'], false, 'פרשנות: odd-h1=false נשמר גם ב-ui-state');
    // קונטרס: H0=30 (כותרות גדולות)
    const k = importSet('קונטרס').settings;
    assertEq(k['heading-0-size-pt'], 30, 'קונטרס: s-h0=30');
    // הפרדה ברורה: גדלי H0 שונים בין שלוש הערכות
    const sizes = SETS.map(n => Number(importSet(n).settings['heading-0-size-pt'])).sort((a, b) => a - b);
    assertEq(sizes, [22, 24, 30], '22 (תלמוד) / 24 (פרשנות) / 30 (קונטרס)');
  });

  it('נתיב המורשת: ההבדל המוצרך מגיע לפריסה — בלי עמוד שער-אחורי בכל הערכות', () => {
    // ברירת המחדל המלאה מכניסה שער-אחורי (show-back-shaar=true)
    const base = typeset(CORPUS, importImudSettings(
      JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8')),
      new Set(getSettingDefs().map(r => r.id))
    ).settings, { noRecommendations: true });
    assert(base.legacyProfile === true, 'פרופיל המורשת הופעל (ברירת המחדל)');
    const baseBack = base.pages.filter(p => p.type === 'shaar-back').length;
    assert(baseBack >= 1, `ברירת המחדל: יש עמוד שער-אחורי (${baseBack})`);

    // הערכות: show-back-shaar=false ⇒ אין שער-אחורי — ההבדל מוכח מבנית
    for (const name of SETS) {
      const { settings } = importSet(name);
      const r = typeset(CORPUS, settings, { noRecommendations: true });
      assert(r.legacyProfile === true, `${name}: פרופיל המורשת`);
      assert(r.contentPreserved === true, `${name}: שימור תוכן`);
      const back = r.pages.filter(p => p.type === 'shaar-back').length;
      assertEq(back, 0, `${name}: אין עמוד שער-אחורי (show-back-shaar=false מגיע לפריסה)`);
      assert(r.layoutHash !== base.layoutHash, `${name}: פריסה שונה מברירת המחדל`);
      console.log(`  [set:${name}] legacy: pages=${r.pages.length} hash=${r.layoutHash.slice(0, 12)} back-shaar=0`);
    }
  });

  it('נתיב ה-DP: ההבדלים הפרמטריים (גודל H0) מייצרים שלוש פריסות שונות', () => {
    // הסרת סמני הפרופיל המורשת — הערכות נבדקות במנוע העימוד הכללי,
    // שבו heading-0-size-pt חי ומשפיע על שבירת השורות ועל מספר העמודים.
    const hashes = new Map();
    for (const name of SETS) {
      const { settings } = importSet(name);
      const dp = { ...settings };
      delete dp['_layout-profile']; delete dp['_imudRaw'];
      const r = typeset(CORPUS, dp, { noRecommendations: true });
      assert(r.contentPreserved === true, `${name}: שימור תוכן (DP)`);
      hashes.set(name, r.layoutHash);
      console.log(`  [set:${name}] DP: pages=${r.pages.length} hash=${r.layoutHash.slice(0, 12)} h0=${dp['heading-0-size-pt']}pt`);
    }
    assertEq(new Set(hashes.values()).size, SETS.length, 'שלוש פריסות שונות — ההבדלים הפרמטריים חיים');
  });
});

report('setting-sets');
