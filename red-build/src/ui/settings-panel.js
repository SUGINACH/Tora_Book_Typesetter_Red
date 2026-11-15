// src/ui/settings-panel.js — פאנל ההגדרות: 12 פאנלים (Z2), אקורדיון, חיפוש, איפוס, תבניות (REQ-UI-01/07)
'use strict';

/**
 * נבנה מ־bindings.generated.js בלבד (מקור יחיד — הרישום). DOM-agnostic:
 * מקבל doc דמוי־document (האותו חוזה כמו dom-renderer) ולכן נבדק גם ב־Node.
 *
 * **F-06 (כלל ברזל):** אף מאזין של בקרה לא קורא למנוע. שינוי ⇒ onSettingChanged
 * בלבד; המדיניות (קל/כבד) נקבעת ב־app-shell דרך retypeset-policy. סריקת
 * call-graph (callgraph-scan.js) אוכפת זאת סטטית.
 */

const { BINDINGS, PANELS } = require('./bindings.generated');

/** **S6.2:** בוררי העיצובים החיים (מיוזרשים ב-refreshValues — כך הבחירה
 * הפעילה אחרי אתחול/טעינת ערכה מוצגת בבוררים גם כשנבנו מוקדם יותר). */
let imudPickerSelects = []; // [{ pick, sel }]

/** גופני בסיס (לפני טעינת הקטלוג) — preserve-missing-value (IMUD port). */
const KNOWN_FONTS = ['Frank Ruhl Libre', 'David HB', 'David', 'Narkisim', 'Nachlieli', 'Alef', 'Rubin'];
let fontCatalogFamilies = null; // **03.11:** קטלוג 439 הפונטים של IMUD (ברגע שנטען)

/** בניית בקרה אחת לפי סוג ההגדרה. מחזיר את אלמנט הבקרה (בלי שורת התווית). */
function buildControl(doc, b, value, onChange) {
  let el;
  if (b.type === 'bool') {
    el = doc.createElement('input');
    el.setAttribute('type', 'checkbox');
    el.checked = !!value;
    el.addEventListener('change', () => onChange(el.checked));
  } else if (b.type === 'enum') {
    el = doc.createElement('select');
    for (const opt of (b.enum || [])) {
      const o = doc.createElement('option');
      o.setAttribute('value', String(opt));
      o.textContent = String(opt);
      el.appendChild(o);
    }
    el.value = String(value);
    el.addEventListener('change', () => onChange(el.value));
  } else if (b.type === 'number') {
    el = doc.createElement('input');
    el.setAttribute('type', 'number');
    if (b.min != null) el.setAttribute('min', String(b.min));
    if (b.max != null) el.setAttribute('max', String(b.max));
    if (b.step != null) el.setAttribute('step', String(b.step));
    el.value = String(value);
    el.addEventListener('change', () => {
      // **S6.0 (R8-M3):** שדה מרוקן = ביטול (לא 0! — Number('')===0 שלח
      // 0 למנוע ⇒ גופן-0 = ספר ריק "מוצלח"); ערכים מוצמדים לטווח
      // min/max של ההגדרה (בעבר -5 עבר כמו שהוא).
      if (el.value === '') { el.value = String(value); return; }
      let n = Number(el.value);
      if (!Number.isFinite(n)) { el.value = String(value); return; }
      if (b.min != null && n < b.min) { n = b.min; el.value = String(n); }
      if (b.max != null && n > b.max) { n = b.max; el.value = String(n); }
      onChange(n);
    });
  } else if (b.type === 'color') {
    el = doc.createElement('input');
    el.setAttribute('type', 'color');
    el.value = String(value || '#ffffff');
    el.addEventListener('change', () => onChange(el.value));
  } else if (b.type === 'font') {
    // font-picker preserve-missing-value (IMUD port): ערך שאינו ברשימה נשמר כאפשרות.
    // **03.11:** כשקטלוג IMUD נטען — 443 המשפחות המוטמעות בכל בוררי הגופנים.
    // **EXT-14 (05.11):** הקטלוג המורחב (1,315 משפחות המקור) מוצג אף הוא — עם
    // סימון ברור "(קטלוג — לא מוטמע)": בחירתו תדווח במפורש ותיפול לגופן מערכת.
    const raw = fontCatalogFamilies || KNOWN_FONTS;
    const entries = raw.map((f) => (typeof f === 'string' ? { value: f, label: f } : f));
    const values = entries.map((e) => e.value);
    el = doc.createElement('select');
    const opts = values.includes(value) ? entries : [{ value: String(value), label: String(value) }, ...entries];
    for (const e of opts) {
      const o = doc.createElement('option');
      o.setAttribute('value', e.value);
      o.textContent = e.label || e.value;
      el.appendChild(o);
    }
    el.value = String(value);
    el.addEventListener('change', () => onChange(el.value));
  } else { // string / asset / ornament
    el = doc.createElement('input');
    el.setAttribute('type', 'text');
    el.value = String(value != null ? value : '');
    el.addEventListener('change', () => onChange(el.value));
  }
  el.dataset.key = b.id;
  el.dataset.control = b.control; // מזהה הפקד — חוזה הרישום (three-layer)
  el.setAttribute('aria-label', b.labelHe);
  el.className = 'ctl';
  return el;
}

