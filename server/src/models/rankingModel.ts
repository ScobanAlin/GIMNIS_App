import db from "../db";

export const fetchRankings = async () => {
  const query = `
    SELECT 
      c.category,
      c.id AS competitor_id,
      c.club,
      -- Sum all scores but subtract penalizations
      COALESCE(
        SUM(
          CASE 
            WHEN s.score_type IN ('execution','artistry','difficulty') 
              THEN s.value
            WHEN s.score_type IN ('difficulty_penalization','line_penalization','principal_penalization') 
              THEN -s.value
            ELSE 0
          END
        ), 
      0) AS total_score
    FROM competitors c
    LEFT JOIN scores s ON s.competitor_id = c.id
    GROUP BY c.category, c.id, c.club
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
      competitor_id: row.competitor_id,
      club: row.club,
      score: Number(row.total_score),
    });
  });

  return rankings;
};
