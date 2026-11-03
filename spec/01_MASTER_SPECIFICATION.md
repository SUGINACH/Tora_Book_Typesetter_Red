# מסמך אפיון master — מערכת עימוד ספרים תורנית (IMUD_TORANI / Unified Edition)

> **גרסה:** 1.0 (Master Unified Spec) · **תאריך:** 2026-11-02
> **סטטוס:** מסמך אב מחייב. הוא ממיזג את כל הטוב מכל הגרסאות והמסמכים, ומכריע בכל הסתירה.
> **קהל יעד:** (א) המשתמש הבודק — כל התנהגות צפויה מתוארת במילים פשוטות; (ב) המתכנת הכותב — כל דרישה עם ID, קריטריון קבלה מדיד, ורמת ביסוס.
> **מקורות המיזוג (כל טענה במסמך זה ניתנת למעקב לאחד מהם):**
> - `shared/specs/Software_specification.md` (מסמך האפיון המקורי — חלק א׳–ד׳ + נספחים)
> - `shared/comparisons/Monster_Comparison_All_Repos_Branches.md` (השוואת 5 ריפואים: IMUD/Yellow V22/Gold V21/Green V23/Orange)
> - `shared/comparisons/Integration_recommendation.md` (4 גרסאות קוד: השוואת/חלוקת/מערכת/עדכון + 5 הנחיות מיזוג)
> - `shared/comparisons/Upgrade_plan.md` (שלוש שכבות: DFA AST / Knuth-Plass / Multi-Column DP)
> - `chatgpt_v23/session/Session_handoff.md` (10 דרישות משתמש מחייבות של V23)
> - `chatgpt_v23/issues/Layout_issue_catalog.md` (קטלוג 47 בעיות+חריגים+סוגי בדיקה)
> - `zai_v21/session/Session_handoff.md` + `zai_v21/issues/Defining_layout_issues.md` (כללי העבודה, 30 kindי audit, מסע ה-false positives)
> - `claude_v20/technical/Handoff_documentation.md` (F-01…F-21 יומן כשלים; סעיף 6.3 — דרישות משתמש ומצבן)
> - `shared/plans/Mapping_Upgrade_Panel_Settings_System.md` (פנייה 2 — שינויי לוח ההגדרות שהמשתמש ביקש במפורש)
> - `shared/plans/Issue_resolution_protocol.md`, `shared/plans/Working_rules.md`, `shared/plans/Master_work_register.md`
> - תמלילי השיחות: `chatgpt_v23/transcripts/Chat_01..10`, `claude_v20/transcripts/V20.1..V20.5`, `zai_v21/transcripts/*`

---

## 0. איך לקרוא את המסמך — רמות ביסוס ומעמד דרישות

### 0.1 רמות ביסוס (חובה לכל דרישה)

| סימון | משמעות |
|---|---|
| `[מ-מ]` | **מאומת־משתמש** — המשתמש ניסח/אישר זאת במפורש באחת השיחות (מצוין מקור). |
| `[מ-ק]` | **מאומת־קוד** — נבדק מול קוד פעיל באחד מחמשת הריפואים (HEAD מתועד). |
| `[מ-ב]` | **מאומת־בדיקה** — עובר בדיקה אוטומטית/CI מתועד. |
| `[ה]` | **השערה** — סביר אך לא הוכח; אסור לבנות עליו בלי ניסוי מכריע. |
| `[פ]` | **פתוח להכרעת משתמש** — יש לספק ברירה למשתמש או לשאול. |

### 0.2 מעמד דרישה

