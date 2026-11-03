// src/ui/app-shell.js — מעטפת האפליקציה (S10.1: לשוניות, ⚡, רינדור־קל, סנכרונים)
'use strict';

/**
 * ארבע לשוניות (REQ-UI-01): עורך / הגדרות / בדיקה / תצוגה.
 *
 * **F-06 — היקף הנתיבים למנוע (מאוכף בסריקת callgraph-scan):**
 * בקובץ זה requestTypeset נקרא **רק** מתוך onExplicitRetypeset (כפתור ⚡ —
 * נתיב מיידי בלי debounce) אשר משרת גם את onDocumentAction (הדבקה/ייבוא —
 * פעולות מסמך מפורשות). שינויי הגדרות עוברים דרך onSettingChanged בלבד:
 * קלים ⇒ רינדור־מחדש מרוכז (בלי מנוע); כבדים ⇒ סימון המתנה + ⚡ מהבהב.
 */

const { getDefaultSettings, findKey } = require('../engine/core/settings-registry');
const { migrate, mergeWithDefaults } = require('../engine/output/project-io');
const { buildStatusStrip } = require('./status-strip');
const { buildEditorTab } = require('./editor-tab');
const { buildSettingsTab } = require('./settings-panel');
const { buildExtensionsPanel } = require('./extensions-panel');
const { importDocx } = require('../engine/import/docx-import');
const { applyEdit } = require('../engine/audit/text-edits'); // **S11:** מקור יחיד טהור — בלי pipeline
const { buildPreviewTab } = require('./preview-tab');
const { buildTestingTab } = require('./testing-tab');
const { WorkerEngineClient } = require('./worker-client');
const { classifyChange, getDebounceMs, policyTable } = require('./retypeset-policy');
const { buildCaretMap } = require('./caret-map');

const TABS = [
  { id: 'editor', label: '✍️ עורך' },
  { id: 'settings', label: '⚙️ הגדרות' },
  { id: 'testing', label: '🔍 בדיקה' },
  { id: 'preview', label: '📖 תצוגה' }
];

