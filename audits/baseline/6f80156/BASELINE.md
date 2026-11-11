# BASELINE — RED @ `6f80156` (שלב 0 / G0: baseline מזוהה וניתן לשחזור)

> **סוכן 4 — תשתית בדיקות.** נוצר 2026-11-10 על ענף `feature/agent-4-testing-green`, מבוסס על `main@6f80156`.
> **אין בחבילה זו שום שינוי בקוד המנוע.** יש בה מדידות בלבד, מופרדות בין *נמדד* / *נגזר* / *לא נבדק*.
> מטרתה: נקודת ייחוס אחת שכל סוכן יכול לשחזר ולהשוות אליה לפני ואחרי כל תיקון.

## 1. זיהוי

| פריט | ערך |
|---|---|
| commit | `6f801568c15071a27f97918ff8479def9c719c0d` — מיזוג PR #32 (מסמכי תוכנית חמשת הסוכנים). אותו commit רץ ב-CI (ראו שורת "ריצות CI" בהמשך הטבלה) |
| ריצה מקומית | 2026-11-10T09:19Z · Node v22.23.4 · npm 10.9.9 · Linux 6.18.44 x64 · 2 מעבדים · 8 GB |
| כלים מקומיים | poppler (pdfinfo/pdftotext) 24.02.0 · Python 3.13.18 · PyMuPDF 1.26.7 · Chrome for Testing 153.0.8010.12 (לא בשימוש הסוויטה) |
| גופן | `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf` · חבילת `fonts-dejavu-core` 2.37-8 · 759,720 בתים · sha256 `ae7b7855e115a5966d8b1b3f80f254ccc117ec86f9965e202ee2940453837280` |
| CI (אותו commit) | `ubuntu-24.04` · Node 18.20.8 / 20.20.2 / 22.x · poppler-utils 24.02.0-1ubuntu9.11 · Chrome 157.0.8103.50 (אודיט הדפדפן) |
| ריצות CI | `ci.yml` [42750910040](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions/runs/42750910040) · `layout-parity.yml` [42750910119](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions/runs/42750910119) · `full-math-audit.yml` [42750909721](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions/runs/42750909721) (מצב local; מצב live דולג כמצופה באירוע push) · `gh-pages-audit.yml` [42721553569](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions/runs/42721553569) (האתר החי, על commit `69b0083`) |
| טביעות אצבע של קלטים | `manifest.json → inputs[]` (sha256 לקורפוסים, `layout-reference.json`, fixtures, הגדרות ברירת מחדל, `parity-baseline.json`, חבילות ה-UI/Worker, PDF-ייחוס) |

## 2. תוצאות במבט אחד

| שכבה | תוצאה | ראיה |
|---|---|---|
| סוויטת Node (`npm test`, 34 פקודות) | **672 עברו · 0 נכשלו · 0 דולגו** ב-33 קבצים עם מונה; `scan-control-triggers`: 19 קבצים · 3 קשרי קריאה למנוע · **0 הפרות** | `logs/NN-*.log`, `manifest.json → suite` |
| התאמה ל-CI | **זהה לכל קובץ (33/33) ב-Node 18, 20 ו-22**; אותו סכום 672 | `ci/local-vs-ci.json` (מחושב מכונתית) |
| דטרמיניזם — קורפוס קנוני | `80f9ed6c82ea3855…` · 36 עמודים · זהה בסקריפט הרשמי (`test:determinism`) ובשתי ריצות בתהליכים נפרדים | `logs/determinism-*.log` |
| layout-parity מול ייחוס הגרסה הישנה | HARD **4/4** · PARITY **12/14** · ציון **88.9%** = רצפת ה-ratchet (`parity-baseline.json`) · נכשלות: **P6, P7** | `parity/parity-report.json` |
| קורפוס ארוך מאוד (3.4MB), נתיב Node | 700 עמודים · hash `legacy-3ff0bdd5f212c4a2` · דטרמיניזם זהה · C1–C12 עוברים · שימור תוכן: 337,622 מילים במקור = 337,622 בפלט (0 חסרות, 0 עודפות) | `parity/corpus-report.json`, `logs/parity-run-ours-very-long.log` |
| אודיט מתמטי מלא, דפדפן אמיתי (**CI בלבד**) | 704/704 עמודים · 43,117 שורות · 360,326 מילים · **0 בעיות** · דטרמיניזם IDENTICAL — גם על ה-build וגם על האתר החי | `ci/logs/run42750909721-local.log`, `ci/logs/run42721553569-live-audit-after-deploy.log` |
| layout-audit ב-`ci.yml` (**CI בלבד**) | 704/704 עמודים · כותרות עליונות 686/686 · 0 בעיות | `ci/logs/run42750910040-layout-audit.log` |

