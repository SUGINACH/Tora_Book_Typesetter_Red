# BASELINE v2 — RED @ `188a201` (G0 מחודש אחרי #33 / D-100)

> **מטרה:** נקודת ייחוס מזוהה וניתנת לשחזור לפני תיקוני המנוע של סוכן 2 (R-03 ‏#48, R-04 ‏#55, R-05). **מחליף את v1** (`6f80156`, ‏`audits/baseline/6f80156/`), ששמור כמות שהוא.
> **סטטוס:** נמדד מקומית ושוחזר מול ה-CI הרשמי (שלוש ריצות על אותו commit, כולן `success`; ספירה לכל קובץ זהה ב-Node ‏18/20/22). **קוד המנוע ב-`main` הנוכחי (`0531878`) זהה בייט-לבייט ל-`188a201`** (§8) — לכן v2 הוא גם הבסיס לתיקוני המנוע שנפתחים עכשיו.
> מקור אמת מכונתי: `manifest.json` (סכמה `red-baseline-v2`). מסמך זה מסכם; בהתנגשות — המניפסט קובע.

## 1. זיהוי

| | |
|---|---|
| commit | `188a20199ac9725883377a79e78a6a83996ec998` — מיזוג PR #33 (D-100) |
| ריצה (UTC) | 2026-11-17 03:29 |
| סביבה | Node v22.23.4 · npm 10.9.9 · Linux 6.18 x64 · 2 CPU · 8GB · Python 3.13 + PyMuPDF 1.26.7 · poppler 24.02 (`pdfinfo`/`pdftotext`) · Chrome for Testing 153.0.8010.12 · DejaVuSans (sha256 `ae7b7855…`) · `CI` לא הוגדר מקומית (0 דולגו — אין השפעה) |
| CI רשמי (אותו commit) | CI ‏`43917551730` (test 18/20/22 + layout-audit) · layout-parity ‏`43917551759` (+ very-long-corpus) · full-math-audit ‏`43917551735` (job `local`; `live` דולג) — כולן `success`; אודיט הדפדפן ב-CI רץ על Chrome ‏157.0.8103.78 |
| חבילות (sha256) | `app.bundle.js` ‏`23fd5c4f72db…` · `engine-worker.bundle.js` ‏`34aa8b72b93f…` (מלא ב-`manifest.json → inputs[]`) |
| ⚠ עץ מלוכלך | המניפסט רושם `dirtyTrackedBeforeRun = tools/baseline/run-baseline.js`: ה-runner הותאם ל-#33 וה-commit שלו הוא ה-PR שמוסיף חבילה זו (§10). ההתאמה משנה רק את רשימת הפקודות (מוסיפה את `test:regress`), את דיווח הרצפה ההיסטורית ואת סכמת המניפסט — לא את מה שנמדד. `red-build/**` תואם ל-`main@188a201` |

## 2. תוצאות במבט אחד (נמדד)

| קריטריון | תוצאה |
|---|---|
| סוויטה (`npm test` + `test:regress`) | **40 פקודות · 797 בדיקות · 0 נכשלו · 0 דולגו · 0 יציאות שאינן אפס** (39 קבצים עם מונה + `scan-control-triggers`); זמן 84.4 שנ' |
| מקומי ↔ CI | **EQUAL** לכל קובץ (39 קבצים, 797) מול `test (18)`, `test (20)`, `test (22)`; parity ו-very-long-corpus זהים אף הם (`ci/local-vs-ci.json`) |
| דטרמיניזם | `deterministic OK 80f9ed6c82ea3855 · 36 עמ'` (הקנוני — **זהה ל-v1**); שתי ריצות בתהליכים נפרדים זהות |
| `scan-control-triggers` | 22 קבצים · 3 קשתות קריאה למנוע · 3 מותרות (נתיבים מפורשים) · **0 הפרות** |
| parity מול הדוגמה ההיסטורית | HARD **3/3** · PARITY **12/14** · ציון **88.2** (אבחוני) · נכשלות: **P6** (רצף פסקאות) ו-**P7** (שקילות שבירת שורות); P1 עמודים 54=54 |
| קורפוס ארוך (`audits/long_test_text.txt`, 267,414 מילים, 2,047 כותרות) | **548 עמ' · 2,863 פסקאות** · hash `legacy-5aeaa97e7a26eb96` · דטרמיניזם זהה · בדיקות הקורפוס **7/7** (ציון 100, PASS; 5 מדדים מידעיים) |
| full-math בדפדפן (CI, `local`) | **552/552 עמ' · 35,724 שורות · 286,048 מילים · 0 בעיות · דטרמיניזם IDENTICAL** |
| layout-audit בדפדפן (CI) | 10/10 עמ' (קנוני) ו-552/552 (וירטואלי, ארוך) — 0 בעיות |
| באגים ידועים בהרצה (CI) | 9 שורות `KNOWN-BUG`: R-03 ×5 · R-04 ×4 (strict-xfail — נכשלות מהסיבה הידועה). R-05 נמצא אחרי commit זה (§6) |

## 3. מה השתנה מול v1 (`6f80156`) — מחושב מהמניפסטים

| נושא | v1 | v2 |
|---|---|---|
| בדיקות | 34 פקודות · 672 | **40 פקודות · 797** (‏+125) |
| parity | HARD 4/4 · PARITY 12/14 · ציון 88.9 (= רצפה, נאכפה) | HARD **3/3** · PARITY 12/14 · ציון **88.2**; **H4 הוסב מ-HARD ל-LEGACY** (אבחוני); הרצפה 88.9 **אינה נאכפת** (מאז #33) |
| תוצאות P1–P9 | — | **זהות בכל השדות** (פער 88.9→88.2 הוא ארטיפקט נוסחה: מחלק HARD קטן יותר; אף בדיקה לא שינתה pass/fail; H4 ‏72.3%/69.1% זהה) |
| דוגמת ה-PDF ההיסטורית | רפרנס | `referenceAuthority = historical-illustrative-only` — אילוסטרטיבית, לא סמכותית |
| קורפוס כבד | `very_long_test_text.txt` (3.4MB) | `very_long_test_text.txt` **קלט פסול** (שרשראות כותרות לא תקינות; בקרה שלילית בלבד); הקורפוס הארוך = `audits/long_test_text.txt` |
| שער מבנה | — | `typeset()` דוחה שרשראות כותרות לא תקינות (`document-structure.js`, `tools/validate-source-structure.js`) |
| hash קנוני | `80f9ed6c82ea3855` · 36 עמ' | **זהה** |
| חבילות / `package.json` | — | שונו (ראו `manifest.json → inputs[]`): app ‏1,063,138→1,099,362 B · worker ‏1,022,977→1,029,532 B · package.json ‏3,259→3,720 B |

תוספת הבדיקות (סכום 125): `document-structure` ‏+12 · `a1-run-summary` ‏+6 · `a1-input-integrity` ‏+14 · `a1-boot-failure` ‏+8 · `long-real-text` ‏+1 · `regress/heading-rollback` ‏+13 · `regress/source-families` ‏+71. אין פקודה שהוסרה.

## 4. פירוט לפי קובץ (מחולל מ-`manifest.json → suite.rows`)

| # | פקודה (מתוך `red-build/`) | בדיקות | ms |
|--:|---|--:|--:|
| 1 | `tests/unit/parser.test.js` | 25 | 38 |
| 2 | `tests/unit/document-structure.test.js` | 12 | 532 |
| 3 | `tests/unit/typography.test.js` | 16 | 40 |
| 4 | `tests/integration/registry.test.js` | 8 | 66 |
| 5 | `tests/integration/imud-migration.test.js` | 11 | 76 |
| 6 | `tests/integration/setting-sets.test.js` | 5 | 158 |
| 7 | `tests/integration/source-variants.test.js` | 6 | 107 |
| 8 | `tests/layout/s5-s6.test.js` | 17 | 90 |
| 9 | `tests/layout/ext8-optimal-balance.test.js` | 5 | 50 |
| 10 | `tests/e2e/pipeline.test.js` | 14 | 145 |
| 11 | `tests/e2e/s7-notes.test.js` | 15 | 179 |
| 12 | `tests/e2e/s8-decoration.test.js` | 48 | 1447 |
| 13 | `tests/e2e/s9-headers.test.js` | 25 | 755 |
| 14 | `tests/e2e/s10-ui.test.js` | 43 | 3446 |
| 15 | `tests/e2e/s11-extensions.test.js` | 50 | 10560 |
| 16 | `tests/e2e/s12-export.test.js` | 26 | 8882 |
| 17 | `tests/e2e/real-fonts.test.js` | 14 | 857 |
| 18 | `tests/e2e/d89-visual-fixes.test.js` | 75 | 1323 |
| 19 | `tests/e2e/s15-view-justify.test.js` | 3 | 356 |
| 20 | `tests/e2e/s24-fullmath-fixes.test.js` | 16 | 570 |
| 21 | `tests/e2e/pdf-targets.test.js` | 4 | 164 |
| 22 | `tests/e2e/s13-acceptance.test.js` | 11 | 2965 |
| 23 | `tests/e2e/s14-layout-audit.test.js` | 52 | 172 |
| 24 | `tests/e2e/canonical.test.js` | 6 | 450 |
| 25 | `tests/e2e/long-real-text.test.js` | 7 | 11755 |
| 26 | `tests/audit/negative-controls.test.js` | 19 | 122 |
| 27 | `tests/audit/s13-security-a11y.test.js` | 12 | 138 |
| 28 | `tests/e2e/s52-dp-fixes.test.js` | 23 | 82 |
| 29 | `tests/e2e/s52-ui-fixes.test.js` | 18 | 9150 |
| 30 | `tests/e2e/audit-sensitivity.test.js` | 24 | 90 |
| 31 | `tests/e2e/s53-dp-notes-export.test.js` | 18 | 344 |
| 32 | `tests/e2e/s60-monster-fixes.test.js` | 17 | 223 |
| 33 | `tests/e2e/s61-gap-fixes.test.js` | 27 | 9212 |
| 34 | `tests/e2e/s62-user-questions.test.js` | 13 | 3961 |
| 35 | `tests/e2e/a1-run-summary.test.js` | 6 | 332 |
| 36 | `tests/e2e/a1-input-integrity.test.js` | 14 | 628 |
| 37 | `tests/e2e/a1-boot-failure.test.js` | 8 | 68 |
| 38 | `../tools/scan-control-triggers.js` | — | 78 |
| 39 | `tests/regress/heading-rollback.test.js` | 13 | 2995 |
| 40 | `tests/regress/source-families.test.js` | 71 | 11788 |

סה"כ: 797 / 0 / 0 · זמן ריצה כולל 84,394 ms. הלוגים הגולמיים — `logs/NN-*.log`.

## 5. Parity ו-P6/P7 — נתוני אבחון (לסוכן 2; לא יעד)

הרפרנס (`audits/layout-reference.json`, מחולץ מדוגמת ה-PDF של הגרסה הישנה — 54 עמ' מעל `no_long_test_text.txt`) הוא **אילוסטרטיבי בלבד**; הנתונים נמסרים לאבחון סיבתי, לא כציון להשגה (אין יעד מלאכותי).
- **P6 רצף פסקאות:** רפרנס 278 פסקאות מול 285 שלנו; ‏199 מיושרות בראשן · ‏164 עם אותו מספר שורות · ‏143 עם אותו מספר מילים; שורות 3,149 מול 3,160; מילים 21,861 מול 21,650.
- **P7 שקילות שבירת שורות:** יחס 0.8098 (רפרנס 4,080 שורות מול 4,110 שלנו). ארבעת ההבדלים הראשונים (מדווחים כפי שהם; **לא סווגו** — פריט פתוח): (א) הבדל תו בודד בטקסט — `ל למציאות` ↔ `לא למציאות` (ייתכן ארטיפקט חילוץ של הרפרנס); (ב‑ג) אסימוני פוליו/מספור בתוך שורה — `מג` ↔ `מד`, ‏`מח` ↔ `מט` (הפרש ‎+1 בשני המקרים); (ד) `הקדמות וכללים` ↔ `הקדמות` — כנראה שבירת כותרת בעמוד ה-shaar-sub (עמ' 6).
- **H4** (יישור): ‏72.3% מול 69.1% ברפרנס, 74 עמודי שני-טורים — LEGACY, אבחוני.
- אותם נתונים בדיוק כמו ב-v1 (`diff` של `parity-report.json`: רק תווית H4).

## 6. ממצאים ידועים בבסיס זה (המנוע זהה לבסיס; הפירוט ב-PR-ים)

| מזהה | תיאור | מצב ב-`main` הנוכחי |
|---|---|---|
| R-03 | דגלי "בתוך סוגריים" של מילה עם סמן-הערה מודבק מדלפים לשאר הפסקה | תיקון ב-**#48** (פתוח); בדיקות strict-xfail ב-`source-families` |
| R-04 | "הערת רפאים": הערת פסקה שנדחתה שלמה אחרי רצועת h3 נשארת בעמוד הקודם | תיקון ב-**#55** (פתוח; אומת — תגובה שם) |
| R-05 | שורות `הערת סיום -` רצופות: נשארת רק האחרונה (אובדן תוכן מקור; `contentPreserved=true`) | **נמצא אחרי commit זה** (בדיקות ב-#54, ממוזג); תיקון — בעלות סוכן 2, מועמד מאומת מחוץ לריפו |
| O-1…O-7 | התנהגויות מקור מתועדות (לא באגים; סיווג — החלטת בעלים) | `red-build/tests/fixtures/regress/README.md` |

R-01 (rollback כותרות) תוקן ב-#43 לפני v2 ולכן כבר אינו ברשימה.

## 7. פריסה חיה — R-11 נסגר כ"סיבה זוהתה" (לא תקלת בדיקה)

ה-`full-math-audit` **המתוזמן** (job `live`) נכשל כל לילה מאז 2026-11-13 (5 ריצות רצופות; עד 11-12 עבר) — ריצה אחרונה ‏`44076327923` על `main@0531878`. **הסיבה: שער "הפריסה החיה מיושנת"** ב-`tools/layout-audit/run-full-math.js` — הוא משווה sha256 של החבילות המוגשות מ-GitHub Pages לאלה שב-`main`, ונעצר **לפני** שמריץ את האודיט:

| חבילה | חי (GitHub Pages) | `main` |
|---|---|---|
| `app.bundle.js` | `2a6a6f8f3aba9442…` | `23fd5c4f72dbdd14…` |
| `engine-worker.bundle.js` | `75c8d7db66c5cb08…` | `34aa8b72b93f9e34…` |

הטביעות החיות הן **בדיוק חבילות v1** (`6f80156`) — האתר החי טרם עודכן אחרי #33 (והתיקונים הקודמים). זהו השער שעובד כתכנון: **אין כאן רגרסיה בקוד ואין החלשה של הבדיקה**, והוא ימשיך להיכשל כל לילה עד שהפריסה תתעדכן. הפריסה היא נוהל ידני (`deploy-pages.yml`, שאלה פתוחה O-5/‏18 — החלטת בעלים). ‏`ASSET_VERSION` זהה (`2026-11-10-s6.3`) בחי וב-`main` למרות שהחבילות שונות — לבדוק בפריסה הבאה אם נדרשת הקפצה (מטמון). ראיה: לוג job ‏`134015170763` של הריצה הנ"ל.

## 8. הקשר ל-`main` הנוכחי (`0531878`)

- **המנוע וכלי המדידה זהים:** `git diff --stat 188a201 0531878 -- red-build/src red-build/ui tools/layout-parity tools/layout-audit audits` ← ריק (מלבד `audits/baseline/**` החדש). לכן כל מדידת התנהגות כאן (hash, parity, הקורפוס הארוך, אודיט הדפדפן) תקפה גם ל-`0531878`.
- מה שהשתנה ב-`main` מאז: מסמכי תיאום/ביצועים (סוכנים 3, 5), `tools/baseline/impact.js` (#50), ובדיקות בלבד — `source-families` ‏71→119 (#54), `impact-tool` ‏+16 (#50), `package.json` (`test:regress` כולל את `impact-tool`). מניין הסוויטה ב-`0531878`: **861 בדיקות · 0 נכשלו · 0 דולגו (40 קבצים)** — **נמדד ב-CI הרשמי** (ריצה ‏`44048781253`, job ‏`test (18)`, אותו parser של `compare-with-ci.js`), ותואם לחישוב: 713 בשרשרת הראשית + 13 + 119 + 16.
- השוואת השפעה של תיקון מנוע לעומת בסיס זה: `node tools/baseline/impact.js --base <עץ בסיס> --cand <עץ מועמד>` (#50).

## 9. מגבלות וגילוי נאות

1. **אודיט הדפדפן** (`full-math`, ‏`layout-audit`) רץ רק ב-CI; בחבילה — לוגים ומטא-דאטה בלבד (`ci/`). קובצי ה-artifact עצמם לא ניתנים להורדה מהסביבה.
2. **האישור החזותי של המשתמש** (שער G6 — בדיקת ספר דוגמה עמוד-עמוד) לא נבדק ואינו ניתן להחלפה במדידה.
3. **אין בדיקת UI בדפדפן אמיתי מקומית**; ביצועים — רק זמני הריצה הרשומים; כיסוי קוד — לא נמדד.
4. **סחף של ארטיפקטים נעקבים:** הרצת הסוויטה משכתבת 6 קבצים תחת `red-build/tests/artifacts/` (`s10-callgraph.json`, `s12-canonical.pdf`, `s12-font-subset.json`, `s13-matrix-report.json`, `s13-perf.json`, `s53-dp-endnotes.pdf`) — ה-runner משחזר אותם (patch: `logs/tracked-artifact-drift.patch`). זו שאלה פתוחה R-4 (האם להפסיק לעקוב אחריהם).
5. הלוגים הגולמיים של ה-parity כוללים נתיבי עץ-עבודה של הסביבה שבה רצו; אין לכך השפעה על התוצאות.
6. ה-baseline תקף ל-`188a201` ולמנוע זהה לו בלבד; שינוי מנוע מחייב ריצה חוזרת והשוואה (§11).

## 10. שחזור

```bash
git checkout 188a201                                    # או ענף שמבוסס על main שבו red-build/src ו-red-build/ui זהים
cd red-build && CI=true npm test && npm run test:regress  # 40 פקודות · 797 בדיקות (ב-main הנוכחי יותר — §8)
cd .. && node tools/baseline/run-baseline.js --parity   # הכול + דטרמיניזם + parity + הקורפוס הארוך → audits/baseline/<sha7>/
node tools/baseline/compare-with-ci.js audits/baseline/188a201   # מקומי ↔ CI, מתוך ci/logs/
```

דרישות: Node ‏≥ 18, `poppler-utils`, `fonts-dejavu-core`; ל-parity — Python 3 עם `pymupdf`. אפשרויות: `--out <dir>` · `--keep-artifacts` · `--skip-suite`. ה-runner אינו משנה קוד מנוע ומחזיר את הארטיפקטים הנעקבים למצבם. ה-runner (בגרסת ה-PR הזה) כולל את צעד `test:regress` — כמו ה-CI — ולכן 797 מקומי = 797 CI.

## 11. מטריצת אימות אחרי כל תיקון מנוע

| קריטריון | סוג | תנאי |
|---|---|---|
| סוויטה | שער | 0 נכשלו · 0 דולגו · כולל `test:regress`; אין הסרת בדיקה בלי נימוק |
| HARD (H1–H3): שימור תוכן, אפס חפיפות, גבולות עמוד | שער | 3/3 |
| דטרמיניזם | שער | hash קנוני `80f9ed6c82ea3855` זהה **או** שינוי מכוון עם הסבר; שתי ריצות בתהליכים נפרדים זהות |
| קורפוס ארוך (`long_test_text.txt`) | שער | 7/7 · מילים במקור = מילים בפלט · דטרמיניזם |
| דפדפן (CI: `full-math`, `layout-audit`) | שער | 0 בעיות · IDENTICAL |
| תיקון באג | שער | בדיקת שחזור שנכשלת על הקוד הישן ועוברת על החדש + בקרה שלילית; מזהה ב-`FIXED` של `source-families` |
| השפעה | שער | `impact.js` base→cand: אפס רגרסיות באורקל; כל שינוי hash/עמודים מוסבר לפי קורפוס |
| P1–P9 (88.2) | **אבחוני** | מדווח; ירידה/עלייה אינה רגרסיה/שיפור כשלעצמה; אין יעד מלאכותי |
| C4–C8, H4 | **אבחוני** | מידעיים |

## 12. מסירה

- **סוכן 2:** hash קנוני · נתוני P6/P7 (§5) · מטריצה (§11) · `impact.js` · ה-diff המועמד ל-R-05 (תגובה ב-#54) ואימות #55/#48 (תגובות שם).
- **סוכן 5:** R-11 — סיבה זוהתה (§7); מומלץ לעדכן את `AGENT_TRACKING.md` (R-11 ← "שער פריסה מיושנת; ממתין להחלטת O-5") ולא לכתוב "N בדיקות" בטקסט חופשי אלא להפנות ל-`manifest.json`.
- **בעלים:** (א) פריסת Pages (O-5) — עד שתתעדכן, ה-`live` המתוזמן ייכשל כל לילה; (ב) R-4 (ארטיפקטים נעקבים); (ג) שער G6 לקראת מהדורה.
