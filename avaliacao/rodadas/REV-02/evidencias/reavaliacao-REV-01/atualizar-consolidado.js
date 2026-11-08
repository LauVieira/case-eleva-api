/* Consolida os registros existentes e acrescenta a conferência das correções da REV-01. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '../../../../..');
assert.strictEqual(process.cwd(), root);
const base = path.relative(root, __dirname).split(path.sep).join('/');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, contents) => fs.writeFileSync(file, contents, { flag: 'wx' });
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const context = read(base + '/EV00_contexto.json');
const results = read(base + '/EV01_resultados_jest.json');
const review1 = read('avaliacao/rodadas/REV-01/achados-backend.json');
const review2 = read('avaliacao/rodadas/REV-02/achados-backend.json');
const model = read('avaliacao/06_Modelo_Achados.json').achados[0];
const target = 'avaliacao/achados.json';
assert(!fs.existsSync(target), 'O consolidado já existe; não substituir um acompanhamento existente.');
assert.strictEqual(context.suite.saida, 0);
assert.strictEqual(context.eslint.saida, 0);
assert(results.success && results.numFailedTests === 0 && results.numPendingTests === 0);
assert.strictEqual(results.numPassedTests, 430);
assert.deepStrictEqual(results.openHandles, []);
assert.strictEqual(git('rev-parse', 'HEAD'), context.commit);

const logs = base + '/EV01_suite_completa.txt';
const lint = base + '/EV02_eslint.txt';
const inspection = base + '/EV03_commits_e_inspecao.txt';
const mapping = base + '/EV04_mapeamento_achados.json';
const fullVersion = {
  frontend: null, backend: context.commit,
  alteracoes_locais: 'Fontes, testes, migrations, seeds e configurações correspondem ao commit verificado. Apenas package-lock.json já estava modificado; SHA256 e ambiente instalado em ' + base + '/EV00_contexto.json. Esta reavaliação acrescenta somente registros de avaliação; não instala dependências nem altera código.',
};
const integration = (name, pattern = null) => ['tests/integration/' + name + '.test.js', pattern];
const unit = (name, pattern = null) => ['tests/utils/' + name + '.test.js', pattern];

const definitions = [
  {
    number: '001', commits: ['4070cfc', '17d1eec', '70208d6', '9631627', 'f2457d7', '30b4124'],
    correction: 'A refatoração foi distribuída pelos cinco commits de migração das rotas existentes para controllers, services e repositories; 30b4124 centralizou as relações nos models. A inspeção atual confirma o mesmo fluxo nas operações acrescentadas depois.',
    method: 'Inspeção dos imports e chamadas de routers/controllers/services/repositories e comparação com os diffs dos commits; regressão HTTP das rotas originalmente existentes em schools.test.js e sectors.test.js. Testes HTTP sustentam a ausência de regressão funcional; a conclusão sobre AR01 vem da inspeção de dependências.',
    expected: 'Controllers delegam aos services; services coordenam repositories; acesso aos models/banco fica nos repositories, sem regressão das rotas originais.',
    observed: 'Nenhum controller importa model ou repository; services importam repositories e schemas/utils; consultas e gravações ficam nos repositories. As duas suítes HTTP originais passaram.',
    tests: [integration('schools'), integration('sectors')], pending: null,
    limits: 'Resultado de arquitetura e regressão do backend; não avalia a interface.',
  },
  {
    number: '002', commits: ['0b29131', '3d00980'],
    correction: '0b29131 antecipou a sanitização à validação; 3d00980 completou a normalização de caixa/espaços antes dos limites, consulta de duplicidade e gravação.',
    method: 'Execução dos casos de nome vazio após limpeza, espaços, tags e nomes coincidentes após normalização; conferência de 422/409 e ausência de gravação ou alteração do registro original.',
    expected: 'Nome vazio após sanitização recebe 422 sem inserção; nomes coincidentes após limpeza/normalização recebem 409 e preservam o registro original.',
    observed: 'Os casos de tag vazia, somente espaços e colisões após sanitização/normalização passaram, incluindo duas criações concorrentes do mesmo nome.',
    tests: [integration('schools.empty-name'), integration('schools.names'), integration('schools', /name|sanitis|case or internal/i)], pending: null,
    limits: 'A colisão concorrente de nomes foi exercitada no PostgreSQL; não equivale a controle de edições simultâneas da mesma turma.',
  },
  {
    number: '003', commits: ['3d00980'],
    correction: '3d00980 implementou limites de campos, opcionais nulos, telefone canônico estritamente textual, normalização/unicidade global e IDs inteiros válidos de setor existente; o valor convertido retornado pelo Joi é utilizado.',
    method: 'Execução de schools.contract.test.js e schools.names.test.js; teste de setor inexistente; conferência dos limites e nulabilidade reais do banco. Inclui fronteiras de tamanho, opcionais omitidos/nulos, máscara e tipo do telefone, IDs decimais/exponenciais válidos e identificadores inválidos sem gravação.',
    expected: 'Cadastro persiste apenas dados conformes, aceita opcionais nulos e IDs numéricos convertíveis, rejeita entradas inválidas com 422 e duplicatas normalizadas com 409.',
    observed: 'Todos os casos do contrato e nomes passaram; setor inexistente recebeu 422 sem escola gravada; limites e opcionais do banco conferem com o contrato.',
    tests: [integration('schools.contract'), integration('schools.names'), integration('schools.missing-sector'), integration('persistence.contract', /limites e campos opcionais/)], pending: null,
    limits: 'A conversão de strings numéricas por Joi segue a decisão da autora já registrada; telefone permanece estrito. O desaparecimento concorrente de setor continua excluído por DEC01.',
  },
  {
    number: '004', commits: ['434c7f0', '3d00980'],
    correction: '434c7f0 passou a devolver a mensagem específica de validação. 3d00980 completou orientação em português, validação de IDs e setor, tradução de conflito concorrente e respostas JSON seguras para falhas inesperadas e JSON malformado.',
    method: 'Execução dos casos de campo inválido, setor inexistente, explicação dos campos/IDs/filtros, unicidade concorrente, JSON malformado e falha inesperada; conferência do corpo HTTP e da preservação do banco.',
    expected: '422 identifica o campo e orienta a correção; 404/409 distinguem os casos; 400 e 500 respondem JSON sem SQL/detalhes internos; entradas rejeitadas não gravam dados.',
    observed: 'As mensagens específicas, códigos HTTP, JSON seguro e verificações de ausência de gravação passaram, inclusive no conflito de unicidade concorrente.',
    tests: [integration('schools.validation-errors'), integration('schools.missing-sector'), integration('contracts.verification', /identifica|explica/), integration('persistence.contract', /responde/), integration('schools.names', /concorrentes/), integration('schools.contract', /rejeita identificador|mantém 404|valida e converte os IDs/)],
    pending: 'No frontend, conferir apresentação das mensagens, identificação dos campos, orientação de correção e preservação do preenchimento. Leitura de erros pelo NVDA pertence à avaliação final.',
    limits: 'O backend foi conferido; apresentação, foco e anúncio dos erros exigem a interface. Mantida a exclusão DEC01 sobre desaparecimento concorrente de setor.',
  },
  {
    number: '005', commits: ['2247d7d', 'bf5acdd'],
    correction: '2247d7d implementou PATCH /schools/:id com validação do estado resultante, edição parcial, mudança de setor, limpeza de opcionais, preservação de createdAt e atualização de updatedAt. bf5acdd corrigiu a sanitização compartilhada para impedir campos herdados de __proto__, com regressão específica de PATCH de escola.',
    method: 'Execução dos 52 casos de schools.patch.test.js e da regressão de __proto__ no PATCH de escola; leitura posterior do PostgreSQL, GET e comparação com registros não envolvidos.',
    expected: 'PATCH mantém campos omitidos e createdAt, permite limpar opcionais e manter o próprio nome; muda setor sem mover turmas; valida o estado completo e rejeita conflitos/entradas inválidas sem alteração indevida.',
    observed: 'Os 52 casos de edição e a regressão de __proto__ passaram; mudanças de setor conservaram turmas/capacidade e as rejeições preservaram os dados esperados.',
    tests: [integration('schools.patch'), integration('sanitisation.contract', /PATCH de escola/)], pending: null,
    limits: 'A reavaliação cobre a implementação e a persistência da API.',
  },
  {
    number: '006', commits: ['0aad9b8'],
    correction: '0aad9b8 implementou DELETE /schools/:id: 204 para escola sem turmas; 409 com orientação para remover turmas vinculadas, independentemente de situação/capacidade; tradução da proteção de FK se uma turma surgir após a checagem.',
    method: 'Execução dos 20 casos de schools.delete.test.js, incluindo current/completed com capacidades 20 e zero, exclusão após remover todas as turmas, IDs/404, falhas de persistência e inserção entre checagem e DELETE; conferência das três tabelas.',
    expected: 'Excluir somente escola sem turmas; bloquear qualquer vínculo com mensagem compreensível e preservar escola/turmas; manter FK e demais registros.',
    observed: 'Os 20 casos passaram: exclusão retornou 204 quando permitida e vínculos bloquearam a operação com 409, inclusive na corrida de FK simulada pelo teste com gravação real.',
    tests: [integration('schools.delete')],
    pending: 'Na interface, verificar confirmação e cancelamento da exclusão de escola, identificação do registro e foco; o backend não executa a confirmação humana.',
    limits: 'Confirmação/cancelamento e foco são verificações de interface, não impedimentos ao encerramento técnico da API.',
  },
  {
    number: '007', commits: ['0fec08c', '8c169cd', '4ea7132', '88999fc', 'bf5acdd'],
    correction: '0fec08c implementou cadastro de turma; 8c169cd, PATCH; 4ea7132, DELETE; 88999fc, consulta individual com nome da escola. O cadastro exige status, o PATCH preserva createdAt e rejeita schoolId. bf5acdd completou a proteção da sanitização compartilhada, com regressões de cadastro e edição.',
    method: 'Execução integral de classes.create/patch/delete/details.test.js e das três regressões de sanitização para turmas; confirmação de corpo/status HTTP, vínculo, timestamps, persistência e efeitos sobre filtros/capacidade.',
    expected: 'Disponibilizar cadastro, consulta individual, edição e exclusão com contrato validado, status explícito, vínculo imutável na API, datas preservadas e erros sem gravação indevida.',
    observed: 'Passaram 83 casos de cadastro, 62 de edição, 18 de exclusão, 15 de consulta individual e as três regressões de sanitização de turmas.',
    tests: [integration('classes.create'), integration('classes.patch'), integration('classes.delete'), integration('classes.details'), integration('sanitisation.contract', /turma/)], pending: null,
    limits: 'A concorrência de edições da mesma turma permanece registrada como trabalho futuro na seção 7.1 dos requisitos; não foi implementada por estes commits.',
  },
  {
    number: '008', commits: ['3d00980'],
    correction: '3d00980 implementou filtro current por padrão e seleção explícita current/completed/all, além de totalCapacity somando somente turmas current da escola consultada, com zero sem ativas.',
    method: 'Execução de classes.filters.test.js e schools.capacity.test.js; complementação com o caso de PATCH que encerra/reativa turma e reflete a mudança nos filtros e no total.',
    expected: 'Listagem respeita situação, ordenação e escola; total soma só ativas e não depende do filtro da lista; alteração de situação atualiza o resultado consultado.',
    observed: 'Os oito casos de filtro, seis de capacidade e o caso de encerramento/reativação via PATCH passaram.',
    tests: [integration('classes.filters'), integration('schools.capacity'), integration('classes.patch', /encerra e reativa turma/)],
    pending: 'No frontend, verificar seleção visual/programática do filtro e apresentação do total; esses aspectos não foram avaliados pelo backend.',
    limits: 'Há verificação de mudança de situação via API atual, além da preparação por SQL dos testes anteriores. Renderização e acessibilidade permanecem para a interface.',
  },
  {
    number: '009', commits: ['3d00980', '0fec08c', '8c169cd', 'bf5acdd'],
    correction: '3d00980 implementou constantes, opções e combinações no model, status textual sem enum/default, limites e índice único parcial de turma current por escola. 0fec08c e 8c169cd completaram normalização, validação de combinações, capacidade, conflitos e rejeição de schoolId na entrada da API. bf5acdd preservou campos desconhecidos para rejeição pelo schema.',
    method: 'Execução dos testes de persistência/constraints e dos casos de cadastro/edição de turma; conferência de normalização, limites 0 e 2147483647, opções e combinações, duplicatas/reativação, tradução do índice concorrente e rejeição de schoolId.',
    expected: 'Aplicar opções e limites do contrato, normalizar nomes, permitir zero e nomes repetidos entre encerradas/escolas, impedir ativas homônimas com índice parcial e impedir transferência de escola pela API.',
    observed: 'Persistência, constraints e todos os casos de cadastro/edição passaram, incluindo normalização, capacidade zero, incompatibilidade segmento/ano, conflito real de índice e schoolId rejeitado com 422 sem alteração.',
    tests: [integration('persistence.contract'), integration('contracts.verification', /status|chaves estrangeiras/), integration('classes.create'), integration('classes.patch'), integration('sanitisation.contract', /turma/)], pending: null,
    limits: 'A imutabilidade de schoolId exigida em CT01 é da API; não foi criado trigger para proibir UPDATE SQL direto. A corrida de PATCH concorrentes da mesma turma, registrada em 7.1 dos requisitos, permanece trabalho futuro separado e não é declarada corrigida.',
  },
  {
    number: '010', commits: ['3d00980'],
    correction: '3d00980 adequou as seeds para nomes, telefones, segmentos, turnos e datas do contrato, acrescentando exemplos de opcionais nulos, quatro segmentos, situação completed e capacidade zero.',
    method: 'Execução das seeds reais no schema isolado, inspeção dos dados semeados e testes de reversão/reaplicação de todas as seeds e das novas migrations em base vazia.',
    expected: 'Seeds geram dados canônicos e datas preenchidas; exemplos seguem o contrato e reversão/reaplicação funciona no ambiente de teste.',
    observed: 'Passaram a conferência dos dados semeados, a representação dos quatro segmentos e a reversão/reaplicação das seeds e migrations.',
    tests: [integration('persistence.contract', /semeia dados/), integration('contracts.verification', /reverte e reaplica/)],
    pending: 'No banco de uso da aplicação, confirmar a aplicação das migrations e seeds desta versão, se ainda não houver esse registro operacional. A execução atual comprova apenas schemas de teste; não migrou nem semeou public.',
    limits: 'Não se afirma que o banco de uso esteja desatualizado: seu estado não foi verificado. Sem tratamento de dados legados; rollback conferido em schema vazio; seeds não são idempotentes.',
  },
  {
    number: '011', commits: ['ecb20fd', '3d00980'],
    correction: 'ecb20fd corrigiu a limpeza em ordem classes → schools → sectors, o isolamento de schemas e o fechamento de pg/Sequelize; 3d00980 adaptou o helper às novas migrations reais.',
    method: 'Inspeção de tests/auxiliarFunctions.js e execução da suíte de setores contendo escola com turma, seguida dos demais casos com limpeza. Suíte completa executada com detectOpenHandles e sem forceExit; conferência do campo openHandles do resultado Jest.',
    expected: 'Turmas não impedem a limpeza entre testes; schemas são isolados e removidos; pools encerram sem forçar saída nem deixar handles abertos.',
    observed: 'Todos os seis testes de setores e a suíte completa passaram. Jest registrou openHandles=[] e o processo encerrou normalmente com saída zero, sem forceExit.',
    tests: [integration('sectors')], pending: null,
    limits: 'A ausência de handles é a observação desta execução. A remoção de schema é executada pelo afterAll e o processo terminou sem erro de teardown.',
  },
  {
    number: '012', commits: ['ecb20fd', '0b29131', '434c7f0', '3d00980', '2247d7d', '0aad9b8', '0fec08c', '8c169cd', '4ea7132', '88999fc', 'bf5acdd'],
    correction: 'A ampliação começou em ecb20fd e continuou nos commits de correção e de cada operação. As seis operações antes ausentes agora têm suítes de integração; há asserções de mensagens, persistência, normalização, telefone, filtros, capacidade e constraints. O título do teste de sanitiseObj agora corresponde ao retorno null. bf5acdd acrescentou oito regressões da sanitização.',
    method: 'Inspeção das asserções e execução dos 430 testes das 19 suítes disponíveis: mensagens e ausência de gravação nos erros; cadastro/edição/exclusão/consulta, filtros, capacidade, persistência, migrations/seeds e utilitário. Conferência dos resultados estruturados e do encerramento sem handles abertos.',
    expected: 'Disponibilizar e executar regressões para os aspectos originalmente ausentes, incluindo operações posteriormente implementadas; conferir mensagem e estado do banco, e alinhar título/asserção do retorno null.',
    observed: '430 testes passaram em 19 suítes, sem falhas ou testes pendentes; as seis operações têm testes próprios. O teste de entrada não objeto de sanitiseObj descreve e verifica null.',
    tests: 'all',
    pending: 'Confirmação da autora sobre o achado original REV-01-BE-A012. A lacuna técnica de testes foi resolvida no recorte, mas a evidência automatizada não substitui essa decisão humana.',
    limits: 'Não se infere ausência de defeitos nem cobertura de trabalho futuro de concorrência. A confirmação humana pendente foi preservada; não foi criada confirmação em nome da autora.',
  },
];

const hashes = [...new Set(definitions.flatMap((d) => d.commits))];
const commits = Object.fromEntries(hashes.map((hash) => {
  const full = git('rev-parse', hash);
  return [hash, {
    hash: full, assunto: git('show', '-s', '--format=%s', full),
    data_commit: git('show', '-s', '--format=%cI', full),
    arquivos: git('diff-tree', '--no-commit-id', '--name-only', '-r', full).split('\n')
      .filter((file) => /^(src|tests|migrations|seeders|config)\//.test(file) || file === 'jest.config.js'),
  }];
}));
const inspectionLines = [
  'REV-02 — identificação dos commits de correção e inspeção da REV-01.',
  'Data de referência: 2026-11-07; commit conferido: ' + context.commit,
  'Procedimento: git log, git show e git diff-tree para localizar mudanças; leitura dos fontes e testes atuais.',
  'A data do commit não é tratada como data comprovada da implementação local. Git registra autoria de versionamento; participação anterior de ferramentas permanece no histórico dos achados.',
  'Arquivos locais de aplicação/testes/migrations/seeds correspondem ao HEAD; única diferença preexistente: package-lock.json.',
];
for (const hash of hashes) {
  inspectionLines.push('\n' + git('show', '--format=Commit: %H%nData: %cI%nAssunto: %s', '--stat', commits[hash].hash, '--', 'src', 'tests', 'migrations', 'seeders', 'config', 'jest.config.js'));
}
const inspectedFiles = git('ls-files', '-z').split('\0').filter(Boolean)
  .filter((file) => /^(src\/(routers|controllers|services|repositories|models|schemas|constants|utils)|migrations|seeders)\/.+\.js$/.test(file)
    || file === 'src/middlewares/errorHandler.js' || file === 'tests/auxiliarFunctions.js');
for (const file of inspectedFiles) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const fragments = lines.map((line, index) => ({ line, index }))
    .filter(({ line }) => /require\(|async |findBy|findCurrent|update|delete|create|sanitis|normalis|validate|schoolId|status|unique|GRADES|SHIFTS|STATUSES|maxOccupancy|beforeEach|afterAll|DROP SCHEMA|\.close\(|\.end\(|connectionsClosed|classes_current_name_unique/.test(line))
    .map(({ line, index }) => (index + 1) + ': ' + line);
  if (fragments.length) inspectionLines.push('\n' + file + ' — trechos conferidos no commit atual\n' + fragments.join('\n'));
}
inspectionLines.push('\nLimites: rejeição de transferência schoolId é exigida na API por CT01, não por trigger SQL; edições concorrentes da mesma turma permanecem no trabalho futuro da seção 7.1; DEC01 mantém o caso concorrente de setor fora do recorte. Não se executou frontend/NVDA nem preparação do banco de uso.');
save(inspection, inspectionLines.join('\n') + '\n');

const logLines = fs.readFileSync(logs, 'utf8').split(/\r?\n/);
function selectTests (definition) {
  const selectors = definition.tests;
  const selected = [];
  for (const suite of results.testResults) {
    const file = path.relative(root, suite.name).split(path.sep).join('/');
    const spec = selectors === 'all' ? [file, null] : selectors.find(([name]) => name === file);
    if (!spec) continue;
    const suiteLine = logLines.findIndex((line) => line.startsWith('PASS ' + file));
    assert(suiteLine >= 0, 'Suíte não encontrada no log: ' + file);
    const nextSuite = logLines.findIndex((line, index) => index > suiteLine && /^(PASS|FAIL) /.test(line));
    const suiteEnd = nextSuite === -1 ? logLines.length : nextSuite;
    let cursor = suiteLine;
    for (const test of suite.assertionResults) {
      const line = logLines.findIndex((value, index) => index > cursor && index < suiteEnd && value.includes(test.title));
      assert(line >= 0, 'Teste não encontrado no bloco da suíte: ' + test.fullName);
      cursor = line;
      if (spec[1] && !spec[1].test(test.fullName)) continue;
      assert.strictEqual(test.status, 'passed');
      selected.push({ arquivo: file, teste: test.fullName, resultado: 'passou', linha_log: line + 1 });
    }
  }
  assert(selected.length, 'Seleção vazia: ' + definition.number);
  return selected;
}

const consolidated = {
  tipo_documento: 'consolidado', versao_formato: '1.0', rodada: null, execucao: null,
  achados: JSON.parse(JSON.stringify([...review1.achados, ...review2.achados])),
};
const verified = [];
for (const d of definitions) {
  const id = 'REV-01-BE-A' + d.number;
  const finding = consolidated.achados.find((item) => item.id === id);
  assert(finding);
  const selected = selectTests(d);
  const commitList = d.commits.map((hash) => commits[hash]);
  const correctionVersion = { frontend: null, backend: commitList[commitList.length - 1].hash, alteracoes_locais: null };
  const testFiles = [...new Set(selected.map((test) => test.arquivo))];
  const evidence = logs + '; testes deste achado, nomes completos e linhas: ' + mapping + ' (id ' + id + '); histórico Git/inspeção: ' + inspection + '; ESLint: ' + lint;
  finding.correcao = {
    rodada: 'REV-02', versao_codigo: correctionVersion,
    descricao: d.correction + ' Commits de implementação/complementação conferidos: ' + commitList.map((commit) => commit.hash + ' (' + commit.assunto + ')').join('; ') + '. Associação retrospectiva; nenhuma alteração de código nesta reavaliação.',
    responsavel: 'Correções já versionadas no histórico Git; associação entre commits e achados conferida por Codex. Participação anterior de ferramentas preservada nos registros originais.',
    evidencia: mapping + ' (id ' + id + '); ' + inspection,
  };
  finding.reavaliacao = {
    rodada: 'REV-02', versao_codigo: { ...fullVersion },
    metodo: d.method + ' Testes deste achado: ' + testFiles.join(', ') + ' (' + selected.length + ' casos aprovados, identificados por nome completo e linha em EV04_mapeamento_achados.json). ' + d.observed + ' Execução compartilhada: 430/430 testes, 19/19 suítes, 0 falhas/pendentes, saída 0, detectOpenHandles sem forceExit; openHandles=[]. ESLint src/tests: saída 0. Ambiente PostgreSQL real e schemas isolados; comando/versões em EV00_contexto.json. Limites: ' + d.limits,
    responsavel: 'Codex — inspeção de código, histórico Git e execução automatizada solicitadas pela autora',
    resultado: 'resolveu_no_recorte', evidencia: evidence,
  };
  finding.verificacao_pendente = d.pending;
  finding.situacao = 'resolvido_no_recorte';
  finding.historico.push({
    data: '2026-11-07', rodada: 'REV-02', evento: 'identificacao_dos_commits_da_correcao',
    responsavel: 'Codex — conferência retrospectiva do histórico Git', versao_codigo: correctionVersion,
    resultado: d.correction + ' Commits: ' + commitList.map((commit) => commit.hash).join(', ') + '. Fontes já corrigidos antes desta reavaliação; não foi criada nova implementação nem atribuição de confirmação humana.',
    evidencia: mapping + ' (id ' + id + '); ' + inspection,
  }, {
    data: '2026-11-07', rodada: 'REV-02', evento: 'reavaliacao_das_correcoes_REV_01',
    responsavel: 'Codex — inspeção e execução automatizada', versao_codigo: { ...fullVersion },
    resultado: 'resolveu_no_recorte. ' + d.observed + ' Seleção deste achado: ' + selected.length + ' casos aprovados; suíte compartilhada 430/430, 19 suítes, saída 0, sem handles abertos; ESLint saída 0. Limites: ' + d.limits,
    evidencia: evidence,
  });
  verified.push({
    id, versao_verificada: { ...fullVersion }, commits_correcao: commitList,
    procedimento: d.method, esperado: d.expected, observado: d.observed,
    resultado: 'resolveu_no_recorte', evidencia_compartilhada: logs,
    testes_identificados: selected, limites: d.limits, verificacao_dependente_autora: d.pending,
  });
}
save(mapping, json({
  rodada: 'REV-02', atividade: 'Reavaliação da REV-01', data_referencia: '2026-11-07',
  versao_verificada: fullVersion, log_compartilhado: logs,
  resultado_jest_estruturado: base + '/EV01_resultados_jest.json',
  total: { testes: results.numTotalTests, aprovados: results.numPassedTests, suites: results.numPassedTestSuites, falhas: results.numFailedTests, pendentes: results.numPendingTests, openHandles: results.openHandles },
  observacao: 'As seleções se sobrepõem entre achados; os totais por achado não devem ser somados como execuções distintas. A012 relaciona todos os 430 testes. Versão em correcao é o último commit relacionado à implementação/complementação; versão em reavaliacao é o HEAD efetivamente executado. Não são snapshots de achados.',
  achados: verified,
}));

const stableFields = Object.keys(model).filter((key) => !['verificacao_pendente', 'situacao', 'correcao', 'reavaliacao', 'historico'].includes(key));
assert.strictEqual(new Set(consolidated.achados.map((a) => a.id)).size, consolidated.achados.length);
for (const original of review1.achados) {
  const current = consolidated.achados.find((a) => a.id === original.id);
  stableFields.forEach((key) => assert.deepStrictEqual(current[key], original[key], original.id + '/' + key));
  assert.deepStrictEqual(current.historico.slice(0, original.historico.length), original.historico);
  assert.strictEqual(current.historico.length, original.historico.length + 2);
}
for (const original of review2.achados) assert.deepStrictEqual(consolidated.achados.find((a) => a.id === original.id), original);
consolidated.achados.forEach((finding) => {
  assert.deepStrictEqual(Object.keys(finding), Object.keys(model));
  for (const event of finding.historico) assert.deepStrictEqual(Object.keys(event), ['data', 'rodada', 'evento', 'responsavel', 'versao_codigo', 'resultado', 'evidencia']);
});
Object.keys(context.preservacao.arquivos_versionados_antes).forEach((file) => {
  assert.strictEqual(sha(file), context.preservacao.arquivos_versionados_antes[file], 'Arquivo original alterado: ' + file);
});
save(target, json(consolidated));
assert.deepStrictEqual(read(target), consolidated);
save(base + '/EV05_conferencia_consolidado.json', json({
  rodada: 'REV-02', data_referencia: '2026-11-07', commit: context.commit,
  consolidado: target, sha256_consolidado: sha(target), total_achados: consolidated.achados.length,
  ids_reavaliados: verified.map((v) => v.id), registros_revisao_preservados: true,
  historicos_anteriores_preservados: true, identificacao_descricao_e_evidencia_originais_preservadas: true,
  confirmacoes_humanas_preservadas: true, nenhum_snapshot_de_achado_criado: true,
  referencia_evidencias_novas: [logs, base + '/EV01_resultados_jest.json', lint, inspection, mapping, base + '/EV00_contexto.json']
    .map((file) => { assert(fs.existsSync(file)); return { arquivo: file, sha256: sha(file) }; }),
  originais: ['avaliacao/rodadas/REV-01/achados-backend.json', 'avaliacao/rodadas/REV-02/achados-backend.json']
    .map((file) => ({ arquivo: file, sha256: sha(file) })),
  arquivos_versionados_conferidos: Object.keys(context.preservacao.arquivos_versionados_antes).length,
  resultado: '12 achados da REV-01 tecnicamente resolvidos no recorte; A012 conserva confirmacao_autora=pendente. O achado da REV-02 foi incorporado sem alteração. Arquivos originais de ambas as revisões preservados.',
}));
console.log(JSON.stringify({ consolidado: target, achados: consolidated.achados.length, reavaliados: verified.map((v) => ({ id: v.id, testes: v.testes_identificados.length, ultimo_commit_correcao: v.commits_correcao.slice(-1)[0].hash.slice(0, 7) })), confirmacao_A012: consolidated.achados.find((a) => a.id === 'REV-01-BE-A012').confirmacao_autora }, null, 2));
