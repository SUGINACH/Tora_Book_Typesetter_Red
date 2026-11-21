# tools/baseline — כלי בסיס והשוואה (סוכן 4)

| כלי | מטרה |
|---|---|
| `run-baseline.js` | **Baseline G0:** זיהוי סביבה, טביעת אצבע (SHA-256) לקלטים, כל צעד של `npm test` **ושל `test:regress`** בנפרד (רשימת הצעדים מ-`tools/run-tests.js`, D-110 — כמו ה-CI, המונה המקומי שווה ל-CI), דטרמיניזם, ועם `--parity` — צינור layout-parity והקורפוס הארוך (`audits/long_test_text.txt`; `very_long_test_text.txt` הוא קלט פסול מאז #33); שומר `manifest.json` (סכמה `red-baseline-v2`; רצפת ה-parity ההיסטורית **אינה נאכפת** מאז #33 ומדווחת כעובדה בלבד) ולוגים (`audits/baseline/<sha>/`). `--skip-suite --parity --out <dir>` להרצה חלקית |
| `compare-with-ci.js` | השוואה מכונתית "מקומי ↔ CI" של תיקיית baseline (`manifest.json` + לוגי CI שהועתקו אליה) |
| `impact.js` | **השפעה של תיקון מנוע:** אותו מסמך בשני עצים (base מול מועמד) — עמודים, `layoutHash`, כמה עמודים השתנו, רפאים/כפילות/אבודות/סדר של הערות, כיסוי הערות לפי עמוד, שמירת תוכן |

## tools/run-tests.js — runner גילוי הבדיקות (D-110)

`npm test` ו-`npm run test:regress` מפעילים אותו (במקום שרשרת `node a && node b` ב-`red-build/package.json`). הוא מגלה כל `red-build/tests/**/*.test.js`,
מריץ כל קובץ כ-`node <נתיב>` מתוך `red-build/` (אותה סביבה, אותן שורות סיכום ל-CI), וכושל על בדיקה שקטה (בלי שורת סיכום), על "כשל שקט"
ועל בדיקה יתומה (קובץ שנראה כבדיקה אך אינו `*.test.js`). **הוספת בדיקה = יצירת קובץ `*.test.js`, בלי לערוך package.json או workflow.**
`--list`/`--list-json` (התכנית), `--only <תת-מחרוזת>` (פיתוח), `--bail` (עצירה בכשל ראשון), `--json <file>`, `--check` (שומר-כיסוי בלבד) — ראו `--help`.
`run-baseline.js` לוקח ממנו את רשימת הצעדים; בעץ ישן, לפני ה-runner, הוא חוזר לפירוק השרשרת הידנית.

## impact.js — אימות תיקון מנוע בפקודה אחת

```bash
git worktree add --detach /tmp/red-base origin/main          # base
git worktree add --detach /tmp/red-cand <commit-עם-התיקון>    # מועמד (באנדלים נבנו מחדש: node tools/build-worker-bundle.js)
node tools/baseline/impact.js --base /tmp/red-base --cand /tmp/red-cand --details
```

ברירת מחדל: `approx` (בלי גופנים) על כל הקורפוסים (`canonical`, `no_long`, `mid_long`, `long`, `long_no_paren`, `very_long`, מסמך הבדיקה הקבוע `generator`), ו-`real` / `real+stretch` (גופנים אמיתיים, כמו צינור ה-parity) על `no_long` ו-`generator`. כ-1–2 דקות.
`--modes`, `--docs` מצמצמים; `--expect-neutral no_long,canonical` נכשל (קוד 4) אם אחד המסמכים האלה השתנה בכלל — לתיקון שאמור להיות ניטרלי ל-parity; `--json out.json` שומר את כל המדידות.

**קוד יציאה:** `0` אין רגרסיה · `3` רגרסיה · `4` מסמך `--expect-neutral` השתנה · `2` שגיאת הרצה.

**מה נחשב רגרסיה (קוד 3):** הערות **אבודות**, **כפילות** באותו עמוד, **סדר** הערות, **כיסוי הערות לפי עמוד** (עמוד שיש בו שורות של פסקה נושאת-הערה בלי יחידה של אחת מהערותיה) — כל אלה לפי ספירה שעלתה; `contentPreserved` שהפך ל-false, מילים חסרות או `ledger.issues` שעלו; ו**רפאים** — אך רק כשה-base נקי מרפאים בכל המטריצה. כל עוד R-04 פתוח הזזת עימוד מזיזה מופעי רפאים בלי קשר לתיקון הנבדק, ולכן עלייה ברפאים מדווחת כ-`~` (תנודה) בלבד; `--details` מראה אילו רפאים נוספו/נעלמו.

**מה הכלי לא קובע:** אם שינוי עימוד רצוי. "עמ' שונו" הוא חתימת עמוד שלמה (כולל עמודים שזזו בעקבות שינוי קודם ומפת תוכן). `layoutHash` אינו כולל את אזור ההערות — שינוי בהערות בלבד לא ישנה אותו אבל ישנה את חתימת העמוד.

**למה זה קיים:** הסוויטה (700 בדיקות), ה-hash הקנוני וה-parity לא תפסו תיקון R-04 ראשון שהוציא גם הערות חוקיות של פסקה שנחתכה בין עמודים (very-long 836→838 עמ', כיסוי 1→46). הכלי תופס זאת (נבדק; ראו `tests/regress/impact-tool.test.js`, כולל בקרה שלילית מקצה לקצה על עץ מוטנט).

**הגדרות המצבים** משוכפלות מ-`tools/layout-parity/run-ours.js` (הנתיב החי) ב-`workerRun` — אם הצינור החי משתנה יש לעדכן גם שם. המסמכים והאורקל נלקחים תמיד מהעץ שבו הכלי יושב; רק המנוע נטען מכל עץ.

## חבילות baseline שמורות

| תיקייה | commit | הערה |
|---|---|---|
| `audits/baseline/6f80156/` | `6f80156` | **v1** — לפני #33; סכמה `red-baseline-v1`; נשמרה כמות שהיא |
| `audits/baseline/188a201/` | `188a201` (מיזוג #33) | **v2** — `BASELINE.md` + `manifest.json` + `ci/` (לוגי CI ו-`local-vs-ci.json`); המנוע ב-`main` זהה לו (ראו §8 שם) |
