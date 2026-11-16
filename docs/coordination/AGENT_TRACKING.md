# טבלת מעקב — חמשת הסוכנים (תוכנית RED v2.0)

> **בעלים:** סוכן 5 · **נכון ל:** 15.11.2026 · **בסיס:** `main` @ `de92fa0` (התקדם מ־`6f80156`: מוזגו #34, #35, #36, #37, #39, #40, #41, #42, #43, #44, #46)
> **מקורות:** תוכנית האב `spec/תכנית לשיפור תוכנת עימוד Red.MD` (§9–§10) · מסמך ההפעלה `spec/תוכנית הפעלה לחמשת הסוכנים.md` (§1.4, §6–§7) · תוצרי הסוכנים ב־PRs.
> **כללים:** DONE רק עם קישור לראיה. המסמך נערך רק על ידי סוכן 5. נתוני ה־PRs, ה־CI, המיזוגים והחפיפות **מחושבים** מ־API של GitHub (קריאה) ומ־git בעת יצירת המסמך. את בדיקת הרגרסיה `heading-rollback.test.js` הרצתי בעצמי על `main`; את שאר התוצאות לא הרצתי.

## 1. מצב הבסיס

| פריט | ממצא | ראיה |
|---|---|---|
| `main` | `de92fa0` — קוד המנוע השתנה בשלוש שורות בלבד, ב־`engine/layout/legacy-imud-flow.js` (תיקון #43); רישום ההגדרות, פרוטוקול ה־Worker ו־`pipeline.js` לא השתנו. ה־UI עודכן ב־#40–#42; מוזגו גם תוצרי המדידה והאבחון (`audits/baseline/`, `docs/perf/`, `docs/reports/agent-2/`) | `git diff 510c9d6 origin/main -- red-build/src/engine` |
| CI על `main` | הצליחו: layout-audit, layout-parity, local, test (18), test (20), test (22), very-long-corpus · **נכשל: live** | API (check-runs של ה־head) |
| ענפים ב־remote | `docs/reference-intent-clarification`, `feature/agent-1`, `feature/agent-1-ui-orange`, `feature/agent-1-ui-orange-asset-notice`, `feature/agent-1-ui-orange-input-integrity`, `feature/agent-1-ui-orange-run-summary`, `feature/agent-2-debug-gold`, `feature/agent-3-font-prefetch`, `feature/agent-3-font-yellow`, `feature/agent-4-heading-rollback-regress`, `feature/agent-4-impact-matrix`, `feature/agent-4-source-families`, `feature/agent-4-testing-green`, `feature/agent-5-docs-release`, `feature/agent-5-governance-1115`, `feature/agent-5-open-questions`, `feature/agent-5-sync-1115`, `gh-pages`, `main`, `plan/engine-first-roadmap-v2`, `plan/five-agent-work-allocation`, `work/engine-heading-rollback`, `work/engine-paren-note-flags` | `git ls-remote --heads origin` |
| ענף ללא PR | `feature/agent-1` · `feature/agent-1-ui-orange` · `feature/agent-1-ui-orange-asset-notice` · `feature/agent-1-ui-orange-input-integrity` · `feature/agent-1-ui-orange-run-summary` · `feature/agent-2-debug-gold` · `feature/agent-3-font-yellow` · `feature/agent-4-heading-rollback-regress` · `feature/agent-4-source-families` · `feature/agent-4-testing-green` · `work/engine-heading-rollback` | — |
| חפיפת קבצים בין ה־PRs הפתוחים | #33 × #38: `red-build/package.json`; #33 × #50: `red-build/package.json`; #33 × #52: `ISSUE_REGISTRY.md`, `WORKLOG.md`; #38 × #50: `red-build/package.json` | חישוב `git diff --name-only origin/main...<ענף>` |

| PR פתוח | ענף @ head | כותרת | קומיטים · קבצים | קבצים של ה־PR עצמו | CI על ה־head | מצב מיזוג |
|---|---|---|---|---|---|---|
| #33 | `docs/reference-intent-clarification` @ `565db1a` | docs/test: clarify historical PDF reference and acceptance gates | 53 · 32 קבצים (+1685 −394) · `full-math-audit.yml`, `layout-parity.yml`, `CUTOVER.md`, `DECISIONS.md` … | בריצה 7 · דולגו 1 | CI לא ירוק |
| #38 | `feature/agent-3-font-prefetch` @ `f908416` | טיוטה — Agent 3: שליפה מקדימה של גופני העלייה (טעינה ראשונה מארוח מרוחק: גופנים מוכנים | 2 · 4 קבצים (+191 −1) · `package.json`, `font-prefetch.test.js`, `font-prefetch.js`, `index.html` | הצליחו 7 · דולגו 1 | נקי |
| #47 | `feature/agent-5-open-questions` @ `d1ed41e` | docs(open-questions): המלצות סוכן 5 להכרעת מנהל הפרויקט — מעבר לתוכנית v2.0 (ש | 2 · 1 קבצים (+22 −0) · `OPEN_QUESTIONS.md` | בריצה 7 · דולגו 1 | CI לא ירוק |
| #48 | `work/engine-paren-note-flags` @ `37a1fcb` | תיקון מנוע (legacy-imud): R-03 — דגלי סוגריים של מילה עם סמן הערה מודבק (דליפת | 1 · 4 קבצים (+64 −10) · `legacy-imud-flow.js`, `source-families.test.js`, `app.bundle.js`, `engine-worker.bundle.js` | הצליחו 7 · דולגו 1 | נקי |
| #50 | `feature/agent-4-impact-matrix` @ `2929f42` | tools(baseline): impact.js — השוואת השפעה של תיקון מנוע (base מול מועמד) + 16  | 1 · 5 קבצים (+465 −2) · `package.json`, `impact-tool.test.js`, `source-oracle.js`, `README.md` … | הצליחו 7 · דולגו 1 | נקי |
| #51 | `feature/agent-5-sync-1115` @ `0ddc8db` | docs(coordination): ריענון אחרי המיזוגים — G1/R-01 תוקן, רישום CP-1 ותגובת סוכ | 1 · 4 קבצים (+117 −109) · `API.md`, `ARCHITECTURE.md`, `AGENT_TRACKING.md`, `SOURCE_OF_TRUTH_MAP.md` | הצליחו 7 · דולגו 1 | נקי |
| #52 | `feature/agent-5-governance-1115` @ `d49bbfa` | docs(governance): תיקון אבחנת "לשון/הפוסקים" וסגירתה (R-01), סנכרון מפת התלויו | 1 · 3 קבצים (+100 −1) · `ISSUE_REGISTRY.md`, `LAYOUT_DEPENDENCY_MAP.md`, `WORKLOG.md` | הצליחו 1 · בריצה 6 · דולגו 1 | CI לא ירוק |

מוזגו מאז הבסיס `6f80156`:

| PR | ענף | מוזג ב־ |
|---|---|---|
| #34 | `feature/agent-3-font-yellow` | 14.11 17:39 |
| #35 | `feature/agent-2-debug-gold` | 14.11 17:39 |
| #36 | `feature/agent-4-testing-green` | 14.11 17:38 |
| #37 | `feature/agent-4-heading-rollback-regress` | 14.11 22:55 |
| #39 | `feature/agent-1-ui-orange` | 12.11 22:05 |
| #40 | `feature/agent-1-ui-orange-run-summary` | 12.11 22:05 |
| #41 | `feature/agent-1-ui-orange-input-integrity` | 12.11 22:08 |
| #42 | `feature/agent-1-ui-orange-asset-notice` | 12.11 22:11 |
| #43 | `work/engine-heading-rollback` | 15.11 09:06 |
| #44 | `feature/agent-4-source-families` | 15.11 09:11 |
| #46 | `feature/agent-5-docs-release` | 14.11 17:39 |

## 2. טבלת המעקב

| סוכן / תפקיד | PRs | משימה | תלות | בדיקות (לפי הדוחות) | חסימה | סטטוס |
|---|---|---|---|---|---|---|
| 1 — UI ותפעול | #39–#42 — **מוזגו** (12.11) | ביקורת תפעולית של ה־UI הקיים ותיקוני UI ממוקדים: תצוגת זהות ריצה, שלמות קלט והגדרות (כולל פענוח TXT), הודעת כשל טעינת נכסים; ללא Orange | אישור CP-1 כצרכן trace/ledger (סעיף 6) | CI ירוק בכל ה־PRs; **לא נבדק בדפדפן אמיתי** | אין | **DONE (מוזג)** |
| 2 — מנוע ואבחון | #35 (דוחות) ו־#43 (תיקון) **מוזגו**; #48 פתוח (הועבר ל־main, CI ירוק) | מפת pipeline; פערי אבחון מול Gold V21; שורש ותיקון "לשון/הפוסקים"; הצעת חוזה CP-1 (A–E); `debug/` הוסר (אסור בתוכנית) והדוחות ב־`docs/reports/agent-2/` | #48 משנה פריסה ⇒ מטריצת אימות מלאה של סוכן 4 (הכלי `impact.js` ב־#50); baseline v2 | R-01 נעול ב־`heading-rollback.test.js` — **13/13 עברו, הורץ על `main`@`de92fa0`** — ובבדיקות `source-families`; CI על main ירוק (חוץ מ־`live`) | אין | R-01 FIXED · #48 IN REVIEW |
| 3 — גופנים וביצועים | #38 — #34 **מוזג**; #38 טיוטה | מדידה (ביצועים, עלייה בדפדפן, ראיות WOFF2) ← אופטימיזציה אחת: שליפה מקבילית של 12 גופני עלייה (#38; −44–45% ב"גופנים מוכנים" בהדמיה); FontLoader/IndexedDB/core-extended — DEFERRED. המלצות סוכן 3 (D1–D5) נמצאות בענף `feature/agent-3-font-yellow` ובתגובה ב־#34 — לא ב־`main` | הכרעת בעלים על WOFF2; #38 מתנגש עם main (`package.json`, `index.html`, חבילות) | הכלי רץ ×3, דטרמיניזם 3/3; עלייה: HeadlessChrome מול שרת מדמה־מארח (**הדמיה**, לא GitHub Pages) | אין (נדרשת הכרעה) | #34 DONE · #38 טיוטה |
| 4 — בדיקות ואימות | #36, #37, #44 **מוזגו**; #50 פתוח (כלי `impact.js`) | G0 baseline על `6f80156`; בדיקות רגרסיה strict-xfail ואורקל מקור→פלט (R-01 FIXED); **R-02 בוטל** על ידי סוכן 4 (התנהגות מכוונת של המקור, S4.9); R-03 — תיקון מוצע ב־#48; **R-04 "הערת רפאים"** — ממצא מצומצם פתוח: מועמד תיקון ראשון (בעותק ניסיוני) עבר `npm test` אך פגע בהערות חוקיות (836→838 עמ'; 46 צמדי עמוד×הערה חסרים) — נתפס רק בהשוואה ידנית, ולכן נוצר `tools/baseline/impact.js` (#50) | baseline v2 אחרי מיזוג #33; #50 נוגע ב־`package.json` | 672 בדיקות · 33 קבצים · 0 כשלים על `6f80156` (G0); CI על main ירוק (חוץ מ־`live`) | אין | G0 DONE · R-03/R-04 פתוחים |
| 5 — תיעוד ואינטגרציה | #46 **מוזג** · #47 פתוח (המלצות ב־`OPEN_QUESTIONS.md`) · ריענון זה — #51 · ממשל — #52 | טבלת מעקב, מפת מקורות אמת וסתירות, מראות קוד; רישום חוזים; סנכרון מפת התלויות | מיזוג #33 (עדכוני DECISIONS ו־WORKLOG מקבילים) | בדיקת קישורים/נתיבים/מודולים: 0 בעיות; הרצתי בעצמי את `heading-rollback.test.js` | אין | IN PROGRESS |

דיווחי מסירה בתבנית §1.4 מופיעים כסעיפים בדוחות הסוכנים (`BASELINE.md` §11, `BROWSER_BOOT_REPORT.md` §5, `BUG_REPORT_heading-rollback-fallthrough.md` §6).

## 3. שערי קבלה G0–G7

| שער | מצב | ראיה / הערה | בעלים |
|---|---|---|---|
| G0 — Baseline | **DONE (מוזג #36)** | 672 בדיקות · 33 קבצים · 0 כשלים · 0 דילוגים; זהה ב־CI; hash קנוני `80f9ed6c82ea3855…` (36 עמודים); אודיט דפדפן ב־CI 704/704 עמודים. נמדד על `6f80156`, **לפני** #33 — נדרש baseline v2 אחרי המיזוג | סוכן 4 |
| G1 — Content | **PARTIAL — R-01 תוקן; R-03 ו־R-04 פתוחים** | **R-01** (אובדן "לשון/הפוסקים"): שורש — `continue` חסר אחרי `rollbackTrailingHeadings()` ב־`legacy-imud-flow.js`; תוקן ב־#43 (מוזג 15.11 09:06), נעול ב־#37 ו־#44, `heading-rollback.test.js` 13/13 (הורץ על main). האבחנה הישנה ב־ISSUE_REGISTRY ("הערות־ענק") שגויה (DOC-19). **R-02** בוטל. **R-03** (דגלי סוגריים של מילה עם סמן הערה) — תיקון ב־#48, לא מוזג, משנה פריסה. **R-04** — פתוח | סוכנים 2+4 |
| G2 — Layout | OPEN (אבחוני) | נוסח #33 (העדכני, לא מוזג): שימור תוכן, סדר קריאה, גיאומטריה ודרישות פריסה עומדים בבדיקות; פערי legacy P6/P7 מסווגים בלבד (D-98). נמדד על `6f80156`: HARD 4/4 · מרחק היסטורי 88.9% (12/14) | סוכן 2 |
| G3 — Causality | PARTIAL | ל־RED כבר: 43 סוגי ממצא, EventLog עם checkpoints, Ledger עם 10 מצבי חיים. פערים אמיתיים (סוכן 2): snapshot/diff, אירוע `cp3` וקישור ממצא←טוקן, מיפוי 7 קטגוריות. **CP-1 — הצעת חוזה תוספתית מחכה לאישורי סוכנים 1, 4, 5** (סעיף 6) | סוכן 2 |
| G4 — Determinism | **MEASURED** | hash קנוני זהה בסקריפט הרשמי ובשתי ריצות; מקומי = CI; דפדפן IDENTICAL. CI על main ירוק (חוץ מ־`live`) | סוכן 4 |
| G5 — Performance | **BASELINE (מוזג) + אופטימיזציה מוצעת (#38)** | אין צוואר בקבוק CPU בנתיב הגופנים; שליפה מקבילית ב־#38 מקצרת "גופנים מוכנים" ב־44–45% בהדמיית אירוח (לא ב־Pages). FontLoader/IndexedDB לא מוצדקים (DEFERRED) | סוכן 3 |
| G6 — User acceptance | PENDING (בעל הפרויקט) | `CUTOVER.md` — טקס האישור החזותי; לא בוצע | בעל הפרויקט |
| G7 — Release | BLOCKED | רישוי לא הוכרע (`UNLICENSED`, `private`); גרסה לא הוכרעה; G1 חלקי; ממצא WOFF2/PDF (R-7). אין להכריז v1.0.0 | בעל הפרויקט + סוכן 5 |

## 4. חפיפות וסיכוני שילוב (פתוחים)

| # | נושא | סוכנים | ראיה | המלצה (להכרעה) |
|---|---|---|---|---|
| O-1 | חבילות הדפדפן נשמרות ב־git וכוללות את המנוע; בדיקה משווה אותן ביט־לביט לבנייה חדשה. בין ה־PRs הפתוחים: `app.bundle.js` ב־#48; `engine-worker.bundle.js` ב־#48 | 2, 3 | חישוב קבצי ה־PRs | בנייה מחדש (`node tools/build-worker-bundle.js`) כצעד אחרון אחרי rebase על main; מיזוג PR אחד בכל פעם |
| O-9 | `red-build/package.json` (שרשרת `scripts.test`) נערך ב־#33, #38, #50 — כל אחד מוסיף בדיקה לאותה שורה | 2, 3, בעלים | חישוב קבצי ה־PRs | מיזוג עוקב, rebase לכל PR |
| O-10 | `red-build/ui/index.html` נערך ב־#38 (גם מקום מחרוזות `?v=`) | 3 | חישוב קבצי ה־PRs | rebase אחרי כל PR שמעדכן גרסת נכסים |
| O-3 | `tools/**`: נוספו `tools/perf/` (סוכן 3) ו־`tools/baseline/` (סוכן 4); כלי הבנייה ללא בעלים בתוכנית | 2, 3, 4 | #34, #36 | להגדיר בעלים לכלי הבנייה (`OPEN_QUESTIONS.md` שאלה 17) |
| O-4 | חוזה Worker/תוצאה: `worker-protocol.js` תחת `src/ui/**` אך מסריאל תוצאות מנוע | 1, 2, 4 | רישום חוזים (§6) | בעלים: סוכן 2; צרכן: סוכן 1 |
| O-5 | פריסת Pages: `deploy-pages.yml` בבעלות סוכן 4, אך הנוהל ידני (`SESSION_HANDOFF.md`) | 4, בעלים | `.github/workflows/deploy-pages.yml` | להכריע מי מפרסם (שאלה 18) |
| O-7 | WORKLOG / ISSUE_REGISTRY / DECISIONS — כותב יחיד: סוכן 5; #33 עורך אותם במקביל | כולם | תוכנית §9.2; מסמך ההפעלה §7 | עדכון בקבצים שאינם נערכים ב־#33 (ISSUE_REGISTRY, LAYOUT_DEPENDENCY_MAP); DECISIONS — אחרי #33 |
| R-1 | baseline (G0) מתייחס ל־`6f80156`: מאז השתנו המנוע (#43), ה־UI והמדיניות (#33, לא מוזג) | 2, 4 | `BASELINE.md` §0 | baseline v2 אחרי מיזוג #33 (שאלה 12) |
| R-2 | הקורפוס הישן `audits/very_long_test_text.txt` נפסל ב־D-100; ב־#33 אינו ברירת המחדל של full-math | 4 | DOC-17 | baseline v2 על קורפוס תקין |
| R-3 | parity/P6/P7 הוא אבחון היסטורי לפי #33 (D-98), אך ב־main עדיין נאכף ratchet | 2, 4 | DOC-16 | ההבהרה הועברה לסוכנים |
| R-4 | `npm test` משנה 5 קבצים תחת מעקב git ב־`red-build/tests/artifacts/` | 4 | `BASELINE.md` §7.2 | PR נפרד בתחום סוכן 4 |
| R-5 | אותו קורפוס: 700 עמודים בנתיב Node מול 704 בדפדפן | 2, 4 | `BASELINE.md` §7.1 | לסווג (תצפית פתוחה) |
| R-6 | ה־UI לא נבדק בדפדפן אמיתי — אין להסיק מהדוח "קבלת משתמש" | 1 | `UI_OPERATIONAL_AUDIT.md` | בדיקה ידנית (G6) או Playwright (שאלה 22) |
| R-7 | **WOFF2:** 75% ממשפחות הבחירה (1,289 מתוך 1,721) הן WOFF2 בלבד — לא נמדדות ולא מוטמעות ב־PDF; המרה מכפילה נפח, 25% CFF, 29% בלי עברית | 1, 2, 3 | `docs/perf/WOFF2_EVIDENCE.md` | הכרעת בעלים (שאלה 13) |
| R-9 | **#33: CI אדום והתנגשות עם main.** `test (20)`/`test (22)` נכשלו בשלב "Run full test suite" ו־`very-long-corpus` בשלב "Corpus invariants + informational alignment metric" (נקרא ב־API; הסיבה לא נבדקה) | בעלים, 4 | API: check-runs של ה־head | rebase ובדיקת הכשל לפני מיזוג |
| R-11 | **ה־job `live` נכשל על `main`** בשלב "Full math audit — LIVE site" (נקרא ב־API; הסיבה לא נבדקה). ייתכן קשר לכך שפריסת Pages ידנית ולא עודכנה אחרי מיזוג חבילות חדשות (O-5) | 4, בעלים | check-runs של `main` | לבדוק את הסיבה לפני ההפרסום הבא |
| R-12 | **#48 משנה פריסה** (`legacy-imud-flow.js` +21 −3) — משנה את ה־hash הקנוני ואת ה־baseline | 2, 4 | תיאור #48 | מטריצת אימות מלאה של סוכן 4 לפני מיזוג; baseline v2 אחריו |

נסגרו מאז הדוח הקודם: **R-10** (#48 הועבר ל־main, CI ירוק; #49 נסגר); **R-8** (קלט Windows-1255 — תוקן ב־#41); **O-6** (דוחות: סוכן 2 העביר ל־`docs/reports/agent-2/` והסיר את `debug/` — נשארים `docs/perf/` ו־`audits/baseline/`); **O-1** (חפיפת חבילות — נפתרה במיזוגי #39–#44 עם בנייה מחדש).

## 5. סדר מיזוג מומלץ לפתוחים (תוכנית §9.5, בתוספת הראיות)

חפיפת קבצים ישירה בין ה־PRs הפתוחים: **#33 × #38: `red-build/package.json`; #33 × #50: `red-build/package.json`; #33 × #52: `ISSUE_REGISTRY.md`, `WORKLOG.md`; #38 × #50: `red-build/package.json`**.
1. **#47** (המלצות סוכן 5 ב־`OPEN_QUESTIONS.md`) — מסמך בלבד; בטוח בכל זמן.
2. **#33** (בעלים) — rebase וטיפול ב־CI האדום (R-9); קודם ל־baseline v2 ולכל שינוי פריסה.
3. **baseline v2** (סוכן 4) אחרי #33.
4. **#50** (כלי `impact.js` + 16 בדיקות; כלים ובדיקות בלבד) — אחרי #33, כי שניהם עורכים את שורת `test` ב־`package.json`.
5. **#48** (תיקון R-03, משנה פריסה; CI ירוק) — אחרי baseline v2 ומטריצת אימות של סוכן 4 (בעזרת `impact.js`).
6. **#38** (טיוטה — שליפה מקדימה) — rebase על main; מדידה ב־GitHub Pages אמיתי; אחרי #48 (אותה שורת `test`, חבילות, `index.html`).
7. **תיעוד (סוכן 5):** PR הסגירה (README, הערות מהדורה) — רק אחרי G0–G6 ואישור בעלים.

## 6. רישום חוזים

| חוזה | מקור האמת בקוד | גרסה | בעלים מוצע | צרכנים | בדיקות |
|---|---|---|---|---|---|
| פרוטוקול Worker | `red-build/src/ui/worker-protocol.js` | v1 (+v1.1) | סוכן 2 (צד מנוע) — להכרעה | UI | `tests/e2e/s10-ui.test.js` |
| סכמת תוצאה ל־UI | `serializeTypesetResult` | `ui-result-v1` | סוכן 2 — להכרעה | UI | s10-ui |
| Ledger / trace / דוח | `core/ledger.js`, `core/events.js`, `audit/report-schema.js` | schema v2 / trace-v2 | סוכן 2 | UI, בדיקות | e2e, canonical |
| רישום הגדרות | `core/settings-registry.js` | `settings_version` | סוכן 2 | UI, ייצוא | `tests/integration/registry.test.js` |
| פרויקט ZIP והגירה | `output/project-io.js` | settings v2 | סוכן 2 | UI, ייצוא | s12-export |
| חבילת הרחבות | `extensions/extensions-io.js` | `tora-typesetter-extensions` v1 | סוכן 2 | UI | s11-extensions |

**בקשת שינוי חוזה פתוחה — CP-1** (`docs/reports/agent-2/proposals/CONTRACT_PROPOSAL_diagnostics.md`, סוכן 2, מוזגה ב־#35): תוספת אבחון סיבתית, אופציונלית וללא שינוי hash — **A** בדיקת עקביות "כל טוקן כותרת נפלט פעם אחת" (סוג ממצא `heading-emission`), **B** שדה `tokenId` ב־issue, **C** תווית `cp3`, **D** מיפוי סיבתיות כשדה `causality`, **E** snapshots opt-in. נדרשים אישורי סוכנים 1, 4, 5. **תגובת סוכן 5 (תיעוד/חוזה): מאשר A–E כהצעה תוספתית, בתנאים:** (1) גרסת סכימה מפורשת ב־`toSchemaV2`/`report-schema`; (2) לכל סוג/שדה חדש בדיקת חוזה ו־negative control (סוכן 4), כפי שנקבע בתנאי הקבלה של ההצעה; (3) השדות החדשים אופציונליים ב־`ui-result-v1`, ללא שינוי ב־`worker-protocol.js` (שימור תאימות ל־UI שמוזג); (4) `docs/API.md` §1/§3 ו־`docs/ARCHITECTURE.md` (ציון `cp3`) מתעדכנים באותו PR או מיד אחריו; (5) E כבוי כברירת מחדל ועלותו נמדדת ומדווחת; (6) סדר: A ראשון — עצמאי ומכסה פער מוכח (בדיקת המילים אינה תופסת השחתת כותרת). אישורי סוכנים 1 ו־4 — טרם התקבלו.

## 7. תבנית דיווח מסירה (מסמך ההפעלה §1.4)

```text
Agent / מזהה משימה:
ענף ו-HEAD:
Commit בסיס:
מטרת העבודה:
קבצים שהשתנו / מתוכננים להשתנות:
מה נבדק ומה התוצאה:
קישורי artifacts / Actions / PR:
מה נותר פתוח:
תלות בסוכן אחר / חסימה:
החלטה נדרשת מבעל הפרויקט (אם יש):
```

## 8. החלטות הנדרשות מבעל הפרויקט

> הנוסח לבחינה, עם המלצת סוכן 5 לכל סעיף, נמצא ב־`OPEN_QUESTIONS.md` (שאלות 11–23, PR 47). להלן תקציר, ובתוספת ההחלטות שנוספו מאז:

1. **#33** — rebase וטיפול ב־CI האדום; baseline v2 אחריו (שאלות 11, 12).
2. **WOFF2 והטמעת PDF** (שאלה 13) · **רישוי וגרסה** (14) · **README והמסמכים ההיסטוריים** (15) · **שאלות 1, 2, 4–8 הישנות** (16).
3. **בעלות על כלי הבנייה** (17) · **פריסת Pages**, כולל הכשל ב־`live` (18, R-11).
4. **D-97 המדולג** (20) · **מחולל SETTINGS** (21) · **בדיקה בדפדפן אמיתי** (22) · **#38** (23).
5. **חדש — #48 ו־#50:** מועד המיזוג של תיקון שמשנה פריסה (R-12) ואישור הכלי `impact.js`.
6. **חדש — CP-1:** אישורי סוכנים 1 ו־4 להצעת החוזה (סעיף 6).
7. **חדש — המלצות סוכן 3 (D1–D5):** הקובץ `docs/perf/AGENT3_RECOMMENDATIONS.md` נמצא בענף `feature/agent-3-font-yellow` ואינו ב־`main`; להכריע אם למזג אותו.
