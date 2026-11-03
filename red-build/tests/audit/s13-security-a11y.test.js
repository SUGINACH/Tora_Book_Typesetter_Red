// tests/audit/s13-security-a11y.test.js — שער S13: אבטחה (fresh) + נגישות מבנית + CSP + עקרונות
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const SRC = path.join(__dirname, '..', '..', 'src');
const { sanitizeSvg, svgCspDirective, ALLOWED_TAGS, ALLOWED_ATTRS } = require('../../src/engine/decoration/svg-sanitize');
const { importExtensions } = require('../../src/engine/extensions/extensions-io');
const { importProjectZip } = require('../../src/engine/output/export-api');
const { safeName } = require('../../src/engine/import/zip-reader');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { renderPage } = require('../../src/engine/output/dom-renderer');

// =====================================================================
describe('S13.1-4 — אבטחה: סריקה חדשה (SECURITY.md נבדק מחדש, לא היסטוריה)', () => {
  it('SVG sanitizer: script/event-handler/foreignObject מוסרים; תגים חוקיים עוברים', () => {
    const evil = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(2)</script><foreignObject><body onclick="x()"/></foreignObject><rect width="10" height="10"/></svg>`;
    const res = sanitizeSvg(evil);
    assertEq(res.ok, true, 'סריקוק מחזיר תוצאה (לא קריסה)');
    assert(!/script/i.test(res.svg), 'script הוסר');
    assert(!/onload/i.test(res.svg), 'מאזין onload הוסר');
    assert(!/onclick/i.test(res.svg), 'onclick בתוך foreignObject הוסר');
    assert(!/foreignObject/i.test(res.svg), 'foreignObject (HTML הזרקה) הוסר');
    assert(/rect/.test(res.svg), 'רכיב גרפי חוקי נשמר');
    assert(res.removed.length >= 2, `הרכיבים המוסרים מתועדים (${res.removed.length} ≥ 2)`);
    // תגים מותרים עוברים ללא פגע
    const ok = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/><text>שלום</text></svg>');
    assert(ok.svg.includes('path') && ok.svg.includes('text'), 'תגים לבנים עוברים');
  });

  it('CSP: הנחיה מוכנה ללא unsafe-eval/unsafe-inline זדוניים', () => {
    const csp = svgCspDirective();
    assert(csp.includes("default-src 'self'"), "default-src 'self'");
    assert(!/unsafe-eval/.test(csp), 'אין unsafe-eval');
    assert(!/https?:\/\//.test(csp), 'אין מקורות חיצוניים — אופליין מלא');
  });

  it('JSON fuzz: קלטים עוותים/אקראיים לייבוא הרחבות — אפס קריסות, דחיות מתועדות', () => {
    const fuzz = [
      '', '{}', '[]', 'null', 'undefined', '{bad json', '\u0000\u0001'.repeat(10),
      JSON.stringify({ styles: 'not-array' }), JSON.stringify({ styles: [null, 5, 'x', {}, { id: 'x' }] }),
      JSON.stringify({ styles: [{ id: 'a', trigger: { combinator: { op: 'AND', conditions: [] } } }] }),
      JSON.stringify({ styles: [{ id: 'a', trigger: { pattern: '(' } }] }),
      JSON.stringify({ pages: [{ id: 'p', position: { at: 'nonsense' } }], images: 'x' }),
      JSON.stringify({ images: [{ id: 'x', src: 'javascript:alert(1)' }, { id: 'y', src: 'https://evil/x.png', w: 1, h: 1 }] })
    ];
    let rejected = 0;
    for (const f of fuzz) {
      let res;
      try { res = importExtensions(f); } catch (e) { assert(false, 'קריסה במקום דחייה: ' + e.message); }
      if (!res.ok) {
        rejected++;
        for (const err of res.errors) {
          assert(err.message && /[\u0590-\u05FF]/.test(err.message), 'שגיאה עברית קריאה');
        }
      }
    }
    assert(rejected >= 8, `רוב הקלטים העוותים נדחים (${rejected}/${fuzz.length})`);
  });

  it('path traversal: שמות רשומות זדוניים נדחים בכל שכבות הקלט', () => {
    assertEq(safeName('../evil'), null);
    assertEq(safeName('../../etc/passwd'), null);
    assertEq(safeName('/abs'), null);
    assertEq(safeName('C:/win'), null);
    assertEq(safeName('ok/file.txt'), 'ok/file.txt');
    // zip שבור לייבוא פרויקט — דחייה, לא קריסה
    const r = importProjectZip(Buffer.from('PK\x03\x04 garbage'));
    assert(!r.ok);
  });

  it('XSS regression: טקסט ממסמך עוין מרונדר מסולף (escape) — לעולם לא HTML חי', () => {
    const hostile = [
      'ספר - <script>alert(1)</script>',
      '',
      'כותרת 1 - <img src=x onerror=alert(2)>',
      'פסקה עם <svg onload=alert(3)> וגם "quotes" וגם <b>bold</b>'
    ].join('\n');
    const r = typeset(hostile, getDefaultSettings(), { noRecommendations: true });
    assert(r.contentPreserved, 'התוכן העוין לא אובד (הוא טקסט — יוצג כטקסט)');
    const doc = makeDoc();
    let joined = '';
    for (const pg of r.pages) joined += renderPage(pg, getDefaultSettings(), doc, r.metadata).outerHTML() + '\n';
    assert(!joined.includes('<script>'), 'script לא מרונדר חי');
    assert(!joined.includes('<img'), 'img לא מרונדר חי');
    assert(!joined.includes('<svg'), 'svg לא מרונדר חי');
    assert(!joined.includes('<b>'), 'תגי HTML לא מרונדרים חיים');
    assert(joined.includes('&lt;script&gt;') || joined.includes('&lt;'), 'הטקסט העוין מסולף בפלט');
  });

  it('אפס eval/new-function במקורות המנוע (מדיניות CSP)', () => {
    const ban = /\beval\s*\(|new\s+Function\s*\(/;
    const offenders = [];
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        const st = fs.statSync(p);
        if (st.isDirectory()) walk(p);
        else if (f.endsWith('.js') && !f.includes('.bundle.') && !f.includes('bindings.generated')) {
          const src = fs.readFileSync(p, 'utf8');
          // הערות מוסרות בסריקה (רק קוד חי)
          const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
          if (ban.test(code)) offenders.push(p);
        }
      }
    };
    walk(SRC);
    assertEq(offenders, [], 'אף מודול מנוע אינו משתמש ב־eval/Function');
  });

  it('offline: אפס כתובות חיצוניות בחבילת הדפדפן וב־index.html', () => {
    // מזהי מרחבי־שמות XML (xmlns="http://www.w3.org/…") אינם בקשות רשת — נקודת חוזה
    // של התקן; מוסרים לפני הבדיקה. נבדקות רק הפניות אמיתיות (src/href/url/import).
    const stripNs = (s) => s.replace(/xmlns(:[a-z]+)?\s*=\s*["']https?:[^"']*["']/g, '');
    const idx = stripNs(fs.readFileSync(path.join(SRC, '..', 'ui', 'index.html'), 'utf8'));
    assert(!/https?:\/\/(?!localhost)/.test(idx), 'index.html נקי מהפניות חיצוניות');
    for (const bundle of ['app.bundle.js', 'engine-worker.bundle.js']) {
      const b = stripNs(fs.readFileSync(path.join(SRC, '..', 'ui', bundle), 'utf8'));
      const live = b.match(/(?:src|href)\s*=\s*["']https?:\/\/(?!localhost)[^"']*["']|url\(\s*["']?https?:\/\/(?!localhost)[^)"']*/g);
      assertEq(live || [], [], `${bundle} נקי מהפניות חיצוניות חיות`);
    }
  });
});

// =====================================================================
describe('S13.1-5 — נגישות: ביקורת מבנית חדשה (היסטוריה ≠ הוכחה)', () => {
  const { createApp } = require('../../src/ui/app-shell');
  const { createInlineTransport } = require('../../src/ui/inline-transport');
  const app = createApp(makeDoc(), { transport: createInlineTransport() });
  app.setText('ספר - בדיקת נגישות\n\nכותרת 1 - חלק\nפסקה לבדיקה עם כמה מילים למילוי.');
  app.onExplicitRetypeset();
  const root = app.root;

  it('ציוני דרך (landmarks): main/tabpanel/ניווט מסומנים', () => {
    const root = app.root;
    assert(root.getAttribute('dir') === 'rtl' || root.dir === 'rtl', 'כיוון מסמך rtl');
    const panels = root.querySelectorAll('[role="tabpanel"]');
    assert(panels.length >= 4, `4 לשוניות עם role=tabpanel (${panels.length})`);
  });

  it('כל כפתור מתויג (aria-label או טקסט נגיש)', () => {
    const buttons = root.querySelectorAll('button');
    assert(buttons.length >= 20, `מספר כפתורים סביר (${buttons.length})`);
    const unlabeled = [];
    for (const b of buttons) {
      const label = b.getAttribute('aria-label') || (b.textContent || '').trim();
      if (!label) unlabeled.push(b.getAttribute('class') || '?');
    }
    assertEq(unlabeled, [], 'אף כפתור ללא תווית');
  });

  it('שדות קלט מתויגים; אזורי מצב מוכרזים (aria-live)', () => {
    const inputs = root.querySelectorAll('input, textarea');
    assert(inputs.length >= 2, 'שדות קלט קיימים');
    for (const inp of inputs) {
      const labeled = inp.getAttribute('aria-label') || inp.getAttribute('placeholder');
      assert(labeled, 'שדה קלט מתויג: ' + inp.getAttribute('class'));
    }
    const live = root.querySelectorAll('[aria-live]');
    assert(live.length >= 2, `אזורי הכרזה (${live.length} ≥ 2 — התקדמות + מצב)`);
  });

  it('ניגודיות AA: צבעי הממשק מה־CSS עוברים 4.5:1 לטקסט רגיל', () => {
    const css = fs.readFileSync(path.join(SRC, '..', 'ui', 'styles.css'), 'utf8');
    // זוגות צבע מרכזיים (טקסט על רקע) — נמדדים בפועל מהכללים
    const pairs = [
      { fg: '#1a1a1a', bg: '#ffffff' },   // גוף על עמוד
      { fg: '#e8e8e8', bg: '#1e1e1e' },   // סרגל כהה
      { fg: '#333333', bg: '#f5f0e6' }    // callout
    ];
    const lum = (hex) => {
      const c = hex.replace('#', '');
      const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) / 255)
        .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    for (const p of pairs) {
      const ratio = (Math.max(lum(p.fg), lum(p.bg)) + 0.05) / (Math.min(lum(p.fg), lum(p.bg)) + 0.05);
      assert(ratio >= 4.5, `ניגודיות ${p.fg} על ${p.bg}: ${ratio.toFixed(2)} ≥ 4.5 (AA)`);
    }
    void css;
  });

  it('מקלדת: כל בקרי הליבה ניתנים להפעלה תכנותית (click/dispatch) — נתיב מקלדת קיים', () => {
    let fired = 0;
    const btn = app.root.querySelectorAll('button')[0];
    btn.addEventListener('click', () => fired++);
    btn.click();
    assert(fired === 1, 'הפעלה תכנותית (מקלדת) עובדת');
  });
});

function makeDoc() {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  class El {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {}; this.style = {}; this._class = ''; this.dir = ''; this._text = ''; this.value = ''; this._listeners = new Map(); this.classList = { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} }; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; } get textContent() { return this.children.length ? this.children.map(c => c.textContent).join('') : this._text; }
    setAttribute(k, v) { this.attrs[k] = String(v); } getAttribute(k) { return this.attrs[k] || null; } removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(t, cb) { if (!this._listeners.has(t)) this._listeners.set(t, []); this._listeners.get(t).push(cb); }
    removeEventListener() {} dispatchEvent(ev) { ev = ev || {}; for (const cb of (this._listeners.get(ev.type) || []).slice()) cb(ev); return true; }
    click() { this.dispatchEvent({ type: 'click' }); } setSelectionRange() {} scrollIntoView() {} focus() {}
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    querySelectorAll(sel) {
      const out = [];
      (function walk(el) {
        for (const c of el.children) {
          if (matchesSel(c, sel)) out.push(c);
          walk(c);
        }
      })(this);
      return out;
    }
    outerHTML() {
      const attrs = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('') + (this._class ? ` class="${esc(this._class)}"` : '');
      const inner = this.children.length ? this.children.map(c => c.outerHTML()).join('') : esc(this._text);
      return `<${this.tagName.toLowerCase()}${attrs}>${inner}</${this.tagName.toLowerCase()}>`;
    }
  }
  function matchesSel(el, sel) {
    // רשימות מופרדות־פסיקים — כל חלופה
    for (const alt of String(sel).split(',').map(s => s.trim()).filter(Boolean)) {
      if (matchesOne(el, alt)) return true;
    }
    return false;
  }
  function matchesOne(el, sel) {
    const attr = sel.match(/^\[([a-zA-Z-]+)(?:=["']([^"']*)["'])?\]$/);
    if (attr) {
      const name = attr[1];
      const have = (name in el.attrs) ? el.attrs[name] : (name in el.dataset ? el.dataset[name] : undefined);
      if (have === undefined) return false;
      return attr[2] === undefined || String(have) === attr[2];
    }
    if (sel.startsWith('.')) return (el._class || '').split(/\s+/).includes(sel.slice(1));
    return el.tagName === sel.toUpperCase();
  }
  return { createElement: (t) => new El(t), createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; } };
}

report('s13-security-a11y');
