/* global it, describe, expect, jest, afterEach */

const { insertSector, insertSchool, insertClass } = require('../auxiliarFunctions');
const supertest = require('supertest');
const app = require('../../src/app');

const agent = supertest(app);
afterEach(() => jest.restoreAllMocks());

describe('GET /sectors', () => {
  it('returns an empty JSON array when there are no sectors', async () => {
    const response = await agent.get('/sectors').expect('Content-Type', /json/).expect(200);
    expect(response.body).toEqual([]);
  });

  it('returns all sector fields ordered by name, independently of insertion order', async () => {
    const zulu = await insertSector({ name: 'Zulu' });
    const alpha = await insertSector({ name: 'Alpha' });
    const middle = await insertSector({ name: 'Middle' });

    const response = await agent.get('/sectors').expect('Content-Type', /json/).expect(200);
    expect(response.body).toEqual([alpha, middle, zulu]);
  });
});

describe('GET /sectors/:id/schools', () => {
  it('returns only schools of the requested sector, ordered by name, with their full fields', async () => {
    const sector = await insertSector();
    const otherSector = await insertSector();
    const zulu = await insertSchool(sector.id, { name: 'Zulu' });
    await insertSchool(otherSector.id, { name: 'Other sector' });
    const alpha = await insertSchool(sector.id, { name: 'Alpha' });
    await insertClass(alpha.id);

    const response = await agent.get(`/sectors/${sector.id}/schools`)
      .expect('Content-Type', /json/).expect(200);
    expect(response.body).toEqual([alpha, zulu]);
  });

  it('returns [] for an existing sector without schools', async () => {
    const sector = await insertSector();
    
    const response = await agent.get(`/sectors/${sector.id}/schools`).expect(200);
    expect(response.body).toEqual([]);
  });

  it('returns the current 404 JSON message for a missing sector', async () => {
    const response = await agent.get('/sectors/-1/schools')
      .expect('Content-Type', /json/).expect(404);
    expect(response.body).toEqual({ message: 'Setor não encontrado' });
  });

  it('currently returns 500 with an HTML content type for a nonnumeric id', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const response = await agent.get('/sectors/abc/schools')
      .expect('Content-Type', /html/).expect(500);
    expect(response.text).toBe('Erro interno no servidor');
  });
});
