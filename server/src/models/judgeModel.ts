import db from "../db";

// 📝 Fetch scores for a single judge
export const fetchJudgeScores = async (judgeId: number) => {
  const query = `
    SELECT 
      s.id,
      c.id AS competitor_id,
      c.category,
      c.club,
      s.value,
      s.score_type,
      json_agg(
        json_build_object(
          'id', cm.id,
          'first_name', cm.first_name,
          'last_name', cm.last_name,
          'age', cm.age,
          'sex', cm.sex
        )
      ) FILTER (WHERE cm.id IS NOT NULL) AS members
    FROM scores s
    JOIN competitors c ON s.competitor_id = c.id
    LEFT JOIN competitor_members cm ON c.id = cm.competitor_id
    WHERE s.judge_id = $1
    GROUP BY s.id, c.id, c.category, c.club, s.value, s.score_type
    ORDER BY c.category, c.club, s.id;
  `;
  const result = await db.query(query, [judgeId]);
  return result.rows;
};

// 📊 Fetch all scores across all judges
export const fetchAllScores = async () => {
  const query = `
    SELECT 
      s.id,
      c.id AS competitor_id,
      c.category,
      c.club,
      s.value,
      s.score_type,
      j.first_name || ' ' || j.last_name AS judge_name,
      j.role AS judge_role
    FROM scores s
    JOIN competitors c ON s.competitor_id = c.id
    JOIN judges j ON s.judge_id = j.id
    ORDER BY c.category, c.club, j.last_name, s.score_type;
  `;
  const result = await db.query(query);
  return result.rows;
};

export const fetchAllJudges = async () => {
  const query = `
    SELECT 
      id,
      first_name,
      last_name,
      role
    FROM judges
    WHERE role != 'principal'
    ORDER BY role, last_name, first_name;
  `;
  const result = await
    db.query(query);
  return result.rows;
}
export async function findJudgeById(id: number) {
  const result = await db.query("SELECT * FROM judges WHERE id = $1", [id]);
  return result.rows[0] || null;
}
