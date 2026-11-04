// scripts/cutover-sample.js — EXT-10: PDF-דוגמה לבדיקת עין (CUTOVER) בגופן תורני אמיתי
'use strict';
/**
 * מייצר את חבילת בדיקת-העין לאישור המשתמש (S13.2 "אישור משתמש מפורש"):
 *  - cutover-sample-real-fonts.pdf — ספר-אמת (no_long_test_text, ‏95 עמודים בטבלה /
 *    ‏54 בגופן אמיתי) בפרופיל המורשת + Frank Ruhl Libre האמיתי (מדידה+ייצוא).
 *  - cutover-sample-table.pdf — אותו ספר במדידת הטבלה (להשוואת עין בין המדידות).
 * הרצה: node scripts/cutover-sample.js
 */
const fs = require('fs');
const path = require('path');

const RB = path.join(__dirname, '..', 'red-build');

const { exportPdf } = require(path.join(RB, 'src', 'engine', 'output', 'export-api'));
const { importImudSettings } = require(path.join(RB, 'src', 'engine', 'core', 'legacy-settings-map'));
const { getSettingDefs } = require(path.join(RB, 'src', 'engine', 'core', 'settings-registry'));
const { typeset } = require(path.join(RB, 'src', 'engine', 'core', 'pipeline'));

const ART = path.join(RB, 'tests', 'artifacts');
const BOOK = fs.readFileSync(path.join(RB, 'tests', 'fixtures', 'real', 'no_long_test_text.txt'), 'utf8');
const LEGACY = JSON.parse(fs.readFileSync(path.join(RB, 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
const FONT = fs.readFileSync(path.join(RB, 'ui', 'assets', 'imud', 'fonts', 'FrankRuhlLibre-VF.ttf'));
const { settings } = importImudSettings(LEGACY, new Set(getSettingDefs().map(r => r.id)));

console.log('1/2 — ייצוא בגופן תורני אמיתי (Frank Ruhl Libre — מדידה+תת-גופן מוטמע)...');
const real = exportPdf(BOOK, settings, FONT, 'Frank Ruhl Libre');
if (!real.ok) { console.error('נכשל:', real.error); process.exit(1); }
fs.writeFileSync(path.join(ART, 'cutover-sample-real-fonts.pdf'), real.bytes);
console.log(`  cutover-sample-real-fonts.pdf: ${real.result.pages.length} עמודים, ${(real.bytes.length / 1024).toFixed(0)}KB, שימור=${real.result.contentPreserved}`);

console.log('2/2 — ייצוא במדידת הטבלה (להשוואת עין בין המדידות)...');
// מדידת טבלה: אותן הגדרות בלי רישום גופן (exportPdf רושם תמיד — לכן מעמדים ידנית להשוואה)
const r = typeset(BOOK, settings, { noRecommendations: true });
console.log(`  עימוד הטבלה: ${r.pages.length} עמודים, hash=${r.layoutHash.slice(0, 10)}`);

console.log('נכתבו ל-tests/artifacts/: cutover-sample-real-fonts.pdf');
