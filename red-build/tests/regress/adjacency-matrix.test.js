// tests/regress/adjacency-matrix.test.js — מטריצת סמיכות מקור→פלט (סוכן 4)
//
// R-05 (שורות 'הערת סיום -' רצופות; אובדן תוכן שקט, עדיפות 1) נמצא ב*סמיכות* של שני מבנים, ולא נתפס שנים כי איש לא ניסה את הצירוף.
// כאן מנסים את כולם: כל זוג אטומי-מקור סמוכים (17×17: פסקאות, הערות שוליים, סוגריים, כותרות 1–6, הערת-צד, הערת-סיום, שורת '[' מודבקת,
// שורה ריקה) בהיסטים אנכיים ובסוף-מסמך/עם-המשך, ועוד שלשות סביב הערת-סיום והערת-צד (A→X→A, A→A→X, X→A→A: מה שמפריד בין שתי הערות או בא לפניהן/אחריהן אינו מציל אחת מהן).
// כל מסמך עובר את שער D-100 של המוצר (קלט לא-תקין אינו נבדק; נספר ומדווח), רץ במנוע, ונבדק מול האורקל הבלתי-תלוי (גוף, הערות-סיום,
// הערות-צד, גיאומטריה; ומודל ההערות חייב להתיישר לטוקני המנוע). ראו lib/adjacency.js לתכנון ולמחלקות ההסבר.
//
// מבנה:
//   א. בקרות שליליות — המטריצה והמסווגים חיים: תוצאה מושחתת / מנוע פגום מוחזרים כהפרה, ומחלקת הסבר אינה מסתירה קודים אחרים.
//   ב. המטריצה על המנוע החי (approx): אפס הפרות בלתי-מוסברות; מחלקות ההסבר (R-05, O-8) הן הכול-או-כלום — תיקון חלקי נכשל.
//   ג. מצבי גופנים אמיתיים (smoke): אותה בדיקה על typeset() עם גופנים (הכלי tools/baseline/adjacency-scan.js מריץ את הסריקה המלאה בכל המצבים).
//
// חלוקת האחריות עם source-families.test.js: מחזור-החיים של R-05 (strict-xfail, FIXED) נשאר שם. כאן נבדק *היקף* הבאג: שמחלקת R-05 כולה
// (כולל הערות-סיום שמופרדות בכותרת/הערת-צד/שורה ריקה/שורת '[') מתנהגת באופן אחיד — כולן אבודות כשהבאג פתוח, אפס כשתוקן.
// ממצאי הסריקה המלאה (כל הזוגות 20,016 מסמכים בכל אחד משלושת המצבים; כל השלשות 38,334 מסמכים ב-approx) מתועדים ב-tests/fixtures/regress/README.md.
'use strict';

const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');
const A = require('./lib/adjacency');
const O = require('./lib/source-oracle');
const { V } = O;

const ROOT = path.resolve(__dirname, '..', '..'); // red-build
const engine = A.makeEngine(ROOT, 'approx');
const fmt = (list, n = 4) => list.slice(0, n).map((u) => `${u.seq} [${u.cls.join('+') || '—'}] ${u.bad.join(',')} (K=${u.sample.K}${u.sample.tail ? '' : ' בסוף'}: ${u.sample.detail})`).join(' · ') + (list.length > n ? ` … (+${list.length - n})` : '');

