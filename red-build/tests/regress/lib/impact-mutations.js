// tests/regress/lib/impact-mutations.js — קטלוג מוטציות על *תוצאת מנוע* (לבדיקות בלבד) לבקרות השליליות של tools/baseline/impact.js (סוכן 4)
//
// כל מוטציה משחיתה תוצאה אחת בדרך אחת מוגדרת, ומצהירה (expect) אילו הודעות רגרסיה הכלי חייב להפיק עליה, ו-only=true כשאסור שיופיעו
// הודעות נוספות — כך כל מדד נקשר לבקרה שהורגת אותו, ואי אפשר למחוק מדד בלי שבדיקה תיכשל.
// שימושים: (א) impact-tool.test.js מחיל אותן ישירות על תוצאה חיה ובודק את srcNotesMetrics / contentMetrics;
//          (ב) מקצה לקצה: עותק מוטנט של src/ שבו legacyTypeset מחיל את המוטציה שב-IMPACT_MUT, ו-impact.js base→cand חייב לצאת בקוד 3
//              עם ההודעות האלה בדיוק. בלי בקרות אלה ירוק של הכלי לא מוכיח שהמדד חי: שני מדדי שמירת-התוכן בו (מילים חסרות, ledger)
//              קראו משדות שגויים והיו 0 תמיד, ואיש לא ידע.
// הנחת המקור: canonical_corpus.txt במצב approx. ה-base נקי בכל המדדים האלה (אפס), ולכן כל מוטציה מוסיפה בדיוק 1 (missing-count: 3).
// מוטציה שאינה מוצאת את המבנה שהיא משחיתה זורקת שגיאה — לעולם לא "לא עושה כלום" (אחרת הבקרה הייתה מתבלבלת עם כלי עיוור).
'use strict';

const clone = (x) => JSON.parse(JSON.stringify(x));

/** פסקאות הערות-הסיום בעמודי ה-endnotes, בסדר הפליטה: [{col, i}] */
function endItems(r) {
  const out = [];
  for (const p of r.pages) if (p.type === 'endnotes') for (const col of p.columns || []) col.forEach((it, i) => { if (it.kind === 'paragraph') out.push({ col, i }); });
  if (out.length < 2) throw new Error('impact-mutations: אין לפחות שתי הערות-סיום בפלט');
  return out;
}
const marginPage = (r) => {
  const i = r.pages.findIndex((q) => (q.marginNotes || []).length);
  if (i < 1) throw new Error('impact-mutations: אין עמוד (שאינו הראשון) עם הערת-צד בפלט');
  return i;
};
const markerOf = (it) => it.words[it.markerIdx[0]];

