import pool from '../db/pool.js';
import * as matchingService from '../services/matching.service.js';

const handle = async (eventType, payload) => {
  switch (eventType) {
    case 'EMBEDDING_SEARCH':
      await matchingService.processReport(payload);
      break;
    case 'MATCH_CONFIRMATION':
      console.log('[EventProcessor] MATCH_CONFIRMATION received');
      break;
    default:
      console.log('[EventProcessor] Unknown event');
      break;
  }
};

const claimPendingEvents = async () => {
  const result = await pool.query(`
    UPDATE realtime_events
    SET event_status = 'PROCESSING'
    WHERE id IN (
      SELECT id FROM realtime_events
      WHERE event_status = 'PENDING'
      ORDER BY created_at
      LIMIT 10
    )
    RETURNING *;
  `);

  return result.rows;
};

const markDone = async (id) => {
  await pool.query(
    `
    UPDATE realtime_events
    SET event_status = 'DONE'
    WHERE id = $1
  `,
    [id],
  );
};

const markFailed = async (id) => {
  await pool.query(
    `
    UPDATE realtime_events
    SET event_status = 'FAILED',
        retry_count = retry_count + 1
    WHERE id = $1
  `,
    [id],
  );
};

const processPendingEvents = async () => {
  try {
    const events = await claimPendingEvents();

    if (!events.length) return;

    await Promise.all(
      events.map(async (event) => {
        try {
          await handle(event.event_type, event.payload);
          await markDone(event.id);
        } catch (err) {
          await markFailed(event.id);
        }
      }),
    );
  } catch (err) {
    console.error('[EventProcessor] Processing error:', err);
  }
};

export { processPendingEvents, handle };
