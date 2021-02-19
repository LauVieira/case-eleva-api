/* global beforeEach, afterAll, it, describe, expect */
/* eslint-disable quotes*/

require('dotenv').config();

const { Pool } = require('pg');
const supertest = require('supertest');
const app = require('../../src/app');
const sequelize = require('../../src/utils/database');
const { insertSector, insertSchool, insertClass } = require('../auxiliarFunctions');

const agent = supertest(app);
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

beforeEach(async () => {
  await cleanDB();
});

async function cleanDB () {
  await db.query('DELETE FROM classes');
  await db.query('DELETE FROM schools');
  await db.query('DELETE FROM sectors');
}

afterAll(async () => {
  await cleanDB();
  await sequelize.close();
  await db.end();
});

describe('GET /:id', () => {
  it('should return 200 and an object with the school data', async () => {
    const sector = await insertSector();
    const school = await insertSchool();

    const response = await agent.get(`/schools/${school.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining(school),
    );
  });

  it('should return 404 when called with an unexisting schoolId', async () => {
    const response = await agent.get(`/schools/-1`);

    expect(response.status).toBe(404);
  });
});

describe('POST /', () => {
  it('should return 201 and the school object', async () => {
    const sector = await insertSector();
    const schoolBody = {
      sectorId: sector.id,
      name: 'Colégio M. Ancyra Gonçalves Pimentel',
      address: 'Avenida Amaral Peixoto nº 555, Miramar - CEP: 27943-400',
      headteacher: 'Êda Luiz',
      phone: '(22)98131-0329'
    };

    const response = await agent.post('/schools/').send(schoolBody);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining(schoolBody),
    );
  });

  it('should return status 409 when trying to create school with the same name of another', async () => {
    const sector = await insertSector();
    const schoolBody1 = {
      sectorId: sector.id,
      name: 'Colégio M. Ancyra Gonçalves Pimentel',
      address: 'Avenida Amaral Peixoto nº 555, Miramar - CEP: 27943-400',
      headteacher: 'Êda Luiz',
      phone: '(22)98131-0329'
    };
    const schoolBody2 = {
      sectorId: sector.id,
      name: 'Colégio M. Ancyra Gonçalves Pimentel',
      address: 'Another Address',
      headteacher: 'Another headteacher',
      phone: 'Another phone'
    };

    await agent.post('/schools/').send(schoolBody1);
    const response = await agent.post('/schools/').send(schoolBody2);

    expect(response.status).toBe(409);
  });

  it('should return status 422 when trying to create school with invalid data', async () => {
    const sector = await insertSector();
    const schoolBody = {
      sectorId: sector.id,
      name: false,
      address: 'Avenida Amaral Peixoto nº 555, Miramar - CEP: 27943-400',
      headteacher: 'Êda Luiz',
      phone: 999999
    };
    const response = await agent.post('/schools/').send(schoolBody);

    expect(response.status).toBe(422);
  });
});

describe('GET /:id/classes', () => {
  it('should return 200 and an object with the school data', async () => {
    await insertSector();
    const school = await insertSchool();
    const classs = await insertClass();

    const response = await agent.get(`/schools/${school.id}/classes`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining(classs),
      ]),
    );
  });

  it('should return 404 when called with an unexisting schoolId', async () => {
    const response = await agent.get(`/schools/-1/classes`);

    expect(response.status).toBe(404);
  });
});

