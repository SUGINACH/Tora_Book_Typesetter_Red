# מדריך הפעלה ותפעול (OPERATIONS)

## הרצה מקומית (אופליין מלא)

```bash
cd red-build
npm install --no-save   # לא נדרשות תלויות זמן־ריצה — רק להרצת בדיקות
node ui/index.html      # פתיחת היישום (file:// — אין שרת, אין רשת)
```

היישום נפתח ישירות ממערכת הקבצים; כל הנכסים מקומיים (חבילות מופרדות: המנוע ב־Worker).

## בדיקות

```bash
npm test                # השרשרת המלאה — 305 בדיקות ב־15 קבצים
npm run test:unit       # parser + typography
npm run test:settings   # חוזה הרישום + סורקים (dead-control=0)
npm run test:e2e        # צינור + S7 + S8 + S9
npm run test:ui         # שער S10 (37)
npm run test:extensions # שער S11 (50)
npm run test:export     # שער S12 (24)
npm run test:acceptance # שער S13 (מטריצה/דטרמיניזם/ביצועים + אבטחה/נגישות)
npm run test:determinism# hash ברירת מחדל נעול (75b8c605…)
npm run test:scan       # סריקת F-06 (עימוד אוטומטי מבקרות) — artifact בtests/artifacts
```

## דוחות וארטיפקטים

כל הארטיפקטים נשמרים ב־`red-build/tests/artifacts/`:
`s10-callgraph.json` (סריקת F-06) · `s12-parity.json` (parity מודל↔רסטר) ·
`s12-linebreak-equality.json` (שקילות שבירות A↔B) · `s12-font-subset.json` (מצמום) ·
`s12-pdf-outline.json` (סימניות) · `s12-canonical.pdf` (ה־PDF הקנוני) ·
`s13-matrix-report.json` (מטריצת 6×3) · `s13-trigger-accounting.json` · `s13-perf.json`.

## CI

`.github/workflows/ci.yml` מריץ את השרשרת בכל push. מדיניות: להפעיל, למסור קישורים,
לא להמתין — המשתמש יודיע על סיום; אז סוקרים logs+artifacts (כלל 0.1.5).

## ייצוא

מה־UI (לשונית תצוגה): HTML עצמאי / PDF / חבילת ZIP. PDF מלא דורש סביבת Node
(הודעה מפורשת בדפדפן); בדפדפן — HTML עצמאי והדפסה ממנו (@page מרישום גדלי העמוד).

## ניטור ותחקיר

- שגיאות מקומיות: יומן האירועים (EventLog, trace-v2) בכל תוצאה; droppedEvents חייב 0.
- שחזור תקלה: חבילת הפרויקט (ZIP) כוללת מסמך+הגדרות+הרחבות — מעגל סגור מוכח.
