import pool from '../db/pool.js';

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

    const [missingId, foundId] =
      reportType === 'MISSING'
        ? [reportId, match.report_id]
        : [match.report_id, reportId];

    values.push(missingId, foundId, match.cosine_similarity, 'PENDING');

    placeholders.push(
      `($${baseIndex + 1}, $${baseIndex + 2},$${baseIndex + 3},$${baseIndex + 4})`,
    );
  });

  await pool.query(
    `
      INSERT INTO potential_matches
      (missing_report_id, found_report_id, confidence_score, status)
      VALUES ${placeholders.join(',')}
    `,
    values,
  );
};

const processReport = async (event) => {
  try {
    const { reportId, reportType } = event;

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

    await saveMatches(reportId, reportType, matches);
  } catch (err) {
    console.error('[MatchingService] Error processing report:', err);
    throw err;
  }
};

export { processReport };