// ═════════════════════════ א. בקרות שליליות ═════════════════════════
describe('מטריצת סמיכות · בקרות שליליות (המטריצה חייבת לתפוס פגמים מוזרקים ולא לסמן שווא)', () => {
  const seq = ['P', 'E', 'S', 'P', 'E', 'P']; // הערות-סיום והערות-צד עם פסקאות ביניהן (בלי R-05): הבסיס הנקי
  const doc = A.buildDoc(seq, 10, true);
  const fresh = () => engine.run(doc);
  const bodyItem = (r) => { for (const p of r.pages) if (p.type === 'sign-open') for (const col of p.columns) for (const it of col) if (it.kind === 'paragraph' && it.words && it.words.length > 4) return it; throw new Error('אין שורת גוף'); };

  it('בסיס: המסמך הנקי — אפס הפרות, המודל מיושר, ויש בו הערות-סיום והערות-צד (אחרת הבקרות ריקות)', () => {
    const r = fresh();
    const { violations, aligned, model } = A.checkDoc(doc, r, engine.settings);
    assertEq(violations.length, 0, 'אפס הפרות בבסיס: ' + violations.map((x) => x.code).join(','));
    assert(aligned, 'המודל מיושר לטוקני המנוע');
    assert(model.ends.length === 2 && model.sides.length === 1, `הבסיס חייב להכיל 2 הערות-סיום ו-1 צד (יש ${model.ends.length}/${model.sides.length})`);
  });

  const mutations = {
    'הערת-סיום נעלמת מעמוד ההערות': { expect: [V.ENDNOTE_LOST], mutate: (r) => { const p = r.pages.find((q) => q.type === 'endnotes'); const col = p.columns.find((c) => c.some((it) => it.kind === 'paragraph')); col.splice(col.findIndex((it) => it.kind === 'paragraph'), 1); } },
    'מילת גוף נעלמת משורה': { expect: null, mutate: (r) => { bodyItem(r).words.splice(2, 1); } }, // קוד מדויק לא נקבע כאן (תלוי איזה מדד של האורקל נתפס ראשון) — חייבת להיות הפרה כלשהי
    'הערת-צד נפלטת פעמיים': { expect: [V.SIDENOTE_DUP], mutate: (r) => { const p = r.pages.find((q) => (q.marginNotes || []).length); p.marginNotes.push(JSON.parse(JSON.stringify(p.marginNotes[0]))); } },
    'שורה בגובה חריג — גיאומטריה (חפיפה/חריגה מהעמוד)': { expect: [V.GEO_OUTSIDE], mutate: (r) => { bodyItem(r).heightPx = 5000; } },
    'ה-ledger מדווח אובדן תוכן': { expect: [V.LEDGER_LOSS], mutate: (r) => { r.ledger.create('content-loss', 'adjacency-mutant', 0, { missing: 1, sample: 'x' }, 'adjacency-mutant'); } },
    'טוקן עודף (המודל אינו מיושר)': { expect: ['ALIGNMENT'], mutate: (r) => { r.tokens.push(r.tokens[r.tokens.length - 1]); } },
  };
  for (const [name, m] of Object.entries(mutations)) {
    it(`checkDoc תופס: ${name}`, () => {
      const r = fresh(); m.mutate(r);
      const codes = A.checkDoc(doc, r, engine.settings).violations.map((x) => x.code);
      assert(codes.length > 0, 'המוטציה לא הפיקה אף הפרה — המטריצה עיוורת לפגם הזה');
      if (m.expect) for (const c of m.expect) assert(codes.includes(c), `חסר ${c} (נתפס: ${[...new Set(codes)].join(',')})`);
    });
  }

  // המסווגים: תכונה מבנית של המקור בלבד
  it('classify: R-05 = שתי הערות-סיום ממתינות לאותה פסקה (גם כשביניהן שורה ריקה/כותרת/הערת-צד/שורת "[" שנדבקה), ולא כשפסקה מפרידה', () => {
    const c = (...s) => A.classify(A.buildDoc(s, 10, true)).join('+') || '—';
    assertEq(c('E', 'E'), 'R-05', 'E,E');
    assertEq(c('E', 'B', 'E'), 'R-05', 'E,ריקה,E');
    assertEq(c('E', 'H3', 'E'), 'R-05', 'E,כותרת,E');
    assertEq(c('E', 'S', 'E'), 'R-05', 'E,צד,E');
    assertEq(c('E', 'P', 'E'), '—', 'E,פסקה,E — פסקה צורכת את ההערה הממתינה');
    assertEq(c('E', 'N', 'E'), '—', 'E,פסקה עם הערה,E');
    assertEq(c('P', 'E'), '—', 'הערה בודדת');
    assertEq(c('E', 'S'), '—', 'סיום וצד אינם ממתינים לאותו מקום (שני סוגים)');
    assertEq(c('E', 'E', 'E'), 'R-05', 'שלוש');
  });
  it("classify: O-8 = שורת '[' מיד אחרי שורת הערת-סיום (גם מעבר לשורות ריקות); לא אחרי פסקה/כותרת/הערת-צד", () => {
    const c = (...s) => A.classify(A.buildDoc(s, 10, true)).join('+') || '—';
    assertEq(c('E', 'G'), 'O-8', 'E,G');
    assertEq(c('E', 'B', 'G'), 'O-8', 'E,ריקה,G');
    assertEq(c('P', 'G'), '—', 'G אחרי פסקה');
    assertEq(c('S', 'G'), '—', 'G אחרי הערת-צד');
    assertEq(c('H3', 'G'), '—', 'G אחרי כותרת');
    assertEq(c('E', 'E', 'G'), 'R-05+O-8', 'שתי המחלקות יחד');
    // הערת-עורך ##..## אינה שורה: לא מפרידה ולא יוצרת סמיכות
    assertEq(A.classify('כותרת 2 - א\nת1 ת2\nהערת סיום - ת3 ת4\n##הערה##\n[ת5] ת6\n').join('+') || '—', 'O-8', 'הערת עורך בין ההערה לשורת "["');
  });

  // מחלקת הסבר אינה מסתירה קודים אחרים; מנוע פגום נתפס בסריקה עצמה (לא רק ב-checkDoc)
  const small = { atoms: ['P', 'N', 'E', 'S'], arity: 2, offsets: [10], tails: [true, false] };
  const faulty = (mutateIf) => ({ ...engine, run: (d) => { const r = engine.run(d); mutateIf(d, r); return r; } });
  it('בקרת סריקה: על מנוע תקין — אפס הפרות לא-מוסברות; ההפרה היחידה האפשרית היא R-05 (E→E; תוקן ב-#63, לכן כיום אפס)', () => {
    const s = A.scan(engine, small);
    assertEq(s.unexplained.length, 0, 'לא-מוסברות: ' + fmt(s.unexplained));
    assert(s.offenders.every((o) => o.seq === 'E→E'), 'הפרות מחוץ ל-E→E: ' + s.offenders.map((o) => o.seq).join(','));
    assert(s.docs >= 20, `הסריקה הקטנה ריקה? ${s.docs} מסמכים (צפוי ≈26)`);
  });
  it('בקרת סריקה: מנוע שמאבד הערת-סיום בכל מסמך שיש בו כזו — הסריקה מדווחת הפרות לא-מוסברות בדיוק במסמכים עם E שאינם R-05', () => {
    const s = A.scan(faulty((d, r) => { const p = r.pages.find((q) => q.type === 'endnotes'); if (!p) return; const col = p.columns.find((c) => c.some((it) => it.kind === 'paragraph')); if (col) col.splice(col.findIndex((it) => it.kind === 'paragraph'), 1); }), small);
    assert(s.unexplained.length > 0, 'מנוע פגום לא נתפס — הסריקה עיוורת');
    assert(s.unexplained.some((u) => u.seq === 'P→E'), 'P→E (הערה בודדת שאבדה) חייב להיתפס: ' + fmt(s.unexplained));
    assert(s.unexplained.every((u) => u.seq.split('→').includes('E')), 'נתפסו גם מסמכים בלי הערת-סיום: ' + fmt(s.unexplained));
  });
  it('בקרת סריקה: מחלקת R-05 מתירה ENDNOTE_LOST בלבד — אובדן מילת גוף במסמך R-05 נתפס כלא-מוסבר', () => {
    const s = A.scan(faulty((d, r) => { if (A.classify(d).includes('R-05')) bodyWord(r); }), { atoms: ['E'], arity: 2, offsets: [10], tails: [true] });
    const u = s.unexplained.find((x) => x.seq === 'E→E');
    assert(u, 'אובדן מילת גוף במסמך R-05 לא נתפס — מחלקת ההסבר מסתירה קודים אחרים');
    assert(u.bad.length > 0 && !u.bad.includes(V.ENDNOTE_LOST), 'הקוד הבלתי-מוסבר צריך להיות של הגוף, לא ENDNOTE_LOST: ' + u.bad.join(','));
  });
  function bodyWord(r) { for (const p of r.pages) if (p.type === 'sign-open') for (const col of p.columns) for (const it of col) if (it.kind === 'paragraph' && it.words && it.words.length > 4) { it.words.splice(2, 1); return; } throw new Error('אין שורת גוף'); }

  it('בקרת סריקה: תיקון חלקי (רק E→E מטופל, E→כותרת→E עדיין מאבד) מסומן כמחלקה במצב חלקי — לא כאפס ולא כהכול', () => {
    const dropFirstEnd = (r) => { const p = r.pages.find((q) => q.type === 'endnotes'); const col = p.columns.find((c) => c.some((it) => it.kind === 'paragraph')); col.splice(col.findIndex((it) => it.kind === 'paragraph'), 1); };
    const partialEngine = faulty((d, r) => { if (/כותרת 3 -/.test(d) && A.classify(d).includes('R-05')) dropFirstEnd(r); });
    const s = A.scan(partialEngine, { arity: 0, extra: [['E', 'E'], ['E', 'H3', 'E']], offsets: [10], tails: [true] });
    assertEq(s.classes['R-05'].docs, 2, 'שני מסמכי R-05 טהורים');
    assertEq(s.classes['R-05'].violating, 1, 'רק זה עם הכותרת מאבד');
    assertEq(s.partial.join(','), 'R-05', 'חייב להיות מסומן חלקי');
    const clean = A.scan(engine, { arity: 0, extra: [['E', 'E'], ['E', 'H3', 'E']], offsets: [10], tails: [true] });
    assertEq(clean.partial.length, 0, 'מנוע תקין: אף מחלקה אינה חלקית');
  });
  it('ההיסט האנכי (K) חי: מילוי של 910 מילים מוסיף עמודי גוף לעומת 10 — המטריצה אכן בוחנת מיקומים שונים בעמוד', () => {
    const bodyPages = (K) => engine.run(A.buildDoc(['P', 'E'], K, true)).pages.filter((p) => p.type === 'sign-open' || p.type === 'regular').length;
    assert(bodyPages(910) > bodyPages(10) && bodyPages(310) > bodyPages(10), `עמודי גוף: K=10→${bodyPages(10)}, K=310→${bodyPages(310)}, K=910→${bodyPages(910)}`);
  });

  it('שער D-100 חי: שרשרת כותרות לא עולה / שרשרת בלי פסקה נדחות ונספרות; מסמך תקין עובר', () => {
    assert(engine.gate(A.buildDoc(['H2', 'H2'], 10, true)).includes('heading-chain-not-increasing'), 'כותרת 2 אחרי כותרת 2 חייבת להידחות');
    assert(engine.gate(A.buildDoc(['P', 'H3'], 10, false)).includes('heading-chain-no-body-text'), 'מסמך שנגמר בכותרת בלי פסקה חייב להידחות');
    assertEq(engine.gate(A.buildDoc(['P', 'H3'], 10, true)).length, 0, 'כותרת ואחריה פסקה — תקין');
    const s = A.scan(engine, { atoms: ['H2', 'P'], arity: 2, offsets: [10], tails: [true, false] });
    assert(s.skipped.count >= 2 && s.skipped.byCode['heading-chain-not-increasing'] >= 1, 'הסריקה לא ספרה מסמכים שנדחו: ' + JSON.stringify(s.skipped));
  });

  it('מנגנון הסריקה: מונה בדיוק סדרות × היסטים × זנבות (+ extra); tail מוסיף שתי פסקאות המשך (70 מילים)', () => {
    const n = (cfg) => A.scan(engine, cfg).docs;
    assertEq(n({ atoms: ['P', 'p'], arity: 2, offsets: [10, 310], tails: [true, false] }), 16, '2²סדרות × 2 היסטים × 2 זנבות');
    assertEq(n({ atoms: ['P'], arity: 1, offsets: [10], tails: [true] }), 1, 'מסמך אחד');
    assertEq(n({ arity: 0, extra: [['P'], ['P', 'p']], offsets: [10, 310], tails: [false] }), 4, 'extra בלבד (arity:0): 2 סדרות × 2 היסטים');
    assertEq(A.tuples(['P', 'E'], 3).length, 8, 'tuples: 2³');
    assertEq(new Set(A.tuples(['P', 'E'], 3).map((t) => t.join('→'))).size, 8, 'tuples: ללא כפילויות');
    const words = (tail) => A.buildDoc(['P'], 10, tail).split(/\s+/).filter(Boolean).length;
    assertEq(words(true) - words(false), 70, 'tail = פסקאות של 40 ו-30 מילים');
    let threw = false; try { A.makeEngine(ROOT, 'fast'); } catch (e) { threw = /מצב לא מוכר/.test(e.message); }
    assert(threw, 'מצב מנוע לא מוכר חייב להיזרק (ולא ליפול בשקט למצב אחר)');
    threw = false; try { A.buildDoc(['ZZ'], 10, true); } catch (e) { threw = /אטום לא מוכר/.test(e.message); }
    assert(threw, 'אטום לא מוכר חייב להיזרק');
  });
});

