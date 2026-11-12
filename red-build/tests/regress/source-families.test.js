/**
 * tests/regress/source-families.test.js — משפחות מקור "עוינות" מול אורקל מקור→פלט עצמאי
 * (סוכן 4 — תשתית בדיקות; סעיף 5 בתוכנית ההפעלה: fixtures קטנים + בדיקה ממוקדת + בקרה שלילית לכל משפחה)
 *
 * למה: contentPreserved הוא מולטיסט של מילים חסרות בלבד — הוא לא רואה כפילות, החלפת סדר, הערה שמוצגת
 * פעמיים או דגל סוגריים שגוי. tests/regress/lib/source-oracle.js מנתח את טקסט המקור בעצמו ומשווה לפלט
 * לפי פסקה / כותרת / הערה / סוגריים / גיאומטריה (ראו הקובץ). כאן הוא מורץ על:
 *   א. בקרות שליליות לאורקל עצמו — מודלים מעוותים מפלט אמיתי; חייב לזהות כל סוג הפרה ולא לסמן שווא;
 *   ב. משפחות תקינות — הערות צמודות (×3, ×12), סמן אחרי/לפני פיסוק, הערה בתחילת/בסוף פסקה, שורת-הערה
 *      נדבקת, הערות זהות, סוגריים עם הערה בתוכן, שרשרת כותרות, רצועת h3 — כולן נקיות;
 *   ג. סריקות מיקום (sweeps) — אותו מבנה מקור מוזז צעד-צעד לאורך העמוד כדי להגיע לכל מצב שבירה:
 *      מיקום הערה בתוך פסקה, היסט אנכי מול תחתית עמוד, הערות ארוכות, סוגריים (גם חוצי-שורה), עמודים דלילים,
 *      איזון, רצועת h3 — נקיות;
 *   ד. באגים ידועים, כל אחד עם fixture טריגר + fixture בקרה + סריקה של המשפחה כולה (strict xfail):
 *        R-01  אובדן/כפילות כותרות inline (משפחה של 11 מיקומים; ה-fixture המקורי ב-heading-rollback.test.js)
 *        R-02  הערת שוליים נפלטת פעמיים (בעמוד העוגן ובעמוד סמוך שאין בו עוגן) כשפסקה עם הערה נחצית בין עמודים;
 *              בקורפוס ה-parity מופיעה גם כעותק "רפאים" בעמוד שלפני הפסקה (fixture מינימלי מהקורפוס כלול)
 *        R-03  דגלי סוגריים נשברים כשמילה בתוך/בסוף ( ) נושאת סמן הערה
 *
 * מחזור חיים (strict xfail): כל עוד המזהה אינו ב-FIXED, בדיקות השחזור נדרשות *להיכשל* (ומדפיסות
 * "KNOWN-BUG R-0N") כך ש-main נשאר ירוק בלי להסתיר את הבאג; ברגע שהן עוברות הן נכשלות בהוראה מפורשת
 * להוסיף את המזהה ל-FIXED (או להריץ RED_FIX_LANDED=R-02 / =1 לאימות) — ואז הן בדיקות רגילות. הסריקות
 * מוסיפות הגנה: סוגי ההפרות בכל סריקה חייבים להיות חלק מהקבוצה המותרת לאותו באג — הפרה מסוג אחר היא כשל
 * מיידי (רגרסיה חדשה), גם בזמן שהבאג הידוע פתוח.
 *
 * מחוץ למודל (במכוון; ראו README ב-tests/fixtures/regress): כותרת 7 (הערת-צד), הערות-סיום, הערות מקוננות,
 * '[' ללא סוגר, '[]' ריק, הערה בתוך שורת כותרת — מסמכי הבדיקה נמנעים מהם. ב-README מפורטות 4 התנהגויות
 * (O-1..O-4) שמחכות לסיווג בעלים/סוכן 2 — הן מתועדות, לא נבדקות.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');
const { legacyTypeset } = require('../../src/engine/layout/legacy-imud-flow');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getSettingDefs } = require('../../src/engine/core/settings-registry');
const { generateTestDocument } = require('../../src/ui/test-doc-generator');
const O = require('./lib/source-oracle');
const { V, docBuilder } = O;

const REPO = path.resolve(__dirname, '..', '..');
const FIXTURES = path.join(__dirname, '..', 'fixtures', 'regress');
const AUDITS = path.join(REPO, '..', 'audits');

// ── מתגי מחזור-חיים: מוסיפים מזהה ב-PR שמנחית את התיקון המתאים (ראו הערת הפתיחה) ──
const FIXED = new Set([]); // 'R-01' | 'R-02' | 'R-03'
const ENV_FIXED = String(process.env.RED_FIX_LANDED || '');
const isFixed = (id) => FIXED.has(id) || ENV_FIXED === '1' || ENV_FIXED.split(',').includes(id);

// ── עזרים ──
const legacyDefaults = JSON.parse(fs.readFileSync(path.join(REPO, 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
let _settings = null;
function settings() {
  if (!_settings) _settings = importImudSettings(legacyDefaults, new Set(getSettingDefs().map((r) => r.id)), {}).settings;
  return _settings;
}
const run = (text) => legacyTypeset(text, settings(), {});
const readFixture = (name) => fs.readFileSync(path.join(FIXTURES, name), 'utf8');

/** מריץ את המנוע על מסמך ומחזיר הפרות האורקל (ובאופן אופציונלי גם גיאומטריה). */
function check(doc, { geo = false } = {}) {
  const r = run(doc);
  let v = O.compareToSource(O.parseSource(doc), r);
  if (geo) v = v.concat(O.geometryViolations(r, settings()));
  return { r, v };
}
const codesOf = (v) => [...new Set(v.map((x) => x.code))];
const fmtV = (v, n = 4) => v.slice(0, n).map((x) => `${x.code}: ${x.detail}`).join(' · ') + (v.length > n ? ` … (+${v.length - n})` : '');

