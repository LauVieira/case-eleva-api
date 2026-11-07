/* Executa o script arquivado como texto sem acrescentar suítes à descoberta padrão. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

const evidence = 'avaliacao/rodadas/REV-02/evidencias';
const name = process.argv[2] || 'EV03c_sondas_arquivadas.txt';
assert(/^[A-Za-z0-9_-]+\.txt$/.test(name), 'Informe um nome de log simples com extensão txt.');
const outputPath = path.join(evidence, name);
assert(!fs.existsSync(outputPath), 'Não sobrescrever evidência encerrada.');
const args = ['node_modules/jest/bin/jest.js', '--runInBand', '--roots', evidence,
  '--coverage=false', '--detectOpenHandles', '--verbose',
  '--testMatch', '**/sondas-handover-ajustadas.test.js.txt',
  '--moduleFileExtensions', 'js', 'json', 'node', 'txt',
  '--runTestsByPath', evidence + '/sondas-handover-ajustadas.test.js.txt'];
const start = new Date().toISOString();
const result = spawnSync(process.execPath, args, {
  encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: '0' },
});
const output = (result.stdout || '') + (result.stderr || '');
fs.writeFileSync(outputPath, [
  'REV-02 / r01; data de referência da autora: 2026-11-07.',
  'Versão e hashes: EV01_manifesto_antes.json.',
  'Reprodução do mesmo conteúdo de EV03b, arquivado como texto com SHA256 preservado.',
  'Mapeamento dos nomes originais: EV03_arquivamento_scripts.json.',
  'A extensão txt evita descoberta automática pelo comando npm test. Opções de descoberta alteradas somente nesta chamada.',
  'Esperado: 35 casos de contrato, incluindo rejeição 422 e ausência de mutação nos três S06.',
  'Comando: node ' + args.join(' '), 'Início UTC do sistema: ' + start,
  'Fim UTC do sistema: ' + new Date().toISOString(), 'Código de saída: ' + result.status,
  output,
].join('\n'), { flag: 'wx' });
console.log(output.slice(-1200));
console.log('Evidência: ' + outputPath + '; saída: ' + result.status);
process.exitCode = result.status === null ? 1 : result.status;
