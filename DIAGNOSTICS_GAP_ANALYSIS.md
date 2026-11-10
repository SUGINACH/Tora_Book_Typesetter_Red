# Gap analysis — אבחון RED מול Gold V21 (step-by-step audit)

> תוצר סוכן 2 · HEAD של main: `6f80156` · מקורות Gold שנבחנו: `scripts/step-by-step-audit.js`, `geometry-audit.js` (V21).
> סטטוסים: **קיים** · **חלקי** · **חסר** · **לא רלוונטי** · **לא נבחן**. כל שורה מפנה לקובץ/ממשק פעיל. לא בוצע שינוי קוד.

## 1. עיקרי הממצאים
1. **רוב ה"פערים" שהתוכנית הישנה הניחה כבר קיימים ב-RED**: טקסונומיית ממצאים של 43 סוגים (`red-build/src/audit/report-schema.js`), EventLog עם שלבים ו-checkpoints, Ledger עם מחזור חיים של 10 מצבים, trace, `projectDocument` (גיאומטריה מוחלטת), ממשק הצגה (`testing-tab.js`, `preview-tab.js:highlightIssue`).
2. **הפערים האמיתיים הם שלושה**: (א) אין snapshot/diff של מצב הפריסה בין checkpoints; (ב) אין `cp3` ואין קישור ממצא→רכיב מקור (לטוקנים אין offsets); (ג) אין מיפוי מפורש למחזור החיים לשבע קטגוריות הסיבתיות ולא הבחנות "לא נצפה / הוכח שאינו קיים" ו"תוקן / הוסר-נדחק-הוחלף".
3. **`geometry-audit.js` של Gold לא יועתק** (סעיף 13.3 בתוכנית): 12 הבדיקות שלו מכוסות ב-RED בשני מנגנונים (ledger מנועי + `tools/layout-audit/full-math-audit.js`). נדרש gap פר-בדיקה לפני כל תוספת (ראו שורה 10).

## 2. טבלת פערים