function assertClean(v, label) { assert(v.length === 0, `${label}: ${v.length} הפרות — ${fmtV(v)}`); }
function assertOnlyCodes(v, allowed, label) {
  const extra = v.filter((x) => !allowed.includes(x.code));
  assert(extra.length === 0, `${label}: הפרות מסוג שאינו מותר (${allowed.join('/')}) — ${fmtV(extra)}`);
}
function assertNoCode(v, code, label) {
  const hit = v.filter((x) => x.code === code);
  assert(hit.length === 0, `${label}: ${hit.length}× ${code} — ${fmtV(hit)}`);
}

/**
 * strict xfail לפי באג: עד שהמזהה ב-FIXED — הבדיקה נדרשת להיכשל *מהסיבה הידועה* (expect = תבנית שחייבת
 * להופיע בהודעת הכשל; כשל מסיבה אחרת — שגיאת בדיקה, קריסה, רגרסיה אחרת — הוא כשל אמיתי ולא "באג ידוע").
 * loose (למסמכים שנוצרים ע"י מחולל): עוברת-בטעות אינה כשל אלא הודעה.
 */
function bugIt(id, name, fn, { loose = false, expect } = {}) {
  if (isFixed(id)) return it(name, fn);
  return it(`[KNOWN-BUG ${id}] ${name}`, () => {
    let err = null;
    try { fn(); } catch (e) { err = e; }
    if (err) {
      if (expect && !expect.test(String(err.message))) {
        throw new Error(`${id}: "${name}" נכשלת מסיבה שאינה הבאג הידוע (צפוי ${expect}): ${String(err.message).slice(0, 300)}`);
      }
      console.log(`   ⚠ KNOWN-BUG ${id} — נכשלת כצפוי: ${name}\n       ↳ ${String(err.message).split('\n')[0].slice(0, 320)}`);
      return;
    }
    if (loose) {
      console.log(`   ✓ ${id} (loose): "${name}" עוברת — המסמך הנוכחי אינו מפעיל את הבאג או שהבאג תוקן; שקול להוסיף ${id} ל-FIXED`);
      return;
    }
    throw new Error(`${id}: "${name}" עוברת — נראה שהבאג תוקן. הוסף '${id}' ל-FIXED ב-tests/regress/source-families.test.js (או RED_FIX_LANDED=${id} לאימות) כדי שהבדיקות יהפכו לרגילות.`);
  });
}

const CH = 'כותרת 2 - פרק א\n';

