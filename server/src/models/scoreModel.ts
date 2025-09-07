import db from "../db";

// 🔄 Upsert score (judge voting)
export const setScore = async (
  judge_id: number,
  competitor_id: number,
  value: number
) => {
  const query = `
    INSERT INTO scores (judge_id, competitor_id, value)
    VALUES ($1, $2, $3)
    ON CONFLICT (judge_id, competitor_id)
    DO UPDATE SET value = EXCLUDED.value
    RETURNING *;
  `;
  const result = await db.query(query, [judge_id, competitor_id, value]);
  return result.rows[0];
};

// 📊 Secretary updating multiple scores (spreadsheet)
export const updateCompetitorScores = async (
  competitorId: number,
  scores: Record<string, string | number>
) => {
  for (const [judgeName, value] of Object.entries(scores)) {
    if (value === "N/A" || value === "" || value == null) continue;

    await db.query(
      `
      UPDATE scores s
      SET value = $1
      FROM judges j
      WHERE s.judge_id = j.id
        AND (j.first_name || ' ' || j.last_name) = $2
        AND s.competitor_id = $3
    `,
      [parseFloat(value as string), judgeName, competitorId]
    );
  }
};

// 📥 Fetch scores for a competitor
export const fetchScoresByCompetitor = async (competitorId: number) => {
  const query = `
    SELECT j.id AS judge_id,
           j.first_name || ' ' || j.last_name AS judge_name,
           s.value
    FROM judges j
    LEFT JOIN scores s 
      ON s.judge_id = j.id 
     AND s.competitor_id = $1
    WHERE j.role = 'judge'
    ORDER BY j.id;
  `;
  const result = await db.query(query, [competitorId]);
  return result.rows;
};
