/* Execute na raiz do repositório. Evidências compartilhadas da reavaliação dos 12 achados da REV-01. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');
const { execFileSync, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '../../../../..');
assert.strictEqual(process.cwd(), root);
const relative = path.relative(root, __dirname).split(path.sep).join('/');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const save = (name, contents) => fs.writeFileSync(path.join(__dirname, name), contents, { flag: 'wx' });
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const outputs = ['EV00_contexto.json', 'EV01_suite_completa.txt', 'EV01_resultados_jest.json', 'EV02_eslint.txt'];
outputs.forEach((name) => assert(!fs.existsSync(path.join(__dirname, name)), 'Não sobrescrever evidência existente: ' + name));

const files = git('ls-files', '-z').split('\0').filter(Boolean);
const before = Object.fromEntries(files.map((file) => [file, sha(file)]));
const commit = git('rev-parse', 'HEAD');
const status = git('status', '--short', '--untracked-files=all');
const started = new Date().toISOString();
const versions = Object.fromEntries(['jest', 'supertest', 'sequelize', 'pg', 'joi', 'eslint']
  .map((name) => [name, require(name + '/package.json').version]));

function run (filename, args) {
  const start = new Date().toISOString();
  const result = spawnSync(process.execPath, args, {
    cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  const output = (result.stdout || '') + (result.stderr || '');
  save(filename, [
    'REV-02 — reavaliação dos achados REV-01-BE-A001 a REV-01-BE-A012.',
    'Data de referência da autora: 2026-11-07.',
    'Commit verificado: ' + commit,
    'Alteração local preexistente: package-lock.json; dependências não instaladas/modificadas nesta execução.',
    'Ambiente: ' + process.platform + ' ' + process.arch + '; Node ' + process.version,
    'Ferramentas: ' + JSON.stringify(versions),
    'Dados fictícios; PostgreSQL real em schemas exclusivos eleva_test_*; migrations reais por suíte.',
    'Limpeza de classes antes de schools/sectors; fechamento de Sequelize/pg e remoção somente do schema da suíte.',
    'Comando: node ' + args.join(' '),
    'Início UTC do sistema: ' + start,
    'Fim UTC do sistema: ' + new Date().toISOString(),
    'Código de saída: ' + result.status + '; sinal: ' + result.signal,
    result.error ? 'Erro ao executar: ' + result.error.message : '',
    output,
  ].join('\n'));
  console.log(filename + ': saída ' + result.status);
  console.log(output.slice(-1500));
  return { comando: 'node ' + args.join(' '), saida: result.status, sinal: result.signal };
}

const suite = run('EV01_suite_completa.txt', [
  'node_modules/jest/bin/jest.js', '--runInBand', '--roots', 'tests',
  '--coverage=false', '--detectOpenHandles', '--verbose', '--json',
  '--outputFile=' + relative + '/EV01_resultados_jest.json',
]);
const lint = run('EV02_eslint.txt', ['node_modules/eslint/bin/eslint.js', 'src', 'tests']);
const changed = files.filter((file) => !fs.existsSync(file) || sha(file) !== before[file]);
save('EV00_contexto.json', json({
  rodada: 'REV-02', atividade: 'Reavaliação dos 12 achados da REV-01 para atualização do consolidado',
  data_referencia_autora: '2026-11-07', inicio_utc_sistema: started, fim_utc_sistema: new Date().toISOString(),
  solicitacao: 'agora pode atualizar o REV-01 com as correções que foram feitas. de preferencia guarda junto a identificação do commit que implementou cada correção. as evidencias você pode guardar na REV-02 e fazer referencia à localização nela dentro do registro que você está atualizando.\n\nConfira as correções dos achados indicados. Preserve os registros originais da revisão. Execute os testes pertinentes disponíveis, salve a saída e atualize os respectivos achados no JSON consolidado com a versão verificada, o procedimento, o resultado e o caminho da evidência. Reutilize o mesmo log quando ele abranger vários achados, identificando o teste de cada um. Separe, ao final, apenas as verificações que dependem de mim.',
  commit, branch: git('branch', '--show-current'), estado_inicial: status,
  node: process.version, plataforma: process.platform, arquitetura: process.arch, ferramentas: versions,
  alteracao_preexistente: { arquivo: 'package-lock.json', sha256: before['package-lock.json'], diff_numstat: git('diff', '--numstat', '--', 'package-lock.json') },
  suite, eslint: lint,
  preservacao: {
    algoritmo: 'SHA256', arquivos_versionados_antes: before,
    arquivos_versionados_alterados: changed,
    commit_preservado: git('rev-parse', 'HEAD') === commit,
    indice_git_preservado: git('diff', '--cached', '--name-only') === '',
    observacao: 'Somente novas evidências nesta pasta; fontes, testes, migrations, seeds, instrumentos e revisões existentes preservados.',
  },
}));
assert.strictEqual(suite.saida, 0, 'A suíte falhou; consultar a evidência antes de atualizar os achados.');
assert.strictEqual(lint.saida, 0, 'O ESLint falhou.');
assert.deepStrictEqual(changed, [], 'Um arquivo versionado foi alterado durante a execução.');
