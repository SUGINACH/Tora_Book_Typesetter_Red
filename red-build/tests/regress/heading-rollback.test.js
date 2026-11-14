/**
 * tests/regress/heading-rollback.test.js — R-01 · אובדן "לשון"/"הפוסקים" בכותרות inline בסוף הטור הימני
 * (סוכן 4 — תשתית בדיקות)
 *
 * הממצא: במסמך הבדיקה הקבוע (generateTestDocument fixed/full, מסלול legacy-imud-flow) אובדות שתי מילים —
 * S6.2 ב-WORKLOG/ISSUE_REGISTRY. שחזור ושורש: סוכן 2 (PR #35, BUG_REPORT_heading-rollback-fallthrough.md):
 * כשכותרת inline לא נכנסת בטור הימני, rollbackTrailingHeadings() מחזיר כותרות שכבר נדחפו, אך הענף נופל
 * ודוחף את הכותרת הנוכחית במקום לעבד מחדש את שהוחזר → כותרת אחת אובדת והאחרת נפלטת פעמיים.
 * בדיקה זו עצמאית: אינה מייבאת שום כלי דיבוג/אבחון, ואינה מניחה את מנגנון התיקון.
 *
 * מה נבדק ולמה בדיוק כך:
 *   • contentPreserved (מולטיסט מילים) — מזהה את האובדן המדווח.
 *   • "מפקד כותרות" ברמת טוקן — כל טוקן-כותרת h4–h7 נפלט לפחות פעם אחת, וכותרת קצרה (≤20 תווים, בלי
 *     יכולת גלישה) נפלטת בדיוק פעם אחת. הוא מזהה גם פגיעה *שקטה* שמולטיסט המילים מחמיץ: במסמך הקבוע
 *     אובדת גם כותרת h4 "טעם הדין" (המילים קיימות במקומות אחרים) ו-h5 "מקור הדין" נפלטת פעמיים.
 *     כותרת ארוכה נפלטת בכמה פריטים (שורה לכל פריט) — זה תקין ואינו מסומן; לכן נדרש הרף של 20 תווים.
 *   • סדר הקריאה אינו נבדק במכוון: בעמודים עם רצועת h3 אמצע-עמוד מוחזקים בכל טור שני אזורים
 *     (לפני/אחרי הרצועה), כך שמעבר col0→col1 אינו סדר המקור. (נבדק: 114 עמודים כאלה ב-long_test_text.)
 *
 * מחזור חיים (strict xfail): כל עוד FIX_LANDED=false, בדיקות השחזור נדרשות *להיכשל* (ומדפיסות
 * "KNOWN-BUG R-01"), כדי ש-main יישאר ירוק בלי להסתיר את הבאג. ברגע שהן עוברות, הבדיקה נכשלת בהוראה
 * מפורשת להפוך FIX_LANDED=true (הן הופכות לבדיקות רגילות) ולהדק את s62-user-questions.test.js מ-
 * `missing <= 2` ל-`=== 0`. אימות על ענף עם התיקון: RED_FIX_LANDED=1 node tests/regress/heading-rollback.test.js
 *
 * בקרות שליליות: (1) הבדיקות העצמיות של ה-oracle על מודלים סינתטיים — אובדן/כפילות/אי-גלישה, כדי להוכיח
 * שהבודק *יכול* להיכשל ושאינו מסמן שווא; (2) מסמך בקרה זהה לטריגר פרט לפסקה שמפרידה בין הכותרות —
 * עובר גם על הקוד הישן; (3) קורפוס אמיתי (long_test_text.txt, 647 עמ') — עובר גם על הקוד הישן.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');
const { legacyTypeset } = require('../../src/engine/layout/legacy-imud-flow');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getSettingDefs } = require('../../src/engine/core/settings-registry');
const { generateTestDocument } = require('../../src/ui/test-doc-generator');

const REPO = path.resolve(__dirname, '..', '..');
const FIXTURES = path.join(__dirname, '..', 'fixtures', 'regress');
const CORPUS = path.join(REPO, '..', 'audits', 'long_test_text.txt');

// ── מתג מחזור-חיים: להפוך ל-true בדיוק ב-PR שמנחית את תיקון ה-rollback (ראו הערת הפתיחה) ──
const FIX_LANDED = process.env.RED_FIX_LANDED === '1' || false;

// ── עזרים ──
const legacyDefaults = JSON.parse(fs.readFileSync(path.join(REPO, 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
let _settings = null;
function settings() {
  if (!_settings) _settings = importImudSettings(legacyDefaults, new Set(getSettingDefs().map((r) => r.id)), {}).settings;
  return _settings;
}
const run = (text) => legacyTypeset(text, settings(), {});
const readFixture = (name) => fs.readFileSync(path.join(FIXTURES, name), 'utf8');

/** רמות כותרת שנפלטות כפריטי kind==='heading' בתוך הטורים (h1–h3 מוצגות כרצועות/שערים ואינן נספרות כאן). */
const IN_COLUMN_LEVEL = /^h[4-7]$/;
/** כותרת קצרה מזו אינה יכולה להיגלש לשתי שורות בטור, ולכן חייבת להיפלט בפריט אחד בדיוק. */
const SINGLE_LINE_MAX_CHARS = 20;

