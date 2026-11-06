/* global it, describe, expect, jest, afterEach */

const { db, insertSector, insertSchool, insertClass, schoolBody } = require('../auxiliarFunctions');
const supertest = require('supertest');
const app = require('../../src/app');

const agent = supertest(app);
afterEach(() => jest.restoreAllMocks());

async function expectNoSchools () {
  const result = await db.query('SELECT * FROM schools');
  expect(result.rows).toEqual([]);
}

describe('GET /schools/:id', () => {
  it('returns exactly the requested school and its current fields', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertSchool(sector.id);
    await insertClass(school.id);

    const response = await agent.get(`/schools/${school.id}`)
      .expect('Content-Type', /json/).expect(200);
    expect(response.body).toEqual(school);
  });

  it.each(['/schools/-1', '/schools/-1/classes'])(
    'returns the current 404 JSON message for %s', async (url) => {
      const response = await agent.get(url).expect('Content-Type', /json/).expect(404);
      expect(response.body).toEqual({ message: 'Escola não encontrada' });
    },
  );

  it.each(['/schools/abc', '/schools/abc/classes'])(
    'currently returns a generic HTML 500 for %s', async (url) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const response = await agent.get(url).expect('Content-Type', /html/).expect(500);
      expect(response.text).toBe('Erro interno no servidor');
    },
  );
});

