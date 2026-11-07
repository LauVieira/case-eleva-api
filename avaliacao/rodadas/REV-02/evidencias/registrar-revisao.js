/* Registro reproduzível da REV-02. Não altera a aplicação nem os registros da REV-01. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');
const { execFileSync, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '../../../..');
assert.strictEqual(process.cwd(), root, 'Execute a partir da raiz do repositório.');
const evidence = path.relative(root, __dirname).split(path.sep).join('/');
const hash = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const save = (name, value) => fs.writeFileSync(path.join(__dirname, name), value, { flag: 'wx' });
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

function protectedFiles () {
  return git('ls-files', '-z').split('\0').filter(Boolean)
    .filter((name) => !name.startsWith('avaliacao/rodadas/REV-02/'))
    .concat(fs.existsSync('HANDOVER.md') ? ['HANDOVER.md'] : [])
    .sort();
}

function fingerprints () {
  return Object.fromEntries(protectedFiles().map((name) => [name, hash(fs.readFileSync(name))]));
}

function prepare () {
  const files = fingerprints();
  save('EV01_manifesto_antes.json', json({
    rodada: 'REV-02', execucao: 'r01', data_referencia_autora: '2026-11-07',
    instante_utc_sistema: new Date().toISOString(),
    commit: git('rev-parse', 'HEAD'), branch: git('branch', '--show-current'),
    status_antes: git('status', '--short', '--untracked-files=all'),
    node: process.version, plataforma: process.platform, arquitetura: process.arch,
    ferramentas: Object.fromEntries(['jest', 'supertest', 'sequelize', 'pg', 'joi', 'eslint']
      .map((name) => [name, require(name + '/package.json').version])),
    algoritmo: 'SHA256', arquivos_protegidos: files,
  }));
  const copyNames = Object.keys(files).filter((name) =>
    /^(src|tests|migrations|seeders|config)\//.test(name)
    || ['package.json', 'jest.config.js', '.eslintrc.js', '.env.example', 'HANDOVER.md',
      'avaliacao/01_Regras_e_Requisitos.md', 'avaliacao/03_Review_Backend.md',
      'avaliacao/04_Registro_e_Acompanhamento.md', 'avaliacao/06_Modelo_Achados.json'].includes(name));
  save('EV01_codigo_e_instrumentos.snapshot.json', json(Object.fromEntries(copyNames
    .map((name) => [name, fs.readFileSync(name, 'utf8')]))));
  console.log('Versão e hashes preservados; ' + copyNames.length + ' arquivos copiados sem credenciais.');
}

function run (kind) {
  const definitions = {
    suite: ['EV02_suite_completa.txt', [
      'node_modules/jest/bin/jest.js', '--runInBand', '--roots', 'tests',
      '--coverage=true', '--coverageDirectory=' + evidence + '/coverage',
      '--coverageReporters=text', '--coverageReporters=json', '--detectOpenHandles', '--verbose',
    ]],
    sondas: ['EV03_sondas_complementares.txt', [
      'node_modules/jest/bin/jest.js', '--runInBand', '--roots', evidence,
      '--coverage=false', '--detectOpenHandles', '--verbose', '--runTestsByPath',
      evidence + '/sondas-handover.test.js',
    ]],
  };
  assert(definitions[kind], 'Execução desconhecida.');
  const [name, args] = definitions[kind];
  assert(!fs.existsSync(path.join(__dirname, name)), 'Não sobrescrever execução encerrada.');
  const started = new Date().toISOString();
  const result = spawnSync(process.execPath, args, {
    cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  const output = (result.stdout || '') + (result.stderr || '');
  save(name, [
    'Rodada REV-02, execução r01; data de referência da autora: 2026-11-07.',
    'Commit: ' + git('rev-parse', 'HEAD'),
    'Estado de referência e hashes: EV01_manifesto_antes.json.',
    'Escopo de inspeção: somente as seis operações da seção 3 do HANDOVER.md.',
    'A suíte completa é verificação de regressão; não amplia o escopo da inspeção.',
    'Ambiente: PostgreSQL real, schemas exclusivos por suíte, sem limpeza ou migration de public.',
    'Node: ' + process.version + '; Jest: ' + require('jest/package.json').version,
    'Comando: node ' + args.join(' '),
    'Início UTC do sistema: ' + started,
    'Fim UTC do sistema: ' + new Date().toISOString(),
    'Código de saída: ' + result.status + '; sinal: ' + result.signal,
    result.error ? 'Erro de execução: ' + result.error.message : '', output,
  ].join('\n'));
  console.log(output.slice(-5000));
  console.log('Evidência: ' + evidence + '/' + name + '; saída: ' + result.status);
  process.exitCode = result.status === null ? 1 : result.status;
}

function verify () {
  const before = JSON.parse(fs.readFileSync(path.join(__dirname, 'EV01_manifesto_antes.json'), 'utf8'));
  const after = fingerprints();
  const altered = Object.keys(before.arquivos_protegidos)
    .filter((name) => before.arquivos_protegidos[name] !== after[name]);
  const added = Object.keys(after).filter((name) => !(name in before.arquivos_protegidos));
  const sameCommit = git('rev-parse', 'HEAD') === before.commit;
  save('EV05_preservacao.json', json({
    rodada: 'REV-02', execucao: 'r01', instante_utc_sistema: new Date().toISOString(),
    commit_preservado: sameCommit, arquivos_verificados: Object.keys(after).length,
    arquivos_alterados: altered, arquivos_adicionados_ao_indice: added,
    rev01_preservada: Object.keys(before.arquivos_protegidos)
      .filter((name) => name.startsWith('avaliacao/rodadas/REV-01/'))
      .every((name) => before.arquivos_protegidos[name] === after[name]),
    status_depois: git('status', '--short', '--untracked-files=all'),
  }));
  assert(sameCommit && !altered.length && !added.length, 'Arquivos protegidos mudaram.');
  console.log('Preservados: commit e todos os ' + Object.keys(after).length + ' arquivos protegidos, incluindo REV-01.');
}

const action = process.argv[2];
if (action === 'preparar') prepare();
else if (action === 'verificar') verify();
else run(action);
