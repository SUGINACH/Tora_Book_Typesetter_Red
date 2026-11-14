# fixtures/regress — מסמכי שחזור לבאגים ידועים (סוכן 4)

כל קובץ כאן הוא **מקור סטטי** (לא מופק ע"י מחולל), כדי שהבדיקה לא תשתנה כשהמחולל משתנה.
הבדיקות שמשתמשות בהם: `tests/regress/*.test.js` (הרצה: `cd red-build && npm run test:regress`).

## R-01 · rollback כותרות inline בסוף הטור הימני — אובדן "לשון"/"הפוסקים"

| קובץ | תפקיד | מצופה על הקוד הקיים (`legacy-imud-flow`) | מצופה אחרי התיקון |
|---|---|---|---|
| `heading-rollback-trigger.txt` | טריגר: פסקה ארוכה שממלאת את הטור הימני, אחריה `כותרת 5` ← `כותרת 6` רצופות ופסקת גוף | `contentPreserved=false`; h5 "לשון הפוסקים" **אבדה**, h6 "חילוקי דינים" נפלטת **פעמיים** | התוכן נשמר; כל כותרת פעם אחת |
| `heading-rollback-control.txt` | בקרה: זהה לטריגר פרט לפסקה שמפרידה בין שתי הכותרות (אין כותרת "אחרונה" להחזרה) | עובר | עובר, ו-hash העימוד **זהה** לפני/אחרי התיקון |

**מקור:** מסמך הבדיקה הקבוע (`generateTestDocument({mode:'fixed', scale:'full'})`) צומצם ע"י סוכן 2 (delta-debugging,
PR #35, `min_two_words.txt`, 9 שורות). סוכן 4 הוסיף פסקת גוף בסוף (30 המילים הראשונות של הפסקה הקיימת, ללא תוכן חדש) —
כי הקובץ המקורי מסתיים ברצף כותרות ללא טקסט, שנפסל ב-D-100 של PR #33; כך ה-fixture תקף גם לפני וגם אחרי מיזוג #33.
אומת: הוספת הפסקה אינה משנה את התנהגות הבאג (הוא מופעל באותו אופן והתיקון המוצע פותר אותו).

**שחזור ידני:**

```js
const { legacyTypeset } = require('./src/engine/layout/legacy-imud-flow');   // הגדרות: importImudSettings(ui/assets/imud/default_settings.json)
const r = legacyTypeset(fs.readFileSync('tests/fixtures/regress/heading-rollback-trigger.txt', 'utf8'), settings, {});
r.contentPreserved   // false על הקוד הקיים
```