| סימון | משמעות |
|---|---|
| **M** (Must) | בלתי־ negotiable; שער הקבלה של השלב חייב לכסותו. |
| **S** (Should) | נחוץ לתוצאה מקצועית; ניתן לדחות רק עם החלטה מתועדת. |
| **C** (Could) | שיפור עתידי; מחייב רק שאין לו השפעה על M/S. |
| **X** (Won't / אסור) | מצב שנקבע שהוא שגוי/אסור — חובה להימנע ממנו (כולל "אל תתקן"). |

### 0.3 עקרון־על של הפרויקט (מכוח החלטות המשתמש)

1. **"המשתמש מתמקד בתוכן ובמראה הסופי; התוכנה אחראית לכל ההיבטים הטכניים."** `[מ-מ]` (Software_specification §15.1)
2. **"אין משמעות לתיקון חצי"** — כל תיקון חייב לעבור במסמך המלא, לא רק בfixture. `[מ-מ]` (Z.ai transcript: „אין משמעות לתיקון חלקי…")
3. **"המטרה: מנוע עימוד דטרמיניסטי, מתמטי ושקוף סיבתית, עם שימור תוכן מלא ובלי הסתרת ממצאים."** `[מ-מ]` (V23 Session_handoff — פרומפט מעודכן)
4. **"בסתירה בין מסמכים — תמיד להעדיף את רצון המשתמש; בספק — להציג את הספק והאפשרויות."** `[מ-מ]` (Software_specification §15.14)
5. **"לא לטעון שהבדיקות עברו ללא ראיה; לא להכריז פתרון על ירידה בספירת ממצאים בלבד."** `[מ-מ]` (V23 handoff סעיף 10; Issue_resolution_protocol)

---

# חלק א׳ — תמונת המצב הכרונולוגית והנכסים

## A1. שושלות הקוד (lineages) — מה מאחדים ומהי הבסיס

| שושלת | מקור | תרומה שתיכנס למיזוג | מקור הביסוס |
|---|---|---|---|
| **Green V23** | ChatGPT | מנוע 6,226 שורות; CLI+CI מחמיר; registry של 27→3 בעיות; container-gap/sparse-page/square-bracket-scope audits; step-by-step trace | Monster §1.1, §8.3 `[מ-ק]` |
| **Gold V21** | z.ai/GLM | AutoQuality (stretchByWordSpacing…), fixDropWordInColumns, rebalance2, heading dividers H3–H6, shaar dividers, h2-orn-scope, 6 workflows, test-triggers corpus, PDF screenshots, 30 kinds audit | Monster §4.3, §10.1 `[מ-ק]` |
| **Yellow V22** | ChatGPT | engine-inputs / engine-trace / engine-diagnostics, כפתור "דוח אבחון בלחיצה אחת", PR A/B compare, determinism self-test, 4 kinds ייחודיים (chain-broken, empty-column, heading-at-bottom, pua-char) | Monster §7.1, §8.1 `[מ-ק]` |
| **Orange** | איחוד רשמי | הנדסת העברות commit-per-feature; 9 פיצ'רים מ-Gold (heading dividers מודדים fits בכל האתרים + rollback); hdr-h1-title-mode; same_as_even; TOC numbering wiring; page-num-initial-value/body-last-line-align wiring; **self-hosted fonts + offline guard exit 7**; ui-e2e אמיתי | Monster §4.4, §5.4, §10.1 `[מ-ק]` |
| **IMUD main ("Orange" בשם כפול)** | Claude V20.x | settings-manager font-picker preserve-missing-value (+14 שורות ייחודיות); presets makom-bina; 21 תרחישי tests/layout; FEATURE_MAP | Monster §4.5, §8.2 `[מ-ק]` |
| **V1–V4 (השוואת/חלוקת/מערכת/עדכון)** | קבצי txt היסטוריים | עדכון.txt (V4) = בסיס UI/שערים/כותרות; השוואת (V1) = page-num-initial-value; חלוקת (V2) = סריקת תיקיית נכסים + TOC count checkboxes; מערכת (V3) = \uE000 אטומי + Math.min divider | Integration_recommendation `[מ-מ]` (המלצת המיזוג אושרה) |

**הכרעת בסיס (Decision D-01):** בסיס המיזוג = **Orange** (הכי קרוב ל-Green: 30 hunks בלבד; כבר מכיל 9 העברות מ-Gold + selfhost fonts), ועליו מוסיפים את כל מה שחסר לפי מרשם הפערים (Part E). נימוק: Orange הוא הריפו היחיד שנבנה בשיטת commit-per-feature עם בדיקה לכל פיצ'ר, והבסיס הדוקמנטרי שלו (`expected_baseline.json`, PROVENANCE) מאפשר השוואת רגרסיה מיידית. `[מ-ק]` Monster §1.1, §9.

## A2. מה מוכח ואינו במחלוקת

- כל 15 קבצי הנתונים (JSON) **byte-identical ב־5/5** → אין מחלוקת נכסים; הפער כולו בקוד/הגדרות/ממשק. `[מ-ק]` Monster §2.2
- פרוטוקול renderer-bridge זהה ב־4 ריפואי הצבע (ייחודי ל-Yellow: `diagnose`). `[מ-ק]` Monster §7.2
- Baselines מתועדים: Green — 639 עמודים/27 ממצאים (ברו"מ), 659/37 (עיטורים); Orange — 639/39 (0H/11M/28L) מול baseline 40; Gold — 371→3 issues. `[מ-ק]` Monster §8.3

## A3. כשל מבני היסטורי שחובה למנוע במיזוג

**רגרסיות השמטה** — תכונות שפעלה אחת מחקה תכונה ישנה (V1→V4): `page-num-initial-value`, TOC count-numbering, סריקת תיקיית נכסים. `[מ-מ]` Integration_recommendation §5.
**רגרסיות השמטה II** — בהעברה Green→Orange אבדו: `allow-terminal-residual-fallback`, `balance-chapter-end` (מנגנון), `container-overlap`, `tolerated-containment-rounding`. `[מ-ק]` Monster §5.2, §7.1, §10.1.
**פתרון מבני (לא "טלאי"):** חוזה רישום שלושת־השכבות (פקד↔מפתח↔מנגנון↔בדיקה) + CI gate שמונע פיזית השמטה — ראו D-20 בחלק W (תכנית העבודה) ו‑REQ-GOV-04 כאן.

---

# חלק ב׳ — התוצאה המושלמת: מהו "עימוד טוב" (מבחינת המשתמש)

## B1. העמוד הרגיל — מפרט חזותי מלא `[מ-מ]` (Spec §3.1.1)

- גודל ניתן לבחירה (A4 כברירת מחדל); כיוון RTL; **שני טורים**: ימני נקרא ראשון; מרזב (gutter) מרכזי.
- שוליים: תחתון רחב מהעליון (להערות שוליים); אזורי צד להערות שוליים חיצוניים; **שולי תפירה א־סימטריים recto/verso** לכריכה.
- כותרת עליונה: שורה אחת, עד 3 עמדות (ימין/מרכז/שמאל); מתחלפת Recto/Verso; קו מפריד תחתיה (ללא/אפור/שחור) `[מ-מ]` (Claude §6.3).
- מספר עמוד: תחתית, גימטריה/ספרות/דף+גימטריה, מסגרת אופציונלית (עיגול/מרובע/סוגריים/פרח/יהלום), מיקום (תחתית-מרכז/חיצוני/בתוך הכותרת/ללא), **ערך התחלתי עצמאי**.
- גוף: justify מלא; **שורה אחרונה של פסקה ממורכזת** (ברירת מחדל; ניתן: center/right/stretch — `body-last-line-align`) `[מ-ק]` Orange wiring.
- מילה ראשונה ("חלון"): Drop-word / Inline / Bold / ללא; 1–2 מילים; סף 2–3 שורות; **קצה העליון של האותיות מיושר לקו הבסיס של שורת הגוף** (בקשת משתמש מפורשת, טרם יושם — REQ-LB-05) `[מ-מ]` (Claude §6.3 שורה "גובה מילה ראשונה").
- ד"ה (דיבור המתחיל): זיהוי אוטומטי עד נקודה/מקף + הדגשה; גופן/משקל נפרדים.
- הערות שוליים: תחתית העמוד, קו מפריד (רגיל/עיגולים/ניצוץ/כוכבית/יהלום/ללא), 1 או 2 טורים, איפוס מונה (רציף/עמוד/פרק/חלק), כותרת מעל ההערות + עיטורי צד.
- הערות צד (marginalia): שולי חיצוני, מגובה לתחילת הפסקה, דחיפה minTop ללא חפיפות.
- קו מפריד אנכי בין טורים: ללא/דק/מקווקו/כפול; **גובה = Math.min(גובה שני הטורים) − 8px** `[מ-מ]` (Claude §6.3 "קצה תחתון"; V3 Math.min).

## B2. סוגי עמודים (חוזה התנהגות) `[מ-מ]` (Spec §3.1.2–3.1.9, נספח א)

| # | סוג עמוד | חוזה התנהגות מפורט |
|---|---|---|
| PT-01 | שער ראשי | רקע גרפי + תיבות טקסט (שם/נושא/נושא מפורט/מהדורא/מחבר/מקום־שנה); גרירה+ייצוא box ל־JSON; טוגל הצגה; Divider אופציונלי (`shaar-main-divider`) |
| PT-02 | שער משנה (H1) | עמוד שער + שם החלק; TOC מפורט אופציונלי עם מקושרים; איפוס מונים (הערות/סימנים) לפי הגדרה; `shaar-sub-divider` |
| PT-03 | שער אחורי | 4 מקטעים עצמאיים (זכויות/הוצאה/קשר/דפוס) `[מ-מ]` V4; מיובא מ־`shaar_back.json` |
| PT-04 | הקדמה (H0) | **טור רחב יחיד**, גופן ייעודי לגוף ההקדמה, חלון מילה ראשונה, "התחל בעמוד אי־זוגי" |
| PT-05 | פתיחת סימן (H2) | עמוד חדש תמיד; כותרת בשליש העליון; טקסט צמוד לתחתית אזור הטקסט; מרחק עליון נפרד (`h2-top-offset`); מספור סימנים אוטומטי (מתאפס בחלק); עיטורי עליון/תחתון + **עיטור נפרד ל"סימן א'" ולכותרת עצמה** + עיטורי צד; התאמת רוחב עיטור לרוחב טקסט הכותרת |
| PT-06 | כותרת 3 | חוצה שני טורים; הטורים שלפניו **מאוזנים**; עיטורי צד ימין/שמאל (שונים זה מזה) בגובה טקסט הכותרת; מתחתיו 2 טורים |
| PT-07 | עמוד הערות סיום | בסוף כל חלק; כותרת "הערות"/"הערות (המשך)"; ללא running head/מספר עמוד (או מספור מיוחד); 1/2 טורים |
| PT-08 | TOC כללי/מפורט | לחיץ ב־PDF; שליטה פר־רמה (1–7): הצגה, קיבוץ inline, גופן/גודל; **count/show נפרד** `general-toc-count-numbering` |
| PT-09 | עמוד מותאם אישית | JSON: רקע/תיבות/תמונות/מיקום (לפני/אחרי שער, לפני/אחרי חלק, סוף); האם נספר |
| PT-10 | עמוד ריק (filler) | נוצר רק עבור "התחל אי־זוגי"; לא נספר; לא מדווח כ־underfill |

## B3. 14 חוקי הברזל של התוצאה `[מ-מ]` (Spec §3.2) + הרחבות מוכחות

1. כל עמודי הטקסט באותו גובה (מלבד עמוד אחרון של פרק/חלק/עמוד שער מוגדר).
2. רשת בסיס אחידה: כל השורות באותו גובה (baseline grid).
3. איזון טורים: בסוף פרק ולפני H3 — הפרש ≤ **5px** (ברירת מחדל; ראה C- thresholds).
4. אין אלמנות/יתומות (≥2 שורות; ראה R-WD/R-OR).
5. אין נהרות לבנים: variance רווחים בטווח ההגדרה.
6. מספור עקבי ללא דילוג/כפילות (כולל skip/carry per page-type).
7. Running head משקף את ההקשר הנכון (H1/H2/H3, verso/recto, first/last word).
8. הערה שולית מופיעה בעמוד ההפניה שלה; ארוכה — policy פיצול (REQ-FN-11).
9. אפס Tofu; תו לא־מזוהה **לא מוצג** (נוקה לפני render) — ולא משאיר ריבוע.
10. כותרת אינה נשארת לבדה: ≥2 שורות אחריה (H1–H6; H7 חריג מפורש).
11. אות הערה אינה נשברת מסוף שורה (with next word).
12. אפס חפיפות (טקסט↔טקסט, הערות↔הערות, עיטורים↔גוף, הערות↔מספור).
13. אפס גלישות (column/page/footnote-area/header-box).
14. קובץ לא־נתמך לא נטען בשקט + הודעה ברורה "פורמט לא נתמך".
15. **(נוסף) אפס אובדן תוכן:** hash אוסף הטוקנים (פסקאות/כותרות/הערות) של המקור = זה של הפלט, גם לאחר fallbacks וrollback. `[מ-מ]` (V23: שימור 3,105+529+2,042; Gold text-completeness).
16. **(נוסף) דטרמיניזם:** אותו input + אותן הגדרות + אותה סביבה ⇒ byte-identical layout hash בשתי ריצות. `[מ-מ]` (V23 repeat-render PASS).
17. **(נוסף) שקיפות סיבתית:** לכל ממצא — trace עם checkpoints לפני/אחרי, לא רק מיקום. `[מ-מ]` (V23 דרישות 1–4).

## B4. מה אינו בעיה (false positives) — רשימת חובה `[מ-מ]` (Z.ai WORKING_RULES; V23 catalog)

- דלילות **p-end** (שורת סיום פסקה ממורכזת) — תקינה; דלילות נבדקת **רק ב‑p-cut**.
- טור שמאלי ריק **בסוף פרק** — תקין (page-underfill לא מדווח; empty-column כן — רה־הבחנה!).
- נפילה לגופן שני ברשימת fallback — כמתוכנן.
- פסקה בת מילה אחת — בלתי־פתירה; המערכת מדלגת במפורש.
- עמוד אחרון של פרק קצר / עמוד מילוי (filler) / עמודי שער.
- ריבועים בגופנים גנריים (serif/sans) — לעולם לא tofu.
- PUA שאינו U+E000 — ייתכן לגיטימי; בודקים תו־תו.
- **multiple-blocks** (2 בלוקים דו־טוריים בעמוד) — אינה בעיה (כלל 6 של Z.ai).
- כותרת H7 (צד) — לא נבדקת ל"כותרת בתחתית".
- חריגת כותרת עליונה ארוכה לשתי שורות — המשתמש קבע: **אין צורך לבדוק** `[מ-מ]` (V23 Chat_03 פנייה 15).

---

# חלק ג׳ — מפרט דרישות פונקציונלי (REQ) עם קריטריוני קבלה

> פורמט כל דרישה: `ID | דרישה | ביסוס | קריטריון קבלה (Acceptance) | שלב בתכנית העבודה`

## G1. פיענוח וטוקניזציה (Layer 1 — DFA AST)

| ID | דרישה | ביסוס | קריטריון קבלה | שלב |
|---|---|---|---|---|
| REQ-PAR-01 | Header lexer (DFA) מבודד מטא־דאטה **רק בפתיח** (עד שורה ריקה/כותרת ראשונה); שורה כמו `נושא - דין סוכה ישנה` באמצע המסמך **נשארת פסקה**. | Upgrade_plan §1 `[מ-מ]` (המשתמש אישר את התוכנית); Unit tests על 12 וקטורי קלט | 0 שגיאות זיהוי על corpus metadata; fixture `mid-doc-metadata-like-line.txt` עובר | S2 |
| REQ-PAR-02 | Balanced bracket scanner (מחסנית) להערות `[...]` כולל קינון `[א [ב] ג]` וחריגות; זיהוי טווחים חוצי פסקה/טור/עמוד; ספירת עומק לכל מיקום. | V23 Chat_01 פניות 1–7 (המשתמש דרש חקירה עמוקה כולל "סוגריים שמתחילים בטור ראשון ומסתיימים בטור שני"); Upgrade_plan | scope map מלא: 2,483 זוגות תואמים, 97 חוצי טורים, 51 חוצי עמודים, 3 סוגרים־ללא־פתיחה **מסווגים מול מקור**; 0 unmatched ללא הסבר | S2 |
| REQ-PAR-03 | Block tokenizer: H0–H7 (מקף חובה `-`/`–`/`—`; בלי מקף = פסקה **בשקט**), P, endnote (`הערת סיום -`), editorial (`##…##` מוסר לחלוטין), side-note (H7). | Spec §7 `[מ-מ]` | token stream == expected ב־fixtures; no silent drops | S2 |
| REQ-PAR-04 | רצף הערות `[א][ב]`: כל זוג הופך להערה נפרדת; נבדק מול מקור הטקסט לפני סיווג כבאג. | V23 handoff §D `[מ-מ]` | fixture `consecutive-notes.txt`; count+marker conservation | S2 |
| REQ-PAR-05 | ניקוי תווים: U+E000 פנימי מוסר לפני render; PUA אחר — checklist מפורט; נרמול גרשים/מרכאות (normalizeText תוקן ב־Z.ai session 2). | Spec §9.5; Z.ai handoff `[מ-מ]` | 0 PUA בדומה הסופי; 0 תו שלא נבדק ללא רישום | S2 |
| REQ-PAR-06 | Custom Text Styles (JSON): trigger (linePrefix/inlineMarker/combinator AND/OR), layoutMode ∈ {regular, full-width, side-note, footnote, endnote, new-location}, style מלא, counterReset, linkedOrnaments. | Spec §8 `[מ-מ]` | 3 examples עוברים E2E; schema validation | S11 |
| REQ-PAR-07 | ייבוא DOCX: Heading1–7 → `כותרת N - …`, footnotes → `[...]`, body → פסקה; פליין־טקסט בעורך. | Spec §12.3 `[מ-מ]` | docx-fixture round-trip diff = 0 | S11 |

## G2. מיקרו־טיפוגרפיה (Layer 2 — Hebrew line breaking)

| ID | דרישה | ביסוס | קריטריון | שלב |
|---|---|---|---|---|
| REQ-LB-01 | Measurement API יחידה `measureLines(text, widthPx, fontSpec, opts)`; **אין `offsetHeight` מפוזר**; מימוש A=DOM, B=Math (HarfBuzz WASM + font metrics) — אותה חתימה. | Claude §6.5 step1; V23 Chat_07 שלב א/ב `[מ-מ]` | grep: 0 קריאות ישירות outside measure*; parity A↔B ≤0.01px על 100% מילות corpus | S2/S12 |
| REQ-LB-02 | שבירת שורות אופטימלית (Knuth-Plass: box/glue/penalty) עם badness/looseness מרובים; **אין מק־סוף־שורה** (no hyphenation בספרות תורנית). | Upgrade_plan §2; Spec §9.2 `[מ-מ]` | total-fit < greedy על המסמך הקנוני; 0 מקפים בסוף שורות | S3 |
| REQ-LB-03 | הגנת מילים: צמדי NBSP ל־אות הערה+מילה, גרש/גרשיים, ר"ת, מקור+סוף־משפט מינימלי; זוג קשור שרוחבו > רוחב הטור — **מבטלים את הקשירה** (לא גלישה). | Claude §6.2(5); V23 note-marker-line-break `[מ-מ]` | fixtures; 0 note-marker בסוף שורה | S3 |
| REQ-LB-04 | \uE000 אטומי: רווחים בתוך `[...]` מוחלפים בתו מוגן **למדידה בלבד**; ההערה תופסת רוחב סמן במדידה; לעולם אינה נקרעת בין טורים/עמודים. | V3/V4 breakthrough; Integration_rec §2b `[מ-מ]` | 0 fn-split ב־long audit; visual check fixture | S3 |
| REQ-LB-05 | חלון מילה ראשונה: Drop-word מיושר **קצה־עליון לגוף** (לא baseline); Inline/Bold/None; 1–2 מילים; סף שורות; לא חל על פסקה < סף. | Claude §6.3 "גובה מילה ראשונה" `[מ-מ]` — **לא מומש, חובה** | pixel-diff של top edge מול שורת הגוף ≤1px | S3 |
| REQ-LB-06 | Last-line align: center (default)/right/stretch — `body-last-line-align` קשור לפקד (wiring ב־Orange ✓). | V4 + Orange `[מ-ק]` | settings-effect test: ערך→computed style | S4 |
| REQ-LB-07 | Runt protection: שורה אחרונה של פסקה חתוכה ≥50% רוחב (ברירת מחדל); p-end לא נבדק; **RTL: rect.right−colRect.left ולא rect.width**; מדידה עם `Range.getClientRects()`. | Z.ai כללים 5–7 `[מ-מ]` | unit + long audit sparse-line only p-cut | S3 |

## G3. מאקרו־עימוד (Layer 3 — Page/column DP)

| ID | דרישה | ביסוס | קריטריון | שלב |
|---|---|---|---|---|
| REQ-BAL-01 | Candidate search **מודד קיבולת justify לפני/אחרי** (capacityBefore/capacityAfter) ואת השלכת הבלוק הבא (H3/full-width) — לא רק Δ גובה נאיבי; עונש overflow קשיח ×2000 **וגם אכיפה** (hard reject אם חורג תקציב הערות). | עמוד 376 V23 trace; V4 penalty; Claude §6.2(4) `[מ-מ]+[מ-ק]` | fixture capacity-before-h3 משחזר 376; selected candidate ≠ naive-min-diff | S5 |
| REQ-BAL-02 | איזון בסוף פרק + לפני H3: Δ≤5px; פסקאות שלמות > שורות > ריווח > מרווח־בין־פסקאות (סדר העדפויות של Spec §10.2). | Spec §10 `[מ-מ]` | imbalance findings = 0 (ללא חריגים מוצדקים) | S5 |
| REQ-BAL-03 | `balance-chapter-end` mode ∈ {balance, stretch, natural} — מנגנון מלא (היה ב־Green; אבד ב־Orange) + פקד + מפתח + בדיקה. | Monster §10.1 "אבד" `[מ-מ]` | settings-wiring test; 3 modes produce documented diffs | S5 |
| REQ-BAL-04 | `allow-terminal-residual-fallback` — שחזור מלא מ־Green (CSS class קיים ב־Orange בלי מנגנון). | Monster §5.2 `[מ-ק]` | fixture terminal residual; flag honored | S5 |
| REQ-BAL-05 | Rebalance2 אחרי cross-paragraph-parens (מ־Gold) — אם עטיפת סוגריים שינתה גובה אחרי איזון → rerun איזון לאותו בלוק. | Gold unique `[מ-ק]` | stage snapshot delta=0 post-fix | S5 |
| REQ-BAL-06 | AutoQuality (מ־Gold, שלם רק בו): compress/stretch word-spacing 0.95–1.05, letter/heading spacing, shared-load, thresholds; **פאנל UI מלא (18 פקדים) + 11 מפתחות + מנגנון** — שלושת השכבות יחד. | Monster §10.1, §6.2 `[מ-ק]` | AQ on/off diff report; caps respected | S6 |
| REQ-BAL-07 | StretchPageToBottom: מניעת overshoot מעל 20px (שלושת containment של ch3p4/ch3p17/ch72p9); re-fit pass אחרי flushFootnotes: אם חורג מ־remPageHeight−reserve → מחזירים שורות אחרונות לתור. | Z.ai §6.1; Claude §6.2(3) `[מ-מ]` | containment=0 על המסמך הקנוני בשתי תצורות | S6 |
| REQ-BAL-08 | Unified retreat loop (B11): הגנת סוגריים ↔ widow/orphan ↔ איזון ↔ כותרות — לולאה מאוחדת עם מטריצת הגנות (Claude §2.5.4): כל הזזת חיתוך מחילה מחדש את **כל** ההגנות. | V23 catalog row "הגנת סוגריים ↔ אלמנות"; Claude `[מ-מ]` | no competing-repair regressions; ledger status transitions | S5 |
| REQ-BAL-09 | Rollback integrity: snapshot-rollback משחזר also footnote positions, side notes, heading state, inserted ornaments/dividers; ornament שהוסר לא נספר באסימון. | Orange headingDividerState `forgetHeadingSeen` `[מ-ק]` | rollback fixture: geometry before==after modulo intended change | S5 |
| REQ-BAL-10 | Club/widow penalties כחלק מ־DP (לא post-hoc): ≥2 שורות בראש/תחתית טור; heading escort ≥2; H7 לא נבדק. | Spec §3.2(4,10); Z.ai כלל 8 `[מ-מ]` | widow/orphan/heading-escort = 0 | S5 |
| REQ-BAL-11 | P2.5 extended: איזון גם לפני H4/H6 (לא רק H3) לפי מפת דרכים V18 — לבדוק סטטוס `implemented/replaced/obsolete` עם ראיה לפני יישום. | Master register §9.3 `[פ]` | decision log entry + fixture | S5 |

## G4. הערות (Footnotes / Endnotes / Side-notes)

| ID | דרישה | ביסוס | קריטריון | שלב |
|---|---|---|---|---|
| REQ-FN-01 | Footnote space reservation: `getFootnotesReservedHeight()` מחשב **גם** הערות בפסקה הנמדדת כעת (V2/V4 lesson; F-17 formula unification probe≠reserved). | Integration_rec §5; Claude F-17 `[מ-מ]` | fn-overflow=0; formula unit test probe==reserve | S6 |
| REQ-FN-02 | הערה ארוכה מעמוד: policy פיצול גוף ההערה לעמוד הבא **עם שמירת סמן/סדר/מבנה** (המשתמש ביקש לחקור); fallback: הזזת ההערה כולה + סימון המשך. | V23 handoff §D `[מ-מ]` | fixture long-note; marker continuity verified | S6 |
| REQ-FN-03 | Endnotes: עמודי "הערות/(המשך)" בסוף חלק; חלוקה אוטומטית; מונים נפרדים; כותרת+עיטורי צד; font/align נפרדים (`f-note-body`,`s-note-body`). | Spec §3.1.7; Claude §6.3 `[מ-מ]` | endnote pages E2E | S7 |
| REQ-FN-04 | Side notes (H7): anchor ל־token; push-down עם minTop לכל הערה; ניקוי `pagePendingNotes` אחרי balanceColumns; צבירת H7 רצופות; reposition אחרי הזזת פסקה; containment סף 20px. | Claude §6.2(6); Z.ai `[מ-מ]` | side-note-overflow=0; overlap=0 | S7 |
| REQ-FN-05 | h7-conversion audit מדויק: בדיקה ביחס לכל פסקה בנפרד (המשתמש תיקן: "טקסט כותרת הצד קיים גם בגוף הטקסט" → false positive); קישור token-ID. | Z.ai session1; V21 transcript `[מ-מ]` | 0 false-positive בהזרקת duplicate-text fixture | S7 |
| REQ-FN-06 | Footnote marker styles: עילי/סוגריים/כוכביות; אות עברית+גרש; reset policies; 1/2 columns; separator rule styles. | Spec §6.4; Mapping §פנייה2 `[מ-מ]` | settings-effect matrix | S7 |
| REQ-FN-07 | fn-layout-mode ∈ {block, continuous} — continuous מ־V21 ported (כתם בלבד ב־IMUD; מלא בצבע) — להשלים + בדיקות 70-footnotes-continuous של IMUD. | Monster §4.2, §8.2 `[מ-ק]` | both modes audit-clean | S7 |

## G5. שערים, עיטורים וגרפיקה

| ID | דרישה | ביסוס | קריטריון | שלב |
|---|---|---|---|---|
| REQ-ORN-01 | Ornament fit-to-text (H2 width, H3 side height) — **מדידת DOM/JS** (CSS fit-content נכשל); sync re-fit בלי shift; מקור אחד לשליטה (F-09: אין `!important` מול inline). | V3/V4; Claude F-09/F-21 `[מ-מ]` | pixel diff ≤1px; single-source lint | S8 |
| REQ-ORN-02 | H2 ornament scope (`h2-orn-scope`): סימן בלבד / כותרת בלבד / שניהם; מצבי עיטור עצמאיים (עליון/תחתון לסימן + צדדיים לכותרת — V4). | Gold/Green/Orange `[מ-ק]` | 3 scopes fixtures | S8 |
| REQ-ORN-03 | Chapter-end ornament (פירמידת וילנא/רומח/שושנתא/סלסול/תמונה/ללא) + התאמת גובה לתקציב הפנוי; לא חוסם שער גאומטרי. | Spec §6.7; Master §9 `[מ-מ]` | fitting fixture incl. tight budget | S8 |
| REQ-ORN-04 | Heading dividers H3–H6 (מ־Gold, משודרג ב־Orange: fits() מדידה מראש **בכל** אתרי ההוספה, בלי עיטור בראש טור/עמוד ריק, rollback-aware) + shaar main/sub dividers. | Orange §4.4(7,8) `[מ-ק]` | heading-divider/shaar-divider tests (Orange already green) | S8 |
| REQ-ORN-05 | Shaar boxes: drag+resize, per-shaar-id persistence (`shaarBoxSavedPositions[type][id]`), embedded `box` בייצוא JSON (V4), ייחודיות id בכלי האריזה (index/hash). | V4; Claude §6.2(8) `[מ-מ]` | export→reload roundtrip identical | S8 |
| REQ-ORN-06 | Theme sets in picker: שערי JSON מאוחדים לפי מספר ערכה ("1 שער ראשי/משנה/אחורי"), תמונה מהראשי; כפתור "הצג שער משנה"; preview ויזואלי (שם+תמונה, לא רק שם). | Mapping פנייה 2 (1.1,1.2) + V21 transcript `[מ-מ]` | picker E2E; F-10 regression (charging full set loads all three) | S8 |
| REQ-ORN-07 | JPG/PNG shaars support (`wrapShaarMedia`) + SVG; manifest-less folder import (V2 webkitdirectory). | V2/V4 `[מ-מ]` | upload fixture png+svg | S8 |
| REQ-ORN-08 | Backgrounds panel merged into themes panel (3 סוגי עמודים: רגיל/פתיחת הקדמה/פתיחת סימן; color/texture/image+opacity; insets במ"מ). | Mapping פנייה 2 (6) `[מ-מ]` | UI test; settings migration | S8 |

## G6. כותרות עליונות, מספור, TOC

| ID | דרישה | ביסוס | קריטריון | שלב |
|---|---|---|---|---|
| REQ-HDR-01 | Verso/Recto עצמאי מלא: 3×2 עמדות, תוכן/יישור/גופן/רוחב% לכל אחד; ירושה `same_as_odd/same_as_even` עם גידוע מעגליות (Orange c49b79e ✓). | V4 + Orange `[מ-ק]` | header-settings test suite | S9 |
| REQ-HDR-02 | Sources: book name (auto split לפי מקף first/last), H1 (mode: main/full — `hdr-h1-title-mode`), H2, page#, first-word/last-word of page, custom text; כותרת ייעודית לעמוד H2/H3. | V4; Orange extractH1TitleMain; IMUD fillHeaderFirstLastWords `[מ-מ]` | fixtures per source | S9 |
| REQ-HDR-03 | `page-num-initial-value` (V1 recovery; Orange wired) + start-idx + per-type count/show (shaar/toc). | Integration_rec §5.1; Orange `[מ-מ]` | volume-2 fixture starts at כ"ב | S9 |
| REQ-HDR-04 | Folio frame: none/circle/square/parenthesis/floral; positioning bottom-center/outer/top/in-header/none. | Mapping פנייה 2 (10) `[מ-מ]` | visual matrix | S9 |
| REQ-HDR-05 | TOC: כללי+מפורט; per-level show/inline/group; clickable PDF bookmarks; leader dots; page labels (עברי/decimal per section). | Spec §3.1.8, §13.1 `[מ-מ]` | TOC overflow stress (F: TOC hanging) | S9 |
| REQ-HDR-06 | pg header separator line (none/gray/black) between header and body. | Claude §6.3 `[מ-מ]` | CSS var test | S9 |

## G7. ממשק, ביצועים, חוויית משתמש `[מ-מ]` (Spec §5; Claude §6.3; V23 prefs)

| ID | דרישה | קריטריון | שלב |
|---|---|---|---|
| REQ-UI-01 | 4 tabs: עורך / הגדרות / **בדיקה** / תצוגה; פאנלים מתקפלים (accordion); בוררים ויזואליים עם תמונה+שם. | tab navigation E2E | S10 |
| REQ-UI-02 | Retypeset policy: שינויים קלים (theme/bg/shaar) debounced ~350ms; שינויים כבדים → כפתור ⚡ "עדכן ועמד מחדש" מהבהב; **אין עימוד אוטומטי מכל בקרה** (F-06); נתיב מיידי בכפתור בלי debounce (Claude §6.2(7)). | call-graph audit: 0 indirect typesetDocument() triggers | S10 |
| REQ-UI-03 | Engine ב־Worker; progress bar "עמוד X/Y"; UI לא תוקע; מסמך 1,000 עמודים תחת 60s (goal) — מדידה לפני אופטימיזציה (F-18). | perf budget test | S10 |
| REQ-UI-04 | Paste area: plain-text, מוני עמוד (⏎ markers) **לא מיוצאים** (F-01 lesson), ספירת תווים/שורות, ייבוא TXT/DOCX, ניקוי. | editor tests | S10 |
| REQ-UI-05 | Preview: גלילה אנכית/אופקית, זום (Ctrl+wheel/fit-width), קפיצה بمספר/TOC, סנכרון סמן↔עמוד, לחיצה על עמוד = גלילה אליו. | E2E | S10 |
| REQ-UI-06 | Debug per-page download button (V21 request: כפתור בכל עמוד שמוריד את כל הפרטים) + highlightIssue (כלל 2 Working_rules) + names בעברית (GEOM_KIND_NAMES — כלל 1). | ui-e2e | S10 |
| REQ-UI-07 | Settings panels: scrollable, searchable (סרגל חיפוש הגדרות), reset-to-default per field, template save/load (HTML מלא + JSON). | tests | S10 |
| REQ-UI-08 | No auto-error popups for unsupported files (§9.4); clear Hebrew messages; accessibility pass (ARIA/labels/contrast — ACCESSIBILITY.md open items with fresh audit). | axe-core scan budget | S13 |

## G8. ייצוא והדפסה

| ID | דרישה | קריטריון | שלב |
|---|---|---|---|
| REQ-EXP-01 | PDF: bookmarks, clickable TOC, real text, crop marks toggle, **זהה לחלוטין ל־live DOM** (המשתמש: "אין משמעות לתיקון חלקי… מסמך הייצוא זהה לחלוטין"). | parity test: DOM vs print-CSS rects ≤0.5px | S12 |
| REQ-EXP-02 | Standalone HTML: single-file, base64 fonts subset, embedded SVG/CSS vars, dir=rtl, @page rules, paginated. | file opens offline identically | S12 |
| REQ-EXP-03 | Export ZIP (packerandconfigurator lesson: regex replacement robustness) + JSON settings export incl. shaar boxes. | unpack roundtrip | S12 |
| REQ-EXP-04 | Fonts: `ensureBuiltinFontsLoaded()` (Promise.all fonts.load) לפני מדידה ראשונה; `getFontVal()` anti-generic-serif; **self-hosted fonts repo + offline guard exit 7** (Orange); תיעוד שברי־גופן. | network-intercept test: 0 external requests | S1/S12 |

## G9. אבחון, בדיקות, Governance `[מ-מ]` (V23 requirements 1–10; Issue_resolution_protocol)

| ID | דרישה | קריטריון | שלב |
|---|---|---|---|
| REQ-GOV-01 | Step-by-step trace: events+labels+snapshots+deltas per stage; lifecycle states (created/correction-blocked/correction-reverted/became-observable-later/competing-repair-side-effect/persists/resolved/reintroduced/not-comparable/unresolved); droppedEvents=0; instrumentation **לא משנה** layout (hash equality). | trace schema v2 validation; no-op proof | S1 |
| REQ-GOV-02 | Canonical run: `very_long_test_text.txt` (sha256 `5e73b913…`) בשתי תצורות (default/ornaments); short fixtures משלימים; chapter isolation (H2) **כבדיקת המשך** בלבד, לפי token-identity+settings-hash, לא page number. | CI gates | S1 |
| REQ-GOV-03 | Determinism: repeat-render hash equality; baseline regression **בין commits** (נפרד מrepeat); fingerprint (Chromium/Playwright/fonts/input) בדוח. | expected_baseline.json update PR flow | S1 |
| REQ-GOV-04 | **Three-layer contract:** כל הגדרה = פקד(index.html) ↔ מפתח(default_settings.json) ↔ מנגנון(typesetter/app) ↔ בדיקה(settings-effect). CI: dead-control scan (הצלבה הפוכה, F-13/F-19, כולל מזהים דינמיים `prefix+'-w'`) + phantom-key scan + orphan-mechanism scan. | `test:settings-consistency` fails on any mismatch | S4 |
| REQ-GOV-05 | Settings application audit: value → computed style/DOM → measured effect (למשל "רוחב 40%" → רוחב ה־rect בפועל). | settings-verification kind active | S4 |
| REQ-GOV-06 | Coverage accounting: כל עמוד מסווג evaluated/excluded(reason)/not-evaluated; 17/18 `.page-body-flow` missing **חייבים הסבר**; לא מציגים "כיסוי מלא" בלי חשבונאות. | coverage gate in report | S1 |
| REQ-GOV-07 | Causality discipline: predicate לפני/אחרי לכל ממצא חשוב; counterfactual experiment לפני שינוי אלגוריתם; אסור להגדיל timeout עיוור/להשבית אבחון כדי להפוך CI לירוק (V23 §A). | protocol checklist per fix commit | S1 |
| REQ-GOV-08 | User workflow prefs: להפעיל CI, למסור קישורים, **לא להמתין** (polling); המשתמש יודיע על סיום; אז בודקים logs/artifacts. | documented in AGENTS/AI_WORKFLOW | S0 |
| REQ-GOV-09 | Branch policy: אין למזג V23↔V21 ישירות; עבודת המיזוג מתבצעת על ענף `UNIFIED` חדש בלבד עם provenance tracked (Orange model: commit-per-feature + test). | PROVENANCE.md per port | S0 |
| REQ-GOV-10 | File safety: אין למחוק לפי שם/גודל; references-map קודם (`decorations.js` פעיל!); heritage → archive בלבד. | LAYOUT_DEPENDENCY_MAP maintained | S0 |
| REQ-GOV-11 | Editing recommendations system (V23 שלב 7): הצעות עריכה טקסטואליות **רק עם הוכחת היתכנות** (dry-run reflow) — לא המלצה ללא אימות. | feasibility-proof test | S11 |
| REQ-GOV-12 | Security & hygiene: CSP, SVG sanitize, file validation pipeline, reduce globals, XSS regression suite (SECURITY.md open items re-audited). | security tests | S13 |

## G10. sogrim/parentheses — משפחת הדרישות שהמשתמש פתח בה את V23 `[מ-מ]` (Chat_01 whole thread)

| ID | דרישה | קריטריון | שלב |
|---|---|---|---|
| REQ-PAR-ST-01 | Global paren pre-pass **לפני** עימוד (לא post-fix): scope map לכל מיקום (open/close depth, owner paragraph, cross-boundary flags). | scope map == manual verification sample | S2 |
| REQ-PAR-ST-02 | Styling inside parens applied **before measurement** (גופן/סגנון קובעים גובה) — שלב א' בתוכנית המשתמש; אותו מנגנון למדידה ולתצוגה (שלב ב'). | captureParenFontCounterfactual: 0 divergence measure-vs-render | S2 |
| REQ-PAR-ST-03 | Round brackets חוצי פסקה/טור/עמוד: סגנון נמשך עקבי; 3 closing-without-opening — אמת מול מקור לפני תיקון (לא לתקן אוטומטית!). | classification report | S2 |
| REQ-PAR-ST-04 | Square brackets: המרה להערות עקבית; square-bracket-scope/unmatched kinds; prefix 10→5 normalization + quote-normalization lessons (Z.ai fix list). | conversion conservation | S2 |

---

# חלק ד׳ — קטלוג בעיות-הברזל (Issue Catalog) — הגדרה, חריג, מדידה, פתרון, prevention

> 47 שורות העבודה של V23 Layout_issue_catalog + 30 ה־kinds של Z.ai + איחוד 26 ה־kinds של Monster §7.1 → **קטלוג מאוחד עם סטטוס unified-engine requirement**. פורמט: הגדרה מדויקת | מה **אינו** בעיה | מדידה (predicate) | סף | פתרון מנועי | מניעה מבנית.

## D1. שורות/פסקאות

1. **Widow (אלמנה)** — שורת סיום יחידה בראש טור/עמוד. חריג: פסקה בת שורה 1; המשך ≥2. מדידה: Range.getClientRects + first-line-of-column token check. סף: 0. פתרון: pull/push שורה, אחר כך move paragraph, אחר כך ריווח (סדר Spec §11). מניעה: clubpenalties ב־DP (REQ-BAL-10).
2. **Orphan (יתום)** — שורת פתיחה יחידה בתחתית. חריג: p-end; פסקה קצרה; מילה אחת. פתרון: move whole paragraph → ריווח.
3. **Sparse-line (p-cut runt)** — <50% רוחב. חריג: p-end ממורכז; RTL rect trap. פתרון: pull word מהבאה / tighten via KP.
4. **Note-marker line break** — אות הערה מנותקת. פתרון: NBSP gluing (REQ-LB-03).
5. **Illegal split / no legal split** — אין נקודת חלוקה חוקית; חריג: fallback מפורש נבדק. פתרון: ledger סיבות פסילה + structural-fallback מבוקר.
6. **Structural fallback (terminal residual full-width)** — שחזור `allow-terminal-residual-fallback` + שער "אין runt סופי בלתי פתור". 
7. **Empty column vs missing column** — הבחנה מפורשת (V23 fixtures): injected-empty-column ≠ missing-column.

## D2. איזון וגובה עמוד

8. **Imbalance** >5px; חריג: סוף פרק/אילוץ/קיבולת. מדידה: colContentBottom; lifecycle states.
9. **Capacity-limited residual** (עמוד 376) — תיקוץ: candidate search עם justify capacity + H3 context (REQ-BAL-01).
10. **Rollback-induced imbalance** — final-justify attempt/rollback telemetry; compromise מדווח.
11. **Short page before H3** — איזון לפני H3 + משיכה מלפני (REQ-BAL-02).
12. **sparse-page** — מילוי יחסית לגוף הזמין; חריגים: סוף פרק **גם כשיש הערות** (V23 open item!), שער, הערה ארוכה; gapContext v2.
13. **container-gap** — gap>120px LOW/>240px MEDIUM; exemptions: section-end-before-divider (תיקון pageClass!), last page; semantic classification נפרד ממדידה.
14. **Page underfill vs overfill** — invariant `scrollHeight ≤ clientHeight` לכל עמוד.
15. **Stretch overshoot** — clamp 20px (REQ-BAL-07).

## D3. הערות

16. **fn-overflow / fn-containment / fn-line-overflow / fn-page-overflow / fn-pn-overflow** — family complete מ־all repos; hard reject לא penalty-soft.
17. **Footnote late height change** — reserve/reflow telemetry; מדידה לפני/אחרי flush.
18. **Long footnote > page** — REQ-FN-02 split policy.
19. **Overlapping footnotes** — pairwise rects + push-down.
20. **Side-note misplacement after move** — anchor contract (REQ-FN-04).
21. **containment-rounding of marker** — vertical-align glyph bleed: סף 10px + סיווג semantic (לא להעלים! לתעד 10 חריגות rounding ולהכריע).

## D4. טיפוגרפיה ותווים

22. **Tofu/glyph-missing** — glyph coverage check per used chars × loaded fonts; remediation: swap/substitute + user report.
23. **PUA/U+E000 leak** — pre-render scrub (REQ-PAR-05) + pua-char kind (Yellow).
24. **Font not loaded / fallback chain** — FontFaceSet ready/check; getFontVal guard; ensureBuiltinFontsLoaded; selfhost+offline guard.
25. **River/spacing variance** — badness cap; AQ bounds.
26. **Baseline grid violation** — uniform line-height metric per page.

## D5. כותרות ומבנה

27. **Heading-at-bottom (<2 lines after)** — heading-escort kind (Yellow) + resolveParagraphCut matrix.
28. **H2 not starting fresh page** — contract test (page index & top geometry).
29. **H7 as side-note ignoring mode-h7** (F-13) — control must be wired; dead-control CI (REQ-GOV-04).
30. **Chapter numbering reset per part** — counters integration test.

## D6. גרפיקה

31. **ornament-overflow / ornament-overlap / ornament-asymmetry** (Gold kinds — להחזיר!) + fit budget.
32. **Divider height wrong** (Math.min rule) + divider missing/overlapping per state.
33. **Chain broken** (Yellow kind: sequence integrity of page chain).

## D7. ייצוא/סביבה

34. **Live-DOM vs exported HTML/PDF divergence** — parity harness (REQ-EXP-01).
35. **Renderer crash/memory/timeout** — readiness handshake, error logs, fingerprint; **CLI waitForFunction timeout root-cause** (V23 §A: predicate + init order, לא העלאת timeout).
36. **Non-determinism** — repeat check + inter-commit baseline.
37. **Environment non-coverage** — trigger-hit accounting; NOT EXERCISED marking (font/width/scale matrix).

## D8. governance

38. **Missing decision ledger** — schema validation + ledger/DOM parity + candidate score/capacity assertions.
39. **False-positive epidemics** — כלל 5 של Z.ai: pattern → check allowed-range/type-pair/threshold; 14 התיקונים של Z.ai הם אוסף הזהב של antis-patterns.
40. **Instrumentation perturbs layout** — proof obligation every tooling commit.

*(שורות 41–47: המשך ישיר מ־Layout_issue_catalog — cover: TOC overflow/stuck, stuckPages, settings-verification, text-completeness, h7-conversion accuracy, bracket-conversion accuracy, measurement-vs-render divergence — כולן מטופלות ב־REQ לעיל.)*

---

# חלק ה׳ — מרשם הפערים המאוחד (Gap Register) — מה מוסיפים מכל ריפו

> מהMonster §10.1, ממופה לפעולות המיזוג בתכנית העבודה. ✓=already in Orange base; ∅=port required.

| פיצ'ר | מקור | סטטוס בבסיס | פעולה | שלב |
|---|---|---|---|---|
| AutoQuality מלא (18 פקדים+11 מפתחות+מנגנון) | Gold | ∅ | Port שלם + בדיקת effect | S6 |
| fixDropWordInColumns | Gold | ∅ | Port + tests | S3 |
| rebalance2 אחרי parens | Gold | ∅ | Port | S5 |
| stretchBy{Word,Letter,Heading}Spacing stages | Gold | ∅ | Port כחלק מ־AQ | S6 |
| getLastLineInfo/getHeaderSettings/insertOrn | Gold | ∅ | Port | S8/S9 |
| audit: block-gap, ornament-* (3), settings-verification | Gold | ∅ | Port kinds | S1 |
| test-triggers corpus + runner (כולל תיקון Bug3: split('_') → mapping table) | Gold | ∅ | Port + fix | S1 |
| Issues-Screenshot-PDF (bookmarks, white bg, per-issue page) | Gold | ∅ | Port | S1 |
| engine-inputs/trace/diagnostics + diagnose bridge | Yellow | ∅ | Port | S1 |
| audit: chain-broken, empty-column, heading-at-bottom, pua-char | Yellow | ∅ | Port kinds | S1 |
| PR A/B compare + determinism self-test | Yellow | ∅ | Port workflows | S1 |
| allow-terminal-residual-fallback | Green | ∅ (אבד) | Restore | S5 |
| balance-chapter-end mechanism | Green | ∅ (אבד) | Restore | S5 |
| audit: container-overlap, tolerated-containment-rounding | Green | ∅ (אבד) | Restore kinds | S1 |
| geometry-audit CLI timeout root-cause fix | Green | פתוח | Fix per protocol | S1 |
| step-by-step causality audit מלא | Gold | חלקי (recordLayoutGeometryStage) | Complete stages+predicates | S1 |
| heading dividers enhanced / shaar dividers / h2-orn-scope / hdr-h1-title-mode / same_as_even / TOC wiring / page-num wiring / avoid-runt wiring | Orange | ✓ | Keep; add regression lock | S4 |
| selfhost fonts + offline guard exit7 + fingerprint | Orange | ✓ | Keep | S12 |
| ui-e2e iframe real index.html | Orange | ✓ | Extend per REQ-UI | S10 |
| font-picker preserve-missing-value | IMUD | ∅ | Port (+14 lines) | S4 |
| presets makom-bina-v20.5 | IMUD | ∅ | Port assets | S8 |
| tests/layout 21 scenarios + tests/features 8 suites + settings-effect scanner | IMUD | ∅ | Port as acceptance harness | S1 |
| folder assets import (webkitdirectory) | V2txt | ∅ | Implement | S8 |
| TOC count-numbering checkboxes | V2txt | ✓ wiring | Verify UI presence | S9 |
| 4-section back shaar / verso independence / atomic \uE000 / JSON box export / ensureBuiltinFontsLoaded / h2 orn modes / divider Math.min / last-line-align control | V4txt | חלקי | Audit each; close gaps | S4–S9 |
| Continuous footnote layout (fn-layout-mode) | V21 | ✓ partial | Complete+tests | S7 |
| Editing recommendations | V23 plan | ∅ | Build with proof | S11 |
| Word import (.docx) | Spec §12.3 | ∅ | Build | S11 |
| Crop marks + PDF bookmarks parity | Spec §13.1 | ∅ | Build | S12 |
| Worker engine + progress | Spec §5.3 | ∅ | Build | S10 |

---

# חלק ו׳ — הכרעות קונפליקטים (Conflict Ledger)

| # | קונפליקט | הכרעה | מקור |
|---|---|---|---|
| K-1 | תיקון אלמנה מייצר דלילות | מניעת אלמנה גוברת; אידיאל: נקודת חיתוך מלכתחילה (KP) | Spec §10.3 `[מ-מ]` |
| K-2 | איזון בדחיפת line-height מייצר כותרת-בתחתית | סדר: איזון→בדיקת כותרות→תיקון; מטריצת הגנות | Spec; Claude §2.5.4 |
| K-3 | הגנת סוגריים ↔ אלמנות | לולאה מאוחדת יחידה (B11) — לא שני מנגנונים נפרדים | V23 catalog |
| K-4 | מתיחה למילוי עמוד מלא מול סוף פרק קצר טבעי | **אין למתוח פרק קצר רק למילוי**; p-end רשאי להיות דליל | V23 catalog row |
| K-5 | CI ירוק מול ממצאים אמיתיים | אסור להשבית אבחון/להגדיל timeout עיוור; חסימת false positives רק עם כלל צר מנומק מהפונקציה | Protocol §1; V23 §A |
| K-6 | העברת קבצים/ניקיון מול תיקוני engine | commits נפרדים; אין לערבב | V23 כללי עבודה |
| K-7 | מיזוג V21↔V23 | נמנע; UNIFIED branch בלבד עם port-tracking | V23 Chat_01 פנייה 18 `[מ-מ]` |
| K-8 | HDR title mode default 'main' (חיתוך במקף) מול 'full' | 'main' כברירת מחדל (הכרעת עורך ב־Orange) + toggle | Monster §4.4(9) |
| K-9 | Google Fonts CDN מול self-host | self-host מוחלט (offline determinism) — הכרעת Orange | Monster §5.4 |
| K-10 | measuring-box נפרד מול Range.getClientRects | Range.getClientRects כמקור אמת לשורות | Z.ai כלל 5 |
| K-11 | jsdom testing | אסור למנוע המלא ב־jsdom (OOM F-03); vm+pure functions בלבד | Claude §6.4(1) |
| K-12 | שמירת קובץ רק לפי שם/גודל | אסור; dependency-map תחילה | V23 req 9 |
| K-13 | multiple first-word windows / multiple blocks | לא בעיה — להסיר מהדיווח | Z.ai כלל 6 |
| K-14 | candidate-vs-final כממצא עצמאי | הוסר (no-op) | Z.ai session 1 |
| K-15 | שמות kind | חובה עברית בתצוגה (GEOM_KIND_NAMES) | Working_rules כלל 1 |

---

# חלק ז׳ — ספים, ברירות מחדל, ומפת הגדרות (canonical defaults)

## Z1. Thresholds (קבועי מדיניות — כולם override-able בהגדרות)

| שם | ערך BRM | מקור/הכרעה |
|---|---|---|
| imbalance-max-delta | 5px | V23 catalog |
| sparse-pcut-width | <50% | V23 catalog |
| container-gap LOW/MED | >120 / >240px | Master §10 |
| containment tolerance | 10px (לא 5; לא 42) | Z.ai fixes; final clamp 20px overshoot |
| side-note containment | 20px | Z.ai fix |
| bracket-conversion prefix norm | 5 chars + quote-normalize | Z.ai fix |
| text-completeness skip | punctuation/bracket content | Z.ai fix |
| rounding tolerance markers | ≤10px vertical bleed, no overlap/clip | V23 open question — להכריע עם דוגמאות |
| widow/orphan minimum lines | 2 | Spec |
| heading escort lines | 2 (H1–H6; H7 exempt) | Spec/Z.ai |
| dropword minimum paragraph lines | 2 (barrier: 3 configurable) | Spec |
| AQ word-spacing range | 0.95–1.05 | Gold |
| light-change debounce | 350–400ms | Spec §5.3 |
| page-size default | A4 (types extensible) | Spec §14.4 |
| grid % defaults | col 40% / margins 7.5% / gutter 2% / gap 2% (normalized to 100) | Spec §6.10 |
| vertical defaults | top 20px / bottom 20px / h2-extra-top separate | Spec |

## Z2. Panel architecture (לוח ההגדרות המאוחד — 12 פאנלים)

מבנה לפי בקשות המשתמש המפורשות (Mapping פנייה 2) — החלוקה הסופית:

1. **ערכות נושא, שערים ורקעים** (כולל רקעי עמודי תוכן — מוזג מפאנל 6; ערכות מאוחדות; הצג שער משנה; בוררים ויזואליים).
2. **בונה ערכות נושא (SVG Builder)**.
3. **ייבוא תוספים** (custom pages/styles/images JSON; folder pick).
4. **הערות שוליים וסיום** (כולל 3 התוספות: 1/2 טורים, איפוס מונה, כותרת+עיטורי צד; f/s-note-body fonts; last-line align).
5. **איכות עימוד** (widow/orphan toggles **נפרדים** לתחילת/סוף עמוד; balance-chapter-end; AQ sub-panel מלא).
6. **טיפוגרפיה וגוף הטקסט** (גופן/גודל/line-height 1.2–1.6 [פלפול 1.25 / קריאה 1.45]; first-word: mode/length/threshold; ד"ה; **הועבר מפאנל 10**).
7. **כותרות 0–7** (per level: mode/font/size/extra; h2-orn-scope; hdr-h1-title-mode; mode-h7 honored).
8. **עיטורים וגרפיקה** (פאנל ייעודי חדש: שער ראשי/משנה, H2 עליון/תחתון/צד + fit-to-text, H3 צד, סיום פרק, מפרידי H3–H6, shaar dividers; לכל אחד רוחב+גובה).
9. **כותרות עליונות** (3×2 areas: type/align/font/size/width%; recto/verso toggle; same_as_*; dedicated H2/H3 page headers; separator line).
10. **תוכן העניינים** (רמות 1–7 show/inline; general+detail; count/show numbering).
11. **רשת העמוד ומספור** (grid %, h2-top-offset, gutter asym, divider style, page size, folio: format/frame/position/start-value/initial-value, which pages count/show).
12. **מתקדם/מנוע** (thresholds table Z1, diagnostics toggles, trace verbosity, offline guard).

## Z3. Data contracts

- `default_settings.json` superschema: superset איחוד 264 keys (IMUD∪Gold∪Green∪Orange) + 11 aq-* + restored lost keys = **~280 keys**, כל key משויך לפאנל+type+range+effect-test-id. Version field + migration function per version bump.
- JSON asset schemas unchanged (byte-identical 5/5) + `box{}` embedding + theme-set grouping (`set_id`).
- Trace/report schemas: v2 (gapContext, lifecycle states, fingerprint, coverage accounting, trigger-hit matrix).

---

# חלק ח׳ — דרישות המשתמש הכרונולוגיות (User Requests Ledger) — המקור העליון

> ריכוז **כל** הבקשות/האישורים שהמשתמש נקב בשיחות, עם מקור ומצב. זהו הסעיף שממנו נגזרות הדרישות; שום פיצ'ר לא נכנס/יוצא בלעדיו.

## U-A. דרישות קבועות של V23 (Session_handoff "אין לאבד") `[מ-מ]`

| # | דרישה | מצב במיזוג |
|---|---|---|
| U-A1 | ממצא סיבתי לפי שלבי עימוד (definition of element, not location) | REQ-GOV-01 |
| U-A2 | תיעוד כל רכיב שנוסף/הוסר/הוזז/שונה בין הופעה לחשד | REQ-GOV-01 |
| U-A3 | 10 states lifecycle differentiation | REQ-GOV-01 |
| U-A4 | predicate לפני/אחרי; אחרת — לדווח אי־ודאות, לא להמציא | REQ-GOV-07 |
| U-A5 | בידוד פרקי H2 כהמשך; השוואה לפי token identity+settings hash | REQ-GOV-02 |
| U-A6 | very_long_test_text.txt קנוני; fixtures משלימים | REQ-GOV-02 |
| U-A7 | הוכחת דטרמיניזם + מכשור לא משנה פריסה | REQ-GOV-03/01 |
| U-A8 | לא להמתין לCI; קישורים; המשתמש יודיע | REQ-GOV-08 |
| U-A9 | אין מחיקה לפי שם; decorations.js פעיל | REQ-GOV-10 |
| U-A10 | עברית, מבוסס ראיות, לא לטעון בלי ראיה | §0.3 |

## U-B. דרישות V20/combined (Claude §6.3) — חלקן **טרם יושמו** וחובה במיזוג `[מ-מ]`

| דרישה | מצב |
|---|---|
| פיצול לוח ל-2; סימני מעבר עמוד בעורך; גלילה בלחיצה; הרחבה/כיווץ; ייבוא קובץ; זום fit-width | ✓ L-A; להעביר לבסיס |
| כותרות מתחלפות recto/verso + יישורים + גופנים | ✓ V4 |
| hdr-title-split toggle | ✓ |
| fit ornament width to H2 text | ✓ JS sync |
| divider bottom edge calc(100%−8px) | ✓ |
| אין עימוד אוטומטי מכל שינוי | ✓ + F-06 audit |
| שמירת מיקום תיבת שער ב־JSON | ✓ V4 |
| **גובה מילה ראשונה מיושר לגוף** | ✗ → REQ-LB-05 |
| עיטורי H3 מיושרי מרכז גופן; מרווחי H2 שווים | ✓ (margin-top −0.08em) |
| גודל עיטור סוף פרק לפי הגדרות | ✓ |
| קו מפריד כותרת/גוף | ✓ |
| font+align להערות (f/s-note-body, body-last-line-align) | ✓ |
| עיטור נפרד לסימן ולכותרת 2 כולל צדדי | ✓ V4 |
| התחלת מספור בערך אחר; count/show per type | ✓ + restore initial-value |
| **שערי JSON מאוחדים (ערכה)** | חלקי (F-10) → REQ-ORN-06 |

## U-C. בקשות מפורשות מ־Mapping_Upgrade_Panel (פנייה 2) `[מ-מ]`

1. איחוד שערים לפי ערכה + תמונת שער ראשי; 2. כפתור "הצג שער משנה"; 3. 3 הגדרות הערות (טורים/איפוס/כותרת+עיטור); 4. widow/orphan כטוגלים נפרדים תחילת/סוף עמוד; 5. מיזוג פאנל רקע לתוך נושאים; 6. פאנל עיטורים ייעודי + רוחב/גובה + fit-to-text; 7. כותרות עליונות: כל יישור ל-3 חלקים + רוחב% + toggle מתחלפות; 8. העברת גופן גוף/מילה ראשונה לפאנל טיפוגרפיה + line-height + first-word modes + ד"ה; 9. h2-top-offset נפרד + divider style choice; 10. folio controls מלאים + מסגרת; 11. **כל** חלק ג' של ההצעות (modes H0–H7, note numbering styles, note rule styles, header sources, l-align, widow strictness levels). → ממופה לפאנלים Z2 ול־REQ הרלוונטיים.

## U-D. בקשות/הנחיות מ־Z.ai transcripts (ברירה) `[מ-מ]`

- שמות בעיות בעברית; הדלקת highlightIssue לכל הדיווחים; הגדרות בקבצי המערכת לא בקובץ דיבאג; תמונות/שמות בבוררים; PDF issue-report לתיקיית repo בלי zip שלם; לא להשתמש בשרת מקומי — GitHub Pages; עימוד דרך Pages לאימות; דוח Release Notes; export HTML **זהה לחלוטין** למרונדר; בדיקות טריגרים אוטומטיות בCI; "אין צורך בהודעות שגיאה מיותרות"; טקסט בדיקה מגוון יותר (corpus expansion); מציאת בעיות בלי פיענוח תמונות (geometry-first doctrine); מחקר דרכים מקובלות (Knuth/TAG/InDesign research integrated); שמירת כל הבאגים before push; false-positive deep investigation per case (14 fixes).

## U-E. בקשות/הנחיות מ־ChatGPT transcripts (ברירה) `[מ-מ]`

- אין למזוג V23↔V21; מנוע מאורגן/דטרמיניסטי/שקוף; דוח אבחון בלחיצה אחת (engine-diagnostics); parallel step-by-step audit proposal; בידוד פרקים; fixtures קצרים כמשלימים; target tracing לעמוד 376; sparse-page exclusion לסוף פרק עם הערות; הערה ארוכה split investigation; [a][b] consecutive brackets; container-gap semantic; rounding adjudication; square-bracket scope; worklog+registry per commit; docs organization map.

## U-F. החלטות מוסדרות נוספות

- p-cut justified (המשתמש תיקן את הAI: "p-cut מוגדרת כראוי ליישור דו־צדדי") `[מ-מ]` Chat_05.
- כותרות ארוכות חורגות שורה 2 — לא נבדק (U: "אין צורך לבדוק") `[מ-מ]` Chat_03.
- אותו מספור עמודים התייחסות (המשתמש תיקן הנחת AI) `[מ-מ]` Chat_06.
- "דריכה במקום" → דרוש התקדמות מהותית, לא אישורון `[מ-מ]` Chat_06.

---

# חלק ט׳ — ארכיטקטורה יעד (Target Architecture)

## T1. Pipeline (מנוע = שכבות עם checkpoints קבועים)

```
INPUT(raw text/files)
 └─ L1 Parser(DFA): metadata(header-only) → tokens(H0-7,P,notes,endnotes,editorial) → AST
     ├─ checkpoint CP1: token inventory + hashes (content-preservation baseline)
 └─ L2 Style-prepass: paren-scope map(global) → paren styling → custom-style application → fonts-ready
     ├─ CP2: styled-token geometry inputs (font,size per token BEFORE measuring)
 └─ L3 Line-planner(KP): per-paragraph optimal breaks via MeasureAPI (math impl primary, DOM oracle secondary)
     ├─ CP3: line boxes {words,x,w,h,badness,looseness}
 └─ L4 Page-planner(Multi-Column DP): page templates by type → column fills w/ footnote budget → candidates w/ capacity+context scoring → protections matrix
     ├─ CP4 per stage-event: balance/justify/shrink/reclaim/notes-insert/divider-fit
 └─ L5 Decoration pass(sync, no geometry change): ornaments fit, dividers, headers, folio, TOC pagination
     ├─ CP5: final geometry snapshot
 └─ L6 Render(Worker→DOM) + Print/Export projection (single source: geometry model)
```

**Invariant חובה:** L5 לעולם לא משנה גובה של מה ש־L3/L4 מדדו (לקח F-08/376: "כל אלמנט שצורך גובה חייב להיות ב-DOM ובגודלו הסופי לפני חישוב used"). `[מ-מ]` Claude §6.4(4)

## T2. Module map (פירוק typesetter.js ה־6.3K שורות — according to V23 Chat_07 architecture plan + Orange LAYOUT_DEPENDENCY_MAP)

```
src/engine/
  parser/{dfa-lexer, bracket-scanner, block-tokenizer, metadata, ast-model}.js
  typography/{measure-api, harfbuzz-runner, font-metrics, kp-linebreak, glue-tables, protectors(runt,marker,abbr)}.js
  layout/{page-templates, column-flow, candidate-generator, scorer(capacity+context+penalties), dp-planner, protections-matrix, balancing(chapter-end,H3,AQ-stretches), footnote-budget, endnote-pages, sidenotes, headings-escort, dividers-state, rollback-snapshot}.js
  decoration/{ornament-fit, shaar-boxes, headers-builder, folio, toc-builder}.js
  output/{dom-renderer, html-export, pdf-print-css, geometry-model}.js
  core/{pipeline(checkpoints), settings-registry(single source), event-log(trace), decision-ledger, invariants}.js
src/audit/{kinds-catalog(30+), predicates/, trace-collector, coverage-accountant, screenshot-pdf, report-schema}.js
src/ui/{tabs, panels(z2-map), pickers-visual, drag-shaar, debug-panel, progress, worker-client}.js
```

**Contract:** `core/settings-registry` הוא מקור־האמת היחיד: פקד←→מפתח←→consumer←→test (REQ-GOV-04 enforced mechanically).

## T3. Determinism & environment

- Self-hosted fonts only; FontFace loading awaited; Chromium pinned (Playwright 1.55.0); scale factor explicit; offline guard exit 7; fingerprint recorded per report; seeds for anything randomized (אין — zero randomness policy).

## T4. Performance targets

| יעד | ערך | מדידה |
|---|---|---|
| 639-page document typeset | ≤ 45s warm | perf budget CI |
| Memory peak | ≤ 1.5GB | process monitor |
| Incremental retypeset (light change) | ≤ 2s | timer |
| Measure calls cached | getLinesFromParagraph memoized | hit-rate ≥90% |

---

# חלק י׳ — Non-functional & מסירה

- **מקומי+אופליין על Windows** (file:// + local assets), Web-ready architecture (no server coupling) `[מ-מ]` Spec §15.15–16.
- **טווח 10–1,000 עמודים** `[מ-מ]`.
- **Browser support:** Chromium (production target) + Firefox best-effort; print via Chromium headless.
- **Accessibility:** semantic main/aside/nav, ARIA contenteditable, labeled buttons, contrast ≥ AA, keyboard nav (fresh audit; historical ACCESSIBILITY.md ≠ proof) `[מ-מ]` Master §9.4.
- **Security:** CSP, sanitized SVG, validated JSON imports, no eval, path-safe folder import `[מ-מ]` §9.5.
- **Licensing:** OFL fonts bundled; assets attribution file.
- **Documentation deliverables per release:** README current-branch truth (lesson: stale READMEs across repos), WORKLOG, OPEN_QUESTIONS, PROVENANCE, RELEASE NOTES (user asked explicitly), AI_WORKFLOW/handoff prompt.

---

# נספח 1 — GEOM_KIND_NAMES מאוחד (עברית) — 30+ kinds

widow=אלמנה · orphan=יתום · sparse-line=שורה דלילה · imbalance=אי-איזון טורים · containment=גלישת תיבה · containment-rounding=גלישת עיגול · overlap=חפיפה · page-overflow=גלישת עמוד · page-underfill=עמוד דליל · block-gap=מרווח בין בלוקים · fn-overflow=גלישה לאזור הערות · fn-containment=הערה חורגת · fn-line-overflow=שורת הערה חורגת · fn-page-overflow=הערות גולשות מעמוד · fn-pn-overflow=הערה×מספר עמוד · pn-overflow=גלישה למספר עמוד · footnote-overflow=הערות חורגות מאזור · ornament-overflow=עיטור חורג · ornament-overlap=עיטור חופף · ornament-asymmetry=עיטור א-סימטרי · heading-escort=כותרת בתחתית טור · orphan-heading-block=בלוק עם כותרת אלמנה · private-use-chars=תווים פרטיים · tofu=טופו · font-not-loaded=גופן לא נטען · settings-verification=הגדרה לא הוחלה · text-completeness=שלמות טקסט · h7-conversion=המרת H7 · bracket-conversion=המרת סוגריים · note-marker-line-break=סמן הערה בסוף שורה · container-gap=פער במיכל · container-overlap=חפיפת מיכל · sparse-page=עמוד דליל · square-bracket-scope=טווח סוגריים מרובעים · square-bracket-unmatched=סוגריים לא מזווגים · structural-fallback=חילוף מבני · side-note-overflow=כותרת צד חורגת · chain-broken=שרשרת שבורה · empty-column=טור ריק · heading-at-bottom=כותרת בתחתית · pua-char=תו PUA · **new:** capacity-limited-residual=איזון מוגבל־קיבולת · rollback-compromise=פשרת נסיגה · coverage-not-evaluated=ללא כיסוי.

# נספח 2 — Test corpus manifest

canonical `very_long_test_text.txt`(5,702L, sha 5e73b913…) · very_long_test_text_2 · ch63_final_paragraph_failure_case · chapters_focus/ · fixtures: capacity-before-h3, section-end-before-divider, consecutive-notes, long-footnote-split, nested-parens, cross-column-parens, mid-doc-metadata-like-line, single-word-paragraph, heading-run, toc-stress, verso-headers, dropword-align, qa-modes(3), aq-on-off, folder-assets-import, docx-sample, shaar-set-roundtrip, print-parity, offline-guard, determinism-repeat, trigger-matrix(Gold test-triggers 6 kinds), 21 IMUD scenarios, 8 IMUD feature suites.

# נספח 3 — Decision log (D-series, מחייב תחזוקה)

D-01 בסיס=Orange · D-02 pipeline שכבתי T1 · D-03 MeasureAPI dual-impl · D-04 hard-reject overflow · D-05 unified retreat loop · D-06 selfhost fonts · D-07 three-layer settings contract · D-08 Hebrew display names · D-09 canonical corpus · D-10 no V21/V23 direct merge · D-11 instrumentation no-op proof · D-12 archive-not-delete heritage · D-13 panel architecture Z2 · D-14 thresholds Z1 · D-15 lifecycle states vocabulary · D-16 editing-recommendations require dry-run proof · D-17 DOCX import via mammoth (client-side) · D-18 PDF via print-CSS (Chromium) + bookmarks from outline model · D-19 worker engine with staged progress events · D-20 CI gates per phase (see work plan).

*סוף מסמך האפיון. מסמך שלב 2 (תכנית העבודה) מחלק את מימוש כל ה־REQ לעיל ל־13 שלבים עם שערי כניסה/יציאה וצ'קליסטים.*
