# תכנית עבודה אסטרטגית: שדרוג RED עם רכיבים מהגרסאות הקלאסיות

## 🎯 חזון הפרויקט

**מטרה:** ליצור את מערכת העימוד התורנית הטובה ביותר בעולם, המשלבת:
- מנוע עימוד דטרמיניסטי ומהיר (RED)
- ממשק משתמש בוגר ומקצועי (Orange)
- כלי דיבאג מתקדמים (Gold)
- טעינה אופטימלית (Yellow)
- בדיקות אוטומטיות מקיפות (Green)

**עקרון ברזל:** **אסור לפגוע במנוע הליבה של RED**. כל השיפורים יהיו בשכבות החיצוניות (UI, דיבאג, טעינה, בדיקות).

---

## 📋 ארכיטקטורת העבודה: 5 סוכנים עצמאיים

```
RED Core Engine (קדוש - לא נוגעים!)
    │
    ├─ Agent 1: UI Layer ← Orange UI
    ├─ Agent 2: Debug Layer ← Gold geometry-audit  
    ├─ Agent 3: Font Loader ← Yellow two-stage
    ├─ Agent 4: Test Suite ← Green Playwright
    └─ Agent 5: Docs & Release ← Orange docs
```

**עקרון ההפרדה:** כל סוכן עובד על **ענף נפרד** ועל **קבצים נפרדים**. אין חפיפה בין הסוכנים.

---

## 🚀 Agent 1: UI/UX Integration

**ענף עבודה:** `feature/ui-orange-integration`  
**מטרה:** להחליף את ה-UI הנוכחי של RED בממשק הבוגר של Orange  
**קבצים באחריותך:**
- `index.html` (החלפה מלאה)
- `app.js` (החלפה מלאה)
- `style.css` (החלפה מלאה)
- `ui/` (תיקייה חדשה לקומפוננטות UI)

### צ'קליסט משימות

#### שלב 1: ניתוח והכנה (יום 1-2)
- [ ] **1.1** קרא את `docs/UI_SPEC.md` של RED
- [ ] **1.2** קרא את `index.html` של Orange והבן את המבנה
- [ ] **1.3** מיפה את ה-API של RED Worker:
  ```javascript
  // מה ה-Worker מצפה לקבל
  worker.postMessage({
    type: 'typeset',
    text: string,
    settings: Settings
  });
  
  // מה ה-Worker מחזיר
  worker.onmessage = (e) => {
    const { type, layout, errors } = e.data;
  };
  ```
- [ ] **1.4** צור קובץ `ui/adapter.js` שימיר בין ה-API של Orange ל-API של RED

#### שלב 2: אינטגרציה בסיסית (יום 3-5)
- [ ] **2.1** העתק את `index.html` מ-Orange ל-RED
- [ ] **2.2** העתק את `app.js` מ-Orange ל-RED
- [ ] **2.3** התאם את `app.js` לעבוד עם RED Worker:
  ```javascript
  // במקום הקוד הישן של Orange
  // const result = oldTypesetter(text, settings);
  
  // עשה:
  const worker = new Worker('red-worker.js');
  worker.postMessage({ type: 'typeset', text, settings });
  worker.onmessage = handleResult;
  ```
- [ ] **2.4** בדוק שה-UI טוען ורץ (אפילו אם העימוד לא עובד)

#### שלב 3: חיבור מלא (יום 6-8)
- [ ] **3.1** חבר את כל 12 הפאנלים של Orange ל-RED
- [ ] **3.2** ודא שכל ההגדרות עוברות נכון ל-Worker
- [ ] **3.3** בדוק שהפלט של RED מוצג נכון ב-UI
- [ ] **3.4** הוסף loading indicator (העימוד רץ ב-Worker, ה-UI חופשי)

#### שלב 4: שיפורי UX (יום 9-12)
- [ ] **4.1** הוסף מקשי קיצור (Ctrl+S לשמירה, Ctrl+P לייצוא)
- [ ] **4.2** הוסף drag-and-drop לקבצי טקסט
- [ ] **4.3** הוסף search & replace עם תמיכה בעברית
- [ ] **4.4** הוסף undo/redo להגדרות
- [ ] **4.5** הוסף progress bar לעימודים ארוכים

#### שלב 5: בדיקות ויציבות (יום 13-14)
- [ ] **5.1** בדוק את כל 4 הלשוניות
- [ ] **5.2** בדוק את כל 12 הפאנלים
- [ ] **5.3** בדוק ייצוא ל-PDF דרך ה-UI החדש
- [ ] **5.4** בדוק ייצוא ל-HTML דרך ה-UI החדש
- [ ] **5.5** בדוק שמירת הגדרות ל-localStorage

### קריטריונים להצלחה
- ✅ ה-UI של Orange עובד עם המנוע של RED
- ✅ כל 12 הפאנלים פונקציונליים
- ✅ זמן תגובה של ה-UI < 100ms
- ✅ אין regressions בייצוא PDF/HTML
- ✅ כל הבדיקות של RED עדיין עוברות

### נקודת אינטגרציה
**מתי:** אחרי שסיימת את כל השלבים  
**איך:** צור PR מ-`feature/ui-orange-integration` ל-`main`  
**מה לבדוק:** שה-Worker של RED עדיין מקבל את אותם inputs ומחזיר את אותם outputs

---

## 🐛 Agent 2: Debug Tools Integration

**ענף עבודה:** `feature/debug-gold-tools`  
**מטרה:** להוסיף כלי דיבאג ויזואליים מתקדמים מ-Gold  
**קבצים באחריותך:**
- `debug/` (תיקייה חדשה)
- `debug/geometry-audit.js` (מ-Gold, מותאם)
- `debug/visual-debugger.js` (חדש)
- `debug/debug-panel.html` (חדש)

### צ'קליסט משימות

#### שלב 1: ניתוח והכנה (יום 1-2)
- [ ] **1.1** קרא את `geometry-audit.js` של Gold (1,980 שורות)
- [ ] **1.2** הבן את 12+ הבדיקות הגיאומטריות
- [ ] **1.3** הבן את מבנה ה-JSON ש-RED מייצר:
  ```javascript
  // הפלט של RED Worker
  {
    pages: [{
      pageNumber: number,
      columns: [{
        blocks: [{
          type: 'paragraph' | 'heading' | 'footnote',
          rect: { x, y, width, height },
          lines: [{ text, rect, words }]
        }]
      }]
    }]
  }
  ```
- [ ] **1.4** מיפה את ההבדלים בין DOM-based audit (Gold) ל-JSON-based audit (מה שצריך)

#### שלב 2: התאמת geometry-audit.js (יום 3-6)
- [ ] **2.1** העתק את `geometry-audit.js` מ-Gold ל-`debug/`
- [ ] **2.2** שכתוב את `extractGeometry()` לעבוד עם JSON במקום DOM:
  ```javascript
  // במקום:
  function extractGeometry() {
    const elements = document.querySelectorAll('.block');
    // קורא bounding rects מה-DOM
  }
  
  // עשה:
  function extractGeometry(layoutJSON) {
    // קורא ישירות מה-JSON ש-RED מייצר
    return layoutJSON.pages.map(page => ({
      pageNumber: page.pageNumber,
      blocks: page.columns.flatMap(col => col.blocks)
    }));
  }
  ```
- [ ] **2.3** התאם את 12 הבדיקות לעבוד עם ה-JSON החדש:
  - containment check
  - sibling-overlap detection
  - column-balance verification
  - widow-orphan detection
  - sparse-last-line check
  - overflow-to-footnote detection
  - page-overflow check
  - ornaments placement
  - page-fill-ratio
  - block-gaps detection
  - settings-verification
  - footnote-containment
- [ ] **2.4** הוסף פונקציות `highlightIssue()` ו-`paint()` שעובדות עם canvas/SVG overlay

#### שלב 3: בניית visual debugger (יום 7-10)
- [ ] **3.1** צור `debug/visual-debugger.js`:
  ```javascript
  class VisualDebugger {
    constructor(canvas, layoutJSON) {
      this.canvas = canvas;
      this.layout = layoutJSON;
    }
    
    highlightBlock(blockIndex, color) {
      // מצייר rectangle על ה-canvas
    }
    
    showGrid() {
      // מציג grid של העמוד
    }
    
    showMargins() {
      // מציג את המרווחים
    }
  }
  ```
- [ ] **3.2** צור `debug/debug-panel.html` עם:
  - Canvas overlay על תצוגת העמוד
  - רשימת בעיות שנמצאו
  - כפתורים להדגשת סוגי בעיות
  - slider למעבר בין עמודים
- [ ] **3.3** חבר את ה-debug panel ל-UI הראשי

#### שלב 4: אבחון שלב-אחר-שלב (יום 11-13)
- [ ] **4.1** בקש מ-RED Worker לשלוח snapshots בכל checkpoint:
  ```javascript
  // ב-RED Worker, הוסף:
  self.postMessage({
    type: 'checkpoint',
    stage: 'after-line-breaking',
    snapshot: currentLayout
  });
  ```
