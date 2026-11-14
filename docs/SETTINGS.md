# Settings Reference

> **Generated file — do not edit by hand.** Source of truth: `red-build/src/engine/core/settings-registry.js`
> (UI labels and grouping from `red-build/src/ui/bindings.generated.js`).
> Generated at commit `6f80156`. Regenerate from the repository root: `node docs/tools/gen-settings-doc.js`.

The registry defines **221 settings** in **11 groups** (enum: 51, number: 62, bool: 49, font: 28, string: 30, color: 1).
The registry also declares 13 panel groups in total; `BUILDER`, `IMPORTS` hold no registry settings (UI-only panels).
`getDefaultSettings()` additionally returns derived key(s) that are not registry settings: `settings_version`.

## How settings work

- **Three-layer contract** (control ↔ key ↔ mechanism ↔ effect test): every registry entry names its UI control (`control`), the engine modules that consume it (`consumers`) and the test that proves it has an effect (`effect_test`). Automatic scanners (`red-build/src/audit/scanners.js`) fail the test chain on dead controls, phantom keys and orphan mechanisms.
- **Defaults first:** `getDefaultSettings()` returns the full default object; user values are merged on top. The engine always receives a complete settings object: `typeset(text, settings)`.
- **Heavy vs. light changes:** changing a "heavy" setting does not re-typeset automatically; the UI waits for an explicit ⚡ (see `red-build/src/ui/retypeset-policy.js`).
- **Persistence:** the UI stores only the *difference from the defaults* in `localStorage` under the key `tora-red-user-settings`; unknown keys are skipped on restore.
- **Legacy files:** v1 settings files and project ZIPs are migrated automatically — see [`MIGRATION.md`](../MIGRATION.md).

Column legend: *Allowed / range* lists enum values or `min – max (step)`; *Note* is truncated to 140 characters — see the registry for the full text.

## ערכות נושא, שערים ורקעים (`THEMES`) — 37 settings

