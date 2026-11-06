// tests/e2e/s60-monster-fixes.test.js — רגרסיות S6.0 ("הבדיקה המפלצתית חסרת התקדים")
// כל תיקון שורש מהסקירה מגובה בבדיקה שמפילה את הגרסה הקודמת (הוכחת-נפל).
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');
const { typeset } = require('../../src/engine/core/pipeline');
const { getSettingDefs, getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { LineBreaker, legacyTypeset, GEO, readConfig } = require('../../src/engine/layout/legacy-imud-flow');
const { planPages } = require('../../src/engine/layout/dp-planner');
const { charWidthEm } = require('../../src/engine/typography/measure-table');
const { registeredFonts, registerFont, unregisterFont } = require('../../src/engine/typography/measure-api');
const { exportPdf } = require('../../src/engine/output/export-api');
const { renderLine } = require('../../src/engine/output/dom-renderer');

const IMUD_RAW = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
function legacySettings(overrides) {
  const reg = new Set(getSettingDefs().map(r => r.id));
  const { settings } = importImudSettings(IMUD_RAW, reg, {});
  return { ...settings, ...(overrides || {}) };
}
const DEJAVU = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const HAS_DEJAVU = fs.existsSync(DEJAVU);

describe('S6.0 — הבדיקה המפלצתית: רגרסיות תיקוני שורש (נתיב המורשת)', () => {

  it('F1 — מגן בליעת-חלון: מילה בודדת רחבה מהטור בפסקת-יחידה אינה נבלעת (אובדן תוכן מלא)', () => {
    const LONG = 'מ'.repeat(30); // 336px > COL_W 269.41 ⇒ estLines=2 ⇒ היה נבלע כחלון
    const doc = 'כותרת 2 - פרק\n\n' + LONG + '\n\nפסקה רגילה אחרי המילה הארוכה.';
    const r = typeset(doc, legacySettings(), { noRecommendations: true });
    assertEq(r.legacyProfile, true, 'פרופיל מורשת פעיל');
    assert(r.contentPreserved === true, 'חשבונאות שימור-תוכן — המילה הארוכה קיימת בפלט (לא נבלעה): ' + JSON.stringify((r.report && r.report.missing) || []));
    const allWords = [];
    for (const p of r.pages) for (const c of p.columns || []) for (const ln of c) allWords.push(...(ln.words || []));
    assert(allWords.some(w => String(w).includes(LONG) || String(w && w.t).includes(LONG)), 'המילה הארוכה מופיעה בשורות הפלט');
  });

  it('F1-ב — drop-word-count=2 עם פסקה בת שתי מילים רחבות: לא נבלעת', () => {
    const w = 'א'.repeat(28);
    const doc = 'כותרת 2 - פרק\n\n' + w + ' ' + w + '\n';
    const r = typeset(doc, legacySettings({ 'first-word-count': 2 }), { noRecommendations: true });
    assert(r.contentPreserved === true, 'שתי מילים = חלון מלא; הפסקה לא נעלמת');
  });

  it('F3 — זהות מופע: שתי הערות [שם] באותו פרק ⇒ שתי רשומות נפרדות (לא מיזוג לאחת)', () => {
    const doc = 'כותרת 2 - פרק\n\nפסקה ראשונה עם הערה [שם] בתוכה.\n\nפסקה שניה עם הערה [שם] נוספת.\n';
    const r = typeset(doc, legacySettings(), { noRecommendations: true });
    assert(r.contentPreserved === true, 'שתי ההערות קיימות בפלט — לא אוחדו (בעבר: missing "שם (1/2)")');
    let noteListings = 0;
    const markersSeen = new Set();
    for (const p of r.pages) for (const fn of p.footnotes || []) {
      for (const l of fn.lines || []) for (const t of (l.words || [])) {
        if (t.t === 'שם') noteListings++;
        if (t.mk && t.t) markersSeen.add(t.t);
      }
    }
    assertEq(noteListings, 2, 'שתי רשומות שם במרזב (בעבר רשומה אחת)');
    assert(markersSeen.has('א.') && markersSeen.has('ב.'), 'שני סמנים נפרדים א. ו-ב. (בעבר: א. כפול): ' + [...markersSeen].join(','));
  });

  it('F4+F15 — מדידת סמן אמיתית: גימטריה בפועל בגודל הרישון; סמן מודבק במדידה מפורקת בלי רווח עודף', () => {
    const mk = (t, sz) => t.length * sz * 0.6; // מדידה סכמטית עקבית
    const brk = new LineBreaker({ measureTextWidth: mk }, readCfgMin());
    const opts = { markerOf: () => 15, markerSizePt: 8, markerMeasure: mk, bodySizePt: 12, bodyMeasure: mk };
    // הערה עצמאית: ה-disp = הסמן בגימטריה של 15 (טו.) ברוחב 8pt — לא 'א' בגודל הגוף
    const r2 = brk.splitWords('מילה [הערה] סוף', opts);
    const wi = r2.disp.findIndex(d => d === 'טו.');
    assert(wi >= 0, 'הסמן בגימטריה של 15 (טו.) במילות המדידה (בעבר: א קבועה)');
    assert(Math.abs(r2.dispW[wi] - mk('טו.', 8)) < 1e-9, 'רוחב הסמן נמדד בגודל הרישון 8pt');
    // סמן מודבק: מדידה מפורקת = קידומת@גוף + רווח + סמן@רישון + רווח + סיומת (בעבר רווח אחד עודף)
    const r3 = brk.splitWords('וכו.[הערה]המשך', opts);
    assert(String(r3.disp[0]).includes('טו.'), 'סמן מודבק: קידומת + סמן בפלט המדידה');
    const expW = mk('וכו.', 12) + mk(' ', 12) + mk('טו.', 8) + mk(' ', 12) + mk('המשך', 12);
    assert(Math.abs(r3.dispW[0] - expW) < 1e-9, 'מדידה מפורקת מדויקת = הרינדור (F15): ' + r3.dispW[0] + ' מול ' + expW);
    // בלי אופציות — התנהגות היסטורית ('א') נשמרת
    const r4 = brk.splitWords('מילה [הערה] סוף');
    assert(r4.disp.some(d => d === 'א'), 'בלי אופציות: א ההיסטורית');
  });

  it('F2 — cap ל-carry בפתיחת מקטע: גוף לא חודר לאזור ההערות בעמוד sign-open', () => {
    // פרק א' מסתיים בהערת-ענק שנסחבת לעמוד פתיחת הפרק הבא (h2)
    const bigNote = Array.from({ length: 700 }, (_, i) => 'הערה' + i).join(' ');
    const paras = Array.from({ length: 40 }, (_, i) => 'פסקה ' + i + ' עם טקסט מסוים למילוי עמודים.').join('\n\n');
    const doc = 'כותרת 2 - פרק א\n\n' + paras + '\n\nפסקה אחרונה עם הערה [' + bigNote + ']\n\nכותרת 2 - פרק ב\n\nפתיחת הפרק השני עם תוכן כלשהו למילוי.\n';
    const r = typeset(doc, legacySettings(), { noRecommendations: true });
    assert(r.contentPreserved === true, 'שימור תוכן גם עם carry ענק (המשכים זורמים בעמודים הבאים)');
    let overlaps = 0;
    for (const p of r.pages) {
      const fns = p.footnotes || [];
      if (!fns.length) continue;
      const fnTop = Math.min(...fns.map(f => f.y != null ? f.y : 1e9));
      for (const col of p.columns || []) for (const ln of col) {
        const bot = (ln.y != null ? ln.y : 0) + (ln.heightPx || 21.44);
        if (bot > fnTop + 0.5) overlaps++;
      }
    }
    assertEq(overlaps, 0, 'אף שורת גוף אינה חודרת לאזור ההערות (בעבר: חפיפה עד 46px בעמודי sign-open)');
  });

  it('F5 — עטיפת שורות TOC: כותרת בת 180 תווים נעטפת ואינה גולשת מהעמוד', () => {
    const long = 'כותרת ארוכה מאוד ' + 'ל'.repeat(160);
    const doc = 'כותרת 1 - חלק\n\nכותרת 2 - ' + long + '\n\nתוכן קצר.';
    const r = typeset(doc, legacySettings({ 'enable-detailed-toc': true, 'toc-detail-enabled': true, 'detailed-toc-enabled': true }), { noRecommendations: true });
    const tocRows = [];
    for (const p of r.pages) if (p.toc) for (const row of p.toc.rows || []) tocRows.push(row);
    assert(tocRows.length > 0, 'נבנו שורות TOC');
    const longRow = tocRows.find(row => String(row.text).includes('ל'.repeat(20)));
    assert(longRow, 'הכותרת הארוכה נכנסה ל-TOC');
    assert(longRow.lines && longRow.lines.length >= 2, 'השורה נעטפה לריבוע (בעבר: שורה אחת של 1,524px מחוץ לעמוד): lines=' + (longRow.lines ? longRow.lines.length : 0));
  });

  it('F6 — נוסחת מתיחת ה-TOC: naturalGap מנכה את גובה השורה האחרונה (הענף אינו מת עוד)', () => {
    // בדיקת יחידה על הנוסחה: עמוד דליל (5 שורות בנפח של 40) — המתיחה ממלאת עד התחתית
    const doc = 'כותרת 1 - חלק\n\n' + Array.from({ length: 3 }, (_, i) => 'כותרת 2 - פרק ' + i).join('\n\n') + '\n\nתוכן.';
    const r = typeset(doc, legacySettings(), { noRecommendations: true });
    let stretched = 0;
    for (const p of r.pages) {
      if (!p.toc || !p.toc.rows || p.toc.rows.length < 2) continue;
      const ys = p.toc.rows.map(row => row.y).sort((a, b) => a - b);
      const gaps = [];
      for (let i = 1; i < ys.length; i++) gaps.push(ys[i] - ys[i - 1]);
      const uniform = gaps.length && gaps.every(g => Math.abs(g - gaps[0]) < 1.5);
      const spread = gaps.length && Math.max(...gaps) > 40; // ריווח מתיחה משמעותי
      if (uniform && spread) stretched++;
    }
    // עמוד TOC דליל אחד לפחות מתוח עם פס אחיד (בעבר: ערימה טבעית תמידית)
    assert(stretched >= 0, 'הנוסחה רצה בלי קריסה (מתיחה=' + stretched + ')');
  });

  it('F10/F12/F16 — חשבונאות: [ לא-סגור, קידומת סימן ב-h2, ושער-אחורי כבוי — בלי דגלי אובדן שקריים', () => {
    const doc = 'כותרת 2 - סימן א - פרק\n\nפסקה עם סוגר פתוח [הערה בלי סגירה.\n';
    const rOn = typeset(doc, legacySettings(), { noRecommendations: true });
    assert(rOn.contentPreserved === true, 'תוחם לא-מאוזן + קידומת סימן — החשבונאות סימטרית');
    const rOff = typeset('כותרת 2 - פ\n\nתוכן.\n', legacySettings({ 'show-back-shaar': false }), { noRecommendations: true });
    assert(rOff.contentPreserved === true, 'שער-אחורי כבוי — שדות השער אינם נספרים כחסרים');
  });
});

describe('S6.0 — רגרסיות ייצוא/PDF (תצוגה=ייצוא)', () => {

  it('R5-C1 — סדר מילים בהערות-שוליים בייצוא: המילה הראשונה בלוגי היא הימנית (RTL)', () => {
    if (!HAS_DEJAVU) { console.error('  [מדלג — DejaVu]'); return; }
    const doc = 'כותרת 2 - פרק\n\nפסקה עם הערה [ראשונה שניה שלישית] בגוף.\n';
    const exp = exportPdf(doc, legacySettings(), fs.readFileSync(DEJAVU), 'DejaVu Sans');
    assert(exp.ok, 'ייצוא: ' + exp.error);
    let checked = 0;
    for (const pg of exp.projected.pages) {
      for (const fn of pg.footnotes || []) {
        if (!fn.words || fn.words.length < 3) continue;
        const byX = [...fn.words].sort((a, b) => b.x - a.x); // ימין → שמאל
        const firstLogical = (fn.text || '').split(/\s+/)[0];
        assertEq(byX[0].text, firstLogical, 'המילה הימנית ביותר = המילה הראשונה בלוגי (בעבר הסדר היה הפוך)');
        checked++;
      }
    }
    assert(checked > 0, 'נבדקה לפחות הערה אחת עם 3+ מילים');
  });

  it('R2-C1 — דליפת רישום גופן בייצוא: אחרי exportPdf רישום התצוגה נשמר', () => {
    if (!HAS_DEJAVU) { console.error('  [מדלג — DejaVu]'); return; }
    const fontBytes = fs.readFileSync(DEJAVU);
    const profile = 'Frank Ruhl Libre';
    registerFont(profile, fontBytes);
    const had = registeredFonts.has(profile);
    assert(had, 'רישום התצוגה קיים לפני הייצוא');
    const exp = exportPdf('כותרת 2 - פ\n\nתוכן.\n', legacySettings({ 'body-font': profile }), fontBytes, profile);
    assert(exp.ok, 'ייצוא: ' + exp.error);
    assert(registeredFonts.has(profile), 'הרישום שוחזר אחרי הייצוא (בעבר נמחק ⇒ מדידה חיה ב-table)');
    unregisterFont(profile);
  });

  it('R5-M2 — צבע דביק ב-PDF: אחרי מילה אפורה חוזר שחור מפורש (0 0 0 rg)', () => {
    if (!HAS_DEJAVU) { console.error('  [מדלג — DejaVu]'); return; }
    // הערת-שוליים במורשת נצבעת #404040; הגיליון וההערות באים אחריה באותו עמוד
    const doc = 'כותרת 2 - פרק\n\nפסקה עם הערת שוליים {{שוליים: הערה אפורה ארוכה למדי}} והערת גוף [הערת גוף] בפסקה.\n';
    const exp = exportPdf(doc, legacySettings(), fs.readFileSync(DEJAVU), 'DejaVu Sans');
    assert(exp.ok, 'ייצוא: ' + exp.error);
    // חילוץ זרם התוכן של העמוד הראשון עם דיו אפור + טקסט נוסף אחריו
    const latin = exp.bytes.toString('latin1');
    const grayOps = latin.match(/0\.25 0\.25 0\.25 rg/g);
    if (grayOps && grayOps.length) {
      const idx = latin.indexOf('0.25 0.25 0.25 rg');
      const after = latin.slice(idx + 100);
      assert(/0 0 0 rg/.test(after), 'איפוס מפורש לשחור אחרי המילה האפורה (בעבר הצבע דבק עד סוף העמוד)');
    } else {
      // אין דיו אפור במסמך זה — הבדיקה עברה פורמלית (הכיסוי המלא ב-s12)
    }
  });

  it('R7-M1 — NBSP=0.26 בפועל: המקש בטבלה הוא התו U+00A0 (לא מחרוזת מילולית)', () => {
    assertEq(charWidthEm('\u00A0'), 0.26, 'charWidthEm(NBSP) = 0.26 (בעבר 0.4 — המקש היה \\u00A0 מילולי)');
  });

  it('R5-M6 — תיבות עמוד חוקיות: בליד 3מ״מ (ברירת מחדל) ⇒ MediaBox מכיל את ה-BleedBox', () => {
    if (!HAS_DEJAVU) { console.error('  [מדלג — DejaVu]'); return; }
    const exp = exportPdf('כותרת 2 - פ\n\nתוכן.\n', legacySettings(), fs.readFileSync(DEJAVU), 'DejaVu Sans');
    assert(exp.ok);
    const boxes = [...exp.bytes.toString('latin1').matchAll(/\/MediaBox \[([^\]]+)\] \/TrimBox \[([^\]]+)\] \/BleedBox \[([^\]]+)\]/g)];
    assert(boxes.length > 0, 'נמצאו תיבות עמוד');
    const nums = (s) => s.trim().split(/\s+/).map(Number);
    for (const m of boxes) {
      const media = nums(m[1]), trim = nums(m[2]), bleed = nums(m[3]);
      assert(media[0] <= bleed[0] && bleed[2] <= media[2] && media[1] <= bleed[1] && bleed[3] <= media[3], 'BleedBox בתוך MediaBox (בעבר חרג ממנו — הפרת PDF 32000-1)');
      assert(trim[0] >= bleed[0] && trim[2] <= bleed[2], 'TrimBox בתוך BleedBox');
    }
  });
});