**מסקנה מדודה:** על `6f80156` אין כשל בדיקה, אין חריגת HARD, והדטרמיניזם מתקיים בכל הנתיבים שנבדקו. הפערים הפתוחים הם P6/P7 (§5): אי-שוויון לייחוס של הגרסה הישנה, לא כשל בדיקה — ולכן סוויטה ירוקה אינה מעידה על סגירתם.

## 3. מה נספר — "בדיקה"

- **בדיקה = קריאת `it()` אחת בהרנס `tests/harness.js` שעברה.** כל קובץ מדפיס `== T: P/N passed, F failed, S skipped ==`.
- `d89-visual-fixes` ו-`s14-layout-audit` מדפיסים מונים בפורמט משלהם (`P/N passed, F failed` · `P passed, F failed`); נספרים לפי `passed`.
- `scan-control-triggers` אינו מדפיס מונה בדיקות — נספר כפקודה אחת, **לא** בתוך ה-672.
- הריצה בוצעה עם `CI=true`: **דילוג נחשב כשל** (כמו ב-CI).
- ה-runner מריץ כל פקודה בשרשרת `npm test` בנפרד ואינו עוצר בכשל ראשון — כך שכשל בקובץ אחד לא מסתיר את מצב השאר.

## 4. פירוט לפי קובץ (מחולל מ-`manifest.json`)

