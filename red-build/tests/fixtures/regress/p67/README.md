# fixtures/regress/p67 — קובץ זהב ל-difflib של `tools/baseline/p67-classify.js` (סוכן 4)

**למה הקבצים האלה קיימים.** `p67-classify.js` משחזר את P7/P6 של `tools/layout-parity/compare.py`, שמבוססים על `difflib.SequenceMatcher`
של Python. הכלי כותב מחדש את האלגוריתם ב-Node (אפס תלויות), ולכן **חייב** להיות מוכח זהה ל-difflib על קלטים מגוונים — כולל שוויונות
(אלפבית קטן), ריצות חוזרות והזזות — לא רק על הנתונים של היום. `p67-classify-tool.test.js` בודק את `matchingBlocks`/`opcodes`/`ratio` מול הקובץ.

| קובץ | תפקיד |
|---|---|
| `difflib-golden.json` | **המקור הקובע.** 149 מקרים: `{label, a, b, blocks, opcodes, ratio}` — פלט `SequenceMatcher(None, a, b, autojunk=False)` של CPython 3.13.18 (כולל הסנטינל `(la, lb, 0)`) |
| `gen-difflib-golden.py` | המחולל (seed קבוע 67, דטרמיניסטי): 9 מקרי-קצה ידניים + 140 אקראיים (אלפבית 2–12 אותיות; זוגות בלתי-תלויים וזוגות "מקור + שינויים": הוספה/מחיקה/החלפה/הזזה) |

## חריג מכוון לכלל "מקור סטטי"

`fixtures/regress/README.md` קובע שקובצי ה-fixtures סטטיים ולא מופקים. כאן הקובץ **כן** הופק — כי אי אפשר לכתוב ביד 149 פלטי difflib נכונים —
אך הוא **נשמר במאגר** והבדיקה קוראת רק אותו; המחולל לא רץ בבדיקות. לכן שינוי ב-Python/difflib לא ישנה בשקט את הבדיקה: הקובץ הקבוע הוא האמת.

## הפקה מחדש (רק לבדיקת תקינות המחולל; הקובץ שבמאגר הוא הסמכות)

```bash
python3 -B red-build/tests/fixtures/regress/p67/gen-difflib-golden.py /tmp/golden.json
sha256sum /tmp/golden.json red-build/tests/fixtures/regress/p67/difflib-golden.json   # זהים תחת Python 3.13.18
```

הוסכם (אומת): ההפקה מחדש תחת Python 3.13.18 זהה בייט-לבייט. גרסת Python אחרת עלולה לתת סדר שוויונות שונה ב-difflib — אם הפער הזה מופיע,
**לא** מעדכנים את הקובץ כדי שיעבור: בודקים אם `compare.py` עצמו השתנה וכך גם `p67-classify.js` (ראו `--parity-report`).
