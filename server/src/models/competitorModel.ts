import db from "../db";

export const insertCompetitor = async (
  name: string,
  category: string,
  club: string,
  members: {
    first_name: string;
    last_name: string;
    email: string;
    age: number;
    sex: "M" | "F";
  }[]
) => {
  // 1. Insert competitor team
  const compRes = await db.query(
    `INSERT INTO competitors (name, category, club)
     VALUES ($1, $2, $3)
     RETURNING *;`,
    [name, category, club]
  );
  const competitor = compRes.rows[0];

  // 2. Insert members
  for (const m of members) {
    await db.query(
      `INSERT INTO competitor_members
       (competitor_id, first_name, last_name, email, age, sex)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [competitor.id, m.first_name, m.last_name, m.email, m.age, m.sex]
    );
  }

  // Attach members in response
  competitor.members = members;
  return competitor;
};

export const deleteCompetitorById = async (id: number) => {
  const res = await db.query(`DELETE FROM competitors WHERE id=$1 RETURNING *;`, [id]);
  return res.rows[0];
};

export const getAllCompetitors = async () => {
  const query = `
    SELECT c.id as competitor_id,
           c.name,
           c.category,
           c.club,
           m.id as member_id,
           m.first_name,
           m.last_name,
           m.age,
           m.sex
    FROM competitors c
    LEFT JOIN competitor_members m ON m.competitor_id = c.id
    ORDER BY c.id, m.id;
  `;
  const result = await db.query(query);

  // group members into array
  const grouped: Record<number, any> = {};
  result.rows.forEach(row => {
    if (!grouped[row.competitor_id]) {
      grouped[row.competitor_id] = {
        id: row.competitor_id,
        name: row.name,
        category: row.category,
        club: row.club,
        members: []
      };
    }
    if (row.member_id) {
      grouped[row.competitor_id].members.push({
        id: row.member_id,
        first_name: row.first_name,
        last_name: row.last_name,
        age: row.age,
        sex: row.sex,
      });
    }
  });

  return Object.values(grouped);
};

export const fetchCompetitorsWithScores = async (category: string) => {
  const query = `
    SELECT 
      c.id AS competitor_id,
      c.name AS competitor_name,
      c.category,
      c.club,
      m.id AS member_id,
      m.first_name AS member_first_name,
      m.last_name AS member_last_name,
      m.age AS member_age,
      m.sex AS member_sex,
      j.id AS judge_id,
      j.first_name || ' ' || j.last_name AS judge_name,
      s.value AS score_value
    FROM competitors c
    LEFT JOIN competitor_members m ON m.competitor_id = c.id
    CROSS JOIN judges j
    LEFT JOIN scores s 
      ON s.judge_id = j.id 
     AND s.competitor_id = c.id
    WHERE c.category = $1
      AND j.role = 'judge'
    ORDER BY c.id, m.id, j.id;
  `;

  const result = await db.query(query, [category]);

  // Group by competitor
  const grouped: Record<number, any> = {};

  for (const row of result.rows) {
    if (!grouped[row.competitor_id]) {
      grouped[row.competitor_id] = {
        id: row.competitor_id,
        name: row.competitor_name,
        category: row.category,
        club: row.club,
        members: [],
        scores: {},
      };
    }

    // add member if exists
    if (
      row.member_id &&
      !grouped[row.competitor_id].members.find((m: any) => m.id === row.member_id)
    ) {
      grouped[row.competitor_id].members.push({
        id: row.member_id,
        first_name: row.member_first_name,
        last_name: row.member_last_name,
        age: row.member_age,
        sex: row.member_sex,
      });
    }

    // add score for judge
    grouped[row.competitor_id].scores[row.judge_name] =
      row.score_value !== null ? Number(row.score_value) : "N/A";
  }

  return Object.values(grouped);
};