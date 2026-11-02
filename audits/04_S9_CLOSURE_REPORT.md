# דוח סגירת S9 — כותרות עליונות, מספור עמודים, תוכן־עניינים
> **תאריך:** 03.11.2026 · **שלב:** S9 (02_MASTER_WORK_PLAN §S9) · **מסמכי־אם:** `01_MASTER_SPECIFICATION.md` (REQ-HDR-01..06)
> **מצב:** **הושלם.** 171/171 בדיקות ירוקות (25 חדשות), דטרמיניזם יציב, ניטרליות גיאומטריה נשמרת.

---

## 1. מה נדרש (S9.1) לעומת מה נמסר

| # | משימה (S9.1) | נמסר | ראיות |
|---|---|---|---|
| 1 | Headers builder מהרישום: 3 אזורים × recto/verso עצמאות מלאה (type/align/font/size/width%), same_as עם גידוע מעגליות, כותרת ייעודית לפותחות H2/H3, קו מפריד none/gray/black | **מלא.** 18 מפתחות פר‑סלוט חדשים (גופן/גודל/טקסט־מותאם לכל אחד מששת הסלוטים); `resolveSameAs` עם seen-set; `header-opening-dedicated` + 3 סלוטי פתיחה (עוקף D-36 רק כשמופעל במפורש); separator קיים מ־S4 ומרונדר | מטריצה 10×3×3×2=180 צירופים; golden DOM; 'bc7892f locked forever' |
| 2 | מקורות תוכן: פיצול שם־הספר במקף (extractH1TitleMain; hdr-h1-title-mode), H1/H2, מספר עמוד, מילה ראשונה/אחרונה (פורט fillHeaderFirstLastWords), טקסט מותאם | **מלא + הרחבה:** `book-name-rest` (החלק שאחרי המקף) ופורט מאוחד `first-last-words` ("ראשונה – אחרונה") עם ניקוי פיסוק קצה (trimEdgePunctuation); מילה ראשונה/אחרונה מחושבות משורות **הגוף** בלבד (לא מכותרות) | בדיקות מקורות; gate 4 |
| 3 | Folio: פורמטים, מסגרות {none/circle/square/parens/squares/floral/diamond}, מיקומים {bottom-center/outer-left/outer-right/top/in-header/none}, start-value + **initial-value** + carry/skip per page-type (count/show pairs) | **מלא.** נוסחת V1 הושלמה: `page-num-start-idx` (effective = סוד − start‑idx + initial; תצוגה רק מ‑start‑idx); מסגרות נבדלות — circle/square כ‑badge CSS (פורט V1), parenthesis/squares/floral/diamond טקסטואליות; כל שש המיקומים מרונדרים; count/show pairs ל‑shaar/toc/endnotes | 'volume-2 fixture starts at כ"ב' (initial=22 ⇒ כ״ב); 'start-idx (V1 formula)'; 'count/show pairs' |
| 4 | TOC כללי/מפורט: per-level show/inline/group, נקודות מובילות, קישורים לחיצים (יעדי PDF), תוויות בפורמט הגיליון; גלישות/עומס + שמירה מתליה (שורת קטלוג) | **מלא.** עמודי `toc-general`/`toc-detail` אמיתיים המוכנסים מבנית לפני hash ה־CP4; קיבוץ inline רצוף לשורת־קבוצה; נקודות + מספור שורות; עוגנים `href="#page-N"` עם `id` בכל עמוד (יעדי PDF נישאים ל־S12); תוויות דרך pageRef אחרי assignNumbers; **תקציב איטרציה** (20,000 שורות / 500 עמודים) ⇒ `toc-budget-exceeded` ועצירה דטרמיניסטית | gate 3: 'anchors', 'grouping', stress 300 כותרות, 'unwrappable title' |
| 5 | תיקון verso-center (IMUD bc7892f) נשמר + רגרסיה | **נעול לנצח.** לסלוט המרכזי בו־ורסו גופן/גודל/טקסט משלו — בדיקה ייעודית עם ערכים שונים מ־recto | 'bc7892f (IMUD) locked forever' |
| 6 | בודק אינווריאנטים מספור: סדרה מונוטונית, בלי כפילות/דילוגים פרט לחסרים מוצהרים; מזין אודיט kinds pn-* | **מלא.** `numbering-audit.js`: pn-sequence (רציפות סודים, נוסחה, מונוטוניות תצוגה) + pn-overflow (תקציב 30% מרוחב תיבת תוכן) → ledger; ביקורת שלילה מוכיחה שהבודק תופס הפרות מוזרקות | gate 5 + 'negative review' |

