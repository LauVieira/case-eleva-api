/* eslint-disable quotes*/

require('dotenv').config();

const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function insertSector () {
  const sectorValues = ['Test Name', 'Test Code', 'Test Color'];
  const queryString = 'INSERT INTO sectors (name, code, color) VALUES ($1, $2, $3) RETURNING *';

  const dbSector = await db.query(queryString, sectorValues);

  return dbSector.rows[0];
}

async function insertSchool () {
  const dbSector = await db.query(`SELECT * FROM sectors WHERE name = 'Test Name'`);
  const sectorId = dbSector.rows[0].id;
  
  const schoolValues = [sectorId, 'Test School Name', 'Test School Adress', 'Test headteacher', 'Test phone'];
  const queryString = 'INSERT INTO schools ( "sectorId", name, address, headteacher, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *';
  
  const dbSchool = await db.query(queryString, schoolValues);

  return dbSchool.rows[0];
}

module.exports = { insertSector, insertSchool };
