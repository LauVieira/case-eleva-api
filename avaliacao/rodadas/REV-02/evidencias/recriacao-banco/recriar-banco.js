/* Operação destrutiva autorizada pela autora: exclusivamente case_eleva em localhost:5432. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');
const { Client } = require('pg');

const root = path.resolve(__dirname, '../../../../..');
assert.strictEqual(process.cwd(), root);
assert.strictEqual(process.argv[2], '--executar', 'Requer autorização e --executar; esta operação apaga o banco configurado.');
require('dotenv').config();
assert(process.env.NODE_ENV !== 'production', 'A operação é exclusiva do desenvolvimento.');
const url = new URL(process.env.DATABASE_URL);
assert.strictEqual(url.hostname, 'localhost');
assert.strictEqual(url.port || '5432', '5432');
assert.strictEqual(decodeURIComponent(url.pathname.slice(1)), 'case_eleva');
assert.strictEqual(require(path.join(root, 'config/config')).development.url, process.env.DATABASE_URL);
const version = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const qid = (value) => '"' + String(value).replace(/"/g, '""') + '"';
const literal = (value) => "'" + String(value).replace(/'/g, "''") + "'";
const logFile = path.join(__dirname, 'EV01_recriacao_e_validacao.txt');
const resultFile = path.join(__dirname, 'EV02_resultado.json');
assert(!fs.existsSync(logFile) && !fs.existsSync(resultFile), 'Não sobrescrever uma execução anterior.');
const descriptor = fs.openSync(logFile, 'wx');
const redact = (value) => String(value).replaceAll(process.env.DATABASE_URL, '[URL omitida]')
  .replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, '[URL omitida]');
function log (message) {
  const line = redact(message);
  fs.writeSync(descriptor, line + '\n');
  console.log(line);
}
const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const protectedFiles = Object.fromEntries(tracked.map((file) => [file, hash(file)]));
const migrations = fs.readdirSync('migrations').filter((name) => name.endsWith('.js')).sort();
const seeds = fs.readdirSync('seeders').filter((name) => name.endsWith('.js')).sort();
const record = {
  atividade: 'Recriação integral do banco de desenvolvimento e aplicação de migrations/seeds',
  rodada: 'REV-02', achado_relacionado: 'REV-01-BE-A010',
  autorizacao: 'A autora perguntou se poderia solicitar a destruição e recriação do banco; após a explicação de que isso apagaria todos os dados, autorizou: não tem problema apagar os dados atuais.',
  inicio_utc_sistema: new Date().toISOString(), commit: version,
  destino: { host: url.hostname, porta: Number(url.port || 5432), banco: 'case_eleva', ambiente: 'development' },
  ferramentas: { node: process.version, sequelize_cli: require('sequelize-cli/package.json').version, sequelize: require('sequelize/package.json').version, pg: require('pg/package.json').version },
  migrations, seeds, comandos: [], verificacoes: [], resultado: 'em_execucao',
};
const clients = new Set();
async function connect (connectionString) {
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  client.on('error', (error) => log('Erro de conexão: ' + error.message));
  await client.connect();
  clients.add(client);
  return client;
}
async function close (client) {
  await client.end();
  clients.delete(client);
}
function cli (command) {
  const args = ['node_modules/sequelize-cli/lib/sequelize', command, '--env', 'development'];
  log('\nComando: node ' + args.join(' '));
  const output = spawnSync(process.execPath, args, {
    cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, NODE_ENV: 'development', FORCE_COLOR: '0' },
  });
  log((output.stdout || '') + (output.stderr || ''));
  log('Código de saída: ' + output.status);
  record.comandos.push({ comando: 'node ' + args.join(' '), codigo_saida: output.status });
  assert.strictEqual(output.status, 0, command + ' falhou.');
}
function check (name, action) {
  action();
  record.verificacoes.push({ verificacao: name, resultado: 'passou' });
  log('PASS: ' + name);
}

async function main () {
  log('Autorização: não tem problema apagar os dados atuais.');
  log('Destino fixado: case_eleva em localhost:5432; ambiente development.');
  log('Commit: ' + version + '; início UTC: ' + record.inicio_utc_sistema);
  const before = await connect(process.env.DATABASE_URL);
  const metadata = (await before.query(`SELECT d.oid, d.datname, pg_get_userbyid(d.datdba) AS owner,
    pg_encoding_to_char(d.encoding) AS encoding, d.datcollate, d.datctype, d.datlocprovider,
    t.spcname AS tablespace, version() AS server_version, inet_server_addr()::text AS server_address,
    current_user = pg_get_userbyid(d.datdba) AS owns_database
    FROM pg_database d JOIN pg_tablespace t ON t.oid=d.dattablespace
    WHERE d.datname=current_database()`)).rows[0];
  assert.strictEqual(metadata.datname, 'case_eleva');
  assert(['::1/128', '::1', '127.0.0.1/32', '127.0.0.1'].includes(metadata.server_address));
  assert(metadata.owns_database);
  assert.strictEqual(metadata.datlocprovider, 'c', 'Preservar explicitamente o provedor de locale existente.');
  const countsBefore = (await before.query(`SELECT
    (SELECT count(*)::int FROM public.sectors) AS setores,
    (SELECT count(*)::int FROM public.schools) AS escolas,
    (SELECT count(*)::int FROM public.classes) AS turmas`)).rows[0];
  record.antes = { ...metadata, quantidades: countsBefore };
  log('Pré-verificação: ' + JSON.stringify(record.antes));
  await close(before);

  // A conexão administrativa usa o mesmo servidor e credencial, mudando somente o banco.
  const maintenanceUrl = new URL(process.env.DATABASE_URL);
  maintenanceUrl.pathname = '/postgres';
  const admin = await connect(maintenanceUrl.toString());
  const permissions = (await admin.query('SELECT rolcreatedb, rolsuper FROM pg_roles WHERE rolname=current_user')).rows[0];
  assert(permissions.rolcreatedb || permissions.rolsuper);
  const drop = 'DROP DATABASE ' + qid(metadata.datname) + ' WITH (FORCE)';
  log('\nSQL administrativo: ' + drop);
  await admin.query(drop);
  record.banco_removido = true;
  const create = 'CREATE DATABASE ' + qid(metadata.datname) + ' WITH OWNER ' + qid(metadata.owner)
    + ' TEMPLATE template0 ENCODING ' + literal(metadata.encoding)
    + ' LOCALE_PROVIDER libc LC_COLLATE ' + literal(metadata.datcollate)
    + ' LC_CTYPE ' + literal(metadata.datctype) + ' TABLESPACE ' + qid(metadata.tablespace);
  log('SQL administrativo: ' + create);
  await admin.query(create);
  record.banco_recriado = true;
  await close(admin);

  cli('db:migrate');
  cli('db:seed:all');
  cli('db:migrate:status');

  const db = await connect(process.env.DATABASE_URL);
  const databaseAfter = (await db.query(`SELECT oid, pg_get_userbyid(datdba) AS owner,
    pg_encoding_to_char(encoding) AS encoding, datcollate, datctype, datlocprovider
    FROM pg_database WHERE datname=current_database()`)).rows[0];
  check('Banco realmente recriado, mantendo proprietário, encoding e locale', () => {
    assert.notStrictEqual(databaseAfter.oid, metadata.oid);
    for (const key of ['owner', 'encoding', 'datcollate', 'datctype', 'datlocprovider']) {
      assert.strictEqual(databaseAfter[key], metadata[key]);
    }
  });
  const applied = (await db.query('SELECT name FROM public."SequelizeMeta" ORDER BY name')).rows.map((row) => row.name);
  check('As cinco migrations estão registradas e não há migration pendente', () => assert.deepStrictEqual(applied, migrations));
  const sectors = (await db.query('SELECT * FROM public.sectors ORDER BY id')).rows;
  const schools = (await db.query('SELECT * FROM public.schools ORDER BY id')).rows;
  const classes = (await db.query('SELECT * FROM public.classes ORDER BY id')).rows;
  const expectedCounts = { setores: 11, escolas: 6, turmas: 8 };
  const counts = { setores: sectors.length, escolas: schools.length, turmas: classes.length };
  check('As quatro seeds produziram 11 setores, 6 escolas e 8 turmas', () => assert.deepStrictEqual(counts, expectedCounts));
  const normalise = require(path.join(root, 'src/utils/normaliseName'));
  const schoolSchema = require(path.join(root, 'src/schemas/schoolSchema'));
  const classSchema = require(path.join(root, 'src/schemas/classSchema'));
  const { GRADES_BY_SEGMENT } = require(path.join(root, 'src/constants/classOptions'));
  check('Todos os dados semeados seguem o contrato e os vínculos existem', () => {
    for (const school of schools) {
      const fields = Object.fromEntries(['sectorId', 'name', 'address', 'headteacher', 'phone'].map((key) => [key, school[key]]));
      assert(!schoolSchema.post.validate(fields).error);
      assert.strictEqual(school.name, normalise(school.name));
      assert(sectors.some((sector) => sector.id === school.sectorId));
    }
    for (const row of classes) {
      const fields = Object.fromEntries(['name', 'segment', 'grade', 'shift', 'status', 'maxOccupancy'].map((key) => [key, row[key]]));
      assert(!classSchema.post.validate(fields).error);
      assert(GRADES_BY_SEGMENT[row.segment].includes(row.grade));
      assert.strictEqual(row.name, normalise(row.name));
      assert(schools.some((school) => school.id === row.schoolId));
    }
  });
  check('Datas preenchidas e exemplos de opcionais nulos, quatro segmentos, encerradas e capacidade zero', () => {
    for (const row of [...sectors, ...schools, ...classes]) {
      assert(row.createdAt instanceof Date && row.updatedAt instanceof Date);
      assert(row.createdAt.getTime() >= Date.parse(record.inicio_utc_sistema));
      assert(row.updatedAt.getTime() >= row.createdAt.getTime());
    }
    assert(schools.some((school) => school.phone === null && school.headteacher === null));
    assert.deepStrictEqual([...new Set(classes.map((row) => row.segment))].sort(), Object.keys(GRADES_BY_SEGMENT).sort());
    assert(classes.some((row) => row.status === 'completed'));
    assert(classes.some((row) => row.maxOccupancy === 0));
  });
  const columns = (await db.query(`SELECT table_name, column_name, data_type, character_maximum_length,
    is_nullable, column_default FROM information_schema.columns
    WHERE table_schema='public' AND table_name IN ('schools','classes')
    ORDER BY table_name,ordinal_position`)).rows;
  check('Schema final tem limites, opcionais nulos e status textual obrigatório sem default', () => {
    const column = (table, name) => columns.find((row) => row.table_name === table && row.column_name === name);
    for (const [name, length] of [['name', 100], ['address', 255], ['headteacher', 150], ['phone', 14]]) {
      assert.strictEqual(column('schools', name).character_maximum_length, length);
    }
    assert.strictEqual(column('schools', 'headteacher').is_nullable, 'YES');
    assert.strictEqual(column('schools', 'phone').is_nullable, 'YES');
    assert.strictEqual(column('classes', 'name').character_maximum_length, 50);
    const status = column('classes', 'status');
    assert.strictEqual(status.data_type, 'character varying');
    assert.strictEqual(status.character_maximum_length, 20);
    assert.strictEqual(status.is_nullable, 'NO');
    assert.strictEqual(status.column_default, null);
    assert.strictEqual(column('classes', 'maxOccupancy').data_type, 'integer');
  });
  const indexes = (await db.query("SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY indexname")).rows;
  const constraints = (await db.query(`SELECT c.conname AS nome, c.contype AS tipo, pg_get_constraintdef(c.oid) AS definicao
    FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace
    WHERE n.nspname='public' ORDER BY c.conname`)).rows;
  const nativeEnum = (await db.query("SELECT count(*)::int AS total FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='enum_classes_status'")).rows[0].total;
  check('Índice único parcial, constraints, FKs e ausência do enum nativo', () => {
    const active = indexes.find((row) => row.indexname === 'classes_current_name_unique');
    assert(active && /UNIQUE INDEX/.test(active.indexdef) && /schoolId/.test(active.indexdef) && /WHERE.*current/.test(active.indexdef));
    for (const name of ['classes_schoolId_fkey', 'schools_sectorId_fkey', 'classes_status_values', 'classes_max_occupancy_nonnegative', 'classes_name_not_empty', 'schools_name_not_empty', 'schools_phone_canonical', 'schools_name_key']) {
      assert(constraints.some((row) => row.nome === name), name);
    }
    assert.strictEqual(nativeEnum, 0);
  });

  // GETs reais da aplicação contra public, sem usar o helper de testes ou alterar dados.
  const request = require('supertest');
  const app = require(path.join(root, 'src/app'));
  const sequelize = require(path.join(root, 'src/utils/database'));
  let httpQueries = 0;
  try {
    await request(app).get('/sectors').expect(200).expect((response) => assert.strictEqual(response.body.length, 11));
    httpQueries += 1;
    for (const school of schools) {
      const capacity = classes.filter((row) => row.schoolId === school.id && row.status === 'current')
        .reduce((total, row) => total + row.maxOccupancy, 0);
      await request(app).get('/schools/' + school.id).expect(200).expect((response) => {
        assert.strictEqual(response.body.id, school.id);
        assert.strictEqual(response.body.totalCapacity, capacity);
      });
      await request(app).get('/schools/' + school.id + '/classes?status=all').expect(200).expect((response) => {
        assert.deepStrictEqual(response.body.map((row) => row.id).sort(), classes.filter((row) => row.schoolId === school.id).map((row) => row.id).sort());
      });
      await request(app).get('/schools/' + school.id + '/classes').expect(200).expect((response) => {
        assert.deepStrictEqual(response.body.map((row) => row.id).sort(), classes.filter((row) => row.schoolId === school.id && row.status === 'current').map((row) => row.id).sort());
      });
      httpQueries += 3;
    }
    for (const row of classes) {
      await request(app).get('/classes/' + row.id).expect(200).expect((response) => {
        assert.strictEqual(response.body.id, row.id);
        assert.strictEqual(response.body.schoolId, row.schoolId);
        assert.strictEqual(response.body.school.name, schools.find((school) => school.id === row.schoolId).name);
      });
      httpQueries += 1;
    }
    check('27 consultas HTTP conferem setores, escolas, filtros, capacidade e detalhes de turma no banco de uso', () => assert.strictEqual(httpQueries, 27));
  } finally {
    await sequelize.close();
  }
  const afterReads = (await db.query(`SELECT
    (SELECT count(*)::int FROM public.sectors) AS setores,
    (SELECT count(*)::int FROM public.schools) AS escolas,
    (SELECT count(*)::int FROM public.classes) AS turmas`)).rows[0];
  check('Consultas preservaram os dados semeados', () => assert.deepStrictEqual(afterReads, counts));
  record.depois = { ...databaseAfter, migrations_aplicadas: applied, quantidades: counts, consultas_http: httpQueries, colunas: columns, indices: indexes, constraints };
  await close(db);
  check('Fontes, configurações, testes e registros versionados preservados', () => {
    for (const [file, digest] of Object.entries(protectedFiles)) assert.strictEqual(hash(file), digest, file);
  });
  record.resultado = 'sucesso';
  log('\nSUCESSO: banco case_eleva recriado; 5 migrations e 4 seeds aplicadas; 11 setores, 6 escolas, 8 turmas; 27 consultas HTTP conferidas.');
}

main().catch((error) => {
  record.resultado = 'falhou';
  record.erro = { mensagem: redact(error.message), codigo: error.code || null };
  log('FALHA: ' + JSON.stringify(record.erro));
  process.exitCode = 1;
}).finally(async () => {
  for (const client of clients) {
    try { await client.end(); } catch (error) { log('Fechamento: ' + error.message); }
  }
  record.fim_utc_sistema = new Date().toISOString();
  fs.writeFileSync(resultFile, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
  fs.closeSync(descriptor);
});
