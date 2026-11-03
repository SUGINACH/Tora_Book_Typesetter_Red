// dump-page.js — בדיקת מבנה עמוד מהמנוע החי (אותו נתיב כמו run-ours.js)
const path = require('path');
const fs = require('fs');
const RB = path.join(__dirname, '..', 'red-build');
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getSettingDefs, getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const { registerFont } = require(path.join(RB, 'src/engine/typography/measure-api'));

function liveSettings() {
  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (!fs.existsSync(p)) continue;
    for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  const imp = importImudSettings(legacy, regKeys, { availableFonts: families });
  return imp.settings;
}

const text = fs.readFileSync(process.argv[2] || path.join(RB, '..', 'audits/no_long_test_text.txt'), 'utf8');
registerFont('Guttman Rashi', fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/Guttman-Rashi-Normal.ttf')));
const settings = { ...getDefaultSettings(), ...liveSettings(), 'body-font': 'Guttman Rashi', 'measure-impl': 'font-metrics' };
const result = typeset(text, settings, { noRecommendations: true });
const wantPage = parseInt(process.argv[3] || '11', 10);
const pg = result.pages[wantPage];
console.log('page', wantPage, 'type:', pg.type);
pg.columns.forEach((col, i) => {
  console.log('== col', i, '-', col.length, 'lines');
  for (const l of col) {
    const t = (l.words || []).join(' ');
    console.log('  y=' + (l.y || 0).toFixed(1) + ' ' + String(l.kind || '').padEnd(10) + ' p=' + String(l.paraId).padEnd(4) + ' win=' + (l.window ? 'Y' : '-') + ' ' + t.slice(0, 42));
  }
});
console.log('--- bands:');
for (const b of (pg.bands || [])) {
  console.log('  y=' + (b.y||0).toFixed(1) + ' h=' + (b.h||0).toFixed(1) + ' ' + (b.kind||'') + ' | ' + String(b.text||'').slice(0,40));
}
