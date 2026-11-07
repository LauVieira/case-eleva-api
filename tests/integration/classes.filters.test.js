/* global describe, it, expect */
const { insertSector, insertSchool, insertClass } = require('../auxiliarFunctions');
const request = require('supertest');
const app = require('../../src/app');

describe('Listagem de turmas por situação', () => {
  it.each([[undefined, ['alpha', 'zulu']], ['current', ['alpha', 'zulu']], ['completed', ['beta']], ['all', ['alpha', 'beta', 'zulu']]])(
    'filtra %s e mantém ordenação e isolamento por escola', async (status, names) => {
      const sector = await insertSector();
      const school = await insertSchool(sector.id);
      const other = await insertSchool(sector.id);
      await insertClass(school.id, { name: 'zulu' });
      await insertClass(school.id, { name: 'beta', status: 'completed' });
      await insertClass(school.id, { name: 'alpha' });
      await insertClass(other.id, { name: 'outra escola' });
      let query = request(app).get(`/schools/${school.id}/classes`);
      if (status !== undefined) query = query.query({ status });
      const response = await query;
      expect(response.status).toBe(200);
      expect(response.body.map((item) => item.name)).toEqual(names);
      expect(response.body.every((item) => item.schoolId === school.id)).toBe(true);
    },
  );
  it.each(['active', '', ['current', 'completed']])('rejeita filtro inválido: %p', async (status) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const response = await request(app).get(`/schools/${school.id}/classes`).query({ status });
    expect(response.status).toBe(422);
    expect(response.body.message).toContain('status');
  });
  it('retorna lista vazia por padrão quando só existem turmas encerradas', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id, { status: 'completed' });
    const response = await request(app).get(`/schools/${school.id}/classes`).expect(200);
    expect(response.body).toEqual([]);
  });
});