// ═════════════════════════ א. בקרות שליליות לאורקל ═════════════════════════
describe('אורקל מקור→פלט · בקרות שליליות (חייב לזהות כל סוג הפרה ולא לסמן שווא)', () => {
  // מסמך בסיס עם: שתי הערות בעמודים שונים, טווח סוגריים, שרשרת כותרות, פסקאות. הפלט אמיתי — כך שאם מבנה
  // הפלט של המנוע ישתנה, הבקרות נכשלות בקול (ולא האורקל "עובר" על הכול).
  const g = docBuilder();
  const body = CH + g.w(30) + `[${g.w(4)}] ` + g.w(10) + ` (${g.w(3)}) ` + g.w(10) + '\n'
    + 'כותרת 4 - ' + g.w(2) + '\nכותרת 5 - ' + g.w(2) + '\n' + g.w(40) + '\n'
    + g.w(900) + '\n' // מילוי: דוחף את ההערה הבאה לעמוד אחר
    + g.w(30) + `[${g.w(4)}] ` + g.w(20) + '\n';
  const doc = g.doc(body);
  const base = run(doc);
  const items = O.parseSource(doc);
  const clonePages = () => JSON.parse(JSON.stringify(base.pages));
  const view = (pages, extra = {}) => Object.assign({}, base, { pages }, extra);
  const firstItem = (pages, pred) => { for (const p of pages) for (const col of p.columns || []) for (const it of col) if (pred(it, p)) return { it, col, p }; return null; };
  const notePages = base.pages.map((p, i) => [p, i]).filter(([p]) => (p.footnotes || []).length);

  it('בסיס: הפלט האמיתי נקי מכל הפרה (כולל גיאומטריה)', () => {
    assertClean(O.compareToSource(items, base), 'compare');
    assertClean(O.geometryViolations(base, settings()), 'geometry');
  });
  it('בסיס: ההערות נחתו בשני עמודים שונים (תנאי לבקרת הסדר)', () => {
    assertEq(notePages.length, 2, 'שני עמודים עם הערות');
  });

  it('מילה שנשמטה מפסקה → PARA_WORDS', () => {
    const pages = clonePages();
    const { it: line } = firstItem(pages, (x) => x.kind === 'paragraph' && x.words.length > 4 && !(x.markerIdx || []).length && !x.parenFlags.some(Boolean));
    line.words.splice(2, 1); line.parenFlags && line.parenFlags.splice(2, 1);
    assert(codesOf(O.compareToSource(items, view(pages))).includes(V.PARA_WORDS), 'לא זוהה');
  });
  it('שתי מילים שהוחלף סדרן → PARA_WORDS', () => {
    const pages = clonePages();
    const { it: line } = firstItem(pages, (x) => x.kind === 'paragraph' && x.words.length > 4 && !(x.markerIdx || []).length);
    [line.words[1], line.words[2]] = [line.words[2], line.words[1]];
    assert(codesOf(O.compareToSource(items, view(pages))).includes(V.PARA_WORDS), 'לא זוהה');
  });
  it('שורת פסקה שנפלטה פעמיים (אותו lineIdx) → PARA_LINES', () => {
    const pages = clonePages();
    const { it: line, col } = firstItem(pages, (x) => x.kind === 'paragraph' && x.lineIdx === 1);
    col.push(JSON.parse(JSON.stringify(line)));
    assert(codesOf(O.compareToSource(items, view(pages))).includes(V.PARA_LINES), 'לא זוהה');
  });
  it('פסקה שלמה שנעלמה מהפלט → PARA_LOST', () => {
    const pages = clonePages();
    for (const p of pages) for (const col of p.columns || []) for (let i = col.length - 1; i >= 0; i--) if (col[i].kind === 'paragraph' && col[i].tokenId === 1) col.splice(i, 1);
    assert(codesOf(O.compareToSource(items, view(pages))).includes(V.PARA_LOST), 'לא זוהה');
  });
  it('בלוק הערות שהוכפל → NOTE_DUP', () => {
    const pages = clonePages();
    const p = pages[notePages[0][1]];
    p.footnotes.push(JSON.parse(JSON.stringify(p.footnotes[0])));
    const c = codesOf(O.compareToSource(items, view(pages)));
    assert(c.includes(V.NOTE_DUP), 'לא זוהה: ' + c.join(','));
  });
  it('בלוק הערות שנמחק → NOTE_LOST', () => {
    const pages = clonePages();
    pages[notePages[1][1]].footnotes = [];
    const c = codesOf(O.compareToSource(items, view(pages)));
    assert(c.includes(V.NOTE_LOST), 'לא זוהה: ' + c.join(','));
  });
  it('אותן הערות בסדר הפוך (החלפת בלוקים בין עמודים) → NOTE_ORDER ורק הוא', () => {
    const pages = clonePages();
    const a = notePages[0][1], b = notePages[1][1];
    [pages[a].footnotes, pages[b].footnotes] = [pages[b].footnotes, pages[a].footnotes];
    assertEq(codesOf(O.compareToSource(items, view(pages))).join(','), V.NOTE_ORDER, 'צפוי NOTE_ORDER בלבד');
  });
  it('סמן הערה שנמחק מהשורה → MARKER_COUNT', () => {
    const pages = clonePages();
    const { it: line } = firstItem(pages, (x) => x.kind === 'paragraph' && (x.markerIdx || []).length);
    line.markerIdx = [];
    assert(codesOf(O.compareToSource(items, view(pages))).includes(V.MARKER_COUNT), 'לא זוהה');
  });
  it('דגל סוגריים שהתהפך → PAREN_SCOPE', () => {
    const pages = clonePages();
    const { it: line } = firstItem(pages, (x) => x.kind === 'paragraph' && x.parenFlags && x.parenFlags.some(Boolean));
    const k = line.parenFlags.findIndex(Boolean);
    line.parenFlags[k] = false;
    assert(codesOf(O.compareToSource(items, view(pages))).includes(V.PAREN_SCOPE), 'לא זוהה');
  });
  it('כותרת inline שנמחקה → HEADING_LOST; וכותרת שהוכפלה → HEADING_DUP', () => {
    const lost = clonePages();
    const { col, it: h } = firstItem(lost, (x) => x.kind === 'heading');
    col.splice(col.indexOf(h), 1);
    assert(codesOf(O.compareToSource(items, view(lost))).includes(V.HEADING_LOST), 'אובדן לא זוהה');
    const dup = clonePages();
    const f = firstItem(dup, (x) => x.kind === 'heading');
    f.col.push(JSON.parse(JSON.stringify(f.it)));
    assert(codesOf(O.compareToSource(items, view(dup))).includes(V.HEADING_DUP), 'כפילות לא זוהתה');
  });
  it('contentPreserved=false → CONTENT_PRESERVED; רשומת content-loss בספר → LEDGER_LOSS', () => {
    assert(codesOf(O.compareToSource(items, view(clonePages(), { contentPreserved: false }))).includes(V.CONTENT_PRESERVED), 'CONTENT_PRESERVED לא זוהה');
    const ledger = { issues: new Map([['x', { kind: 'content-loss' }]]) };
    assert(codesOf(O.compareToSource(items, view(clonePages(), { ledger }))).includes(V.LEDGER_LOSS), 'LEDGER_LOSS לא זוהה');
  });
  it('מספר טוקנים שונה ממספר פריטי המקור → TOKEN_COUNT', () => {
    const other = O.parseSource(doc + '\n' + g.w(5) + '\n');
    assert(codesOf(O.compareToSource(other, base)).includes(V.TOKEN_COUNT), 'לא זוהה');
  });
  it('גיאומטריה: שורה שהוזזה על קודמתה → GEO_OVERLAP; מילה מחוץ לעמוד → GEO_OUTSIDE', () => {
    const pages = clonePages();
    const col = pages[notePages[0][1]].columns.find((c) => c.length > 3);
    col[2].y = col[1].y; // בדיוק על הקודמת
    assert(codesOf(O.geometryViolations(view(pages), settings())).includes(V.GEO_OVERLAP), 'חפיפה לא זוהתה');
    const far = clonePages();
    const c2 = far[notePages[0][1]].columns.find((c) => c.length > 3);
    c2[1].y = 99999;
    assert(codesOf(O.geometryViolations(view(far), settings())).includes(V.GEO_OUTSIDE), 'חריגה מהעמוד לא זוהתה');
  });
});