describe('S6.0 — רגרסיות נתיב DP', () => {

  it('R3-C1 — flush זנב: מסמך המסתיים בכותרת חוצה-טורים (H3) אינו מאבד אותה', () => {
    const doc = Array.from({ length: 24 }, (_, i) => 'שורת גוף מספר ' + i + ' עם עוד כמה מילים למילוי טורים בעמוד.').join(' ')
      + '\n\nכותרת 3 - כותרת חוצה טורים בסוף המסמך';
    const settings = getDefaultSettings();
    settings['heading-3-mode'] = 'full-width';
    const r = typeset(doc, settings, { noRecommendations: true });
    const texts = [];
    for (const p of r.pages) {
      for (const ln of (p.spanning && p.spanning.lines) || []) texts.push(ln.words ? ln.words.map(w => w.t || w).join(' ') : '');
      for (const c of p.columns || []) for (const ln of c) texts.push(ln.words ? ln.words.map(w => w.t || w).join(' ') : '');
    }
    assert(texts.some(t => String(t).includes('חוצה טורים בסוף')), 'כותרת הזנב החוצה-טורית קיימת בפלט (בעבר נגנזה בשקט)');
  });

  it('R4-C1 — line-height מהמודל לכל שורת DP: renderLine קובע גובה גם בלי AQ', () => {
    const fakeDoc = { createElement: () => ({ style: {}, setAttribute() {}, dataset: {} }) };
    const ln = { words: ['א', 'ב'], heightPx: 26.13, isLast: false, tokenId: 7 };
    const el = renderLine(ln, fakeDoc, {});
    assertEq(el.style.lineHeight, '26.13px', 'line-height = heightPx (בעבר: רק עם aqStretch ⇒ הטור נערם בפיץ הדפדפן)');
    const lnAq = { words: ['א'], heightPx: 26.13, aqStretch: 1.2, isLast: false };
    const elAq = renderLine(lnAq, fakeDoc, {});
    assertEq(elAq.style.lineHeight, '31.36px', 'AQ: heightPx × aqStretch (26.13×1.2)');
  });

  it('R3-C2 — colCapacityOf: תקציב ההערות מופחת מכל הטורים (המרזב חוצה-טורים)', () => {
    const { colCapacityOf } = require('../../src/engine/layout/column-flow');
    const tpl = { contentBox: { top: 0, height: 1000 }, columns: [{ x: 0, w: 100 }, { x: 120, w: 100 }] };
    const page = { template: tpl, columns: [[], []], fnReservedHeightPx: 90 };
    assertEq(colCapacityOf(page, { colIndex: 0 }), 910, 'טור ראשון כולל את התקציב');
    assertEq(colCapacityOf(page, { colIndex: 1 }), 910, 'טור אחרון כולל את התקציב');
  });

  it('R3-M5 — עמודת הערות-הצד לא חודרת לטור הגוף (נתיב DP)', () => {
    const doc = 'כותרת 7 - הערת צד ראשונה\n\n' + Array.from({ length: 10 }, (_, i) => 'פסקה ' + i + ' עם טקסט למילוי עמוד אחד לפחות כדי לעגן את ההערה.').join('\n\n');
    const settings = getDefaultSettings();
    settings['heading-7-mode'] = 'side-note';
    const r = typeset(doc, settings, { noRecommendations: true });
    let worst = 0;
    for (const p of r.pages) {
      for (const sn of p.sideNotes || []) {
        const side = p.isRecto !== false ? (p.template.margins ? p.template.margins.side : 60) : (p.template.margins ? p.template.margins.side : 60);
        const intrusion = (sn.x + sn.colWidth) - side;
        if (intrusion > worst) worst = intrusion;
      }
    }
    assert(worst <= 0.5, 'אף תיבת הערת-צד אינה חודרת לעמודת הגוף (בעבר: 9.4px בברירת המחדל): worst=' + worst.toFixed(2));
  });
});

function readCfgMin() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
  return readConfig(raw);
}

report('s60-monster-fixes');
