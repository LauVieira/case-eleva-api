/* global beforeEach, afterAll, it, describe, expect */
/* eslint-disable quotes*/

require('dotenv').config();

const { Pool } = require('pg');
const supertest = require('supertest');
const app = require('../../src/app');
const sequelize = require('../../src/utils/database');
const { insertSector, insertSchool } = require('../auxiliarFunctions');

const agent = supertest(app);
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

beforeEach(async () => {
  await cleanDB();
});

async function cleanDB () {
  await db.query('DELETE FROM schools');
  await db.query('DELETE FROM sectors');
}

afterAll(async () => {
  await cleanDB();
  await sequelize.close();
  await db.end();
});

describe('GET /courses/suggestions', () => {
  it('should return 200 and an array of sectors', async () => {
    const sector = await insertSector();
    const response = await agent.get('/sectors');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining(sector),
      ]),
    );
  });
});

describe('GET /courses/suggestions', () => {
  it('should return 200 and an array of sectors', async () => {
    const sector = await insertSector();
    const school = await insertSchool();

    const response = await agent.get(`/sectors/${sector.id}/schools`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining(school),
      ]),
    );
  });

  it('should return 404 when called with an unexisting secotId', async () => {
    const response = await agent.get(`/sectors/-1/schools`);

    expect(response.status).toBe(404);
  });
});

