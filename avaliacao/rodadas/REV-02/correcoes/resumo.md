# Correção de REV-02-BE-A001 — 07/11/2026

A correção foi aplicada na própria `sanitiseObj`: objetos de saída passaram a ser
criados com `Object.create(null)`. Assim, atribuir uma chave `__proto__` preserva
uma propriedade própria de dados, sem transformar seu conteúdo em propriedades
herdadas. O Joi continua responsável pelas regras dos campos e pela rejeição dos
campos desconhecidos. Arrays continuam sendo arrays; sanitização recursiva,
remoção de HTML e preservação da entrada foram verificadas pelos testes.

A mudança de produção está restrita a uma linha de
`src/utils/generalFunctions.js`. Foram acrescentados quatro casos unitários e
quatro casos de integração permanentes. Eles verificam chaves especiais com
objeto, null e texto, objetos dentro de arrays, mensagens HTTP e preservação dos
registros após rejeição. O README dos testes foi atualizado.

| Execução | Resultado | Evidência |
|---|---|---|
| Novas regressões antes da mudança | 8 falharam e 13 passaram em 2 suítes; saída 1 | [EV01](EV01_regressoes_antes.txt) |
| Suíte completa após a mudança | 430 testes aprovados em 19 suítes; saída 0; detectOpenHandles sem forceExit | [EV02](EV02_suite_depois.txt) |
| Mesmas 35 sondas arquivadas da revisão | 35 aprovadas, incluindo os três casos S06 antes reprovados; saída 0 | [EV03](EV03_sondas_originais_depois.txt) |
| ESLint dos arquivos de código/testes alterados | Saída 0, sem autofix | [EV04](EV04_eslint.txt) |

As expectativas das sondas originais foram mantidas. No cadastro de turma com
somente `__proto__`, a resposta identifica primeiro a ausência de `name`, com 422;
o conteúdo aninhado não fornece os campos obrigatórios. Quando os campos
obrigatórios estão presentes, a chave `__proto__` recebe a mensagem de campo não
permitido, também em 422. Nos PATCH de escola e turma, os corpos testados são
rejeitados e os dados permanecem intactos.

Os testes HTTP usam PostgreSQL real em schemas exclusivos, removidos pelo helper
ao encerrar. Não houve alteração de dependências, schemas de uso ou regras de
negócio. O `package-lock.json` já modificado foi preservado.

Os produtos originais da REV-01 e da REV-02/r01 permanecem preservados por SHA256.
Esta pasta registra a intervenção e sua verificação separadamente, sem
reescrever a revisão emitida. A cópia exata dos arquivos alterados, o patch e o
resultado de preservação estão em [EV05](EV05_validacao_e_preservacao.json).
O registro estruturado da intervenção fica em [registro-correcao.json](registro-correcao.json).
