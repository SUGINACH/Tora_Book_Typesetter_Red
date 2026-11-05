# SESSION_HANDOFF.md — קובץ מעבר בין סשנים · Tora Book Typesetter Red
> **מטרה:** הסנדבוקס של העוזר מתאפס בין הודעות/סשנים. קובץ זה הוא
> זיכרון-העל: מהלך השיחה, מצב הפרויקט, החוקים והצעדים הבאים. **יש לקרוא
> אותו ראשון בכל סשן חדש** (git pull && cat ai-chat/SESSION_HANDOFF.md).

**עדכון אחרון:** 05.11.2026 — S4.26 (דיווח משתמש "7 בעיות" → תיקוני שור;
אודיט מלא 0 בעיות) + דיפלוי לחי (main + gh-pages + live-audit)

---

## 1. חוקי ברזל (מהמשתמש — לא להפר!)

1. **0 בעיות עימוד היא התוצאה המקובלת היחידה.** כל הסיבה לפרויקט היא
   לתקן את בעיות העימוד שלא תוקנו בגרסת התוכנה הקודמת. אין "כמעט",
   אין "סביר", אין פשרות.
2. **כל דחיפה ותיקון כוללים בנייה מחדש של Pages** (ענף gh-pages) —
   האתר החי חייב לשקף את main מיד אחרי הדחיפה, בלי גרסה מיושנת.
3. **הסנדבוקס מתאפס בין הודעות** — כל תיקון ודחיפה חייבים להסתיים
   **באותה הודעה**. מה שלא נדחף — אובד.
4. **בדיקות מתמשכות דרך GitHub Actions בלבד** (לא מקומית אצל העוזר):
   `.github/workflows/full-math-audit.yml` — רץ על כל push ל-main
   (local) + בדיקה ויזואלית על האתר החי (live). CI הקיים (ci.yml) מריץ
   את מלוא הבדיקות; layout-parity מריץ את הקורפוסים.
5. **טוקן GitHub:** המשתמש מסר טוקן (05.11, "המשך במרץ") והורה במפורש
   לשמרו — הוא נשמר **בסנדבוקס בלבד**:
   `/home/z/my-project/.secrets/github_token.txt` (chmod 600, מחוץ
   לריפו הפומבי!). **אסור בתכלית להדפיסו או להעלותו לריפו.** אם נמחק
   באיפוס — הטוקן מופיע גם בסיכום-העל של הסשן בשיחה; לשחזר לקובץ
   לפני כל דחיפה.

## 2. הפרויקט בקצרה

- **ריפו:** `SUGINACH/Tora_Book_Typesetter_Red` (פומבי). **ענפים:**
  `main` (קוד+בדיקות+כלים) ו-`gh-pages` (orphan: ה-UI הבנוי בלבד).
- **אתר חי:** https://suginach.github.io/Tora_Book_Typesetter_Red/
- **מבנה:** `red-build/` (מנוע + UI + בדיקות, אפס תלויות), `tools/`
  (בונדלר, אודיטים, parity), `audits/` (קורפוסים, בהם `very_long_test_text.txt`
  — 3.4MB → ~704 עמודים), `spec/`, `ai-chat/` (יומני שיחה).
- **עקרון מפתח:** נתיב ה-legacy (IMUD) = התנהגות המקור היא המפרט
  **למעט הוראות משתמש מפורשות** (D-91: הערות רציפות/מספור פר-פרק/
  מילוי-עמוד/גופנים); התצוגה = הייצוא (דיו זהה ב-DOM וב-PDF); כל תיקון
  מגובה בסוויטת בדיקות + מסופק ב-WORKLOG.md + ISSUE_REGISTRY.md.

## 3. מהלך השיחות (תמצית)

