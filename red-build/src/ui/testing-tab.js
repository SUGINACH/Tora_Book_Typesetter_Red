// src/ui/testing-tab.js — לשונית הבדיקה (REQ-UI-06: ממצאים, trace, כיסוי, highlightIssue)
'use strict';

/**
 * כלל 2 (Working_rules): **כל** נתיב שמציג ממצא — טבלה, מסלול, לוח כיסוי —
 * מפעיל את אותה פונקציה activateFinding אחת (jump + highlightIssue). שמות
 * הממצאים בעברית מ־GEOM_KIND_NAMES (כלל 1 — מקור יחיד).
 */

const { GEOM_KIND_NAMES } = require('../audit/report-schema');
const { LIFECYCLE_STATES } = require('../engine/core/ledger');

const STATUS_HE = {
  created: 'נוצר', 'correction-blocked': 'תיקון נחסם', 'correction-reverted': 'תיקון שוחזר',
  'became-observable-later': 'נגלה מאוחר', 'competing-repair-side-effect': 'תופעת לוואי מתחרה',
  persists: 'נותר', resolved: 'נפתר', reintroduced: 'הוחזר', 'not-comparable': 'בלתי־ניתן־להשוואה',
  unresolved: 'לא פתור'
};

const STRUCTURAL_TYPES = new Set(['shaar-main', 'shaar-sub', 'shaar-back', 'toc-general', 'toc-detail', 'custom', 'filler', 'endnotes']);

