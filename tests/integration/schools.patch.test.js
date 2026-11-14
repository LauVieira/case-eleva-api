/* global describe, it, expect, jest, afterEach */
const { db, insertSector, insertSchool, insertClass } = require('../auxiliarFunctions');
const request = require('supertest');
const app = require('../../src/app');
const SchoolRepository = require('../../src/repositories/SchoolRepository');

afterEach(() => jest.restoreAllMocks());

async function storedSchool (id) {
  const result = await db.query('SELECT * FROM schools WHERE id = $1', [id]);
  return JSON.parse(JSON.stringify(result.rows[0]));
}

describe('PATCH /schools/:id', () => {
  it('atualiza parcialmente, preserva outros registros e createdAt e renova updatedAt', async () => {
    const sector = await insertSector();
    const oldDate = '2020-01-01T00:00:00.000Z';
    const school = await insertSchool(sector.id, { createdAt: oldDate, updatedAt: oldDate });
    const other = await insertSchool(sector.id);
    const before = Date.now();

    const response = await request(app).patch(`/schools/${school.id}`)
      .send({ address: '  <b>Rua Nova</b>  ' }).expect('Content-Type', /json/).expect(200);

    expect(response.body).toEqual({ ...school, address: 'Rua Nova', updatedAt: expect.any(String) });
    expect(Date.parse(response.body.updatedAt)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(response.body.updatedAt)).toBeLessThanOrEqual(Date.now());
    expect(await storedSchool(school.id)).toEqual(response.body);
    expect(await storedSchool(other.id)).toEqual(other);
    const read = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(read.body).toEqual({ ...response.body, totalCapacity: 0 });
  });

  it('normaliza o nome antes do tamanho, mantém acentos e permite o próprio nome', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id, { name: 'escola são josé' });
    const response = await request(app).patch(`/schools/${school.id}`)
      .send({ name: '  <b>ESCOLA' + ' '.repeat(110) + 'São José</b>  ', headteacher: '  Maria da Silva  ' }).expect(200);
    expect(response.body.name).toBe('escola são josé');
    expect(response.body.headteacher).toBe('Maria da Silva');
    expect(response.body.phone).toBe(school.phone);
  });

  it.each([{ headteacher: null, phone: null }, { headteacher: '' }, { headteacher: '   ' }, { headteacher: '<b></b>' }])(
    'permite limpar opcionais sem apagar campos omitidos: %p', async (changes) => {
      const sector = await insertSector();
      const school = await insertSchool(sector.id);
      const response = await request(app).patch(`/schools/${school.id}`).send(changes).expect(200);
      expect(response.body.headteacher).toBe(null);
      expect(response.body.phone).toBe(changes.phone === null ? null : school.phone);
      expect(await storedSchool(school.id)).toEqual(response.body);
    },
  );

  it('muda de setor, converte o ID e mantém turmas e capacidade', async () => {
    const origin = await insertSector();
    const destination = await insertSector();
    const school = await insertSchool(origin.id);
    const active = await insertClass(school.id, { maxOccupancy: 30 });
    const completed = await insertClass(school.id, { status: 'completed' });

    await request(app).patch(`/schools/${school.id}`).send({ sectorId: String(destination.id) }).expect(200);
    const read = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(read.body).toEqual({ ...school, sectorId: destination.id, updatedAt: expect.any(String), totalCapacity: 30 });
    const classes = await request(app).get(`/schools/${school.id}/classes?status=all`).expect(200);
    expect(classes.body).toEqual([active, completed]);
    const oldListing = await request(app).get(`/sectors/${origin.id}/schools`).expect(200);
    expect(oldListing.body).toEqual([]);
    const newListing = await request(app).get(`/sectors/${destination.id}/schools`).expect(200);
    expect(newListing.body.map((item) => item.id)).toEqual([school.id]);
  });

  it('aceita reenviar o setor e o nome atuais', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await request(app).patch(`/schools/${school.id}`).send({ sectorId: sector.id, name: school.name }).expect(200);
  });

  it.each([true, false])('informa conflito no setor informado, usando o nome resultante; muda setor: %s', async (move) => {
    const origin = await insertSector();
    const destination = move ? await insertSector() : origin;
    const school = await insertSchool(origin.id);
    const duplicate = await insertSchool(destination.id, { name: 'escola central' });
    const response = await request(app).patch(`/schools/${school.id}`)
      .send({ sectorId: destination.id, name: '  ESCOLA   CENTRAL  ', address: 'Não salvar' }).expect(409);
    expect(response.body).toEqual({ message: 'Já existe uma escola com este nome neste setor' });
    expect(await storedSchool(school.id)).toEqual(school);
    expect(await storedSchool(duplicate.id)).toEqual(duplicate);
  });

  it.each([false, true])('mantém unicidade global quando o conflito está fora do destino; envia setor: %s', async (sendSector) => {
    const origin = await insertSector();
    const destination = await insertSector();
    const third = await insertSector();
    const school = await insertSchool(origin.id);
    await insertSchool(third.id, { name: 'escola central' });
    const changes = { name: 'Escola Central' };
    if (sendSector) changes.sectorId = destination.id;
    const response = await request(app).patch(`/schools/${school.id}`).send(changes).expect(409);
    expect(response.body).toEqual({ message: 'Já existe uma escola com este nome' });
    expect(await storedSchool(school.id)).toEqual(school);
  });

  it.each([
    {}, [], { name: null }, { name: '   ' }, { name: '<b></b>' }, { name: 'x'.repeat(101) },
    { address: null }, { address: '   ' }, { address: 'x'.repeat(256) }, { headteacher: 'x'.repeat(151) },
    { phone: '' }, { phone: '(22) 2345-6789' }, { phone: 22998765432 }, { phone: '+5522123' },
    { sectorId: null }, { sectorId: 0 }, { sectorId: -1 }, { sectorId: 1.5 }, { sectorId: 2147483648 },
    { sectorId: 2147483647 }, { id: 1 }, { createdAt: '2020-01-01' }, { updatedAt: '2020-01-01' },
    { totalCapacity: 100 }, { unexpected: true },
  ])('rejeita alterações inválidas sem gravar: %p', async (changes) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const response = await request(app).patch(`/schools/${school.id}`)
      .set('Content-Type', 'application/json').send(JSON.stringify(changes)).expect(422);
    expect(response.type).toBe('application/json');
    expect(response.body.message).toEqual(expect.any(String));
    expect(await storedSchool(school.id)).toEqual(school);
  });

  it('valida também os campos mantidos no estado resultante antes de gravar', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id, { address: '' });
    const response = await request(app).patch(`/schools/${school.id}`).send({ headteacher: 'Maria' }).expect(422);
    expect(response.body.message).toContain('address');
    expect(await storedSchool(school.id)).toEqual(school);
  });

  it.each(['abc', '0', '-1', '1.5', '2147483648'])('rejeita identificador inválido: %s', async (id) => {
    const response = await request(app).patch(`/schools/${id}`).send({ address: 'Rua Nova' }).expect(422);
    expect(response.body.message).toContain('id');
  });

  it('retorna 404 para escola inexistente', async () => {
    const response = await request(app).patch('/schools/2147483647').send({ address: 'Rua Nova' }).expect(404);
    expect(response.body).toEqual({ message: 'Escola não encontrada' });
  });

  it.each([false, true])('retorna mensagem de falha na atualização sem presumir ausência; lança erro: %s', async (throwsError) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const update = jest.spyOn(SchoolRepository, 'update');
    if (throwsError) update.mockRejectedValue(new Error('detalhe interno do banco'));
    else update.mockResolvedValue(null);
    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app).patch(`/schools/${school.id}`)
      .send({ address: 'Rua Nova' }).expect('Content-Type', /json/).expect(500);

    expect(response.body).toEqual({ message: 'Não foi possível atualizar a escola. Tente novamente.' });
    expect(logger).toHaveBeenCalled();
    expect(await storedSchool(school.id)).toEqual(school);
  });

  it.each(['{', 'null', '42', '"texto"'])('retorna 400 para JSON malformado ou primitivo sem alterar a escola: %s', async (body) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await request(app).patch(`/schools/${school.id}`).set('Content-Type', 'application/json').send(body).expect(400);
    expect(await storedSchool(school.id)).toEqual(school);
  });

  it.each([false, true])('traduz conflitos concorrentes do banco; envia setor: %s', async (sendSector) => {
    const origin = await insertSector();
    const destination = await insertSector();
    const first = await insertSchool(origin.id);
    const second = await insertSchool(origin.id);
    const original = SchoolRepository.update.bind(SchoolRepository);
    let arrivals = 0;
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    jest.spyOn(SchoolRepository, 'update').mockImplementation(async (...args) => {
      arrivals += 1;
      if (arrivals === 2) release();
      await gate;
      return original(...args);
    });
    const changes = { name: 'escola concorrente' };
    if (sendSector) changes.sectorId = destination.id;
    const responses = await Promise.all([first, second].map((school) =>
      request(app).patch(`/schools/${school.id}`).send(changes)));
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const conflict = responses.find((response) => response.status === 409);
    expect(conflict.body.message).toBe(sendSector
      ? 'Já existe uma escola com este nome neste setor' : 'Já existe uma escola com este nome');
    for (let index = 0; index < responses.length; index += 1) {
      const previous = [first, second][index];
      expect(await storedSchool(previous.id)).toEqual(responses[index].status === 200 ? responses[index].body : previous);
    }
  });
});
