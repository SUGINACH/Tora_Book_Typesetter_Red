# Tora Book Typesetter — RED
**מנוע עימוד תורני (RTL, עברית) — בנייה מאפס, אפס תלויות ריצה.**

> מצב אמת, עדכני ל־02.11.2026 (סגירת S7). מסמכי האם: `spec/01_MASTER_SPECIFICATION.md`, `spec/02_MASTER_WORK_PLAN.md`.

## מה עובד כרגע (ומה לא) — ללא הצהרות פנויות
| יכולת | מצב | הוכחה |
|---|---|---|
| פענוח (DFA + מטא־דאטה בפתיח בלבד, סוגריים [], הערות־סיום ממוספרות/כותרת־מחלקה) | עובד | `tests/unit/parser.test.js` (17) |
| שבירת שורות Knuth-Plass ללא מקף + מגינים (NBSP/E000) + קדם־פאס סוגריים לפני מדידה | עובד | typography (14), canonical |
| תכנון עמודים (DP) + איזון טורים **בשמירת סדר קריאה** + לולאת נסיגה + מטריצת הגנות | עובד | e2e (14), s5-s6 (17), s7-gate |
| הערות שוליים (מרזב): סמנים 4 סגנונות × 4 מדיניות איפוס, מפריד 6 סגנונות, block/continuous, מדיניות הערה ארוכה (פיצול אמיתי) | עובד | s7-gate (15), s5-s6 (17) |
| הערות סיום: עמודי "הערות/(המשך)" per-part, כותרת מהוראת מחלקה, מספור אופציונלי | עובד | s7-gate, canonical |
| הערות צד (H7): עיגון לפסקה המארחת, cascade, מיכל 20px, אין גניזה (BRZ-15) | עובד | s7-gate |
| שימור תוכן (BRZ-15) בכל מצבי ההערות — חשבונאות identity-by-construction | עובד | e2e 14/14, canonical 6/6 |
| דטרמיניזם (layoutHash בין ריצות; שעון לוגי ביומנים) | עובד | e2e, canonical |
| חוזה הגדרות שלוש־שכבות + סורקים **אמיתיים** (phantom/dead/orphan) | עובד | registry 8/8 |
| רנדור DOM + ייצוא HTML עצמאי + offline-guard (exit 7) | עובד | e2e, NC-16 |
| דוח אבחון v2 (עברית, מחזור חיים, דטרמיניזם **נמדד**) | עובד | e2e, canonical |
| **עדיין לא קיים:** ממשק משתמש (S10), ייבוא DOCX (S11), ייצוא PDF/ZIP (S12), עיטורים/שערים (S8), אורקל מדידה (S12) | לא נבנה | לא נטען |

## הרצה
```bash
cd red-build
npm test            # כל 8 הסוויטות (107 בדיקות)
npm run test:unit   # parser + typography
npm run test:settings   # חוזה הרישום + סורקים
npm run test:layout     # s5-s6
npm run test:e2e        # pipeline + s7-gate
npm run test:audit      # negative-controls (16)
npm run test:canonical  # קורפוס קנוני (תנאי מיזוג)
node tests/fixtures/generate_canonical_corpus.js   # יצירת הקורפוס מחדש
```

## מבנה
```
red-build/src/engine/{parser,typography,layout,notes,decoration,output,audit,core}
red-build/tests/{unit,integration,layout,e2e,audit,negative-controls,fixtures}
spec/          — מפרט אם + תכנית עבודה (S0..S13)
audits/        — 01 ביקורת עצמאית, 02 דוח סגירת S7
DECISIONS.md / WORKLOG.md / ISSUE_REGISTRY.md / OPEN_QUESTIONS.md / PROVENANCE.md / LAYOUT_DEPENDENCY_MAP.md
archive/debug/ — קבצי דיבוג היסטוריים (read-only)
```

## משמעת פיתוח (מתוך תכנית העבודה — מחייב)
1. commit-per-feature; אין לערבב ניקיון קבצים עם תיקוני engine.
2. כל החלטה → `DECISIONS.md`; כל תקלה → `ISSUE_REGISTRY.md` (חומרה+ראיות+בדיקת רגרסיה).
3. לא לטעון ללא ראיה; לא להשבית אבחון; לא להגדיל timeout עיוור.
4. כל תיקון חייב לעבור גם בקורפוס הקנוני (`npm run test:canonical`).
5. פגם משלב קודם ⇒ Branch-back-fix מאותו שלב + עדכון Registry — לא תיקון נקודתי.
