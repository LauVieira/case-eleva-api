/* Conferência documental e consultas de ambiente somente de leitura. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
require('dotenv').config();
const { Pool } = require('pg');

async function main () {
  const base = 'avaliacao/rodadas/REV-02';
  const output = base + '/evidencias/EV06_conferencia_documental.json';
  assert(!fs.existsSync(output), 'Não sobrescrever conferência encerrada.');
  const read = (name) => JSON.parse(fs.readFileSync(name, 'utf8'));
  const sha = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
  const doc = read(base + '/achados-backend.json');
  const model = read('avaliacao/06_Modelo_Achados.json').achados[0];
  const prior = read('avaliacao/rodadas/REV-01/achados-backend.json');
  assert.deepStrictEqual(Object.keys(doc), ['tipo_documento', 'versao_formato', 'rodada', 'execucao', 'achados']);
  assert.strictEqual(doc.tipo_documento, 'revisao');
  assert.strictEqual(doc.versao_formato, '1.0');
  assert.strictEqual(doc.rodada, 'REV-02');
  assert.strictEqual(doc.execucao, 'r01');
  assert.strictEqual(doc.achados.length, 1);
  const ids = new Set();
  for (const finding of doc.achados) {
    assert.deepStrictEqual(Object.keys(finding), Object.keys(model));
    assert(!ids.has(finding.id));
    assert(!prior.achados.some((old) => old.id === finding.id));
    ids.add(finding.id);
    assert.strictEqual(finding.confirmacao_autora, 'pendente');
    assert.strictEqual(finding.situacao, 'aguardando_confirmacao');
    assert.strictEqual(finding.correcao, null);
    assert.strictEqual(finding.reavaliacao, null);
    assert.deepStrictEqual(finding.historico, []);
    assert.deepStrictEqual(Object.keys(finding.versao_codigo), ['frontend', 'backend', 'alteracoes_locais']);
  }
  const report = fs.readFileSync(base + '/relatorio-backend.md', 'utf8');
  const checkedLinks = [];
  for (const match of report.matchAll(/\]\(([^)]+)\)/g)) {
    const link = match[1];
    if (/^https?:|^#/.test(link)) continue;
    if (link === 'evidencias/EV06_conferencia_documental.json') continue;
    assert(fs.existsSync(path.resolve(base, link)), 'Referência ausente: ' + link);
    checkedLinks.push(link);
  }
  const referencedIds = [...new Set(report.match(/REV-\d{2}-BE-A\d{3}/g) || [])];
  assert(referencedIds.every((id) => ids.has(id) || prior.achados.some((finding) => finding.id === id)));
  const discoveryArgs = ['node_modules/jest/bin/jest.js', '--runInBand', '--coverage=false', '--listTests', '--json'];
  const discovery = spawnSync(process.execPath, discoveryArgs, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  assert.strictEqual(discovery.status, 0, discovery.stderr);
  const discovered = JSON.parse(discovery.stdout.trim());
  assert.strictEqual(discovered.length, 18);
  assert(discovered.every((name) => name.includes(path.sep + 'tests' + path.sep)));

  const logs = ['EV03_sondas_complementares.txt', 'EV03b_sondas_complementares_ajustadas.txt', 'EV03c_sondas_arquivadas.txt'];
  const probeSchemas = logs.flatMap((name) => {
    const log = fs.readFileSync(base + '/evidencias/' + name, 'utf8');
    return [...log.matchAll(/"schema":"(eleva_test_\d+_[a-f0-9]+)"/g)].map((match) => match[1]);
  });
  const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });
  let environment;
  try {
    const schemas = await pool.query("SELECT nspname FROM pg_namespace WHERE nspname LIKE 'eleva_test_%' ORDER BY nspname");
    assert(!schemas.rows.some((row) => probeSchemas.includes(row.nspname)), 'Schema das sondas não removido.');
    environment = {
      fonte_url: process.env.TEST_DATABASE_URL ? 'TEST_DATABASE_URL' : 'DATABASE_URL',
      consulta_somente_leitura: "SELECT nspname FROM pg_namespace WHERE nspname LIKE 'eleva_test_%' ORDER BY nspname",
      schemas_das_sondas: probeSchemas,
      schemas_das_sondas_removidos: true,
      schemas_temporarios_restantes: schemas.rows.map((row) => row.nspname),
    };
  } finally {
    await pool.end();
  }
  const preservation = read(base + '/evidencias/EV05_preservacao.json');
  assert(preservation.commit_preservado && preservation.rev01_preservada);
  assert.deepStrictEqual(preservation.arquivos_alterados, []);
  const manifest = read(base + '/evidencias/EV01_manifesto_antes.json');
  const snapshot = read(base + '/evidencias/EV01_codigo_e_instrumentos.snapshot.json');
  for (const [name, content] of Object.entries(snapshot)) {
    assert.strictEqual(sha(Buffer.from(content, 'utf8')), manifest.arquivos_protegidos[name], 'Snapshot divergente: ' + name);
  }
  const archive = read(base + '/evidencias/EV03_arquivamento_scripts.json');
  for (const entry of archive.scripts) {
    assert.strictEqual(sha(fs.readFileSync(base + '/evidencias/' + entry.arquivo_preservado)), entry.sha256);
  }
  const fileHashes = {};
  function collect (dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(name);
      else fileHashes[name.split(path.sep).join('/')] = sha(fs.readFileSync(name));
    }
  }
  collect(base);
  const result = {
    rodada: 'REV-02', execucao: 'r01', data_referencia_autora: '2026-11-07',
    instante_utc_sistema: new Date().toISOString(),
    formato_json_e_ordem_dos_campos: 'conforme modelo 06',
    novos_ids: [...ids], ids_anteriores_referenciados: referencedIds.filter((id) => !ids.has(id)),
    confirmacao_humana_presumida: false, consolidado_criado: fs.existsSync('avaliacao/achados.json'),
    links_conferidos: [...new Set(checkedLinks)],
    arquivos_do_snapshot_conferidos: Object.keys(snapshot).length,
    comando_descoberta_padrao: 'node ' + discoveryArgs.join(' '),
    descoberta_padrao_saida: discovery.status, descoberta_padrao_suites: discovered.length,
    sondas_fora_da_descoberta_padrao: true,
    ambiente: environment, preservacao: 'EV05_preservacao.json',
    sha256_arquivos_da_rodada_antes_desta_conferencia: fileHashes,
    resultado: 'passou',
  };
  assert.strictEqual(result.consolidado_criado, false);
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log('Conferência passou: JSON, IDs, links, snapshots, preservação, 18 suítes na descoberta padrão e remoção dos schemas das sondas.');
  console.log('Schemas temporários restantes: ' + JSON.stringify(environment.schemas_temporarios_restantes));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
