import pool from '../db/pool.js';
import SOCKET_EVENTS from '../sockets/utils/constants.js';
import emitToUser from '../sockets/utils/emit.js';

const NOTIFICATION_TYPES = {
  REPORT_CREATED: 'REPORT_CREATED',
  MATCH_FOUND: 'MATCH_FOUND',
  MATCH_CONFIRMED: 'MATCH_CONFIRMED',
};

const createNotification = async ({
  userId,
  type,
  title,
  body,
  data = {},
}) => {
  const result = await pool.query(
    `
    INSERT INTO notifications (user_id, notification_type, title, body, payload)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [userId, type, title, body, data],
  );

  const notification = result.rows[0];

  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_NEW, notification);

  return notification;
};

const createMatchFoundNotification = ({
  userId,
  reportId,
  totalMatches,
  topConfidenceScore,
  foundReportImageUrl,
}) =>
  createNotification({
    userId,
    type: NOTIFICATION_TYPES.MATCH_FOUND,
    title: 'تم العثور على تطابقات محتملة',
    body:
      totalMatches === 1
        ? 'تم العثور على تطابق محتمل لبلاغك، يمكنك مراجعته الآن'
        : `تم العثور على ${totalMatches} تطابقات محتملة لبلاغك، يمكنك مراجعتها الآن`,
    data: {
      reportId,
      totalMatches,
      topConfidenceScore,
      foundReportImageUrl,
    },
  });

const createMatchConfirmedNotification = ({
  userId,
  matchedReportId,
  matchedPersonName,
  matchedPersonImageUrl,
}) =>
  createNotification({
    userId,
    type: NOTIFICATION_TYPES.MATCH_CONFIRMED,
    title: 'تم تأكيد التطابق',
    body: `تم تأكيد أن الشخص الذي عثرت عليه هو ${matchedPersonName}`,
    data: {
      matchedReportId,
      matchedPersonName,
      matchedPersonImageUrl,
    },
  });

export { createMatchFoundNotification, createMatchConfirmedNotification };
