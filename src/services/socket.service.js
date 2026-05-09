import emitToUser from '../sockets/utils/emit.js';
import SOCKET_EVENTS from '../sockets/utils/constants.js';

const emitMatchesFound = async ({
  userId,
  reportId,
  totalMatches,
  topConfidenceScore,
  foundReportImageUrl,
  matches = [],
}) => {
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
  emitToUser(userId, SOCKET_EVENTS.MATCH_CONFIRMED, {
    type: SOCKET_EVENTS.MATCH_CONFIRMED,
    matchedReportId,
    matchedPersonName,
    matchedPersonImageUrl,
  });
};

export { emitMatchesFound, emitMatchConfirmed };
