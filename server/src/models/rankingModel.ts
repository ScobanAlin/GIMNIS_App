import db from "../db";

export const fetchRankings = async () => {
  const query = `
    SELECT 
      c.category,
      c.id AS competitor_id,
      c.name AS competitor_name,
      COALESCE(SUM(s.value), 0) AS total_score
    FROM competitors c
    LEFT JOIN scores s ON s.competitor_id = c.id
    GROUP BY c.category, c.id
    ORDER BY c.category, total_score DESC;
  `;

  const result = await db.query(query);

  // Structure as { category: [ranking list] }
  const rankings: Record<string, any[]> = {};

  result.rows.forEach((row: any) => {
    const category = row.category;
    if (!rankings[category]) {
      rankings[category] = [];
    }
    rankings[category].push({
      position: rankings[category].length + 1,
      competitor: row.competitor_name,
      score: Number(row.total_score),
    });
  });

  return rankings;
};