import pool from '../db/pool.js';

const formatConfidencePercentage = (score) =>
  Number((score * 100).toFixed(1));

const getEmbedding = async (reportId) => {
  const embeddingResult = await pool.query(
    `
    SELECT embedding
    FROM report_face_embeddings
    WHERE report_id = $1
    LIMIT 1
    `,
    [reportId],
  );

  return embeddingResult.rows[0]?.embedding;
};

const findMatches = async (embedding, reportId, searchType, threshold) => {
  const additionSelect =
    searchType === 'MISSING'
      ? `(re.payload->>'reporterUserId')::bigint AS missing_user_id,`
      : `re.payload->>'reportedPersonImageUrl' AS reported_person_image_url,
        re.payload->>'reportedPersonName' AS reported_person_name,
        re.payload->>'reportedPersonGender' AS reported_person_gender,`;

  const matches = await pool.query(
    `
      SELECT
        rfe.report_id,
        ${additionSelect}
        1 - (rfe.embedding <=> $1) AS cosine_similarity,
        re.created_at

      FROM report_face_embeddings rfe

      JOIN realtime_events re
        ON (re.payload->>'reportId')::bigint = rfe.report_id
       AND re.event_type = 'EMBEDDING_SEARCH'

      WHERE rfe.report_id != $2
        AND rfe.report_type = $3
        AND (rfe.embedding <=> $1) < (1 - $4::double precision)

      ORDER BY rfe.embedding <=> $1 ASC
      LIMIT 5
    `,
    [embedding, reportId, searchType, threshold],
  );

  return matches.rows.map((match) => ({
    reportId: Number(match.report_id),
    confidenceScore: Number(match.cosine_similarity),
    missingUserId: match.missing_user_id
      ? Number(match.missing_user_id)
      : null,
    reportedPersonImageUrl: match.reported_person_image_url,
    reportedPersonName: match.reported_person_name,
    reportedPersonGender: match.reported_person_gender,
    createdAt: match.created_at,
  }));
};

const saveMatches = async (reportId, reportType, matches) => {
  if (!matches.length) return;

  const values = [];
  const placeholders = [];

  matches.forEach((match, index) => {
    const baseIndex = index * 4;

    const [missingReportId, foundReportId] =
      reportType === 'MISSING'
        ? [reportId, match.reportId]
        : [match.reportId, reportId];

    values.push(
      missingReportId,
      foundReportId,
      match.confidenceScore,
      'PENDING',
    );

    placeholders.push(
      `($${baseIndex + 1}, $${baseIndex + 2},$${baseIndex + 3},$${baseIndex + 4})`,
    );
  });

  const result = await pool.query(
    `
      INSERT INTO potential_matches
      (missing_report_id, found_report_id, confidence_score, status)
      VALUES ${placeholders.join(',')}
      ON CONFLICT (missing_report_id, found_report_id) DO NOTHING
      RETURNING missing_report_id, found_report_id, confidence_score
    `,
    values,
  );

  return result.rows;
};

const processReport = async (event) => {
  try {
    const {
      reporterUserId: userId,
      reportId,
      reportType,
      reportedPersonImageUrl,
    } = event;

    const embedding = await getEmbedding(reportId);
    if (!embedding) return;

    const searchType = reportType === 'MISSING' ? 'FOUND' : 'MISSING';

    const threshold = 0.6;
    const matches = await findMatches(
      embedding,
      reportId,
      searchType,
      threshold,
    );

    if (!matches?.length) return;

    const insertedMatches = await saveMatches(
      reportId,
      reportType,
      matches,
    );

    if (!insertedMatches?.length) return;

    if (reportType === 'MISSING') {
      const topConfidenceScore =
        formatConfidencePercentage(matches[0]?.confidenceScore) || 0;

      console.log('[MATCH_FOUND:MISSING_REPORT]', {
        userId,
        reportId,
        totalMatches: matches.length,
        topConfidenceScore,
        foundReportImageUrl: matches[0]?.reportedPersonImageUrl || null,
        matches,
      });

      return;
    }

    const matchPayloads = matches.map((match) => {
      if (!match.missingUserId) return null;

      const confidencePercentage = formatConfidencePercentage(
        match.confidenceScore,
      );

      return {
        userId: match.missingUserId,
        reportId: match.reportId,
        totalMatches: 1,
        topConfidenceScore: confidencePercentage,
        foundReportImageUrl:
          match.reportedPersonImageUrl || reportedPersonImageUrl,
        matches: [
          {
            reportId,
            confidenceScore: confidencePercentage,
            reportedPersonName: match.reportedPersonName,
            reportedPersonGender: match.reportedPersonGender,
            reportedPersonImageUrl:
              match.reportedPersonImageUrl || reportedPersonImageUrl,
            createdAt: match.createdAt,
          },
        ],
      };
    });

    console.log(
      '[MATCH_FOUND:FOUND_REPORT]',
      matchPayloads.filter(Boolean),
    );
  } catch (err) {
    console.error('[MatchingService] Error processing report:', err);

    throw err;
  }
};
    throw err;
  }
};

export { processReport };
