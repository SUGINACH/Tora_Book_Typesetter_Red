# טבלת מעקב — חמשת הסוכנים (תוכנית RED v2.0)

> **בעלים:** סוכן 5 · **נכון ל:** 10.11.2026 · **בסיס:** `main` @ `6f80156` (מיזוג PR #32)
> **מקורות:** תוכנית האב `spec/תכנית לשיפור תוכנת עימוד Red.MD` (§9–§10) · מסמך ההפעלה `spec/תוכנית הפעלה לחמשת הסוכנים.md` (§1.4, §6–§7).
> **כללים:** DONE רק עם קישור לראיה. "לא דווח" = אין ראיה. המסמך נערך רק על ידי סוכן 5; סוכנים אחרים מדווחים בתבנית שבסעיף 5.

## 1. מצב הבסיס — ראיות מ־git

| פריט | ממצא | ראיה |
|---|---|---|
| HEAD של main | `6f80156` (מיזוג PR #32, 10.11.2026) | `git ls-remote origin main` |
| קוד המנוע | זהה ל־`510c9d6` (S6.3-ב); מאז השתנו workflows ומסמכים בלבד | `git diff --stat 510c9d6 origin/main -- red-build` ריק |
| ענפים מרוחקים | `docs/reference-intent-clarification`, `gh-pages`, `main`, `plan/engine-first-roadmap-v2`, `plan/five-agent-work-allocation` — **אין ענף סוכן (`feature/agent-N-*`) ב־remote** | `git ls-remote --heads origin` |
| PRs ממוזגים | כל המספרים 1–32 מופיעים כמיזוגים ב־main. PR #31 ו־#32 = תוכנית v2.0 | `git log --merges origin/main` |
| PR פתוח | **#33** — ענף `docs/reference-intent-clarification` (head `1723fb0`, 50 קומיטים של SUGINACH, 10.11.2026): מדיניות ייחוס (D-98/D-99), חוזה תקינות מבנה מקור (D-100) כולל **שינוי מנוע ובדיקות**, והתאמת התוכניות, README, CUTOVER ו־workflow. סטטוס: לא מוזג. (מצב ה־PR נגזר מ־refs; GitHub API חסום מהסביבה — לאמת בממשק) | `git ls-remote origin refs/pull/33/head` |
| תג | `v25-unified-rc1` @ `a9538bc` (03.11.2026); main מקדים אותו ב־81 קומיטים | `git rev-list --count v25-unified-rc1..origin/main` |
| בדיקת ה־Pages | הפריסה ב־Actions mode (`deploy-pages.yml`), לא legacy | `.github/workflows/deploy-pages.yml` |

## 2. טבלת המעקב

| סוכן / תפקיד | ענף בפועל | commit בסיס | קבצים בבעלות | משימה פעילה | PR | תלות | בדיקות | חסימה | סטטוס |
|---|---|---|---|---|---|---|---|---|---|
| 1 — UI ותפעול | לא דווח (ברירת מחדל `feature/agent-1-ui-orange`; לא קיים ב־remote) | לא דווח | `red-build/src/ui/**` | audit תפעולי של ה־UI הקיים → `UI_OPERATIONAL_AUDIT.md` | — | חוזה Worker לקריאה בלבד; חוזי אבחון מסוכן 2 | — | לא דווחה | NOT STARTED (ממתין לדיווח §1.4) |
| 2 — מנוע ואבחון סיבתי | לא דווח (`feature/agent-2-debug-gold`; לא קיים ב־remote) | לא דווח | מודולי המנוע והאבחון (`red-build/src/engine/**`, `red-build/src/audit/**`) אחרי מיפוי נתיבים | מפת pipeline; שחזור "לשון/הפוסקים"; P6/P7 — ללא שינוי מנוע עד baseline | — | baseline + fixtures מסוכן 4 | — | לא דווחה | NOT STARTED (ממתין לדיווח) |
| 3 — גופנים וביצועים | לא דווח (`feature/agent-3-font-yellow`; לא קיים ב־remote) | לא דווח | מסלול טעינת נכסי גופנים בלבד (ראו O-2) | `PERFORMANCE_BASELINE.md` — מדידה, לא FontLoader | — | אישור סוכן 2 לכל שינוי במדידה | — | לא דווחה | NOT STARTED (ממתין לדיווח) |
| 4 — בדיקות ואימות | לא דווח (`feature/agent-4-testing-green`; לא קיים ב־remote) | לא דווח | `tests/**`, `audits/**`, כלי בדיקה, `.github/workflows/**` | Baseline על HEAD מזוהה (שלב 0 / G0) | — | — (מוביל) | — | לא דווחה | NOT STARTED (ממתין לדיווח) |
| 5 — תיעוד ואינטגרציה | `feature/agent-5-docs-release` — **מקומי בלבד, לא נדחף** (אין הרשאת push בסביבה); יושר ל־main ב־fast-forward | `510c9d6` → הועלה ל־`6f80156` | מסמכים בלבד: `docs/**`, WORKLOG, ISSUE_REGISTRY, DECISIONS, OPEN_QUESTIONS, CUTOVER, LAYOUT_DEPENDENCY_MAP | מפת מקורות אמת + סתירות; טבלת מעקב; מראות קוד (ARCHITECTURE/API/SETTINGS) | טרם נפתח | baseline (סוכן 4) להשלמת DOC-01…03; מפת קוד (סוכן 2) | בדיקת קישורים ונתיבים בתיעוד (דוח המסירה) | אין הרשאת כתיבה ל־GitHub מהסביבה: `git push` נכשל (אין credentials) וגם מחבר ה־GitHub החזיר 403 ביצירת ענף (אינטגרציה לקריאה בלבד) — נדרשת דחיפה ופתיחת PR ע"י בעל הפרויקט (חבילת `agent5-work.bundle` / `agent5-docs.patch`); עדכוני WORKLOG/ISSUE_REGISTRY/DECISIONS ממתינים למיזוג PR #33 | IN PROGRESS |

## 3. חפיפות בבעלות — סיכונים שזוהו

| # | נושא | סוכנים | ראיה | הצעה (להכרעה) |
|---|---|---|---|---|
| O-1 | חבילות הדפדפן הנוצרות (`red-build/ui/*.bundle.js`) ומחרוזות `?v=` נשמרות ב־git, והן כוללות את המנוע. בדיקה משווה אותן ביט־לביט לבנייה חדשה — כל PR של מנוע או UI חייב לבנות אותן מחדש, ו־PRs מקבילים ייכנסו להתנגשות בקבצים אלה | 1, 2, 4 | `red-build/tests/e2e/s10-ui.test.js:821` | הבנייה מחדש היא צעד אחרון אחרי rebase על main; מיזוג PR אחד בכל פעם בסדר שסוכן 5 קובע (§9.5). בעלים לצעד הבנייה — להכרעה |
| O-2 | `red-build/src/ui/imud-library.js` — טעינת קטלוג הגופנים (תחום סוכן 3) נמצא תחת `src/ui/**` (תחום סוכן 1) | 1, 3 | `red-build/src/ui/imud-library.js` | סוכן 3 בעלים של פונקציות טעינת הגופנים אחרי מיפוי; סוכן 1 אינו עורך את הקובץ במקביל |
| O-3 | `tools/**`: כלי audit/parity שייכים לסוכן 4; כלי הבנייה (`build-worker-bundle.js`, `gen-ui-bindings.js`, `deps.js`) אינם מוגדרים בתוכנית | 1, 2, 4, 5 | `tools/` | להגדיר בעלים; סוכן 5 משתמש ב־`deps.js` לקריאה בלבד |
| O-4 | חוזה Worker ותוצאה: הקובץ `worker-protocol.js` תחת `src/ui/**` (סוכן 1) אך הוא מסריאל תוצאות מנוע וסכמת audit (`src/audit/**`, סוכן 2) | 1, 2, 4 | `red-build/src/ui/worker-protocol.js` | בעלים לחוזה: סוכן 2 (צד מנוע); צרכן: סוכן 1; בדיקות חוזה: סוכן 4; תיעוד: סוכן 5 (מסמך ההפעלה §7) |
| O-5 | פריסת Pages: `deploy-pages.yml` תחת `.github/workflows/**` (סוכן 4), אך נוהל הפריסה ידני ומתועד ב־`SESSION_HANDOFF.md` | 4, בעל הפרויקט | `ai-chat/SESSION_HANDOFF.md` (פריסה ב־Actions mode) | להכריע מי מפרסם ומתי |
| O-6 | מיקום תוצרי הסוכנים (`UI_OPERATIONAL_AUDIT.md`, `PERFORMANCE_BASELINE.md`, דוחות baseline) — לא הוגדר | 1, 3, 4, 5 | מסמך ההפעלה §2, §4, §5 | הצעה: `docs/reports/` (נפתח על ידי הסוכן המדווח) — לאישור |
| O-7 | WORKLOG / ISSUE_REGISTRY / DECISIONS — הוספות מקבילות מכמה ענפים ייצרו התנגשויות | כולם | תוכנית §9.2 (סוכן 5) | כותב יחיד: סוכן 5; האחרים מדווחים בתבנית §1.4. **PR #33 כבר עורך את שלושתם** — עדכוני סוכן 5 ימתינו למיזוגו (מסמך ההפעלה §7: אין לערוך אותו קובץ בשני ענפים ולמזג) |
| O-8 | PR #33 של הבעלים נוגע בתחומי כל הסוכנים — מנוע: `pipeline.js`, `document-structure.js`; בדיקות: `package.json`, `long-real-text.test.js`, `document-structure.test.js`; UI: `test-doc-generator.js`; workflows: `full-math-audit.yml`, `layout-parity.yml`; כלים: `run-full-math.js`, `README.md`, `compare.py`, `verify-corpus.py`, `validate-source-structure.js`; מסמכי פרויקט ומפרט: 11 קבצים | 1, 2, 4, 5 | `git diff --name-only origin/main origin/docs/reference-intent-clarification` | הבעלים הוא הסמכות; הסוכנים מבצעים rebase אחרי המיזוג. הכרעה נדרשת על מועד ה־baseline (R-1). הענף ממשיך להתעדכן — המצב כאן לפי head `1723fb0` |

## 4. שערי קבלה G0–G7 — מצב התחלתי

| שער | מצב | ראיה / הערה | בעלים |
|---|---|---|---|
| G0 — Baseline | NOT STARTED | אין baseline מזוהה; מספרים היסטוריים סותרים (DOC-01…03). **על איזה HEAD?** main@`6f80156` או אחרי מיזוג PR #33 שמשנה את המנוע (R-1) | סוכן 4 |
| G1 — Content | OPEN | ממצא "לשון/הפוסקים" רשום כפתוח: `ISSUE_REGISTRY.md:251`, `WORKLOG.md:2489`; אין סגירה ב־S6.3; לאמת על HEAD | סוכנים 2+4 |
| G2 — Layout | OPEN | נוסח PR #33 (העדכני, לא מוזג): שימור תוכן, סדר קריאה, גיאומטריה ודרישות פריסה עומדים בבדיקות; פערי legacy P6/P7 **מסווגים בלבד** (D-98). נוסח main הישן מחייב P6/P7 (DOC-16). נתונים היסטוריים בלבד: `WORKLOG.md:461` | סוכן 2 |
| G3 — Causality | PARTIAL (קוד) | EventLog/Ledger/trace קיימים; gap analysis מול Gold V21 טרם נעשה | סוכן 2 |
| G4 — Determinism | UNVERIFIED | `ci.yml` כולל job דטרמיניזם; ריצה על HEAD — ב־baseline | סוכן 4 |
| G5 — Performance | NOT STARTED | מדידה ראשונה — סוכן 3 | סוכן 3 |
| G6 — User acceptance | PENDING (בעל הפרויקט) | `CUTOVER.md:46` (טקס האישור) | בעל הפרויקט |
| G7 — Release | BLOCKED | רישוי לא הוכרע (`red-build/package.json`: `UNLICENSED`, `private`), גרסה לא הוכרעה (`0.1.0` / תג `rc1`), G0–G6 פתוחים. אין להכריז v1.0.0 (תוכנית §9.2, §11.2) | בעל הפרויקט + סוכן 5 |

## 4א. סיכוני שילוב

| # | סיכון | ראיה | המלצה |
|---|---|---|---|
| R-1 | baseline (G0) שייקבע על `6f80156` יתיישן ברגע שמתמזג PR #33: הוא משנה התנהגות מנוע (דחיית מבנה כותרות לפני עימוד) ואת שרשרת `npm test` (34 ← 35 פקודות) | `git diff origin/main origin/docs/reference-intent-clarification -- red-build` | בעל הפרויקט מכריע: baseline על main הנוכחי (להשוואה) וגם על main אחרי המיזוג; כל artifact נושא commit |
| R-2 | הקורפוס הישן `audits/very_long_test_text.txt` אינו תקף לפי D-100; ב־PR #33 הוא כבר אינו ברירת המחדל של full-math, שעבר ל־`audits/long_test_text.txt` (DOC-17). baseline שייקבע לפי נוסח main הישן ישווה לקורפוס אחר | `tools/layout-audit/run-full-math.js` (ב־PR #33) | כל artifact של baseline מציין קורפוס + commit; סוכן 4 מיישר ל־PR #33 לאחר המיזוג |
| R-3 | PR #33 הופך את parity/P6/P7 מ"שער" ל"אבחון היסטורי"; סוכנים שיפעלו לפי נוסח main הישן עלולים לשנות מנוע כדי להעלות ציון | DOC-16 | העברת ההבהרה לסוכנים 2 ו־4 מיד (מסמך זה) |

## 5. תבנית דיווח מסירה (מסמך ההפעלה §1.4)

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

## 6. סדר מיזוג וכללים (תוכנית האב §9.4–§9.5)

1. baseline ו־fixtures (סוכן 4) → 2. תיקון ממוקד (סוכן 2) → 3. בדיקות רגרסיה וקורפוסים (סוכן 4) → 4. הרחבות אבחון (סוכן 2 + בדיקות סוכן 4) → 5. תיקוני UI (סוכן 1) → 6. אופטימיזציות (סוכן 3, רק עם parity) → 7. תיעוד ושערים (סוכן 5; PR הסגירה רק אחרי תוצאות מאומתות).
**כללים:** PR אחד = מטרה אחת · אין דחיפה ל־main · PR מנוע דורש שחזור, שורש, לפני/אחרי, שימור תוכן ודטרמיניזם (תבנית §14) · סוכן 5 אינו מסמן משימה כסגורה בלי קישור לראיה.

## 7. רישום חוזים ובעלים

| חוזה | מקור האמת בקוד | גרסה | בעלים מוצע | צרכנים | בדיקות קיימות |
|---|---|---|---|---|---|
| פרוטוקול Worker | `red-build/src/ui/worker-protocol.js` | v1 (+v1.1: `register-font`, `register-assets`, `export-request`) | סוכן 2 (צד מנוע) — להכרעה | UI (סוכן 1) | `tests/e2e/s10-ui.test.js` |
| סכמת תוצאה ל־UI | `serializeTypesetResult` באותו קובץ | `ui-result-v1` | סוכן 2 — להכרעה | UI | s10-ui |
| Ledger / trace / דוח | `engine/core/ledger.js`, `events.js`, `audit/report-schema.js` | schema v2 / trace-v2 | סוכן 2 | UI, בדיקות | e2e, canonical |
| רישום הגדרות | `engine/core/settings-registry.js` (+ `bindings.generated.js` נוצר) | `settings_version` | סוכן 2 | UI, ייצוא | `tests/integration/registry.test.js` |
| פרויקט ZIP והגירה | `engine/output/project-io.js` | settings v2 | סוכן 2 | UI, ייצוא | s12-export |
| חבילת הרחבות | `engine/extensions/extensions-io.js` | `tora-typesetter-extensions` v1 | סוכן 2 | UI | s11-extensions |

**בקשות שינוי חוזה פתוחות:** אין. (כל שינוי: בעלים, תיאור, תאימות לאחור, בדיקת חוזה — מסמך ההפעלה §6 משימה 5.)

## 8. החלטות הנדרשות מבעל הפרויקט

1. **רישוי** — להכריע או להשאיר `UNLICENSED` (תוכנית §11.2).
2. **שם/מספר גרסה** — `0.1.0` / תג `v25-unified-rc1` / `v1.0.0` (G7).
3. **README** — מתי לאמץ את הטיוטה, ואישור לסמן `README.md`/`RELEASE_NOTES.md` כהיסטוריים **במקומם** (בלי העברת קבצים, מסמך ההפעלה §6).
4. **OPEN_QUESTIONS** — 8 שאלות פתוחות מ־02.11 (DOC-11).
5. **בעלות** — `tools/**`, חבילות הבנייה ופרוטוקול מיזוג (O-1…O-4).
6. **פריסת Pages** — מי מפרסם ומתי (O-5).
7. **מיקום דוחות הסוכנים** — `docs/reports/` (O-6).
8. **מחולל SETTINGS** — האם `docs/tools/gen-settings-doc.js` (סקריפט תיעוד, לא קוד ייצור) מקובל, או להסירו ולהשאיר את הקובץ שנוצר בלבד.
9. **מועד ה־baseline** — לפני או אחרי מיזוג PR #33 (R-1), ומי מכריע על מיזוגו.
10. **הקורפוס הארוך** — לאשר שקורפוס ה־baseline לבדיקות ארוכות הוא `audits/long_test_text.txt` והישן נשאר בקרה שלילית בלבד (DOC-17, PR #33).
11. **רישום החלטות** — להבהיר את הפער ב־D-97 (D-100 נרשם ב־PR #33); סוכן 5 אינו מקצה מזהי החלטות (DOC-18).