- [ ] **4.2** צור timeline viewer שמציג את 4 ה-checkpoints
- [ ] **4.3** הוסף diff viewer שמראה מה השתנה בין checkpoints
- [ ] **4.4** הוסף causality classifier (כמו ב-Gold):
  - created-by-stage
  - fixed-by-stage
  - correction-reverted
  - couldnt-appear-before
  - created-at-first-checkpoint
  - never-appeared
  - unresolved

#### שלב 5: בדיקות ודוקומנטציה (יום 14)
- [ ] **5.1** בדוק את כל 12 הבדיקות על ספר לדוגמה
- [ ] **5.2** בדוק את ה-visual debugger
- [ ] **5.3** בדוק את ה-checkpoint viewer
- [ ] **5.4** כתוב `debug/README.md` עם:
  - איך להפעיל את ה-debugger
  - מה כל בדיקה עושה
  - איך לפרש את התוצאות
  - דוגמאות לבעיות נפוצות

### קריטריונים להצלחה
- ✅ כל 12 הבדיקות עובדות על ה-JSON של RED
- ✅ visual debugger מציג בעיות בצורה ברורה
- ✅ checkpoint viewer עובד
- ✅ אין האטה של >5% בעימוד (ה-debugger רץ בנפרד)
- ✅ המנוע של RED לא השתנה כלל

### נקודת אינטגרציה
**מתי:** אחרי שסיימת את כל השלבים  
**איך:** צור PR מ-`feature/debug-gold-tools` ל-`main`  
**מה לבדוק:** שה-debugger לא מאט את העימוד, ושהמנוע של RED לא השתנה

---

## 🔤 Agent 3: Font Loading Optimization

**ענף עבודה:** `feature/font-loading-optimization`  
**מטרה:** לשפר את זמן הטעינה הראשוני עם טעינה דו-שלבית  
**קבצים באחריותך:**
- `fonts/font-loader.js` (חדש)
- `fonts/core-fonts.json` (חדש)
- `fonts/extended-fonts.json` (חדש)
- `fonts/font-cache.js` (חדש)

### צ'קליסט משימות