## 2. שערי S9.2 — כולם ירוקים

| שער | בדיקה | תוצאה |
|---|---|---|
| 1 | Header matrix: כל מקור×יישור×רוחב × recto AND verso (golden) | ✅ 180 צירופים + golden DOM (גופן/גודל px פר‑סלוט) |
| 2 | Volume‑2 fixture מתחיל בערך initial; count/show pairs (שערים לא ממוספרים וכו') | ✅ כ״ב; start‑idx; shaar/toc/endnotes; פתיחות D-36 |
| 3 | TOC stress: אין גלישה, אין תליה (<תקציב), עוגנים פותרים לעמודים הנכונים | ✅ 300 כותרות ארוכות, דטרמיניסטי, 0 ממצאים; כותרת בלתי־ניתנת־לעטיפה ⇒ קטיעה + ממצא, אפס תליה |
| 4 | first/last-word מתעדכנות אחרי עימוד מחדש (שאלת סשן Z.ai) | ✅ עימוד מחדש משנה את הכותרת לתוכן החדש — לא חוזרת לישן |
| 5 | pn-overflow/pn-sequence = 0 על canonical | ✅ ב־5 קונפיגורציות (ברירת מחדל, מסגרות, initial/start, TOC מרובה, endnotes) |

## 3. החלטות שנרשמו

- **D-61** — עצמאות מלאה פר‑סלוט + נעילת bc7892f + מקורות book-name-rest/first-last-words + כותרת ייעודית לפותחות H2/H3.
- **D-62** — עמודי TOC אמיתיים: הכנסה מבנית לפני CP4, זרימה במדידה מראש, תקציב איטרציה, פענוח עוגנים דרך pageRef, השלמת 4 מפתחות Orange eb21383.
- **D-63** — **תיקון חבוי:** בניית תבניות מחדש לפי הזוגיות הסופית אחרי הכנסות (תיקן שולי תפירה הפוכים שנותרו מ־S8); גלישה אפשרית נבדקת ונרשמת כממצא binding-parity-shift.

## 4. רישום הגדרות

- **26 מפתחות חדשים** (סה"כ 179): 6×font, 6×size‑pt, 6×custom‑text (פר‑סלוט), header‑opening‑dedicated + 3 מקורות פתיחה, page‑num‑start‑idx, detailed‑toc‑count‑numbering, general/detailed‑toc‑show‑numbering.
- enum מקורות הורחב ל־10 (book‑name‑rest, first‑last‑words); page‑num‑frame הורחב ל־7 (squares).
- **כל מפתח נצרך בפועל** — סורק phantom‑key ירוק (גישת `settings[...]` מפורשת; שיעור P0‑5 מיושם).

## 5. ידוע ותועד (לא חוסם)

| נושא | בעלות |
|---|---|
| יעדי PDF (bookmarks) מקישורי ה‑TOC | S12 (הנתונים נישאים: targetPage/anchorId) |
| צילומי עמודים ויזואליים מלאים (golden screenshots בפועל) | S10 (עם ה‑UI; כאן אורקל DOM) |
| פורט מלא של מקורות IMUD הוויזואליים (עיטורי SVG בכותרת) | מחוץ להיקף REQ‑HDR; עיטורים חיים ב־S8 |

## 6. מספרים

```
סוויטות: 10 · בדיקות: 171/171 ירוקות (25 חדשות ל־S9)
דטרמיניזם: OK (hash 75b8c605…, 18 עמודים בקורפוס הקנוני)
ניטרליות גיאומטריה: CP4==CP5 גם עם TOC פעיל ✓
קורפוס קנוני: 63ms, עמוד TOC אחד מוכנס; שער+TOC: shaar-main ← toc ← preface ✓
D-63: 0 חוסר התאמת תבניות; 589 שורות נבדקו, 0 גלישות (binding=12)
מפתחות רישום: 179, כולם עם צרכן חי + בדיקת אפקט
```
