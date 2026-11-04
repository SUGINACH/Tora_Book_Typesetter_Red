# PROVENANCE.md — מקורות וייחוס · Tora Book Typesetter Red
> מצב: 05.11.2026 (סגירת EXT-9 — גופני אמת במדידה ובייצוא).

## קוד
- **בסיס:** בנייה מאפס (from-scratch) לפי `spec/01_MASTER_SPECIFICATION.md` + `spec/02_MASTER_WORK_PLAN.md`. אין העתקת קוד ריצה מהגרסאות הקודמות; יש **היסק לקחים** מתועדים (lessons) שהומרו למנגנונים ולבדיקות.
- **היסקים שהומרו למנגנון חי בסגירה זו:** fixDropWordInColumns (Gold), AQ stages+caps (Gold), chapter-end modes (Green), terminal-residual (Green), en-line-prefix (V_current), 70-footnotes continuous (V21), marker-for-numbering (IMUD), page-num-in-header (Orange), folio frames (V1), gershayim עבריים (P1-8).

## מסמכים
- `spec/01_MASTER_SPECIFICATION.md`, `spec/02_MASTER_WORK_PLAN.md` — מסמכי האם של הריפו.
- `Typesetter_doc/shared/comparisons/Monster_Comparison_All_Repos_Branches.md` — קטלוג הכשלים ההיסטורי (השוואת כל הגרסאות/ענפים).
- `audits/01_PROGRESS_AUDIT.md` — ביקורת עצמאית (02.11.2026, קומיט 7d0203b) — מקור 6 ממצאי ה־P0 ו־8 ממצאי ה־P1 שתוקנו בסגירה זו.
- `audits/02_S7_CLOSURE_REPORT.md` — דוח סגירת S7 (מסמך זה נכתב במקביל).
- `ai-chat/` — תמלילי שיחות הפיתוח (qwen) כפי שהועלו לריפו.

## גופנים
- **קובצי גופן אמיתיים מוטמעים בריפו (S4.6, EXT-14):** ‏443 קובצי TTF (62MB)
  ב-`red-build/ui/assets/imud/fonts/` — הומרו מקובצי WOFF2 המקוריים של
  IMUD_TORANI (ערכת העדיפות המלאה מ-`fonts-priority.json`), כולל ארבעת
  גופני העיצוב של המקור (Frank Ruhl Libre / David Libre / Bellefair /
  Noto Serif Hebrew — SIL OFL 1.1), גופן מילת-החלון FrankReal-Bold ומשפחות
  תורניות (גוטמן רש"י, פרנק ריל, נוטו רש"י, רמז ועוד). הקטלוג:
  `ui/assets/imud/imud-fonts.json` (משפחה→קובץ).
- **חריג מתועד אחד:** Guttman-Logo1-Regular.ttf — גופן-לוגו סימבולי ללא
  cmap יוניקוד; אינו גופן טקסט, נדחה מפורשות ברישום (בדיקת בקרה).
- **כפילויות מקור מתועדות:** 19 משפחות בשני קבצים (Arial Italic.ttf /
  Arial-Italic.ttf — אותו גופן בשניים מהמקור; המפה דטרמיניסטית — ראשון
  זוכה) + כפל-שמות אחד מכוון (DavidLibre-Regular.ttf גם כ-'דוד ליברה רגיל'
  וגם כ-'David Libre' — השם שמחסניות ה-CSS של המקור משתמשות בו).
- **קטלוג מורחב (1,315 משפחות נוספות):** ‏`fonts-extended.json` — קטלוג
  שמות בלבד (קובצי המקור WOFF2, ‏115MB; אינם מוטמעים — החלטת גודל
  מתועדת). בחירת משפחה מהקטלוג המורחב מדווחת במפורש כלא-מוטמעת ונופלת
  לגופן מערכת — לא כישלון שקט.
- **רישוי:** ארבעת גופני העיצוב — SIL OFL 1.1. שאר המשפחות הומרו מאוסף
  הגופנים המקורי שהועלה ע"י המשתמש (IMUD_TORANI/fonts) לשימוש
  הפרויקט; מקור ההמרה והקטלוג מתועדים ב-ISSUE_REGISTRY EXT-14.
- **מדידה וייצוא בגופני אמת (EXT-9, 05.11):** ‏442/443 נפרסים בפרנסר
  ה-sfnt העצמאי; המדידה (font-metrics) והייצוא (PDF עם תת-גופן מוטמע)
  מוכחים ב-`tests/e2e/real-fonts.test.js` (13 בדיקות: שלמות ספרייה,
  פתרון מחסניות, hmtx/cap-height/ניקוד אמיתי, עימוד ספר-אמת שלם,
  ייצוא PDF, בקרות-כפול). פרופילי הרוחב המקורבים בקוד נותרו כנפילה
  שקופה כשאין גופן רשום בלבד.

## בדיקות
- `tests/unit/*` — נכתבו מאפס (parser 17, typography 14) לפי המפרט.
- `tests/integration/registry.test.js` — חוזה שלוש שכבות (8) עם הסורק האמיתי (D-45).
- `tests/layout/s5-s6.test.js` — 17, כולל מדיניות הערה ארוכה במסלול אמיתי (dp-planner).
- `tests/e2e/*` — pipeline 14, s7-gate 15, canonical 6 (קורפוס קנוני).
- `tests/audit/negative-controls.test.js` — 16 בדיקות anti-false-positive.
- **אוסף הבדיקות ההיסטורי של חמשת הריפואים (21 תרחישי IMUD וכו') לא הועבר** — נרשם כפער; הבדיקות שנכתבו מכסות את אותם שטחים לפי המפרט. ראה ISSUE_REGISTRY FWD-4 לקורפוס.