/**
 * בניית לשונית ההגדרות.
 * @param {object} opts - { getSettings, onSettingChanged(key,value), onResetField(key),
 *   onSaveTemplate(), onLoadTemplate(), onOpenBuilder(), onOpenImports() }
 */
function buildSettingsTab(doc, opts) {
  const getSettings = opts.getSettings;
  const root = doc.createElement('section');
  root.className = 'tab-panel';
  root.setAttribute('role', 'tabpanel');
  root.dataset.tab = 'settings';

  // ---- סרגל עליון: חיפוש + תבניות ----
  const bar = doc.createElement('div');
  bar.className = 'settings-bar';
  const search = doc.createElement('input');
  search.setAttribute('type', 'search');
  search.setAttribute('placeholder', 'חיפוש הגדרה לפי שם עברי, מזהה או פקד…');
  search.setAttribute('aria-label', 'חיפוש הגדרות');
  search.className = 'settings-search';
  const saveBtn = doc.createElement('button');
  saveBtn.type = 'button'; saveBtn.className = 'btn btn--ghost'; saveBtn.textContent = '💾 שמור תבנית';
  saveBtn.setAttribute('aria-label', 'שמור תבנית הגדרות');
  saveBtn.addEventListener('click', () => opts.onSaveTemplate && opts.onSaveTemplate());
  const loadBtn = doc.createElement('button');
  loadBtn.type = 'button'; loadBtn.className = 'btn btn--ghost'; loadBtn.textContent = '📂 טען תבנית';
  loadBtn.setAttribute('aria-label', 'טען תבנית הגדרות');
  loadBtn.addEventListener('click', () => opts.onLoadTemplate && opts.onLoadTemplate());
  bar.appendChild(search); bar.appendChild(saveBtn); bar.appendChild(loadBtn);
  root.appendChild(bar);

  // ---- אקורדיון 12 הפאנלים ----
  const accordion = doc.createElement('div');
  accordion.className = 'accordion';
  const fieldRows = []; // לסינון חיפוש: {row, label, id, control, panelBody, header}

  const byPanel = new Map();
  for (const b of BINDINGS) {
    if (!byPanel.has(b.panel)) byPanel.set(b.panel, []);
    byPanel.get(b.panel).push(b);
  }

  for (const p of PANELS) {
    const section = doc.createElement('div');
    section.className = 'acc-panel';
    section.dataset.panelKey = p.key;

    const header = doc.createElement('button');
    header.type = 'button';
    header.className = 'acc-header';
    header.setAttribute('aria-expanded', 'false');
    const items = p.kind === 'settings' ? (byPanel.get(p.label) || []) : [];
    const title = doc.createElement('span');
    title.className = 'acc-title';
    title.textContent = `${p.label}${items.length ? ` (${items.length})` : ''}`;
    const chev = doc.createElement('span');
    chev.className = 'acc-chevron'; chev.textContent = '▾';
    header.appendChild(title); header.appendChild(chev);

    const body = doc.createElement('div');
    body.className = 'acc-body';
    body.setAttribute('role', 'group');
    body.setAttribute('aria-label', p.label);

    if (p.kind === 'action') {
      // פאנלי־פעולה (Z2): בורר עיצובים (BUILDER) / ייבוא תוספים (IMPORTS)
      // **03.11 (EXT-14):** הבורר פונקציונלי — עיצובי שערים ועיטורים מספריית IMUD
      // + כפתור ברירות המחדל המקוריות (default_settings.json מלא 264 מפתחות).
      const info = doc.createElement('p');
      info.className = 'action-info';
      info.textContent = p.key === 'BUILDER'
        ? 'ספריית הפרויקט המקורי: 32 שערים ראשיים, 27 משנה, 27 אחוריים, 302 עיטורי למעלה-למטה, 302 עיטורי צד, 323 מפרידים וערכות סגנון (תלמוד/פרשנות/קונטרס). הגופנים (427 משפחות מוטמעות) נגישים בבוררי הגופנים בפאנלים "טיפוגרפיה" ו"כותרות 0–7". הבחירה נשמרת כהפניית imud: ומופעלת בעימוד.'
        : 'ייבוא תוספים — עמודים מותאמים, סגנונות טקסט ותמונות (JSON). מנוע ההרחבות המלא נבנה ב־S11; הכניסה נעולה בהתאם.';
      body.appendChild(info);
      if (p.key === 'BUILDER' && opts.imudLibrary) {
        body.appendChild(buildImudPicker(doc, opts));
      } else {
        const act = doc.createElement('button');
        act.type = 'button'; act.className = 'btn';
        act.textContent = p.key === 'BUILDER' ? '🛠 פתח את הבונה' : '📦 פתח את הייבוא';
        act.disabled = p.key === 'IMPORTS' || p.key === 'BUILDER'; // בורר IMUD חי לעיל; ייבוא — מוזרק חיצונית
        act.setAttribute('aria-label', p.label);
        act.addEventListener('click', () => {
          if (p.key === 'BUILDER' && opts.onOpenBuilder) opts.onOpenBuilder();
          if (p.key === 'IMPORTS' && opts.onOpenImports) opts.onOpenImports();
        });
        body.appendChild(act);
      }
    } else {
      for (const b of items) {
        const settings = getSettings();
        const value = settings[b.id];
        const row = doc.createElement('div');
        row.className = 'field-row';
        row.dataset.key = b.id;
        const lbl = doc.createElement('label');
        lbl.className = 'field-label';
        lbl.textContent = b.labelHe;
        lbl.setAttribute('for', `ctl-${b.control}`);
        const ctl = buildControl(doc, b, value, (v) => opts.onSettingChanged(b.id, v));
        ctl.setAttribute('id', `ctl-${b.control}`);
        const reset = doc.createElement('button');
        reset.type = 'button';
        reset.className = 'btn btn--icon field-reset';
        reset.textContent = '↺';
        reset.title = `אפס לברירת המחדל (${b.def})`;
        reset.setAttribute('aria-label', `אפס ${b.labelHe} לברירת המחדל`);
        reset.addEventListener('click', () => opts.onResetField && opts.onResetField(b.id));
        row.appendChild(lbl); row.appendChild(ctl); row.appendChild(reset);
        if (b.note) {
          const note = doc.createElement('div');
          note.className = 'field-note';
          note.textContent = b.note;
          row.appendChild(note);
        }
        body.appendChild(row);
        fieldRows.push({ row, label: b.labelHe, id: b.id, control: b.control, body, header, section });
      }
    }

    header.addEventListener('click', () => {
      const open = section.classList.toggle('open');
      header.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    section.appendChild(header);
    section.appendChild(body);
    accordion.appendChild(section);
  }
  root.appendChild(accordion);

  // ---- חיפוש: לפי תווית עברית / מזהה / פקד; פותח את הפאנלים הרלוונטיים ----
  let searchHits = 0;
  search.addEventListener('input', () => {
    const q = (search.value || '').trim().toLowerCase();
    searchHits = 0;
    const openedPanels = new Set();
    for (const fr of fieldRows) {
      const hit = !q || fr.label.toLowerCase().includes(q) || fr.id.toLowerCase().includes(q) || fr.control.toLowerCase().includes(q);
      fr.row.classList.toggle('hidden', !hit);
      if (hit && q) { searchHits++; openedPanels.add(fr.section); }
    }
    // פתיחת פאנלים עם תוצאות (כשמחפשים); סגירה כשהחיפוש מתרוקן
    for (const sec of Array.from(accordion.children)) {
      const isHit = openedPanels.has(sec);
      if (q) {
        sec.classList.toggle('open', isHit);
        const h = sec.children[0];
        if (h && h.setAttribute) h.setAttribute('aria-expanded', isHit ? 'true' : 'false');
        sec.classList.toggle('dimmed', !isHit);
      } else {
        sec.classList.remove('dimmed');
      }
    }
  });

  /** ריענון ערכי הבקרות אחרי שינוי חיצוני (טעינת תבנית/איפוס). */
  function refreshValues() {
    const settings = getSettings();
    for (const fr of fieldRows) {
      const ctl = fr.row.querySelector('.ctl');
      if (!ctl) continue;
      const b = BINDINGS.find(x => x.id === fr.id);
      const v = settings[fr.id];
      if (b.type === 'bool') ctl.checked = !!v;
      else ctl.value = String(v != null ? v : '');
    }
    // **S6.2:** סנכרון בוררי העיצובים — ההפניה הפעילה (imud:<collection>:<id>)
    // מוצגת בבורר המתאים; מזהה לא מוכר (למשל "" = ללא) מחזיר "— ללא —".
    for (const { pick, sel } of imudPickerSelects) {
      const ref = String(settings[pick.setting] || '');
      const id = ref.startsWith(`imud:${pick.collection}:`) ? ref.split(':')[2] : '';
      const known = Array.from(sel.options).some((o) => o.getAttribute('value') === id);
      sel.value = known ? id : '';
    }
  }

  /** **03.11 (EXT-14):** עדכון קטלוג הפונטים (439 משפחות IMUD) — בוררי הגופנים
   * נבנים מחדש עם הקטלוג המלא, בשימור הערך הנוכחי. */
  function refreshFontCatalog(families) {
    if (!Array.isArray(families) || !families.length) return;
    fontCatalogFamilies = families.slice();
    const settings = getSettings();
    for (const fr of fieldRows) {
      const b = BINDINGS.find(x => x.id === fr.id);
      if (!b || b.type !== 'font') continue;
      const old = fr.row.querySelector('.ctl');
      if (!old) continue;
      const fresh = buildControl(doc, b, settings[fr.id], (v) => opts.onSettingChanged(b.id, v));
      fresh.setAttribute('id', `ctl-${b.control}`);
      old.parentNode.replaceChild(fresh, old);
    }
  }

  root.appendChild(Object.assign(doc.createElement('div'), { className: 'settings-count', textContent: `${BINDINGS.length} הגדרות ב־${PANELS.length} פאנלים` }));

  return { root, refreshValues, refreshFontCatalog, searchInput: search, getSearchHits: () => searchHits };
}

/** **03.11 (EXT-14):** בורר עיצובי IMUD — שערים/עיטורים/מפרידים + ברירות המקור.
 * בחירה ⇒ רישום העיצוב בשני הצדדים (UI+Worker) ואז onSettingChanged עם ההפניה
 * המלאה. הפעלת מצב תמונה לעיטורים אוטומטית (h2-orn-*=image). */
function buildImudPicker(doc, opts) {
  const wrap = doc.createElement('div');
  wrap.className = 'imud-picker';
  const note = doc.createElement('div');
  note.className = 'action-info';
  note.textContent = 'טוען את רשימות העיצוב מהספרייה המוטמעת…';
  wrap.appendChild(note);

  const PICKS = [
    { label: 'שער ראשי', collection: 'shaar-main', setting: 'imud-shaar-main' },
    { label: 'שער משנה', collection: 'shaar-sub', setting: 'imud-shaar-sub' },
    { label: 'שער אחורי', collection: 'shaar-back', setting: 'imud-shaar-back' },
    { label: 'עיטור עליון (H2)', collection: 'orn-ud', setting: 'imud-orn-top', imageMode: 'h2-orn-top' },
    { label: 'עיטור תחתון (H2)', collection: 'orn-ud', setting: 'imud-orn-bottom', imageMode: 'h2-orn-bottom' },
    { label: 'עיטור צדדי', collection: 'orn-lr', setting: 'imud-orn-side' },
    { label: 'עיטור סיום פרק', collection: 'orn-ud', setting: 'imud-chapter-end', imageMode: 'chapter-end-ornament' },
    { label: 'מפריד מעוצב', collection: 'divider', setting: 'imud-divider' }
  ];

  const selects = [];
  imudPickerSelects = selects; // **S6.2:** חשיפה ל-refreshValues (אותו מערך — פריטים מתווספים בהמשך)
  for (const pick of PICKS) {
    const row = doc.createElement('div');
    row.className = 'field-row';
    const lbl = doc.createElement('label');
    lbl.className = 'field-label';
    lbl.textContent = pick.label;
    const sel = doc.createElement('select');
    sel.className = 'ctl';
    sel.setAttribute('aria-label', pick.label);
    sel.appendChild(Object.assign(doc.createElement('option'), { textContent: '— ללא —', value: '' }));
    sel.addEventListener('change', async () => {
      const id = sel.value;
      if (!id) { opts.onSettingChanged(pick.setting, ''); return; }
      try {
        const ref = await opts.imudLibrary.ensureDesign(pick.collection, id);
        if (!ref) throw new Error('העיצוב לא נמצא בספרייה');
        if (pick.imageMode) opts.onSettingChanged(pick.imageMode, 'image');
        opts.onSettingChanged(pick.setting, ref);
      } catch (e) {
        sel.value = '';
        if (opts.onNotice) opts.onNotice('בחירת העיצוב נכשלה: ' + (e && e.message ? e.message : e));
      }
    });
    row.appendChild(lbl); row.appendChild(sel);
    wrap.appendChild(row);
    selects.push({ pick, sel });
  }

  // בורר סגנון-ספר מהמקור (setting_sets/) — **EXT-14:** תלמוד/פרשנות/קונטרס,
  // תצורות מלאות (249 מפתחות) שהמקור החליף ביניהן דרך הדרופדאון style-set-select.
  // אותה טבלת disposition כמו ברירות המחדל — אין מסלול מיוחד; ההחלפה מעמדת
  // את ההגדרות וטוענת את הגופנים שהערכה דורשת (onApplyLegacyDefaults — נתיב יחיד).
  const setsWrap = doc.createElement('div');
  setsWrap.className = 'row';
  const setsLbl = doc.createElement('label');
  setsLbl.textContent = 'סגנון ספר (מהמקור):';
  setsWrap.appendChild(setsLbl);
  const setsSel = doc.createElement('select');
  setsSel.className = 'ctl';
  setsSel.setAttribute('aria-label', 'בחירת ערכת סגנון ספר מהמקור');
  setsSel.appendChild(Object.assign(doc.createElement('option'), { textContent: '— ברירת המחדל המלאה —', value: '' }));
  setsSel.addEventListener('change', async () => {
    const name = setsSel.value;
    if (!name) return; // ברירת המחדל המלאה — דרך הכפתור הייעודי למעלה
    try {
      const { settings, report } = await opts.imudLibrary.loadSettingSet(name);
      if (opts.onApplyLegacyDefaults) opts.onApplyLegacyDefaults(settings);
      if (opts.onNotice) opts.onNotice(`ערכת «${name}» הוחלה — ${report.mapped} הגדרות מופו, ${report.uiState} ערכי UI נשמרו.`);
    } catch (e) {
      setsSel.value = '';
      if (opts.onNotice) opts.onNotice('טעינת הערכה נכשלה: ' + (e && e.message ? e.message : e));
    }
  });
  setsWrap.appendChild(setsSel);
  wrap.appendChild(setsWrap);

  // כפתור ברירות המחדל המקוריות — ייבוא 264 המפתחות דרך טבלת ה-disposition
  const defaultsBtn = doc.createElement('button');
  defaultsBtn.type = 'button'; defaultsBtn.className = 'btn';
  defaultsBtn.textContent = '📖 החל ברירות מחדל מקוריות (IMUD)';
  defaultsBtn.setAttribute('aria-label', 'החלת ברירות המחדל של הפרויקט המקורי');
  defaultsBtn.addEventListener('click', async () => {
    try {
      const { settings, report } = await opts.imudLibrary.loadLegacyDefaults();
      if (opts.onApplyLegacyDefaults) opts.onApplyLegacyDefaults(settings);
      if (opts.onNotice) opts.onNotice(`ברירות המקור הוחלו — ${report.mapped} הגדרות מופו, ${report.merged} אוחדו, ${report.removed} במעקב מתועד.`);
    } catch (e) {
      if (opts.onNotice) opts.onNotice('טעינת ברירות המקור נכשלה: ' + (e && e.message ? e.message : e));
    }
  });
  wrap.appendChild(defaultsBtn);

  // טעינת רשימות העיצובים (עצלה — לפי אוסף) + אוכלוס ערכות הסגנון
  // **S6.2:** גם סינכרון הערך הנוכחי מההגדרות — אחרי האתחול (ערכת הנושא
  // של המקור נטענת אוטומטית) הבוררים מציגים את העיצוב הפעיל במקום "— ללא —"
  // (בלי זה המשתמש רואה בורר ריק וסבור שאין אפשרות לבחור עיצובים).
  (async () => {
    try {
      const settingsNow = opts.getSettings ? opts.getSettings() : {};
      // ערכות סגנון-ספר (setting_sets) — אוכלוס הבורר
      try {
        for (const name of opts.imudLibrary.listSettingSets()) {
          setsSel.appendChild(Object.assign(doc.createElement('option'), { textContent: name, value: name }));
        }
      } catch (e) { /* אין ספריית ערכות — הבורר נשאר עם ברירת המחדל */ }
      const byCollection = new Map();
      for (const { pick, sel } of selects) {
        if (!byCollection.has(pick.collection)) {
          byCollection.set(pick.collection, await opts.imudLibrary.listDesigns(pick.collection));
        }
        const items = byCollection.get(pick.collection);
        for (const it of items) {
          const o = doc.createElement('option');
          o.setAttribute('value', it.id);
          o.textContent = `${it.name} (${it.id})`;
          sel.appendChild(o);
        }
        // **S6.2:** הצגת הערך הפעיל — ההגדרה מחזיקה הפניה מלאה imud:<collection>:<id>
        const activeRef = String(settingsNow[pick.setting] || '');
        const activeId = activeRef.startsWith(`imud:${pick.collection}:`) ? activeRef.split(':')[2] : '';
        if (activeId && items.some((it) => it.id === activeId)) sel.value = activeId;
      }
      note.textContent = `${selects.length} בוררי עיצוב מהספרייה המוטמעת.`;
    } catch (e) {
      note.textContent = 'ספריית העיצובים לא נטענה: ' + (e && e.message ? e.message : e);
    }
  })();

  return wrap;
}

module.exports = { buildSettingsTab, BINDINGS, PANELS };