/**
 * מפקד כותרות ברמת טוקן. מחזיר {expected, lost[], duplicatedShort[], badMapping}.
 *  lost             — טוקני h4–h7 שלא נפלטו בשום פריט.
 *  duplicatedShort  — טוקנים קצרים (≤20 תווים) שנפלטו ביותר מפריט אחד.
 *  badMapping       — פריטי כותרת שה-tokenId שלהם אינו מצביע על טוקן מאותה רמה (בדיקת שפיות ל-oracle עצמו).
 */
function headingCensus(r) {
  const emitted = new Map();
  let badMapping = 0;
  for (const p of r.pages) {
    for (const col of p.columns || []) {
      for (const it of col) {
        if (it.kind !== 'heading') continue;
        const t = r.tokens[it.tokenId];
        if (!t || t.type !== 'h' + it.level) badMapping++;
        if (t && IN_COLUMN_LEVEL.test(t.type)) emitted.set(it.tokenId, (emitted.get(it.tokenId) || 0) + 1);
      }
    }
  }
  const lost = [];
  const duplicatedShort = [];
  let expected = 0;
  r.tokens.forEach((t, i) => {
    if (!IN_COLUMN_LEVEL.test(t.type)) return;
    expected++;
    const n = emitted.get(i) || 0;
    const len = String(t.text || '').replace(/\s+/g, ' ').trim().length;
    if (n === 0) lost.push({ tokenId: i, type: t.type, text: t.text });
    else if (n > 1 && len <= SINGLE_LINE_MAX_CHARS) duplicatedShort.push({ tokenId: i, type: t.type, text: t.text, emitted: n });
  });
  return { expected, lost, duplicatedShort, badMapping };
}

const fmt = (c) =>
  [...c.lost.map((x) => `${x.type}#${x.tokenId} "${x.text}" אבדה`), ...c.duplicatedShort.map((x) => `${x.type}#${x.tokenId} "${x.text}" נפלטה ×${x.emitted}`)].join(' · ');

/** קביעת "אין אובדן/כפילות כותרות" — נכשלת עם תיאור מפורט. */
function assertHeadingsEmittedOnce(r, label) {
  const c = headingCensus(r);
  assert(c.lost.length === 0 && c.duplicatedShort.length === 0, `${label}: מפקד הכותרות מצא הפרות (${c.lost.length} אבדו, ${c.duplicatedShort.length} כפולות): ${fmt(c)}`);
}

