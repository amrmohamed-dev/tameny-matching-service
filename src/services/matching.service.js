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

const findMatches = async (
  embedding,
  reportId,
  searchType,
  threshold = 0.6,
) => {
  const matches = await pool.query(
    `
    SELECT 
      report_id,
      1 - (embedding <=> $1) AS cosine_similarity
    FROM report_face_embeddings
    WHERE report_id != $2
      AND report_type = $3
      AND (embedding <=> $1) < (1 - $4::double precision)
    ORDER BY embedding <=> $1 ASC
    LIMIT 5
  `,
    [embedding, reportId, searchType, threshold],
  );

  return matches.rows;
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

    const matches = await findMatches(embedding, reportId, searchType);

    await saveMatches(reportId, reportType, matches);
  } catch (err) {
    console.error('[MatchingService] Error processing report:', err);
    throw err;
  }
};

export { processReport };