| # | קובץ (תחת `red-build/tests/`) | כותרת | עברו | נכשלו | דולגו | ms |
|---|---|---|---|---|---|---|
| 1 | `unit/parser.test.js` | parser | 25 | 0 | 0 | 41 |
| 2 | `unit/typography.test.js` | typography | 16 | 0 | 0 | 45 |
| 3 | `integration/registry.test.js` | registry-integration | 8 | 0 | 0 | 74 |
| 4 | `integration/imud-migration.test.js` | imud-migration | 11 | 0 | 0 | 70 |
| 5 | `integration/setting-sets.test.js` | setting-sets | 5 | 0 | 0 | 142 |
| 6 | `integration/source-variants.test.js` | source-variants | 6 | 0 | 0 | 82 |
| 7 | `layout/s5-s6.test.js` | layout-s5-s6 | 17 | 0 | 0 | 84 |
| 8 | `layout/ext8-optimal-balance.test.js` | ext8-optimal-balance | 5 | 0 | 0 | 55 |
| 9 | `e2e/pipeline.test.js` | e2e-pipeline | 14 | 0 | 0 | 136 |
| 10 | `e2e/s7-notes.test.js` | s7-gate | 15 | 0 | 0 | 194 |
| 11 | `e2e/s8-decoration.test.js` | s8-decoration | 48 | 0 | 0 | 1494 |
| 12 | `e2e/s9-headers.test.js` | s9-headers | 25 | 0 | 0 | 726 |
| 13 | `e2e/s10-ui.test.js` | s10-ui | 43 | 0 | 0 | 3457 |
| 14 | `e2e/s11-extensions.test.js` | s11-extensions | 50 | 0 | 0 | 10412 |
| 15 | `e2e/s12-export.test.js` | s12-export | 26 | 0 | 0 | 8922 |
| 16 | `e2e/real-fonts.test.js` | real-fonts | 14 | 0 | 0 | 745 |
| 17 | `e2e/d89-visual-fixes.test.js` | d89-visual-fixes | 75 | 0 | 0 | 1272 |
| 18 | `e2e/s15-view-justify.test.js` | s15-view-justify | 3 | 0 | 0 | 278 |
| 19 | `e2e/s24-fullmath-fixes.test.js` | s24-fullmath-fixes | 16 | 0 | 0 | 467 |
| 20 | `e2e/pdf-targets.test.js` | pdf-targets | 4 | 0 | 0 | 158 |
| 21 | `e2e/s13-acceptance.test.js` | s13-acceptance | 11 | 0 | 0 | 3066 |
| 22 | `e2e/s14-layout-audit.test.js` | s14-layout-audit | 52 | 0 | 0 | 178 |
| 23 | `e2e/canonical.test.js` | canonical | 6 | 0 | 0 | 476 |
| 24 | `e2e/long-real-text.test.js` | long-real-text | 6 | 0 | 0 | 18946 |
| 25 | `audit/negative-controls.test.js` | negative-controls | 19 | 0 | 0 | 133 |
| 26 | `audit/s13-security-a11y.test.js` | s13-security-a11y | 12 | 0 | 0 | 126 |
| 27 | `e2e/s52-dp-fixes.test.js` | s52-dp-fixes | 23 | 0 | 0 | 79 |
| 28 | `e2e/s52-ui-fixes.test.js` | s52-ui-fixes | 18 | 0 | 0 | 9199 |
| 29 | `e2e/audit-sensitivity.test.js` | audit-sensitivity | 24 | 0 | 0 | 110 |
| 30 | `e2e/s53-dp-notes-export.test.js` | s53-dp-notes-export | 18 | 0 | 0 | 300 |
| 31 | `e2e/s60-monster-fixes.test.js` | s60-monster-fixes | 17 | 0 | 0 | 210 |
| 32 | `e2e/s61-gap-fixes.test.js` | s61-gap-fixes | 27 | 0 | 0 | 8557 |
| 33 | `e2e/s62-user-questions.test.js` | s62-user-questions | 13 | 0 | 0 | 4007 |

סה"כ: **672** עברו · 0 נכשלו · 0 דולגו. עוד פקודה אחת בשרשרת: `tools/scan-control-triggers.js` (34, יציאה 0, בלי מונה בדיקות). הקבצים האיטיים ביותר: `long-real-text` 18.9s · `s11-extensions` 10.4s · `s52-ui-fixes` 9.2s · `s12-export` 8.9s · `s61-gap-fixes` 8.6s; כל הסוויטה 74.3s.

## 5. פערי הייחוס הפתוחים — P6 ו-P7 (נתוני בסיס לסוכן 2)

> זהו **מדידה בלבד**. סיבת הפער לא אובחנה כאן — אבחון שורש הוא משימת סוכן 2, על בסיס הפיקסצ'רים שסוכן 4 יספק.

**P6 — רצף פסקאות** (`parity/parity-report.json`): ייחוס 278 פסקאות מול 285 אצלנו · 199 מיושרות בראש הרצף · 164 תואמות במספר שורות · 143 תואמות במילים · סה"כ שורות 3,149 מול 3,160 · סה"כ מילים 21,861 מול 21,650 (‏−211). ההבדלים הראשונים (פסקאות שמתחילות בטקסט שונה):

| ייחוס | אצלנו |
|---|---|
| `נפש כלל מעשה` | `וכדלעיל שאם לא` |
| `ובהקדם ביאור גדרי` | `וזה יהיה ביאור` |
| `שייך לחלק ולהוסיף` · `מעות לדעת סוף` | `לאחד והשלישי הוא` · `מטרות האחת הספירה` |
| `מונה ששה ומשמר` | `שבעה ימים נמצא` |
| `שבת אמר להם` | `ושמרתם את השבת` |
| `חשובה ואף שתוצאת` | `גרידא וזו מלאכת` |

