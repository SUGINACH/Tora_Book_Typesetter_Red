# מדריך הגירה — הגדרות v1 → v2 (v25-unified)

> ההגירה אוטומטית בכל נתיב קלט (ייבוא פרויקט ZIP / טעינת תבנית / פתיחת קובץ הגדרות ישן).
> המנגנון: `red-build/src/engine/output/project-io.js` (טבלת MIGRATIONS + איחוד עם ברירות מחדל + דיווח אי־התאמות — ללא השלכות בשקט).

## מפת שינויים עיקריים (v1 → v2)

| מפתח ישן (V1–V4 / Yellow / Gold / Green / Orange) | מפתח v2 | הערות |
|---|---|---|
| `bodyFontSize` | `body-font-size-pt` | טווח 9–24 |
| `lineHeight` | `body-line-height` | |
| `pageNumFormat` / `pageNumFrame` / `pageNumPosition` / `initialPageNumber` | `page-num-format` / `page-num-frame` / `page-num-position` / `page-num-initial-value` | נוסחת start-idx (D-36) |
| `colWidthPct` / `marginSidePct` / `gutterPct` | `grid-col-width-pct` / `grid-margin-side-pct` / `grid-gutter-pct` | |
| `balanceChapterEnd` | `balance-chapter-end` | פשרות מתועדות בלבד (D-50) |
| `tocLevel1Show` | `toc-level-1-show` | + כל הרמות |
| `avoid-runt-word` (פנטום Yellow/Green) | `runt-min-width-pct` | המנגנון אמיתי ונמדד |

## כללי ההגירה

1. **שימור ערכים לא־ידועים** — מפתחות שאינם ברישום נשמרים ומדווחים (`unknownKeys`),
   לא נזרקים בשקט (audit deltas attributable).
2. **מצבי הערות** — `note-placement-mode` הוא מקור־האמת (D-39); דגלים ישנים נגזרים
   מחדש אחרי האיחוד כך שלעולם לא נוצר מצב סותר מאובדן הערות (BRZ-15).
3. **אי־התאמות** — enum מחוץ לטווח / מספר חורג נשמרים ומדווחים ב־`issues` (kept: true)
   — המשתמש רואה, לא מוסתר.
4. **תבניות UI** — פורמט `tora-typesetter-template` v1 נטען דרך אותה מיגרציה.

## בדיקת ההגירה

```
npm run test:export   # כולל roundtrip של חבילת ZIP עם מפתחות v1 → v2
```