describe('POST /schools', () => {
  it('persists the school and timestamps and returns the same representation on GET and listing', async () => {
    const sector = await insertSector();
    const body = schoolBody(sector.id);
    const before = Date.now();
    
    const response = await agent.post('/schools').send(body)
      .expect('Content-Type', /json/).expect(201);
    expect(response.body).toEqual({
      ...body,
      id: expect.any(Number),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    
    const { id, createdAt, updatedAt } = response.body;
    expect(new Date(createdAt).toISOString()).toBe(createdAt);
    expect(Date.parse(createdAt)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(updatedAt)).toBeGreaterThanOrEqual(Date.parse(createdAt));
    expect(Date.parse(updatedAt)).toBeLessThanOrEqual(Date.now());

    const stored = await db.query('SELECT * FROM schools WHERE id = $1', [id]);
    expect(JSON.parse(JSON.stringify(stored.rows))).toEqual([response.body]);
    
    const read = await agent.get(`/schools/${id}`).expect(200);
    expect(read.body).toEqual(response.body);
    
    const listing = await agent.get(`/sectors/${sector.id}/schools`).expect(200);
    expect(listing.body).toEqual([response.body]);
  });

  const invalidFields = ['sectorId', 'name', 'address', 'headteacher', 'phone'];
  const invalidCases = invalidFields.flatMap((field) => [
    [field, 'missing', undefined], [field, 'null', null], [field, 'boolean', false],
    [field, 'object', {}], [field, 'array', []], [field, 'empty', ''],
    [field, 'wrong type', field === 'sectorId' ? 'abc' : 123],
  ]);

  it.each(invalidCases)('rejects %s (%s) with JSON 422 and no write', async (field, label, value) => {
    const sector = await insertSector();
    const body = schoolBody(sector.id, { [field]: value });
    
    const response = await agent.post('/schools').send(body)
      .expect('Content-Type', /json/).expect(422);
    expect(response.body).toEqual({ message: 'Não foi possível processar o formato dos dados' });
    
    await expectNoSchools();
  });

  it.each(['id', 'createdAt', 'updatedAt', 'unexpected'])(
    'rejects an unknown or server-managed field: %s', async (field) => {
      const sector = await insertSector();
      const response = await agent.post('/schools').send(schoolBody(sector.id, { [field]: 1 }))
        .expect('Content-Type', /json/).expect(422);
      expect(response.body).toEqual({ message: 'Não foi possível processar o formato dos dados' });
      
      await expectNoSchools();
    },
  );

  it('validates before checking duplicate names', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    
    const response = await agent.post('/schools').send(schoolBody(sector.id, {
      name: school.name, phone: null,
    })).expect(422);
    expect(response.body).toEqual({ message: 'Não foi possível processar o formato dos dados' });
    
    const stored = await db.query('SELECT * FROM schools');
    expect(JSON.parse(JSON.stringify(stored.rows))).toEqual([school]);
  });

  it('rejects an exact duplicate in another sector without changing the original', async () => {
    const sector = await insertSector();
    const otherSector = await insertSector();
    const school = await insertSchool(sector.id);
    
    const response = await agent.post('/schools').send(schoolBody(otherSector.id, { name: school.name }))
      .expect('Content-Type', /json/).expect(409);
    expect(response.body).toEqual({ message: 'Já existe uma escola com este nome' });
    
    const stored = await db.query('SELECT * FROM schools');
    expect(JSON.parse(JSON.stringify(stored.rows))).toEqual([school]);
  });

  it('rejects a duplicate created through the API in the same sector', async () => {
    const sector = await insertSector();
    const body = schoolBody(sector.id);
    const first = await agent.post('/schools').send(body).expect(201);
    const duplicate = await agent.post('/schools').send(body).expect(409);
    
    expect(duplicate.body).toEqual({ message: 'Já existe uma escola com este nome' });
    
    const stored = await db.query('SELECT * FROM schools');
    expect(JSON.parse(JSON.stringify(stored.rows))).toEqual([first.body]);
  });

  it('currently treats names with different case or internal spacing as distinct', async () => {
    const sector = await insertSector();
    for (const name of ['Escola Case', 'escola case', 'escola  case']) {
      const response = await agent.post('/schools').send(schoolBody(sector.id, { name })).expect(201);
      expect(response.body.name).toBe(name);
    }
    
    const stored = await db.query('SELECT name FROM schools');
    expect(stored.rows).toHaveLength(3);
  });

  it('sanitises every string field before persisting it', async () => {
    const sector = await insertSector();
    const body = schoolBody(sector.id, {
      name: '  <b>Escola &amp; Cia</b>  ',
      address: '<p>Rua Central</p>',
      headteacher: '<em>Ada</em>',
      phone: '  <span>(22)98131-0329</span>  ',
    });
    
    const response = await agent.post('/schools').send(body).expect(201);
    expect(response.body).toEqual({
      ...schoolBody(sector.id, { name: 'Escola & Cia', address: 'Rua Central', headteacher: 'Ada' }),
      id: expect.any(Number), createdAt: expect.any(String), updatedAt: expect.any(String),
    });
    
    const read = await agent.get(`/schools/${response.body.id}`).expect(200);
    expect(read.body).toEqual(response.body);
  });

  it.each(['   ', '<b></b>'])('currently accepts a name sanitised into an empty string: %s', async (name) => {
    const sector = await insertSector();
    
    const response = await agent.post('/schools').send(schoolBody(sector.id, { name })).expect(201);
    expect(response.body.name).toBe('');
    
    const read = await agent.get(`/schools/${response.body.id}`).expect(200);
    expect(read.body.name).toBe('');
  });

  it.each(['<b>Escola Ancyra</b>', '  Escola Ancyra  '])(
    'currently returns 500 for a duplicate introduced by sanitisation: %s', async (name) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const sector = await insertSector();
      const original = await insertSchool(sector.id, { name: 'Escola Ancyra' });
      
      const response = await agent.post('/schools').send(schoolBody(sector.id, { name }))
        .expect('Content-Type', /html/).expect(500);
      expect(response.text).toBe('Erro interno no servidor');
      
      const stored = await db.query('SELECT * FROM schools');
      expect(JSON.parse(JSON.stringify(stored.rows))).toEqual([original]);
    },
  );

  it.each([0, -1, 2147483647, 1.5])(
    'currently returns generic 500 for an invalid sector reference: %s', async (sectorId) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = await agent.post('/schools').send(schoolBody(sectorId))
        .expect('Content-Type', /html/).expect(500);
      expect(response.text).toBe('Erro interno no servidor');
      
      await expectNoSchools();
    },
  );

  it('accepts a numeric string sectorId and returns the stored integer', async () => {
    const sector = await insertSector();
    
    const response = await agent.post('/schools').send(schoolBody(String(sector.id))).expect(201);
    expect(response.body.sectorId).toBe(sector.id);
  });

  it.each(['+552223456789', '+5522998765432', '(22) 2345-6789', 'not a phone'])(
    'currently accepts phone strings without validating or normalising the format: %s', async (phone) => {
      const sector = await insertSector();
      
      const response = await agent.post('/schools').send(schoolBody(sector.id, { phone })).expect(201);
      expect(response.body.phone).toBe(phone);
    },
  );

  it.each(['name', 'address', 'headteacher', 'phone'])(
    'accepts %s with the current database limit of 255 characters', async (field) => {
      const sector = await insertSector();
      const value = 'x'.repeat(255);
      
      const response = await agent.post('/schools').send(schoolBody(sector.id, { [field]: value })).expect(201);
      expect(response.body[field]).toBe(value);
    },
  );

  it.each(['name', 'address', 'headteacher', 'phone'])(
    'currently returns generic 500 when %s exceeds 255 characters', async (field) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const sector = await insertSector();
      
      const response = await agent.post('/schools').send(schoolBody(sector.id, { [field]: 'x'.repeat(256) }))
        .expect('Content-Type', /html/).expect(500);
      expect(response.text).toBe('Erro interno no servidor');
      
      await expectNoSchools();
    },
  );

  it('currently returns generic 500 for malformed JSON', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const response = await agent.post('/schools').set('Content-Type', 'application/json').send('{')
      .expect('Content-Type', /html/).expect(500);
    expect(response.text).toBe('Erro interno no servidor');
    
    await expectNoSchools();
  });
});

describe('GET /schools/:id/classes', () => {
  it('returns [] for an existing school without classes', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    
    const response = await agent.get(`/schools/${school.id}/classes`)
      .expect('Content-Type', /json/).expect(200);
    expect(response.body).toEqual([]);
  });

  it('returns only classes of the requested school, with all statuses, ordered by name', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const otherSchool = await insertSchool(sector.id);
    const zulu = await insertClass(school.id, { name: 'Zulu', status: 'current' });
    await insertClass(otherSchool.id, { name: 'Other school' });
    const alpha = await insertClass(school.id, { name: 'Alpha', status: 'completed' });
    const middle = await insertClass(school.id, { name: 'Middle', status: 'current' });

    const response = await agent.get(`/schools/${school.id}/classes`)
      .expect('Content-Type', /json/).expect(200);
    expect(response.body).toEqual([alpha, middle, zulu]);
  });

  it('currently ignores a status query parameter', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const alpha = await insertClass(school.id, { name: 'Alpha', status: 'completed' });
    const zulu = await insertClass(school.id, { name: 'Zulu', status: 'current' });
    
    const response = await agent.get(`/schools/${school.id}/classes?status=current`).expect(200);
    expect(response.body).toEqual([alpha, zulu]);
  });
});
