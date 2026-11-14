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

function classBody (overrides = {}) {
  return {
    name: 'turma a', segment: 'Ensino Fundamental', grade: '1º ano',
    shift: 'Matutino', status: 'current', maxOccupancy: 20, ...overrides,
  };
}

async function storedClasses () {
  const result = await db.query('SELECT * FROM classes ORDER BY id');
  return JSON.parse(JSON.stringify(result.rows));
}

describe('POST /schools/:id/classes', () => {
  it('cria uma turma na escola da URL, persiste datas e reflete listagem e capacidade', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const other = await insertSchool(sector.id);
    const before = Date.now();

    const response = await request(app).post(`/schools/${school.id}/classes`)
      .send(classBody()).expect('Content-Type', /json/).expect(201);

    expect(response.body).toEqual({
      ...classBody(), schoolId: school.id, id: expect.any(Number),
      createdAt: expect.any(String), updatedAt: expect.any(String),
    });
    expect(Date.parse(response.body.createdAt)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(response.body.updatedAt)).toBeGreaterThanOrEqual(Date.parse(response.body.createdAt));
    expect(Date.parse(response.body.updatedAt)).toBeLessThanOrEqual(Date.now());
    expect(await storedClasses()).toEqual([response.body]);
    const listing = await request(app).get(`/schools/${school.id}/classes`).expect(200);
    expect(listing.body).toEqual([response.body]);
    const otherListing = await request(app).get(`/schools/${other.id}/classes`).expect(200);
    expect(otherListing.body).toEqual([]);
    const details = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(details.body.totalCapacity).toBe(20);
  });

  it.each(['current', 'completed'])('sanitiza e normaliza o nome antes do tamanho, preservando acentos: %s', async (status) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const response = await request(app).post(`/schools/${school.id}/classes`).send(classBody({
      name: '  <b>TURMA' + ' '.repeat(60) + 'São José</b>  ',
      segment: ' <b>Ensino Fundamental</b> ', grade: ' <i>1º ano</i> ', shift: ' <b>Matutino</b> ', status,
    })).expect(201);
    expect(response.body).toEqual(expect.objectContaining({
      name: 'turma são josé', segment: 'Ensino Fundamental', grade: '1º ano', shift: 'Matutino', status,
    }));
    expect(await storedClasses()).toEqual([response.body]);
  });

  const grades = [
    ['Educação Infantil — Creche', 'Berçário'], ['Educação Infantil — Creche', 'Maternal I'],
    ['Educação Infantil — Creche', 'Maternal II'], ['Educação Infantil — Pré-escola', 'Jardim I'],
    ['Educação Infantil — Pré-escola', 'Jardim II'],
    ...['1º ano', '2º ano', '3º ano', '4º ano', '5º ano', '6º ano', '7º ano', '8º ano', '9º ano']
      .map((grade) => ['Ensino Fundamental', grade]),
    ...['1º ano', '2º ano', '3º ano'].map((grade) => ['Ensino Médio', grade]),
  ];

  it.each(grades)('aceita a combinação de segmento e grupo/ano: %s, %s', async (segment, grade) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const response = await request(app).post(`/schools/${school.id}/classes`)
      .send(classBody({ segment, grade })).expect(201);
    expect(response.body).toEqual(expect.objectContaining({ segment, grade }));
  });

  it.each(['Matutino', 'Vespertino', 'Noturno', 'Integral'])('aceita turno %s', async (shift) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const response = await request(app).post(`/schools/${school.id}/classes`).send(classBody({ shift })).expect(201);
    expect(response.body.shift).toBe(shift);
  });

  it.each([0, 2147483647])('aceita capacidade nos limites técnicos: %s', async (maxOccupancy) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const response = await request(app).post(`/schools/${school.id}/classes`)
      .send(classBody({ name: 'a'.repeat(50), maxOccupancy })).expect(201);
    expect(response.body.name).toBe('a'.repeat(50));
    expect(response.body.maxOccupancy).toBe(maxOccupancy);
  });

  it.each(['', '.0', 'e0'])('converte o ID da escola na URL: sufixo %p', async (suffix) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const response = await request(app).post(`/schools/${school.id}${suffix}/classes`).send(classBody()).expect(201);
    expect(response.body.schoolId).toBe(school.id);
  });

  it('permite encerradas homônimas, ativa após encerradas e mesmo nome em outra escola', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const other = await insertSchool(sector.id);
    for (const status of ['completed', 'completed', 'current', 'completed']) {
      await request(app).post(`/schools/${school.id}/classes`).send(classBody({ status })).expect(201);
    }
    await request(app).post(`/schools/${other.id}/classes`).send(classBody()).expect(201);
    expect(await storedClasses()).toHaveLength(5);
    const active = await request(app).get(`/schools/${school.id}/classes`).expect(200);
    expect(active.body).toHaveLength(1);
    const completed = await request(app).get(`/schools/${school.id}/classes?status=completed`).expect(200);
    expect(completed.body).toHaveLength(3);
    const details = await request(app).get(`/schools/${school.id}`).expect(200);
    expect(details.body.totalCapacity).toBe(20);
  });

  it('preserva acentos na comparação de nomes', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    for (const name of ['jose', 'josé']) {
      await request(app).post(`/schools/${school.id}/classes`).send(classBody({ name })).expect(201);
    }
    expect((await storedClasses()).map((item) => item.name)).toEqual(['jose', 'josé']);
  });

  it.each(['turma a', ' TURMA   A ', '<b>Turma A</b>'])('rejeita ativa homônima sem alterar dados: %s', async (name) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const existing = await insertClass(school.id, { name: 'turma a' });
    const response = await request(app).post(`/schools/${school.id}/classes`).send(classBody({ name })).expect(409);
    expect(response.body).toEqual({ message: conflictMessage });
    expect(await storedClasses()).toEqual([existing]);
  });

  const fields = ['name', 'segment', 'grade', 'shift', 'status', 'maxOccupancy'];
  const invalidRequired = fields.flatMap((field) => [
    [field, undefined, `"${field}" é obrigatório. Informe um valor.`],
    [field, null, field === 'maxOccupancy'
      ? '"maxOccupancy" deve ser um número inteiro maior ou igual a zero.' : optionMessages[field] || `"${field}" deve ser informado como texto.`],
    [field, false, field === 'maxOccupancy'
      ? '"maxOccupancy" deve ser um número inteiro maior ou igual a zero.' : optionMessages[field] || `"${field}" deve ser informado como texto.`],
  ]);

  it.each([
    ...invalidRequired,
    ['name', '   ', '"name" não pode ficar vazio. Informe um texto.'],
    ['name', '<b></b>', '"name" não pode ficar vazio. Informe um texto.'],
    ['name', 'a'.repeat(51), '"name" deve ter no máximo 50 caracteres.'],
    ['grade', '', '"grade" não pode ficar vazio. Informe um texto.'],
    ['maxOccupancy', -1, '"maxOccupancy" deve ser um inteiro maior ou igual a zero.'],
    ['maxOccupancy', 1.5, '"maxOccupancy" deve ser um número inteiro, sem casas decimais.'],
    ['maxOccupancy', 2147483648, '"maxOccupancy" deve ser no máximo 2147483647.'],
    ['maxOccupancy', '12abc', '"maxOccupancy" deve ser um número inteiro maior ou igual a zero.'],
    ['maxOccupancy', '9007199254740993', '"maxOccupancy" excede o limite numérico permitido. Informe um inteiro até 2147483647.'],
  ])('rejeita %s inválido com mensagem específica e sem gravação: %p', async (field, value, message) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const response = await request(app).post(`/schools/${school.id}/classes`)
      .send(classBody({ [field]: value })).expect('Content-Type', /json/).expect(422);
    expect(response.body).toEqual({ message });
    expect(await storedClasses()).toEqual([]);
  });

  it.each([
    ['segment', 'Ensino Fundamental I', optionMessages.segment],
    ['shift', 'Manhã', optionMessages.shift],
    ['status', 'active', optionMessages.status],
    ['grade', '9º ano', '"grade" deve pertencer ao segmento "Ensino Médio". Informe uma das opções: 1º ano, 2º ano, 3º ano.'],
  ])('rejeita opção ou combinação inválida de %s', async (field, value, message) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const response = await request(app).post(`/schools/${school.id}/classes`)
      .send(classBody({ segment: 'Ensino Médio', [field]: value })).expect(422);
    expect(response.body).toEqual({ message });
    expect(await storedClasses()).toEqual([]);
  });

  it.each(['schoolId', 'id', 'createdAt', 'updatedAt', 'unexpected'])('rejeita campo gerenciado ou desconhecido: %s', async (field) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const response = await request(app).post(`/schools/${school.id}/classes`)
      .send(classBody({ [field]: school.id })).expect(422);
    expect(response.body).toEqual({ message: `"${field}" não é permitido. Remova este campo da requisição.` });
    expect(await storedClasses()).toEqual([]);
  });

  it('rejeita corpo em array com orientação da entidade correta', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const response = await request(app).post(`/schools/${school.id}/classes`).send([]).expect(422);
    expect(response.body).toEqual({ message: 'O corpo da requisição deve ser um objeto com os campos da turma.' });
    expect(await storedClasses()).toEqual([]);
  });

  it.each([
    ['abc', '"id" deve ser um número inteiro positivo.'],
    ['0', '"id" deve ser um inteiro maior que zero.'],
    ['-1', '"id" deve ser um inteiro maior que zero.'],
    ['1.5', '"id" deve ser um número inteiro, sem casas decimais.'],
    ['2147483648', '"id" deve ser no máximo 2147483647.'],
  ])('rejeita ID inválido com mensagem específica: %s', async (id, message) => {
    const response = await request(app).post(`/schools/${id}/classes`).send(classBody()).expect(422);
    expect(response.body).toEqual({ message });
    expect(await storedClasses()).toEqual([]);
  });

  it('rejeita escola inexistente com 404 e sem gravação', async () => {
    const response = await request(app).post('/schools/2147483647/classes').send(classBody()).expect(404);
    expect(response.body).toEqual({ message: 'Escola não encontrada' });
    expect(await storedClasses()).toEqual([]);
  });

  it.each(['{', 'null', '42'])('rejeita JSON malformado ou primitivo: %s', async (body) => {
    const response = await request(app).post('/schools/1/classes')
      .set('Content-Type', 'application/json').send(body).expect(400);
    expect(response.body).toEqual({ message: 'JSON inválido. Corrija o corpo da requisição e tente novamente.' });
    expect(await storedClasses()).toEqual([]);
  });

  it('traduz conflito concorrente do índice real em 409', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const original = ClassRepository.create.bind(ClassRepository);
    let arrivals = 0;
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    jest.spyOn(ClassRepository, 'create').mockImplementation(async (data) => {
      arrivals += 1;
      if (arrivals === 2) release();
      await gate;
      return original(data);
    });
    const responses = await Promise.all([1, 2].map(() => request(app)
      .post(`/schools/${school.id}/classes`).send(classBody())));
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(responses.find((response) => response.status === 409).body).toEqual({ message: conflictMessage });
    expect(await storedClasses()).toEqual([responses.find((response) => response.status === 201).body]);
  });

  it('traduz a chave estrangeira se a escola desaparecer após a consulta', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const original = ClassRepository.create.bind(ClassRepository);
    jest.spyOn(ClassRepository, 'create').mockImplementation(async (data) => {
      await db.query('DELETE FROM schools WHERE id = $1', [school.id]);
      return original(data);
    });
    const response = await request(app).post(`/schools/${school.id}/classes`).send(classBody()).expect(404);
    expect(response.body).toEqual({ message: 'Escola não encontrada' });
    expect(await storedClasses()).toEqual([]);
  });

  it('retorna erro seguro quando a gravação falha sem presumir escola inexistente', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const error = new Error('detalhe interno do banco');
    jest.spyOn(ClassRepository, 'create').mockRejectedValue(error);
    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app).post(`/schools/${school.id}/classes`).send(classBody()).expect(500);
    expect(response.body).toEqual({ message: 'Erro interno no servidor. Tente novamente mais tarde.' });
    expect(logger).toHaveBeenCalledWith(error);
    expect(await storedClasses()).toEqual([]);
  });
});
