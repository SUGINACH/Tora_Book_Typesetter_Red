// tests/e2e/d89-visual-fixes.test.js — בדיקות רגרסיה לתיקוני העין של D-89
'use strict';
/**
 * ארבעת התסמינים מדיווח המשתמש על cutover-sample-real-fonts.pdf:
 *  1. "כל מילה שצמודה לנקודה מופיעה בגופן קטן" — הביטוי /^[א-ת]+\.$/ תפס
 *     סופי-משפט (744 מילים בקורפוס). כעת: markerIdx מהמודל בלבד + ולידציית צורה.
 *  2. "בהערות השוליים יש מילים אחת על השניה" — baselineY אחד לכל ההערה.
 *     כעת: בסיס פר-שורה + יישור כמו הייחוס (עמ' 31: שורה-1 מיושבת עד הסמן,
 *     שורה-2 מיושרת-ימין ברוחב מלא).
 *  3. "כיוון הסוגריים בכל המופעים הפוך" — אין שיקוף bidi. כעת: visualOrderRtl
 *     (שיקוף UAX#9 + ריצות LTR שלמות). בנוסף: הטלפון 052-7666666 הוצג הפוך.
 *  4. "אין שערים" — פאנלים/גל/מסגרת/כלל-כותרת לא תוכננו כלל. כעת: D-89 design,
 *     מכויל מהייחוס (עמ' 1/2/7) ומה-CSS של המקור.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { typeset } = require('../../src/engine/core/pipeline');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getSettingDefs } = require('../../src/engine/core/settings-registry');
const { projectLegacyDocument, projectLegacyPage } = require('../../src/engine/output/legacy-projector');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');
const { visualOrderRtl, BRACKET_MIRROR } = require('../../src/engine/output/pdf-writer');
const { exportPdf } = require('../../src/engine/output/export-api');

const RB = path.join(__dirname, '..', '..');
const IMUD_RAW = JSON.parse(fs.readFileSync(path.join(RB, 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
const FONT = fs.readFileSync(path.join(RB, 'ui', 'assets', 'imud', 'fonts', 'FrankRuhlLibre-VF.ttf'));
const BOOK = fs.readFileSync(path.join(RB, 'tests', 'fixtures', 'real', 'no_long_test_text.txt'), 'utf8');

let pass = 0, fail = 0;
const failures = [];
function assertEq(actual, expected, label) {
  if (actual === expected) { pass++; return; }
  fail++; failures.push(`${label}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
}
function assert(cond, label) {
  if (cond) { pass++; return; }
  fail++; failures.push(label);
}
function it(name, fn) {
  try { fn(); } catch (e) { fail++; failures.push(`${name}: ${e.message}`); }
}

function legacySettings(overrides) {
  const reg = new Set(getSettingDefs().map(r => r.id));
  const { settings } = importImudSettings(IMUD_RAW, reg, {});
  return { ...settings, ...(overrides || {}) };
}

// ============ 3+5. visualOrderRtl — שיקוף סוגריים וריצות LTR ============
it('D-89/3: סוגריים משוקפים בהקשר RTL — "(ויש" מצויר ויזואלית ש,י,ו,)', () => {
  assertEq(visualOrderRtl([...('(ויש')]).join(''), 'שיו)');
});
it('D-89/3: סוגר סוגר משוקף — "ברא)" מצויר (,א,ר,ב', () => {
  assertEq(visualOrderRtl([...'ברא)']).join(''), '(ארב');
});
it('D-89/3: מראה מלאה — לכל זוג, התו המצויר הוא התאום', () => {
  assertEq(BRACKET_MIRROR['('], ')');
  assertEq(BRACKET_MIRROR[')'], '(');
  assertEq(BRACKET_MIRROR['['], ']');
});
it('D-89/5: מספר טלפון 052-7666666 נשאר בסדר קריאה (לא 6666667-250)', () => {
  assertEq(visualOrderRtl([...('052-7666666')]).join(''), '052-7666666');
});
it('D-89/5: מספרים עם פיסוק ביניים ועוקב — 1.5 ו-1.5% נשארים שלמים', () => {
  assertEq(visualOrderRtl([...('1.5')]).join(''), '1.5');
  assertEq(visualOrderRtl([...('1.5%')]).join(''), '1.5%');
});
it('D-89/5: נקודת סוף-משפט אחרי מספר נשארת בזרימת ה-RTL (שמאל למספר)', () => {
  assertEq(visualOrderRtl([...('2024.')]).join(''), '.2024');
});
it('D-89 (רגרסיה): עברית טהורה — היפוך מלא כמו קודם', () => {
  assertEq(visualOrderRtl([...'שלום']).join(''), 'םולש');
});
it('D-89 (רגרסיה): מילה עם גרשיים — בע"מ', () => {
  assertEq(visualOrderRtl([...'בע"מ']).join(''), 'מ"עב');
});

// ============ 2. הערות רב-שורתיות — בסיס פר-שורה ============
it('D-89/2: לכל שורת הערה בסיס משלה; אין ערימת שורות (הערה רב-שורתית)', () => {
  const S = { ...legacySettings(), 'body-font': 'Frank Ruhl Libre', 'measure-impl': 'font-metrics' };
  const r = typeset(BOOK, S, { noRecommendations: true });
  const proj = projectLegacyDocument(r, S);
  let multiChecked = 0;
  for (const pg of proj.pages) {
    for (const fn of pg.footnotes) {
      if (!fn.words || !fn.words.length) continue;
      if (fn.h / 16.7 < 2) continue; // רק הערות רב-שורתיות
      multiChecked++;
      const bases = [...new Set(fn.words.map(w => w.baselineY))].sort((a, b) => a - b);
      assert(bases.length >= 2, `הערה רב-שורתית עם בסיס יחיד — ערימה! (בסיסים: ${bases.length})`);
      for (let i = 1; i < bases.length; i++) {
        assert(Math.abs(bases[i] - bases[i - 1] - 16.7) < 0.6, `פס שורות הערה שבור: ${(bases[i] - bases[i - 1]).toFixed(2)}px (צפה 16.7)`);
      }
      // השורה הראשונה נגרעת מרוחב הסמן: המילה הימנית ביותר של שורה 2 ימנית משל שורה 1
      const l1 = fn.words.filter(w => Math.abs(w.baselineY - bases[0]) < 0.3);
      const l2 = fn.words.filter(w => Math.abs(w.baselineY - bases[bases.length - 1]) < 0.3 && Math.abs(w.baselineY - bases[0]) > 0.3);
      if (l1.length && l2.length) {
        const r1 = Math.max(...l1.map(w => w.x + w.w));
        const r2 = Math.max(...l2.map(w => w.x + w.w));
        assert(r2 >= r1 - 0.5, 'שורה 2 נפתחת מהשפה הימנית המלאה (לא נגרעת מרוחב הסמן)');
      }
    }
  }
  assert(multiChecked > 0, 'נבדקה לפחות הערה רב-שורתית אחת (הקורפוס מכיל)');
});

// ============ 1. סמני הערה — מוקטנים רק מהמודל (בדיקת יחידה על המקרן) ============
it('D-89/1: המקרן מקטין רק סמן-מודל (markerIdx) — לא מילת-סוף-משפט ולא מספור איות', () => {
  const S = legacySettings();
  const api = new MeasureAPI(S);
  const fakePage = {
    index: 0, type: 'regular', folioDisplay: '',
    bands: [], gateLines: [], marginNotes: [], footnotes: [],
    headerSlots: null, columns: [[
      { words: ['מילה', 'כרשותו.', 'בק.', 'א.', 'עוד'], kind: 'body', y: 107.2, heightPx: 21.44, sizePt: 12, isLast: false,
        parenFlags: [false, false, false, false, false], markerIdx: [2] },
      { words: ['בתוך', 'הסוגריים', 'כאן'], kind: 'body', y: 128.64, heightPx: 21.44, sizePt: 12, isLast: false,
        parenFlags: [true, true, true] }
    ], []],
    decorations: []
  };
  const proj = projectLegacyPage(fakePage, S, api);
  const l1 = proj.lines.find(l => l.words && l.words.some(w => w.text === 'כרשותו.'));
  assert(l1, 'שורת הגוף הוקרנה');
  const byText = {};
  for (const w of l1.words) (byText[w.text] = byText[w.text] || []).push(w);
  assertEq(byText['מילה'][0].sizePt, 12, 'מילה רגילה — גודל גוף');
  assertEq(byText['כרשותו.'][0].sizePt, 12, 'מילת-סוף-משפט — גודל גוף (הבאג הישן הקטין ל-8)');
  assertEq(byText['בק.'][0].sizePt, 8, 'סמן-מודל אמיתי (markerIdx) — 8pt');
  assertEq(byText['א.'][0].sizePt, 12, 'מספור איות (א. בלי דגל) — גודל גוף (כמו הייחוס: 91 סמנים ב-12pt)');
  const l2 = proj.lines.find(l => l.words && l.words.some(w => w.text === 'הסוגריים'));
  assertEq(l2.words[1].sizePt, 10, 'מילה בסוגריים — 10pt (כמו הייחוס; לגיטימי)');
});

it('D-89/1 (אינטגרציה): כל מילה שאינה סמן-מודל ואינה בסוגריים — בגודל הגוף המלא', () => {
  const S = { ...legacySettings(), 'body-font': 'Frank Ruhl Libre', 'measure-impl': 'font-metrics' };
  const r = typeset(BOOK, S, { noRecommendations: true });
  const proj = projectLegacyDocument(r, S);
  let checked = 0; const violations = [];
  for (let pi = 0; pi < r.pages.length; pi++) {
    const projQ = new Map();
    for (const pl of proj.pages[pi].lines) {
      if (!pl.words || !pl.words.length) continue;
      const key = pl.words.map(w => w.text).join('\u0001');
      if (!projQ.has(key)) projQ.set(key, []);
      projQ.get(key).push(pl);
    }
    for (const col of r.pages[pi].columns) {
      for (const ln of col) {
        if (!ln.words || !ln.words.length) continue;
        const key = ln.words.join('\u0001');
        const q = projQ.get(key);
        if (!q || !q.length) continue;
        const pl = q.shift();
        const markerSet = new Set(Array.isArray(ln.markerIdx) ? ln.markerIdx : []);
        for (let wi = 0; wi < ln.words.length; wi++) {
          const inParen = ln.parenFlags && ln.parenFlags[wi];
          const pw = pl.words[wi];
          if (!pw) continue;
          checked++;
          if (!inParen && !markerSet.has(wi) && pw.sizePt < (ln.sizePt || 12) - 0.5) {
            violations.push(`p${pi + 1} "${ln.words[wi]}" ${pw.sizePt}pt בשורת ${ln.sizePt}pt`);
          }
        }
      }
    }
  }
  assert(checked > 5000, `נבדקו מספיק מילים מול דגלי המודל (${checked})`);
  assertEq(violations.length, 0, `אפס מילים מוקטנות שלא כחוק (בעבר: 744). דוגמאות: ${violations.slice(0, 3).join(' | ')}`);
});

// ============ 4. עיצוב שערים + כלל כותרת ============
it('D-89/4: שער-משנה — פאנל מ-55% וגל; שער אחורי — פאנל שמאלי; ראשי — מסגרת; גוף — כלל כותרת', () => {
  const S = legacySettings();
  const r = typeset(BOOK, S, { noRecommendations: true });
  const sub = r.pages.find(p => p.type === 'shaar-sub');
  const back = r.pages.find(p => p.type === 'shaar-back');
  const main = r.pages.find(p => p.type === 'shaar-main');
  assert(sub && back && main, 'שלושת עמודי השער קיימים');
  const subPanel = (sub.decorations || []).find(d => d.kind === 'shaar-panel');
  assert(subPanel, 'פאנל שער-משנה');
  assert(Math.abs(subPanel.x - 0.55 * 793.7) < 1 && Math.abs(subPanel.w - 0.45 * 793.7) < 1, 'פאנל משנה: 55%..100% (כמו הייחוס: 328-595pt)');
  const wave = (sub.decorations || []).find(d => d.kind === 'shaar-divider');
  assert(wave && wave.kindStyle === 'shaar-wave', 'גל השער-משנה בין הכותרות');
  assert(Math.abs(wave.x + wave.w / 2 - 245.7) < 1, 'הגל ממורכז בתיבת התוכן (245.7px)');
  const backPanel = (back.decorations || []).find(d => d.kind === 'shaar-panel');
  assert(backPanel && backPanel.x === 0 && Math.abs(backPanel.w - 0.45 * 793.7) < 1, 'פאנל שער אחורי: 0..45% (כמו הייחוס: 0-268pt)');
  const frameKinds = (main.decorations || []).filter(d => String(d.kind).startsWith('frame'));
  assertEq(frameKinds.length, 8, 'מסגרת שער ראשי: 2 אנכיים + 2 פסים + 2 שרשראות-עלים + 2 כללים');
  const chains = (main.decorations || []).filter(d => d.kind === 'frame-chain');
  assertEq(chains.length, 2, 'שרשרת העלים בשני צידי המסגרת (דפוס הנושא של הייחוס)');
  const bodyPg = r.pages.find(p => p.type === 'regular' && p.headerSlots);
  const rule = (bodyPg.decorations || []).find(d => d.kind === 'hdr-rule');
  assert(rule && Math.abs(rule.y - 82.67) < 0.5 && Math.abs(rule.x - 57.33) < 0.5, 'כלל כותרת (43,62)pt כמו הייחוס');
  // הקרנה: pdfOps אמיתיים לפאנל ולגל
  const proj = projectLegacyDocument(r, S);
  const subIdx = r.pages.findIndex(p => p.type === 'shaar-sub');
  const projSub = proj.pages[subIdx];
  const pdPanel = (projSub.decorations || []).find(d => d.kind === 'shaar-panel');
  assert(pdPanel && pdPanel.pdfOps && pdPanel.pdfOps.length === 1 && pdPanel.pdfOps[0].includes('0.96 0.96 0.96 rg'), 'פאנל ⇒ פעולת PDF אחת בצבע #F4F4F4');
  const pdWave = (projSub.decorations || []).find(d => d.kind === 'shaar-divider');
  assert(pdWave && pdWave.inkType === 'svg' && pdWave.pdfOps && pdWave.pdfOps.length > 4, 'גל ⇒ פעולות וקטוריות');
});

it('D-89/4: תיבות השערים — כותרת-משנה ממורכזת ב-184pt, בלוקי שער אחורי ב-411pt (כמו הייחוס)', () => {
  const S = legacySettings();
  const r = typeset(BOOK, S, { noRecommendations: true });
  const proj = projectLegacyDocument(r, S);
  const subIdx = r.pages.findIndex(p => p.type === 'shaar-sub');
  const backIdx = r.pages.findIndex(p => p.type === 'shaar-back');
  const gates = proj.pages[subIdx].lines.filter(l => l.kind === 'gate');
  // **S6.3:** גודל הכותרת מההגדרות (s-h1=50 בברירות המחדל של המקור; היה
  // 36 מכויל-ייחוס) — בקשת משתמש מפורשת לחבר את ההגדרות.
  const title = gates.find(l => l.sizePt === 50);
  assert(title && title.words.length, 'כותרת השער הוקרנה');
  const x0 = Math.min(...title.words.map(w => w.x));
  const x1 = Math.max(...title.words.map(w => (w.x || 0) + (w.w || 0)));
  const centerPt = ((x0 + x1) / 2) * 0.75;
  assert(Math.abs(centerPt - 184.2) < 3, `כותרת המשנה ממורכזת ב-184pt (בפועל ${centerPt.toFixed(1)})`);
  const bg = proj.pages[backIdx].lines.filter(l => l.kind === 'gate' && l.words && l.words.length);
  assert(bg.length > 0, 'בלוקי השער האחורי הוקרנו');
  const bx0 = Math.min(...bg.flatMap(l => l.words.map(w => w.x)));
  const bx1 = Math.max(...bg.flatMap(l => l.words.map(w => (w.x || 0) + (w.w || 0))));
  const bCenterPt = ((bx0 + bx1) / 2) * 0.75;
  assert(Math.abs(bCenterPt - 411) < 4, `בלוקי השער האחורי ממורכזים ב-411pt (בפועל ${bCenterPt.toFixed(1)})`);
});

// ============ PDF חי: טלפון + סוגריים + דטרמיניזם ============
it('D-89/3+5 (PDF בפועל): הטלפון נחלץ קריא; מאזן סוגריים; ייצוא כפול ⇒ בתים זהים', () => {
  if (typeof Buffer === 'undefined') { console.error('  [מדלג — Node]'); return; }
  let HAS = true;
  try { execFileSync('pdftotext', ['-v'], { stdio: 'pipe' }); } catch (e) { HAS = false; }
  if (!HAS) { console.error('  [מדלג — poppler לא במערכת]'); return; }
  const S = { ...legacySettings(), 'body-font': 'Frank Ruhl Libre', 'measure-impl': 'font-metrics' };
  const res = exportPdf(BOOK, S, FONT, 'Frank Ruhl Libre');
  assert(res.ok, 'ייצוא עבר: ' + (res.error || ''));
  const tmp = path.join(__dirname, '..', 'artifacts', 'd89-check.pdf');
  fs.writeFileSync(tmp, res.bytes);
  const txt = execFileSync('pdftotext', [tmp, '-'], { encoding: 'utf8' });
  assert(txt.includes('052-7666666'), 'מספר הטלפון קריא ב-PDF (052-7666666)');
  assert(!txt.includes('6666667-250'), 'הטלפון כבר לא מוצג הפוך');
  const open = (txt.match(/\(/g) || []).length;
  const close = (txt.match(/\)/g) || []).length;
  assertEq(open, close, 'מאזן סוגריים בחילוץ');
  const res2 = exportPdf(BOOK, S, FONT, 'Frank Ruhl Libre');
  assert(res2.ok && res2.bytes.equals(res.bytes), 'ייצוא כפול ⇒ בתים זהים');
});

// ============ סיכום ============
console.log(`\n== d89-visual-fixes: ${pass}/${pass + fail} passed, ${fail} failed ==`);
for (const f of failures) console.error('  FAIL:', f);
if (fail > 0) process.exit(1);