| Key | Label (UI) | Type | Default | Allowed / range | Note |
|---|---|---|---|---|---|
| `background-color` | צבע רקע העמוד | color | `"#ffffff"` |  |  |
| `background-opacity` | אטימות רקע | number | `1` | 0 – 1 (step 0.05) | נצרך בפועל: rgba() על background-color (תיקון P0-5 — בעבר נכתב לתכונת CSS בלתי קיימת) |
| `theme-set-id` | ערכת נושא פעילה | string | `"default"` |  | REQ-ORN-06: הפעלת ערכה מפעילה את שלושת השערים (F-10) דרך theme-sets.activateThemeSet |
| `show-shaar-sub` | הצג שער משנה | bool | `false` |  | U-C2: "הצג שער משנה" — עמודי שער־משנה לפני כל פתיחת חלק |
| `shaar-main-image` | תמונת שער ראשי | string | `""` |  |  |
| `shaar-sub-image` | תמונת שער משנה | string | `""` |  |  |
| `shaar-back-enabled` | שער אחורי מופעל | bool | `true` |  | PT-03: 4 מקטעים עצמאיים; כיבוי ראשי מבטל את כולם |
| `background-page-type` | מחלקת עמוד לרקע | enum | `"regular"` | regular \| preface-open \| sign-open | REQ-ORN-08: מחלקת העמוד שאליה הרקע מיועד (מיזוג פאנל רקע→נושאים) |
| `background-image` | תמונת רקע | string | `""` |  |  |
| `background-texture` | טקסטורת רקע | string | `""` |  | טקסטורה חוזרת (שכבת תשתית — פטורה מחפיפות באודיט) |
| `background-inset-mm` | שקיעת רקע מהשוליים (מ״מ) | number | `0` | 0 – 30 | שקיעת הרקע משולי העמוד במ״מ |
| `imud-shaar-main` | עיצוב שער ראשי (ספריית IMUD) | string | `""` |  | עיצוב שער ראשי מספריית IMUD (הפניה imud:shaar-main:<id>) — מפעיל את עמודי השער |
| `imud-shaar-sub` | עיצוב שער משנה (ספריית IMUD) | string | `""` |  | עיצוב שער משנה מספריית IMUD (imud:shaar-sub:<id>) |
| `imud-shaar-back` | עיצוב שער אחורי (ספריית IMUD) | string | `""` |  | עיצוב שער אחורי מספריית IMUD (imud:shaar-back:<id>) |
| `imud-book-title` | כותרת הספר בשער (עקיפה) | string | `""` |  | כותרת הספר בשער (עקיפת מטא-נתוני המסמך אם הוגדר) |
| `imud-book-subtitle` | כותרת־משנה בשער | string | `""` |  | כותרת־משנה בשער |
| `shaar-main-enabled` | שער ראשי מופעל (כמקור) | bool | `true` |  | 03.11(ד): שער ראשי כברירת מחדל — כמקור (show-main-shaar=true). מתג שער-העיצוב/ערכת-הנושא מוסיף רקע מעוצב, לא מחליף את המתג |
| `shaar-sub-enabled` | שער־משנה לכל חלק (כמקור) | bool | `true` |  | 03.11(ד): שער־משנה לכל פתיחת חלק — כמקור (show-sub-shaar=true); show-shaar-sub הישן נשמר כמתג נוסף (או) |
| `shaar-title-font` | שער — גופן כותרת הספר | font | `"Bellefair"` |  | מקור: f-sh-title="'Lia Sgula', 'Bellefair', serif" — Lia Sgula אינה זמינה; Bellefair המוטמע |
| `shaar-title-size-pt` | שער — גודל כותרת הספר (pt) | number | `46` | 20 – 90 | מקור: s-sh-title=46 |
| `shaar-subtitle-font` | שער — גופן כותרת־משנה | font | `"David Libre"` |  | מקור: f-sh-sub="'Livorna', 'David Libre', serif" |
| `shaar-subtitle-size-pt` | שער — גודל כותרת־משנה (pt) | number | `21` | 10 – 40 | מקור: s-sh-sub=21 |
| `shaar-desc-font` | שער — גופן התיאור | font | `"Frank Ruhl Libre"` |  | מקור: f-sh-desc="'Livorna', 'Frank Ruhl Libre', serif" |
| `shaar-desc-size-pt` | שער — גודל התיאור (pt) | number | `12` | 8 – 20 | מקור: s-sh-desc=12 |
| `shaar-sections-font` | שער — גופן פרטי מהדורא | font | `"David Libre"` |  | מקור: f-sh-sec="'David Libre', serif" |
| `shaar-sections-size-pt` | שער — גודל פרטי מהדורא (pt) | number | `11.5` | 8 – 20 | מקור: s-sh-sec=11.5 |
| `shaar-author-font` | שער — גופן שם המחבר | font | `"David Libre"` |  | מקור: f-sh-author="'David Libre', serif" |
| `shaar-author-size-pt` | שער — גודל שם המחבר (pt) | number | `15` | 8 – 24 | מקור: s-sh-author=15 |
| `shaar-year-font` | שער — גופן מקום ושנה | font | `"David Libre"` |  | מקור: f-sh-year="'David Libre', serif" |
| `shaar-year-size-pt` | שער — גודל מקום ושנה (pt) | number | `12` | 8 – 20 | מקור: s-sh-year=12 |
| `shaar-back-text-font` | שער אחורי — גופן הטקסט | font | `"David Libre"` |  | גוף טקסט השער האחורי (שורות שמירת־זכויות) — מקור: David Libre |
| `shaar-back-text-size-pt` | שער אחורי — גודל הטקסט (pt) | number | `10.5` | 8 – 16 | מקור: שורות ההמשך 10.5pt (השורה הראשונה 13pt מודגשת) |
| `imud-book-desc` | תיאור (שער — נושא מפורט) | string | `""` |  | תיאור בשער הראשי (מקור: inp-book-desc ← «נושא מפורט») |
| `imud-book-sections` | פרטי מהדורא (שער) | string | `""` |  | פרטי מהדורא בשער הראשי (מקור: inp-book-sections ← «פרטי מהדורא») |
| `imud-book-author` | שם המחבר (שער) | string | `""` |  | שם המחבר בשערים (מקור: inp-book-author ← «שם המחבר») |
| `imud-book-year` | מקום ושנת הוצאה (שער) | string | `""` |  | מקום ושנת הוצאה בשערים (מקור: inp-book-year ← «מקום ושנת הוצאה») |
| `shaar-back-text` | טקסט השער האחורי (שמירת זכויות) | string | `""` |  | טקסט השער האחורי (מקור: inp-back-shaar-text; ברירת מחדל בזמן ריצה: «שמירת זכויות» מהמטא או ״כל הזכויות שמורות למחבר.״) |

## הערות שוליים וסיום (`NOTES`) — 18 settings

