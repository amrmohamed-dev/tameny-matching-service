import emitToUser from '../sockets/utils/emit.js';
import SOCKET_EVENTS from '../sockets/utils/constants.js';
import * as notificationService from './notification.service.js';

const emitReportCreated = async ({ userId, reportId, reportType }) => {
  await notificationService.createReportCreatedNotification({
    userId,
    reportId,
    reportType,
  });
};

const emitMatchesFound = async ({
  userId,
  reportId,
  totalMatches,
  topConfidenceScore,
  foundReportImageUrl,
  matches = [],
}) => {
  await notificationService.createMatchFoundNotification({
    userId,
    reportId,
    totalMatches,
    topConfidenceScore,
    foundReportImageUrl,
  });

  emitToUser(userId, SOCKET_EVENTS.MATCH_FOUND, {
    type: SOCKET_EVENTS.MATCH_FOUND,
    reportId,
    totalMatches,
    topConfidenceScore,
    foundReportImageUrl,
    matches,
  });
};

const emitMatchConfirmed = async ({
  userId,
  matchedReportId,
  matchedPersonName,
  matchedPersonImageUrl,
}) => {
  await notificationService.createMatchConfirmedNotification({
    userId,
    matchedReportId,
    matchedPersonName,
    matchedPersonImageUrl,
  });

  emitToUser(userId, SOCKET_EVENTS.MATCH_CONFIRMED, {
    type: SOCKET_EVENTS.MATCH_CONFIRMED,
    matchedReportId,
    matchedPersonName,
    matchedPersonImageUrl,
  });
};

export { emitReportCreated, emitMatchesFound, emitMatchConfirmed };
