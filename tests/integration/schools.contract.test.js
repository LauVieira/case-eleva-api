/* global describe, it, expect, jest, afterEach */
const { db, insertSector, insertSchool, schoolBody } = require('../auxiliarFunctions');
const request = require('supertest');
const app = require('../../src/app');
const schema = require('../../src/schemas/schoolSchema');
afterEach(() => jest.restoreAllMocks());

describe('Cadastro: contrato dos campos e identificadores', () => {
  it.each([{}, { headteacher: null, phone: null }, { headteacher: '   ', phone: null }])(
    'permite diretor e telefone opcionais: %p', async (optional) => {
      const sector = await insertSector();
      const body = schoolBody(sector.id, { phone: '+5522998765432', ...optional });
      if (Object.keys(optional).length === 0) { delete body.headteacher; delete body.phone; }
      const response = await request(app).post('/schools').send(body);
      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({ headteacher: null, phone: null }));
      const stored = await db.query('SELECT headteacher, phone FROM schools');
      expect(stored.rows).toEqual([{ headteacher: null, phone: null }]);
    },
  );
  it.each([['name', 100], ['address', 255], ['headteacher', 150]])(
    'aceita o limite exato de %s (%s)', async (field, limit) => {
      const sector = await insertSector();
      const value = 'a'.repeat(limit);
      const response = await request(app).post('/schools').send(schoolBody(sector.id, { phone: '+5522998765432', [field]: value }));
      expect(response.status).toBe(201);
      expect(response.body[field]).toBe(value);
    },
  );
  it.each([['name', 'a'.repeat(101)], ['address', 'a'.repeat(256)], ['headteacher', 'a'.repeat(151)], ['phone', ''], ['phone', '(22) 2345-6789'], ['phone', 22998765432], ['phone', '+5522123'], ['sectorId', 0], ['sectorId', -1], ['sectorId', 1.5], ['sectorId', 2147483648], ['sectorId', '12abc'], ['sectorId', '1.5'], ['sectorId', '2147483648']])(
    'rejeita %s inválido sem gravar: %p', async (field, value) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const sector = await insertSector();
      const response = await request(app).post('/schools').send(schoolBody(sector.id, { phone: '+5522998765432', [field]: value }));
      expect(response.status).toBe(422);
      expect(response.body.message).toContain(field);
      expect((await db.query('SELECT id FROM schools')).rows).toEqual([]);
    },
  );
  it.each(['+552223456789', '+5522998765432'])('aceita telefone canônico %s', async (phone) => {
    const sector = await insertSector();
    const response = await request(app).post('/schools').send(schoolBody(sector.id, { phone }));
    expect(response.status).toBe(201);
    expect(response.body.phone).toBe(phone);
  });
  it('Joi retorna o ID convertido sem modificar o objeto recebido', () => {
    const body = schoolBody('1', { phone: '+5522998765432' });
    const result = schema.post.validate(body);
    expect(result.error).toBeUndefined();
    expect(result.value.sectorId).toBe(1);
    expect(body.sectorId).toBe('1');
  });
  it.each(['', '.0', 'e0'])('converte sectorId numérico no cadastro: sufixo %p', async (suffix) => {
    const sector = await insertSector();
    const response = await request(app).post('/schools').send(schoolBody(`${sector.id}${suffix}`)).expect(201);
    expect(response.body.sectorId).toBe(sector.id);
    expect((await db.query('SELECT "sectorId" FROM schools')).rows).toEqual([{ sectorId: sector.id }]);
  });
  it.each(['', '.0', 'e0'])('valida e converte os IDs nas três consultas: sufixo %p', async (suffix) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await request(app).get(`/schools/${school.id}${suffix}`).expect(200);
    await request(app).get(`/schools/${school.id}${suffix}/classes`).expect(200);
    await request(app).get(`/sectors/${sector.id}${suffix}/schools`).expect(200);
  });
  it.each(['/schools/abc', '/schools/0', '/schools/-1', '/schools/1.5', '/schools/2147483648', '/schools/12abc', '/schools/abc/classes', '/sectors/abc/schools'])(
    'rejeita identificador inválido em %s antes da consulta', async (url) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const response = await request(app).get(url);
      expect(response.status).toBe(422);
      expect(response.body.message).toContain('id');
    },
  );
  it.each(['/schools/2147483647', '/schools/2147483647/classes', '/sectors/2147483647/schools'])(
    'mantém 404 para identificador positivo inexistente em %s', async (url) => {
      expect((await request(app).get(url)).status).toBe(404);
    },
  );
});
