/* global describe, it, expect */

const { db, insertSector, schoolBody } = require('../auxiliarFunctions');
const supertest = require('supertest');
const app = require('../../src/app');

const agent = supertest(app);

describe('POST /schools', () => {
  it('rejects a name containing only an empty HTML tag with 422 and does not persist a school', async () => {
    const sector = await insertSector();
    const body = schoolBody(sector.id, { name: '<b></b>' });

    const response = await agent.post('/schools').send(body);
    const stored = await db.query('SELECT id, name FROM schools');

    expect({
      status: response.status,
      persistedSchools: stored.rows,
    }).toEqual({
      status: 422,
      persistedSchools: [],
    });
  });
});
