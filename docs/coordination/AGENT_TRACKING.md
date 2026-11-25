# טבלת מעקב — חמשת הסוכנים (תוכנית RED v2.0)

> **בעלים:** סוכן 5 · **נכון ל:** 25.11.2026 · **בסיס:** `main` @ `44357a2`
> **מקורות:** `docs/coordination/MANAGER_DIRECTIVE.md` (מחייבת; מחזור 2, 18.11.2026) · תוכנית האב ומסמך ההפעלה ב־`spec/` · תוצרי הסוכנים ב־PRs.
> **כללים:** המסמך נערך רק על ידי סוכן 5. נתוני ה־PRs, ה־CI והמיזוגים **מחושבים** מ־API של GitHub ומ־git בעת הכתיבה; לא הורצה כאן בדיקה של סוכן אחר. במקרה של סתירה — ההנחיה גוברת. את מצב השערים המחייב אין לשכפל כאן: `MANAGER_DIRECTIVE.md` §2.

## 0. מעמד המסמך ומשימות סוכן 5

- ההכרעות D-101…D-118 נרשמו ב־`DECISIONS.md` כלשונן — PR #65 (מוזג).
- משימות סוכן 5 לפי ההנחיה §5.5: רישום ההחלטות (PR #65); ריענון טבלה זו (מסמך זה); הצהרת מגבלת WOFF2 במסמכים — D-106 (`ARCHITECTURE.md`, `API.md`); README לאחר baseline v2 — D-108 (עדכון מינימלי, PR נפרד); שלד רשימת בדיקה ל־G7 — `G7_RELEASE_CHECKLIST.md`, **בלי להכריז גרסה** (D-107).

## 1. מצב הבסיס

| פריט | ממצא | ראיה |
|---|---|---|
| `main` | `44357a2` | `git rev-parse` |
| CI על `main` | הצליחו: layout-audit, layout-parity, local, test (18), test (20), test (22), very-long-corpus | API (check-runs של ה־head) |
| קוד המנוע | השתנה בשלושה קבצים מאז `510c9d6`: `core/pipeline.js`, `layout/legacy-imud-flow.js`, `parser/document-structure.js`. תיקוני המנוע שמוזגו: #43, #48, #55, #63. רישום ההגדרות ופרוטוקול ה־Worker לא השתנו מאז `6f80156` | `git diff 510c9d6 HEAD -- red-build/src/engine` |
| baseline | v1 על `6f80156` (#36); **v2 על `188a201`** — `audits/baseline/188a201/manifest.json` | קבצים ב־`main` |
| חפיפת קבצים בין PRs פתוחים | אין | `git diff --name-only` |

| PR פתוח | ענף @ head | כותרת | קומיטים · קבצים | CI | מצב מיזוג |
|---|---|---|---|---|---|
| #38 | `feature/agent-3-font-prefetch` @ `f9ea0bc` | טיוטה — Agent 3: שליפה מקדימה של גופני העלייה (טעינה ראשונה מארוח מרוחק: גופנים מוכנ | 3 · 4 (+191 −1) | הצליחו 7 · דולגו 1 | התנגשות |
| #60 | `feature/agent-3-provenance-fonts` @ `84bd632` | טיוטה — docs(PROVENANCE): סעיף הגופנים לפי מיפוי סוכן 3 (DOC-07) | 2 · 1 (+35 −23) | הצליחו 7 · דולגו 1 | נקי |
| #69 | `feature/agent-3-recommendations` @ `5c3c227` | Agent 3: המלצות והחלטות נדרשות לבחינת מנהל הפרויקט (מעודכן; מחליף את #56) | 2 · 1 (+6 −6) | הצליחו 7 · דולגו 1 | נקי |

מוזגו מאז הבסיס `6f80156`:

| PR | ענף | מוזג ב־ |
|---|---|---|
| #33 | `docs/reference-intent-clarification` | 16.11 19:21 |
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
| #47 | `feature/agent-5-open-questions` | 17.11 05:33 |
| #48 | `work/engine-paren-note-flags` | 20.11 01:39 |
| #50 | `feature/agent-4-impact-matrix` | 17.11 05:33 |
| #51 | `feature/agent-5-sync-1115` | 17.11 05:34 |
| #52 | `feature/agent-5-governance-1115` | 17.11 05:34 |
| #53 | `feature/agent-3-font-inventory` | 17.11 05:33 |
| #54 | `feature/agent-4-notes-census` | 17.11 10:40 |
| #55 | `work/engine-ghost-notes` | 21.11 17:54 |
| #56 | `feature/agent-3-recommendations` | 21.11 22:54 |
| #57 | `feature/agent-4-baseline-v2` | 19.11 09:47 |
| #58 | `feature/agent-4-r04-extended-family` | 19.11 09:47 |
| #59 | `manager/directive-1118` | 19.11 00:25 |
| #61 | `feature/agent-4-test-runner` | 21.11 22:54 |
| #62 | `feature/agent-4-artifacts-drift` | 21.11 22:54 |
| #63 | `work/engine-endnotes-consecutive` | 23.11 01:12 |
| #64 | `feature/agent-4-impact-notes-metrics` | 25.11 08:47 |
| #65 | `feature/agent-5-decisions-1118` | 25.11 08:46 |
| #66 | `feature/agent-3-erratum-legacy-hebrew` | 25.11 08:47 |
| #67 | `feature/agent-4-adjacency-matrix` | 25.11 08:47 |
| #68 | `feature/agent-4-ornament-neutrality` | 25.11 08:47 |

## 2. לפי סוכן

| סוכן | מוזגו | פתוחים |
|---|---|---|
| 1 — UI ותפעול | #39, #40, #41, #42 | — |
| 2 — מנוע ואבחון | #35, #43, #48, #55, #63 | — |
| 3 — גופנים וביצועים | #34, #53, #56, #66 | #38, #60, #69 |
| 4 — בדיקות ואימות | #36, #37, #44, #50, #54, #57, #58, #61, #62, #64, #67, #68 | — |
| 5 — תיעוד ואינטגרציה | #46, #47, #51, #52, #65 | — |
| בעלים / מנהל (`docs/reference-intent-clarification`, ממשל) | #33, #59 | — |

הפירוט של כל PR — בתיאור שלו ובדוחות הסוכנים (`docs/reports/`, `docs/perf/`, `audits/baseline/`); כאן רק מיפוי.

## 3. שערים וסדר מיזוג

המצב המחייב של השערים G0–G7 וסדר המיזוג (D-104) — `MANAGER_DIRECTIVE.md` §2 ו־§4. מה שאימתתי מול git: baseline v2 מוזג, והוא הפריט הראשון בסדר; התיקונים R-03 (#48), R-04 (#55), R-05 (#63) מוזגו; #38 נשאר טיוטה — אחרון, בתנאי D-116.

## 4. סיכונים ופערים פתוחים

- **WOFF2 (D-106):** משפחות WOFF2־בלבד הן לתצוגה בלבד — לא נמדדות בטבלאות אמיתיות ולא מוטמעות ב־PDF; המסמכים מצהירים על כך (`ARCHITECTURE.md`, `API.md`); סימון ב־UI — סוכן 1.
- **בדיקה בדפדפן אמיתי (D-115):** ה־UI לא נבדק בדפדפן אמיתי (`UI_OPERATIONAL_AUDIT.md`).
- **README (D-108):** בשורש עדיין מופיעים "388 בדיקות" ו"12 פאנלים"; baseline v2 כבר מוזג, ולכן העדכון המינימלי מותר — PR נפרד.
- **נכשלים ב־CI של `main`:** אין.
- **חפיפות בין PRs פתוחים:** אין.

## 5. חוזים

CP-1 (הצעת חוזה האבחון של סוכן 2, `docs/reports/agent-2/proposals/CONTRACT_PROPOSAL_diagnostics.md`) אושרה: A–E, לפי הסדר — A ראשון (D-117). בקשות חוזה אחרות פתוחות: אין.

## 6. תבנית דיווח מסירה (מסמך ההפעלה §1.4)

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
