# MONSTER_24_CHECKLIST.md — רשימת "לא לשמוט" מתוך Monster_Comparison_All_Repos_Branches.md §10.2

> **מקור:** `Typesetter_doc/shared/comparisons/Monster_Comparison_All_Repos_Branches.md` (סעיף 10.2 —
> "אי-התאמות ומינורים שנתפסו", 24 סעיפים). הועתקה לתוך RED ב-05.11 כדרישת סגירה של
> S4.6-7 (תכנית העבודה): **"יש להעתיק את רשימת 24 הפריטים ל-spec/MONSTER_24_CHECKLIST.md
> ולסגור פריט-פריט עם הפניית בדיקה."**
>
> **כלל סגירה:** כל סעיף מהמקור ההיסטורי מקבל כאן disposition מפורש — הוכחה שהמחלקה
> שתועדה בגרסאות הקודמות **אינה קיימת ב-RED** (עם הפנייה לבדיקה/מנגנון חי), או
> החלטה מתועדת מפורשת. אין "לא רלוונטי" בלי נימוק.

| # | הסעיף (מהמקור) | מצב ב-RED | הראיה |
|---|---|---|---|
| 1 | README של Yellow מציג "v10" לענף V22; הוראות push ל-V15 | **נעול מבנית:** תיעוד-אמת הוא שער קבלה (S13.2 "Docs truthful"); RELEASE_NOTES.md מתעדכן לכל מסירה; README מתאר את היכולות הנוכחיות בלבד | S13.2 gate; RELEASE_NOTES.md; OPERATIONS.md |
| 2 | שני ריפואים מתארים את עצמם "Orange" (זהות כפולה) | **זהות יחידה:** חבילה אחת (red-build), PROVENANCE מגדיר מקור יחיד; אין שמות-עט כפולים | PROVENANCE.md; package.json |
| 3 | default_settings של IMUD-main ≡ V20.1 ≡ V20.2 (hash) — העדפות לא עודכנו מאז הפיצול | **נעול כעובדה:** וריאנט v21-glm ≡ main נעול בבדיקה (אפס הבדלי מפתחות/ערכים); כל וריאנטי המקור מיובאים lossless | tests/integration/source-variants.test.js (עובדה היסטורית נעולה) |
| 4 | IMUD-main ≡ Gold בהגדרות אך מנועים שונים (90–92 hunks) | **אין מנועים מקבילים:** מנוע יחיד; פרופיל המורשת הוא חוזה בתוך אותו מנוע (dispatch אחיד); חוזה הגדרות תלת-שכבתי מוכיח שכל מפתח מחובר למנגנון | registry 8/8 (dead-control=0); pipeline.js dispatch; scanner artifacts |
| 5 | geometry-audit.js נעלם מ-V20.3/V20.4/V20.5/main (קיים רק ב-V20.1/V20.2) | **האודיט חי ומחייב:** s14-layout-audit (52 קביעות בשרשרת npm test) + אודיט גיאומטריה בדפדפן אמיתי ב-CI (tools/layout-audit) | s14 52/52; .github/workflows/layout-parity.yml |
| 6 | ל-IMUD אין renderer.html/bridge — אי אפשר CLI audit; תלוי Playwright בלבד | **נתיבי רינדור מלאים ללא דפדפן:** dom-renderer + פרויקטור גיאומטריה + ייצוא PDF/HTML כולם ב-Node; הדפדפן הוא השלמה בלבד | s12-export 26/26 (Node); s14; EXT-21 |
| 7 | 2 מפתחי Green (`allow-terminal-residual-fallback`, `balance-chapter-end`) + 2 kinds (`container-overlap`, `tolerated-containment-rounding`) אבדו בהעברה ל-Orange | **כולם חיים:** שני המפתחות רשומים עם צרכנים חיים; ההפרדה הסמנטית containment אמיתי מול עיגול-10px (non-finding) קיימת בקטלוג הממצאים | settings-registry (שורות 133–134: consumers מחייבים); src/audit/report-schema.js ('containment', 'containment-rounding'); s5-s6 17/17 |
| 8 | 11 מפתחי AQ קיימים ב-IMUD ללא כל מנגנון AQ (העתקת whole-file מ-Gold) | **AQ מחובר במלואו:** משפחת aq-* רשומה עם consumers + בדיקות אפקט (fx:aq-on); המנגנון בפרויקטורים וב-pipeline | registry 8/8; s10 (fx:aq-on); s5-s6 |
| 9 | `avoid-runt-word=true` ב-5/5 אך `applyAvoidRuntWord` ב-3/5 בלבד — הגדרת שווא | **מחובר:** runt מחובר לקנס ה-KP (S4.5) ונמדד בפרופיל המורשת (avoidRunt); בודק runt תוקן ב-EXT-11 עם בקרת-כפול | legacy-imud-flow (avoidRunt); s5-s6; NC-18; canonical |
| 10 | `fn-layout-mode` ב-IMUD פעם אחת (port חלקי) לעומת 2 ביתר | **מומש במלואו:** enum block/continuous עם שני צרכנים חיים (dp-planner + dom-renderer) | settings-registry:117; s7-notes 15/15 |
| 11 | `reference-analysis.json` ∅ ב-IMUD | **קובצי הייחוס חיים בבסיס העבודה:** audits/דוגמא מגרסא ישנה*.pdf (עם סימוני בלוקים/פסקאות/שורות) + layout-reference.json; הגיאומטריה המדודה מהם מוטמעת בפרופיל המורשת | audits/; legacy-imud-flow (קבועי GEO מהמדידות); EXT-13 |
| 12 | כפילות `fonts/fonts/` (138.7MB) נשמרה ב-4 ריפואים | **אפס כפילות:** 443 קובצי TTF (62MB) פעם אחת; בדיקת ייחודיות קבצים מחייבת | real-fonts (קבצים ייחודיים; כפילויות-מקור מתועדות בלבד) |
| 13 | `Guttman-Rashi-Normal.woff2` מונח בשורש ב-Yellow בעוד style.css מפנה ל-`fonts/` — הסתעפות נתיב | **נתיב אחיד:** כל הגופנים תחת `ui/assets/imud/fonts/` + קטלוג מפה יחיד (family→file); אין קבצים בשורש | real-fonts (catalog integrity); imud-library (byFamily) |
| 14 | שרידים: קובץ `1` (Parallel_Programming), קומיט "Create 1" | **אפס שרידים:** סקירת ריפו (P1-8: "1" נמחק, dbg→archive/); אין קבצים ריקים/מיותרים | P1-8 (ISSUE_REGISTRY); סקירת ריפו |
| 15 | only_Orange CSS classes שנשמטו מ-IMUD: `h2-title-ornament-top/bottom`, `header-ornament-wrap`, `hdr-txt`, `layout-full-width-terminal-residual`, `tabs-not-ready` | **המנגנונים חיים במנוע (לא רק ב-CSS):** עיטורי H2 עליון/תחתון (h2-orn-* + legacy-ornaments + ornament-ink); עיטורי כותרת (hdr-orn); פס-חוצה-טורים למצב full-width (span_1col — EXT-24); הטאבים נבנים מהרישום | s8 48/48 (ornaments); EXT-24 (s14 D); s10 (tabs מ-bindings) |
| 16 | IMUD: אין `.github/workflows` — אין CI על הריפו החי | **CI מלא:** שני וורקפלואים (ci.yml: כל הבדיקות + poppler fail-fast; layout-parity.yml: קורפוס על + דפדפן אמיתי) | .github/workflows/*; EXT-1 (התקנת poppler מחייבת) |
| 17 | Baselines שונים על אותו קלט: Green 27 מול Orange 39 (12 MEDIUM לא הוכרעו) | **מטריצת קבלה יחידה + אמת מוחלטת:** s13-matrix (6 תצורות × 3 נתיבים) + C1..C12 אינווריאנטים מוחלטים על הקורפוס הגדול; כל ממצא שנותר אמיתי ומתועד ב-ledger (EXT-11: 17 ממצאים, אפס אבחוני-שקר) | s13-matrix-report.json; layout-parity (very-long-corpus C1..C12); EXT-11 |
| 18 | V20.3/V20.4 settings חתוכים ב-22 שורות; PROVENANCE מתעד "קבצי נתונים ריקים" | **הווריאנטים החתוכים מיובאים lossless:** v20.4 ⊂ main נעול (חיתוך בלבד, אפס שינויי ערכים); v19/makom-bina עם שדות ההעלאה שלהם | tests/integration/source-variants.test.js (6/6) |
| 19 | `settings-manager.js` ≡ ב-4/5 אך IMUD deviated (+14L) — סיכון התנגשות reverse-port | **מקור יחיד:** settings-registry + importImudSettings (טבלת disposition) — אין manager מקביל; היבוא מכוסה בבדיקות על כל הווריאנטים | imud-migration 11/11; source-variants 6/6; setting-sets 5/5 |
| 20 | `decorations.js`: Yellow ≠ Green (19 hunks); Gold~Orange 2 hunks — מנגנונים מקבילים | **נכתב מחדש כמקור יחיד:** page-decorations + ornament-ink (דיו יחיד לשלוש ההקרנות) + asset-registry (רישום דו-צדדי) + legacy-ornaments (תכנון) | s8 48/48; EXT-4 (S4.21 סגירת שארית) |
| 21 | `index.html` V20.3/V20.4 ≈960 שורות (פיצול HTML) — נסיגה מתועדת | **UI נבנה מהרישום (לא HTML ידני):** bindings.generated.js מה-settings-registry; 4 טאבים + 12 פאנלים מרונדרים מאותו מקור | s10 42/42; registry 8/8 (dead-control=0) |
| 22 | `renderer.html` Yellow≡Gold ≠ Green≠Orange — fork שינה טעינת נכסים | **רינדרר יחיד ללא fork:** dom-renderer + geometry-projector/legacy-projector מאותו מודל (D-73: מקור גיאומטריה יחיד; parity live≡export מוכח) | s12-export 26/26 (parity); EXT-3 (cross-path); s14 |
| 23 | שני ארכיטיפי מנוע חיים במקביל: 22 פונקציות IMUD מול 95 של Orange — לא אוחדו | **אוחדו בכפוף לחוזה:** מנוע אחד; פרופיל המורשת = פורט נאמן עם גיאומטריה מדודה מקובצי הייחוס (החלטה מתועדת — הייחוס הוא המפרט); נתיב DP לעימוד הכללי; שניהם מאותה כניסה | pipeline.js dispatch; legacy-imud-flow; parity HARD 4/4 + P7 |
| 24 | `package.json`: שני מזהי חבילה לאותו מנוע (imud-torani@23 מול tora-book-typesetter-unified@23); ל-Yellow אין כלל | **חבילה אחת עם הפרדה פנימית מוכחת:** UI ו-engine חבילות נפרדות (D-65/D-75: הבאנדלר לא מושך את המנוע) | s10 ('הפרדה: אצרור האפליקציה בלי המנוע'); package.json |

## מצב

**24/24 סגורים** (05.11.2026). כל סעיף נסגר באחת משלוש דרכים:
1. **נעול בבדיקה** — קיים test/CI מחייב שהיה נכשל אם המחלקה הייתה חוזרת (רוב הסעיפים).
2. **מנגנון חי עם הוכחה** — הקוד המקביל קיים ומחובר לצרכן (סעיפים 7–10, 15, 20, 22).
3. **עובדה היסטורית נעולה** — השוואת הווריאנטים מתועדת כבדיקה (סעיפים 3, 18).

אין סעיף "לא רלוונטי" ללא נימוק; אין סעיף פתוח.
