const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');
const { execFileSync, spawnSync } = require('child_process');

const [wave, phase, target, suffix = '', coverage = ''] = process.argv.slice(2);
assert(['antes', 'depois'].includes(phase));
assert(/^[a-z_]*$/.test(suffix));
assert(['', 'cobertura'].includes(coverage));
const plan = require('./plano.json').levas[wave];
assert(plan);
const prefix = `avaliacao/rodadas/REV-01/evidencias/LEVA${wave}_${phase}${suffix ? `_${suffix}` : ''}`;
assert(!fs.existsSync(`${prefix}.txt`), 'Não sobrescrever evidências encerradas.');
const files = {};
function collect (directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(filename);
    else if (filename.endsWith('.js')) files[filename.split(path.sep).join('/')] = fs.readFileSync(filename, 'utf8');
  }
}
['src', 'tests', 'migrations', 'seeders'].forEach(collect);
const snapshot = JSON.stringify(files, null, 2) + '\n';
fs.writeFileSync(`${prefix}.snapshot.json`, snapshot, { flag: 'wx' });
const version = {
  frontend: null,
  backend: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  alteracoes_locais: `Estado exato de src, testes, migrations e seeds em ${prefix}.snapshot.json; SHA256 ${crypto.createHash('sha256').update(snapshot).digest('hex')}. package-lock.json já modificado antes destas levas; nenhuma credencial incluída.`,
};
const args = ['node_modules/jest/bin/jest.js', '--runInBand', `--coverage=${coverage === 'cobertura'}`, '--detectOpenHandles', '--verbose'];
if (target && target !== 'all') args.push('--runTestsByPath', target);
const result = spawnSync(process.execPath, args, { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } });
const output = (result.stdout || '') + (result.stderr || '');
const passed = result.status === 0;
const log = [
  `Leva ${wave}, ${phase} — ${plan.descricao}`, `Data de acompanhamento: 2026-11-07; execução UTC: ${new Date().toISOString()}`,
  `Achados relacionados: ${plan.achados.join(', ')}`, `Versão: ${JSON.stringify(version)}`,
  `Node: ${process.version}; Jest: ${require('jest/package.json').version}`,
  'Ambiente: PostgreSQL real; schema exclusivo por suíte, sem limpeza do schema public.',
  `Comando: node ${args.join(' ')}`, `Código de saída: ${result.status}`, output,
].join('\n');
fs.writeFileSync(`${prefix}.txt`, log, { flag: 'wx' });
const findingPath = 'avaliacao/rodadas/REV-01/achados-backend.json';
const document = JSON.parse(fs.readFileSync(findingPath, 'utf8'));
for (const finding of document.achados.filter(item => plan.achados.includes(item.id))) {
  const verified = passed ? 'resolveu_no_recorte' : 'persiste';
  finding.reavaliacao = {
    rodada: 'REV-01', versao_codigo: version,
    metodo: `Leva ${wave}: ${plan.descricao} Comando node ${args.join(' ')}. Testes individuais e resultado completo identificados no log. Este resultado se limita aos casos desta leva, sem aprovação global dos demais aspectos do achado.`,
    responsavel: 'Codex — execução automatizada', resultado: verified, evidencia: `${prefix}.txt`,
  };
  if (phase === 'depois' && passed) finding.correcao = {
    rodada: 'REV-01', versao_codigo: version, descricao: `Leva ${wave}: ${plan.descricao} Intervenção autorizada pela autora; escopo restrito às funcionalidades existentes.`,
    responsavel: 'Codex', evidencia: `${prefix}.txt`,
  };
  if (finding.confirmacao_autora === 'confirmado') finding.situacao = 'em_correcao';
  finding.historico.push({
    data: '2026-11-07', rodada: 'REV-01', evento: `leva_${wave}_${phase}${suffix ? `_${suffix}` : ''}`, responsavel: 'Codex', versao_codigo: version,
    resultado: `${verified}: leva ${wave}, ${phase}; saída ${result.status}. ${phase === 'antes' ? 'Expectativa de falha anterior à implementação.' : 'Intervenção e verificação do recorte; demais aspectos exigem avaliação separada.'} ${finding.confirmacao_autora === 'pendente' ? 'Confirmação humana do achado permanece pendente.' : ''}`,
    evidencia: `${prefix}.txt`,
  });
}
fs.writeFileSync(findingPath, JSON.stringify(document, null, 2) + '\n');
console.log(output.slice(-5500));
console.log(`Registro: ${prefix}.txt; saída ${result.status}`);
process.exitCode = phase === 'antes' ? (passed ? 2 : 0) : result.status;