function createApp(doc, opts = {}) {
  const settings = getDefaultSettings();
  let text = '';
  let result = null;            // תוצאה מסוריאליזת פרוטוקול (D-65)
  let caretMapObj = null;
  let lightDirty = false, heavyDirty = false;
  let lightTimer = null;
  let lastLightRefreshMs = null;
  const perf = (typeof performance !== 'undefined' && performance.now) ? performance : { now: () => Date.now() };

  // בדיקות/Node: תעבורה inline (אותו פרוטוקול) — נטענת בעצלתיים כדי ש־bundle
  // הדפדפן לא יגרור את המנוע (שם רץ Worker אמיתי — ראו inline-transport.js).
  function makeDefaultTransport() {
    const { createInlineTransport } = require('./inline-transport');
    return createInlineTransport();
  }
  const engine = new WorkerEngineClient(opts.transport || makeDefaultTransport());

  // ================= חלקי ה־UI =================
  const status = buildStatusStrip(doc, { onExplicitRetypeset: () => onExplicitRetypeset() });

  const editor = buildEditorTab(doc, {
    onTextChange: (t) => { text = t; markHeavyDirty('טקסט השתנה'); },
    onDocumentAction: (action, payload) => onDocumentAction(action, payload),
    onImportTxt: () => opts.onRequestTxtImport && opts.onRequestTxtImport(),
    onImportDocx: () => opts.onRequestDocxImport && opts.onRequestDocxImport(),
    onClearDocument: () => onDocumentAction('clear', ''),
    onCaretMove: (charIndex) => onCaretMove(charIndex),
    onJumpToPage: (pageIndex) => { switchTab('preview'); preview.scrollToPage(pageIndex); }
  });

  const settingsPanel = buildSettingsTab(doc, {
    getSettings: () => settings,
    onSettingChanged: (key, value) => onSettingChanged(key, value),
    onResetField: (key) => onResetField(key),
    onSaveTemplate: () => opts.onSaveTemplate && opts.onSaveTemplate(saveTemplateJson()),
    onLoadTemplate: () => opts.onLoadTemplate && opts.onLoadTemplate(),
    onOpenBuilder: () => opts.onOpenBuilder && opts.onOpenBuilder(),
    onOpenImports: () => opts.onOpenImports && opts.onOpenImports()
  });

  // **S11:** סקציית הרחבות מסמך — בתחתית לשונית ההגדרות (מנותק מ־12 פאנלי הרישום).
  // שינוי הרחבות = כבד (F-06): אין עימוד אוטומטי — ⚡ בלבד.
  const extensions = buildExtensionsPanel(doc, {
    onBundleChange: (bundle) => {
      if (bundle && bundle.styles.length) {
        settings._customStyles = JSON.stringify(bundle.styles.map(s => ({
          id: s.id, name: s.name, trigger: s.trigger, layoutMode: s.layoutMode,
          style: s.style, counter: s.counter, linkedOrnaments: s.linkedOrnaments
        })));
      } else delete settings._customStyles;
      if (bundle && bundle.pages.length) {
        settings._customPages = JSON.stringify({ pages: bundle.pages });
      } else delete settings._customPages;
      if (bundle) markHeavyDirty('הרחבות השתנו');
      else markHeavyDirty('הרחבות הוסרו');
    },
    onRequestImport: () => opts.onRequestExtensionsImport && opts.onRequestExtensionsImport(),
    onExport: () => opts.onSaveExtensions && opts.onSaveExtensions(extensions.exportText()),
    onShare: () => { status.setNotice(extensions.shareText()); }
  });
  settingsPanel.root.appendChild(extensions.root);

  const preview = buildPreviewTab(doc, {
    onActivatePage: (pageIndex) => onActivatePage(pageIndex),
    onDebugDownload: (pageIndex) => opts.onDebugDownload && opts.onDebugDownload(buildDebugJson(pageIndex), pageIndex),
    // **S12 (REQ-EXP-01..04):** נתיב הייצוא האחיד — מקור יחיד לטקסט/הגדרות/הרחבות.
    onExport: (kind) => onExportRequest(kind)
  });

  const testing = buildTestingTab(doc, {
    onActivateFinding: (f) => activateFinding(f), // כלל 2: נתיב ההפעלה האחיד
    onApplyRecommendation: (rec) => applyRecommendation(rec) // **S11:** החלה על המקור
  });

  // ================= בניית שלד =================
  const root = doc.createElement('div');
  root.className = 'app';
  root.dir = 'rtl';

  const header = doc.createElement('header');
  header.className = 'app-header';
  const title = doc.createElement('h1');
  title.className = 'app-title';
  title.textContent = 'ספר תורה — מערך עימוד (Red)';
  header.appendChild(title);
  header.appendChild(status.root);
  // טבלת המדיניות מוצגת בעזרה (REQ-UI-02: policy table rendered in UI help)
  const help = doc.createElement('details');
  help.className = 'policy-help';
  const helpSum = doc.createElement('summary');
  helpSum.textContent = 'מדיניות עדכון (קל/כבד)';
  help.appendChild(helpSum);
  for (const row of policyTable()) {
    const d = doc.createElement('div');
    d.className = `policy-row policy-row--${row.cls}`;
    const b = doc.createElement('strong'); b.textContent = row.labelHe;
    const keys = doc.createElement('div'); keys.className = 'policy-keys'; keys.textContent = row.keys.join(' · ');
    const beh = doc.createElement('div'); beh.className = 'policy-beh'; beh.textContent = row.behaviorHe;
    d.appendChild(b); d.appendChild(keys); d.appendChild(beh);
    help.appendChild(d);
  }
  header.appendChild(help);
  root.appendChild(header);

  const tabbar = doc.createElement('nav');
  tabbar.className = 'tabbar';
  tabbar.setAttribute('role', 'tablist');
  tabbar.setAttribute('aria-label', 'לשוניות ראשיות');
  const tabBtns = new Map();
  for (const t of TABS) {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'tabbtn';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', t.id === 'editor' ? 'true' : 'false');
    b.dataset.tab = t.id;
    b.textContent = t.label;
    b.addEventListener('click', () => switchTab(t.id));
    tabbar.appendChild(b);
    tabBtns.set(t.id, b);
  }
  root.appendChild(tabbar);

  const main = doc.createElement('main');
  main.className = 'app-main';
  const panels = new Map([
    ['editor', editor.root], ['settings', settingsPanel.root],
    ['testing', testing.root], ['preview', preview.root]
  ]);
  for (const [id, el] of panels) {
    el.classList.add(id === 'editor' ? 'active' : 'inactive');
    main.appendChild(el);
  }
  root.appendChild(main);

  function switchTab(id) {
    for (const [pid, el] of panels) el.classList.toggle('active', pid === id);
    for (const [bid, b] of tabBtns) b.setAttribute('aria-selected', bid === id ? 'true' : 'false');
  }

  // ================= נתיבי המנוע המפורשים (F-06) =================

  /** ⚡ — הנתיב המיידי היחיד להרצת המנוע מה־UI (בלי debounce; מנקה המתנות). */
  function onExplicitRetypeset() {
    if (lightTimer != null) { clearTimeout(lightTimer); lightTimer = null; }
    lightDirty = false; heavyDirty = false;
    status.setPending({ light: false, heavy: false });
    status.setEngineState('working', { label: 'מתחיל עימוד…' });
    const started = perf.now();
    const { promise } = engine.requestTypeset({
      text, settings,
      onProgress: (m) => status.setEngineState('working', m) // "עמוד X מתוך Y"
    });
    promise.then((res) => {
      if (res && res.cancelled) return;
      result = res;
      applyResultToViews();
      status.setEngineState('idle');
      status.setPages(result.pages.length);
    }).catch((e) => {
      status.setEngineState('error', { message: e && e.message ? e.message : String(e) });
    });
    return started;
  }

  /** פעולות מסמך מפורשות — הדבקה / ייבוא TXT / פתיחה. פעולה שלמה ⇒ עימוד מיידי. */
  function onDocumentAction(action, payload) {
    if (action === 'clear') {
      text = '';
      editor.setText('');
      result = null;
      caretMapObj = null;
      preview.setResult({ pages: [], report: { findings: [], counts: {} }, trace: { events: [] }, tokens: [], droppedEvents: 0 }, settings);
      testing.setResult({ pages: [], report: { findings: [], counts: {} }, trace: { events: [] }, tokens: [], droppedEvents: 0 });
      editor.setPageBreaks([]);
      status.setPages(0);
      status.setPending({ light: false, heavy: false });
      status.setEngineState('idle');
      return;
    }
    if (action === 'paste' || action === 'import-txt' || action === 'open') {
      text = String(payload != null ? payload : '');
      editor.setText(text);
      onExplicitRetypeset(); // פעולת מסמך מפורשת — נתיב מיידי (progress מוצג)
    }
  }

  // ================= מדיניות שינויי הגדרות (D-64) =================

  function onSettingChanged(key, value) {
    settings[key] = value;
    if (classifyChange(key) === 'light') scheduleLightRefresh();
    else markHeavyDirty();
  }

  /** רינדור־מחדש קל: מרוכז לפי debounce-light-change-ms (D-44) — בלי מנוע. */
  function scheduleLightRefresh() {
    lightDirty = true;
    status.setPending({ light: true, heavy: heavyDirty });
    if (lightTimer != null) clearTimeout(lightTimer);
    const ms = getDebounceMs(settings);
    lightTimer = setTimeout(() => {
      lightTimer = null;
      runLightRefresh();
    }, ms);
  }

  function runLightRefresh() {
    if (!result) { lightDirty = false; status.setPending({ light: false, heavy: heavyDirty }); return; }
    const t0 = perf.now();
    preview.setResult(result, settings); // רינדור בלבד — אותם עמודים, הגדרות חדשות
    lastLightRefreshMs = perf.now() - t0;
    lightDirty = false;
    status.setPending({ light: false, heavy: heavyDirty });
  }

  /** כבד ⇒ אין עימוד אוטומטי (F-06): סימון + ⚡ מהבהב. */
  function markHeavyDirty(why) {
    heavyDirty = true;
    status.setPending({ light: lightDirty, heavy: true });
  }

  function onResetField(key) {
    const row = findKey(key);
    if (!row) return;
    onSettingChanged(key, row.default); // מסלול המדיניות הרגיל (קל/כבד)
    settingsPanel.refreshValues();
  }

  // ================= S11: ייבוא DOCX + החלת המלצות =================

  /** ייבוא קובץ DOCX (בתים) — המרה במקור היחיד; סירוב פורמט = הודעה עברית בלי קריסה (חוק 14). */
  function importDocxFile(bytes, fileName) {
    const res = importDocx(bytes, fileName);
    if (res.ok) {
      onDocumentAction('open', res.text); // נתיב מיידי (progress מוצג)
      status.setNotice(res.message);
    } else {
      status.setNotice(res.message); // «פורמט לא נתמך» — לא נטען, לא קורס
    }
    return res.ok;
  }

  /** החלת המלצה על טקסט המקור — החלת העריכה באותה פונקציה שהוכיחה אותה (מקור יחיד). */
  function applyRecommendation(rec) {
    if (!rec || !rec.edit || rec.edit.lineFromIdx == null || rec.edit.lineToIdx == null) return false;
    const lines = String(text).split('\n');
    const next = applyEdit(lines, { type: rec.edit.type, fromLine: rec.edit.lineFromIdx, toLine: rec.edit.lineToIdx });
    if (next == null) { status.setNotice('ההמלצה לא הוחלה — השורות במקור השתנו מאז חישובה.'); return false; }
    text = next;
    editor.setText(text);
    onExplicitRetypeset(); // פעולה מפורשת — נתיב מיידי
    status.setNotice('ההמלצה הוחלה והמסמך עומד מחדש.');
    return true;
  }

  // ================= S12: ייצוא (HTML עצמאי / PDF / ZIP) =================

  /** בקשת ייצוא — קריאה בלבד (F-06: אין עימוד/אין שינוי מצב); הפלט דרך opts.onExportFile
   * (בדפדפן: הורדה; בבדיקות: בדיקת הבתים). PDF דורש גופן מוטמע — opts.embeddedFont (בתים)
   * או נפילה מתועדת להודעה (ללא גופן אין טקסט אמיתי — לא מזייפים). */
  function onExportRequest(kind) {
    if (!result) { status.setNotice('אין תוצאה לייצוא — העמוד עוד לא בוצע.'); return null; }
    const { exportHtml, exportPdf, exportProjectZip } = require('../engine/output/export-api');
    try {
      if (kind === 'html') {
        const html = exportHtml(result, settings, doc, { title: (result.metadata && result.metadata['ספר']) || 'ספר' });
        if (opts.onExportFile) opts.onExportFile('html', html, 'book.html');
        status.setNotice('יוצא HTML עצמאי (חד־קובץ, offline).');
        return { ok: true, kind, data: html };
      }
      if (kind === 'pdf') {
        if (typeof Buffer === 'undefined') {
          // סביבת דפדפן בלי מודול בואפרות — נתיב ה־PDF דורש Buffer; הודעה מפורשת (לא כשל שקט)
          status.setNotice('ייצוא PDF זמין בסביבת ההרצה המלאה (Node); בדפדפן השתמשו בייצוא HTML העצמאי והדפיסו ממנו.');
          return { ok: false, reason: 'no-buffer-in-browser' };
        }
        if (!opts.embeddedFont) {
          status.setNotice('ייצוא PDF דורש גופן מוטמע — נא לטעון גופן (TTF) בהגדרות המסמך.');
          return { ok: false, reason: 'no-embedded-font' };
        }
        const res = exportPdf(text, settings, opts.embeddedFont);
        if (!res.ok) { status.setNotice('ייצוא PDF נכשל: ' + res.error); return res; }
        if (opts.onExportFile) opts.onExportFile('pdf', res.bytes, 'book.pdf');
        status.setNotice(`יוצא PDF — ${res.info.pages} עמודים, ${res.info.outline} סימניות, טקסט נבחר.`);
        return { ok: true, kind, data: res.bytes, info: res.info };
      }
      if (kind === 'zip') {
        const bytes = exportProjectZip(text, settings, {
          extensions: extensions.getBundle ? extensions.getBundle() : null
        });
        if (opts.onExportFile) opts.onExportFile('zip', bytes, 'book-project.zip');
        status.setNotice('יוצאה חבילת פרויקט ZIP (מסמך+הגדרות+הרחבות+ערכה).');
        return { ok: true, kind, data: bytes };
      }
    } catch (e) {
      status.setNotice('הייצוא נכשל: ' + (e && e.message ? e.message : String(e)));
      return { ok: false, error: String(e && e.message || e) };
    }
    return null;
  }


  function applyResultToViews() {
    caretMapObj = buildCaretMap(text, result);
    preview.setResult(result, settings);
    testing.setResult(result);
    testing.setRecommendations(result.recommendations || null); // **S11:** המלצות עם הוכחות
    // מפת שבירות עמודים לעורך (⏎ — תצוגה בלבד, F-01)
    const breaks = [];
    for (const pg of result.pages) {
      if (pg.index === 0) continue;
      const toks = caretMapObj.tokensByPage.get(pg.index) || [];
      const tokId = toks[0];
      const tok = tokId ? result.tokens.find(t => t.id === tokId) : null;
      breaks.push({
        pageIndex: pg.index,
        firstWord: tok ? String(tok.raw || '').split(/\s+/)[0] || '' : ''
      });
    }
    editor.setPageBreaks(breaks);
    status.setPages(result.pages.length);
    status.setPending({ light: lightDirty, heavy: heavyDirty });
  }

  // ================= סנכרונים והפעלות =================

  /** כיוון א׳: סמן בעורך ⇒ הדגשת עמוד בתצוגה. */
  function onCaretMove(charIndex) {
    if (!caretMapObj) return;
    const page = caretMapObj.caretToPage(charIndex);
    if (page != null) preview.setCaretHighlight(page);
  }

  /** כיוון ב׳: לחיצה על עמוד / שורת TOC ⇒ מיקום הסמן בעורך. */
  function onActivatePage(pageIndex) {
    if (!caretMapObj) return;
    const caret = caretMapObj.pageToCaret(pageIndex);
    if (caret != null) editor.setCaret(caret);
  }

  /** כלל 2 (Working_rules): נתיב ההפעלה האחיד לכל ממצא — קפיצה + הדגשה + סמן. */
  function activateFinding(f) {
    switchTab('preview');
    preview.highlightIssue(f); // כולל scrollToPage
    if (f && f.page != null && caretMapObj) {
      const caret = caretMapObj.pageToCaret(Number(f.page));
      if (caret != null) editor.setCaret(caret);
    }
  }

  // ================= תבניות (REQ-UI-07) =================

  function saveTemplateJson() {
    return JSON.stringify({ format: 'tora-typesetter-template', version: 1, settings }, null, 2);
  }

  function loadTemplateJson(json) {
    const raw = typeof json === 'string' ? JSON.parse(json) : json;
    if (raw.format !== 'tora-typesetter-template') throw new Error('תבנית לא מוכרת (format שגוי)');
    const { merged, unknownKeys, issues } = mergeWithDefaults(migrate(raw.settings || {}));
    for (const [k, v] of Object.entries(merged)) settings[k] = v;
    settingsPanel.refreshValues();
    markHeavyDirty(); // הגדרות השתנו — המשתמש יחליט מתי לעמד (⚡)
    return { unknownKeys, issues };
  }

  // ================= דיבאג פר־עמוד (V21) =================

  function buildDebugJson(pageIndex) {
    if (!result) return { error: 'אין תוצאה — עמדו את המסמך תחילה' };
    const pg = result.pages.find(p => p.index === pageIndex);
    if (!pg) return { error: `עמוד ${pageIndex} לא נמצא` };
    const ledgerSlice = (result.ledger.issues || []).filter(rec => rec.page === pageIndex || String(rec.target || '').includes(`p${pageIndex}`));
    const traceSlice = (result.trace.events || []).filter(ev => ev.pageIndex === pageIndex);
    const findingsSlice = (result.report.findings || []).filter(f => Number(f.page) === pageIndex);
    return {
      schema: 'page-debug-v1',
      pageIndex,
      type: pg.type,
      template: pg.template,                       // גיאומטריה מלאה: מידות/שוליים/טורים/תיבת תוכן
      contentBox: pg.template && pg.template.contentBox,
      columns: (pg.columns || []).map(c => c.map(ln => ({
        tokenId: ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId),
        heightPx: ln.heightPx, words: (ln.words || []).length, kind: ln.kind || null
      }))),
      footnotes: (pg.footnotes || []).length,
      header: pg.header ? { slots: pg.header.slots ? Object.keys(pg.header.slots) : ['legacy'] } : null,
      folioDisplay: pg.folioDisplay || '',
      findings: findingsSlice,
      ledger: ledgerSlice,                          // פרוסת ledger לעמוד זה
      trace: traceSlice,                            // פרוסת מסלול לעמוד זה
      layoutHash: result.layoutHash
    };
  }

  // ================= מצב התחלתי =================
  status.setOffline(settings['offline-guard'] !== false);
  status.setFonts(opts.fontStatus || 'ready');

  return {
    root, switchTab, editor, settingsPanel, preview, testing, status, engine, extensions,
    onExplicitRetypeset, onDocumentAction, onSettingChanged, onResetField,
    scheduleLightRefresh, activateFinding, saveTemplateJson, loadTemplateJson, buildDebugJson,
    importDocxFile, applyRecommendation, // **S11:** ייבוא DOCX + החלת המלצות
    exportRequest: onExportRequest, // **S12:** ייצוא (html/pdf/zip) — קריאה בלבד
    getState: () => ({ lightDirty, heavyDirty, lastLightRefreshMs, hasResult: !!result, pages: result ? result.pages.length : 0, layoutHash: result ? result.layoutHash : null }),
    setText: (t) => { text = String(t != null ? t : ''); editor.setText(text); },
    getText: () => editor.getText(),
    getSettings: () => settings
  };
}

module.exports = { createApp, TABS };
