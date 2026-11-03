# גופני Google המוטמעים (SIL Open Font License 1.1) — red-build/ui/assets/imud/fonts

ברירות המחדל של הפרויקט המקורי (IMUD_TORANI / `default_settings.json`) בנויות על
מחסניות גופנים שהמשפחה הראשונה בהן (AlphaBlack, Livorna, Lia Sgula, Alpha,
AlphaLight, Hadassah Friedlaender) **אינה מותקנת אצל אף אחד** — המקור עצמו נפל
בזמן ריצה למשפחות ההמשך, שנטענו אצלו מ-Google Fonts ברשת:

```css
@import url('https://fonts.googleapis.com/css2?family=...&family=Bellefair&family=David+Libre:...&family=Frank+Ruhl+Libre:...&family=Noto+Serif+Hebrew:...&display=swap');
```

האפליקציה המחודשת אופליינית לחלוטין (K-9 — אסורה בקשת רשת). לכן ארבע המשפחות
שנושאות את המראה המקורי של ספר ברירת מחדל מוטמעות כקבצים בפועל (03.11(ד)):

| משפחה | קובץ | משקלים | שימוש בברירות המחדל המקוריות |
| --- | --- | --- | --- |
| David Libre | DavidLibre-Regular/Medium/Bold.ttf | 400/500/700 | f-h0/f-h2 (fallback של AlphaBlack), f-hdr-* (fallback של Livorna), f-sh-author/sec/year, f-note-title |
| Frank Ruhl Libre | FrankRuhlLibre-VF.ttf (וריאבילי, ברירת מחדל 400) | 300–900 | גוף הטקסט (font-body/f-h0-body), f-note-body, f-sh-desc |
| Bellefair | Bellefair-Regular.ttf | 400 | f-h1 (fallback של Lia Sgula), f-sh-title (fallback של Lia Sgula) |
| Noto Serif Hebrew | NotoSerifHebrew-VF.ttf (וריאבילי, ברירת מחדל 400) | 100–900 | f-h3/f-h4 (fallback של Alpha), f-h6 |

- **מקור ההורדה:** github.com/google/fonts (ofl/davidlibre, ofl/frankruhllibre,
  ofl/bellefair, ofl/notoserifhebrew).
- **רישיון:** SIL Open Font License 1.1 לכל הארבע — מתיר הטמעה, שימוש והפצה
  משנית; עותק הרישיון המלא: https://openfontlicense.org
- **פונטים וריאביליים:** נרשמים כמופע ברירת המחדל (400). משקלי הכותרות (700)
  מסונתזים על ידי הדפדפן מציר המשקל; מדידת המנוע נעשית על מופע 400 — זהה
  לגוף הטקסט.
- שאר 439 הגופנים בתיקייה הומרו מ-woff2 של הפרויקט המקורי
  (ראו `tools/convert_imud_fonts.py`).