// ═════════════════════════ ב. משפחות תקינות ═════════════════════════
describe('משפחות מקור תקינות · אפס הפרות (כולל גיאומטריה)', () => {
  const fam = [
    ['בסיס', (g) => CH + g.w(60) + '\n'],
    ['הערות צמודות ×3', (g) => CH + g.w(12) + `[${g.w(2)}][${g.w(2)}][${g.w(2)}] ` + g.w(10) + '\n'],
    ['הערות צמודות ×12', (g) => CH + g.w(12) + Array.from({ length: 12 }, () => `[${g.w(2)}]`).join('') + ' ' + g.w(10) + '\n'],
    ['סמן אחרי פיסוק (. , : ; ? !)', (g) => CH + `${g.w(1)}.[${g.w(2)}] ${g.w(1)},[${g.w(1)}] ${g.w(1)}:[${g.w(1)}] ${g.w(1)};[${g.w(1)}] ${g.w(1)}?[${g.w(1)}] ${g.w(1)}![${g.w(1)}] ${g.w(20)}\n`],
    ['סמן לפני פיסוק', (g) => CH + `${g.w(1)} [${g.w(2)}]. ${g.w(1)} [${g.w(1)}], ${g.w(1)} [${g.w(1)}]: ${g.w(20)}\n`],
    ['הערה בתחילת פסקה (אחרי כותרת)', (g) => CH + `[${g.w(2)}] ` + g.w(30) + '\n'],
    ['הערה בסוף פסקה', (g) => CH + g.w(30) + ` [${g.w(2)}]\n`],
    ['שורת-הערה נדבקת לפסקה הקודמת', (g) => CH + g.w(30) + '\n' + `[${g.w(3)}]\n` + g.w(20) + '\n'],
    ['שורה שפותחת בהערה אחרי פסקה (הדבקת בלוק)', (g) => CH + g.w(30) + '\n' + `[${g.w(3)}] ` + g.w(20) + '\n' + g.w(10) + '\n'],
    ['אותו טקסט הערה פעמיים', (g) => { const a = g.w(2); return CH + g.w(20) + `[${a}] ` + g.w(20) + `[${a}] ` + g.w(10) + '\n'; }],
    ['סוגריים פשוטים', (g) => CH + g.w(20) + ` (${g.w(2)}) ` + g.w(20) + '\n'],
    ['הערה שמכילה סוגריים', (g) => CH + g.w(20) + `[${g.w(1)} (${g.w(2)}) ${g.w(1)}] ` + g.w(20) + '\n'],
    ['שרשרת כותרות h4–h6 + פרוזה', (g) => CH + g.w(20) + '\nכותרת 4 - ' + g.w(2) + '\nכותרת 5 - ' + g.w(2) + '\nכותרת 6 - ' + g.w(2) + '\n' + g.w(30) + '\n'],
    ['רצועת h3 + הערות משני צדיה', (g) => CH + g.w(20) + `[${g.w(3)}]\nכותרת 3 - ` + g.w(2) + '\n' + g.w(40) + `[${g.w(3)}]\n`],
    ['שני פרקים קצרים', (g) => CH + g.w(15) + '\nכותרת 2 - ' + g.w(1) + '\n' + g.w(15) + `[${g.w(2)}]\n`]
  ];
  for (const [name, build] of fam) {
    it(name, () => {
      const g = docBuilder();
      const { v } = check(g.doc(build(g)), { geo: true });
      assertClean(v, name);
    });
  }
});

// ═════════════════════════ ג. סריקות מיקום (נקיות) ═════════════════════════
describe('סריקות מיקום · אותו מבנה מוזז לאורך העמוד — אפס הפרות', () => {
  /** מריץ את כל הנקודות; מחזיר {runs, bad:[{label,v}]}. geoEvery = כל כמה נקודות לבדוק גם גיאומטריה. */
  function sweep(points, geoEvery = 5) {
    const bad = [];
    let runs = 0;
    for (const { label, doc } of points) {
      const { v } = check(doc, { geo: runs % geoEvery === 0 });
      runs++;
      if (v.length) bad.push({ label, v });
    }
    return { runs, bad };
  }
  const assertSweepClean = ({ runs, bad }, name) =>
    assert(bad.length === 0, `${name}: ${bad.length}/${runs} נקודות נכשלו — ${bad.slice(0, 3).map((b) => `[${b.label}] ${fmtV(b.v, 2)}`).join(' | ')}`);

  it('מיקום הערה בתוך פסקה של 150 מילים (k) × אורך הערה × מילוי קודם', () => {
    const pts = [];
    const ks = [...Array.from({ length: 13 }, (_, i) => i), ...Array.from({ length: 28 }, (_, i) => 15 + i * 5)];
    for (const f of [0, 17, 41]) for (const L of [2, 15, 60]) for (const k of ks) {
      const g = docBuilder();
      const filler = f ? g.w(f) + '\n' : '';
      const ws = Array.from({ length: 150 }, () => g.w(1));
      const note = `[${g.w(L)}]`;
      // k=0 אחרי מילוי = שורה שפותחת בהערה ⇒ נדבקת לפסקה הקודמת (הדבקת בלוק של המקור; משפחה נפרדת למעלה)
      if (k === 0 && f) continue;
      pts.push({ label: `f=${f} L=${L} k=${k}`, doc: g.doc(CH + filler + ws.slice(0, k).join(' ') + note + (k < 150 ? ' ' : '') + ws.slice(k).join(' ') + '\n') });
    }
    assertSweepClean(sweep(pts), 'מיקום הערה');
  });

  it('היסט אנכי מול תחתית עמוד: מילוי K=0..900 לפני פסקה עם הערה (8/40/120 מילים)', () => {
    const pts = [];
    for (const L of [8, 40, 120]) for (let K = 0; K <= 900; K += 6) {
      const g = docBuilder();
      pts.push({ label: `L=${L} K=${K}`, doc: g.doc(CH + (K ? g.w(K) + '\n' : '') + g.w(40) + `[${g.w(L)}] ` + g.w(40) + '\n' + g.w(20) + '\n') });
    }
    assertSweepClean(sweep(pts), 'תחתית עמוד');
  });

  it('הערות ארוכות (1…300 מילים) כשהפסקה פותחת את העמוד — אין אובדן ואין כפילות', () => {
    const pts = [];
    // מוגבל לאורכים שבהם הפסקה אינה נמשכת לעמוד נוסף (תחום R-02 נבדק בנפרד): נשאר בקבוצת התקינים
    for (const L of [1, 5, 20, 50, 100, 200, 300]) {
      const g = docBuilder();
      pts.push({ label: `L=${L}`, doc: g.doc(CH + g.w(20) + `[${g.w(L)}] ` + g.w(10) + '\n' + g.w(10) + '\n') });
    }
    assertSweepClean(sweep(pts, 1), 'הערות ארוכות');
  });

  it('סוגריים בלי הערות: טווח של 1/2/12/40 מילים בכל מיקום (כולל חוצה-שורה) × מילוי', () => {
    const pts = [];
    for (const f of [0, 17]) for (const s of [1, 2, 12, 40]) for (let k = 0; k <= 100; k += 4) {
      const g = docBuilder();
      const ws = Array.from({ length: 100 }, () => g.w(1));
      const close = Math.min(99, k + s - 1);
      const parts = ws.map((w, i) => (i === k ? '(' : '') + w + (i === close ? ')' : ''));
      pts.push({ label: `f=${f} s=${s} k=${k}`, doc: g.doc(CH + (f ? g.w(f) + '\n' : '') + parts.join(' ') + '\n') });
    }
    assertSweepClean(sweep(pts, 8), 'סוגריים');
  });

  it('עמודים דלילים: 1–12 מילים × 1–4 פסקאות; 1–4 פרקים קצרים', () => {
    const pts = [];
    for (let n = 1; n <= 12; n++) for (let paras = 1; paras <= 4; paras++) {
      const g = docBuilder();
      pts.push({ label: `n=${n} paras=${paras}`, doc: g.doc(CH + Array.from({ length: paras }, () => g.w(n)).join('\n') + '\n') });
    }
    for (let chs = 1; chs <= 4; chs++) for (let n = 1; n <= 40; n += 3) {
      const g = docBuilder();
      pts.push({ label: `chs=${chs} n=${n}`, doc: g.doc(Array.from({ length: chs }, () => `כותרת 2 - ${g.w(1)}\n${g.w(n)}\n`).join('')) });
    }
    assertSweepClean(sweep(pts, 1), 'עמודים דלילים');
  });

  it('איזון: פסקה בודדת באורך 1…520 מילים (מילוי חלקי של העמוד האחרון)', () => {
    const pts = [];
    for (let n = 1; n <= 520; n += 5) { const g = docBuilder(); pts.push({ label: `n=${n}`, doc: g.doc(CH + g.w(n) + '\n') }); }
    assertSweepClean(sweep(pts, 7), 'איזון');
  });
});

