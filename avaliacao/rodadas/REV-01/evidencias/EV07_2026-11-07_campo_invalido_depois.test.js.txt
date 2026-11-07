/* global describe, it, expect */

const { db, insertSector, schoolBody } = require('../auxiliarFunctions');
const supertest = require('supertest');
const app = require('../../src/app');

const agent = supertest(app);

describe('POST /schools', () => {
  it('identifies the invalid name field in the 422 message and does not persist a school', async () => {
    const sector = await insertSector();
    const response = await agent.post('/schools').send(schoolBody(sector.id, { name: '' }));
    const stored = await db.query('SELECT id, name FROM schools');

    expect({
      status: response.status,
      body: response.body,
      persistedSchools: stored.rows,
    }).toEqual({
      status: 422,
      body: expect.objectContaining({
        message: expect.stringMatching(/\b(name|nome)\b/i),
      }),
      persistedSchools: [],
    });
  });
});