/** קביעת "התוכן נשמר" — לפי מולטיסט המילים של המנוע + היעדר רשומת content-loss בספר. */
function assertContentPreserved(r, label) {
  const loss = [...r.ledger.issues.values()].filter((x) => x.kind === 'content-loss');
  assert(r.contentPreserved === true && loss.length === 0,
    `${label}: contentPreserved=${r.contentPreserved}, רשומות content-loss=${loss.length}${loss.length ? ' — ' + JSON.stringify(loss[0]).slice(0, 160) : ''}`);
}

/**
 * strict xfail: עד שהתיקון נוחת — הבדיקה נדרשת להיכשל. אחרי FIX_LANDED — בדיקה רגילה.
 * loose=true (למסמכים שנוצרים ע"י מחולל): עוברת-בטעות אינה כשל (המחולל עשוי להשתנות), אך מדווחת.
 */
function bugIt(name, fn, { loose = false } = {}) {
  if (FIX_LANDED) return it(name, fn);
  return it(`[KNOWN-BUG R-01] ${name}`, () => {
    let err = null;
    try { fn(); } catch (e) { err = e; }
    if (err) {
      console.log(`   ⚠ KNOWN-BUG R-01 — נכשלת כצפוי: ${name}\n       ↳ ${String(err.message).split('\n')[0].slice(0, 300)}`);
      return;
    }
    if (loose) {
      console.log(`   ✓ R-01 (loose): "${name}" עוברת — המסמך הנוכחי אינו מפעיל את הבאג או שהבאג תוקן; שקול FIX_LANDED=true`);
      return;
    }
    throw new Error(`R-01: "${name}" עוברת — נראה שהבאג תוקן. הפוך FIX_LANDED=true (או RED_FIX_LANDED=1 לאימות) כדי שהבדיקות יהפכו לרגילות, והדק את tests/e2e/s62-user-questions.test.js מ-"missing <= 2" ל-"=== 0".`);
  });
}

// ═════════════════════════ 1. בדיקות עצמיות ל-oracle (בקרות שליליות לבודק) ═════════════════════════
describe('R-01 · ה-oracle: מודלים סינתטיים (חייב לזהות ולא לסמן שווא)', () => {
  const tok = (type, text, id) => ({ id: 'lt' + id, type, text });
  const head = (tokenId, level) => ({ kind: 'heading', level, tokenId });
  const model = (tokens, items) => ({ tokens, pages: [{ columns: [items, []] }] });
  const T = [tok('p', 'פסקה', 0), tok('h5', 'לשון הפוסקים', 1), tok('h6', 'חילוקי דינים', 2)];

  it('מודל תקין: כל כותרת פעם אחת → אין הפרות', () => {
    const c = headingCensus(model(T, [head(1, 5), head(2, 6)]));
    assertEq(c.expected, 2, 'שתי כותרות צפויות');
    assertEq(c.lost.length + c.duplicatedShort.length + c.badMapping, 0, 'אין הפרות');
  });

  it('כותרת שאבדה (h5 לא נפלטה) → מזוהה כ-lost', () => {
    const c = headingCensus(model(T, [head(2, 6)]));
    assertEq(c.lost.length, 1, 'אובדן אחד');
    assertEq(c.lost[0].text, 'לשון הפוסקים', 'הכותרת שאבדה');
  });

  it('כותרת קצרה שנפלטה פעמיים (תבנית הבאג) → מזוהה כ-duplicatedShort', () => {
    const c = headingCensus(model(T, [head(1, 5), head(2, 6), head(2, 6)]));
    assertEq(c.duplicatedShort.length, 1, 'כפילות אחת');
    assertEq(c.duplicatedShort[0].emitted, 2, 'נפלטה פעמיים');
  });

  it('אובדן + כפילות יחד (התבנית המדויקת של הבאג) → שתי ההפרות', () => {
    const c = headingCensus(model(T, [head(2, 6), head(2, 6)]));
    assertEq(c.lost.length, 1);
    assertEq(c.duplicatedShort.length, 1);
  });

  it('כותרת ארוכה בשני פריטים (שורות) → תקין, ללא סימון שווא', () => {
    const long = [tok('h5', 'המעשה כדבר הנעשה במציאות ועושה במציאות', 0)];
    const c = headingCensus(model(long, [head(0, 5), head(0, 5)]));
    assertEq(c.lost.length + c.duplicatedShort.length, 0, 'כותרת שגולשת לשתי שורות אינה כפילות');
  });

  it('רמות h1–h3 (רצועות/שערים) אינן נספרות', () => {
    const c = headingCensus(model([tok('h3', 'העושה', 0)], []));
    assertEq(c.expected, 0, 'h3 אינה צפויה בתוך הטורים');
    assertEq(c.lost.length, 0, 'ואינה נחשבת אבודה');
  });

  it('tokenId שלא תואם את רמת הטוקן → badMapping (שפיות ה-oracle עצמו)', () => {
    const c = headingCensus(model(T, [head(1, 6), head(2, 6)]));
    assertEq(c.badMapping, 1, 'פריט h6 שמצביע על טוקן h5');
  });
});

