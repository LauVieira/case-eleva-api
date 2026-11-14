/* global describe, it, expect */
const { db, insertSector, insertSchool, insertClass, schoolBody } = require('../auxiliarFunctions');
const { readdirSync } = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const request = require('supertest');
const app = require('../../src/app');
const sequelize = require('../../src/utils/database');

describe('Verificação complementar dos contratos existentes', () => {
  it.each([
    ['name', '', 'não pode ficar vazio'],
    ['name', 'a'.repeat(101), 'no máximo 100 caracteres'],
    ['address', 'a'.repeat(256), 'no máximo 255 caracteres'],
    ['headteacher', 'a'.repeat(151), 'no máximo 150 caracteres'],
    ['phone', '(22) 2345-6789', 'sem máscara'],
    ['sectorId', 1.5, 'inteiro'],
  ])('identifica %s e explica a correção em português', async (field, value, guidance) => {
    const sector = await insertSector();
    const response = await request(app).post('/schools').send(schoolBody(sector.id, { [field]: value })).expect(422);
    expect(response.body.message).toContain(`"${field}"`);
    expect(response.body.message).toContain(guidance);
    expect((await db.query('SELECT id FROM schools')).rows).toEqual([]);
  });

  it('explica os identificadores e filtros inválidos em português', async () => {
    const invalidId = await request(app).get('/schools/abc').expect(422);
    expect(invalidId.body.message).toContain('inteiro');
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    const invalidFilter = await request(app).get(`/schools/${school.id}/classes?status=active`).expect(422);
    expect(invalidFilter.body.message).toContain('current');
    expect(invalidFilter.body.message).toContain('deve ser');
  });

  it('reverte e reaplica as novas migrations, preservando as migrations originais', async () => {
    const directory = path.join(__dirname, '../../migrations');
    const files = readdirSync(directory).filter((name) => name.startsWith('20261107') && name.endsWith('.js')).sort();
    const queryInterface = sequelize.getQueryInterface();
    for (const filename of [...files].reverse()) await require(path.join(directory, filename)).down(queryInterface, Sequelize);
    const original = await db.query('SELECT column_name, data_type, character_maximum_length, is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1', ['schools']);
    const columns = Object.fromEntries(original.rows.map((column) => [column.column_name, column]));
    expect(columns.name.character_maximum_length).toBe(255);
    expect(columns.headteacher.is_nullable).toBe('NO');
    expect(columns.phone.is_nullable).toBe('NO');
    const status = await db.query('SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2', ['classes', 'status']);
    expect(status.rows[0].data_type).toBe('USER-DEFINED');
    for (const filename of files) await require(path.join(directory, filename)).up(queryInterface, Sequelize);
    const sector = await insertSector();
    await request(app).post('/schools').send({ sectorId: sector.id, name: 'nova escola', address: 'Rua Central' }).expect(201);
  });

  it('mantém chaves estrangeiras e bloqueia apagar escola com turma, inclusive encerrada', async () => {
    await expect(insertSchool(2147483647)).rejects.toMatchObject({ code: '23503' });
    await expect(insertClass(2147483647)).rejects.toMatchObject({ code: '23503' });
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await insertClass(school.id, { status: 'completed' });
    await expect(db.query('DELETE FROM schools WHERE id = $1', [school.id])).rejects.toMatchObject({ code: '23503' });
    expect((await db.query('SELECT id FROM classes')).rows).toHaveLength(1);
  });

  it.each([[null, '23502'], ['active', '23514']])('o banco rejeita status inválido sem fornecer um padrão: %s', async (status, code) => {
    const sector = await insertSector();
    const school = await insertSchool(sector.id);
    await expect(insertClass(school.id, { status })).rejects.toMatchObject({ code });
  });

  it('reverte e reaplica todas as seeds e representa os quatro segmentos', async () => {
    const directory = path.join(__dirname, '../../seeders');
    const files = readdirSync(directory).filter((name) => name.endsWith('.js')).sort();
    const queryInterface = sequelize.getQueryInterface();
    for (const filename of files) await require(path.join(directory, filename)).up(queryInterface, Sequelize);
    const segments = await db.query('SELECT DISTINCT segment FROM classes');
    expect(segments.rows.map((item) => item.segment).sort()).toEqual([
      'Educação Infantil — Creche', 'Educação Infantil — Pré-escola', 'Ensino Fundamental', 'Ensino Médio',
    ].sort());
    for (const filename of [...files].reverse()) await require(path.join(directory, filename)).down(queryInterface, Sequelize);
    expect((await db.query('SELECT id FROM sectors')).rows).toEqual([]);
    expect((await db.query('SELECT id FROM schools')).rows).toEqual([]);
    expect((await db.query('SELECT id FROM classes')).rows).toEqual([]);
    for (const filename of files) await require(path.join(directory, filename)).up(queryInterface, Sequelize);
    expect((await db.query('SELECT id FROM schools')).rows.length).toBeGreaterThanOrEqual(6);
  });
});
