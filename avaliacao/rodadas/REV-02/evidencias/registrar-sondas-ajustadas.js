const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

const evidence = 'avaliacao/rodadas/REV-02/evidencias';
const filename = path.join(evidence, 'EV03b_sondas_complementares_ajustadas.txt');
assert(!fs.existsSync(filename), 'Não sobrescrever execução encerrada.');
const args = ['node_modules/jest/bin/jest.js', '--runInBand', '--roots', evidence,
  '--coverage=false', '--detectOpenHandles', '--verbose', '--runTestsByPath',
  evidence + '/sondas-handover-ajustadas.test.js'];
const start = new Date().toISOString();
const result = spawnSync(process.execPath, args, {
  encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  env: { ...process.env, FORCE_COLOR: '0' },
});
const output = (result.stdout || '') + (result.stderr || '');
fs.writeFileSync(filename, [
  'REV-02 / r01; data de referência da autora: 2026-11-07.',
  'Commit e hashes: EV01_manifesto_antes.json. Aplicação e testes originais inalterados.',
  'Complemento da execução EV03, preservada integralmente com seu script original.',
  'Correção da preparação de S04: a combinação Ensino Fundamental / 1º ano já era a da fixture original.',
  'Exigir updatedAt renovado ao reenviar os mesmos valores em uma fixture com data nula não demonstrava uma edição efetiva.',
  'Na cópia ajustada, somente esse caso parte de Ensino Médio / 2º ano, garantindo mudança real.',
  'Não houve mudança de expectativa nem correção na aplicação. S06 conserva integralmente as expectativas originais.',
  'Esperado: os 32 casos regulares (S01–S05 e controle S06) passam; os três casos S06 devem rejeitar com 422 e preservar os dados.',
  'Comando: node ' + args.join(' '),
  'Início UTC do sistema: ' + start,
  'Fim UTC do sistema: ' + new Date().toISOString(),
  'Código de saída: ' + result.status,
  output,
].join('\n'), { flag: 'wx' });
console.log(output.slice(-4500));
console.log('Evidência: ' + filename + '; saída: ' + result.status);
process.exitCode = result.status === null ? 1 : result.status;
