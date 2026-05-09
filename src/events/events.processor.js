import pool from '../db/pool.js';
import * as matchingService from '../services/matching.service.js';

const handle = async (eventType, payload) => {
  switch (eventType) {
    case 'EMBEDDING_SEARCH':
      await matchingService.processReport(payload);
      break;
    case 'MATCH_CONFIRMATION':
      await matchingService.confirmMatch(payload);
      break;
    default:
      console.warn('[EventProcessor] Unknown event:', eventType);
      break;
  }
};

const claimPendingEvents = async () => {
  const result = await pool.query(`
    UPDATE realtime_events
    SET event_status = 'PROCESSING'
    WHERE id IN (
      SELECT id FROM realtime_events
      WHERE event_status IN ('PENDING', 'FAILED')
        AND retry_count < 5
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
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

const MAX_RETRIES = 5;

const markFailed = async (id) => {
  await pool.query(
    `
    UPDATE realtime_events
    SET
      retry_count = retry_count + 1,
      
      event_status = 
        CASE
          WHEN retry_count + 1 >= $2
          THEN 'DEAD'

          ELSE 'FAILED'
        END

    WHERE id = $1
  `,
    [id, MAX_RETRIES],
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
          console.error('[EventProcessor] Event failed:', {
            id: event.id,
            eventType: event.event_type,
            message: err.message,
          });
          await markFailed(event.id);
        }
      }),
    );
  } catch (err) {
    console.error('[EventProcessor] Processing error:', err);
  }
};

export { processPendingEvents, handle };
