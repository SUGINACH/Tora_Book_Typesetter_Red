// tests/e2e/real-fonts.test.js — EXT-9: גופנים תורניים אמיתיים במדידה ובייצוא
'use strict';

/**
 * סגירת EXT-9 (P2, נפתח בביקורת 03.11): "המדידה והייצוא לא נוסו עם גופנים
 * תורניים אמיתיים — DejaVu/פיקסטשור בלבד; קובצי גופן אינם בריפו (PROVENANCE)".
 *
 * מאז S4.6 מוטמעים בריפו 443 קובצי TTF אמיתיים (61MB) מהפרויקט המקורי
 * (ui/assets/imud/fonts/ — הומרו WOFF2→TTF). בדיקה זו מוכיחה את השרשרת המלאה
 * **בגופני אמת** — לא בפיקסטשור:
 *
 * א. שלמות הספרייה: כל קובצי הקטלוג קיימים ונפרסים (442/443; חריג אחד
 *    מתועד — גופן-לוגו סימבולי בלי cmap יוניקוד).
 * ב. פתרון מחסניות המקור מול הקטלוג (נתיב חי): ברירות המקור נפתרות למשפחה
 *    מוטמעת בפועל (Frank Ruhl Libre / David Libre / Bellefair).
 * ג. מדידת אמת: registerFont ⇒ impl B פעיל; רוחבי hmtx אמיתיים (שונים
 *    מהטבלה המקורבת); cap-height מ-OS/2; אפס נפילות-גופן על עברית.
 * ד. עימוד ספר-אמת שלם במדידת גופן אמיתי: פרופיל המורשת, שימור, דטרמיניזם.
 * ה. ייצוא PDF בגופן תורני אמיתי: תת-גופן מוטמע, חילוץ טקסט ≡ מצויר,
 *    דטרמיניזם בתים, דפים תואמים (pdfinfo).
 * ו. בקרת-כפול: בתים פגומים ⇒ כשל מפורש (לא שקט).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const fm = require('../../src/engine/typography/font-metrics');
const { MeasureAPI, registerFont, unregisterFont, clearRegisteredFonts, resolveMeasureImpl } = require('../../src/engine/typography/measure-api');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings, getSettingDefs } = require('../../src/engine/core/settings-registry');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { exportPdf } = require('../../src/engine/output/export-api');

const ART = path.join(__dirname, '..', 'artifacts');
if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

const ASSETS = path.join(__dirname, '..', '..', 'ui', 'assets', 'imud');
const FONT_DIR = path.join(ASSETS, 'fonts');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
const LEGACY_DEFAULTS = JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8'));

const HAS_PDFTOOLS = (() => {
  try { execFileSync('pdfinfo', ['-v'], { stdio: 'ignore' }); return true; } catch (e) { return false; }
})();

// גופני העיצוב האמיתיים של הפרויקט המקורי (קבצים מוטמעים בפועל)
const REAL = {
  'Frank Ruhl Libre': 'FrankRuhlLibre-VF.ttf',
  'David Libre': 'DavidLibre-Regular.ttf',
  'Bellefair': 'Bellefair-Regular.ttf',
  'Noto Serif Hebrew': 'NotoSerifHebrew-VF.ttf',
  'FrankReal': 'FrankReal-Bold.ttf'       // גופן מילת-החלון של המקור (S4.15)
};
// מפתח משפחה⇒קובץ מהקטלוג (דטרמיניסטי — ראשון זוכה, כמו המפה בספרייה)
const fileOf = (fam) => {
  const e = CATALOG.find(x => x.family === fam);
  if (!e) throw new Error(`משפחה לא בקטלוג: ${fam}`);
  return e.file;
};
const bytesOf = (f) => fs.readFileSync(path.join(FONT_DIR, f));

// החריג המתועד: גופן-לוגו סימבולי (תווי לוגו, ללא מיפוי יוניקוד) — אינו
// גופן טקסט; המקור השתמש בו לעיטורי לוגו בלבד. registerFont עליו נכשל
// במפורש (בקרת-כפול ו') והספרייה נופלת לגופן מערכת בהתאם לתיעוד.
const KNOWN_SYMBOL_FONTS = new Set(['Guttman-Logo1-Regular.ttf']);

// =====================================================================
describe('EXT-9 א — שלמות ספריית הגופנים התורניים המוטמעת (443 TTF)', () => {
  it('כל משפחות הקטלוג: קובץ קיים, פורמט truetype, כפילויות-קובץ מתועדות בלבד', () => {
    assert(CATALOG.length >= 439, `קטלוג העדיפות המלא (קיבלנו ${CATALOG.length})`);
    // כפל-שמות מתוכנן ויחיד: DavidLibre-Regular.ttf רשום גם כ-'דוד ליברה רגיל'
    // (השם בבורר המקורי) וגם כ-'David Libre' (השם שמחסניות ה-CSS של המקור משתמשות
    // בו: "'AlphaBlack', 'David Libre', serif"). שני השמות ⇒ אותו גופן.
    // **S4.26 (דיווח משתמש 05.11 — "האתר לא משתמש בגופני ברירת המחדל"):** שלושה
    // כינויים אנגליים נוספו — הגופנים שהותקנו אצל המשתמש המקורי (מוכח מהייחוס:
    // ‏GuttmanRashiNormal ×3,182 שורות גוף, HadassahFriedlaender ×677 הערות-צד,
    // ‏FrankReal למילות-החלון). בלעדיהם המחסניות נפלו ל-Frank Ruhl Libre.
    const DUAL_NAMED = new Map([
      ['DavidLibre-Regular.ttf', new Set(['דוד ליברה רגיל', 'David Libre'])],
      ['Guttman-Rashi-Normal.ttf', new Set(['גוטמן רש"י רגיל', 'Guttman Rashi'])],
      ['Hadassah-Friedlaender-Regular.ttf', new Set(['הדסה פרידלנדר רגיל', 'Hadassah Friedlaender'])],
      ['FrankReal-Bold.ttf', new Set(['פרנק ריל מודגש', 'FrankReal'])]
    ]);
    const byFile = new Map();
    for (const e of CATALOG) {
      assert(fs.existsSync(path.join(FONT_DIR, e.file)), `הקובץ מוטמע: ${e.file}`);
      assertEq(e.format, 'truetype', `פורמט TTF (הומר מ-WOFF2): ${e.file}`);
      if (!byFile.has(e.file)) byFile.set(e.file, new Set());
      byFile.get(e.file).add(e.family);
    }
    for (const [file, fams] of byFile) {
      if (fams.size === 1) continue;
      const allowed = DUAL_NAMED.get(file);
      assert(allowed && fams.size === allowed.size && [...fams].every(f => allowed.has(f)),
        `כפילות-קובץ לא מתועדת: ${file} → ${[...fams].join(' | ')}`);
    }
    // נתון מקור מתועד: משפחות שונות עם קבצים שונים באותו שם-משפחה (Arial Italic.ttf
    // מול Arial-Italic.ttf — אותו גופן בשני שמות קובץ מהמקור). המפה family→file
    // דטרמיניסטית: הראשון זוכה.
    const famCount = new Set(CATALOG.map(e => e.family)).size;
    console.log(`  [real-fonts] catalog: ${CATALOG.length} entries, ${byFile.size} unique files, ${famCount} unique families (${CATALOG.length - famCount} משפחות-כפולות מקור + כפל-שמות אחד מתועד)`);
  });

  it('כל גופן הטקסט נפרס בפרנסר ה-sfnt (442/443; חריג-לוגו מתועד)', () => {
    const t0 = Date.now();
    const failures = [];
    const byFile = new Map();
    for (const e of CATALOG) byFile.set(e.file, e.family);
    for (const e of CATALOG) {
      const res = fm.parseFont(bytesOf(e.file));
      if (!res.ok) {
        if (KNOWN_SYMBOL_FONTS.has(e.file)) continue; // מתועד — גופן סימנים
        failures.push(`${e.file} (${e.family}): ${res.error}`);
      }
    }
    assertEq(failures, [], 'אף גופן טקסט לא נכשל בפרנסור');
    const parsed = CATALOG.filter(e => !KNOWN_SYMBOL_FONTS.has(e.file)).length;
    console.log(`  [real-fonts] parsed ${parsed}/${CATALOG.length} in ${Date.now() - t0}ms (חריג מתועד: ${[...KNOWN_SYMBOL_FONTS].join(', ')})`);
  });

  it('22 אותיות העברית ממופות בכל גופני העיצוב של המקור', () => {
    const HE = 'אבגדהוזחטיכלמנסעפצקרשת';
    for (const [fam, file] of Object.entries(REAL)) {
      const r = fm.parseFont(bytesOf(file));
      assert(r.ok, `${fam}: נפרס`);
      let mapped = 0;
      for (const ch of HE) if (fm.glyphIdOf(r.font, ch) !== 0) mapped++;
      assertEq(mapped, HE.length, `${fam} (${file}): כל האותיות ממופות`);
    }
  });

  it('EXT-14: הקטלוג המורחב (1,315 משפחות) — סיווג אמת, ללא התנגשות עם המוטמעות', () => {
    const ext = JSON.parse(fs.readFileSync(path.join(ASSETS, 'fonts-extended.json'), 'utf8'));
    assertEq(ext.length, 1315, 'מלוא הקטלוג המורחב של המקור');
    const priorityFams = new Set(CATALOG.map(e => e.family));
    const extFams = new Set();
    for (const e of ext) {
      assertEq(e.format, 'woff2', `פורמט המקור: ${e.family}`);
      assert(!priorityFams.has(e.family), `אין כפילות משפחה מול המוטמעות: ${e.family}`);
      assert(!fs.existsSync(path.join(FONT_DIR, e.file)),
        `קובץ המורחב אינו מוטמע בטעות (החלטת גודל מתועדת): ${e.file}`);
      extFams.add(e.family);
    }
    // נתון מקור מתועד: 26 משפחות כפולות בקטלוג המורחב (אותו גופן בשני איותים
    // של שם הקובץ — Oscar/Oskar, Bona Nova Italic/Bona-Nova-Italic). המפה
    // דטרמיניסטית: הראשון זוכה (Map constructor), כמו בספרייה.
    assertEq(extFams.size, 1289, '1,289 משפחות ייחודיות (26 כפילויות-מקור מתועדות — מפה דטרמיניסטית)');
    // סיווג האמת (כמו fontStatus בספרייה): מוטמע / קטלוג-בלבד / לא-ידוע
    const statusOf = (fam) => priorityFams.has(fam) ? 'embedded' : (extFams.has(fam) ? 'extended-catalog' : 'unknown');
    assertEq(statusOf('Frank Ruhl Libre'), 'embedded', 'גוף המקור — מוטמע');
    assertEq(statusOf('גוטמן רש"י רגיל'), 'embedded', 'גוטמן רש"י — מוטמע');
    assertEq(statusOf(ext[0].family), 'extended-catalog', `הראשונה בקטלוג המורחב — קטלוג-בלבד (${ext[0].family})`);
    assertEq(statusOf('גופן-שלא-קיים-כלל'), 'unknown', 'לא ידוע — נפילה מתועדת');
    // החלטת הגודל מתועדת: 115MB ‏WOFF2 במקור מול 62MB ‏TTF מוטמעים — הקטלוג
    // המלא זמין לבחירה עם סימון ברור, בלי לנפח את הריפו
    console.log(`  [real-fonts] extended catalog: ${ext.length} families (catalog-only, woff2) + ${priorityFams.size} embedded — סיווג אמת ללא כפילויות`);
  });
});

// =====================================================================
describe('EXT-9 ב — פתרון מחסניות המקור מול הקטלוג (נתיב חי, כמו imud-library)', () => {
  it('ברירות המקור נפתרות למשפחות מוטמעות בפועל', () => {
    const available = new Set(CATALOG.map(e => e.family));
    const { settings } = importImudSettings(LEGACY_DEFAULTS, new Set(getSettingDefs().map(r => r.id)), { availableFonts: available });
    // **S4.26:** גוף המקור "'Guttman Rashi', 'Frank Ruhl Libre', serif" — הכינוי
    // האנגלי 'Guttman Rashi' נוסף לקטלוג (מצביע על Guttman-Rashi-Normal.ttf
    // המוטמע — הגופן שמחסנית המקור נפלה אליו במכונת המשתמש, מוכח מהייחוס:
    // כל 3,182 שורות הגוף ב-GuttmanRashiNormal) ⇒ הגוף נפתר לגוטמן רש"י —
    // לא עוד ל-Frank Ruhl Libre (דיווח משתמש: "האתר לא משתמש בגופני ברירת המחדל").
    assertEq(settings['body-font'], 'Guttman Rashi', 'מחסנית גוף ⇒ גוטמן רש"י המוטמע (S4.26)');
    for (const fam of ['Guttman Rashi', 'Hadassah Friedlaender', 'FrankReal', 'Frank Ruhl Libre', 'David Libre', 'Bellefair']) {
      assert(available.has(fam), `${fam} בקטלוג`);
    }
    // כותרת H0: "'AlphaBlack', 'David Libre', serif" ⇒ David Libre
    assertEq(settings['heading-0-font'], 'David Libre', 'מחסנית H0 ⇒ David Libre');
  });
});

// =====================================================================
describe('EXT-9 ג — מדידת אמת בגופנים תורניים (hmtx/cmap/OS/2 מהקבצים)', () => {
  it('registerFont של גופן אמיתי ⇒ impl B פעיל אוטומטית (EXT-13)', () => {
    clearRegisteredFonts();
    const reg = registerFont('Frank Ruhl Libre', bytesOf(REAL['Frank Ruhl Libre']));
    assert(reg.ok, 'נרשם: ' + reg.error);
    assert(reg.glyphCount >= 400, `גליפים אמיתיים (קיבלנו ${reg.glyphCount})`);
    const settings = { ...getDefaultSettings(), 'body-font': 'Frank Ruhl Libre' };
    assertEq(resolveMeasureImpl(settings), 'font-metrics', 'גופן רשום ⇒ מדידת אמת גם בלי דגל מפורש');
    const sOff = { ...getDefaultSettings(), 'body-font': 'לא-רשום-כלל' };
    assertEq(resolveMeasureImpl(sOff), 'table', 'בלי גופן רשום ⇒ טבלה (נפילה שקופה)');
  });

  it('רוחבי hmtx אמיתיים — שונים מהטבלה המקורבת; מחושבים ישירות מהקובץ', () => {
    clearRegisteredFonts();
    registerFont('Frank Ruhl Libre', bytesOf(REAL['Frank Ruhl Libre']));
    const api = new MeasureAPI({ ...getDefaultSettings(), 'body-font': 'Frank Ruhl Libre' }, 'font-metrics');
    const sample = 'הוצאה מרשות לרשות';
    const wReal = api.measureTextWidth(sample, 12);
    // חישוב ישיר מהקובץ — אותן טבלאות, מקור שני עצמאי לאותו מספר
    const font = fm.parseFont(bytesOf(REAL['Frank Ruhl Libre'])).font;
    let units = 0;
    for (const ch of sample) units += fm.advanceUnitsOf(font, ch);
    const wDirect = (units / font.unitsPerEm) * 12 * (96 / 72);
    assert(Math.abs(wReal - wDirect) / wDirect < 0.05, `רוחב המדידה ≈ סכום hmtx ישיר (±tracking: ${wReal.toFixed(2)} מול ${wDirect.toFixed(2)})`);
    // מדידת הטבלה (impl A) שונה — הוכחה שמדובר במדדי אמת ולא באותן טבלאות מקורבות
    const apiTable = new MeasureAPI({ ...getDefaultSettings(), 'body-font': 'Frank Ruhl Libre' }, 'table');
    const wTable = apiTable.measureTextWidth(sample, 12);
    assert(Math.abs(wReal - wTable) / wTable > 0.01, `impl B ≠ impl A על אותו טקסט (${wReal.toFixed(2)} מול ${wTable.toFixed(2)}) — מדדי הגופן האמיתי פעילים`);
  });

  it('cap-height מ-OS/2 sCapHeight אמיתי (לא הקירוב 0.7)', () => {
    clearRegisteredFonts();
    registerFont('Frank Ruhl Libre', bytesOf(REAL['Frank Ruhl Libre']));
    const api = new MeasureAPI({ ...getDefaultSettings(), 'body-font': 'Frank Ruhl Libre' }, 'font-metrics');
    const cap = api.capHeightEm();
    assert(Math.abs(cap - 0.7) > 0.01, `cap-height אמיתי (${cap.toFixed(3)}) שונה מהקירוב 0.7`);
    const font = fm.parseFont(bytesOf(REAL['Frank Ruhl Libre'])).font;
    assert(Math.abs(cap - fm.capHeightEmOf(font)) < 1e-9, 'מגיע מהפרופיל הרשום');
  });

  it('אפס נפילות-גופן על עברית מנוקדת — הניקוד שכבת-אפס אמיתית (S4.16)', () => {
    clearRegisteredFonts();
    registerFont('Frank Ruhl Libre', bytesOf(REAL['Frank Ruhl Libre']));
    const api = new MeasureAPI({ ...getDefaultSettings(), 'body-font': 'Frank Ruhl Libre' }, 'font-metrics');
    const base = api.stats.fontFallbacks;
    api.measureTextWidth('וְהָנֵּי כַּהֲרַבֶּה מִדִּינֵי הַתּוֹרָה', 12);
    assertEq(api.stats.fontFallbacks, base, 'אף תו עברי/ניקוד לא נפל מהגופן');
  });
});

// =====================================================================
describe('EXT-9 ד — עימוד ספר-אמת שלם במדידת גופן תורני אמיתי', () => {
  const REAL_BOOK = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'real', 'no_long_test_text.txt'), 'utf8');

  it('פרופיל המורשת + גופן רשום ⇒ עימוד מלא, שימור, דטרמיניזם', () => {
    clearRegisteredFonts();
    // בדיוק כמו הנתיב החי: ברירות המקור מיובאות עם הקטלוג, הגופן המוטמע
    // נרשם (imud-library registerFont), ואז העימוד מודד ב-hmtx אמיתי.
    const available = new Set(CATALOG.map(e => e.family));
    const { settings } = importImudSettings(LEGACY_DEFAULTS, new Set(getSettingDefs().map(r => r.id)), { availableFonts: available });
    const reg = registerFont(settings['body-font'], bytesOf(fileOf(settings['body-font'])));
    assert(reg.ok, 'גופן הגוף נרשם: ' + reg.error);
    const r1 = typeset(REAL_BOOK, settings, { noRecommendations: true });
    assert(r1.legacyProfile === true, 'פרופיל המורשת של המקור הופעל');
    assert(r1.contentPreserved === true, 'שימור תוכן במדידת גופן אמיתי');
    assert(r1.pages.length > 50, `ספר אמת שלם (קיבלנו ${r1.pages.length} עמודים)`);
    const r2 = typeset(REAL_BOOK, settings, { noRecommendations: true });
    assertEq(r1.layoutHash, r2.layoutHash, 'דטרמיניזם גם במדידת hmtx אמיתית');
    console.log(`  [real-fonts] ספר-אמת בגופן Frank Ruhl Libre: pages=${r1.pages.length} hash=${r1.layoutHash.slice(0, 12)}`);
  });

  it('השוואת צמצום: מדידת האמת משנה את העימוד בפועל (לא זהה לטבלה)', () => {
    clearRegisteredFonts();
    const available = new Set(CATALOG.map(e => e.family));
    const { settings } = importImudSettings(LEGACY_DEFAULTS, new Set(getSettingDefs().map(r => r.id)), { availableFonts: available });
    registerFont(settings['body-font'], bytesOf(fileOf(settings['body-font'])));
    const withReal = typeset(REAL_BOOK, settings, { noRecommendations: true });
    // אותן הגדרות בלי גופן רשום ⇒ נפילה שקופה לטבלה — עימוד שונה בהכרח
    unregisterFont(settings['body-font']);
    const withTable = typeset(REAL_BOOK, settings, { noRecommendations: true });
    clearRegisteredFonts();
    assert(withReal.layoutHash !== withTable.layoutHash, 'מדידת הגופן האמיתי משנה שבירות בפועל (גופן ≠ טבלה מקורבת)');
    console.log(`  [real-fonts] real=${withReal.pages.length} עמודים, table=${withTable.pages.length} עמודים — המדידה האמיתית פעילה`);
  });
});

// =====================================================================
describe('EXT-9 ה — ייצוא PDF בגופן תורני אמיתי (תת-גופן מוטמע)', () => {
  const CORPUS = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt'), 'utf8');
  const fontBytes = bytesOf(REAL['Frank Ruhl Libre']);

  it('ייצוא מלא: דפים תואמים, תת-גופן מוטמע, דטרמיניזם בתים, חילוץ ≡ מצויר', () => {
    const exp = exportPdf(CORPUS, getDefaultSettings(), fontBytes, 'Frank Ruhl Libre');
    assert(exp.ok, 'ייצוא בגופן אמיתי: ' + exp.error);
    const pdfPath = path.join(ART, 'real-fonts-canonical.pdf');
    fs.writeFileSync(pdfPath, exp.bytes);

    // הגופן האמיתי מוטמע בקובץ: זרם FontFile2 הוא sfnt תקין (0x00010000) —
    // הוכחה שהבתים בקובץ הם תת-הגופן האמיתי, לא פנייה חיצונית.
    const raw = exp.bytes.toString('latin1');
    assert(raw.includes('/FontFile2'), 'תת-הגופן מוטמע בפלט');
    const ff2 = raw.indexOf('/FontFile2');
    const st = raw.indexOf('stream', ff2);
    const magic = exp.bytes.readUInt32BE(st + 'stream'.length + 1); // +1: קו-חדש
    assertEq(magic, 0x00010000, 'זרם הגופן המוטמע — חתימת TrueType אמיתית');
    assert(!raw.includes('/ExternalFile'), 'אין גופן חיצוני');

    // דטרמיניזם: ייצוא כפול ⇒ בתים זהים
    const again = exportPdf(CORPUS, getDefaultSettings(), fontBytes, 'Frank Ruhl Libre');
    assert(again.ok && Buffer.compare(exp.bytes, again.bytes) === 0, 'בתים זהים ביט-לביט');

    if (HAS_PDFTOOLS) {
      const info = execFileSync('pdfinfo', [pdfPath]).toString('utf8');
      const m = info.match(/Pages:\s+(\d+)/);
      assertEq(Number(m[1]), exp.result.pages.length, 'page count equality (live ↔ pdf בגופן אמיתי)');
      // חילוץ טקסט מהגופן האמיתי ≡ כל הטקסט המצויר (מולטיסט — שלמות תוכן)
      const txt = execFileSync('pdftotext', [pdfPath, '-']).toString('utf8');
      const drawn = [];
      for (const pg of exp.projected.pages) {
        for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) for (const w of ln.words) drawn.push(w.text);
        for (const fn of pg.footnotes) drawn.push(fn.marker || '', ...(fn.text || '').split(/\s+/));
        if (pg.folio && pg.folio.text) drawn.push(pg.folio.text);
        if (pg.header) for (const s of pg.header.slots) drawn.push(s.text);
      }
      const norm = (s) => s.replace(/[\s\u200E\u200F\u202A-\u202E]+/g, '').split('').sort().join('');
      assertEq(norm(txt), norm(drawn.filter(Boolean).join(' ')), 'חילוץ מהגופן האמיתי ≡ הטקסט המצויר');
    } else {
      console.error('  [מדלג — poppler לא במערכת]');
    }

    // מטא-דאטה לארטיפקט
    fs.writeFileSync(path.join(ART, 'real-fonts-export.json'), JSON.stringify({
      font: 'FrankRuhlLibre-VF.ttf', family: 'Frank Ruhl Libre',
      originalBytes: fontBytes.length, exportedPdfBytes: exp.bytes.length,
      pages: exp.result.pages.length, glyphCount: exp.info && exp.info.glyphs,
      embedded: '/FontFile2 present', determinism: 'byte-identical',
      pdftools: HAS_PDFTOOLS
    }, null, 2));
    console.log(`  [real-fonts] PDF: pages=${exp.result.pages.length} pdf=${(exp.bytes.length / 1024).toFixed(0)}KB (מקור גופן ${(fontBytes.length / 1024).toFixed(0)}KB, תת-גופן מצומצם בתוך הקובץ)`);
  });
});

// =====================================================================
describe('EXT-9 ו — בקרות-כפול (שקיפות כישלון)', () => {
  it('בתים פגומים ⇒ כשל מפורש מהפרנסר — לא רישום שקט', () => {
    const bad = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
    const res = registerFont('פגום-במכוון', bad);
    assert(res.ok === false, 'נדחה');
    assert(res.error && res.error.length > 0, 'עם הודעת שגיאה מפורשת');
    unregisterFont('פגום-במכוון');
  });

  it('גופן-הלוגו הסימבולי (בלי cmap יוניקוד) נדחה במפורש — מתועד, לא שקט', () => {
    const res = registerFont('גוטמן-לוגו', bytesOf('Guttman-Logo1-Regular.ttf'));
    assert(res.ok === false, 'נדחה (אין מיפוי יוניקוד)');
    unregisterFont('גוטמן-לוגו');
  });
});

report('real-fonts');
