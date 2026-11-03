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
      const n = Number(el.value);
      onChange(Number.isFinite(n) ? n : value);
    });
  } else if (b.type === 'color') {
    el = doc.createElement('input');
    el.setAttribute('type', 'color');
    el.value = String(value || '#ffffff');
    el.addEventListener('change', () => onChange(el.value));
  } else if (b.type === 'font') {
    // font-picker preserve-missing-value (IMUD port): ערך שאינו ברשימה נשמר כאפשרות
    const KNOWN_FONTS = ['Frank Ruhl Libre', 'David HB', 'David', 'Narkisim', 'Nachlieli', 'Alef', 'Rubin'];
    el = doc.createElement('select');
    const opts = KNOWN_FONTS.includes(value) ? KNOWN_FONTS : [String(value), ...KNOWN_FONTS];
    for (const f of opts) {
      const o = doc.createElement('option');
      o.setAttribute('value', f);
      o.textContent = f;
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
      // פאנלי־פעולה (Z2): בונה ערכות נושא / ייבוא תוספים — כניסות לזרימות ייעודיות
      const info = doc.createElement('p');
      info.className = 'action-info';
      info.textContent = p.key === 'BUILDER'
        ? 'בונה ערכות הנושא (SVG) — עריכת שערים, רקעים ותיבות טקסט בכלי ויזואלי. הערכות השמורות מופיעות בפאנל «ערכות נושא, שערים ורקעים».'
        : 'ייבוא תוספים — עמודים מותאמים, סגנונות טקסט ותמונות (JSON). מנוע ההרחבות המלא נבנה ב־S11; הכניסה נעולה בהתאם.';
      body.appendChild(info);
      const act = doc.createElement('button');
      act.type = 'button'; act.className = 'btn';
      act.textContent = p.key === 'BUILDER' ? '🛠 פתח את הבונה' : '📦 פתח את הייבוא';
      act.disabled = p.key === 'IMPORTS'; // S11 — UI stub guarded (REQ-UI-04 דפוס זהה)
      act.setAttribute('aria-label', p.label);
      act.addEventListener('click', () => {
        if (p.key === 'BUILDER' && opts.onOpenBuilder) opts.onOpenBuilder();
        if (p.key === 'IMPORTS' && opts.onOpenImports) opts.onOpenImports();
      });
      body.appendChild(act);
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
  }

  root.appendChild(Object.assign(doc.createElement('div'), { className: 'settings-count', textContent: `${BINDINGS.length} הגדרות ב־12 פאנלים` }));

  return { root, refreshValues, searchInput: search, getSearchHits: () => searchHits };
}

module.exports = { buildSettingsTab, BINDINGS, PANELS };