// ═════════════════════════ ד. R-01 — כותרות inline (משפחה) ═════════════════════════
describe('R-01 · שרשרת כותרות inline בכל היסט אנכי — משפחת הבאג של heading-rollback', () => {
  const CHAINS = {
    h4: ['כותרת 4 - טעם הדין\n'],
    h5: ['כותרת 5 - מקור הדין\n'],
    h6: ['כותרת 6 - חילוקי דינים\n'],
    'h5-h6': ['כותרת 5 - לשון הפוסקים\n', 'כותרת 6 - חילוקי דינים\n'],
    'h4-h6': ['כותרת 4 - טעם הדין\n', 'כותרת 6 - פרטי דינים\n'],
    'h4-h5-h6': ['כותרת 4 - טעם הדין\n', 'כותרת 5 - מקור הדין\n', 'כותרת 6 - פרטי דינים\n'],
    h3: ['כותרת 3 - רצועה חוצה טורים\n'],
    'h3-h4': ['כותרת 3 - רצועה חוצה טורים\n', 'כותרת 4 - טעם הדין\n']
  };
  const family = (() => {
    const all = [];
    for (const [cn, hs] of Object.entries(CHAINS)) for (let K = 0; K <= 400; K += 2) {
      const g = docBuilder();
      const doc = g.doc(CH + (K ? g.w(K) + '\n' : '') + hs.join('') + g.w(40) + '\n' + g.w(30) + '\n');
      all.push({ label: `${cn} K=${K}`, v: check(doc).v });
    }
    return all;
  })();
  const R01_CODES = [V.HEADING_LOST, V.HEADING_DUP, V.CONTENT_PRESERVED, V.LEDGER_LOSS];
  const failing = family.filter((x) => x.v.length);

  it('כל ההפרות במשפחה הן מסוג R-01 בלבד (אובדן/כפילות כותרת, וההד של המנוע עצמו על האובדן)', () => {
    assertOnlyCodes(failing.flatMap((x) => x.v), R01_CODES, 'סריקת כותרות');
  });
  bugIt('R-01', `אין כותרת שאבדה או שהוכפלה באף היסט (${family.length} נקודות; כרגע ${failing.length} נכשלות: ${failing.slice(0, 3).map((x) => x.label).join(', ')}…)`, () => {
    assert(failing.length === 0, `${failing.length}/${family.length} נקודות: ${failing.slice(0, 4).map((x) => `[${x.label}] ${fmtV(x.v, 2)}`).join(' | ')}`);
  }, { expect: /HEADING_(LOST|DUP)/ });
  it('בקרה: שרשרת בודדת h4 / h6 / h3 / h3-h4 נקיות בכל היסט (R-01 דורש שרשרת עם שתי כותרות inline או יותר)', () => {
    const clean = family.filter((x) => /^(h4|h5|h6|h3|h3-h4) K=/.test(x.label));
    assert(clean.length > 0 && clean.every((x) => x.v.length === 0), `נכשלו: ${clean.filter((x) => x.v.length).slice(0, 3).map((x) => x.label).join(', ')}`);
  });
});

