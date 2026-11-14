/* global describe, it, expect */
const { db, insertSector, insertSchool, insertClass } = require('../auxiliarFunctions');
const request = require('supertest');
const app = require('../../src/app');

async function snapshot () {
  const classes = await db.query('SELECT * FROM classes ORDER BY id');
  const schools = await db.query('SELECT * FROM schools ORDER BY id');
  const sectors = await db.query('SELECT * FROM sectors ORDER BY id');
  return { classes: classes.rows, schools: schools.rows, sectors: sectors.rows };
}

const unknownFieldMessage = '"__proto__" não é permitido. Remova este campo da requisição.';
const rawBody = (fields, nested) => JSON.stringify({ ...fields, ['__proto__']: nested });

describe('Rejeição de campos desconhecidos após sanitização — REV-02-BE-A001', () => {
  it('PATCH de escola rejeita __proto__ sem mudar o setor nem outros campos', async () => {
    const origin = await insertSector();
    const destination = await insertSector();
    const school = await insertSchool(origin.id);
    await insertClass(school.id);
    const before = await snapshot();

    const response = await request(app).patch(`/schools/${school.id}`)
      .set('Content-Type', 'application/json')
      .send(rawBody({ address: 'Rua que não deve ser salva' }, { sectorId: destination.id }));

    expect(response.status).toBe(422);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({ message: unknownFieldMessage });
    expect(await snapshot()).toEqual(before);
  });

  it('cadastro de turma não obtém os campos obrigatórios de dentro de __proto__', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const before = await snapshot();

    const response = await request(app).post(`/schools/${school.id}/classes`)
      .set('Content-Type', 'application/json').send(rawBody({}, {
        name: 'turma a', segment: 'Ensino Fundamental', grade: '1º ano',
        shift: 'Matutino', status: 'current', maxOccupancy: 20,
      }));

    expect(response.status).toBe(422);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({ message: '"name" é obrigatório. Informe um valor.' });
    expect(await snapshot()).toEqual(before);
  });

  it('cadastro de turma com campos válidos também rejeita a chave __proto__', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const before = await snapshot();

    const response = await request(app).post(`/schools/${school.id}/classes`)
      .set('Content-Type', 'application/json').send(rawBody({
        name: 'turma a', segment: 'Ensino Fundamental', grade: '1º ano',
        shift: 'Matutino', status: 'current', maxOccupancy: 20,
      }, { status: 'completed' }));

    expect(response.status).toBe(422);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({ message: unknownFieldMessage });
    expect(await snapshot()).toEqual(before);
  });

  it('PATCH de turma rejeita __proto__ sem alterar situação, capacidade ou datas', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const current = await insertClass(school.id);
    const before = await snapshot();

    const response = await request(app).patch(`/classes/${current.id}`)
      .set('Content-Type', 'application/json').send(rawBody({}, { status: 'completed', maxOccupancy: 0 }));

    expect(response.status).toBe(422);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({ message: unknownFieldMessage });
    expect(await snapshot()).toEqual(before);
  });
});
