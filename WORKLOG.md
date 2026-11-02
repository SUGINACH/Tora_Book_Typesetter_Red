# WORKLOG.md — יומן עבודה לפי שלב · Tora Book Typesetter Red
> כלל: כל שלב מתועד עם מה נעשה, ראיות ובדיקות. עדכון אחרון: 02.11.2026.

## 02.11.2026 — סגירת S7 ("סגירת כל הקצוות עד להשלמת S7 כולו")

### רקע
דוח ביקורת עצמאי (`audits/01_PROGRESS_AUDIT.md`, קומיט 7d0203b) מצא 6 ממצאי P0 ו־8 ממצאי P1; E2E עמד על 11/14 עם 3 כשלי שימור תוכן. הוראת המשתמש: סגירת כל הקצוות עד להשלמת S7 כולו.

### מה נעשה (לפי סדר העבודה — Branch-back-fix מהשלבים הקודמים, לא תיקון נקודתי)

**S0 (ניהול — הושלם):**
- נוסדו: `DECISIONS.md` (D-30..D-53), `ISSUE_REGISTRY.md` (P0/P1 עם ראיות ובדיקות רגרסיה), `WORKLOG.md` (קובץ זה), `OPEN_QUESTIONS.md`, `PROVENANCE.md`, `LAYOUT_DEPENDENCY_MAP.md`, `README.md` אמת.
- `package.json`: סקריפטים תקניים (`test:unit`, `test:settings`, `test:layout`, `test:audit`, `test:e2e`, `test:canonical`, `test:determinism`).
- CI: `.github/workflows/ci.yml` (Node 18/20/22 — npm test).
- ניקוי ריפו: `dbg2..dbg7` → `archive/debug/`; קובץ ריק `ai-chat/1` נמחק (דפוס באגי מ־Yellow).
- אוסף הזהב: `tests/audit/negative-controls.test.js` — 16 בדיקות anti-false-positive (כולל 14 תיקוני ה־false-positive ההיסטוריים של Z.ai/Claude).
- קורפוס קנוני: `tests/fixtures/canonical_corpus.txt` (נוצר דטרמיניסטית ע"י `generate_canonical_corpus.js`) + `tests/e2e/canonical.test.js` כתנאי מיזוג.

**S4-back-fix (P0-5, P0-4):** `scanConsumers` אמיתי — הרישום מוחרג מהיקף הסריקה, צריכה = `settings[...]` בלבד; `derivePlacementFlags` לא דורס קלט משתמש (D-39); מפתחות מתים חוברו/הוסרו (D-44/D-45/D-46/D-48). ראיות: registry 8/8 עם הסורק המתוקן.

**S5-back-fix (P0-3):** `moveLineForward` (D-49) — הזזות קדימה בסדר הקריאה בלבד; תיוג `seq` לכל שורה בהצבה; `reading-order-break` נוסף לקטלוג עם מייצר בפועל; `fixDropWordInColumns` מחובר ל־flushPage; איזון בגרנולריות שורה עם פשרות מתועדות (D-50). ראיות: s7-gate 'reading-order lock' + הוכחת הגלאי.

**S6-back-fix (P1-1):** `footnote-budget.getFootnotesReservedHeight` = מקור יחיד (dp-planner ממשיך דרכו); AQ + מצבי סוף־פרק נקראים מהצינור; מדיניות הערה ארוכה (split/move-whole/reject-to-body) בזמן ההצבה — פיצול אמיתי של הטקסט בין מרזבי עמודים עם סימון המשך; fn-layout-mode block/continuous מנגנון פריסה אמיתי (D-34).

**S7 (השלמה מלאה):**
- עמודי הערות: per-part, כותרות מהוראת מחלקה (D-40) עם "(המשך)", `endnote-columns` 1/2, `count-endnote-pages` (מספור), `f-note-body-font` במדידה.
- הערות צד: עיגון לפסקה המארחת (host), cascade, מיכל 20px, מעבר לעמוד הבא (BRZ-15 — אין גניזה), `verifyH7Conversion` מחובר (עוגן, לא חיפוש טקסט — תיקון המשתמש).
- סמנים: `notes/markers` מקור יחיד (4 סגנונות); מדיניות איפוס (continuous/page/section/part); הדבקה לעוגן (BRZ-11 לכל הסגנונות); תג E102 לזיהוי מדויק (D-53).
- חשבונאות: identity-by-construction (D-30) — בדיקת אמת מחלצת מהפלט המרונדר בלבד.
- CP4==CP5: הוכחה אמיתית (D-47) עם בדיקת רגישות (השתלת מוטציה ⇒ הhash משתנה).
- קדם־פאס סוגריים (D-42) + אכלוס `parenRanges` — משפחת V23 חיה.
- מספור עברי (D-31), פתיחות (D-36), `page-underfill` נפק, `pageNumberDisplay` מאוכלס, `background-opacity` ⇒ rgba אמיתי, מפריד טורים מרונדר.
- דטרמיניזם: שעון לוגי (ledger/events); `deterministic` נמדד; trace-verbosity מוזרם.

### ראיות — הרצת הבדיקות (02.11.2026)
```
parser:            17/17
typography:        14/14
registry-integration: 8/8   (סורק phantom אמיתי)
layout-s5-s6:      17/17    (כולל מדיניות הערה ארוכה במסלול אמיתי)
e2e-pipeline:      14/14    (לשעבר 11/14 — שלושת כשלי שימור התוכן תוקנו)
s7-gate:           15/15
negative-controls: 16/16
canonical:          6/6    (קורפוס קנוני, 8 מצבי הגדרות)
————— סה"כ: 107 בדיקות ירוקות
```

### שערי S7 (S7.2) — מצב
- [x] Endnote E2E multi-part: עמודים נכונים, ללא running head/גיליון (ברירת מחדל), כותרות המשך.
- [x] side-note-overflow=0, overlap=0; הצמדה לאנקור.
- [x] h7-conversion false-positive injection (כפילות טקסט בגוף ⇒ לא מדווח).
- [x] שני מצבי fn-layout audit-clean; continuous ללא תקרה.
- [x] מטריצת מספור×מפריד×איפוס — הרצים תואמים הגדרות (settings-effect).

### החלטות שנרשמו במסגרת העבודה
D-30, D-31, D-34, D-36, D-39, D-40, D-41, D-42, D-43, D-44, D-45, D-46, D-47, D-48, D-49, D-50, D-51, D-53 — ראו `DECISIONS.md`.

### ידוע ו�תוח (לא חוסם S7)
FWD-1 (spanning כותרות — S8), FWD-2 (shaar-sub reset — S8), FWD-3 (אורקל מדידה — S12), FWD-4 (קורפוס היסטורי 5,702 שורות ליובא). ראו `ISSUE_REGISTRY.md`.

---

## S8 — שערים, עיטורים, מפרידים וגרפיקה (Decoration Pass L5) — 03.11.2026

**מודולים חדשים (7):** `theme-sets` (קיבוץ לפי מספר ערכה, uniqueShaarId — נעילת F-10, הפעלת שלושת השערים, מודל בורר ויזואלי), `shaar-boxes` (גרירה/שינוי גודל/הצמדה/עיגול־שלם ייצוא־טעינה), `assets-import` (JPG/PNG/SVG דרך wrapShaarMedia, ייבוא תיקייה ללא מניפסט, אימות נתיבים), `svg-sanitize` (רשימת־היתרים + CSP hook), `custom-pages` (PT-09), `shaar-pages` (PT-01/02/03 מבנית), `ornament-plan` (פאס L5 + אודיט ornament-* במייצרים אמיתיים).

**הרחבות:** `ornament-fit` (h2OrnamentReservedHeight — הזמנת גובה בזמן פריסה, סגירת שורש F-08; סימטריית מרווחים F-21; הרמה אופטית −0.08em; משמרות מפרידים), `dividers` (מפרידי שערים, rollback-aware counters), `page-decorations` (3 מחלקות רקע + insets מ״מ — מיזוג פאנל רקע→נושאים), `dp-planner` (פס חוצה־טורים FWD-1, reAlignColumns — תיקון טור פנטום, H0→PREFACE), `pipeline` (הכנסת שערים לפני CP4, פאס עיטורים אחרי הערות צד, סריקות כוללות פס), `dom-renderer` (רינדור עיטורים/פס/רקעים/שערים/עמודים מותאמים), `folio` (counted=false לעמודים מותאמים), `retreat-loop` (D-60 — הקפאה ללא תיקון נרשמת כפשרה).

**רישום:** 23 מפתחות S8 חזרו עם מנגנום חי + בדיקות אפקט (D-54; סגירת הבטחת D-45). אפס מפתחות פנטום (הסורק האמיתי).

**ראיות — הרצת הבדיקות (03.11.2026):**
```
parser:            17/17
typography:        14/14
registry-integration: 8/8   (23 מפתחות חדשים — כולם נצרכים בפועל)
layout-s5-s6:      17/17
e2e-pipeline:      14/14
s7-gate:           15/15
s8-decoration:     39/39    (חדש — כל שערי S8.2 + REQ-ORN-01..08 + FWD-1/2)
canonical:          6/6     (כולל עיטורים מלאים: שימור תוכן + ניטרליות)
negative-controls: 16/16
————— סה"כ: 146 בדיקות ירוקות (לשעבר 107)
test:determinism   OK (bf2497eeea35a37b)
```

### שערי S8 (S8.2) — מצב
- [x] ornament-* kinds = 0 על canonical+ornaments; מייצרים אמיתיים (הזרקת פגם ⇒ ממצא).
- [x] רגרסיית F-10: הפעלת ערכת JSON ⇒ שלושת השערים פעילים (נעול לצמיתות) + ייחודיות id.
- [x] עיגול־שלם תיבות שער: הזזה → ייצוא → טעינה ⇒ מיקומים זהים.
- [x] גובה מפריד טורים = Math.min−8px תחת עומס (טורים לא־שווים); מקור יחיד.
- [x] פאס עיטורים מוכח ניטרלי (CP4==CP5 אמיתי; הזמנות גובה בפריסה — F-08).
- [x] אבטחת ייבוא: path traversal נדחה ומדווח; SVG מחוטא; CSP hook.
- [x] בורר ויזואלי: תצוגה מקדימה מהשער הראשי (מודל נתונים ל־S10).

### החלטות שנרשמו
D-54..D-60 — ראו `DECISIONS.md`.

### ידוע ותועד (לא חוסם S8)
FWD-3 (אורקל מדידה — S12), FWD-4 (קורפוס היסטורי — מתמשך). גרסת PDF של ממצאי עיטורים (צילומי עמוד) — עם ה־UI של S10 (הרנדר כאן הוא מודל גיאומטרי + אורקל DOM לבדיקות).
