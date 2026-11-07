/* global describe, it, expect, jest, afterEach */
const { db, insertSector, schoolBody } = require('../auxiliarFunctions');
const request = require('supertest');
const app = require('../../src/app');
const SchoolRepository = require('../../src/repositories/SchoolRepository');
afterEach(() => jest.restoreAllMocks());

describe('Nomes normalizados e unicidade de escolas', () => {
  it('normaliza antes do tamanho e da gravação, preservando acentos', async () => {
    const sector = await insertSector();
    const response = await request(app).post('/schools').send(schoolBody(sector.id, { name: '  ESCOLA' + ' '.repeat(110) + 'São José  ' }));
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('escola são josé');
    expect((await db.query('SELECT name FROM schools')).rows).toEqual([{ name: 'escola são josé' }]);
  });
  it('rejeita variações de caixa e espaços em outro setor', async () => {
    const first = await insertSector();
    const second = await insertSector();
    await request(app).post('/schools').send(schoolBody(first.id, { name: 'Escola Central' })).expect(201);
    await request(app).post('/schools').send(schoolBody(second.id, { name: ' ESCOLA   CENTRAL ' })).expect(409);
    expect((await db.query('SELECT name FROM schools')).rows).toEqual([{ name: 'escola central' }]);
  });
  it('mantém jose e josé como nomes distintos', async () => {
    const sector = await insertSector();
    for (const name of ['jose', 'josé']) await request(app).post('/schools').send(schoolBody(sector.id, { name })).expect(201);
    expect((await db.query('SELECT id FROM schools')).rows).toHaveLength(2);
  });
  it('traduz o conflito do banco em duas criações concorrentes para 409', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const sector = await insertSector();
    const original = SchoolRepository.findByName.bind(SchoolRepository);
    let arrivals = 0;
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    // As consultas continuam reais; a barreira garante que ambas vejam o banco vazio.
    jest.spyOn(SchoolRepository, 'findByName').mockImplementation(async (name) => {
      const result = await original(name);
      arrivals += 1;
      if (arrivals === 2) release();
      await gate;
      return result;
    });
    const responses = await Promise.all([1, 2].map(() => request(app).post('/schools').send(schoolBody(sector.id, { name: 'escola concorrente' }))));
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(responses.find((response) => response.status === 409).body.message).toMatch(/name|nome/);
    expect((await db.query('SELECT id FROM schools')).rows).toHaveLength(1);
  });
});