**P7 — שקילות שבירת שורות**: יחס 0.8098 · 4,080 שורות בייחוס מול 4,110 אצלנו. הסטיות הראשונות:

| ייחוס | אצלנו |
|---|---|
| `ביחס המעשה ל למציאות קיימת` | `ביחס המעשה לא למציאות קיימת` |
| `מג מתעסק` | `מד מתעסק` |
| `גדרי הוצאה מח מלאכת` | `גדרי הוצאה מט מלאכת` |
| `הקדמות וכללים` | `הקדמות` |

**כיוון ראשון (לא מסקנה):** בשלוש מארבע הסטיות הראשונות ב-P7 ההבדל הוא אסימון קצר אחד (`ל`↔`לא`; `מג`↔`מד` = 43↔44; `מח`↔`מט` = 48↔49 — ערכי גימטריה עוקבים), ובאחת מילה חסרה בכותרת (`וכללים`). האם זה ריצוד מספור, סימן הערה, או הבדל קלט בין הייחוס למקור — **לא נקבע**. H1 (שימור תוכן על הקורפוס הקנוני) ו-C1 (קורפוס ארוך) עוברים עם 0 חסרות/0 עודפות, כלומר ההבדלים האלה אינם אובדן מילים במבחן המולטיסט הגלובלי.

**שימור תוכן במסלול הערות הענק** (תוכנית העבודה §3.4 סעיף 3, "לשון" ו"הפוסקים"): **טרם שוחזר.** שום בדיקה בחבילה זו לא מכסה אותו; זו משימת ה-fixture הראשונה של סוכן 4 (§11).

## 6. הצלבת מספרים בתיעוד מול המדידה

| טענה בתיעוד | מקום | נמדד עכשיו | הערה |
|---|---|---|---|
| 388 בדיקות | `README.md:44` | **672** ב-33 קבצים | 388 הוא המספר מתקופת S4.8 (`WORKLOG.md:501`) |
| 670 בדיקות · 33 קבצים | `.github/workflows/ci.yml:34` (שם הצעד) | **672** | שם צעד בלבד; לא משפיע על ההרצה |
| 657 בדידות ב-32 קבצים | `WORKLOG.md:2408`, `2575`, `2591` | **672** ב-33 קבצים | ספירה היסטורית |
| ציון parity 16.7% | `WORKLOG.md:488` | **88.9%** | 16.7% = ריצה היסטורית ראשונה; 88.9% = רצפת ה-ratchet הנוכחית (נעולה 2026-11-06) |
| 12 פאנלים | `spec/01_MASTER_SPECIFICATION.md:432`, `spec/02_MASTER_WORK_PLAN.md:315`, `CUTOVER.md:56` ("12→13") | **13** — `PANELS` ב-`bindings.generated.js` וברישום המנוע זהים: THEMES, BUILDER, IMPORTS, NOTES, QUALITY, TYPO, HEADINGS, ORNAMENTS, HEADERS, TOC, GRID, EXPORT, ADVANCED | `RELEASE_NOTES.md:27` ו-`tests/e2e/s10-ui.test.js:301` נכונים; המפרט מיושן |

תיקון התיעוד הוא בבעלות סוכן 5 — כאן רק המספרים.

## 7. תצפיות פתוחות (לא באגים; ההשפעה לא נקבעה)

