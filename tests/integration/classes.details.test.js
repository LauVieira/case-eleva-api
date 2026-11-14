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

describe('GET /classes/:id', () => {
  it.each(['current', 'completed'])('retorna somente a turma %s solicitada, suas datas e escola por nome, sem alterar dados', async (status) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id, { name: 'escola são josé' });
    const otherSchool = await insertSchool(sector.id);
    await insertClass(otherSchool.id, { name: 'turma a' });
    const classRecord = await insertClass(school.id, {
      name: 'turma a', status, createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2021-01-01T00:00:00.000Z',
    });
    await insertClass(school.id);
    const before = await snapshot();

    const response = await request(app).get(`/classes/${classRecord.id}`).expect('Content-Type', /json/).expect(200);

    expect(response.body).toEqual({ ...classRecord, school: { id: school.id, name: school.name } });
    expect(new Date(response.body.createdAt).toISOString()).toBe(classRecord.createdAt);
    expect(new Date(response.body.updatedAt).toISOString()).toBe(classRecord.updatedAt);
    expect(await snapshot()).toEqual(before);
  });

  it.each(['', '.0', 'e0'])('valida e converte o identificador: sufixo %p', async (suffix) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id);
    const response = await request(app).get(`/classes/${classRecord.id}${suffix}`).expect(200);
    expect(response.body).toEqual({ ...classRecord, school: { id: school.id, name: school.name } });
  });

  it('consulta turma cadastrada pela API e reflete edições da turma e do nome da escola', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const created = await request(app).post(`/schools/${school.id}/classes`).send({
      name: ' TURMA A ', segment: 'Ensino Médio', grade: '1º ano', shift: 'Noturno', status: 'completed', maxOccupancy: 0,
    }).expect(201);
    const initial = await request(app).get(`/classes/${created.body.id}`).expect(200);
    expect(initial.body).toEqual({ ...created.body, school: { id: school.id, name: school.name } });

    const updated = await request(app).patch(`/classes/${created.body.id}`)
      .send({ name: ' NOVA TURMA ', status: 'current', maxOccupancy: 25 }).expect(200);
    await request(app).patch(`/schools/${school.id}`).send({ name: ' NOVA ESCOLA ' }).expect(200);
    const response = await request(app).get(`/classes/${created.body.id}`).expect(200);
    expect(response.body).toEqual({ ...updated.body, school: { id: school.id, name: 'nova escola' } });
    expect(response.body.createdAt).toBe(created.body.createdAt);
  });

  it.each([
    ['abc', '"id" deve ser um número inteiro positivo.'],
    ['0', '"id" deve ser um inteiro maior que zero.'],
    ['-1', '"id" deve ser um inteiro maior que zero.'],
    ['1.5', '"id" deve ser um número inteiro, sem casas decimais.'],
    ['2147483648', '"id" deve ser no máximo 2147483647.'],
    ['12abc', '"id" deve ser um número inteiro positivo.'],
  ])('rejeita identificador inválido com mensagem específica e sem consulta: %s', async (id, message) => {
    const find = jest.spyOn(ClassRepository, 'findDetailsById');
    const response = await request(app).get(`/classes/${id}`).expect('Content-Type', /json/).expect(422);
    expect(response.body).toEqual({ message });
    expect(find).not.toHaveBeenCalled();
  });

  it('responde 404 para turma inexistente sem alterar dados', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id);
    const before = await snapshot();
    const response = await request(app).get('/classes/2147483647').expect('Content-Type', /json/).expect(404);
    expect(response.body).toEqual({ message: 'Turma não encontrada' });
    expect(await snapshot()).toEqual(before);
  });

  it('responde 404 após a turma ser excluída', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id);
    await request(app).delete(`/classes/${classRecord.id}`).expect(204);
    const response = await request(app).get(`/classes/${classRecord.id}`).expect(404);
    expect(response.body).toEqual({ message: 'Turma não encontrada' });
  });

  it('responde erro seguro em falha de consulta, sem presumir turma inexistente', async () => {
    const error = new Error('detalhe interno do banco');
    jest.spyOn(ClassRepository, 'findDetailsById').mockRejectedValue(error);
    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app).get('/classes/1').expect('Content-Type', /json/).expect(500);
    expect(response.body).toEqual({ message: 'Erro interno no servidor. Tente novamente mais tarde.' });
    expect(logger).toHaveBeenCalledWith(error);
  });
});