// ═════════════════════════ ה. R-02 — הערה שנפלטת פעמיים ═════════════════════════
describe('R-02 · פסקה עם הערה שנמשכת מעמוד לעמוד — ההערה נפלטת בשני העמודים', () => {
  /** מסמך: מילוי K מילים, פסקה של P מילים עם הערה של L מילים אחרי מילה k, וזנב. מילים ייחודיות. */
  function build(K, P, k, L = 10) {
    const g = docBuilder();
    const ws = Array.from({ length: P }, () => g.w(1));
    const para = ws.slice(0, k).join(' ') + `[${g.w(L)}] ` + ws.slice(k).join(' ');
    return g.doc(CH + (K ? g.w(K) + '\n' : '') + para + '\n' + g.w(30) + '\n');
  }
  // fixtures סטטיים (טקסט עברי): טריגר — הפסקה נמשכת מעמוד 4 ל-5; בקרה — אותה פסקה שפותחת את עמוד 5
  const trigger = readFixture('note-duplicate-trigger.txt');
  const control = readFixture('note-duplicate-control.txt');

  it('בקרה (fixture): אותה פסקה והערה כשהיא נכנסת בעמוד אחד — אפס הפרות', () => {
    assertClean(check(control, { geo: true }).v, 'note-duplicate-control.txt');
  });
  it('אבחון הטריגר: הפסקה נפרשת על שני עמודים (אחרת הבדיקה לא מכסה את המצב) ויש הערה אחת במקור', () => {
    const r = run(trigger);
    const pages = new Set();
    r.pages.forEach((p, i) => { for (const col of p.columns || []) for (const it of col) if (it.kind === 'paragraph' && it.tokenId === 2) pages.add(i); });
    assertEq(pages.size, 2, 'הפסקה עם ההערה נפרשת על שני עמודים');
    assertEq(O.parseSource(trigger).flatMap((x) => x.notes || []).length, 1, 'הערה אחת במקור');
  });
  bugIt('R-02', 'fixture טריגר: ההערה נפלטת בדיוק פעם אחת', () => {
    assertNoCode(check(trigger).v, V.NOTE_DUP, 'note-duplicate-trigger.txt');
  }, { expect: /NOTE_DUP/ });

  // משפחה: פסקה של 200/300 מילים, הערה ב-10%/50%/90% מהפסקה, מילוי 0..900 — הערה יחידה של 10 מילים
  const famPts = [];
  for (const P of [200, 300]) for (const frac of [0.1, 0.5, 0.9]) for (let K = 0; K <= 900; K += 7) famPts.push({ P, frac, K });
  const famV = famPts.map(({ P, frac, K }) => ({ label: `P=${P} k=${Math.round(P * frac)} K=${K}`, v: check(build(K, P, Math.round(P * frac))).v }));
  const famBad = famV.filter((x) => x.v.length);

  it('סריקת המשפחה: כל ההפרות הן NOTE_DUP בלבד (לא אובדן, לא סדר, לא סוג אחר)', () => {
    assertOnlyCodes(famBad.flatMap((x) => x.v), [V.NOTE_DUP], 'סריקת הערות');
  });
  bugIt('R-02', `סריקת המשפחה (${famV.length} נקודות): כל הערה נפלטת פעם אחת (כרגע ${famBad.length} נקודות נכשלות)`, () => {
    assert(famBad.length === 0, `${famBad.length}/${famV.length} נקודות: ${famBad.slice(0, 3).map((x) => `[${x.label}] ${fmtV(x.v, 1)}`).join(' | ')}`);
  }, { expect: /NOTE_DUP/ });
  it('בקרה: סריקה אחרת של אותה מערכת (פסקאות של 120 מילים — לא נמשכות לעמוד נוסף עם הערה) נקייה', () => {
    const bad = [];
    for (const frac of [0.1, 0.5, 0.9]) for (let K = 0; K <= 900; K += 11) {
      const v = check(build(K, 120, Math.round(120 * frac))).v;
      if (v.length) bad.push({ label: `k=${Math.round(120 * frac)} K=${K}`, v });
    }
    assert(bad.length === 0, `${bad.length} נקודות: ${bad.slice(0, 3).map((x) => `[${x.label}] ${fmtV(x.v, 1)}`).join(' | ')}`);
  });

  // וריאנט מהקורפוס האמיתי: מינימיזציה (ddmin: 466 → 6 שורות גוף, 69 הרצות) של audits/no_long_test_text.txt —
  // כל שורה היא שורה מילה-במילה מהמקור. פסקה + שורת-הערה (נדבקת אליה) אחרי רצועת h3; הפסקה נחצית בין העמודים
  // והערה בת 65 מילים נפלטת בשניהם. בקרה = זוג מינימלי: אותו מסמך בלי שורת "כותרת 3" (ההפרש היחיד) — עובר.
  const pTrigger = readFixture('note-duplicate-parity-trigger.txt');
  const pControl = readFixture('note-duplicate-parity-control.txt');
  const noteParaPages = (r) => { // עמודים (1-based) שבהם יש שורות של הפסקה הנושאת סמן הערה
    let tok = null;
    for (const p of r.pages) for (const col of p.columns || []) for (const it of col) if (it.kind === 'paragraph' && (it.markerIdx || []).length && tok === null) tok = it.tokenId;
    const pg = new Set();
    r.pages.forEach((p, i) => { for (const col of p.columns || []) for (const it of col) if (it.kind === 'paragraph' && it.tokenId === tok) pg.add(i + 1); });
    return [...pg];
  };
  it('זוג מינימלי (קורפוס parity): הבקרה זהה לטריגר פרט לשורת "כותרת 3" היחידה', () => {
    const t = pTrigger.split('\n'), c = pControl.split('\n');
    assertEq(t.filter((l) => /^כותרת 3 /.test(l)).length, 1, 'בטריגר שורת כותרת 3 אחת');
    assertEq(t.filter((l) => !/^כותרת 3 /.test(l)).join('\n'), c.join('\n'), 'בקרה = טריגר פחות שורת כותרת 3');
  });
  it('בקרה (fixture מינימלי מהקורפוס): בלי רצועת h3 הפסקה נכנסת בעמוד אחד וההערה פעם אחת — אפס הפרות', () => {
    assertClean(check(pControl, { geo: true }).v, 'note-duplicate-parity-control.txt');
    assertEq(noteParaPages(run(pControl)).length, 1, 'הפסקה עם ההערה בעמוד אחד');
  });
  it('אבחון (fixture מינימלי מהקורפוס): הפסקה נחצית בין שני עמודים והמקור מכיל הערה אחת בת 65 מילים', () => {
    assertEq(noteParaPages(run(pTrigger)).length, 2, 'הפסקה עם ההערה נפרשת על שני עמודים');
    const notes = O.parseSource(pTrigger).flatMap((x) => x.notes || []);
    assertEq(notes.length, 1, 'הערה אחת במקור');
    assertEq(notes[0].length, 65, 'אורך ההערה');
  });
  bugIt('R-02', 'fixture מינימלי מהקורפוס (parity): ההערה בת 65 המילים נפלטת פעם אחת (כרגע בעמוד 5 וגם בעמוד 6)', () => {
    assertNoCode(check(pTrigger).v, V.NOTE_DUP, 'note-duplicate-parity-trigger.txt');
  }, { expect: /NOTE_DUP/ });

  // קורפוסים אמיתיים — מניין ההערות שנפלטו מול המקור (העברת ההערות נספרת מהמקור הגולמי; אינה תלויה בטוקנייזר)
  function noteCensus(text) {
    const src = new Map();
    for (const line of text.split(/\r?\n/)) for (const n of O.splitNotes(line).notes) { const k = n.split(/\s+/).filter(Boolean).join(' '); if (k) src.set(k, (src.get(k) || 0) + 1); }
    const out = new Map();
    for (const u of O.censusOutput(run(text)).units) { const k = u.words.join(' '); if (k) out.set(k, (out.get(k) || 0) + 1); }
    let extra = 0, missing = 0;
    for (const [k, c] of out) if (c > (src.get(k) || 0)) extra += c - (src.get(k) || 0);
    for (const [k, c] of src) if ((out.get(k) || 0) < c) missing += c - (out.get(k) || 0);
    return { extra, missing, srcTotal: [...src.values()].reduce((a, b) => a + b, 0) };
  }
  it('בקרה (קורפוס אמיתי, 647 עמודים): long_test_text.txt — כל הערה פעם אחת, אפס חסרות', () => {
    const c = noteCensus(fs.readFileSync(path.join(AUDITS, 'long_test_text.txt'), 'utf8'));
    assert(c.srcTotal > 0, 'הקורפוס ריק מהערות?');
    assert(c.extra === 0 && c.missing === 0, `עודפות=${c.extra} חסרות=${c.missing}`);
  });
  bugIt('R-02', 'קורפוס ה-parity (no_long_test_text.txt, 9 הערות במקור): אין הערה עודפת — כרגע הערה של 65 מילים נפלטת פעמיים', () => {
    const c = noteCensus(fs.readFileSync(path.join(AUDITS, 'no_long_test_text.txt'), 'utf8'));
    assertEq(c.missing, 0, 'אין הערות חסרות');
    assert(c.extra === 0, `הערות עודפות=${c.extra} (מקור=${c.srcTotal})`);
  }, { expect: /הערות עודפות/ });
  bugIt('R-02', 'מסמך הבדיקה הקבוע (generateTestDocument fixed/full): אין הערות עודפות — כרגע ≈117', () => {
    const c = noteCensus(generateTestDocument({ mode: 'fixed', scale: 'full' }));
    assert(c.extra === 0, `הערות עודפות=${c.extra} מתוך ${c.srcTotal} במקור`);
  }, { loose: true, expect: /הערות עודפות/ });
});