#### שלב 1: ניתוח והכנה (יום 1-2)
- [ ] **1.1** קרא את `fonts/` של RED והבן איך הוא טוען פונטים כרגע
- [ ] **1.2** קרא את הרעיון של Yellow: 439 פונטים מיד + 1,315 לפי דרישה
- [ ] **1.3** מיין את הפונטים של RED לשתי קבוצות:
  - **Core fonts** (פונטים נפוצים: David, FrankRuehl, Times New Roman, Arial, וכו')
  - **Extended fonts** (פונטים נדירים יותר)
- [ ] **1.4** צור רשימה של 50-100 פונטי core הכרחיים

#### שלב 2: בניית font loader (יום 3-6)
- [ ] **2.1** צור `fonts/font-loader.js`:
  ```javascript
  class FontLoader {
    constructor() {
      this.coreFonts = new Map();
      this.extendedFonts = new Map();
      this.cache = new FontCache();
    }
    
    async loadCoreFonts() {
      // טוען את 50-100 הפונטים החשובים מיד
      const coreList = await fetch('fonts/core-fonts.json');
      for (const fontName of coreList) {
        const font = await this.loadFont(fontName);
        this.coreFonts.set(fontName, font);
      }
    }
    
    async loadExtendedFonts() {
      // טוען את שאר הפונטים ברקע
      const extendedList = await fetch('fonts/extended-fonts.json');
      for (const fontName of extendedList) {
        if (!this.extendedFonts.has(fontName)) {
          const font = await this.loadFont(fontName);
          this.extendedFonts.set(fontName, font);
        }
      }
    }
    
    getFont(name) {
      return this.coreFonts.get(name) || this.extendedFonts.get(name);
    }
    
    async loadFont(name) {
      // קורא את קובץ הפונט ומפרסר אותו
      // משתמש באותו parser ש-RED כבר משתמש בו
    }
  }
  ```
- [ ] **2.2** צור `fonts/core-fonts.json`:
  ```json
  {
    "fonts": [
      "David",
      "FrankRuehl",
      "Times New Roman",
      "Arial",
      "Calibri",
      "David CLM",
      "Frank Ruehl CLM",
      "Nachlieli CLM",
      ...
    ]
  }
  ```
- [ ] **2.3** צור `fonts/extended-fonts.json`:
  ```json
  {
    "fonts": [
      // כל שאר 1,600+ הפונטים
    ]
  }
  ```
- [ ] **2.4** צור `fonts/font-cache.js` עם IndexedDB caching:
  ```javascript
  class FontCache {
    async get(fontName) {
      // בודק אם הפונט ב-cache
    }
    
    async set(fontName, fontData) {
      // שומר את הפונט ב-cache
    }
  }
  ```

#### שלב 3: אינטגרציה עם RED (יום 7-9)
- [ ] **3.1** התאם את ה-RED Worker להשתמש ב-FontLoader:
  ```javascript
  // בתחילת ה-worker:
  const fontLoader = new FontLoader();
  await fontLoader.loadCoreFonts();
  
  // כשצריך פונט:
  const font = fontLoader.getFont(requestedFont);
  if (!font) {
    // הפונט לא ב-core, נסה לטעון אותו
    await fontLoader.loadExtendedFonts();
    font = fontLoader.getFont(requestedFont);
  }
  ```
- [ ] **3.2** הוסף ל-UI כפתור "טען פונטים נוספים":
  ```javascript
  document.getElementById('load-extended-fonts').onclick = async () => {
    showLoadingIndicator();
    await fontLoader.loadExtendedFonts();
    hideLoadingIndicator();
    showSuccessMessage('נטענו פונטים נוספים');
  };
  ```
- [ ] **3.3** הוסף אינדיקטור טעינה בזמן ש-Core fonts נטענים

#### שלב 4: אופטימיזציות נוספות (יום 10-12)
- [ ] **4.1** הוסף prefetching:
  ```javascript
  // כשהמשתמש פותח את בחירת הפונטים
  fontSelect.onfocus = () => {
    fontLoader.prefetchPopularFonts();
  };
  ```
- [ ] **4.2** הוסף lazy loading לפונטים שלא בשימוש:
  ```javascript
  // רק טוען פונט כשהמשתמש בוחר אותו
  fontSelect.onchange = async (e) => {
    const fontName = e.target.value;
    if (!fontLoader.hasFont(fontName)) {
      await fontLoader.loadFont(fontName);
    }
  };
  ```
- [ ] **4.3** הוסף font fallback chain:
  ```javascript
  function getFontWithFallback(requestedFont) {
    return fontLoader.getFont(requestedFont) 
      || fontLoader.getFont('David')
      || fontLoader.getFont('Times New Roman');
  }
  ```
- [ ] **4.4** מדוד זמני טעינה לפני ואחרי

#### שלב 5: בדיקות ודוקומנטציה (יום 13-14)
- [ ] **5.1** בדוק שכל הפונטים עדיין עובדים
- [ ] **5.2** בדוק ש-Core fonts נטענים תוך < 2 שניות
- [ ] **5.3** בדוק שהכפתור "טען פונטים נוספים" עובד
- [ ] **5.4** בדוק שה-cache עובד (טעינה שנייה מהירה יותר)
- [ ] **5.5** מדוד שיפור בזמן הטעינה הראשוני
- [ ] **5.6** כתוב `fonts/README.md` עם:
  - איך עובדת הטעינה הדו-שלבית
  - איך להוסיף פונט ל-core fonts
  - איך לנקות את ה-cache

### קריטריונים להצלחה
- ✅ זמן טעינה ראשוני < 2 שניות (במקום 10+ שניות)
- ✅ כל הפונטים עדיין זמינים (דרך טעינה לפי דרישה)
- ✅ cache עובד ושומר פונטים בין סשנים
- ✅ אין regressions בדיוק העימוד
- ✅ המנוע של RED לא השתנה (רק הדרך שבה הוא מקבל פונטים)

### נקודת אינטגרציה
**מתי:** אחרי שסיימת את כל השלבים  
**איך:** צור PR מ-`feature/font-loading-optimization` ל-`main`  
**מה לבדוק:** שכל הפונטים עדיין עובדים, ושהמנוע של RED מקבל את אותם פונטים (רק בדרך מהירה יותר)

---

## 🧪 Agent 4: Testing Infrastructure

**ענף עבודה:** `feature/testing-infrastructure`  
**מטרה:** להוסיף מערכת בדיקות אוטומטיות מקיפה מ-Green  
**קבצים באחריותך:**
- `tests/` (תיקייה חדשה או הרחבה של הקיימת)
- `tests/e2e/` (בדיקות E2E עם Playwright)
- `tests/fixtures/` (קבצי טקסט לבדיקות)
- `.github/workflows/` (CI/CD)

### צ'קליסט משימות

#### שלב 1: ניתוח והכנה (יום 1-2)
- [ ] **1.1** קרא את מערכת הבדיקות הקיימת של RED (388 בדיקות)
- [ ] **1.2** קרא את מערכת הבדיקות של Green (Playwright, E2E)
- [ ] **1.3** מיפה את הפערים:
  - אילו בדיקות חסרות?
  - אילו בדיקות E2E צריך?
  - אילו fixtures צריך?
- [ ] **1.4** צור תוכנית בדיקות מקיפה

#### שלב 2: הרחבת בדיקות Unit (יום 3-5)
- [ ] **2.1** העתק את `very_long_test_text.txt` מ-Green
- [ ] **2.2** צור fixtures נוספים:
  ```
  tests/fixtures/
    ├─ short-text.txt
    ├─ long-text.txt
    ├─ complex-footnotes.txt
    ├─ multi-column.txt
    ├─ headings-hierarchy.txt
    └─ ornaments.txt
  ```
- [ ] **2.3** הוסף בדיקות unit חדשות:
  ```javascript
  // tests/unit/font-loader.test.js
  describe('FontLoader', () => {
    test('loads core fonts on initialization', async () => {
      const loader = new FontLoader();
      await loader.loadCoreFonts();
      expect(loader.coreFonts.size).toBeGreaterThan(50);
    });
    
    test('loads extended fonts on demand', async () => {
      const loader = new FontLoader();
      await loader.loadExtendedFonts();
      expect(loader.extendedFonts.size).toBeGreaterThan(1000);
    });
  });
  ```
- [ ] **2.4** הוסף בדיקות ל-geometry-audit:
  ```javascript
  // tests/unit/geometry-audit.test.js
  describe('GeometryAudit', () => {
    test('detects column imbalance', () => {
      const layout = loadFixture('imbalanced-columns.json');
      const issues = audit(layout);
      expect(issues).toContain('column-balance');
    });
  });
  ```

#### שלב 3: בדיקות E2E עם Playwright (יום 6-9)
- [ ] **3.1** התקן Playwright:
  ```bash
  npm install --save-dev @playwright/test
  npx playwright install
  ```
- [ ] **3.2** צור `tests/e2e/ui.spec.js`:
  ```javascript
  import { test, expect } from '@playwright/test';
  
  test('UI loads correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('#editor-panel')).toBeVisible();
    await expect(page.locator('#settings-panel')).toBeVisible();
  });
  
  test('typesetting works through UI', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('#text-input', 'טקסט לדוגמה');
    await page.click('#typeset-button');
    await expect(page.locator('.page')).toBeVisible({ timeout: 10000 });
  });
  
  test('PDF export works', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('#text-input', 'טקסט לדוגמה');
    await page.click('#typeset-button');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('#export-pdf-button');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
  ```
- [ ] **3.3** צור `tests/e2e/determinism.spec.js`:
  ```javascript
  test('same input produces same output', async ({ page }) => {
    const text = 'טקסט ארוך לדוגמה...';
    
    // Run 1
    await page.goto('http://localhost:3000');
    await page.fill('#text-input', text);
    await page.click('#typeset-button');
    const output1 = await page.evaluate(() => getLayoutHash());
    
    // Run 2
    await page.reload();
    await page.fill('#text-input', text);
    await page.click('#typeset-button');
    const output2 = await page.evaluate(() => getLayoutHash());
    
    expect(output1).toBe(output2);
  });
  ```
- [ ] **3.4** צור `tests/e2e/performance.spec.js`:
  ```javascript
  test('typesetting completes within time limit', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('#text-input', veryLongText);
    
    const start = Date.now();
    await page.click('#typeset-button');
    await page.waitForSelector('.page');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000); // < 5 seconds
  });
  ```

#### שלב 4: CI/CD עם GitHub Actions (יום 10-12)
- [ ] **4.1** צור `.github/workflows/ci.yml`:
  ```yaml
  name: CI
  
  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main]
  
  jobs:
    test:
      runs-on: ubuntu-latest
      
      steps:
        - uses: actions/checkout@v3
        
        - name: Setup Node
          uses: actions/setup-node@v3
          with:
            node-version: '18'
        
        - name: Install dependencies
          run: npm ci
        
        - name: Run unit tests
          run: npm test
        
        - name: Run E2E tests
          run: npx playwright test
        
        - name: Upload test results
          uses: actions/upload-artifact@v3
          if: always()
          with:
            name: test-results
            path: test-results/
  ```
- [ ] **4.2** צור `.github/workflows/nightly.yml`:
  ```yaml
  name: Nightly Full Test
  
  on:
    schedule:
      - cron: '0 2 * * *' # 2 AM every day
  
  jobs:
    full-test:
      runs-on: ubuntu-latest
      
      steps:
        - uses: actions/checkout@v3
        
        - name: Setup Node
          uses: actions/setup-node@v3
          with:
            node-version: '18'
        
        - name: Install dependencies
          run: npm ci
        
        - name: Run full test suite
          run: npm run test:full
        
        - name: Run performance benchmarks
          run: npm run test:perf
        
        - name: Generate report
          run: npm run test:report
        
        - name: Upload report
          uses: actions/upload-artifact@v3
          with:
            name: nightly-report
            path: reports/
  ```
- [ ] **4.3** הוסף badges ל-README:
  ```markdown
  ![CI](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/workflows/CI/badge.svg)
  ![Nightly](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/workflows/Nightly%20Full%20Test/badge.svg)
  ```

#### שלב 5: בדיקות ודוקומנטציה (יום 13-14)
- [ ] **5.1** הרץ את כל הבדיקות
- [ ] **5.2** ודא שכל הבדיקות עוברות
- [ ] **5.3** בדוק שה-CI עובד
- [ ] **5.4** מדוד coverage:
  ```bash
  npm run test:coverage
  ```
- [ ] **5.5** כתוב `tests/README.md` עם:
  - איך להריץ את הבדיקות
  - איך להוסיף בדיקות חדשות
  - איך לפרש את התוצאות
  - מה כל בדיקה בודקת

### קריטריונים להצלחה
- ✅ כל הבדיקות עוברות (unit + E2E)
- ✅ coverage > 80%
- ✅ CI רץ אוטומטית על כל PR
- ✅ nightly build רץ כל לילה
- ✅ אין regressions בפונקציונליות
- ✅ המנוע של RED לא השתנה

### נקודת אינטגרציה
**מתי:** אחרי שסיימת את כל השלבים  
**איך:** צור PR מ-`feature/testing-infrastructure` ל-`main`  
**מה לבדוק:** שכל הבדיקות עוברות, ושה-CI מוגדר נכון

---

## 📚 Agent 5: Documentation & Release

**ענף עבודה:** `feature/documentation-release`  
**מטרה:** ליצור תיעוד מקיף ולהכין את הפרויקט לשחרור  
**קבצים באחריותך:**
- `docs/` (הרחבה)
- `README.md` (שכתוב מלא)
- `CONTRIBUTING.md` (חדש)
- `CHANGELOG.md` (חדש)
- `RELEASE_NOTES.md` (חדש)

### צ'קליסט משימות

#### שלב 1: ניתוח והכנה (יום 1-2)
- [ ] **1.1** קרא את כל התיעוד הקיים ב-RED
- [ ] **1.2** קרא את התיעוד של Orange (`docs/`)
- [ ] **1.3** מיפה את הפערים:
  - מה חסר בתיעוד?
  - מה צריך להוסיף?
  - מה צריך לעדכן?
- [ ] **1.4** צור תוכנית תיעוד מקיפה

#### שלב 2: תיעוד טכני (יום 3-6)
- [ ] **2.1** צור `docs/ARCHITECTURE.md`:
  ```markdown
  # Architecture
  
  ## Overview
  RED is a typesetting engine built from scratch with zero runtime dependencies...
  
  ## Core Components
  - **Worker Engine**: Runs in Web Worker, handles all typesetting logic
  - **Font Parser**: Reads font files directly (hmtx, cmap, kern, GPOS)
  - **Line Breaker**: Implements Knuth-Plass algorithm
  - **Page Planner**: Uses dynamic programming for optimal layout
  - **PDF Generator**: Creates PDF 1.4 from scratch
  
  ## Data Flow
  1. UI sends text + settings to Worker
  2. Worker parses text and applies settings
  3. Line breaker computes optimal line breaks
  4. Page planner assigns content to pages
  5. PDF generator creates output
  
  ## File Structure
  ...
  ```
- [ ] **2.2** צור `docs/API.md`:
  ```markdown
  # API Reference
  
  ## Worker API
  
  ### Messages to Worker
  
  #### typeset
  ```javascript
  worker.postMessage({
    type: 'typeset',
    text: string,
    settings: Settings
  });
  ```
  
  #### export-pdf
  ```javascript
  worker.postMessage({
    type: 'export-pdf',
    layout: Layout
  });
  ```
  
  ### Messages from Worker
  
  #### layout-complete
  ```javascript
  {
    type: 'layout-complete',
    layout: Layout,
    stats: {
      pageCount: number,
      wordCount: number,
      processingTime: number
    }
  }
  ```
  ...
  ```
- [ ] **2.3** צור `docs/SETTINGS.md`:
  ```markdown
  # Settings Reference
  
  ## Page Settings
  - `page-width`: Width of the page in mm (default: 210)
  - `page-height`: Height of the page in mm (default: 297)
  - `margin-top`: Top margin in mm (default: 20)
  ...
  
  ## Typography Settings
  - `font-family`: Font family name (default: 'David')
  - `font-size`: Font size in pt (default: 12)
  - `line-height`: Line height multiplier (default: 1.5)
  ...
  ```
- [ ] **2.4** צור `docs/EXTENDING.md`:
  ```markdown
  # Extending RED
  
  ## Adding a New Font
  1. Place font file in `fonts/` directory
  2. Add font name to `fonts/core-fonts.json` or `fonts/extended-fonts.json`
  3. The font parser will automatically detect and parse it
  
  ## Adding a New Setting
  1. Add setting to `Settings` interface in `types.ts`
  2. Add default value to `default-settings.json`
  3. Add UI control in `index.html`
  4. Handle setting in Worker
  ...
  ```

#### שלב 3: תיעוד למשתמשים (יום 7-9)
- [ ] **3.1** שכתוב את `README.md`:
  ```markdown
  # RED - Torah Book Typesetting Engine
  
  [![CI](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/workflows/CI/badge.svg)](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  
  A deterministic, high-performance typesetting engine for Hebrew religious texts.
  
  ## Features
  
  - 🚀 **Fast**: Handles 1000+ page books without breaking a sweat
  - 🎯 **Deterministic**: Same input = exact same output, always
  - 🔒 **Zero Dependencies**: Built from scratch, no external libraries
  - 📄 **Perfect PDF**: Generates PDF 1.4 with embedded fonts
  - 🌐 **Offline**: Works completely offline, no server required
  
  ## Quick Start
  
  ```bash
  git clone https://github.com/SUGINACH/Tora_Book_Typesetter_Red
  cd repo
  npm install
  npm start
  ```
  
  Open http://localhost:3000 in your browser.
  
  ## Documentation
  
  - [Architecture](docs/ARCHITECTURE.md)
  - [API Reference](docs/API.md)
  - [Settings](docs/SETTINGS.md)
  - [Contributing](CONTRIBUTING.md)
  
  ## Contributing
  
  We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.
  
  ## License
  
  MIT License - see [LICENSE](LICENSE) for details.
  ```
- [ ] **3.2** צור `CONTRIBUTING.md`:
  ```markdown
  # Contributing to RED
  
  Thank you for your interest in contributing to RED!
  
  ## How to Contribute
  
  ### Reporting Bugs
  1. Check existing issues first
  2. Create a new issue with:
     - Clear description
     - Steps to reproduce
     - Expected vs actual behavior
     - Sample text that triggers the issue
  
  ### Suggesting Features
  1. Create an issue with the `enhancement` label
  2. Describe the feature and its use case
  3. Discuss with maintainers before implementing
  
  ### Submitting Pull Requests
  1. Fork the repository
  2. Create a feature branch
  3. Make your changes
  4. Add tests
  5. Ensure all tests pass
  6. Submit a PR
  
  ## Code Style
  - Use TypeScript
  - Follow existing code style
  - Add JSDoc comments for public APIs
  - Write tests for new features
  
  ## Development Setup
  ```bash
  git clone https://github.com/your-username/repo
  cd repo
  npm install
  npm run dev
  ```
  
  ## Testing
  ```bash
  npm test          # Unit tests
  npm run test:e2e  # E2E tests
  npm run test:full # All tests
  ```
  
  ## Questions?
  Open an issue or contact the maintainers.
  ```
- [ ] **3.3** צור `docs/TUTORIAL.md`:
  ```markdown
  # Tutorial: Typesetting Your First Book
  
  ## Step 1: Prepare Your Text
  ...
  
  ## Step 2: Configure Settings
  ...
  
  ## Step 3: Run Typesetting
  ...
  
  ## Step 4: Review and Export
  ...
  ```
- [ ] **3.4** צור `docs/TROUBLESHOOTING.md`:
  ```markdown
  # Troubleshooting
  
  ## Common Issues
  
  ### Fonts not loading
  - Check that font files are in `fonts/` directory
  - Check browser console for errors
  - Try clearing the font cache
  
  ### Slow typesetting
  - Large books (500+ pages) may take time
  - Check that you're using the latest version
  - Try closing other browser tabs
  
  ### PDF export fails
  - Check that you have enough disk space
  - Try a shorter text first
  - Check browser console for errors
  ...
  ```

#### שלב 4: הכנה לשחרור (יום 10-12)
- [ ] **4.1** צור `CHANGELOG.md`:
  ```markdown
  # Changelog
  
  All notable changes to this project will be documented in this file.
  
  ## [1.0.0] - 2026-11-XX
  
  ### Added
  - Deterministic typesetting engine
  - Knuth-Plass line breaking algorithm
  - Direct font file parsing (hmtx, cmap, kern, GPOS)
  - PDF 1.4 generation from scratch
  - Web Worker architecture
  - Offline support
  - Geometry audit tools
  - Visual debugger
  - Comprehensive test suite
  - Extensive documentation
  
  ### Changed
  - Complete rewrite from scratch
  - Zero runtime dependencies
  
  ### Fixed
  - Memory issues with large books
  - Determinism across different browsers
  - PDF export quality
  ```
- [ ] **4.2** צור `RELEASE_NOTES.md`:
  ```markdown
  # Release Notes - v1.0.0
  
  ## Highlights
  
  This is the first official release of RED, a completely new typesetting engine built from scratch.
  
  ## What's New
  
  ### Core Engine
  - Deterministic typesetting: same input always produces same output
  - Handles books with 1000+ pages without issues
  - Zero dependencies: no external libraries required
  - Offline-first: works completely offline
  
  ### Typography
  - Knuth-Plass algorithm for optimal line breaking
  - Direct font file parsing for pixel-perfect measurements
  - Support for complex Hebrew typography rules
  
  ### Export
  - PDF 1.4 generation from scratch
  - Embedded fonts with proper Unicode mapping
  - HTML export with @page rules
  
  ## Known Issues
  
  - See [ISSUES.md](docs/ISSUES.md) for current known issues
  
  ## Upgrade Guide
  
  This is a completely new engine, so there's no upgrade path from previous versions.
  See [MIGRATION.md](docs/MIGRATION.md) for guidance.
  
  ## Contributors
  
  Thanks to all contributors who made this release possible!
  ```
- [ ] **4.3** צור `docs/FAQ.md`:
  ```markdown
  # Frequently Asked Questions
  
  ## General
  
  ### What is RED?
  RED is a typesetting engine for Hebrew religious texts...
  
  ### Why "RED"?
  RED stands for...
  
  ### Is RED free?
  Yes, RED is open source under the MIT license.
  
  ## Technical
  
  ### Why zero dependencies?
  ...
  
  ### How does RED achieve determinism?
  ...
  
  ### Can RED handle large books?
  Yes, RED has been tested with books of 1000+ pages...
  ```
- [ ] **4.4** צור `LICENSE` (אם אין):
  ```
  MIT License
  
  Copyright (c) 2026 [Your Name]
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction...
  ```

#### שלב 5: בדיקות ושחרור (יום 13-14)
- [ ] **5.1** בדוק שכל הקישורים בתיעוד עובדים
- [ ] **5.2** בדוק שה-README ברור ומזמין
- [ ] **5.3** בדוק שה-CONTRIBUTING.md ברור
- [ ] **5.4** בדוק שה-CHANGELOG.md מקיף
- [ ] **5.5** צור tag לגרסה:
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```
- [ ] **5.6** צור GitHub Release:
  - כתוב תיאור קצר
  - הוסף את ה-RELEASE_NOTES.md
  - הוסף artifacts (אם יש)
- [ ] **5.7** פרסם ברשתות חברתיות:
  - Twitter/X
  - Reddit (r/programming, r/webdev)
  - Hacker News
  - Jewish tech communities

### קריטריונים להצלחה
- ✅ תיעוד מקיף וברור
- ✅ README מזמין ומקצועי
- ✅ CONTRIBUTING.md ברור
- ✅ CHANGELOG.md מקיף
- ✅ GitHub Release מוכן
- ✅ כל הקישורים עובדים

### נקודת אינטגרציה
**מתי:** אחרי שסיימת את כל השלבים  
**איך:** צור PR מ-`feature/documentation-release` ל-`main`  
**מה לבדוק:** שכל התיעוד במקום, ושה-PR מוכן למיזוג

---

## 🔄 פרוטוקול התקדמות מאורגן

### שלב 1: Kickoff (יום 0)
- [ ] כל 5 הסוכנים מקבלים את התכנית הזו
- [ ] כל סוכן יוצר את הענף שלו:
  ```bash
  git checkout -b feature/[agent-name]
  ```
- [ ] כל סוכן קורא את החלק שלו בתכנית
- [ ] כל סוכן מתחיל בשלב 1 (ניתוח והכנה)

### שלב 2: פיתוח (יום 1-12)
- [ ] כל סוכן עובד על המשימות שלו
- [ ] כל סוכן מבצע commit לענף שלו:
  ```bash
  git add .
  git commit -m "[Agent-X] Add feature Y"
  git push origin feature/[agent-name]
  ```
- [ ] כל סוכן מעדכן את הצ'קליסט שלו
- [ ] אם יש שאלות/חסימות, הסוכן פותח issue ב-main repo

### שלב 3: אינטגרציה (יום 13-14)
- [ ] כל סוכן מסיים את כל המשימות שלו
- [ ] כל סוכן בודק שהקריטריונים להצלחה מתקיימים
- [ ] כל סוכן יוצר PR ל-main:
  ```bash
  # ב-GitHub UI
  # Create Pull Request from feature/[agent-name] to main
  ```
- [ ] כל סוכן מוסיף תיאור ל-PR:
  ```markdown
  ## Summary
  [תיאור קצר של מה נעשה]
  
  ## Changes
  - [רשימת שינויים]
  
  ## Testing
  - [איך נבדק]
  
  ## Checklist
  - [ ] כל המשימות הושלמו
  - [ ] כל הקריטריונים להצלחה מתקיימים
  - [ ] אין regressions
  - [ ] התיעוד עודכן (אם רלוונטי)
  ```

### שלב 4: מיזוג (יום 15)
- [ ] Maintainer בודק את כל 5 ה-PRs
- [ ] Maintainer מוודא שאין קונפליקטים
- [ ] Maintainer ממזג את ה-PRs בסדר הבא:
  1. Agent 4 (Testing) - כדי שנוכל לבדוק את השאר
  2. Agent 3 (Font Loading) - שיפור ביצועים
  3. Agent 2 (Debug Tools) - כלים למפתחים
  4. Agent 1 (UI) - שיפור חווית המשתמש
  5. Agent 5 (Documentation) - תיעוד ושחרור
- [ ] Maintainer מריץ את כל הבדיקות אחרי כל מיזוג
- [ ] Maintainer יוצר tag לגרסה v1.0.0

### שלב 5: שחרור (יום 16)
- [ ] Maintainer יוצר GitHub Release
- [ ] Maintainer מפרסם ברשתות חברתיות
- [ ] Maintainer אוסף פידבק מהקהילה
- [ ] Maintainer מתכנן את הגרסה הבאה (v1.1.0)

---

## 📊 טבלת מעקב התקדמות

| Agent | שלב 1 | שלב 2 | שלב 3 | שלב 4 | שלב 5 | סטטוס |
|-------|-------|-------|-------|-------|-------|-------|
| Agent 1: UI | [ ] | [ ] | [ ] | [ ] | [ ] | 🔴 לא התחיל |
| Agent 2: Debug | [ ] | [ ] | [ ] | [ ] | [ ] | 🔴 לא התחיל |
| Agent 3: Fonts | [ ] | [ ] | [ ] | [ ] | [ ] | 🔴 לא התחיל |
| Agent 4: Testing | [ ] | [ ] | [ ] | [ ] | [ ] | 🔴 לא התחיל |
| Agent 5: Docs | [ ] | [ ] | [ ] | [ ] | [ ] | 🔴 לא התחיל |

**מקרא:**
- 🔴 לא התחיל
- 🟡 בתהליך
- 🟢 הושלם
- ✅ נבדק ואושר

---

## 🎯 כללי ברזל (אל תשכח!)

### כלל 1: המנוע של RED הוא קדוש
- **אסור** לשנות את הלוגיקה של ה-Worker
- **אסור** לשנות את האלגוריתמים (Knuth-Plass, DP, וכו')
- **אסור** לפגוע בדטרמיניזם
- **מותר** רק להוסיף שכבות מעל (UI, דיבאג, טעינה, בדיקות)

### כלל 2: כל סוכן עובד בנפרד
- **אסור** לעבוד על קבצים של סוכן אחר
- **אסור** למזג ענפים של סוכנים אחרים
- **מותר** רק לעבוד על הענף שלך

### כלל 3: בדיקות לפני מיזוג
- **חובה** להריץ את כל הבדיקות לפני יצירת PR
- **חובה** לוודא שאין regressions
- **חובה** לעדכן את הצ'קליסט

### כלל 4: תיעוד הוא חלק מהעבודה
- **חובה** לתעד כל שינוי משמעותי
- **חובה** לעדכן את ה-README אם צריך
- **חובה** לכתוב comments בקוד

### כלל 5: תקשורת היא קריטית
- **חובה** לעדכן אם יש חסימות
- **חובה** לפתוח issue אם יש שאלות
- **חובה** לעדכן את טבלת המעקב

---
# חלק שני: הכנות קדם-ביצוע והגדרת סביבת עבודה

> **הערה:** חלק זה מצורף כהמשך ישיר ל"תכנית עבודה אסטרטגית: שדרוג RED עם רכיבים מהגרסאות הקלאסיות" (חלק ראשון). הוא מכיל את כל ההכנות הטכניות הנדרשות לפני הגשת התכנית לחמשת הסוכנים, כולל קישורים אמיתיים לריפואים השונים.

---

## 📚 חלק 1: מאגר הקישורים האמיתי

להלן כל הריפואים הרלוונטיים לפרויקט. יש להשתמש בקישורים אלו (ולא בקישורים גנריים) בכל התיעוד, ה-PRs, והתקשורת בין הסוכנים.

### 🎯 ריפו היעד (העבודה הראשית)
| ריפו | קישור | תפקיד |
|------|-------|--------|
| **RED** | https://github.com/SUGINACH/Tora_Book_Typesetter_Red | ריפו היעד — כאן מתבצעת כל העבודה |

### 📖 ריפואי המקור (להשוואה ולקוד לדוגמה)
| ריפו | קישור | רלוונטי לסוכן |
|------|-------|---------------|
| **Orange (IMUD_TORANI)** | https://github.com/SUGINACH/IMUD_TORANI | Agent 1 (UI) + Agent 5 (Docs) |
| **Orange Standalone** | https://github.com/SUGINACH/Tora_Book_Typesetter_Orange | Agent 1 (UI) |
| **Gold (V21)** | https://github.com/SUGINACH/Tora_Book_Typesetter_Gold | Agent 2 (Debug Tools) |
| **Yellow (V22)** | https://github.com/SUGINACH/Tora_Book_Typesetter_Yellow | Agent 3 (Font Loading) |
| **Green (V23)** | https://github.com/SUGINACH/Tora_Book_Typesetter_Green | Agent 4 (Testing) |
| **React** | https://github.com/SUGINACH/Tora_Book_Typesetter_React | עיון בלבד — לא משתמשים |

---

## 🏗️ חלק 2: הכנה טכנית של הריפו (יום 0 - לפני הגשת התכנית)

### 2.1 שלב 1: מיפוי מבנה הפרויקט הנוכחי של RED

**פקודות לביצוע:**
```bash
# 1. שכפול הריפו המקומי
git clone https://github.com/SUGINACH/Tora_Book_Typesetter_Red
cd Tora_Book_Typesetter_Red

# 2. יצירת מפת מבנה
tree -L 3 -I 'node_modules|.git|dist|coverage' > project-structure.txt

# 3. ספירת שורות קוד לפי קובץ
find . -name "*.js" -o -name "*.ts" -o -name "*.json" | \
  grep -v node_modules | \
  xargs wc -l > code-metrics.txt

# 4. רשימת כל הקבצים עם hash (למעקב שינויים)
find . -type f -not -path '*/\.*' -not -path '*/node_modules/*' | \
  sort | \
  xargs md5sum > files-checksums.txt
```

**תוצר נדרש:** קובץ `project-structure.txt` שיצורף לתכנית כנספח A.

---

### 2.2 שלב 2: יצירת Backup Branch מוגן

**חשוב מאוד:** לפני כל עבודה, יש ליצור נקודת חזרה בטוחה.

```bash
# ודא שאתה על main ועדכני
git checkout main
git pull origin main

# צור backup עם תאריך
BACKUP_BRANCH="backup/pre-5-agent-work-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH"
git push origin "$BACKUP_BRANCH"

# תעד את ה-hash של main
MAIN_HASH=$(git rev-parse HEAD)
echo "Main branch protected at commit: $MAIN_HASH" > PROTECTION_LOG.md
git add PROTECTION_LOG.md
git commit -m "chore: log main branch state before 5-agent work"
git push origin main
```

**תוצר נדרש:** ענף backup ב-remote + תיעוד ב-`PROTECTION_LOG.md`.

---

### 2.3 שלב 3: הגדרת Branch Protection Rules על main

**הגדרות נדרשות ב-GitHub UI:**

לך אל: `https://github.com/SUGINACH/Tora_Book_Typesetter_Red/settings/branches`

לחץ על **"Add branch protection rule"** והזן:

| הגדרה | ערך |
|--------|-----|
| Branch name pattern | `main` |
| ✅ Require a pull request before merging | מסומן |
| → Require approvals | `1` |
| → Dismiss stale pull request approvals | מסומן |
| → Require review from Code Owners | לא מסומן (אין CODEOWNERS בשלב זה) |
| ✅ Require status checks to pass before merging | מסומן |
| → Require branches to be up to date | מסומן |
| → Status checks required | `test`, `e2e-test` (יוגדרו ע"י Agent 4) |
| ✅ Require conversation resolution | מסומן |
| ✅ Do not allow bypassing the above settings | מסומן |
| ✅ Restrict who can push to matching branches | מסומן — רק אתה |

**שמור.**

---

### 2.4 שלב 4: יצירת 5 ענפי עבודה

```bash
# רשימת הענפים ליצירה
BRANCHES=(
  "feature/agent-1-ui-orange"
  "feature/agent-2-debug-gold"
  "feature/agent-3-font-yellow"
  "feature/agent-4-testing-green"
  "feature/agent-5-docs-release"
)

# יצירה ודחיפה של כל ענף
for branch in "${BRANCHES[@]}"; do
  git checkout main
  git checkout -b "$branch"
  # הוסף README ספציפי לכל ענף
  cat > BRANCH_README.md <<EOF
# $branch

## Agent
[Agent number and role]

## Purpose
[מה הענף מיועד לעשות]

## Status
🔴 Not started

## Last Updated
$(date)
EOF
  git add BRANCH_README.md
  git commit -m "chore: initialize $branch"
  git push origin "$branch"
done

# חזור ל-main
git checkout main
```

**תוצר נדרש:** 5 ענפים פעילים ב-remote, כל אחד עם `BRANCH_README.md`.

---

### 2.5 שלב 5: יצירת מבנה התיקיות הצפוי

```bash
# צור תיקיות חדשות לפי התכנית
mkdir -p debug/geometry
mkdir -p debug/visual
mkdir -p debug/checkpoints
mkdir -p fonts/core
mkdir -p fonts/extended
mkdir -p fonts/cache
mkdir -p ui/components
mkdir -p ui/panels
mkdir -p ui/adapters
mkdir -p tests/e2e/scenarios
mkdir -p tests/e2e/fixtures
mkdir -p tests/unit/new
mkdir -p docs/api
mkdir -p docs/tutorials
mkdir -p docs/troubleshooting
mkdir -p docs/contributing

# צור placeholder files
echo "// Agent 2 will implement" > debug/geometry/.gitkeep
echo "// Agent 3 will implement" > fonts/core/.gitkeep
echo "// Agent 1 will implement" > ui/adapters/.gitkeep
echo "// Agent 4 will implement" > tests/e2e/scenarios/.gitkeep
echo "# Agent 5 will implement" > docs/api/README.md

# Commit
git add .
git commit -m "chore: prepare directory structure for 5-agent work"
git push origin main
```

---

## 📝 חלק 3: תיעוד נדרש (להכין מראש)

### 3.1 קובץ `docs/WORKER_API.md`

**תבנית ליצירה:**

```markdown
# RED Worker API Reference

> נוצר: $(date) | גרסת RED: $(git describe --tags)

## מבוא
כל התקשורת עם מנוע ה-RED מתבצעת דרך Web Worker באמצעות `postMessage`.

## Messages TO Worker (מה-UI ל-Worker)

### 1. typeset
**מטרה:** הפעלת תהליך עימוד מלא

```javascript
worker.postMessage({
  type: 'typeset',
  payload: {
    text: string,           // הטקסט הגולמי
    settings: Settings,      // אובייקט ההגדרות המלא
    fonts: string[]          // רשימת פונטים לשימוש
  }
});
```

**תגובה צפויה:** `layout-complete` או `error`

### 2. export-pdf
**מטרה:** ייצוא הפלט ל-PDF

```javascript
worker.postMessage({
  type: 'export-pdf',
  payload: {
    layout: LayoutObject,
    options: {
      embedFonts: boolean,
      compression: boolean,
      addBookmarks: boolean
    }
  }
});
```

### 3. get-checkpoint
**מטרה:** בקשת snapshot של שלב ביניים (ל-Debug)

```javascript
worker.postMessage({
  type: 'get-checkpoint',
  payload: {
    checkpointName: 'after-line-breaking' | 'after-page-planning' | ...
  }
});
```

## Messages FROM Worker (מה-Worker ל-UI)

### 1. layout-complete
```javascript
{
  type: 'layout-complete',
  payload: {
    layout: {
      pages: Array<{
        pageNumber: number,
        columns: Array<{
          blocks: Array<{
            type: 'paragraph' | 'heading' | 'footnote' | 'ornament',
            rect: { x, y, width, height },
            lines: Array<{ text, rect, words }>,
            metadata: object
          }>
        }>
      }>
    },
    stats: {
      pageCount: number,
      wordCount: number,
      processingTime: number,
      hash: string  // FNV-1a hash לדטרמיניזם
    }
  }
}
```

### 2. progress
```javascript
{
  type: 'progress',
  payload: {
    stage: string,
    percent: number,  // 0-100
    message: string
  }
}
```

### 3. error
```javascript
{
  type: 'error',
  payload: {
    code: 'PARSE_ERROR' | 'FONT_ERROR' | 'LAYOUT_ERROR' | ...,
    message: string,
    details: object
  }
}
```

## טיפוסי נתונים

### Settings
[יש להשלים ע"י המתאם מ-`default_settings.json`]

### LayoutObject
[כפי שמתואר ב-layout-complete]

## דוגמת שימוש מלאה
[קוד מלא של טעינה + הפעלה + קבלת פלט]
```

---

### 3.2 קובץ `docs/SETTINGS_REFERENCE.md`

**הוראות:** יש להפיק אוטומטית מתוך `default_settings.json` של RED.

**פקודה להפקה:**
```bash
# הפק טבלת הגדרות מ-default_settings.json
cat default_settings.json | jq '
  to_entries[] | 
  "| \(.key) | \(.value | type) | \(.value) | [TODO: description] |"
' > settings-table-temp.md
```

**תבנית סופית:**

```markdown
# RED Settings Reference

> הופק אוטומטית מ-default_settings.json

## הגדרות עמוד
| מפתח | סוג | ברירת מחדל | תיאור |
|------|------|------------|--------|
| page-width | number | 210 | רוחב העמוד במ"מ |
| page-height | number | 297 | גובה העמוד במ"מ |
[... המשך הטבלה ...]

## הגדרות טיפוגרפיה
[טבלה]

## הגדרות עימוד
[טבלה]

## הגדרות ייצוא
[טבלה]

## הערות חשובות
- כל ההגדרות הן **immutable** בזמן עימוד
- שינוי הגדרות דורש הפעלה מחדש של העימוד
- כל ההגדרות עוברות JSON validation לפני שליחה ל-Worker
```

---

### 3.3 קובץ `docs/TESTS_BASELINE.md`

**הוראות:** יש להריץ את כל הבדיקות הקיימות ולתעד את התוצאות.

```bash
# הרץ את כל הבדיקות
npm test > test-output.txt 2>&1

# חלץ סטטיסטיקות
echo "# Test Baseline" > TESTS_BASELINE.md
echo "" >> TESTS_BASELINE.md
echo "תאריך: $(date)" >> TESTS_BASELINE.md
echo "Commit: $(git rev-parse --short HEAD)" >> TESTS_BASELINE.md
echo "" >> TESTS_BASELINE.md
echo "## סטטיסטיקות כלליות" >> TESTS_BASELINE.md
echo "\`\`\`" >> TESTS_BASELINE.md
grep -E "Tests|passed|failed|coverage" test-output.txt >> TESTS_BASELINE.md
echo "\`\`\`" >> TESTS_BASELINE.md
```

**תוצר נדרש:** `TESTS_BASELINE.md` עם snapshot של כל הבדיקות לפני תחילת העבודה.

---

## 🔗 חלק 4: קישורים מותאמים לכל סוכן

לכל סוכן יש ריפואים ספציפיים שהוא צריך לעבוד איתם. להלן המיפוי המדויק:

### 🎨 Agent 1: UI/UX Integration
**ענף:** `feature/agent-1-ui-orange`

| ריפו | קישור | למה צריך |
|------|-------|----------|
| RED (יעד) | https://github.com/SUGINACH/Tora_Book_Typesetter_Red | המקום שבו כותבים את הקוד |
| IMUD_TORANI | https://github.com/SUGINACH/IMUD_TORANI | מקור ל-UI של Orange (ענף `main`) |
| Orange Standalone | https://github.com/SUGINACH/Tora_Book_Typesetter_Orange | מקור נוסף ל-UI (31 commits עדכניים) |

**קבצי מפתח לבדיקה:**
- ב-IMUD_TORANI: `index.html`, `app.js`, `style.css`, `settings-manager.js`
- ב-RED: `src/ui/` (ה-UI הנוכחי)

---

### 🐛 Agent 2: Debug Tools Integration
**ענף:** `feature/agent-2-debug-gold`

| ריפו | קישור | למה צריך |
|------|-------|----------|
| RED (יעד) | https://github.com/SUGINACH/Tora_Book_Typesetter_Red | המקום שבו כותבים את הקוד |
| Gold | https://github.com/SUGINACH/Tora_Book_Typesetter_Gold | מקור ל-geometry-audit.js (V21) |

**קבצי מפתח לבדיקה:**
- ב-Gold: `geometry-audit.js` (1,980 שורות), `scripts/step-by-step-audit.js`, `scripts/test-chapters-enhanced.js`
- ב-RED: `src/worker/red-worker.js` (להבנת ה-JSON output)

---

### 🔤 Agent 3: Font Loading Optimization
**ענף:** `feature/agent-3-font-yellow`

| ריפו | קישור | למה צריך |
|------|-------|----------|
| RED (יעד) | https://github.com/SUGINACH/Tora_Book_Typesetter_Red | המקום שבו כותבים את הקוד |
| Yellow | https://github.com/SUGINACH/Tora_Book_Typesetter_Yellow | מקור לרעיון הטעינה הדו-שלבית |

**קבצי מפתח לבדיקה:**
- ב-Yellow: `fonts-def.css`, `fonts-extended.css`, `fonts.json`
- ב-RED: `src/worker/font-parser.js`, תיקיית `fonts/`

---

### 🧪 Agent 4: Testing Infrastructure
**ענף:** `feature/agent-4-testing-green`

| ריפו | קישור | למה צריך |
|------|-------|----------|
| RED (יעד) | https://github.com/SUGINACH/Tora_Book_Typesetter_Red | המקום שבו כותבים את הקוד |
| Green | https://github.com/SUGINACH/Tora_Book_Typesetter_Green | מקור למערכת Playwright + CI/CD |

**קבצי מפתח לבדיקה:**
- ב-Green: `.github/workflows/geometry-audit-cli.yml`, `.github/workflows/geometry-audit-long.yml`, `tools/geometry-audit-cli.js`, `very_long_test_text.txt`
- ב-RED: `tests/` הקיים, `package.json`

---

### 📚 Agent 5: Documentation & Release
**ענף:** `feature/agent-5-docs-release`

| ריפו | קישור | למה צריך |
|------|-------|----------|
| RED (יעד) | https://github.com/SUGINACH/Tora_Book_Typesetter_Red | המקום שבו כותבים את הקוד |
| IMUD_TORANI | https://github.com/SUGINACH/IMUD_TORANI | מקור לתיעוד מקיף (`docs/`, `wiki/`) |

**קבצי מפתח לבדיקה:**
- ב-IMUD_TORANI: `docs/UNIFICATION_PLAN.md`, `wiki/`, `claude_v20/`, `zai_v21/`, `chatgpt_v23/`
- ב-RED: `spec/01_MASTER_SPECIFICATION.md`, `spec/02_MASTER_WORK_PLAN.md`, `README.md` הנוכחי

---

## 🔄 חלק 5: פרוטוקול תקשורת בין סוכנים

### 5.1 ערוץ תקשורת מרכזי
- **פורום:** GitHub Issues בריפו הראשי
- **תג:** `cross-agent` לכל issue שנוגע ליותר מסוכן אחד
- **תג:** `blocking` לכל חסימה שדורשת התערבות המתאם (אתה)

### 5.2 נוהל דיווח יומי
כל סוכן מחויב לעדכן את `BRANCH_README.md` בענף שלו בסוף כל יום עבודה:

```markdown
## Daily Log
### $(date)
- ✅ [מה הושלם]
- 🚧 [מה בעבודה]
- ❌ [חסימות]
- 📊 [סטטוס צ'קליסט: X/Y]
```

### 5.3 נוהל בקשת שינוי API
אם סוכן מגלה שהוא צריך שינוי ב-Worker API של RED (דבר האסור על פי "כללי הברזל"):
1. פתח issue עם התג `api-change-request`
2. תאר את הצורך
3. המתן לאישור המתאם
4. אם אושר — Agent 2 (Debug) יוסיף message חדש בלי לשנות messages קיימים

### 5.4 נוהל מיזוג PR
1. כל סוכן יוצר PR מ-`feature/agent-X-*` ל-`main`
2. לפחות סוכן אחד אחר עושה code review
3. כל status checks חייבים לעבור (יוגדרו ע"י Agent 4)
4. המתאם (אתה) מבצע merge סופי

---

## 📋 חלק 6: צ'קליסט סופי להכנה (למתאם)

לפני הגשת התכנית לסוכנים, ודא שכל הפריטים הבאים הושלמו:

### הכנה טכנית
- [ ] הופק `project-structure.txt`
- [ ] הופק `code-metrics.txt`
- [ ] הופק `files-checksums.txt`
- [ ] נוצר backup branch עם תאריך
- [ ] עודכן `PROTECTION_LOG.md`
- [ ] הוגדרו Branch Protection Rules על main
- [ ] נוצרו 5 ענפי feature ב-remote
- [ ] נוצר מבנה התיקיות המלא
- [ ] נוספו `.gitkeep` files לתיקיות ריקות

### תיעוד נדרש
- [ ] נכתב `docs/WORKER_API.md` עם כל ה-messages
- [ ] נכתב `docs/SETTINGS_REFERENCE.md` מתוך `default_settings.json`
- [ ] נכתב `TESTS_BASELINE.md` עם תוצאות כל הבדיקות הקיימות
- [ ] עודכן `README.md` הראשי עם badges
- [ ] נכתב `CONTRIBUTING.md` בסיסי

### בדיקות וודאיות
- [ ] `npm install` עובד ללא שגיאות
- [ ] `npm test` עובר (388 בדיקות)
- [ ] `npm start` מריץ את האפליקציה
- [ ] כל הקישורים לריפואים עובדים
- [ ] לכל סוכן יש גישת push לענף שלו

---

## 💬 חלק 7: הפרומטים הסופיים להגשה לכל סוכן

להלן הפרומט המדויק שתעביר לכל אחד מחמשת הסוכנים. כל פרומט מותאם אישית לתפקיד הסוכן.

---

### 📬 פרומט ל-Agent 1: UI/UX Integration

```markdown
# משימה: Agent 1 - UI/UX Integration

## אתה
Agent 1 - אחראי על החלפת ה-UI הנוכחי של RED בממשק הבוגר של Orange.

## ענף העבודה שלך
`feature/agent-1-ui-orange`

## ריפואים לעבודה
- **יעד:** https://github.com/SUGINACH/Tora_Book_Typesetter_Red
- **מקור UI:** https://github.com/SUGINACH/IMUD_TORANI (ענף main)
- **מקור UI נוסף:** https://github.com/SUGINACH/Tora_Book_Typesetter_Orange

## התכנית המלאה
קרא את חלק א' של התכנית — "תכנית עבודה אסטרטגית: שדרוג RED" — במיוחד את הסעיף "Agent 1: UI/UX Integration".
לאחר מכן, קרא את חלק ב' (ההכנות) כדי להבין את הסביבה.

## מה אסור לך לעשות
- אסור לגעת בקבצים ב-`src/worker/`
- אסור לשנות את ה-API של ה-Worker
- אסור להתקין תלויות חדשות
- אסור לדחוף ישירות ל-main

## מה מותר לך לעשות
- להחליף את `src/ui/*` לחלוטין
- להוסיף קבצים חדשים ב-`ui/`
- להוסיף adapter שמתרגם בין ה-API של Orange ל-Worker של RED

## תוצר סופי
PR מענף `feature/agent-1-ui-orange` ל-`main` עם:
- UI חדש שעובד עם RED Worker
- כל 12 הפאנלים פונקציונליים
- כל 4 הלשוניות פונקציונליות
- כל הבדיקות הקיימות עוברות

## נקודת התחלה
```bash
git clone https://github.com/SUGINACH/Tora_Book_Typesetter_Red
cd Tora_Book_Typesetter_Red
git checkout feature/agent-1-ui-orange
# קרא BRANCH_README.md ואז את התכנית
```

## דיווח יומי
עדכן את `BRANCH_README.md` בענף שלך בסוף כל יום.
פתח issue עם התג `agent-1` לכל חסימה.

בהצלחה!
```

---

### 📬 פרומט ל-Agent 2: Debug Tools Integration

```markdown
# משימה: Agent 2 - Debug Tools Integration

## אתה
Agent 2 - אחראי על הוספת כלי דיבאג ויזואליים מתקדמים מ-Gold.

## ענף העבודה שלך
`feature/agent-2-debug-gold`

## ריפואים לעבודה
- **יעד:** https://github.com/SUGINACH/Tora_Book_Typesetter_Red
- **מקור Debug Tools:** https://github.com/SUGINACH/Tora_Book_Typesetter_Gold

## התכנית המלאה
קרא את חלק א' של התכנית — במיוחד את הסעיף "Agent 2: Debug Tools Integration".
לאחר מכן, קרא את חלק ב' (ההכנות) להבנת הסביבה.

## מה אסור לך לעשות
- אסור לשנות את הלוגיקה של `red-worker.js`
- אסור לשנות את messages קיימים ב-Worker API
- אסור להאט את העימוד ביותר מ-5%

## מה מותר לך לעשות
- להוסיף `debug/` directory
- להוסיף message חדש ל-Worker: `get-checkpoint` (לקבלת snapshots)
- להוסיף visual debugger שעובד עם ה-JSON של RED

## תוצר סופי
PR מענף `feature/agent-2-debug-gold` ל-`main` עם:
- `geometry-audit.js` מותאם ל-JSON של RED
- visual debugger פונקציונלי
- checkpoint viewer
- `debug/README.md` מקיף

## נקודת התחלה
```bash
git clone https://github.com/SUGINACH/Tora_Book_Typesetter_Red
cd Tora_Book_Typesetter_Red
git checkout feature/agent-2-debug-gold
# קרא BRANCH_README.md ואז את התכנית
```

## דיווח יומי
עדכן את `BRANCH_README.md` בענף שלך בסוף כל יום.
פתח issue עם התג `agent-2` לכל חסימה.

בהצלחה!
```

---

### 📬 פרומט ל-Agent 3: Font Loading Optimization

```markdown
# משימה: Agent 3 - Font Loading Optimization

## אתה
Agent 3 - אחראי על שיפור זמן הטעינה הראשוני באמצעות טעינה דו-שלבית של פונטים.

## ענף העבודה שלך
`feature/agent-3-font-yellow`

## ריפואים לעבודה
- **יעד:** https://github.com/SUGINACH/Tora_Book_Typesetter_Red
- **מקור לרעיון:** https://github.com/SUGINACH/Tora_Book_Typesetter_Yellow

## התכנית המלאה
קרא את חלק א' של התכנית — במיוחד את הסעיף "Agent 3: Font Loading Optimization".
לאחר מכן, קרא את חלק ב' להבנת הסביבה.

## מה אסור לך לעשות
- אסור לשנות את ה-font parser של RED
- אסור לפגוע בדיוק מדידת הפונטים
- אסור להחליף את parser הפונטים ב-CSS @font-face

## מה מותר לך לעשות
- להוסיף שכבת FontLoader מעל ה-parser הקיים
- להוסיף `fonts/font-loader.js` חדש
- להוסיף cache מבוסס IndexedDB
- להוסיף ל-UI כפתור "טען פונטים נוספים"

## תוצר סופי
PR מענף `feature/agent-3-font-yellow` ל-`main` עם:
- FontLoader עם טעינה דו-שלבית
- זמן טעינה ראשוני < 2 שניות
- כל הפונטים עדיין זמינים
- `fonts/README.md` מקיף

## נקודת התחלה
```bash
git clone https://github.com/SUGINACH/Tora_Book_Typesetter_Red
cd Tora_Book_Typesetter_Red
git checkout feature/agent-3-font-yellow
# קרא BRANCH_README.md ואז את התכנית
```

## דיווח יומי
עדכן את `BRANCH_README.md` בענף שלך בסוף כל יום.
פתח issue עם התג `agent-3` לכל חסימה.

בהצלחה!
```

---

### 📬 פרומט ל-Agent 4: Testing Infrastructure

```markdown
# משימה: Agent 4 - Testing Infrastructure

## אתה
Agent 4 - אחראי על הרחבת מערכת הבדיקות האוטומטיות והוספת CI/CD מקצועי.

## ענף העבודה שלך
`feature/agent-4-testing-green`

## ריפואים לעבודה
- **יעד:** https://github.com/SUGINACH/Tora_Book_Typesetter_Red
- **מקור למערכת בדיקות:** https://github.com/SUGINACH/Tora_Book_Typesetter_Green

## התכנית המלאה
קרא את חלק א' של התכנית — במיוחד את הסעיף "Agent 4: Testing Infrastructure".
לאחר מכן, קרא את חלק ב' להבנת הסביבה.

## מה אסור לך לעשות
- אסור לשנות את הקוד של RED עצמו
- אסור להסיר בדיקות קיימות
- אסור לאפשר שהבדיקות יאטו את ה-CI מעבר ל-5 דקות

## מה מותר לך לעשות
- להוסיף בדיקות חדשות ב-`tests/unit/new/`
- להוסיף בדיקות E2E ב-`tests/e2e/` עם Playwright
- להגדיר GitHub Actions workflows
- להגדיר את status checks הנדרשים ל-branch protection
- להוסיף coverage reporting

## תוצר סופי
PR מענף `feature/agent-4-testing-green` ל-`main` עם:
- >500 בדיקות סה"כ
- coverage > 85%
- CI שעובד אוטומטית על כל PR
- nightly build
- `tests/README.md` מקיף
- status checks מוגדרים: `test`, `e2e-test`

## נקודת התחלה
```bash
git clone https://github.com/SUGINACH/Tora_Book_Typesetter_Red
cd Tora_Book_Typesetter_Red
git checkout feature/agent-4-testing-green
# קרא BRANCH_README.md ואז את התכנית
```

## דיווח יומי
עדכן את `BRANCH_README.md` בענף שלך בסוף כל יום.
פתח issue עם התג `agent-4` לכל חסימה.

בהצלחה!
```

---

### 📬 פרומט ל-Agent 5: Documentation & Release

```markdown
# משימה: Agent 5 - Documentation & Release

## אתה
Agent 5 - אחראי על יצירת תיעוד מקיף והכנת הפרויקט לשחרור v1.0.0.

## ענף העבודה שלך
`feature/agent-5-docs-release`

## ריפואים לעבודה
- **יעד:** https://github.com/SUGINACH/Tora_Book_Typesetter_Red
- **מקור לתיעוד:** https://github.com/SUGINACH/IMUD_TORANI (`docs/`, `wiki/`)

## התכנית המלאה
קרא את חלק א' של התכנית — במיוחד את הסעיף "Agent 5: Documentation & Release".
לאחר מכן, קרא את חלק ב' להבנת הסביבה.

## מה אסור לך לעשות
- אסור לשנות את הקוד של RED עצמו
- אסור לשנות את המבנה של `src/worker/`
- אסור ליצור release לפני אישור המתאם

## מה מותר לך לעשות
- להחליף את `README.md` הראשי
- להוסיף תיעוד מקיף ב-`docs/`
- ליצור `CONTRIBUTING.md`, `CHANGELOG.md`, `RELEASE_NOTES.md`
- להכין את ה-PR לשחרור v1.0.0
- לכתוב tutorials ו-FAQs

## תוצר סופי
PR מענף `feature/agent-5-docs-release` ל-`main` עם:
- README חדש ומקצועי
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/SETTINGS.md`
- `docs/EXTENDING.md`
- `docs/TUTORIAL.md`
- `docs/TROUBLESHOOTING.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `RELEASE_NOTES.md` for v1.0.0

## נקודת התחלה
```bash
git clone https://github.com/SUGINACH/Tora_Book_Typesetter_Red
cd Tora_Book_Typesetter_Red
git checkout feature/agent-5-docs-release
# קרא BRANCH_README.md ואז את התכנית
```

## דיווח יומי
עדכן את `BRANCH_README.md` בענף שלך בסוף כל יום.
פתח issue עם התג `agent-5` לכל חסימה.

בהצלחה!
```

---

## 🎯 סיכום פעולות אחרונות לפני ההגשה

### צעד 1: ודא שכל ההכנות הושלמו
עבור על הצ'קליסט בחלק 6 וודא שכל הפריטים מסומנים.

### צעד 2: שלח לכל סוכן את הפרומט שלו
העתק את הפרומט המתאים מחלק 7 ושלח לכל סוכן, יחד עם:
- התכנית המלאה (חלק א' + חלק ב')
- גישה ל-remote repo

### צעד 3: הגדר monitoring
- בדוק את ה-daily logs של כל סוכן מדי יום
- עקוב אחר ה-issues עם תגיות הסוכנים
- אשר/דחה PRs לפי הכללים

### צעד 4: היה מוכן להתערב
- אם סוכן נתקל בחסימה — פתור אותה במהירות
- אם יש קונפליקט בין סוכנים — תעדוף לפי סדר המיזוג: 4 → 3 → 2 → 1 → 5
- אם סוכן חורג מהכללים — עצור והחזר אותו למסלול

---

**התכנית מוכנה. צא לדרך! 🚀**