| שלב | מה קרה | מזהה |
|---|---|---|
| 02-04.11 | הקמת הפרויקט, מנוע legacy מכויל מהייחוס, S4.1-S4.22, EXT-1..20, FWD-1..4, D-39..89 | ראה WORKLOG.md |
| 05.11 | **S4.23-S4.24:** האודיט המתמטי המלא (21 משפחות בדיקות דיו) מצא 200 בעיות; שישה תיקוני שור → **0 בעיות** (696 עמ', 42,720 שורות). פריסה לחי | S4.24 |
| 05.11 | **S4.25:** layout-parity אדום אחרי הדחיפה — שקרי-בודק (C7 כותרות עטופות, C10 הערות מפוצלות); verify-corpus.py תוקם; המנוע לא נגע. כל ה-Actions ירוקים (CI + parity + full-math-audit מקומי וחי + Pages) | S4.25 |
| 05.11 (המשך) | **S4.26 — דיווח משתמש "עכשיו זה נראה יותר טוב, כמה בעיות" (7):** (1) מרכוז אנכי של טקסט-מוסגר; (2) חלון מילה-ראשונה שקוע; (3) הערות ארוכות שלא ממלאות את העמוד (→ עמוד שלישי); (4) הסרת אות-סימון מהמשך; (5) ברירות מחדל: רציפות + יישוב-דו-צדדי + מספור פר-פרק (H2); (6) גופני ברירת המחדל; (7) החלה מלאה של ברירות המחדל. כולם תוקנו בשורש (פירוט בסעיף 4). אימות מקומי: 540/540 בדיקות; אודיט מלא על הקובץ הגדול **0 בעיות** (704 עמ', 43,011 שורות, דטרמיניזם זהה); קורפוס C1-C12 ‏12/12; parity HARD ‏4/4 (ציון 88.9%). פריסה: ?v=2026-11-05-s4.26 | S4.26 |

## 4. S4.26 — שבעת תיקוני השור (ההטיות מהמקור מתועדות ב-D-91)

| # | דיווח המשתמש | תיקון |
|---|---|---|
| 1 | טקסט מוסגר ממוקם גבוה | `parenCenterRaisePx` (legacy-imud-flow, מיוצא): מרכז גובה הסוגריים = מרכ�ד גובה הגוף לפי מודל תיבת-השורה (ascent−0.2)/2·Δsize — כ-0.7px במקום 5.28px. DOM: pg.ascentEm מהמודל; PDF: placeWords מבחין smallKind paren/marker (סמן נשאר super 0.33×) |
| 2 | חלון מילה-ראשונה לא קיים | שורה 1 של פסקת-חלון עוטפת את החלון (windowW גם בשורה 1; DOM: right=windowW + class line--window-wrap; PDF: lineW=col.w−windowW). האודיט פטור מ-INK_NOT_JUSTIFIED/LAST_* לשורות אלה |
| 3 | הערות ארוכות לא ממלאות את העמוד | תקרת המרזב = קיבולת העמוד (FLOW_H−38.5−21.44 → 51 שורות; fn-bar-max-height-px=0 ⇒ אוטומטי; ערך מפורש נחתם). ערך מובטח: שורת-גוף אחת לפחות בעמוד פתיחה רגיל (מנע לולאת-ריק) |
| 4 | הסרת אות-סימון מהמשך | cont ⇒ בלי סמן ('(המשך)' בלבד) — fnItemsFor/fnFlowFor; פריט טרי שנחתך שומר את מספרו (num) לעמוד הבא |
| 5 | רציפות + יישוב + מספור פר-פרק | fnFlowFor: זרימה אחת לכל הערות העמוד (רווח-כפול בין הערות; סמנים בגודל רישום בתוך הזרם); יישוב דו-צדדי בשורות הביניים, אחרונה לימין (DOM+PDF). מספור: fnNoteNumbers פר-פרק, איפוס ב-h2/h0; page שומר התנהגות היסטורית |
| 6 | האתר לא משתמש בגופני ברירת המחדל | כינויי-קטלוג אנגליים → קבצים מוטמעים: 'Guttman Rashi' (הגוף — מוכח מהייחוס: 3,182 שורות GuttmanRashiNormal), 'Hadassah Friedlaender' (הערות-צד), 'FrankReal' (חלון). כותרות/TOC ב-DavidLibre-Bold (headingApi למדידה + /F3 ב-PDF); גוף-הערה FRL; fallback פיסוק במדידה+PDF (/F4 ToraPunct) |
| 7 | החלה מלאה של ברירות המחדל | המפתחות יובאו מאז 03.11(ד); הפערים שנראו = 6+5. שערים נשארו בגופן הגוף (בלי מדידת-שער ייעודית גלישה — ISSUE_REGISTRY) |

**באגים שנחשפו ותוקנו בדרך:** סמן-מודבק-למילה נמדד בלי רווחים (השורה
גלשה 3.2px; splitWords מחליף ב-' א ') · כפילות הערות-המשך (enqueueNote
מזהה srcText; פסקה שנשברת לפני ההנחה הכפילה הערה של 4,500 מילים ×2) ·
fetchBigVar ב-base64 (תעבורת agent-browser).

## 5. איך מריצים את הבדיקות (Actions — לא מקומית!)

- **על כל push ל-main** (אוטומטי): `ci.yml` (540 בדיקות) +
  `full-math-audit.yml` job `local` (האודיט המתמטי המלא + דטרמיניזם על
  הקובץ הגדול) + `layout-parity.yml` (קורפוס קטן מול הייחוס: HARD חייב
  ירוק; PARITY מדווח בלי חסימה — ההטיות המכוונות ב-D-91; קורפוס גדול:
  ‏C1-C12 חייב 12/12).
- **על האתר החי** (לילית 03:10 UTC, או ידנית): Actions ← full-math-audit
  ← Run workflow ← target=**live**.
- ידני מקומי (לפיתוח בלבד): `node tools/layout-audit/run-full-math.js`
  (הוסף `--url https://suginach.github.io/Tora_Book_Typesetter_Red/`
  למצב חי).
- **קורפוס גדול ידני:** `node tools/layout-parity/run-ours.js
  audits/very_long_test_text.txt audits/very-long-artifacts --determinism
  --html` ואז `python3 tools/layout-parity/verify-corpus.py ...` (ראה
  layout-parity.yml לפקודות המדויקות).

## 6. בניית gh-pages (חובה בכל דחיפה!)

```bash
# אחרי push ל-main (הבאנדלים כבר נבנו: node tools/build-worker-bundle.js):
git checkout gh-pages
git checkout main -- red-build/ui/index.html red-build/ui/styles.css \
  red-build/ui/app.bundle.js red-build/ui/engine-worker.bundle.js
# העתקה לשורש (מבנה gh-pages שטוח) + assets/favicon כבר קיימים:
cp red-build/ui/{index.html,styles.css,app.bundle.js,engine-worker.bundle.js} .
rm -rf red-build   # לא מעלים את העץ המלא ל-gh-pages
git add -A && git commit -m "Redeploy: S4.26 — ..." && git push origin gh-pages
git checkout main
# אימות: GitHub API → pages/builds → built; החי מגיש ?v=2026-11-05-s4.26
```
‏(cache-busting מוגדר ב-`browser-entry.js` — ‏ASSET_VERSION; להעלות
את הסיומת בכל פריסה: `v=2026-11-05-s4.26`.)

## 7. צעדים הבאים (סשן 05.11 — אחרי S4.26)

1. [x] **S4.26** — שבעת תיקוני השור + בדיקות + תיעוד (D-91) — בוצעו.
2. [x] **דחיפת main + בניית gh-pages (?v=2026-11-05-s4.26) + dispatch
   live-audit** — בוצעו בסשן זה.
3. [ ] **בסשן הבא:** לבדוק ב-API את תוצאות ה-Actions על ה-push של S4.26:
   ci (540 בדיקות), full-math-audit/local (0 בעיות), layout-parity
   (HARD ‏4/4 + קורפוס גדול 12/12) ו-full-math-audit/live (האתר החי —
   0 בעיות). **הכל ירוק = המשימה הושלמה.** כישלון = משיכת ה-artifact,
   אבחון שורש, תיקון + דחיפה + gh-pages — הכל באותה הודעה.
4. [ ] **צפוי מהמשתמש:** בדיקת-עין של האתר החי (גופן גוטמן רש"י בגוף,
   כותרות מודגשות, סוגריים ממורכזים, חלונות שקועים, הערות זורמות
   וממוספרות פר-פרק). משוב → תיקוני המשך.
5. [ ] (המלצת אבטחה) סיבוב הטוקן אצל המשתמש בסיום העבודה עמו.

## 8. מצב העץ המקומי בסוף סשן S4.26

- בסיס: ‏`origin/main` ‏ec7e168 (S4.25) + ‏S4.26 (עץ זה, נדחף).
- שונו: `legacy-imud-flow.js` (פוליטיקת הערות + מספור פרקי + זרימה +
  סמן-מרווחים + parenCenterRaisePx + headingApi/hw + windowW שורה-1 +
  ascentEm בעמוד), `dom-renderer.js` (סוגריים/חלון/הערות/גופנים),
  `legacy-projector.js` (סוגריים/חלון/הערות/כותרות), `pdf-writer.js`
  ‏(/F3 כותרות + /F4 פיסוק + פיצול גליפים), `export-api.js` (font3/font4),
  `font-metrics.js`+`measure-api.js` (fallback גליפים), `imud-library.js`
  (loadHeadingFont), `settings-registry.js` (ברירות מחדל חדשות),
  `imud-fonts.json` (3 כינויים), `default_settings.json` (continuous/siman/0),
  `full-math-audit.js` (פטור window-wrap), `run-full-math.js` (fetchBigVar
  base64), `run-ours.js` (headingFontBytes + ייצוא זרימה), `verify-corpus.py`
  (C10 פר-פרק), בדיקות (s24/real-fonts/s5-s6/s13 — קנוני 2b88e2c8),
  באנדלים נבנו, WORKLOG/ISSUE_REGISTRY/DECISIONS-D-91/קובץ זה.
- אימות: ‏540/540 בדיקות · אודיט מקומי PASS ‏(0 בעיות + דטרמיניזם) ·
  קורפוס 12/12 · parity HARD ‏4/4 (88.9%).

---
*מסמך זה נכתב ע"י העוזר (Z.ai) כחלק מהמסירה של S4.26; לעדכן בכל
שלב מסיים — הוא נקודת ההתחלה של הסשן הבא.*