| Key | Label (UI) | Type | Default | Allowed / range | Note |
|---|---|---|---|---|---|
| `endnote-title-font` | גופן כותרת עמודי ההערות (f-note-title) | font | `"David Libre"` |  | S6.3: גופן כותרת עמודי הערות |
| `note-placement-mode` | אופן הצבת הערות | enum | `"footnotes"` | footnotes \| endnotes \| inline |  |
| `footnotes-enabled` | הערות שוליים מופעלות | bool | `true` |  | D-39: קלט משתמש מפורש גובר על נגזרות; mode=footnotes + false ⇒ ההערות בגוף כplaceholder |
| `footnote-marker-style` | סגנון סמן הערה | enum | `"hebrew-geresh"` | hebrew-geresh \| parenthesis \| asterisk \| decimal |  |
| `footnote-reset-policy` | מדיניות איפוס מונה הערות | enum | `"section"` | continuous \| page \| section \| part | S4.26 (דיווח משתמש 05.11): ברירת המחדל איפוס פר-פרק (section/siman) — לא פר-עמוד |
| `footnote-columns` | מספר טורי הערות שוליים | number | `1` | 1 \| 2 |  |
| `footnote-separator-rule` | קו הפרדה של סרגל הערות | enum | `"regular"` | none \| regular \| circles \| sparkle \| star \| diamond |  |
| `fn-layout-mode` | אופן פריסת הערות (בלוק/רציף) | enum | `"continuous"` | block \| continuous | S4.26 (דיווח משתמש 05.11): ברירת המחדל זרימה רציפה — הערה הבאה פותחת באותה שורה שבה הסתיימה קודמתה; block=כל הערה בלוק משלה |
| `endnotes-enabled` | הערות סיום מופעלות | bool | `false` |  | נגזר מ‑note-placement-mode=endnotes (D-39); קלט ישן true ממופה ל‑mode=endnotes בהגירה (project-io) |
| `endnote-title-text` | כותרת עמודי הערות | string | `"הערות"` |  |  |
| `endnote-columns` | מספר טורי הערות־סיום | number | `1` | 1 \| 2 | S7.1.1: טור אחד או שניים בעמודי הערות |
| `f-note-body-font` | גופן גוף הערת־שוליים | font | `"Frank Ruhl Libre"` |  |  |
| `s-note-body-font` | גופן גוף הערת־צד | font | `"Frank Ruhl Libre"` |  |  |
| `fn-bar-max-height-px` | תקרת גובה סרגל הערות (px) | number | `0` | 0 – 1000 | S4.26 (דיווח משתמש 05.11): 0=קיבולת העמוד המלאה (ברירת המחדל — הערה ארוכה ממלאת את העמוד לפני חיתוך); ערך חיובי נחתם לקיבולת |
| `long-footnote-policy` | מדיניות הערה ארוכה | enum | `"split"` | split \| move-whole \| reject-to-body | REQ-FN-02; split=המשך במרזב העמוד הבא עם סימון המשך; reject-to-body=השבה מלאה לגוף (BRZ-15) |
| `en-line-prefix` | קידומת הערת סיום (ריק = ביטול) | string | `"הערת סיום -"` |  | שורה המתחילה בקידומת ⇒ הערת סיום (הקידומת אינה מופיעה בפלט). ריק = ביטול הזיהוי. הוראת כותרת עמודי ההערות — רק בצורת הרבים «הערות סיום - כו… |
| `fn-delim-open` | תוחם פתיחת הערת שוליים | string | `"["` |  | תוחם פתיחת הערת שוליים; ריק = ביטול |
| `fn-delim-close` | תוחם סגירת הערת שוליים | string | `"]"` |  | תוחם סגירת הערת שוליים (בברירת המחדל נתמכת גם הצורה ]ם); ריק = ביטול |

## איכות עימוד (`QUALITY`) — 20 settings

