# טבלת מעקב — חמשת הסוכנים (תוכנית RED v2.0)

> **בעלים:** סוכן 5 · **נכון ל:** 12.11.2026 · **בסיס:** `main` @ `a0f753d` (התקדם מ־`6f80156`: מוזגו #39, #40, #41, #42)
> **מקורות:** תוכנית האב `spec/תכנית לשיפור תוכנת עימוד Red.MD` (§9–§10) · מסמך ההפעלה `spec/תוכנית הפעלה לחמשת הסוכנים.md` (§1.4, §6–§7) · תוצרי הסוכנים ב־PRs.
> **כללים:** DONE רק עם קישור לראיה. המסמך נערך רק על ידי סוכן 5. נתוני ה־PRs, ה־CI, מצב המיזוג והחפיפות **מחושבים** מ־API של GitHub (קריאה) ומ־git בעת יצירת המסמך; לא הורצה כאן אף בדיקה של סוכן אחר.

## 1. מצב הבסיס

| פריט | ממצא | ראיה |
|---|---|---|
| `main` | `a0f753d` — קוד המנוע זהה ל־`510c9d6`; נרשם רק שינוי UI (#39, #40, #41, #42 של סוכן 1, 12.11): `app-shell`, `settings-panel`, `status-strip`, `testing-tab`, `browser-entry`, מודולים חדשים `run-info`, `text-decode`, `boot-failure`, והחבילה `app.bundle.js`. רישום ההגדרות ופרוטוקול ה־Worker לא השתנו | `git log 6f80156..origin/main`, `git diff` |
| ענפים ב־remote | `docs/reference-intent-clarification`, `feature/agent-1`, `feature/agent-1-ui-orange`, `feature/agent-1-ui-orange-asset-notice`, `feature/agent-1-ui-orange-input-integrity`, `feature/agent-1-ui-orange-run-summary`, `feature/agent-2-debug-gold`, `feature/agent-3-font-prefetch`, `feature/agent-3-font-yellow`, `feature/agent-4-heading-rollback-regress`, `feature/agent-4-source-families`, `feature/agent-4-testing-green`, `feature/agent-5-docs-release`, `gh-pages`, `main`, `plan/engine-first-roadmap-v2`, `plan/five-agent-work-allocation`, `work/engine-heading-rollback` | `git ls-remote --heads origin` |
| PRs פתוחים | #33, #34, #35, #36, #37, #38, #43, #44, #46 (9) (כולם מחשבון בעל הפרויקט; זהות הסוכן נלמדת משם הענף) | API (קריאה) |
| ענף ללא PR | `feature/agent-1` · `feature/agent-1-ui-orange` · `feature/agent-1-ui-orange-asset-notice` · `feature/agent-1-ui-orange-input-integrity` · `feature/agent-1-ui-orange-run-summary` | — |
| חפיפת קבצים בין PRs שאינם מוערמים זה על זה | #33 × #37: `red-build/package.json`; #33 × #38: `red-build/package.json`; #33 × #43: `red-build/package.json`; #33 × #44: `red-build/package.json`; #37 × #38: `red-build/package.json`; #38 × #43: `red-build/package.json`; #38 × #44: `red-build/package.json`; #43 × #44: `.github/workflows/ci.yml`, `red-build/package.json`, `red-build/tests/fixtures/regress/README.md` … | חישוב `git diff --name-only origin/main...<ענף>` |

| PR | ענף @ head | כותרת | קומיטים · קבצים | קבצים של ה־PR עצמו | CI על ה־head | מצב מיזוג |
|---|---|---|---|---|---|---|
| #33 | `docs/reference-intent-clarification` @ `1723fb0` | docs/test: clarify historical PDF reference and acceptance gates | 50 · 24 קבצים (+902 −273) · `full-math-audit.yml`, `layout-parity.yml`, `CUTOVER.md`, `DECISIONS.md` … | הצליחו 3 · נכשלו 3 · בוטלו 1 · דולגו 1 (test (20), test (22), very-long-corpus) | התנגשות |
| #34 | `feature/agent-3-font-yellow` @ `08e1359` | Agent 3: דוח מדידת ביצועים ומסלול גופנים (בסיס, קריאה בלבד) | 3 · 9 קבצים (+3369 −0) · `BROWSER_BOOT_REPORT.md`, `PERFORMANCE_BASELINE.md`, `WOFF2_EVIDENCE.md`, `baseline-6f80156.json` … | הצליחו 7 · דולגו 1 | נקי |
| #35 | `feature/agent-2-debug-gold` @ `9a4a938` | סוכן 2: דוחות משימת פתיחה — מפת pipeline, gap analysis, שורש אובדן הכותרות, הצ | 3 · 7 קבצים (+359 −0) · `BUG_REPORT_heading-rollback-fallthrough.md`, `DIAGNOSTICS_GAP_ANALYSIS.md`, `PIPELINE_AND_MODULE_MAP.md`, `CONTRACT_PROPOSAL_diagnostics.md` … | הצליחו 7 · דולגו 1 | נקי |
| #36 | `feature/agent-4-testing-green` @ `641e3b5` | test(baseline): G0 — baseline מזוהה וניתן לשחזור על main@6f80156 (סוכן 4) | 2 · 68 קבצים (+5030 −0) · `BASELINE.md`, `artifacts-42750909721.json`, `artifacts-42750910040.json`, `artifacts-42750910119.json` … | הצליחו 7 · דולגו 1 | נקי |
| #37 | `feature/agent-4-heading-rollback-regress` @ `86acff3` | test(regress): R-01 — שחזור אובדן "לשון/הפוסקים" (strict xfail) + מפקד כותרות  | 1 · 6 קבצים (+273 −0) · `ci.yml`, `package.json`, `README.md`, `heading-rollback-control.txt` … | הצליחו 7 · דולגו 1 | נקי |
| #38 | `feature/agent-3-font-prefetch` @ `7b5411b` | טיוטה — Agent 3: שליפה מקדימה של גופני העלייה (טעינה ראשונה מארוח מרוחק: גופנים מוכנים | 1 · 4 קבצים (+191 −1) · `package.json`, `font-prefetch.test.js`, `font-prefetch.js`, `index.html` | הצליחו 7 · דולגו 1 | התנגשות |
| #43 | `work/engine-heading-rollback` @ `67b6510` | תיקון מנוע (legacy-imud): rollback כותרות inline בסוף טור — אובדן/כפילות כותרו | 2 · 5 קבצים (+11 −9) · `legacy-imud-flow.js`, `s62-user-questions.test.js`, `heading-rollback.test.js`, `app.bundle.js` … | הצליחו 7 · דולגו 1 — על אותו commit, דרך PR מקביל | נקי |
| #44 | `feature/agent-4-source-families` @ `fe6ed6f` | test(regress): אורקל מקור→פלט + משפחות R-01 / R-02 / R-03 (strict xfail; מוערם | 1 · 10 קבצים (+1013 −1) · `package.json`, `README.md`, `note-duplicate-control.txt`, `note-duplicate-parity-control.txt` … | לא רץ (בסיס ≠ main) | נקי |
| #46 | `feature/agent-5-docs-release` @ `6fe6156` | docs(coordination): טבלת מעקב חמשת הסוכנים, מפת מקורות אמת וסתירות תיעוד, ומרא | 7 · 8 קבצים (+1128 −0) · `API.md`, `ARCHITECTURE.md`, `README.md`, `SETTINGS.md` … | בריצה 7 · דולגו 1 | CI לא ירוק |

PRs מוערמים (הבסיס שלהם אינו `main`) אינם מריצים CI, כי ה־workflows מופעלים על PRs ל־`main` בלבד.

## 2. טבלת המעקב

| סוכן / תפקיד | ענפים ו־PRs | commit בסיס | משימה | תלות | בדיקות (לפי הדוחות) | חסימה | סטטוס |
|---|---|---|---|---|---|---|---|
| 1 — UI ותפעול | PRs  (`feature/agent-1-ui-orange*`) — **מוזגו ל־main** ב־12.11 (22:05–22:11); הענף הישן `feature/agent-1` הוחלף | `6f80156` | ביקורת תפעולית של ה־UI הקיים (מסמך), ותיקוני UI ממוקדים: תצוגת זהות ריצה, שלמות קלט והגדרות (כולל פענוח TXT), הודעת כשל טעינת נכסים; ללא Orange | — | סוויטות ה־UI ירוקות לפני/אחרי (לפי הדוחות); probe ו־smoke ב־jsdom; **לא נבדק בדפדפן אמיתי** | אין | **DONE (מוזג)** — אימות בדפדפן אמיתי עדיין חסר (R-6) |
| 2 — מנוע ואבחון | PRs #35, #43 (`feature/agent-2-debug-gold`, `work/engine-heading-rollback`) | `6f80156` | מפת pipeline; פערי אבחון מול Gold V21; שורש ותיקון "לשון/הפוסקים" (תיקון ב־`legacy-imud-flow.js`) | #43 מוערם על #37 (בדיקת הרגרסיה של סוכן 4); בונה מחדש את שתי החבילות; baseline v2 אחרי #33 | repro נכשל על HEAD ועובר עם התיקון (דוח); 0 פגיעות על 5 קורפוסים אמיתיים; ב־#43 ה־xfail הופך ל־FIX_LANDED ו־`s62` מוחמר (לפי הודעות הקומיטים); CI על ה־head של #43 ירוק דרך #45 (טיוטה מקבילה שנסגרה) | אין | IN REVIEW — תיקון הוצע כ־PR, לא מוזג |
| 3 — גופנים וביצועים | PRs #34, #38 (`feature/agent-3-font-yellow`, `feature/agent-3-font-prefetch`) | `6f80156` | מדידה (ביצועים, עלייה בדפדפן, ראיות WOFF2) ← אופטימיזציה אחת מוצדקת: שליפה מקבילית של 12 גופני עלייה (גופנים מוכנים −44–45% בהדמיה); FontLoader/IndexedDB/core-extended — DEFERRED | הכרעת בעלים על WOFF2; #38 נוגע ב־`index.html` וב־`package.json` | הכלי רץ ×3, דטרמיניזם 3/3; עלייה: HeadlessChrome 153 מול שרת מדמה-מארח (**הדמיה**, לא GitHub Pages); בדיקת יחידה ל־#38; layout hash ללא שינוי (לפי הדוח) | אין (נדרשת הכרעה) | #34 DONE · #38 טיוטה |
| 4 — בדיקות ואימות | PRs #36, #37, #44 (`feature/agent-4-testing-green`, `feature/agent-4-heading-rollback-regress`) | `6f80156` | G0 baseline על `6f80156` (#36); בדיקות רגרסיה strict xfail: R-01 + fixtures + מפקד כותרות (#37), אורקל מקור→פלט ומשפחות R-01/R-02/R-03 (#44) | מיזוג #33 ← baseline v2 | 672 בדיקות · 33 קבצים · 0 כשלים · 0 דילוגים; מקומי = CI (Node 18/20/22) | אין. דווח על עבודה מוקדמת שאבדה (קונטיינר אופס) | G0 DONE (על `6f80156`) · #37, #44 IN REVIEW |
| 5 — תיעוד ואינטגרציה | `feature/agent-5-docs-release` @ `6fe6156` (נדחף; הקומיט של בעל הפרויקט + קומיטי ריענון) | `6f80156` | מפת מקורות אמת + סתירות; טבלת מעקב; מראות קוד; ריענון מול הסוכנים | מיזוג הפרויקטים לעדכוני ממשל (WORKLOG / ISSUE_REGISTRY / DECISIONS) | בדיקת קישורים/נתיבים/מודולים: 0 בעיות; דוגמאות הקוד אומתו | אין | IN PROGRESS — PR #46 |

דיווחי מסירה בתבנית §1.4 לא התקבלו כמסמכים נפרדים; הדוחות והתיאורים של ה־PRs משמשים ראיה. ב־`BASELINE.md` של סוכן 4 קיים סעיף מסירה (§11) המופנה אליי.

## 3. שערי קבלה G0–G7

| שער | מצב | ראיה / הערה | בעלים |
|---|---|---|---|
| G0 — Baseline | **DONE (ממתין למיזוג #36)** | 672 בדיקות · 33 קבצים · 0 כשלים · 0 דילוגים; זהה ב־CI; hash קנוני `80f9ed6c82ea3855…` (36 עמודים); אודיט דפדפן ב־CI: 704/704 עמודים · 0 בעיות. נמדד על `6f80156`, **לפני** #33 — נדרש baseline v2 אחרי המיזוג | סוכן 4 |
| G1 — Content | **OPEN — תיקון הוצע ב־#43, לא מוזג** | אובדן "לשון/הפוסקים" שוחזר ע"י סוכנים 2 ו־4 (מסלול legacy). שורש: `continue` חסר אחרי `rollbackTrailingHeadings()`. התיקון ב־#43 מוערם על בדיקת הרגרסיה (#37); CI ירוק על ה־head דרך #45 (טיוטה מקבילה שנסגרה). פגיעה שקטה שבדיקת המילים אינה תופסת; 0 פגיעות על 5 קורפוסים אמיתיים. האבחנה ב־ISSUE_REGISTRY שגויה (DOC-19) | סוכנים 2+4 |
| G2 — Layout | OPEN (אבחוני) | נוסח #33 (העדכני): שימור תוכן, סדר קריאה, גיאומטריה ודרישות פריסה עומדים בבדיקות; פערי legacy P6/P7 מסווגים בלבד (D-98). נמדד: HARD 4/4 · מרחק היסטורי 88.9% (12/14) | סוכן 2 |
| G3 — Causality | PARTIAL | ל־RED כבר: 43 סוגי ממצא, EventLog עם checkpoints, Ledger עם 10 מצבי חיים. פערים אמיתיים: snapshot/diff בין checkpoints; אין אירוע `cp3` ואין קישור ממצא←טוקן; מיפוי 7 קטגוריות סיבתיות. כלי דיבוג ראשונים ב־`debug/` (#35) | סוכן 2 |
| G4 — Determinism | **MEASURED** | hash קנוני זהה בסקריפט הרשמי ובשתי ריצות בתהליכים נפרדים; מקומי = CI (33/33); דפדפן IDENTICAL על ה־build ועל האתר החי | סוכן 4 |
| G5 — Performance | **BASELINE + אופטימיזציה מוצעת (#34, #38)** | אין צוואר בקבוק CPU בנתיב הגופנים. בעלייה (הדמיית אירוח מרוחק, **לא** GitHub Pages) 12 גופני עלייה נשלפים בסדרה; שליפה מקבילית ב־#38 מקצרת "גופנים מוכנים" ב־44–45%. FontLoader/IndexedDB לא מוצדקים (DEFERRED). מנוע: ≈ 1.8–2.1 שניות ל־704 עמודים | סוכן 3 |
| G6 — User acceptance | PENDING (בעל הפרויקט) | `CUTOVER.md` — טקס האישור החזותי; לא בוצע | בעל הפרויקט |
| G7 — Release | BLOCKED | רישוי לא הוכרע (`UNLICENSED`, `private`); גרסה לא הוכרעה; G1 פתוח; ממצא WOFF2/PDF (R-7) דורש הכרעה. אין להכריז v1.0.0 | בעל הפרויקט + סוכן 5 |

## 4. חפיפות וסיכוני שילוב

| # | נושא | סוכנים | ראיה | המלצה (להכרעה) |
|---|---|---|---|---|
| O-1 | חבילות הדפדפן נשמרות ב־git וכוללות את המנוע; בדיקה משווה אותן ביט־לביט לבנייה חדשה. אחרי מיזוג #39–#42 ה־`app.bundle.js` ב־main השתנה, ולכן #43 (שנבנה על `6f80156`) חייב rebase ובנייה מחדש של שתי החבילות. חבילות שנוגעות ב־PRs הפתוחים: `app.bundle.js` — #43; `engine-worker.bundle.js` — #43 | 1, 2 | חישוב קבצי ה־PRs | בנייה מחדש (`node tools/build-worker-bundle.js`) כצעד אחרון אחרי rebase על main; מיזוג PR אחד בכל פעם |
| O-9 | `red-build/package.json` (שרשרת `scripts.test`) נערך ב־#33, #37, #38, #44 — כל אחד מוסיף בדיקה לסוף אותה שורה; `.github/workflows/ci.yml` — ב־#37 | 1, 2, 3, 4, בעלים | חישוב קבצי ה־PRs | מיזוג עוקב; כל PR מבצע rebase ומוסיף את הבדיקה שלו (קונפליקט טריוויאלי). אופציה לסוכן 4: מריץ שמאתר קבצים במקום שרשרת ידנית |
| O-10 | `red-build/ui/index.html` נערך ב־#38 (גם מקום מחרוזות ה־`?v=` של ניקוי המטמון) | 1, 3 | חישוב קבצי ה־PRs | rebase ל־#38 אחרי כל PR שמעדכן גרסת נכסים |
| O-2 | ממצא #1 של סוכן 3 (אוספי עיצוב בעלייה) נמצא ב־`settings-panel.js` — תחום סוכן 1; `imud-library.js` תחת `src/ui/**` | 1, 3 | `docs/perf/PERFORMANCE_BASELINE.md` §3 (#34) | סוכן 1 בעלים של כל שינוי בעלייה; סוכן 3 מספק מדידות |
| O-3 | `tools/**`: נוספו `tools/perf/` (סוכן 3) ו־`tools/baseline/` (סוכן 4); כלי הבנייה ללא בעלים בתוכנית | 1, 2, 3, 4 | #34, #36 | להגדיר בעלים לכלי הבנייה |
| O-4 | חוזה Worker/תוצאה: `worker-protocol.js` תחת `src/ui/**` אך מסריאל תוצאות מנוע | 1, 2, 4 | רישום חוזים (§6) | בעלים: סוכן 2; צרכן: סוכן 1 |
| O-5 | פריסת Pages: `deploy-pages.yml` בבעלות סוכן 4, אך הנוהל ידני (`SESSION_HANDOFF.md`) | 4, בעלים | `.github/workflows/deploy-pages.yml` | להכריע מי מפרסם |
| O-6 | מיקום תוצרי הסוכנים אינו אחיד: שורש הריפו (סוכן 2), `docs/perf/` (3), `audits/baseline/` (4), `docs/coordination/` (5); תוכנית: "בתיקיית התיעוד המתאימה". גם `debug/` בשורש (סוכן 2) אינו מוגדר | 1–5 | רשימות הקבצים בטבלת ה־PRs | `docs/reports/<סוכן>/` (הצעה); לאשר מיקום `debug/` |
| O-7 | WORKLOG / ISSUE_REGISTRY / DECISIONS — כותב יחיד: סוכן 5. #33 כבר עורך את שלושתם, לכן עדכוני ממשל ימתינו למיזוגו | כולם | תוכנית §9.2; מסמך ההפעלה §7 | `pending_governance_after_PR33.md` מוכן |
| R-1 | baseline (G0) מתייחס ל־`6f80156` ויתיישן עם מיזוג #33 (שינוי מנוע + שרשרת בדיקות) | 2, 4 | `BASELINE.md` §0 (#36) | baseline v2 אחרי המיזוג; כל artifact נושא commit |
| R-2 | הקורפוס הישן `audits/very_long_test_text.txt` נפסל ב־D-100; ב־#33 אינו ברירת המחדל של full-math. מדידות "הקורפוס הארוך" ב־baseline תקפות ל־`6f80156` בלבד | 4 | DOC-17 | baseline v2 על קורפוס תקין |
| R-3 | parity/P6/P7 הוא אבחון היסטורי לפי #33 (D-98), אך ב־main עדיין נאכף ratchet | 2, 4 | DOC-16 | ההבהרה הועברה לסוכנים (מסמך זה) |
| R-4 | `npm test` משנה 5 קבצים תחת מעקב git ב־`red-build/tests/artifacts/` — אין להוסיף `git diff --exit-code` על התיקייה | 4 | `BASELINE.md` §7.2 (#36) | PR נפרד בתחום סוכן 4 |
| R-5 | אותו קורפוס: 700 עמודים בנתיב Node (`run-ours.js`) מול 704 בדפדפן; כל נתיב דטרמיניסטי לעצמו | 2, 4 | `BASELINE.md` §7.1 (#36) | לסווג (תצפית פתוחה) |
| R-6 | ה־UI לא נבדק בדפדפן אמיתי — אין להסיק מהדוח "קבלת משתמש" | 1 | `UI_OPERATIONAL_AUDIT.md` (#39) | בדיקה ידנית של בעל הפרויקט (G6) או Playwright (סוכן 4) |
| R-7 | **WOFF2:** 75% ממשפחות הבחירה (1,289 מתוך 1,721) הן WOFF2 בלבד — לא נמדדות ולא מוטמעות ב־PDF. מדגם 24 משפחות (`WOFF2_EVIDENCE.md`, #34): המרה מכפילה נפח (115MB ← כ־230MB); 25% CFF שמפצל הגופנים אינו תומך בו; 29% ללא אותיות עבריות; מדידה אמיתית משנה שורות ב־15 מתוך 24 | 1, 2, 3 | `docs/perf/WOFF2_EVIDENCE.md` (#34) | הכרעת בעלים: המרה, הגבלת הבחירה או הצהרת מגבלה |
| R-8 | ה־UI קיבל TXT בקידוד Windows-1255 כג'יבריש, והמנוע הצהיר "שימור תוכן: שלם" על הקלט הפגום (תיקון ב־#41) | 1, 2 | `UI_OPERATIONAL_AUDIT.md` §1 (#39) | לציין במסמכי G1 |
| R-9 | **#33: CI אדום והתנגשות עם main.** על head `1723fb0`: `test (20)` ו־`test (22)` נכשלו בשלב "Run full test suite", `very-long-corpus` — בשלב "Corpus invariants + informational alignment metric", `test (18)` בוטל; לאחר מיזוג #39–#42 ה־PR גם אינו ניתן למיזוג נקי (נקרא ב־API; הסיבה לכשל לא נבדקה כאן) | בעלים, 4 | API: check-runs ו־mergeable_state | rebase על main ובדיקת הכשל לפני מיזוג; ייתכן קשר ל־D-100 על הקורפוס הישן (R-2) |
| R-10 | PRs מוערמים (בסיסם ≠ main) אינם מריצים CI בעצמם. #43 (תיקון המנוע) ירוק על אותו commit דרך #45 (טיוטה מקבילה שנסגרה) — "CI בלבד — לא למזג". בשאר המוערמים (#44) אין תוצאות CI | 1, 2, 4 | עמודת CI בטבלת ה־PRs | אחרי מיזוג ההורה: rebase ל־main והרצת CI לפני מיזוג |

## 5. סדר מיזוג מומלץ (תוכנית §9.5, בתוספת הראיות)

מוזגו כבר: #39, #40, #41, #42 (UI של סוכן 1). חפיפת קבצים ישירה בין ה־PRs הפתוחים שאינם מוערמים: **#33 × #37: `red-build/package.json`; #33 × #38: `red-build/package.json`; #33 × #43: `red-build/package.json`; #33 × #44: `red-build/package.json`; #37 × #38: `red-build/package.json`; #38 × #43: `red-build/package.json`; #38 × #44: `red-build/package.json`; #43 × #44: `.github/workflows/ci.yml`, `red-build/package.json`, `red-build/tests/fixtures/regress/README.md` …**. הסדר נובע גם מתלויות סמנטיות, ממוערמים ומחבילות הדפדפן:
1. **#33** (בעלים) — המדיניות וחוזה המבנה; קודם לכל baseline v2 ולכל תיקון מנוע. כרגע CI אדום והתנגשות עם main (R-9) — נדרש rebase.
2. **מסמכים וכלי מדידה בלבד** — #36 (baseline), #34 (ביצועים וראיות), #35 (דוחות סוכן 2 + `debug/`): בטוחים בכל סדר; אין ביניהם חפיפת קבצים בחישוב.
3. **#37 ← #43, #44** (בדיקת רגרסיה ← תיקון המנוע, ומשפחות רגרסיה; שניהם מוערמים על #37) — אחרי #33 ו־baseline v2; #43 חייב rebase ובנייה מחדש של שתי החבילות (O-1).
4. **#38** (טיוטה — שליפה מקדימה) — אחרי #43 (אותה שורת `test`, `index.html` וחבילות); דורש אישור ההצדקה (הדמיה בלבד).
5. **תיעוד (סוכן 5):** #46 (תיעוד תיאום) עצמאי ובטוח למיזוג מוקדם; PR הסגירה (README, הערות מהדורה) — רק אחרי G0–G6 ואישור בעלים.
 רישום חוזים

| חוזה | מקור האמת בקוד | גרסה | בעלים מוצע | צרכנים | בדיקות |
|---|---|---|---|---|---|
| פרוטוקול Worker | `red-build/src/ui/worker-protocol.js` | v1 (+v1.1) | סוכן 2 (צד מנוע) — להכרעה | UI | `tests/e2e/s10-ui.test.js` |
| סכמת תוצאה ל־UI | `serializeTypesetResult` | `ui-result-v1` | סוכן 2 — להכרעה | UI | s10-ui |
| Ledger / trace / דוח | `core/ledger.js`, `core/events.js`, `audit/report-schema.js` | schema v2 / trace-v2 | סוכן 2 | UI, בדיקות | e2e, canonical |
| רישום הגדרות | `core/settings-registry.js` | `settings_version` | סוכן 2 | UI, ייצוא | `tests/integration/registry.test.js` |
| פרויקט ZIP והגירה | `output/project-io.js` | settings v2 | סוכן 2 | UI, ייצוא | s12-export |
| חבילת הרחבות | `extensions/extensions-io.js` | `tora-typesetter-extensions` v1 | סוכן 2 | UI | s11-extensions |

**הצעת שינוי חוזה (לא הוגשה רשמית):** תווית `cp3` + `tokenId`/טווח מקור בכל issue — תוספתי, שדות אופציונליים. מקור: `DIAGNOSTICS_GAP_ANALYSIS.md` §4 סעיף 2 (#35). בעלים: סוכן 2; בדיקת חוזה: סוכן 4. עד הגשה רשמית — אין שינוי חוזה פתוח.

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

1. **#33** — מועד המיזוג והטיפול ב־CI האדום (R-9); baseline v2 אחריו.
2. **WOFF2 והטמעת PDF** — המרה, הגבלת בחירה או הצהרת מגבלה (R-7).
3. **רישוי וגרסה** — `UNLICENSED` / `0.1.0` / תג `v25-unified-rc1` / `v1.0.0` (G7).
4. **README** — מתי לאמץ את הטיוטה, ואישור לסמן `README.md`/`RELEASE_NOTES.md` כהיסטוריים **במקומם**.
5. **OPEN_QUESTIONS** — 8 שאלות פתוחות מ־02.11 (DOC-11).
6. **בעלות** — `tools/**`, חבילות הבנייה ופרוטוקול המיזוג (O-1, O-3, O-4, O-9).
7. **פריסת Pages** — מי מפרסם (O-5).
8. **מיקום דוחות הסוכנים ו־`debug/`** (O-6).
9. **רישום החלטות** — הבהרת D-97 (DOC-18).
10. **מחולל SETTINGS** — האם `docs/tools/gen-settings-doc.js` (סקריפט תיעוד) מקובל.
11. **בדיקה ידנית ב־UI** — מי מבצע ומתי (R-6, G6).
12. **#38** — לאשר את השליפה המקדימה (הדמיה בלבד) ואת מיקום קבצי ה־UI שלה.