const MUTATIONS = {
  // ── הערות-סיום ──
  'drop-endnote': {
    what: 'הערת-סיום אחת נעלמת מעמוד ההערות',
    expect: ['הערות-סיום אבודות 0→1'], only: true,
    mutate(r) { const [e] = endItems(r); e.col.splice(e.i, 1); },
  },
  'dup-endnote': {
    what: 'הערת-סיום נפלטת פעמיים (בסמן ייחודי, כדי שלא תופעל גם בדיקת הסמנים)',
    expect: ['הערות-סיום כפולות/שגויות 0→1'], only: true,
    mutate(r) { const [e] = endItems(r); const c = clone(e.col[e.i]); c.words[c.markerIdx[0]] = 'צ.'; e.col.splice(e.i + 1, 0, c); },
  },
  'swap-endnote': {
    what: 'שתי הערות-סיום הראשונות מוחלפות (אותו תוכן, סדר שונה; הסמנים נשארים ייחודיים)',
    expect: ['הערות-סיום בסדר שונה 0→1'], only: true,
    mutate(r) { const [x, y] = endItems(r); const t = x.col[x.i]; x.col[x.i] = y.col[y.i]; y.col[y.i] = t; },
  },
  'dup-marker': {
    what: 'הערת-סיום שנייה מקבלת את הסמן של הראשונה (הטקסטים תקינים)',
    expect: ['הערות-סיום עם סמנים כפולים/חסרים 0→1'], only: true,
    mutate(r) { const [x, y] = endItems(r); const t = y.col[y.i]; t.words[t.markerIdx[0]] = markerOf(x.col[x.i]); },
  },
  // ── הערות-צד ──
  'drop-side': {
    what: 'הערת-צד אחת נעלמת משולי העמוד',
    expect: ['הערות-צד אבודות 0→1'], only: true,
    mutate(r) { const p = r.pages[marginPage(r)]; p.marginNotes.splice(0, 1); },
  },
  'dup-side': {
    what: 'הערת-צד נפלטת פעם שנייה באותו עמוד',
    expect: ['הערות-צד כפולות 0→1'], only: true,
    mutate(r) { const p = r.pages[marginPage(r)]; p.marginNotes.push(clone(p.marginNotes[0])); },
  },
  'move-side': {
    what: 'הערת-צד נפלטת בעמוד הקודם — לא בעמוד שבו מתחילה הפסקה הבעלים',
    expect: ['הערות-צד בעמוד שגוי 0→1'], only: true,
    mutate(r) { const i = marginPage(r); r.pages[i - 1].marginNotes = (r.pages[i - 1].marginNotes || []).concat(r.pages[i].marginNotes.splice(0, 1)); },
  },
  'alien-side': {
    what: 'טקסט הערת-צד מוחלף בטקסט שאינו במקור (⇒ גם אבודה וגם זרה)',
    expect: ['הערות-צד אבודות 0→1', 'הערות-צד עם טקסט זר 0→1'], only: true,
    mutate(r) { const p = r.pages[marginPage(r)]; p.marginNotes[0].lines[0].text = 'טקסט זר שאינו במקור'; },
  },
  // ── זרם הטוקנים (אותו מקור ⇒ אותו מספר טוקנים; שינוי = פענוח המקור השתנה) ──
  'extra-token': {
    what: 'טוקן עודף אחד: המספר החדש זהה למודל האחר (plain↔metaAnywhere), כך שמודל "מתיישר מחדש" — כלל "אבד יישור" בלבד היה מחמיץ זאת',
    expect: ['מספר הטוקנים השתנה 164→165 (פענוח המקור השתנה)'], only: true,
    mutate(r) { r.tokens.push(r.tokens[r.tokens.length - 1]); },
  },
  'extra-tokens': {
    what: 'שני טוקנים עודפים: אף מודל אינו מיושר עוד — הערות-צד לא ניתנות לבדיקה, וזה מדווח ואינו מוסתר',
    expect: ['מספר הטוקנים השתנה 164→166 (פענוח המקור השתנה — מודל המקור כבר אינו מיושר, הערות-צד לא ניתנות לבדיקה)'], only: true,
    mutate(r) { const t = r.tokens[r.tokens.length - 1]; r.tokens.push(t, t); },
  },
  // ── שמירת תוכן ──
  'ledger-loss': {
    what: 'ה-ledger מדווח content-loss (כפי שהמנוע עושה כשמילים נעלמות)',
    expect: ['ledger content-loss 0→1'], only: true,
    mutate(r) { r.ledger.create('content-loss', 'impact-mutant', 0, { missing: 1, sample: 'x' }, 'impact-mutant'); },
  },
  'ledger-info': {
    what: 'ledger מדווח issue שאינו אובדן תוכן (column-imbalance) — מידע בלבד: אסור לסמן כרגרסיה',
    expect: [], only: true,
    mutate(r) { r.ledger.create('column-imbalance', 'impact-mutant', 0, { x: 1 }, 'impact-mutant'); },
  },
  'missing-count': {
    what: 'contentStats.missingCount = 3 (המנוע ספר 3 מילים חסרות)',
    expect: ['מילים חסרות 0→3'], only: true,
    mutate(r) { r.contentStats.missingCount = 3; },
  },
};

/** מקור JS לשרשור לסוף legacy-imud-flow.js בעץ מוטנט: מחיל את המוטציה שב-process.env.IMPACT_MUT (בלי משתנה — העטיפה אינה משנה דבר). */
function wrapperSource(selfPath) {
  return `
;(function () { // עטיפת בדיקה בלבד (impact-mutations.js): IMPACT_MUT בוחר מוטציה; בלי המשתנה העטיפה ניטרלית
  const orig = module.exports.legacyTypeset;
  const MUT = require(${JSON.stringify(selfPath)}).MUTATIONS;
  module.exports.legacyTypeset = function () {
    const r = orig.apply(this, arguments);
    const m = process.env.IMPACT_MUT;
    if (m) { if (!MUT[m]) throw new Error('IMPACT_MUT לא מוכר: ' + m); MUT[m].mutate(r); }
    return r;
  };
})();
`;
}

module.exports = { MUTATIONS, wrapperSource };
