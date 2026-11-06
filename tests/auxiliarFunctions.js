/* global beforeAll, beforeEach, afterAll */

require('dotenv').config();

const { readdirSync } = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { Sequelize } = require('sequelize');

if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const sequelize = require('../src/utils/database');

const schema = `eleva_test_${process.pid}_${process.hrtime.bigint().toString(16)}`;
sequelize.options.define.schema = schema;
sequelize.addHook('afterConnect', async (connection) => {
  await connection.query(`SET search_path TO "${schema}"`);
});

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: `-c search_path=${schema}`,
  connectionTimeoutMillis: 5000,
});

const connectionsClosed = [];
db.on('connect', (client) => {
  connectionsClosed.push(new Promise((resolve) => client.once('end', resolve)));
});

let schemaCreated = false;
let sequence = 0;

beforeAll(async () => {
  await db.query(`CREATE SCHEMA "${schema}"`);
  schemaCreated = true;

  const queryInterface = sequelize.getQueryInterface();
  const scopedInterface = {
    createTable (tableName, attributes, options) {
      const scopedAttributes = Object.fromEntries(Object.entries(attributes).map(([key, value]) => [
        key,
        value.references ? {
          ...value,
          references: {
            ...value.references,
            model: { tableName: value.references.model, schema },
          },
        } : value,
      ]));
      return queryInterface.createTable({ tableName, schema }, scopedAttributes, options);
    },
  };

  const migrationsPath = path.join(__dirname, '../migrations');
  for (const filename of readdirSync(migrationsPath).filter((name) => name.endsWith('.js')).sort()) {
    await require(path.join(migrationsPath, filename)).up(scopedInterface, Sequelize);
  }
}, 15000);

beforeEach(async () => {
  await db.query('DELETE FROM classes');
  await db.query('DELETE FROM schools');
  await db.query('DELETE FROM sectors');
  sequence = 0;
});

afterAll(async () => {
  try {
    await sequelize.close();
  } finally {
    try {

      if (schemaCreated && /^eleva_test_\d+_[a-f0-9]+$/.test(schema)) {
        await db.query(`DROP SCHEMA "${schema}" CASCADE`);
      }
    } finally {
      await db.end();
      await Promise.all(connectionsClosed);
    }
  }
});

async function insert (table, values) {
  const keys = Object.keys(values);
  const columns = keys.map((key) => `"${key}"`).join(', ');
  const parameters = keys.map((key, index) => `$${index + 1}`).join(', ');
  const result = await db.query(
    `INSERT INTO "${table}" (${columns}) VALUES (${parameters}) RETURNING *`,
    Object.values(values),
  );

  return JSON.parse(JSON.stringify(result.rows[0]));
}

function insertSector (overrides = {}) {
  sequence += 1;
  return insert('sectors', {
    name: `Sector ${sequence}`, code: `S${sequence}`, color: '#123456', ...overrides,
  });
}

function schoolBody (sectorId, overrides = {}) {
  return {
    sectorId,
    name: 'Escola Ancyra',
    address: 'Avenida Amaral Peixoto 555',
    headteacher: 'Ada Luiz',
    phone: '(22)98131-0329',
    ...overrides,
  };
}

function insertSchool (sectorId, overrides = {}) {
  sequence += 1;
  return insert('schools', schoolBody(sectorId, { name: `School ${sequence}`, ...overrides }));
}

function insertClass (schoolId, overrides = {}) {
  sequence += 1;
  return insert('classes', {
    schoolId,
    name: `Class ${sequence}`,
    grade: 'Test Grade',
    segment: 'Test Segment',
    shift: 'Test Shift',
    status: 'current',
    maxOccupancy: 20,
    ...overrides,
  });
}

module.exports = { db, insertSector, insertSchool, insertClass, schoolBody };
