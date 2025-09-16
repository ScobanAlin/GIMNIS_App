import db from "../db";

// 🔄 Upsert score (judge voting)
export const setScore = async (
  judge_id: number,
  competitor_id: number,
  value: number,
  score_type: string
) => {
  const query = `
    INSERT INTO scores (judge_id, competitor_id, value, score_type)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (judge_id, competitor_id, score_type)
    DO UPDATE SET value = EXCLUDED.value
    RETURNING *;
  `;
  const result = await db.query(query, [
    judge_id,
    competitor_id,
    value,
    score_type,
  ]);
  return result.rows[0];
};

// 📥 Fetch scores for a competitor (with score_type)
export const fetchScoresByCompetitor = async (competitorId: number) => {
  const query = `
    SELECT j.id AS judge_id,
           j.first_name || ' ' || j.last_name AS judge_name,
           j.role AS judge_role,
           s.score_type,
           s.value
    FROM judges j
    LEFT JOIN scores s 
      ON s.judge_id = j.id 
     AND s.competitor_id = $1
    ORDER BY j.id, s.score_type;
  `;
  const result = await db.query(query, [competitorId]);
  return result.rows;
};
