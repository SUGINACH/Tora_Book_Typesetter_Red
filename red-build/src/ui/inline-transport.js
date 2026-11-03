// src/ui/inline-transport.js — תעבורה inline לבדיקות/Node (D-65)
'use strict';

/**
 * אותו פרוטוקול, אותו צד־Worker (engine-worker-main), באותו תהליך.
 * queueMicrotask מדמה אי־סנכרוניות של גבול ה־Worker — הבדיקות מוכיחות
 * שקילות תוצאה לריצה ישירה (hash זהה).
 *
 * מודול נפרד במכוון: ה־bundle של הדפדפן אינו כולל אותו (שם רץ Worker אמיתי)
 * — ולכן גם אינו גורר את המנוע פעמיים.
 */

const { createEngineWorkerMain } = require('./engine-worker-main');

function createInlineTransport() {
  let handler = null;
  const main = createEngineWorkerMain((m) => {
    queueMicrotask(() => { if (handler) handler(m); });
  });
  return {
    post: (m) => { queueMicrotask(() => main(m)); },
    setHandler: (cb) => { handler = cb; },
    terminate: () => { /* inline: אין תהליך להרוג; הביטול עובר דרך הודעת cancel */ }
  };
}

module.exports = { createInlineTransport };
