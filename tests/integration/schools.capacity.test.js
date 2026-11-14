/* global describe, it, expect */
const { db, insertSector, insertSchool, insertClass } = require('../auxiliarFunctions');
const request = require('supertest');
const app = require('../../src/app');

describe('Capacidade total da escola', () => {
  it('soma apenas turmas ativas da escola consultada e preserva seus dados', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const other = await insertSchool(sector.id);
    await insertClass(school.id, { maxOccupancy: 30 });
    await insertClass(school.id, { maxOccupancy: 0 });
    await insertClass(school.id, { status: 'completed', maxOccupancy: 20 });
    await insertClass(other.id, { maxOccupancy: 100 });
    const response = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(response.body).toEqual({ ...school, totalCapacity: 30 });
  });

  it.each([false, true])('retorna zero sem turmas ativas; possui encerrada: %s', async (hasCompleted) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    if (hasCompleted) await insertClass(school.id, { status: 'completed' });
    const response = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(response.body.totalCapacity).toBe(0);
  });

  it('mantém o total independente do filtro da listagem de turmas', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id, { maxOccupancy: 30 });
    await insertClass(school.id, { status: 'completed', maxOccupancy: 20 });
    for (const status of ['current', 'completed', 'all']) {
      await request(app).get(`/schools/${school.id}/classes`).query({ status }).expect(200);
      const response = await request(app).get(`/schools/${school.id}`).expect(200);
      expect(response.body.totalCapacity).toBe(30);
    }
  });

  it('recalcula após mudança da situação no banco, sem armazenar um total desatualizado', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classroom = await insertClass(school.id, { maxOccupancy: 30 });
    const before = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(before.body.totalCapacity).toBe(30);
    await db.query('UPDATE classes SET status = $1 WHERE id = $2', ['completed', classroom.id]);
    const after = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(after.body.totalCapacity).toBe(0);
  });

  it('não limita a soma ao tamanho de uma coluna inteira individual', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id, { maxOccupancy: 2147483647 });
    await insertClass(school.id, { maxOccupancy: 2147483647 });
    const response = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(response.body.totalCapacity).toBe(4294967294);
  });
});
