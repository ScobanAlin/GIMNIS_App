import db from "../db";

// 📝 Fetch scores for a single judge
export const fetchJudgeScores = async (judgeId: number) => {
  const query = `
    SELECT s.id,
           c.id AS competitor_id,
           c.name AS competitor_name,
           c.category,
           c.club,
           s.value,
           json_agg(
             json_build_object(
               'id', cm.id,
               'first_name', cm.first_name,
               'last_name', cm.last_name,
               'age', cm.age,
               'sex', cm.sex
             )
           ) AS members
    FROM scores s
    JOIN competitors c ON s.competitor_id = c.id
    LEFT JOIN competitor_members cm ON c.id = cm.competitor_id
    WHERE s.judge_id = $1
    GROUP BY s.id, c.id, c.name, c.category, c.club, s.value
    ORDER BY c.category, c.name;
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
      c.name AS competitor_name,
      c.category,
      c.club,
      s.value,
      j.first_name || ' ' || j.last_name AS judge_name
    FROM scores s
    JOIN competitors c ON s.competitor_id = c.id
    JOIN judges j ON s.judge_id = j.id
    ORDER BY c.category, c.name, j.last_name;
  `;
  const result = await db.query(query);
  return result.rows;
};