| # | יכולת ב-Gold V21 | מימוש ב-RED (הפניה) | סטטוס | פעולה / בעלים |
|---|---|---|---|---|
| 1 | הרצה בדפדפן (Playwright + chromium, `page.evaluate`), פרק מבודד | `typeset()` היא פונקציה טהורה ב-Node (`core/pipeline.js:111`) — ניתנת לצילום in-process ללא דפדפן | **לא רלוונטי** (יתרון RED) | — |
| 2 | 4 checkpoints אחרי שלבים (`after-initial-layout`, `after-cross-paragraph-parens`, `after-rebalance2`, `after-page-height`) | אירועי EventLog לפי שלב (`core/events.js`) + 5 תוויות: `cp1-parsed` (pipeline:168), `cp2-scope` (174), `cp2-measured` (572), `cp4-decoration-pass` (736), `cp5-render-ready` (1115). **אין `cp3`** — תכנון עמודים/הגנות/איזון/נסיגה נפלט מ-`layout/*` בלי תווית cp | **חלקי** | להוסיף תווית cp3 ולהגדיר נקודות snapshot. שינוי סכמת trace ⇒ תיאום סוכנים 1,4,5. בעלים: סוכן 2 |
| 3 | snapshot של מצב הפריסה לכל checkpoint (`pageElements`, `pageMetrics`) | אין. ה-pipeline משנה במקום; קיים רק המצב הסופי (CP5) + `output/geometry-projector.js:projectDocument` | **חסר** | snapshot immutable, opt-in, ממוקד לעמוד/בלוק/ממצא (לא שכפול ספר). סוכן 2 |
| 4 | `pageDelta` (נוסף/הוסר/השתנה בין checkpoints) | אין | **חסר** | נגזר משורה 3 |
| 5 | `problemElement` + זיהוי רכיב/טווח מקור | issue ב-ledger: `issue_id, kind, target (kind@page), page, first_seen_stage, transitions[], predicate_before/after` (`core/ledger.js`). לטוקנים: `id,type,level,text,raw` — **בלי offsets** | **חלקי** | להוסיף `tokenId`/טווח מקור ל-issues. נוגע ב-parser + סכמת ledger ⇒ תיאום סוכנים 1,4,5 |
| 6 | `classifyCausality` — 7 קטגוריות | `LIFECYCLE_STATES` ב-`core/ledger.js:7–17`: created, correction-blocked, correction-reverted, became-observable-later, competing-repair-side-effect, persists, resolved, reintroduced, not-comparable, unresolved. מיפוי מוצע: created→created-by-stage/created-at-first-checkpoint · resolved→fixed-by-stage · correction-reverted+reintroduced→correction-reverted · became-observable-later→couldnt-appear-before · persists/blocked/competing/unresolved→unresolved · **never-appeared: אין מקבילה** (דורש הבחנת "נצפה") | **חלקי** | פונקציית מיפוי טהורה מעל ה-ledger הקיים, במודול האבחון הקיים (לא `debug/`). הכנה קיימת (ראו דוח ראשון, סעיף ג). סוכן 2 |
| 7 | קישור ממצא סופי ↔ סיבה במנוע | ממצאי `full-math-audit.js` (DOM חי) אינם מקושרים ל-issues ב-ledger. נצפה: אינדקסי `page` ב-ledger (מסלול מודרני) אינם תואמים לאינדקסי עמוד סופיים (לפני הוספת שערים/תוכן) | **חסר / לא מאומת** | לאמת מרחב אינדקסים לפני קישור. סוכן 2 + סוכן 4 (full-math-audit) |
| 8 | מצב הרכיבים האחרים בעמוד בין הופעת הממצא לתיקונו (§2.4) | אין | **חסר** | תלוי בשורות 3–4 |
| 9 | "לא נצפה" מול "הוכח שאינו קיים"; "תוקן" מול "הוסר/נדחק/הוחלף" | אין ייצוג (`resolved` נושא `note` בלבד) | **חסר** | שדה observed + סיבת היעלמות ב-snapshot/transition. סוכן 2 |
| 10 | `geometry-audit.js`: 12 בדיקות DOM (containment, overlap, balance, widow/orphan, sparse-last-line, footnote overflow/containment, page overflow, ornaments, fill-ratio, block-gaps, settings) | (א) ledger מנועי במסלול המודרני — סוגי ממצא `widow-top/bottom`, `orphan-top/bottom`, `sparse-line`, `runt-line`, `column-imbalance`, `page-underfill`, `containment`, `fn-overlap`, `ornament-*`, `heading-escort`, `text-completeness`; (ב) `tools/layout-audit/full-math-audit.js` (815 שורות, ~46 בדיקות על DOM חי + workflow). נבדק: ב-`full-math-audit.js` אין widow/orphan/underfill — הם קיימים רק מנועית | **קיים** (כיסוי כפול) | **לא מעתיקים.** gap פר-בדיקה נשאר ל-`settings-verification` ול-fill-ratio על הגיאומטריה הסופית — לא נבדק בסבב זה. סוכן 2 מול סוכן 4 |
| 11 | הצגת audit/trace | `src/ui/testing-tab.js` (ממצאים, trace, כיסוי), `preview-tab.js:510 highlightIssue`, `ledgerSummary` | **קיים** | **אין פאנל Debug חדש** (תוכנית §7.2); שינוי UI — סוכן 1 |
| 12 | `trace-manager.js` (Gold, 496 שורות) מול `core/events.js` | — | **לא נבחן** | נדחה לסבב הבא |
| 13 | `test-triggers/` של Gold (תרחישי ייצור-בעיה: heading_escort, page_underfill…) | — | **לא נבחן** | להעביר לסוכן 4 כמקור fixtures |

## 3. חור שנמצא בדרך: ספירת תוכן לא מזהה השחתת כותרות
במסלול legacy, `contentPreserved` נשען על מולטיסט מילים. באג ה-rollback של כותרות (ראו `BUG_REPORT_heading-rollback-fallthrough.md`) יוצר **כפילות כותרת + אובדן כותרת קודמת**; כשמילות הכותרת האבודה מופיעות במקום אחר או שהכפילות מאזנת — הספירה **שקטה**. בהרצה על מסמך הבדיקה הקבוע: 2 פגיעות באג, רק אחת דווחה כ-`content-loss` (בשנייה אבדה `h4 "טעם הדין"` ו-`h5 "מקור הדין"` כפלה; "הדין" מקוזזת בכפילות). **המלצה (בתחום האבחון, לא יושמה):** בדיקת עקביות מבנית — כל טוקן כותרת נפלט בדיוק פעם אחת (לפי `tokenId`) — כבדיקת מנוע ב-ledger (kind חדש או `text-completeness` מורחב) + negative control.

## 4. סדר ביצוע מוצע לסגירת הפערים (אחרי baseline של סוכן 4)
1. שורה 7 — אימות מרחב אינדקסי העמודים (קריאה בלבד).
2. שורות 2+5 — הצעת שינוי חוזה אחת: תווית `cp3` + `tokenId`/טווח מקור ב-issue (שינוי תוספתי בלבד; שדות חדשים אופציונליים).
3. שורות 3–4+8–9 — snapshot/diff ממוקד, opt-in, מדידת עלות פעיל/כבוי.
4. שורה 6 — מיפוי סיבתיות + fixtures created/fixed/reverted/unresolved (עם סוכן 4).
5. שורה 10 — gap פר-בדיקה מול `full-math-audit.js`.