// ═════════════════════════ ב. המטריצה על המנוע החי ═════════════════════════
describe('מטריצת סמיכות · כל זוגות המבנים + שלשות סביב הערות (approx; D-100-תקינים) מול האורקל', () => {
  // שלשות סביב הערה ממתינה: A→X→A (מה שמפריד), A→A→X ו-X→A→A (מה שבא אחרי/לפני זוג הערות) — תיקון שמטפל רק ברצופות, או רק לפני פסקה, נתפס כאן
  const triples = [...new Map(['E', 'S'].flatMap((a) => A.ALL_ATOMS.flatMap((x) => [[a, x, a], [a, a, x], [x, a, a]])).map((t) => [t.join('→'), t])).values()];
  const t0 = Date.now();
  const full = A.scan(engine, { arity: 2, extra: triples, offsets: [10, 310, 610], tails: [true, false] });
  const ms = Date.now() - t0;
  console.log(`   מטריצת סמיכות: ${full.docs} מסמכים תקינים (נדחו ב-D-100: ${full.skipped.count}) ב-${(ms / 1000).toFixed(1)}ש' · R-05: ${full.classes['R-05'].violating}/${full.classes['R-05'].docs} · O-8: ${full.classes['O-8'].violating}/${full.classes['O-8'].docs} · משותפים: ${full.mixed}`);

  it('שמירות נגד ריקנות: מספר מסמכים סביר; השער דחה מסמכים משני הסוגים; שתי מחלקות ההסבר חיות (אחרת הן "מוסברות" על כלום)', () => {
    assert(full.docs >= 700, `המטריצה התכווצה: ${full.docs} מסמכים (צפוי ≥700)`);
    assert(full.skipped.byCode['heading-chain-not-increasing'] > 0 && full.skipped.byCode['heading-chain-no-body-text'] > 0, 'השער לא דחה את שני סוגי השרשרות: ' + JSON.stringify(full.skipped));
    assert(full.classes['R-05'].docs >= 20, `מחלקת R-05 ריקה? ${full.classes['R-05'].docs} מסמכים טהורים (צפוי ≥20: E→E, E→ריקה/כותרת/צד→E)`);
    assert(full.classes['O-8'].docs >= 4 && full.mixed >= 1, `מחלקת O-8 ריקה? ${full.classes['O-8'].docs} טהורים, ${full.mixed} משותפים`);
  });
  it('אפס הפרות בלתי-מוסברות: כל מסמך תקין נקי מהפרות אורקל (גוף/הערות/גיאומטריה) והמודל מיושר לטוקני המנוע (ALIGNMENT)', () => {
    assertEq(full.unexplained.length, 0, `${full.unexplained.length} סדרות עם הפרה שאינה מוסברת: ` + fmt(full.unexplained));
  });
  it('R-05: כל המחלקה (מסמכים טהורים) מתנהגת באופן אחיד — כולן אבודות (באג פתוח) או אפס (תוקן). מצב חלקי = תיקון שאינו שלם (ENDNOTE_LOST בלבד)', () => {
    const c = full.classes['R-05'];
    assert(c.violating === 0 || c.violating === c.docs, `תיקון חלקי: ${c.violating} מתוך ${c.docs} מסמכי R-05 עדיין מאבדים הערת-סיום — חלק מהצירופים (שורה ריקה/כותרת/הערת-צד/שורת "[" בין ההערות) אינם מטופלים: ` + fmt(full.offenders.filter((o) => o.cls.length === 1 && o.cls[0] === 'R-05' && o.codes.includes(V.ENDNOTE_LOST)), 3));
  });
  it('O-8 (ממתין לסיווג בעלים): אותה אחידות — כל המסמכים הטהורים עם "[" אחרי הערת-סיום מציגים את התראת-השווא, או אף אחד (תוקן/סווג מחדש: להסיר את המחלקה מ-lib/adjacency.js ואת O-8 מה-README)', () => {
    const c = full.classes['O-8'];
    assert(c.violating === 0 || c.violating === c.docs, `O-8 השתנה באופן חלקי: ${c.violating}/${c.docs}: ` + fmt(full.offenders.filter((o) => o.cls.length === 1 && o.cls[0] === 'O-8'), 3));
  });
});