1. **700 מול 704 עמודים על אותו קורפוס.** נתיב Node (`tools/layout-parity/run-ours.js`, "legacy-imud-flow + font-metrics") נותן 700 עמודים, hash `legacy-3ff0bdd5f212c4a2`; הדפדפן (full-math-audit, layout-audit, האתר החי) נותן 704. כל מסלול דטרמיניסטי לעצמו וזהה בין מקומי ל-CI. אין בדיקה שמצליבה בין המסלולים, ולכן לא ידוע אם פער ה-0.57% נובע ממדידת גופנים (טבלאות מול canvas) או מהבדל לוגי.
2. **`npm test` משנה קבצים שנמצאים תחת מעקב git** — 5 קבצים ב-`red-build/tests/artifacts/`: `s12-canonical.pdf`, `s12-font-subset.json`, `s13-matrix-report.json`, `s13-perf.json`, `s53-dp-endnotes.pdf`.
   - בקבצי ה-JSON ההבדלים הם שדות זמן/ביצועים בלבד (`logs/tracked-artifact-drift.patch`).
   - ב-`s53-dp-endnotes.pdf` ההבדל מול git הוא **3 בתים**, כולם בשדה `head.checkSumAdjustment` של הגופן המוטמע (הסטים 5,213–5,215 בקובץ הגופן, 84,600 בתים; השאר זהה; שתי ריצות רצופות זהות בייט-לבייט). הערך שנוצר עכשיו (`0xb43627ff`) הוא בדיוק הערך שב-`DejaVuSans.ttf` של המכונה (חבילה 2.37-8); הערך שב-git (`0xb4625bdb`) הגיע מבניית DejaVu אחרת (אותה `fontRevision` 2.37). **מסקנה: הסחף תלוי בקובץ הגופן של המארח — לא בזמן ולא באי-דטרמיניזם של המנוע.** שני הערכים אינם תואמים לתוכן ה-subset (ה-subsetter משאיר את ערך הגופן המקורי); השפעה על רינדור לא נבדקה. `s12-canonical.pdf` משתנה גם הוא — סביר שמאותה סיבה, **לא נבדק בנפרד**.
   - **משמעות לבדיקות:** אסור להוסיף `git diff --exit-code` על התיקייה הזו, ו-golden-PDF בייט-לבייט יהיה תלוי-מארח. הצעה (בתחום סוכן 4, PR נפרד): לכתוב ל-artifacts תוצרי זמן/PDF לנתיב שאינו בעקיבה, או להשוות רק שדות יציבים.
   - ה-runner מחזיר את התיקייה למצבה (`git checkout`) אחרי הריצה ורושם את הסחף ב-`manifest.json → trackedDrift`.

## 8. מגבלות וגילוי נאות

1. **אודיט הדפדפן (full-math, layout-audit) רץ רק ב-CI.** אין לו ריצה מקומית בחבילה. ראיות ה-CI הן הלוגים ב-`ci/logs/` ומטא-דאטה של run/job/artifact ב-`ci/*.json`. את קובצי ה-artifact (zip) לא ניתן היה להוריד מהסביבה (השרת שמארח אותם חסום ברשת); לא עקפתי את החסימה. שורות הסיכום המלאות נמצאות בלוגים.
2. **האישור החזותי של המשתמש** (שער G6 — בדיקת ספר דוגמה עמוד-עמוד) לא נבדק ואינו ניתן להחלפה במדידה.
3. ה-baseline תקף ל-`6f80156` בלבד. כל commit חדש מחייב ריצה חוזרת והשוואה (§10).
4. **עבודה מוקדמת שאבדה:** בתחילת ההפעלה נכתבו בקונטיינר זמני — ללא commit וללא push — ארבעה קבצי בדיקות-יחידה אפיינות (68 בדיקות: סדר/זרימת טורים, פרוטוקול Worker, drop-word, Ledger) ותשתית Playwright. הקונטיינר אופס והם נעלמו. הם **לא שוחזרו**: לפי התוכנית המעודכנת, שחזורם ייקבע רק אחרי ניתוח פערים מול `tests/` ו-`tools/layout-audit` הקיימים (אין יעד של מספר בדיקות או אחוז כיסוי).
5. **לא נמדד:** כיסוי קוד, ביצועים מעבר לזמני הריצה שנרשמו, רינדור UI בדפדפן מקומי.
6. עובדה נוספת שנבדקה בשלב קודם ואינה מגובה בקובץ בחבילה: חבילות `app.bundle.js` ו-`engine-worker.bundle.js` באתר החי זהות (לפי git blob SHA) לאלה שב-`main`. טביעות ה-sha256 של החבילות ב-`main` רשומות ב-`manifest.json → inputs[]`.

