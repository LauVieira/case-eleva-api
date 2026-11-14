/* global describe, it, expect, jest, afterEach */
const { db, insertSector, insertSchool, insertClass } = require('../auxiliarFunctions');
const request = require('supertest');
const app = require('../../src/app');
const SchoolRepository = require('../../src/repositories/SchoolRepository');

afterEach(() => jest.restoreAllMocks());

const linkedClassesMessage = 'Não é possível excluir esta escola porque existem turmas vinculadas a ela. Exclua primeiro as turmas e tente novamente.';

async function snapshot () {
  const schools = await db.query('SELECT * FROM schools ORDER BY id');
  const classes = await db.query('SELECT * FROM classes ORDER BY id');
  const sectors = await db.query('SELECT * FROM sectors ORDER BY id');
  return { schools: schools.rows, classes: classes.rows, sectors: sectors.rows };
}

describe('DELETE /schools/:id', () => {
  it('exclui escola sem turmas com 204, preservando setor e outros registros', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const other = await insertSchool(sector.id);
    await insertClass(other.id);
    const before = await snapshot();

    const response = await request(app).delete(`/schools/${school.id}`).expect(204);

    expect(response.text).toBe('');
    expect(await snapshot()).toEqual({ ...before, schools: before.schools.filter((item) => item.id !== school.id) });
    await request(app).get(`/schools/${school.id}`).expect(404)
      .expect({ message: 'Escola não encontrada' });
    const listing = await request(app).get(`/sectors/${sector.id}/schools`).expect(200);
    expect(listing.body).toEqual([other]);
    await request(app).delete(`/schools/${school.id}`).expect(404)
      .expect({ message: 'Escola não encontrada' });
  });

  it.each(['', '.0', 'e0'])('valida e converte o identificador antes da exclusão: sufixo %p', async (suffix) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await request(app).delete(`/schools/${school.id}${suffix}`).expect(204);
    expect((await db.query('SELECT id FROM schools')).rows).toEqual([]);
  });

  it.each([
    ['current', 20], ['completed', 20], ['current', 0], ['completed', 0],
  ])('bloqueia exclusão com turma %s de capacidade %s, sem alterar dados', async (status, maxOccupancy) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id, { status, maxOccupancy });
    const before = await snapshot();

    const response = await request(app).delete(`/schools/${school.id}`).expect('Content-Type', /json/).expect(409);

    expect(response.body).toEqual({ message: linkedClassesMessage });
    expect(await snapshot()).toEqual(before);
  });

  it('permite excluir após remover todas as turmas, incluindo encerradas', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const active = await insertClass(school.id);
    const completed = await insertClass(school.id, { status: 'completed' });
    await request(app).delete(`/schools/${school.id}`).expect(409)
      .expect({ message: linkedClassesMessage });
    await db.query('DELETE FROM classes WHERE id = $1', [active.id]);
    await request(app).delete(`/schools/${school.id}`).expect(409)
      .expect({ message: linkedClassesMessage });
    await db.query('DELETE FROM classes WHERE id = $1', [completed.id]);
    await request(app).delete(`/schools/${school.id}`).expect(204);
  });

  it.each([
    ['abc', '"id" deve ser um número inteiro positivo.'],
    ['0', '"id" deve ser um inteiro maior que zero.'],
    ['-1', '"id" deve ser um inteiro maior que zero.'],
    ['1.5', '"id" deve ser um número inteiro, sem casas decimais.'],
    ['2147483648', '"id" deve ser no máximo 2147483647.'],
    ['12abc', '"id" deve ser um número inteiro positivo.'],
  ])('rejeita identificador inválido com mensagem específica e sem excluir: %s', async (id, message) => {
    const sector = await insertSector();
    await insertSchool(sector.id);
    const before = await snapshot();
    const response = await request(app).delete(`/schools/${id}`).expect('Content-Type', /json/).expect(422);
    expect(response.body).toEqual({ message });
    expect(await snapshot()).toEqual(before);
  });

  it('responde 404 para escola inexistente sem alterar registros', async () => {
    const sector = await insertSector();
    await insertSchool(sector.id);
    const before = await snapshot();
    const response = await request(app).delete('/schools/2147483647').expect('Content-Type', /json/).expect(404);
    expect(response.body).toEqual({ message: 'Escola não encontrada' });
    expect(await snapshot()).toEqual(before);
  });

  it.each(['current', 'completed'])('a chave estrangeira bloqueia turma %s inserida após a checagem, com mensagem de conflito', async (status) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const original = SchoolRepository.delete.bind(SchoolRepository);
    let linkedClass;
    jest.spyOn(SchoolRepository, 'delete').mockImplementation(async (id) => {
      linkedClass = await insertClass(id, { status });
      return original(id);
    });

    const response = await request(app).delete(`/schools/${school.id}`).expect('Content-Type', /json/).expect(409);

    expect(response.body).toEqual({ message: linkedClassesMessage });
    const read = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(read.body).toEqual({ ...school, totalCapacity: status === 'current' ? 20 : 0 });
    const classes = await request(app).get(`/schools/${school.id}/classes?status=all`).expect(200);
    expect(classes.body).toEqual([linkedClass]);
  });

  it.each([false, true])('responde falha de exclusão sem presumir ausência; lança erro: %s', async (throwsError) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const before = await snapshot();
    const deletion = jest.spyOn(SchoolRepository, 'delete');
    if (throwsError) deletion.mockRejectedValue(new Error('detalhe interno do banco'));
    else deletion.mockResolvedValue(0);
    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app).delete(`/schools/${school.id}`).expect('Content-Type', /json/).expect(500);

    expect(response.body).toEqual({ message: 'Não foi possível excluir a escola. Tente novamente.' });
    expect(logger).toHaveBeenCalled();
    expect(await snapshot()).toEqual(before);
  });
});