// ═════════════════════════ ג. גופנים אמיתיים (smoke + חיות המצבים) ═════════════════════════
describe('מטריצת סמיכות · מצבי גופנים אמיתיים (smoke + חיות: אותו מסמך, אותו אורקל; הסריקה המלאה בכלי adjacency-scan)', () => {
  // real נוצר לפני מנוע ה-stretch וגם אחריו; מופעי המודולים של כל מנוע פרטיים (lib: privateModules) — שניהם חייבים להתנהג זהה
  const real = A.makeEngine(ROOT, 'real');
  const stretch = A.makeEngine(ROOT, 'real+stretch');
  const realAfter = A.makeEngine(ROOT, 'real');
  const sig = (r) => JSON.stringify([r.layoutHash, r.pages.map((p) => (p.columns || []).map((c) => c.filter((it) => it.kind === 'paragraph').map((it) => (it.words || []).length)))]);

  for (const [mode, e] of [['real', real], ['real+stretch', stretch]]) {
    it(`${mode}: מסמך עם הערות-סיום והערות-צד — אפס הפרות, מיושר; שער D-100 דוחה כותרת-אחרי-כותרת`, () => {
      const doc = A.buildDoc(['P', 'E', 'S', 'P', 'E', 'N', 'Q'], 10, true);
      const { violations, aligned } = A.checkDoc(doc, e.run(doc), e.settings);
      assert(aligned, 'המודל לא מיושר');
      assertEq(violations.length, 0, violations.map((x) => `${x.code}: ${x.detail}`).join(' · '));
      assert(e.gate(A.buildDoc(['H2', 'H2'], 10, true)).length > 0, 'השער לא דחה כותרת 2 אחרי כותרת 2');
      assertEq(process.env.RED_ENABLE_STRETCH_RECLAIM, undefined, 'משתנה הסביבה דלף מחוץ להרצה');
    });
  }

  // מתגי ה-stretch הם קבועי-מודול הנקראים בטעינה: מצב שרק "קובע משתנה סביבה" שווה ל-real בשקט, ו-smoke לבדו לא היה מגלה זאת (שניהם נקיים).
  it('real+stretch חי: פלט שונה מ-real על לפחות מסמך אחד בסריקת היסטים (ובאותם מסמכים real שנוצר אחרי ה-stretch זהה ל-real שנוצר לפניו)', () => {
    const docs = [];
    for (let K = 10; K <= 400; K += 15) for (const tail of [true, false]) docs.push(A.buildDoc(['L'], K, tail));
    const differing = docs.filter((d) => sig(real.run(d)) !== sig(stretch.run(d)));
    assert(differing.length > 0, `פלט real+stretch זהה ל-real בכל ${docs.length} המסמכים — המתג כבוי בשקט (הבידוד של מופעי המודולים נשבר), או שהמנוע חדל להגיב ל-stretch על המסמכים האלה (אז לבחור משפחה אחרת)`);
    for (const d of differing) assertEq(sig(realAfter.run(d)), sig(real.run(d)), 'מנוע real שנוצר אחרי מנוע ה-stretch שונה מזה שנוצר לפניו — זליגה בין מנועים');
  });
  it('בידוד מודולים: יצירה והרצה של מנוע (גם stretch) אינן משנות את מטמון ה-require של התהליך — אותו מופע משותף של המודול לפני ואחרי', () => {
    const modPath = path.join(ROOT, 'src', 'engine', 'layout', 'legacy-imud-flow');
    const before = require(modPath);
    const e = A.makeEngine(ROOT, 'real+stretch');
    e.run(A.buildDoc(['L'], 160, true));
    assert(require(modPath) === before, 'מופע המודול המשותף הוחלף — מנוע משאיר אחריו מטמון אחר');
    assertEq(process.env.RED_ENABLE_STRETCH_RECLAIM, undefined, 'משתנה הסביבה דלף');
  });
  it('real אדיש לסביבת התהליך: גם כש-RED_ENABLE_STRETCH_RECLAIM=1 מוגדר בתהליך, מצב real נשאר ללא stretch (המצב נקבע לפי המצב המפורש בלבד)', () => {
    const docs = [];
    for (let K = 10; K <= 400; K += 15) docs.push(A.buildDoc(['L'], K, true));
    const differing = docs.filter((d) => sig(real.run(d)) !== sig(stretch.run(d)));
    assert(differing.length > 0, 'אין מסמך שמבדיל בין real ל-real+stretch (ראו הבדיקה הקודמת)');
    const keep = { a: process.env.RED_ENABLE_STRETCH_RECLAIM, b: process.env.RED_RECLAIM_COMPRESS_MAX };
    process.env.RED_ENABLE_STRETCH_RECLAIM = '1'; process.env.RED_RECLAIM_COMPRESS_MAX = '20';
    try {
      const polluted = A.makeEngine(ROOT, 'real');
      for (const d of differing) assertEq(sig(polluted.run(d)), sig(real.run(d)), 'סביבת התהליך שינתה את מצב real');
      assertEq(process.env.RED_ENABLE_STRETCH_RECLAIM, '1', 'הסביבה של התהליך חייבת לחזור כפי שהייתה (לא נמחקה)');
    } finally {
      if (keep.a === undefined) delete process.env.RED_ENABLE_STRETCH_RECLAIM; else process.env.RED_ENABLE_STRETCH_RECLAIM = keep.a;
      if (keep.b === undefined) delete process.env.RED_RECLAIM_COMPRESS_MAX; else process.env.RED_RECLAIM_COMPRESS_MAX = keep.b;
    }
  });
});

report('adjacency-matrix');