// ═════════════════════════ 2. בקרות על קלט תקין (חייבות לעבור על כל מנוע) ═════════════════════════
describe('R-01 · בקרות על קלט תקין', () => {
  it('מסמך בקרה (פסקה בין h5 ל-h6): התוכן נשמר, כל הכותרות נפלטו, המיפוי תקין', () => {
    const r = run(readFixture('heading-rollback-control.txt'));
    assertContentPreserved(r, 'מסמך בקרה');
    assertHeadingsEmittedOnce(r, 'מסמך בקרה');
    assertEq(headingCensus(r).badMapping, 0, 'מיפוי tokenId→טוקן עקבי');
  });

  it('קורפוס אמיתי long_test_text.txt (D-100 תקין): התוכן נשמר, אין כותרת אבודה/כפולה', () => {
    assert(fs.existsSync(CORPUS), 'הקורפוס audits/long_test_text.txt חייב להיות בריפו');
    const r = run(fs.readFileSync(CORPUS, 'utf8'));
    assert(r.pages.length > 500, `הקורפוס צפוי להניב מאות עמודים (התקבלו ${r.pages.length})`);
    assertContentPreserved(r, 'long_test_text');
    assertHeadingsEmittedOnce(r, 'long_test_text');
    const c = headingCensus(r);
    assert(c.expected > 50, `הקורפוס צפוי להכיל עשרות כותרות h4–h7 (נמצאו ${c.expected})`);
    assertEq(c.badMapping, 0, 'מיפוי tokenId→טוקן עקבי בקורפוס');
  });
});

// ═════════════════════════ 3. שחזור הבאג (strict xfail עד שהתיקון נוחת) ═════════════════════════
describe('R-01 · שחזור הבאג', () => {
  bugIt('fixture מינימלי (כותרת 5 ← כותרת 6 בתחתית הטור הימני + פסקה אחריהן): התוכן נשמר', () => {
    assertContentPreserved(run(readFixture('heading-rollback-trigger.txt')), 'fixture מינימלי');
  });

  bugIt('fixture מינימלי: h5 "לשון הפוסקים" נפלטת ו-h6 "חילוקי דינים" נפלטת פעם אחת בדיוק', () => {
    assertHeadingsEmittedOnce(run(readFixture('heading-rollback-trigger.txt')), 'fixture מינימלי');
  });

  bugIt('מסמך הבדיקה הקבוע (522 עמ\'): התוכן נשמר (אין content-loss)', () => {
    const r = run(generateTestDocument({ mode: 'fixed', scale: 'full' }));
    assertContentPreserved(r, 'מסמך הבדיקה הקבוע');
  }, { loose: true });

  bugIt('מסמך הבדיקה הקבוע: אין כותרת אבודה/כפולה (כולל הפגיעה השקטה h4 "טעם הדין")', () => {
    const r = run(generateTestDocument({ mode: 'fixed', scale: 'full' }));
    assertHeadingsEmittedOnce(r, 'מסמך הבדיקה הקבוע');
  }, { loose: true });
});

report('R-01 heading-rollback');
