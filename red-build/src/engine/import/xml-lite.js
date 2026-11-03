// src/engine/import/xml-lite.js — מנתח XML מינימלי לקריאת DOCX (S11.1-3)
'use strict';

/**
 * מנתח XML אירועי (pull): קטן, מבודד, ללא תלות. מספיק ל־word/document.xml
 * (w:p, w:r, w:t, w:pStyle, w:footnoteReference) — לא מנתח כלל XML.
 * אין eval; ישויות בסיסיות בלבד (&amp; &lt; &gt; &quot; &apos; &#NNN;).
 *
 * אירועים: {type:'start'|'end'|'text', tag, attrs, text, depth}
 * הגנות: עומק מקסימלי, מספר אירועים מקסימלי, קלט קטוע → error מפורש (לא קריסה).
 */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(s) {
  return String(s).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, ent) => {
    if (ENTITIES[ent]) return ENTITIES[ent];
    if (ent[0] === '#') {
      const code = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      if (Number.isFinite(code) && code > 0 && code < 0x110000) return String.fromCodePoint(code);
    }
    return m; // ישות לא מוכרת — נשמרת כמו שהיא (לא קורסת)
  });
}

const MAX_DEPTH = 64;
const MAX_EVENTS = 200000;

/**
 * @param {string} xml
 * @returns {{events:Array, error:string|null}}
 */
function parseXml(xml) {
  const src = String(xml || '');
  const events = [];
  const stack = [];
  let depth = 0;
  let i = 0;
  const len = src.length;

  while (i < len) {
    if (events.length > MAX_EVENTS) return { events, error: 'too-many-events' };
    const lt = src.indexOf('<', i);
    if (lt < 0) {
      const text = decodeEntities(src.slice(i));
      if (text.trim()) events.push({ type: 'text', text, depth });
      break;
    }
    if (lt > i) {
      const text = decodeEntities(src.slice(i, lt));
      if (text.trim()) events.push({ type: 'text', text, depth });
      i = lt;
    }
    if (src.startsWith('<?', i)) {
      const end = src.indexOf('?>', i);
      if (end < 0) return { events, error: 'unterminated-pi' };
      i = end + 2; continue;
    }
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i);
      if (end < 0) return { events, error: 'unterminated-comment' };
      i = end + 3; continue;
    }
    if (src.startsWith('<![CDATA[', i)) {
      const end = src.indexOf(']]>', i);
      if (end < 0) return { events, error: 'unterminated-cdata' };
      const text = src.slice(i + 9, end);
      if (text.trim()) events.push({ type: 'text', text, depth });
      i = end + 3; continue;
    }
    if (src.startsWith('<!', i)) { // DOCTYPE והגדרות
      let j = i + 2, inner = 0;
      while (j < len) {
        if (src[j] === '[') inner++;
        else if (src[j] === ']') inner = Math.max(0, inner - 1);
        else if (src[j] === '>' && inner === 0) break;
        j++;
      }
      if (j >= len) return { events, error: 'unterminated-doctype' };
      i = j + 1; continue;
    }
    // תג סגירה </tag>
    if (src[i + 1] === '/') {
      const gt = src.indexOf('>', i);
      if (gt < 0) return { events, error: 'unterminated-close' };
      const tag = src.slice(i + 2, gt).trim();
      const top = stack.pop();
      if (top !== tag) {
        // סגירה לא מזווגת: אם יש מקבילה במחסנית — סוגרים את הפתוחים שמעליה (סלחני,
        // מתועד); אחרת — טעות.
        const idx = stack.lastIndexOf(tag);
        if (idx < 0) return { events, error: `unmatched-close:${tag}` };
        while (stack.length > idx) {
          const t2 = stack.pop();
          depth = Math.max(0, depth - 1);
          events.push({ type: 'end', tag: t2, depth });
        }
      } else {
        depth = Math.max(0, depth - 1);
        events.push({ type: 'end', tag, depth });
      }
      i = gt + 1; continue;
    }
    // תג פתיחה
    const gt = src.indexOf('>', i);
    if (gt < 0) return { events, error: 'unterminated-tag' };
    const selfClosing = src[gt - 1] === '/';
    const body = selfClosing ? src.slice(i + 1, gt - 1) : src.slice(i + 1, gt);
    const m = body.match(/^([^\s/>]+)([\s\S]*)$/);
    if (!m || !m[1]) return { events, error: 'bad-tag' };
    const tag = m[1];
    const rest = m[2] || '';
    const attrs = {};
    const attrRe = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let am;
    while ((am = attrRe.exec(rest)) !== null) {
      attrs[am[1]] = decodeEntities(am[3] !== undefined ? am[3] : am[4]);
    }
    if (selfClosing) {
      events.push({ type: 'start', tag, attrs, depth, selfClosing: true });
      events.push({ type: 'end', tag, depth });
    } else {
      if (depth >= MAX_DEPTH) return { events, error: 'too-deep' };
      events.push({ type: 'start', tag, attrs, depth });
      stack.push(tag);
      depth++;
    }
    i = gt + 1;
  }
  if (stack.length) {
    // קלט קטוע — סוגרים את הפתוחים כדי שהצרכן לא ייתקע, עם אינדיקציה
    while (stack.length) {
      const tag = stack.pop();
      events.push({ type: 'end', tag, depth: Math.max(0, events.length ? events[events.length - 1].depth : 0) });
    }
    return { events, error: 'truncated' };
  }
  return { events, error: null };
}

module.exports = { parseXml, decodeEntities };
