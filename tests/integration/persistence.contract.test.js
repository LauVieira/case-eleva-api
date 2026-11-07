/* global describe, it, expect, jest, afterEach */
const { db, insertSector, insertSchool, insertClass } = require('../auxiliarFunctions');
const { readdirSync } = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const request = require('supertest');
const app = require('../../src/app');
const Class = require('../../src/models/Class');
const sequelize = require('../../src/utils/database');
afterEach(() => jest.restoreAllMocks());

describe('Persistência, seeds e erros das rotas existentes', () => {
  it('define limites e campos opcionais coerentes no banco', async () => {
    const result = await db.query('SELECT column_name, character_maximum_length, is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1', ['schools']);
    const columns = Object.fromEntries(result.rows.map((column) => [column.column_name, column]));
    expect(columns.name.character_maximum_length).toBe(100);
    expect(columns.headteacher.character_maximum_length).toBe(150);
    expect(columns.headteacher.is_nullable).toBe('YES');
    expect(columns.phone.is_nullable).toBe('YES');
  });
  it('persiste status de turma como texto, sem enum nativo e sem default', async () => {
    const result = await db.query('SELECT data_type, column_default FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2', ['classes', 'status']);
    expect(result.rows).toEqual([{ data_type: 'character varying', column_default: null }]);
  });
  it('impede turmas ativas homônimas, mas permite encerradas e escolas diferentes', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const other = await insertSchool(sector.id);
    const values = { name: 'turma a', segment: 'Ensino Fundamental', grade: '1º ano', shift: 'Matutino' };
    await insertClass(school.id, values);
    await insertClass(school.id, { ...values, status: 'completed' });
    await insertClass(other.id, values);
    await expect(insertClass(school.id, values)).rejects.toMatchObject({ code: '23505' });
    expect((await db.query('SELECT id FROM classes')).rows).toHaveLength(3);
  });
  it('o banco rejeita capacidade negativa e preserva capacidade zero', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const values = { segment: 'Ensino Fundamental', grade: '1º ano', shift: 'Matutino' };
    await insertClass(school.id, { ...values, maxOccupancy: 0 });
    await expect(insertClass(school.id, { ...values, maxOccupancy: -1 })).rejects.toMatchObject({ code: '23514' });
  });
  it('bloqueia reativação conflitante e mantém a turma encerrada', async () => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id, { name: 'turma a' });
    const completed = await insertClass(school.id, { name: 'turma a', status: 'completed' });
    await expect(db.query('UPDATE classes SET status = $1 WHERE id = $2', ['current', completed.id])).rejects.toMatchObject({ code: '23505' });
    expect((await db.query('SELECT status FROM classes WHERE id = $1', [completed.id])).rows[0].status).toBe('completed');
  });
  it.each([[1.5, '22P02'], [2147483648, '22003']])('o banco rejeita capacidade fora do tipo inteiro: %s', async (maxOccupancy, code) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await expect(insertClass(school.id, { maxOccupancy })).rejects.toMatchObject({ code });
  });
  it.each([{ segment: 'Ensino Fundamental I' }, { segment: 'Ensino Médio', grade: '9º ano' }, { shift: 'Manhã' }, { name: 'x'.repeat(51) }, { maxOccupancy: -1 }])(
    'os modelos validam as opções existentes: %p', async (invalid) => {
      const model = Class.build({ schoolId: 1, name: 'turma a', segment: 'Ensino Fundamental', grade: '1º ano', shift: 'Matutino', status: 'current', maxOccupancy: 0, ...invalid });
      await expect(model.validate()).rejects.toThrow();
    },
  );
  it('semeia dados com nomes, telefones, opções e datas válidos', async () => {
    const directory = path.join(__dirname, '../../seeders');
    for (const filename of readdirSync(directory).filter((name) => name.endsWith('.js')).sort()) {
      await require(path.join(directory, filename)).up(sequelize.getQueryInterface(), Sequelize);
    }
    const schools = (await db.query('SELECT * FROM schools')).rows;
    expect(schools.length).toBeGreaterThanOrEqual(5);
    for (const school of schools) {
      expect(school.name).toBe(school.name.trim().replace(/\s+/g, ' ').toLowerCase());
      expect(school.name.length).toBeLessThanOrEqual(100);
      expect(school.phone === null || /^\+55\d{10,11}$/.test(school.phone)).toBe(true);
      expect(school.createdAt).toBeInstanceOf(Date);
      expect(school.updatedAt).toBeInstanceOf(Date);
    }
    const classes = (await db.query('SELECT * FROM classes')).rows;
    expect(classes.some((item) => item.status === 'completed')).toBe(true);
    for (const item of classes) {
      expect(['Matutino', 'Vespertino', 'Noturno', 'Integral']).toContain(item.shift);
      expect(['Educação Infantil — Creche', 'Educação Infantil — Pré-escola', 'Ensino Fundamental', 'Ensino Médio']).toContain(item.segment);
      expect(item.createdAt).toBeInstanceOf(Date);
    }
    const sectors = (await db.query('SELECT * FROM sectors')).rows;
    expect(sectors).toHaveLength(11);
    expect(sectors.every((item) => item.createdAt instanceof Date && item.updatedAt instanceof Date)).toBe(true);
  });
  it('responde JSON e orientação para JSON malformado', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app).post('/schools').set('Content-Type', 'application/json').send('{');
    expect(response.status).toBe(400);
    expect(response.type).toBe('application/json');
    expect(response.body.message).toMatch(/JSON/);
    expect((await db.query('SELECT id FROM schools')).rows).toEqual([]);
  });
  it('responde 500 JSON seguro em uma falha inesperada, registrando detalhes somente no console', async () => {
    const repository = require('../../src/repositories/SectorRepository');
    const error = new Error('detalhe SQL secreto');
    jest.spyOn(repository, 'findAll').mockRejectedValue(error);
    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app).get('/sectors');
    expect(response.status).toBe(500);
    expect(response.type).toBe('application/json');
    expect(response.body.message).toMatch(/servidor/);
    expect(JSON.stringify(response.body)).not.toContain('SQL');
    expect(logger).toHaveBeenCalledWith(error);
  });
});
