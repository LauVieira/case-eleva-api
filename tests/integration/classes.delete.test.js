/* global describe, it, expect, jest, afterEach */
const { db, insertSector, insertSchool, insertClass } = require('../auxiliarFunctions');
const request = require('supertest');
const app = require('../../src/app');
const ClassRepository = require('../../src/repositories/ClassRepository');

afterEach(() => jest.restoreAllMocks());

async function snapshot () {
  const classes = await db.query('SELECT * FROM classes ORDER BY id');
  const schools = await db.query('SELECT * FROM schools ORDER BY id');
  const sectors = await db.query('SELECT * FROM sectors ORDER BY id');
  return { classes: classes.rows, schools: schools.rows, sectors: sectors.rows };
}

describe('DELETE /classes/:id', () => {
  it.each([
    ['current', 30], ['completed', 30], ['current', 0], ['completed', 0],
  ])('exclui turma %s com capacidade %s, preservando escolas, setores e outras turmas', async (status, maxOccupancy) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const otherSchool = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id, { status, maxOccupancy });
    const remaining = await insertClass(school.id, { maxOccupancy: 10 });
    await insertClass(otherSchool.id, { maxOccupancy: 100 });
    const before = await snapshot();

    const response = await request(app).delete(`/classes/${classRecord.id}`).expect(204);

    expect(response.text).toBe('');
    expect(await snapshot()).toEqual({ ...before, classes: before.classes.filter((item) => item.id !== classRecord.id) });
    const all = await request(app).get(`/schools/${school.id}/classes?status=all`).expect(200);
    expect(all.body).toEqual([remaining]);
    const completed = await request(app).get(`/schools/${school.id}/classes?status=completed`).expect(200);
    expect(completed.body).toEqual([]);
    const current = await request(app).get(`/schools/${school.id}/classes`).expect(200);
    expect(current.body).toEqual([remaining]);
    const details = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(details.body.totalCapacity).toBe(10);
    await request(app).delete(`/classes/${classRecord.id}`).expect(404)
      .expect({ message: 'Turma não encontrada' });
  });

  it.each(['current', 'completed'])('excluir a última turma %s zera capacidade e permite excluir a escola', async (status) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id, { status });
    await request(app).delete(`/schools/${school.id}`).expect(409)
      .expect({ message: 'Não é possível excluir esta escola porque existem turmas vinculadas a ela. Exclua primeiro as turmas e tente novamente.' });
    await request(app).delete(`/classes/${classRecord.id}`).expect(204);
    const details = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(details.body.totalCapacity).toBe(0);
    await request(app).delete(`/schools/${school.id}`).expect(204);
    const stored = await snapshot();
    expect(stored.classes).toEqual([]);
    expect(stored.schools).toEqual([]);
    expect(stored.sectors).toHaveLength(1);
  });

  it.each(['', '.0', 'e0'])('valida e converte o ID da turma: sufixo %p', async (suffix) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id);
    await request(app).delete(`/classes/${classRecord.id}${suffix}`).expect(204);
    expect((await snapshot()).classes).toEqual([]);
  });

  it.each([
    ['abc', '"id" deve ser um número inteiro positivo.'],
    ['0', '"id" deve ser um inteiro maior que zero.'],
    ['-1', '"id" deve ser um inteiro maior que zero.'],
    ['1.5', '"id" deve ser um número inteiro, sem casas decimais.'],
    ['2147483648', '"id" deve ser no máximo 2147483647.'],
    ['12abc', '"id" deve ser um número inteiro positivo.'],
  ])('rejeita ID inválido sem alterar registros: %s', async (id, message) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id);
    const before = await snapshot();
    const response = await request(app).delete(`/classes/${id}`).expect('Content-Type', /json/).expect(422);
    expect(response.body).toEqual({ message });
    expect(await snapshot()).toEqual(before);
  });

  it('responde 404 para turma inexistente sem alterar registros', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id);
    const before = await snapshot();
    const response = await request(app).delete('/classes/2147483647').expect('Content-Type', /json/).expect(404);
    expect(response.body).toEqual({ message: 'Turma não encontrada' });
    expect(await snapshot()).toEqual(before);
  });

  it.each([false, true])('retorna falha de exclusão sem presumir ausência; lança erro: %s', async (throwsError) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id);
    const before = await snapshot();
    const deletion = jest.spyOn(ClassRepository, 'delete');
    if (throwsError) deletion.mockRejectedValue(new Error('detalhe interno do banco'));
    else deletion.mockResolvedValue(0);
    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app).delete(`/classes/${classRecord.id}`).expect('Content-Type', /json/).expect(500);
    expect(response.body).toEqual({ message: 'Não foi possível excluir a turma. Tente novamente.' });
    expect(logger).toHaveBeenCalled();
    expect(await snapshot()).toEqual(before);
  });
});