| Key | Label (UI) | Type | Default | Allowed / range | Note |
|---|---|---|---|---|---|
| `prevent-widows-top` | מנע אלמנות בראש עמוד | bool | `true` |  | טוגל נפרד לתחילת עמוד (Mapping #4) |
| `prevent-widows-bottom` | מנע אלמנות בסוף עמוד | bool | `true` |  |  |
| `prevent-orphans-top` | מנע יתומים בראש עמוד | bool | `true` |  |  |
| `prevent-orphans-bottom` | מנע יתומים בסוף עמוד | bool | `true` |  |  |
| `widow-strictness` | מחמירות אלמנות/יתומים | enum | `"normal"` | relaxed \| normal \| strict |  |
| `runt-min-width-pct` | רוחב מזערי לשורת־שדון (%) | number | `50` | 20 – 80 |  |
| `balance-chapter-end` | איזון סוף פרק | enum | `"balance"` | balance \| stretch \| natural | REQUIRE: מנגנון מלא (שוחזר מ‑Green, REQ-BAL-03); נצרך בפועל ב‑pipeline בסוף כל חלק |
| `allow-terminal-residual-fallback` | שארית סופית מותרת כנפילה | bool | `true` |  | שוחזר מ‑Green (REQ-BAL-04) |
| `imbalance-max-delta-px` | סף אי־איזון טורים (px) | number | `5` |  |  |
| `aq-enabled` | איכות אוטומטית (AQ) מופעלת | bool | `false` |  | AutoQuality מ‑Gold — שלוש שכבות יחד (REQ-BAL-06); נקרא בפועל מהpipeline (תיקון P1-1) |
| `aq-word-spacing-min` | AQ — ריווח מילים מזערי | number | `0.95` | 0.8 – 1 |  |
| `aq-word-spacing-max` | AQ — ריווח מילים מקסימלי | number | `1.05` | 1 – 1.2 |  |
| `aq-letter-spacing-min` | AQ — ריווח אותיות מזערי | number | `0.97` |  |  |
| `aq-letter-spacing-max` | AQ — ריווח אותיות מקסימלי | number | `1.03` |  |  |
| `aq-heading-spacing-min` | AQ — ריווח כותרות מזערי | number | `0.95` |  |  |
| `aq-heading-spacing-max` | AQ — ריווח כותרות מקסימלי | number | `1.05` |  |  |
| `aq-shared-load` | AQ — עומס משותף | bool | `true` |  |  |
| `aq-stretch-to-bottom` | AQ — מתיחה עד תחתית | bool | `true` |  | clamp overshoot 20px (REQ-BAL-07) |
| `aq-overshoot-clamp-px` | AQ — תקרת חריגה (px) | number | `20` | 0 – 60 |  |
| `aq-compress-first` | AQ — כיווץ לפני מתיחה | bool | `true` |  |  |

## טיפוגרפיה וגוף הטקסט (`TYPO`) — 14 settings

| Key | Label (UI) | Type | Default | Allowed / range | Note |
|---|---|---|---|---|---|
| `body-font` | גופן גוף הטקסט | font | `"Frank Ruhl Libre"` |  | font-picker preserve-missing-value (IMUD port) |
| `body-font-size-pt` | גודל גוף הטקסט (pt) | number | `14` | 9 – 24 |  |
| `body-line-height` | גובה שורה (יחס) | number | `1.4` | 1.2 – 1.6 | פלפול 1.25 / קריאה 1.45 |
| `paren-style-scale` | סקאלת סוגריים | number | `1` | 0.8 – 1 (step 0.01) | מילים בתוך (...) נמדדות בסקאלה זו לפני שבירת שורות ומרונדרות במחלקת w--paren; 1.0 = כבוי |
| `first-word-mode` | אופן מילה ראשונה | enum | `"drop"` | drop \| inline \| bold \| none |  |
| `first-word-length` | אורך מילה ראשונה (מילים) | number | `1` | 1 \| 2 |  |
| `first-word-threshold-lines` | סף שורות למילה ראשונה | number | `3` | 2 – 6 |  |
| `first-word-align-cap-top` | יישור מילה ראשונה לקו בסיס גוף | bool | `true` |  | REQ-LB-05: קצה עליון לקו בסיס גוף — לא baseline |
| `first-word-size-em` | first-word-size-em | number | `2` | 1 – 4 (step 0.1) | S4.5: גודל המילה הראשונה ב-em (המקור: size-first-word=1.5; בעבר היה כפול 2 מוקשה) |
| `first-word-font` | גופן מילה ראשונה | font | `""` |  | S4.5: גופן נפרד למילה הראשונה (המקור: font-first-word=FrankReal); ריק = גופן הגוף |
| `dh-auto-detect` | זיהוי אוטומטי של דיבור־המתחיל | bool | `true` |  | דיבור המתחיל עד נקודה/מקף |
| `dh-font` | גופן דיבור־המתחיל | font | `"David HB"` |  |  |
| `heading-0-body-font` | גופן גוף ההקדמה (f-h0-body) | font | `"Frank Ruhl Libre"` |  | S6.3: גוף ההקדמה — מדידה (prefaceApi) ורינדור באותו גופן |
| `body-last-line-align` | יישור שורה אחרונה בפסקה | enum | `"center"` | center \| right \| stretch | wiring מ‑Orange ✓ |

## כותרות 0–7 (`HEADINGS`) — 24 settings

| Key | Label (UI) | Type | Default | Allowed / range | Note |
|---|---|---|---|---|---|
| `heading-0-mode` | כותרת אפס — אופן | enum | `"full-width"` | full-width \| regular \| side-note \| new-page |  |
| `heading-0-font` | כותרת אפס — גופן | font | `"David HB"` |  |  |
| `heading-0-size-pt` | כותרת אפס — גודל (pt) | number | `20` | 8 – 48 |  |
| `heading-1-mode` | כותרת 1 — אופן | enum | `"full-width"` | full-width \| regular \| side-note \| new-page |  |
| `heading-1-font` | כותרת 1 — גופן | font | `"David HB"` |  |  |
| `heading-1-size-pt` | כותרת 1 — גודל (pt) | number | `18` | 8 – 48 |  |
| `heading-2-mode` | כותרת 2 — אופן | enum | `"full-width"` | full-width \| regular \| side-note \| new-page |  |
| `heading-2-font` | כותרת 2 — גופן | font | `"David HB"` |  |  |
| `heading-2-size-pt` | כותרת 2 — גודל (pt) | number | `16` | 8 – 48 |  |
| `heading-3-mode` | כותרת 3 — אופן | enum | `"full-width"` | full-width \| regular \| side-note \| new-page |  |
| `heading-3-font` | כותרת 3 — גופן | font | `"David HB"` |  |  |
| `heading-3-size-pt` | כותרת 3 — גודל (pt) | number | `15` | 8 – 48 |  |
| `heading-4-mode` | כותרת 4 — אופן | enum | `"regular"` | full-width \| regular \| side-note \| new-page |  |
| `heading-4-font` | כותרת 4 — גופן | font | `"David HB"` |  |  |
| `heading-4-size-pt` | כותרת 4 — גודל (pt) | number | `14` | 8 – 48 |  |
| `heading-5-mode` | כותרת 5 — אופן | enum | `"regular"` | full-width \| regular \| side-note \| new-page |  |
| `heading-5-font` | כותרת 5 — גופן | font | `"David HB"` |  |  |
| `heading-5-size-pt` | כותרת 5 — גודל (pt) | number | `14` | 8 – 48 |  |
| `heading-6-mode` | כותרת 6 — אופן | enum | `"regular"` | full-width \| regular \| side-note \| new-page |  |
| `heading-6-font` | כותרת 6 — גופן | font | `"David HB"` |  |  |
| `heading-6-size-pt` | כותרת 6 — גודל (pt) | number | `13` | 8 – 48 |  |
| `heading-7-mode` | כותרת 7 — אופן | enum | `"side-note"` | full-width \| regular \| side-note \| new-page |  |
| `heading-7-font` | כותרת 7 — גופן | font | `"David HB"` |  |  |
| `heading-7-size-pt` | כותרת 7 — גודל (pt) | number | `12` | 8 – 48 |  |

## עיטורים וגרפיקה (`ORNAMENTS`) — 18 settings

| Key | Label (UI) | Type | Default | Allowed / range | Note |
|---|---|---|---|---|---|
| `h2-orn-scope` | היקף עיטורי H2 | enum | `"both"` | none \| sign \| title \| both | REQ-ORN-02: סימן בלבד / כותרת בלבד / שניהם / כלום. **S4.6 (ביקורת 3):** none נוסף — במקור IMUD h2-title-orn-mode=none היה מומר ל-both (היפו… |
| `h2-orn-top` | עיטור עליון לסימן H2 | enum | `"none"` | none \| pyramid \| lance \| shoshanta \| scroll \| image | עיטור עליון לסימן (V4: מצבים עצמאיים). עיטורים מעוצבים מהמקור (302 עיצובים) — בפאנל "ספריית העיצובים של המקור" |
| `h2-orn-bottom` | עיטור תחתון לסימן H2 | enum | `"none"` | none \| pyramid \| lance \| shoshanta \| scroll \| image | עיטור תחתון לסימן. עיטורים מעוצבים מהמקור — בפאנל "ספריית העיצובים של המקור" |
| `h2-orn-side` | עיטור צד לכותרת H2 | enum | `"none"` | none \| pyramid \| lance \| shoshanta \| scroll \| image | עיטור צדדי לכותרת (V4) |
| `h2-orn-fit-to-text` | התאמת עיטור H2 לטקסט | bool | `true` |  | REQ-ORN-01: התאמת רוחב לטקסט במדידת JS — CSS fit-content נכשל (V3/V4); המידות נקבעות בהזמנת הפריסה (F-08) |
| `h3-side-orn` | עיטורי צד H3 | enum | `"none"` | none \| pyramid \| lance \| shoshanta \| scroll | REQ-ORN-01: עיטורי צד H3 — התאמת גובה לשורה |
| `h3-side-orn-height-em` | גובה עיטור צד H3 (em) | number | `1` | 0.5 – 2 (step 0.1) | גובה ב־em; מקור שליטה יחיד — אין !important מול inline (F-09) |
| `chapter-end-ornament` | עיטור סוף פרק | enum | `"none"` | none \| pyramid \| lance \| shoshanta \| scroll \| image | REQ-ORN-03: פירמידת וילנא/רומח/שושנתא/סלסול/תמונה — התאמה לתקציב הפנוי; לעולם לא דוחף תוכן. עיטורי סיום מעוצבים מהמקור — בפאנל "ספריית העיצ… |
| `chapter-end-ornament-w-em` | רוחב עיטור סוף פרק (em) | number | `4` | 1 – 12 |  |
| `chapter-end-ornament-h-em` | גובה עיטור סוף פרק (em) | number | `1.2` | 0.3 – 4 |  |
| `heading-dividers-h3-h6` | מפרידי כותרות H3–H6 | bool | `false` |  | REQ-ORN-04: fits() נמדד בכל אתרי ההוספה; בלי עיטור בראש טור/עמוד ריק; rollback-aware (Orange) |
| `shaar-main-divider` | קו מפריד בשער ראשי | enum | `"none"` | none \| thin \| dashed \| double | REQ-ORN-04: קו מפריד בשער ראשי (PT-01) |
| `shaar-sub-divider` | קו מפריד בשער משנה | enum | `"none"` | none \| thin \| dashed \| double | REQ-ORN-04: קו מפריד בשער משנה (PT-02) |
| `imud-orn-top` | עיטור עליון H2 (IMUD) | string | `""` |  | עיטור עליון לסימן H2 — עיצוב IMUD; דורש h2-orn-top=image |
| `imud-orn-bottom` | עיטור תחתון H2 (IMUD) | string | `""` |  | עיטור תחתון לסימן H2 — עיצוב IMUD; דורש h2-orn-bottom=image |
| `imud-orn-side` | עיטור צדדי (IMUD) | string | `""` |  | עיטור צדדי (H2/H3) — עיצורי IMUD; דורש h2-orn-side/h3-side-orn=image |
| `imud-chapter-end` | עיטור סיום פרק (IMUD) | string | `""` |  | עיטור סיום־פרק — עיצוב IMUD; דורש chapter-end-ornament=image |
| `imud-divider` | מפריד מעוצב (IMUD) | string | `""` |  | מפריד סעיפים מעוצב (323 עיצובים) — משמש מפרידי שער/כותרות במצב תמונה |

## כותרות עליונות (`HEADERS`) — 44 settings

| Key | Label (UI) | Type | Default | Allowed / range | Note |
|---|---|---|---|---|---|
| `hdr-h1-title-mode` | אופן כותרת H1 בכותרת עליונה | enum | `"main"` | main \| full | K-8: main כברירת מחדל + toggle |
| `header-enabled` | כותרות עליונות מופעלות | bool | `true` |  |  |
| `header-recto-right-source` | עמוד ימני — מקור ימין | enum | `"book-name"` | none \| book-name \| book-name-rest \| h1 \| h2 \| page-num \| first-word \| last-word \|… |  |
| `header-recto-center-source` | עמוד ימני — מקור מרכז | enum | `"h2"` | none \| book-name \| book-name-rest \| h1 \| h2 \| page-num \| first-word \| last-word \|… |  |
| `header-recto-left-source` | עמוד ימני — מקור שמאל | enum | `"h1"` | none \| book-name \| book-name-rest \| h1 \| h2 \| page-num \| first-word \| last-word \|… |  |
| `header-verso-right-source` | עמוד שמאלי — מקור ימין | enum | `"h1"` | none \| book-name \| book-name-rest \| h1 \| h2 \| page-num \| first-word \| last-word \|… |  |
| `header-verso-center-source` | עמוד שמאלי — מקור מרכז | enum | `"h2"` | none \| book-name \| book-name-rest \| h1 \| h2 \| page-num \| first-word \| last-word \|… |  |
| `header-verso-left-source` | עמוד שמאלי — מקור שמאל | enum | `"book-name"` | none \| book-name \| book-name-rest \| h1 \| h2 \| page-num \| first-word \| last-word \|… |  |
| `header-verso-same-as-recto` | עמוד שמאלי זהה לימני | bool | `false` |  | same_as_even + גידוע מעגליות (Orange c49b79e) — resolveSameAs עם seen-set |
| `header-separator-line` | קו הפרדה בכותרת עליונה | enum | `"gray"` | none \| gray \| black |  |
| `header-opening-dedicated` | כותרת ייעודית לעמודי פתיחה | bool | `false` |  | REQ-HDR-02: עמוד הנפתח בכותרת H2/H3 מקבל את שלושת סלוטי הפתיחה שלהלן |
| `header-opening-right-source` | פתיחה — מקור ימין | enum | `"none"` | none \| book-name \| book-name-rest \| h1 \| h2 \| page-num \| first-word \| last-word \|… |  |
| `header-opening-center-source` | פתיחה — מקור מרכז | enum | `"book-name"` | none \| book-name \| book-name-rest \| h1 \| h2 \| page-num \| first-word \| last-word \|… |  |
| `header-opening-left-source` | פתיחה — מקור שמאל | enum | `"none"` | none \| book-name \| book-name-rest \| h1 \| h2 \| page-num \| first-word \| last-word \|… |  |
| `header-recto-right-align` | עמוד ימני — סלוט ימין — יישור | enum | `"right"` | right \| center \| left |  |
| `header-recto-right-width-pct` | עמוד ימני — סלוט ימין — רוחב (%) | number | `33` | 5 – 90 |  |
| `header-recto-right-font` | עמוד ימני — סלוט ימין — גופן | font | `"David HB"` |  |  |
| `header-recto-right-size-pt` | עמוד ימני — סלוט ימין — גודל (pt) | number | `11` | 6 – 28 |  |
| `header-recto-right-custom-text` | עמוד ימני — סלוט ימין — טקסט מותאם | string | `""` |  |  |
| `header-recto-center-align` | עמוד ימני — סלוט מרכז — יישור | enum | `"center"` | right \| center \| left |  |
| `header-recto-center-width-pct` | עמוד ימני — סלוט מרכז — רוחב (%) | number | `33` | 5 – 90 |  |
| `header-recto-center-font` | עמוד ימני — סלוט מרכז — גופן | font | `"David HB"` |  |  |
| `header-recto-center-size-pt` | עמוד ימני — סלוט מרכז — גודל (pt) | number | `11` | 6 – 28 |  |
| `header-recto-center-custom-text` | עמוד ימני — סלוט מרכז — טקסט מותאם | string | `""` |  |  |
| `header-recto-left-align` | עמוד ימני — סלוט שמאל — יישור | enum | `"left"` | right \| center \| left |  |
| `header-recto-left-width-pct` | עמוד ימני — סלוט שמאל — רוחב (%) | number | `33` | 5 – 90 |  |
| `header-recto-left-font` | עמוד ימני — סלוט שמאל — גופן | font | `"David HB"` |  |  |
| `header-recto-left-size-pt` | עמוד ימני — סלוט שמאל — גודל (pt) | number | `11` | 6 – 28 |  |
| `header-recto-left-custom-text` | עמוד ימני — סלוט שמאל — טקסט מותאם | string | `""` |  |  |
| `header-verso-right-align` | עמוד שמאלי — סלוט ימין — יישור | enum | `"right"` | right \| center \| left |  |
| `header-verso-right-width-pct` | עמוד שמאלי — סלוט ימין — רוחב (%) | number | `33` | 5 – 90 |  |
| `header-verso-right-font` | עמוד שמאלי — סלוט ימין — גופן | font | `"David HB"` |  |  |
| `header-verso-right-size-pt` | עמוד שמאלי — סלוט ימין — גודל (pt) | number | `11` | 6 – 28 |  |
| `header-verso-right-custom-text` | עמוד שמאלי — סלוט ימין — טקסט מותאם | string | `""` |  |  |
| `header-verso-center-align` | עמוד שמאלי — סלוט מרכז — יישור | enum | `"center"` | right \| center \| left |  |
| `header-verso-center-width-pct` | עמוד שמאלי — סלוט מרכז — רוחב (%) | number | `33` | 5 – 90 |  |
| `header-verso-center-font` | עמוד שמאלי — סלוט מרכז — גופן | font | `"David HB"` |  |  |
| `header-verso-center-size-pt` | עמוד שמאלי — סלוט מרכז — גודל (pt) | number | `11` | 6 – 28 |  |
| `header-verso-center-custom-text` | עמוד שמאלי — סלוט מרכז — טקסט מותאם | string | `""` |  |  |
| `header-verso-left-align` | עמוד שמאלי — סלוט שמאל — יישור | enum | `"left"` | right \| center \| left |  |
| `header-verso-left-width-pct` | עמוד שמאלי — סלוט שמאל — רוחב (%) | number | `33` | 5 – 90 |  |
| `header-verso-left-font` | עמוד שמאלי — סלוט שמאל — גופן | font | `"David HB"` |  |  |
| `header-verso-left-size-pt` | עמוד שמאלי — סלוט שמאל — גודל (pt) | number | `11` | 6 – 28 |  |
| `header-verso-left-custom-text` | עמוד שמאלי — סלוט שמאל — טקסט מותאם | string | `""` |  |  |

## תוכן העניינים (`TOC`) — 20 settings

| Key | Label (UI) | Type | Default | Allowed / range | Note |
|---|---|---|---|---|---|
| `toc-general-enabled` | תוכן־עניינים כללי מופעל | bool | `true` |  |  |
| `toc-detail-enabled` | תוכן־עניינים מפורט מופעל | bool | `false` |  |  |
| `general-toc-count-numbering` | מספור שורות תוכן כללי | bool | `true` |  | שוחזר מ‑V1/V2 (REQ-HDR-03/HDR-05) |
| `detailed-toc-count-numbering` | מספור שורות תוכן מפורט | bool | `true` |  | S9: מספור שורות בתוכן־עניינים המפורט (Orange eb21383 — הושלם) |
| `general-toc-show-numbering` | תצוגת גיליון בעמודי תוכן כלליים | bool | `true` |  | S9: עמודי תוכן־עניינים כלליים מציגים גיליון כשהם נספרים (count-toc-pages=true) |
| `detailed-toc-show-numbering` | תצוגת גיליון בעמודי תוכן מפורטים | bool | `true` |  | S9: עמודי תוכן־עניינים מפורטים מציגים גיליון כשהם נספרים |
| `toc-level-1-show` | רמת תוכן 1 — הצגה | bool | `true` |  |  |
| `toc-level-1-inline` | רמת תוכן 1 — שורה משורטטת (inline) | bool | `false` |  |  |
| `toc-level-2-show` | רמת תוכן 2 — הצגה | bool | `true` |  |  |
| `toc-level-2-inline` | רמת תוכן 2 — שורה משורטטת (inline) | bool | `false` |  |  |
| `toc-level-3-show` | רמת תוכן 3 — הצגה | bool | `false` |  |  |
| `toc-level-3-inline` | רמת תוכן 3 — שורה משורטטת (inline) | bool | `false` |  |  |
| `toc-level-4-show` | רמת תוכן 4 — הצגה | bool | `false` |  |  |
| `toc-level-4-inline` | רמת תוכן 4 — שורה משורטטת (inline) | bool | `true` |  |  |
| `toc-level-5-show` | רמת תוכן 5 — הצגה | bool | `false` |  |  |
| `toc-level-5-inline` | רמת תוכן 5 — שורה משורטטת (inline) | bool | `true` |  |  |
| `toc-level-6-show` | רמת תוכן 6 — הצגה | bool | `false` |  |  |
| `toc-level-6-inline` | רמת תוכן 6 — שורה משורטטת (inline) | bool | `true` |  |  |
| `toc-level-7-show` | רמת תוכן 7 — הצגה | bool | `false` |  |  |
| `toc-level-7-inline` | רמת תוכן 7 — שורה משורטטת (inline) | bool | `true` |  |  |

## רשת העמוד ומספור (`GRID`) — 18 settings

| Key | Label (UI) | Type | Default | Allowed / range | Note |
|---|---|---|---|---|---|
| `page-size` | גודל עמוד | enum | `"A4"` | A4 \| A5 \| 16x16 \| custom |  |
| `grid-col-width-pct` | רוחב טור (%) | number | `40` | 20 – 60 |  |
| `grid-margin-side-pct` | שוליים צדדיים (%) | number | `7.5` | 2 – 20 |  |
| `grid-gutter-pct` | מרווח בין טורים (%) | number | `2` | 0.5 – 8 |  |
| `grid-block-gap-pct` | מרווח בין בלוקים (%) | number | `2` | 0 – 8 |  |
| `margin-top-px` | שוליים עליונים (px) | number | `20` |  |  |
| `margin-bottom-px` | שוליים תחתונים (px) | number | `20` |  |  |
| `binding-offset-px` | שולי תפירה (px) | number | `0` |  | שולי תפירה א־סימטריים recto/verso |
| `h2-top-offset` | מרחק עליון H2 (px) | number | `33` |  | PT-05: מרחק עליון נפרד H2 |
| `column-divider-style` | סגנון מפריד טורים | enum | `"none"` | none \| thin \| dashed \| double | גובה = Math.min(שני הטורים) − 8px |
| `page-num-format` | תבנית מספור עמודים | enum | `"hebrew"` | hebrew \| decimal \| daf-hebrew |  |
| `page-num-frame` | מסגרת מספר עמוד | enum | `"none"` | none \| circle \| square \| parenthesis \| squares \| floral \| diamond |  |
| `page-num-position` | מיקום מספר עמוד | enum | `"bottom-center"` | bottom-center \| outer-left \| outer-right \| outer \| top \| in-header \| none |  |
| `page-num-initial-value` | ערך התחלתי של מספור | number | `1` |  | שוחזר מ‑V1 (REQ-HDR-03) |
| `page-num-start-idx` | עמוד תחילת התצוגה (סוד) | number | `1` | 1 – 999 | שוחזר מ‑V1 (REQ-HDR-03): סוד העמוד הנספר שממנו מתחיל התצוגה |
| `count-shaar-pages` | מניית עמודי שער במספור | bool | `false` |  |  |
| `count-toc-pages` | מניית עמודי תוכן־עניינים | bool | `false` |  |  |
| `count-endnote-pages` | מניית עמודי הערות־סיום | bool | `false` |  | S7.1.1: אם true — עמודי הערות נספרים במספור ומקבלים גיליון |

## ייצוא (HTML/PDF/ZIP) ומדידה (`EXPORT`) — 1 settings

| Key | Label (UI) | Type | Default | Allowed / range | Note |
|---|---|---|---|---|---|
| `export-html-page-rules` | export-html-page-rules | bool | `true` |  | REQ-EXP-02: כללי @page (גודל עמוד מהרישום) בייצוא HTML עצמאי — מדפיס מדויק |

## מתקדם/מנוע (`ADVANCED`) — 7 settings

| Key | Label (UI) | Type | Default | Allowed / range | Note |
|---|---|---|---|---|---|
| `trace-verbosity` | רמת תיעוד מסלול (trace) | enum | `"standard"` | off \| minimal \| standard \| full |  |
| `diagnostics-enabled` | אבחון מופעל | bool | `true` |  |  |
| `offline-guard` | שומר נתק־מהרשת (exit 7) | bool | `true` |  | exit 7 על בקשה חיצונית (Orange ✓) |
| `debounce-light-change-ms` | השהיית שינויים קלים (ms) | number | `350` | 50 – 2000 (step 50) | REQ-UI-02: ריכוז שינויים קלים (רקע/נושא/שער) לפני רינדור מחדש — 350–400ms לפי Spec §5.3 |
| `measure-impl` | measure-impl | enum | `"table"` | table \| font-metrics | S12 D-72: מימוש מדידה — table = טבלאות מכוילות (ברירת מחדל); font-metrics = טבלאות אמת מגופן רשום (hmtx/cmap/kern/GPOS). שקילות שבירות מוכח… |
| `pdf-crop-marks` | pdf-crop-marks | bool | `false` |  | REQ-EXP-03: סימני חיתוך מחוץ לתבנית החיתוך (TrimBox) בייצוא PDF |
| `export-bleed-mm` | export-bleed-mm | number | `3` | 0 – 6 | REQ-EXP-03: דם הדפסה (BleedBox) במ״מ סביב החיתוך |