function buildTestingTab(doc, opts) {
  const root = doc.createElement('section');
  root.className = 'tab-panel';
  root.setAttribute('role', 'tabpanel');
  root.dataset.tab = 'testing';

  let lastResult = null;

  // ============ סעיף 1: טבלת ממצאים ============
  const findingsSec = doc.createElement('div');
  findingsSec.className = 'testing-section';
  const findingsHead = doc.createElement('h3');
  findingsHead.textContent = 'ממצאים';
  findingsSec.appendChild(findingsHead);

  const filterRow = doc.createElement('div');
  filterRow.className = 'testing-filter-row';
  const filterInput = doc.createElement('input');
  filterInput.setAttribute('type', 'search');
  filterInput.setAttribute('placeholder', 'סינון לפי סוג/עמוד/מזהה…');
  filterInput.setAttribute('aria-label', 'סינון ממצאים');
  const sortSel = doc.createElement('select');
  sortSel.setAttribute('aria-label', 'מיון ממצאים');
  for (const [v, l] of [['page', 'מיון לפי עמוד'], ['kind', 'מיון לפי סוג'], ['status', 'מיון לפי מצב']]) {
    const o = doc.createElement('option');
    o.setAttribute('value', v); o.textContent = l;
    sortSel.appendChild(o);
  }
  filterRow.appendChild(filterInput); filterRow.appendChild(sortSel);
  findingsSec.appendChild(filterRow);

  const findingsTable = doc.createElement('table');
  findingsTable.className = 'findings-table';
  findingsTable.setAttribute('aria-label', 'טבלת ממצאים');
  const thead = doc.createElement('thead');
  const headRow = doc.createElement('tr');
  for (const h of ['סוג', 'עמוד', 'מצב', 'מזהה']) {
    const th = doc.createElement('th'); th.textContent = h; th.scope = 'col';
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  findingsTable.appendChild(thead);
  const tbody = doc.createElement('tbody');
  findingsTable.appendChild(tbody);
  findingsSec.appendChild(findingsTable);
  const findingsSummary = doc.createElement('div');
  findingsSummary.className = 'testing-summary';
  findingsSummary.setAttribute('aria-live', 'polite');
  findingsSec.appendChild(findingsSummary);
  root.appendChild(findingsSec);

  let findings = [];
  function renderFindings() {
    const q = (filterInput.value || '').trim().toLowerCase();
    const sorted = findings.slice().sort((a, b) => {
      if (sortSel.value === 'kind') return String(a.kindHe).localeCompare(String(b.kindHe), 'he');
      if (sortSel.value === 'status') return String(a.status).localeCompare(String(b.status));
      return (a.page != null ? a.page : -1) - (b.page != null ? b.page : -1);
    });
    tbody.textContent = '';
    let shown = 0;
    for (const f of sorted) {
      const hay = `${f.kindHe || ''} ${f.kind} ${f.page != null ? f.page : ''} ${f.id}`.toLowerCase();
      if (q && !hay.includes(q)) continue;
      shown++;
      const tr = doc.createElement('tr');
      tr.className = 'finding-row';
      tr.dataset.issueId = f.id;
      tr.setAttribute('tabindex', '0');
      const cells = [
        f.kindHe || GEOM_KIND_NAMES[f.kind] || f.kind,
        f.page != null ? String(f.page) : '—',
        STATUS_HE[f.status] || f.status,
        f.id
      ];
      for (const c of cells) {
        const td = doc.createElement('td'); td.textContent = c; tr.appendChild(td);
      }
      // **כלל 2:** כל נתיב פעלה → אותה פונקציית הפעלה אחידה
      tr.addEventListener('click', () => opts.onActivateFinding && opts.onActivateFinding(f));
      tr.addEventListener('keydown', (ev) => {
        if (ev && (ev.key === 'Enter' || ev.key === ' ')) opts.onActivateFinding && opts.onActivateFinding(f);
      });
      tbody.appendChild(tr);
    }
    findingsSummary.textContent = `${shown} ממצאים מוצגים מתוך ${findings.length}`;
  }
  filterInput.addEventListener('input', renderFindings);
  sortSel.addEventListener('change', renderFindings);

  // ============ סעיף 2: מציג המסלול (trace viewer) ============
  const traceSec = doc.createElement('div');
  traceSec.className = 'testing-section';
  const traceHead = doc.createElement('h3');
  traceHead.textContent = 'מסלול המנוע (trace)';
  traceSec.appendChild(traceHead);
  const stageSel = doc.createElement('select');
  stageSel.setAttribute('aria-label', 'סינון שלבי מסלול');
  {
    const o = doc.createElement('option');
    o.setAttribute('value', ''); o.textContent = 'כל השלבים';
    stageSel.appendChild(o);
  }
  traceSec.appendChild(stageSel);
  const traceTable = doc.createElement('table');
  traceTable.className = 'trace-table';
  traceTable.setAttribute('aria-label', 'אירועי מסלול המנוע');
  const ttHead = doc.createElement('thead');
  const ttRow = doc.createElement('tr');
  for (const h of ['#', 'שלב', 'תווית', 'עמוד', 'נתונים']) {
    const th = doc.createElement('th'); th.textContent = h; th.scope = 'col';
    ttRow.appendChild(th);
  }
  ttHead.appendChild(ttRow);
  traceTable.appendChild(ttHead);
  const ttBody = doc.createElement('tbody');
  traceTable.appendChild(ttBody);
  traceSec.appendChild(traceTable);
  const traceMeta = doc.createElement('div');
  traceMeta.className = 'testing-summary';
  traceSec.appendChild(traceMeta);
  root.appendChild(traceSec);

  let traceEvents = [];
  function renderTrace() {
    const stage = stageSel.value;
    ttBody.textContent = '';
    let shown = 0;
    for (const ev of traceEvents) {
      if (stage && ev.stage !== stage) continue;
      shown++;
      const tr = doc.createElement('tr');
      const cells = [
        String(ev.seq), ev.stage, ev.label,
        ev.pageIndex != null ? String(ev.pageIndex) : '—',
        JSON.stringify(ev.payload || {})
      ];
      for (const c of cells) {
        const td = doc.createElement('td');
        td.textContent = c.length > 120 ? c.slice(0, 117) + '…' : c;
        tr.appendChild(td);
      }
      ttBody.appendChild(tr);
    }
    traceMeta.textContent = `${shown} אירועים מוצגים מתוך ${traceEvents.length}`;
  }
  stageSel.addEventListener('change', renderTrace);

  // ============ סעיף 3: לוח הכיסוי (חשבונאות S1 — REQ-GOV-06) ============
  const covSec = doc.createElement('div');
  covSec.className = 'testing-section';
  const covHead = doc.createElement('h3');
  covHead.textContent = 'לוח כיסוי ואבחון';
  covSec.appendChild(covHead);
  const covGrid = doc.createElement('div');
  covGrid.className = 'coverage-grid';
  covSec.appendChild(covGrid);
  root.appendChild(covSec);

  function setResult(serializedResult) {
    lastResult = serializedResult;
    const report = serializedResult.report;
    findings = (report && report.findings) || [];
    renderFindings();

    // שלבי המסלול הקיימים → בורר
    traceEvents = (serializedResult.trace && serializedResult.trace.events) || [];
    const stages = [...new Set(traceEvents.map(e => e.stage))];
    stageSel.textContent = '';
    {
      const o = doc.createElement('option');
      o.setAttribute('value', ''); o.textContent = 'כל השלבים';
      stageSel.appendChild(o);
    }
    for (const s of stages) {
      const o = doc.createElement('option');
      o.setAttribute('value', s); o.textContent = s;
      stageSel.appendChild(o);
    }
    renderTrace();

    // ---- לוח הכיסוי: סיווג מפורש לכל עמוד (evaluated / excluded+reason) ----
    const pages = serializedResult.pages || [];
    const byType = {};
    let inScope = 0, structural = 0;
    const structuralReasons = [];
    for (const pg of pages) {
      byType[pg.type] = (byType[pg.type] || 0) + 1;
      if (STRUCTURAL_TYPES.has(pg.type)) {
        structural++;
        structuralReasons.push({ page: pg.index, type: pg.type, reason: 'עמוד מבני — מחוץ לזרימת הגוף (שער/תוכן/הערות/מילוי)' });
      } else {
        inScope++;
      }
    }
    const findingsByPage = new Map();
    for (const f of findings) if (f.page != null) findingsByPage.set(f.page, (findingsByPage.get(f.page) || 0) + 1);
    const cleanInScope = inScope - [...findingsByPage.keys()].filter(p => p < pages.length && !STRUCTURAL_TYPES.has(pages[p] && pages[p].type)).length;

    const lifecycle = serializedResult.ledgerSummary || {};
    covGrid.textContent = '';
    const addCard = (label, value, cls) => {
      const card = doc.createElement('div');
      card.className = `coverage-card ${cls || ''}`;
      const v = doc.createElement('div'); v.className = 'coverage-value'; v.textContent = value;
      const l = doc.createElement('div'); l.className = 'coverage-label'; l.textContent = label;
      card.appendChild(v); card.appendChild(l);
      covGrid.appendChild(card);
    };
    addCard('סה\"כ עמודים', String(pages.length));
    addCard('עמודי גוף נבדקו', String(inScope), 'ok');
    addCard('עמודים מבניים (פטורים בסיבה)', String(structural), 'muted');
    addCard('עמודי גוף נקיים ממצאים', String(Math.max(0, cleanInScope)), 'ok');
    addCard('ממצאים פתוחים', String((report.counts && Object.values(report.counts).reduce((a, b) => a + b, 0)) || 0),
      (report.counts && Object.keys(report.counts).length) ? 'warn' : 'ok');
    addCard('אירועי מסלול שנשמטו', String(serializedResult.droppedEvents != null ? serializedResult.droppedEvents : 0),
      serializedResult.droppedEvents === 0 ? 'ok' : 'err');
    addCard('דטרמיניסטיות (hash)', serializedResult.deterministic ? 'אומת' : 'נכשל!', serializedResult.deterministic ? 'ok' : 'err');
    addCard('שימור תוכן', serializedResult.contentPreserved ? 'שלם' : 'חריגה!', serializedResult.contentPreserved ? 'ok' : 'err');
    addCard('ניטרליות גיאומטריה (CP4==CP5)', serializedResult.geometryNeutralVerified ? 'אומתה' : 'נכשלה!', serializedResult.geometryNeutralVerified ? 'ok' : 'err');

    // מחזור חיים (lifecycle) — ספירה לפי מצב
    const life = doc.createElement('div');
    life.className = 'coverage-lifecycle';
    life.textContent = 'מחזור חיים: ' + (Object.entries(lifecycle).map(([k, v]) => `${STATUS_HE[k] || k}: ${v}`).join(' · ') || 'אין ממצאים');
    covGrid.appendChild(life);

    // פירוט פטורים — שקיפות מלאה (שיעור 17/18: אין "כיסוי מלא" בלי הסבר)
    if (structuralReasons.length) {
      const det = doc.createElement('details');
      det.className = 'coverage-details';
      const sum = doc.createElement('summary');
      sum.textContent = `פירוט ${structuralReasons.length} עמודים פטורים מבדיקת זרימת גוף`;
      det.appendChild(sum);
      for (const r of structuralReasons) {
        const d = doc.createElement('div');
        d.className = 'coverage-reason';
        d.textContent = `עמוד ${r.page + 1} (${r.type}): ${r.reason}`;
        det.appendChild(d);
      }
      covGrid.appendChild(det);
    }
  }

  return { root, setResult };
}

module.exports = { buildTestingTab, STATUS_HE };
