const db = require("../db");

export const insertCompetitor = async (
  first_name: string,
    last_name: string,
    email: string,
    category: string,
    age: number,
    club: string
) => {
  const query = `
    INSERT INTO competitor (first_name, last_name, email, category, age, club)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [first_name, last_name, email, category, age, club];
  const result = await db.query(query, values);
  return result.rows[0];
}


export const deleteCompetitorById = async (id: number) => {
  const query = `
    DELETE FROM competitor where id = $1
    RETURNING *;
  `;
  const values = [id];
  const result = await db.query(query, values);
  return result.rows[0];
}
