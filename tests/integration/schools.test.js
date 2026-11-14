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
    expect(response.body).toEqual({ ...school, totalCapacity: 20 });
  });

  it.each(['/schools/2147483647', '/schools/2147483647/classes'])(
    'returns the current 404 JSON message for %s', async (url) => {
      const response = await agent.get(url).expect('Content-Type', /json/).expect(404);
      expect(response.body).toEqual({ message: 'Escola não encontrada' });
    },
  );

  it.each(['/schools/abc', '/schools/abc/classes'])(
    'returns JSON 422 for an invalid identifier: %s', async (url) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const response = await agent.get(url).expect('Content-Type', /json/).expect(422);
      expect(response.body.message).toContain('id');
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
    expect(read.body).toEqual({ ...response.body, totalCapacity: 0 });
    
    const listing = await agent.get(`/sectors/${sector.id}/schools`).expect(200);
    expect(listing.body).toEqual([response.body]);
  });

  const invalidFields = ['sectorId', 'name', 'address', 'headteacher', 'phone'];
  const invalidCases = invalidFields.flatMap((field) => [
    ...(['headteacher', 'phone'].includes(field) ? [] : [[field, 'missing', undefined], [field, 'null', null]]), [field, 'boolean', false],
    [field, 'object', {}], [field, 'array', []], ...(field === 'headteacher' ? [] : [[field, 'empty', '']]),
    [field, 'wrong type', field === 'sectorId' ? 'abc' : 123],
  ]);

  it.each(invalidCases)('rejects %s (%s) with JSON 422 and no write', async (field, label, value) => {
    const sector = await insertSector();
    const body = schoolBody(sector.id, { [field]: value });
    
    const response = await agent.post('/schools').send(body)
      .expect('Content-Type', /json/).expect(422);
    expect(response.body).toEqual({ message: expect.stringContaining(`"${field}"`) });
    
    await expectNoSchools();
  });

  const emptyAfterSanitisationCases = ['address', 'phone'].flatMap((field) => [
    [field, '   '], [field, '<b></b>'],
  ]);

  it.each(emptyAfterSanitisationCases)(
    'rejects %s that becomes empty after sanitisation (%p) with 422 and no write', async (field, value) => {
      const sector = await insertSector();
      const response = await agent.post('/schools').send(schoolBody(sector.id, { [field]: value }))
        .expect('Content-Type', /json/).expect(422);
      expect(response.body).toEqual({ message: expect.stringContaining(`"${field}"`) });
      await expectNoSchools();
    },
  );

  it.each(['id', 'createdAt', 'updatedAt', 'unexpected'])(
    'rejects an unknown or server-managed field: %s', async (field) => {
      const sector = await insertSector();
      const response = await agent.post('/schools').send(schoolBody(sector.id, { [field]: 1 }))
        .expect('Content-Type', /json/).expect(422);
      expect(response.body).toEqual({ message: expect.stringContaining(`"${field}"`) });
      
      await expectNoSchools();
    },
  );

  it('validates before checking duplicate names', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    
    const response = await agent.post('/schools').send(schoolBody(sector.id, {
      name: school.name, phone: false,
    })).expect(422);
    expect(response.body).toEqual({ message: expect.stringContaining('"phone"') });
    
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

  it('rejects names differing only by case or internal spacing', async () => {
    const sector = await insertSector();
    await agent.post('/schools').send(schoolBody(sector.id, { name: 'Escola Case' })).expect(201);
    for (const name of ['escola case', 'escola  case']) {
      await agent.post('/schools').send(schoolBody(sector.id, { name })).expect(409);
    }
    expect((await db.query('SELECT name FROM schools')).rows).toEqual([{ name: 'escola case' }]);
  });

  it('sanitises every string field before persisting it', async () => {
    const sector = await insertSector();
    const body = schoolBody(sector.id, {
      name: '  <b>Escola &amp; Cia</b>  ',
      address: '<p>Rua Central</p>',
      headteacher: '<em>Ada</em>',
      phone: '  <span>+5522981310329</span>  ',
    });
    
    const response = await agent.post('/schools').send(body).expect(201);
    expect(response.body).toEqual({
      ...schoolBody(sector.id, { name: 'escola & cia', address: 'Rua Central', headteacher: 'Ada' }),
      id: expect.any(Number), createdAt: expect.any(String), updatedAt: expect.any(String),
    });
    
    const read = await agent.get(`/schools/${response.body.id}`).expect(200);
    expect(read.body).toEqual({ ...response.body, totalCapacity: 0 });
  });

  it('rejects a whitespace-only name with 422 and no write', async () => {
    const sector = await insertSector();

    const response = await agent.post('/schools').send(schoolBody(sector.id, { name: '   ' }))
      .expect('Content-Type', /json/).expect(422);
    expect(response.body).toEqual({ message: expect.stringContaining('"name"') });
    await expectNoSchools();
  });

  it.each(['<b>Escola Ancyra</b>', '  Escola Ancyra  '])(
    'rejects a duplicate introduced by sanitisation with 409: %s', async (name) => {
      const sector = await insertSector();
      const original = await insertSchool(sector.id, { name: 'escola ancyra' });
      
      const response = await agent.post('/schools').send(schoolBody(sector.id, { name }))
        .expect('Content-Type', /json/).expect(409);
      expect(response.body).toEqual({ message: 'Já existe uma escola com este nome' });
      
      const stored = await db.query('SELECT * FROM schools');
      expect(JSON.parse(JSON.stringify(stored.rows))).toEqual([original]);
    },
  );

  it.each([2147483647])(
    'rejects a sector reference without an existing sector with 422: %s', async (sectorId) => {
      const response = await agent.post('/schools').send(schoolBody(sectorId))
        .expect('Content-Type', /json/).expect(422);
      expect(response.body).toEqual({
        message: 'sectorId: setor não encontrado. Informe um setor existente.',
      });
      
      await expectNoSchools();
    },
  );

  it('accepts a numeric string sectorId and returns a number', async () => {
    const sector = await insertSector();
    
    const response = await agent.post('/schools').send(schoolBody(String(sector.id))).expect(201);
    expect(response.body.sectorId).toBe(sector.id);
  });

  it.each(['+552223456789', '+5522998765432'])(
    'accepts canonical phone: %s', async (phone) => {
      const sector = await insertSector();
      
      const response = await agent.post('/schools').send(schoolBody(sector.id, { phone })).expect(201);
      expect(response.body.phone).toBe(phone);
    },
  );

  it.each(['address'])(
    'accepts %s with the database limit of 255 characters', async (field) => {
      const sector = await insertSector();
      const value = 'x'.repeat(255);
      
      const response = await agent.post('/schools').send(schoolBody(sector.id, { [field]: value })).expect(201);
      expect(response.body[field]).toBe(value);
    },
  );

  it.each(['name', 'address', 'headteacher', 'phone'])(
    'rejects %s above its allowed limit with 422', async (field) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const sector = await insertSector();
      
      const response = await agent.post('/schools').send(schoolBody(sector.id, { [field]: 'x'.repeat(256) }))
        .expect('Content-Type', /json/).expect(422);
      expect(response.body.message).toContain(field);
      
      await expectNoSchools();
    },
  );

  it('returns JSON 400 for malformed JSON', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const response = await agent.post('/schools').set('Content-Type', 'application/json').send('{')
      .expect('Content-Type', /json/).expect(400);
    expect(response.body.message).toContain('JSON');
    
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

    const response = await agent.get(`/schools/${school.id}/classes?status=all`)
      .expect('Content-Type', /json/).expect(200);
    expect(response.body).toEqual([alpha, middle, zulu]);
  });

  it('filters by an explicit status query parameter', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const alpha = await insertClass(school.id, { name: 'Alpha', status: 'completed' });
    const zulu = await insertClass(school.id, { name: 'Zulu', status: 'current' });
    
    const response = await agent.get(`/schools/${school.id}/classes?status=current`).expect(200);
    expect(response.body).toEqual([zulu]);
  });
});