## 9. שחזור

```bash
git checkout 6f80156                                   # או ענף שמבוסס עליו
cd red-build && CI=true npm test                       # 34 פקודות · 672 בדיקות
cd .. && node tools/baseline/run-baseline.js --parity  # הכול + דטרמיניזם + parity + הקורפוס הארוך → audits/baseline/<sha7>/
node tools/baseline/compare-with-ci.js audits/baseline/6f80156   # מקומי ↔ CI, מתוך ci/logs/
```

דרישות: Node ‏≥ 18, `poppler-utils` (‏`pdfinfo`, `pdftotext`), `fonts-dejavu-core`; לצנרת ה-parity גם Python 3 עם `pymupdf`. אפשרויות: `--out <dir>` · `--keep-artifacts` (לא לשחזר את `tests/artifacts`) · `--skip-suite`. ה-runner אינו משנה קוד מנוע, ומחזיר את עץ ה-git למצבו אלא אם ביקשו אחרת.

## 10. מטריצת אימות אחרי כל תיקון מנוע

אחרי כל commit שמשנה את המנוע (סוכן 2) — `run-baseline.js --parity` על ה-commit החדש והשוואה לחבילה זו:

| קריטריון | תנאי |
|---|---|
| סוויטה | 0 נכשלו · 0 דולגו · מספר הבדיקות ≥ 672 (בדיקות חדשות מוסיפות; אין הסרה בלי נימוק מתועד) |
| דטרמיניזם | hash קנוני זהה לריצה הקודמת **או** שינוי מכוון עם הסבר אילו עמודים השתנו; שתי ריצות בתהליכים נפרדים זהות |
| parity | HARD 4/4 · ציון ≥ 88.9% · כל בדיקת PARITY חדשה שעוברת מעלה את ה-ratchet באותו PR |
| קורפוס ארוך | C1–C12 עוברים · מילים במקור = מילים בפלט |
| דפדפן (CI) | 0 בעיות · דטרמיניזם IDENTICAL |
| תיקון באג | בדיקת שחזור שנכשלת על הקוד הישן ועוברת על החדש + בקרה שלילית (negative control) |

## 11. מסירה לסוכנים אחרים (לפי תבנית 1.4)

- **סוכן 2 (כלי דיבוג + תיקוני מנוע):** נתוני P6/P7 המדויקים (§5), hash קנוני `80f9ed6c82ea3855…`, ו-runner שמריץ את המטריצה (§9–§10). **ממתין לו מסוכן 4:** fixture קטן ובדיקת תוכן מלאה לשחזור "לשון"/"הפוסקים" — טרם נמסר.
- **סוכן 5 (תיעוד ומהדורה):** רשימת סתירות התיעוד (§6), התצפיות הפתוחות (§7), והמלצה לא לכתוב "N בדיקות" בטקסט חופשי אלא להפנות ל-`audits/baseline/<sha7>/manifest.json` (מקור אמת מכונתי).
- **סוכנים 1 ו-3 (ממשק; גופנים/ביצועים):** אין תלות מחסומה. נתוני זמן הריצה (§4) ופער 700/704 (§7.1) זמינים למדידות שלהם; שום שינוי בקבצים שלהם לא נעשה כאן.
- **החלטות בעלים:** אין החלטה הנדרשת מהמשתמש לשלב זה. (שער G6, האישור החזותי, יידרש רק לקראת מהדורה.)
