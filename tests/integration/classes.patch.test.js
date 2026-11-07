/* global describe, it, expect, jest, afterEach */
const { db, insertSector, insertSchool, insertClass } = require('../auxiliarFunctions');
const request = require('supertest');
const app = require('../../src/app');
const ClassRepository = require('../../src/repositories/ClassRepository');

afterEach(() => jest.restoreAllMocks());

const conflictMessage = 'Já existe uma turma ativa com este nome nesta escola. Informe outro nome.';
const optionMessages = {
  segment: '"segment" deve ser uma das opções: [Educação Infantil — Creche, Educação Infantil — Pré-escola, Ensino Fundamental, Ensino Médio].',
  shift: '"shift" deve ser uma das opções: [Matutino, Vespertino, Noturno, Integral].',
  status: '"status" deve ser uma das opções: [current, completed].',
};

async function storedClasses () {
  const result = await db.query('SELECT * FROM classes ORDER BY id');
  return JSON.parse(JSON.stringify(result.rows));
}

describe('PATCH /classes/:id', () => {
  it('atualiza parcialmente, preserva vínculo, outros registros e criação, e renova updatedAt', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const oldDate = '2020-01-01T00:00:00.000Z';
    const classRecord = await insertClass(school.id, { createdAt: oldDate, updatedAt: oldDate });
    const other = await insertClass(school.id);
    const before = Date.now();

    const response = await request(app).patch(`/classes/${classRecord.id}`)
      .send({ shift: '  <b>Noturno</b>  ' }).expect('Content-Type', /json/).expect(200);

    expect(response.body).toEqual({ ...classRecord, shift: 'Noturno', updatedAt: expect.any(String) });
    expect(Date.parse(response.body.updatedAt)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(response.body.updatedAt)).toBeLessThanOrEqual(Date.now());
    expect(await storedClasses()).toEqual([response.body, other]);
    const listing = await request(app).get(`/schools/${school.id}/classes`).expect(200);
    expect(listing.body).toEqual([response.body, other]);
  });

  it.each(['current', 'completed'])('normaliza nome antes do tamanho e preserva acentos: %s', async (status) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id, { status });
    const response = await request(app).patch(`/classes/${classRecord.id}`)
      .send({ name: '  <b>TURMA' + ' '.repeat(60) + 'São José</b>  ' }).expect(200);
    expect(response.body).toEqual({ ...classRecord, name: 'turma são josé', updatedAt: expect.any(String) });
    expect(await storedClasses()).toEqual([response.body]);
  });

  it('permite manter o próprio nome ativo e não confunde nomes com acentos distintos', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const first = await insertClass(school.id, { name: 'jose' });
    const second = await insertClass(school.id);
    await request(app).patch(`/classes/${first.id}`).send({ name: ' JOSE ' }).expect(200);
    await request(app).patch(`/classes/${second.id}`).send({ name: 'josé' }).expect(200);
    expect((await storedClasses()).map((item) => item.name)).toEqual(['jose', 'josé']);
  });

  it.each([
    [{ grade: '2º ano' }, { grade: '2º ano' }],
    [{ segment: 'Ensino Médio' }, { segment: 'Ensino Médio' }],
    [{ segment: 'Educação Infantil — Creche', grade: 'Berçário' }, { segment: 'Educação Infantil — Creche', grade: 'Berçário' }],
    [{ segment: 'Educação Infantil — Pré-escola', grade: 'Jardim II' }, { segment: 'Educação Infantil — Pré-escola', grade: 'Jardim II' }],
    [{ name: 'a'.repeat(50), maxOccupancy: 0 }, { name: 'a'.repeat(50), maxOccupancy: 0 }],
    [{ maxOccupancy: 2147483647 }, { maxOccupancy: 2147483647 }],
    [{ maxOccupancy: '25' }, { maxOccupancy: 25 }],
  ])('aceita alteração válida e preserva campos omitidos: %p', async (changes, expected) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id);
    const response = await request(app).patch(`/classes/${classRecord.id}`).send(changes).expect(200);
    expect(response.body).toEqual({ ...classRecord, ...expected, updatedAt: expect.any(String) });
    expect(await storedClasses()).toEqual([response.body]);
  });

  it('encerra e reativa turma, refletindo filtros e capacidade da escola', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id, { maxOccupancy: 30 });
    const completed = await request(app).patch(`/classes/${classRecord.id}`)
      .send({ status: 'completed', maxOccupancy: 40 }).expect(200);
    expect(completed.body.status).toBe('completed');
    const activeListing = await request(app).get(`/schools/${school.id}/classes`).expect(200);
    expect(activeListing.body).toEqual([]);
    const completedListing = await request(app).get(`/schools/${school.id}/classes?status=completed`).expect(200);
    expect(completedListing.body).toEqual([completed.body]);
    const inactiveCapacity = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(inactiveCapacity.body.totalCapacity).toBe(0);

    const active = await request(app).patch(`/classes/${classRecord.id}`).send({ status: 'current' }).expect(200);
    expect(active.body.maxOccupancy).toBe(40);
    const activeCapacity = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(activeCapacity.body.totalCapacity).toBe(40);
    const listing = await request(app).get(`/schools/${school.id}/classes`).expect(200);
    expect(listing.body).toEqual([active.body]);
  });

  it.each([
    { name: ' TURMA   A ' },
    { status: 'current' },
    { name: 'Turma A', status: 'current' },
  ])('bloqueia renomeação ou reativação conflitante sem alterar nada: %p', async (changes) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id, { name: 'turma a' });
    const classRecord = await insertClass(school.id, {
      name: changes.name === undefined ? 'turma a' : 'turma b',
      status: changes.status ? 'completed' : 'current',
    });
    const before = await storedClasses();
    const response = await request(app).patch(`/classes/${classRecord.id}`).send(changes).expect(409);
    expect(response.body).toEqual({ message: conflictMessage });
    expect(await storedClasses()).toEqual(before);
  });

  it('permite encerrar e renomear em uma única edição mesmo existindo ativa homônima', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id, { name: 'turma a' });
    const classRecord = await insertClass(school.id, { name: 'turma b' });
    const response = await request(app).patch(`/classes/${classRecord.id}`)
      .send({ name: ' TURMA A ', status: 'completed' }).expect(200);
    expect(response.body).toEqual({ ...classRecord, name: 'turma a', status: 'completed', updatedAt: expect.any(String) });
  });

  it('permite repetir nome em encerradas e reativar com nome disponível na escola', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const otherSchool = await insertSchool(sector.id);
    await insertClass(school.id, { name: 'turma a' });
    await insertClass(otherSchool.id, { name: 'turma b' });
    const classRecord = await insertClass(school.id, { name: 'turma b', status: 'completed' });
    await request(app).patch(`/classes/${classRecord.id}`).send({ name: 'Turma A' }).expect(200);
    const response = await request(app).patch(`/classes/${classRecord.id}`)
      .send({ name: 'Turma B', status: 'current' }).expect(200);
    expect(response.body.status).toBe('current');
    expect(response.body.name).toBe('turma b');
  });

  it.each(['', '.0', 'e0'])('converte o ID da turma: sufixo %p', async (suffix) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id);
    const response = await request(app).patch(`/classes/${classRecord.id}${suffix}`).send({ shift: 'Integral' }).expect(200);
    expect(response.body.id).toBe(classRecord.id);
  });

  it.each([
    ['name', null, '"name" deve ser informado como texto.'],
    ['name', '   ', '"name" não pode ficar vazio. Informe um texto.'],
    ['name', '<b></b>', '"name" não pode ficar vazio. Informe um texto.'],
    ['name', 'a'.repeat(51), '"name" deve ter no máximo 50 caracteres.'],
    ['grade', null, '"grade" deve ser informado como texto.'],
    ['grade', '', '"grade" não pode ficar vazio. Informe um texto.'],
    ['segment', 'Ensino Fundamental I', optionMessages.segment],
    ['segment', null, optionMessages.segment],
    ['shift', 'Manhã', optionMessages.shift],
    ['shift', null, optionMessages.shift],
    ['status', 'active', optionMessages.status],
    ['status', null, optionMessages.status],
    ['maxOccupancy', null, '"maxOccupancy" deve ser um número inteiro maior ou igual a zero.'],
    ['maxOccupancy', false, '"maxOccupancy" deve ser um número inteiro maior ou igual a zero.'],
    ['maxOccupancy', -1, '"maxOccupancy" deve ser um inteiro maior ou igual a zero.'],
    ['maxOccupancy', 1.5, '"maxOccupancy" deve ser um número inteiro, sem casas decimais.'],
    ['maxOccupancy', 2147483648, '"maxOccupancy" deve ser no máximo 2147483647.'],
    ['maxOccupancy', '12abc', '"maxOccupancy" deve ser um número inteiro maior ou igual a zero.'],
  ])('rejeita %s inválido com mensagem específica e sem alterar: %p', async (field, value, message) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id);
    const classRecord = await insertClass(school.id);
    const before = await storedClasses();
    const response = await request(app).patch(`/classes/${classRecord.id}`)
      .send({ name: 'nova turma', [field]: value }).expect('Content-Type', /json/).expect(422);
    expect(response.body).toEqual({ message });
    expect(await storedClasses()).toEqual(before);
  });

  it.each([
    [{}, 'Informe pelo menos um campo da turma para atualizar.'],
    [[], 'O corpo da requisição deve ser um objeto com os campos da turma.'],
  ])('rejeita corpo inválido com orientação e sem alterar: %p', async (body, message) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id);
    const classRecord = await insertClass(school.id);
    const before = await storedClasses();
    const response = await request(app).patch(`/classes/${classRecord.id}`).send(body).expect(422);
    expect(response.body).toEqual({ message });
    expect(await storedClasses()).toEqual(before);
  });

  it.each(['schoolId', 'id', 'createdAt', 'updatedAt', 'unexpected'])('rejeita campo imutável ou desconhecido: %s', async (field) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const destination = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id);
    const response = await request(app).patch(`/classes/${classRecord.id}`)
      .send({ [field]: destination.id }).expect(422);
    expect(response.body).toEqual({ message: `"${field}" não é permitido. Remova este campo da requisição.` });
    expect(await storedClasses()).toEqual([classRecord]);
  });

  it('rejeita schoolId mesmo quando repete o vínculo atual', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id);
    const response = await request(app).patch(`/classes/${classRecord.id}`).send({ schoolId: school.id }).expect(422);
    expect(response.body).toEqual({ message: '"schoolId" não é permitido. Remova este campo da requisição.' });
    expect(await storedClasses()).toEqual([classRecord]);
  });

  it('rejeita segmento incompatível com grade mantida, sem escolher outro ano automaticamente', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id, { grade: '9º ano' });
    const response = await request(app).patch(`/classes/${classRecord.id}`).send({ segment: 'Ensino Médio' }).expect(422);
    expect(response.body).toEqual({
      message: '"grade" deve pertencer ao segmento "Ensino Médio". Informe uma das opções: 1º ano, 2º ano, 3º ano.',
    });
    expect(await storedClasses()).toEqual([classRecord]);
  });

  it('rejeita grade incompatível com segmento mantido', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id, { segment: 'Educação Infantil — Creche', grade: 'Maternal I' });
    const response = await request(app).patch(`/classes/${classRecord.id}`).send({ grade: 'Jardim I' }).expect(422);
    expect(response.body).toEqual({
      message: '"grade" deve pertencer ao segmento "Educação Infantil — Creche". Informe uma das opções: Berçário, Maternal I, Maternal II.',
    });
    expect(await storedClasses()).toEqual([classRecord]);
  });

  it('valida também os campos mantidos do estado resultante completo', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id, { shift: 'Manhã' });
    const response = await request(app).patch(`/classes/${classRecord.id}`).send({ name: 'nova turma' }).expect(422);
    expect(response.body).toEqual({ message: optionMessages.shift });
    expect(await storedClasses()).toEqual([classRecord]);
  });

  it.each([
    ['abc', '"id" deve ser um número inteiro positivo.'],
    ['0', '"id" deve ser um inteiro maior que zero.'],
    ['-1', '"id" deve ser um inteiro maior que zero.'],
    ['1.5', '"id" deve ser um número inteiro, sem casas decimais.'],
    ['2147483648', '"id" deve ser no máximo 2147483647.'],
  ])('rejeita ID inválido com mensagem específica: %s', async (id, message) => {
    const response = await request(app).patch(`/classes/${id}`).send({ name: 'turma a' }).expect(422);
    expect(response.body).toEqual({ message });
    expect(await storedClasses()).toEqual([]);
  });

  it('responde 404 para turma inexistente', async () => {
    const response = await request(app).patch('/classes/2147483647').send({ name: 'turma a' }).expect(404);
    expect(response.body).toEqual({ message: 'Turma não encontrada' });
    expect(await storedClasses()).toEqual([]);
  });

  it.each(['{', 'null', '42'])('rejeita JSON malformado ou primitivo sem alterar: %s', async (body) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id);
    const response = await request(app).patch(`/classes/${classRecord.id}`)
      .set('Content-Type', 'application/json').send(body).expect(400);
    expect(response.body).toEqual({ message: 'JSON inválido. Corrija o corpo da requisição e tente novamente.' });
    expect(await storedClasses()).toEqual([classRecord]);
  });

  it.each([false, true])('traduz conflito concorrente do banco sem alterar a turma rejeitada; reativa: %s', async (reactivate) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const first = await insertClass(school.id, reactivate ? { name: 'turma a', status: 'completed' } : {});
    const second = await insertClass(school.id, reactivate ? { name: 'turma a', status: 'completed' } : {});
    const original = ClassRepository.update.bind(ClassRepository);
    let arrivals = 0;
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    jest.spyOn(ClassRepository, 'update').mockImplementation(async (...args) => {
      arrivals += 1;
      if (arrivals === 2) release();
      await gate;
      return original(...args);
    });
    const changes = reactivate ? { status: 'current' } : { name: 'turma a' };
    const responses = await Promise.all([first, second].map((item) =>
      request(app).patch(`/classes/${item.id}`).send(changes)));
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(responses.find((response) => response.status === 409).body).toEqual({ message: conflictMessage });
    expect(await storedClasses()).toEqual([first, second].map((previous, index) =>
      responses[index].status === 200 ? responses[index].body : previous));
  });

  it.each([false, true])('responde falha de atualização sem presumir turma inexistente; lança erro: %s', async (throwsError) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const classRecord = await insertClass(school.id);
    const update = jest.spyOn(ClassRepository, 'update');
    if (throwsError) update.mockRejectedValue(new Error('detalhe interno do banco'));
    else update.mockResolvedValue(null);
    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app).patch(`/classes/${classRecord.id}`)
      .send({ name: 'nova turma' }).expect('Content-Type', /json/).expect(500);
    expect(response.body).toEqual({ message: 'Não foi possível atualizar a turma. Tente novamente.' });
    expect(logger).toHaveBeenCalled();
    expect(await storedClasses()).toEqual([classRecord]);
  });
});