// ═════════════════════════ ו. R-03 — דגלי סוגריים והערה ═════════════════════════
describe('R-03 · מילה בתוך/בסוף ( ) שנושאת סמן הערה מפילה את דגלי הסוגריים', () => {
  const trigger = readFixture('paren-note-trigger.txt');
  const control = readFixture('paren-note-control.txt');

  it('בקרה (fixture): אותם טווחי סוגריים כשההערה נושאת מילה שמחוץ לסוגריים — אפס הפרות', () => {
    assertClean(check(control, { geo: true }).v, 'paren-note-control.txt');
  });
  it('אבחון הטריגר: שתי פסקאות עם טווח סוגריים והערה אחת בכל אחת', () => {
    const items = O.parseSource(trigger).filter((x) => x.kind === 'p');
    assertEq(items.length, 2, 'שתי פסקאות');
    assert(items.every((x) => x.notes.length === 1 && /[()]/.test(x.words.join(' '))), 'לכל פסקה סוגריים והערה');
  });
  bugIt('R-03', 'fixture טריגר: דגלי הסוגריים נכונים בשתי הפסקאות (")[הערה" הדליפה את הדגל לשאר הפסקה; הערה בתוך הטווח איפסה אותו)', () => {
    const v = check(trigger).v;
    assertOnlyCodes(v, [V.PAREN_SCOPE], 'paren-note-trigger.txt');
    assertNoCode(v, V.PAREN_SCOPE, 'paren-note-trigger.txt');
  }, { expect: /PAREN_SCOPE/ });
  bugIt('R-03', 'חומרת הבאג (fixture טריגר, פסקה א\'): מספר המילים המסומנות "בתוך סוגריים" שווה למספר המילים שבטווח — כרגע ההדלפה מסמנת את כל שאר הפסקה', () => {
    // ")[הערה" משאיר את מונה העומק פתוח ⇒ כל מילה שאחרי הטווח נמדדת/מרונדרת בגודל הסוגריים המוקטן
    const r = run(trigger);
    const m = O.censusOutput(r).paras.get(1);
    const flags = [...m.keys()].sort((a, b) => a - b).flatMap((k) => m.get(k).parens);
    const src = O.parseSource(trigger).filter((x) => x.kind === 'p')[0];
    const expectedIn = O.parenScope(src.words).filter(Boolean).length;
    const gotIn = flags.filter((f) => f === true).length;
    assertEq(gotIn, expectedIn, `מילים מסומנות כבתוך סוגריים: בפועל ${gotIn}, בטווח ${expectedIn}`);
  }, { expect: /מילים מסומנות/ });

  // משפחה: טווח של s מילים במיקום k בפסקה של 100 מילים; הערה בתוך הטווח / צמודה ל-')' (ללא הערה — נבדק בסריקות הנקיות)
  const famPts = [];
  for (const f of [0, 17]) for (const s of [1, 2, 12, 40]) for (let k = 0; k <= 100; k += 4) for (const where of ['inside', 'after-close']) famPts.push({ f, s, k, where });
  const famV = famPts.map(({ f, s, k, where }) => {
    const g = docBuilder();
    const ws = Array.from({ length: 100 }, () => g.w(1));
    const open = k, close = Math.min(99, k + s - 1), mid = Math.floor((open + close) / 2);
    const parts = ws.map((w, i) => {
      let x = w;
      if (i === open) x = '(' + x;
      if (i === close) { x += ')'; if (where === 'after-close') x += `[${g.w(2)}]`; }
      if (where === 'inside' && i === mid) x += `[${g.w(2)}]`;
      return x;
    });
    return { label: `f=${f} s=${s} k=${k} ${where}`, v: check(g.doc(CH + (f ? g.w(f) + '\n' : '') + parts.join(' ') + '\n')).v };
  });
  const famBad = famV.filter((x) => x.v.length);
  it('סריקת המשפחה: כל ההפרות הן PAREN_SCOPE בלבד (התוכן, ההערות והשורות תקינים)', () => {
    assertOnlyCodes(famBad.flatMap((x) => x.v), [V.PAREN_SCOPE], 'סריקת סוגריים+הערה');
  });
  bugIt('R-03', `סריקת המשפחה (${famV.length} נקודות): דגלי הסוגריים נכונים בכל מיקום (כרגע ${famBad.length} נקודות נכשלות)`, () => {
    assert(famBad.length === 0, `${famBad.length}/${famV.length}: ${famBad.slice(0, 3).map((x) => `[${x.label}] ${fmtV(x.v, 1)}`).join(' | ')}`);
  }, { expect: /PAREN_SCOPE/ });
  // ── קורפוסים אמיתיים: מניין פסקאות שדגלי הסוגריים שלהן שגויים מול טקסט המקור של הטוקן ──
  // (נבדק לפי token.text, כלומר בלי תלות בניתוח המקור של האורקל; פסקה עם סוגריים לא מאוזנים — מחוץ למודל)
  const NOTE_SPACE = String.fromCharCode(0xE000); // מציין-מקום של המנוע לרווח בתוך טקסט הערה (legacy-imud-flow.js)
  function parenCensus(text) {
    const r = run(text);
    const out = O.censusOutput(r);
    let total = 0, withSpans = 0, withSpansAndNote = 0, bad = 0;
    r.tokens.forEach((t, i) => {
      if (t.type !== 'p') return;
      total++;
      const sp = O.splitNotes(String(t.text).split(NOTE_SPACE).join(' '));
      const want = O.parenScope(sp.body.split(/\s+/).filter(Boolean));
      if (!want) return;
      if (want.some(Boolean)) { withSpans++; if (sp.notes.length) withSpansAndNote++; }
      const m = out.paras.get(i);
      if (!m) return;
      const got = [...m.keys()].sort((a, b) => a - b).flatMap((k) => m.get(k).parens);
      if (got.length === want.length && want.some((f, k) => got[k] !== null && got[k] !== f)) bad++;
    });
    return { total, withSpans, withSpansAndNote, bad };
  }
  it('בקרה (קורפוס parity, no_long_test_text.txt): דגלי הסוגריים נכונים בכל הפסקאות — והקורפוס עדיין מפעיל את המצב (סוגריים + הערה באותה פסקה)', () => {
    const c = parenCensus(fs.readFileSync(path.join(AUDITS, 'no_long_test_text.txt'), 'utf8'));
    assert(c.withSpansAndNote > 0, `הבקרה חסרת משמעות: אין פסקה עם סוגריים והערה (פסקאות עם סוגריים: ${c.withSpans})`);
    assert(c.bad === 0, `פסקאות עם דגלי סוגריים שגויים (PAREN_SCOPE): ${c.bad} מתוך ${c.withSpans} פסקאות עם סוגריים (${c.withSpansAndNote} מהן עם הערה)`);
  });
  bugIt('R-03', 'קורפוס ה-long (long_test_text.txt, 647 עמודים): דגלי הסוגריים נכונים בכל הפסקאות — כרגע 2 פסקאות שגויות מתוך 9 עם סוגריים והערה', () => {
    const c = parenCensus(fs.readFileSync(path.join(AUDITS, 'long_test_text.txt'), 'utf8'));
    assert(c.bad === 0, `פסקאות עם דגלי סוגריים שגויים (PAREN_SCOPE): ${c.bad} מתוך ${c.withSpansAndNote} פסקאות עם סוגריים והערה (${c.total} פסקאות בקורפוס)`);
  }, { expect: /PAREN_SCOPE/ });
  bugIt('R-03', 'מסמך הבדיקה הקבוע (generateTestDocument fixed/full): דגלי הסוגריים נכונים בכל הפסקאות — כרגע ≈145 פסקאות שגויות', () => {
    const c = parenCensus(generateTestDocument({ mode: 'fixed', scale: 'full' }));
    assert(c.bad === 0, `פסקאות עם דגלי סוגריים שגויים (PAREN_SCOPE): ${c.bad} מתוך ${c.withSpansAndNote} פסקאות עם סוגריים והערה (${c.total} פסקאות במסמך)`);
  }, { loose: true, expect: /PAREN_SCOPE/ });
});

report('source-families');
