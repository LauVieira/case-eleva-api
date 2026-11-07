/* global describe, it, expect, jest, afterEach */

const { db, insertSector, schoolBody } = require('../auxiliarFunctions');
const supertest = require('supertest');
const app = require('../../src/app');

const agent = supertest(app);
afterEach(() => jest.restoreAllMocks());

describe('POST /schools', () => {
  it('rejects a nonexistent sector with JSON 422 and does not persist a school', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const sector = await insertSector();
    const missingSectorId = sector.id + 1;

    const response = await agent.post('/schools').send(schoolBody(missingSectorId));
    const stored = await db.query('SELECT id, "sectorId", name FROM schools');

    expect({
      status: response.status,
      contentType: response.type,
      body: response.body,
      persistedSchools: stored.rows,
    }).toEqual({
      status: 422,
      contentType: 'application/json',
      body: expect.objectContaining({
        message: expect.stringMatching(/sectorId|setor/i),
      }),
      persistedSchools: [],
    });
  });
});
