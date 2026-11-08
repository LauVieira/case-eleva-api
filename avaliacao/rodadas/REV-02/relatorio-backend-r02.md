# Reavaliação dos achados da REV-01

## Identificação

- Rodada: REV-02; execução: r02.
- Data de referência: 07/11/2026.
- Responsável: Codex, por solicitação da autora. Resultados de testes são automatizados; confirmações humanas anteriores foram conservadas.
- Objetivo: conferir as correções de REV-01-BE-A001 a REV-01-BE-A012 e atualizar seu acompanhamento no consolidado.
- Repositório: case-eleva-api; branch main.
- Commit executado: `bf5acdd54c9370963370db922a4750378414af17`.
- Alteração preexistente: package-lock.json. Nenhuma dependência foi instalada nesta execução; hash do arquivo e versões instaladas constam no contexto.
- Instrumentos: 01_Regras_e_Requisitos.md, 03_Review_Backend.md, 04_Registro_e_Acompanhamento.md e 06_Modelo_Achados.json, na versão do commit conferido.
- Contexto e pedido literal: [EV00_contexto.json](evidencias/reavaliacao-REV-01/EV00_contexto.json).
- Ambiente: Windows x64, Node v24.16.0, Jest 26.6.3, Supertest 6.1.3, Sequelize 6.5.0, pg 8.5.1 e Joi 17.4.0; PostgreSQL real e dados fictícios em schemas exclusivos por suíte.
- Frontend: não envolvido nesta execução.
- Consolidado atualizado: [avaliacao/achados.json](../../achados.json).

## Registros e alcance

Os JSONs, relatórios e evidências anteriores das duas rodadas foram preservados.
O consolidado foi iniciado com os 12 registros da REV-01 e o registro existente da
REV-02, incluindo seus históricos. A atualização desta execução abrange os 12 IDs
da REV-01. O registro da REV-02 foi incorporado com os mesmos valores anteriores.

A identificação, a versão da descoberta, a descrição e as evidências originais
permanecem nos registros. Cada achado reavaliado recebeu a identificação
retrospectiva dos commits da correção e a verificação atual em seu histórico. Os
campos `correcao` e `reavaliacao` registram os respectivos estados mais recentes;
`verificacao_pendente` foi ajustado diretamente. A confirmação humana de A012
continua pendente. Nenhum snapshot de achado foi criado.

Os commits de implementação e complementação de cada correção foram conferidos
por `git log`, `git show` e `git diff-tree`. A versão em `correcao` identifica o
último commit relacionado à correção daquele achado. A versão em `reavaliacao`
identifica o HEAD efetivamente testado. Os hashes completos, assuntos e arquivos
alterados ficam em [EV04_mapeamento_achados.json](evidencias/reavaliacao-REV-01/EV04_mapeamento_achados.json),
com suporte em [EV03_commits_e_inspecao.txt](evidencias/reavaliacao-REV-01/EV03_commits_e_inspecao.txt).

## Verificações executadas

A suíte completa disponível foi executada uma vez, com as migrations reais e
PostgreSQL em schemas isolados. O helper limpa classes antes de schools/sectors,
fecha os pools e remove o schema da própria suíte. O processo encerrou sem
`forceExit`, com saída zero e `openHandles=[]`.

```text
node node_modules/jest/bin/jest.js --runInBand --roots tests --coverage=false --detectOpenHandles --verbose --json --outputFile=avaliacao/rodadas/REV-02/evidencias/reavaliacao-REV-01/EV01_resultados_jest.json
node node_modules/eslint/bin/eslint.js src tests
```

- Suíte: **430 testes aprovados, 19 suítes aprovadas**, zero falhas ou testes pendentes; duração informada pelo Jest: 19,829 s. [Saída completa](evidencias/reavaliacao-REV-01/EV01_suite_completa.txt) e [resultados estruturados](evidencias/reavaliacao-REV-01/EV01_resultados_jest.json).
- ESLint: saída zero. [Log](evidencias/reavaliacao-REV-01/EV02_eslint.txt).
- Cobertura percentual: não coletada nesta execução.
- Preservação: os 171 arquivos já versionados, incluindo os registros das revisões e o package-lock.json preexistente, mantiveram seus hashes. Fontes, testes e configurações não foram modificados.

O mesmo log de testes atende a todos os achados. Cada registro no consolidado
indica os arquivos de teste pertinentes e remete ao mapeamento com nome completo,
resultado e linha do log de cada caso. As seleções se sobrepõem; seus totais não
representam execuções adicionais.

| Achado | Procedimento pertinente | Casos identificados e aprovados | Resultado técnico |
| --- | --- | ---: | --- |
| REV-01-BE-A001 | Imports/chamadas das camadas e regressão HTTP original | 71 | resolveu_no_recorte |
| REV-01-BE-A002 | Entradas vazias, limpeza, normalização e colisões de nomes | 24 | resolveu_no_recorte |
| REV-01-BE-A003 | Contrato de campos, identificadores e persistência | 46 | resolveu_no_recorte |
| REV-01-BE-A004 | Mensagens, códigos HTTP, JSON seguro e ausência de gravação | 26 | resolveu_no_recorte |
| REV-01-BE-A005 | PATCH de escola e regressão da sanitização | 53 | resolveu_no_recorte |
| REV-01-BE-A006 | DELETE de escola e proteção de vínculos | 20 | resolveu_no_recorte |
| REV-01-BE-A007 | Cadastro, PATCH, DELETE e consulta individual de turma | 181 | resolveu_no_recorte |
| REV-01-BE-A008 | Filtros, total e mudança de situação pela API | 15 | resolveu_no_recorte |
| REV-01-BE-A009 | Regras de entrada, models, constraints e rejeição de transferência pela API | 166 | resolveu_no_recorte |
| REV-01-BE-A010 | Seeds reais e reversão/reaplicação de seeds/migrations | 3 | resolveu_no_recorte |
| REV-01-BE-A011 | Helper, limpeza com turma vinculada e encerramento dos pools | 6 | resolveu_no_recorte |
| REV-01-BE-A012 | Asserções e execução de todas as suítes disponíveis | 430 | resolveu_no_recorte; confirmação humana pendente |

## Limites da conclusão

As conclusões encerram o recorte técnico dos achados originais da REV-01. A
concorrência de PATCHs sobre a mesma turma permanece trabalho futuro na seção 7.1
dos requisitos. A proteção de transferência de `schoolId` exigida em CT01 foi
conferida na API; não se exige nem se declara um trigger para proibir UPDATE SQL
direto. A exclusão do desaparecimento concorrente de setor, registrada em DEC01,
foi respeitada.

Não foram executados frontend, navegação, foco, NVDA ou sessões com usuários.
O banco de uso da aplicação não foi migrado, semeado ou avaliado por esta execução;
os testes não determinam se ele já recebeu as mudanças. Não houve tratamento de
dados legados. Reversões foram verificadas em schema vazio; seeds não são
idempotentes. A aprovação da suíte não comprova ausência de outros defeitos.

A conferência de formato, preservação da identificação e dos históricos,
confirmações humanas e referências das novas evidências está em
[EV05_conferencia_consolidado.json](evidencias/reavaliacao-REV-01/EV05_conferencia_consolidado.json).
Nenhum commit foi criado e o índice Git permaneceu preservado.

## Verificações que dependem da autora

- Confirmar ou rejeitar o achado original REV-01-BE-A012. Sua correção técnica foi verificada; `confirmacao_autora` permanece `pendente`.
- Na interface, conferir apresentação/anúncio dos erros e preservação do formulário (A004), confirmação/cancelamento da exclusão e foco (A006), seleção do filtro e apresentação do total (A008). Navegação e NVDA ficam para suas etapas de avaliação.
- Confirmar a aplicação das migrations e seeds no banco de uso, caso ainda não haja esse registro operacional (A010). Os dados e o procedimento das seeds foram conferidos nos schemas de teste.

## Complemento operacional — banco de uso recriado

Em 07/11/2026, no horário de São Paulo, a autora autorizou apagar os dados
atuais. O banco local case_eleva, em localhost:5432, foi removido e recriado,
preservando proprietário, encoding e locale. As cinco migrations e quatro seeds
foram aplicadas com sucesso no ambiente development; o status não mostrou
migrations pendentes. Foram conferidos 11 setores, 6 escolas e 8 turmas, os
contratos, datas, vínculos, índices e constraints. As 27 consultas HTTP de leitura
contra o banco de uso passaram e preservaram os dados semeados.

Evidências: [execução e validação](evidencias/recriacao-banco/EV01_recriacao_e_validacao.txt)
e [resultado estruturado](evidencias/recriacao-banco/EV02_resultado.json).
A demora inicial no carregamento do CLI foi acompanhada com um comando de
diagnóstico somente de leitura; o comando principal terminou com saída zero.
O código executado continua no commit bf5acdd54c9370963370db922a4750378414af17.

A pendência operacional de REV-01-BE-A010 foi encerrada no consolidado, com o
procedimento e a evidência no histórico e na reavaliação mais recente. A lista
anterior descreve o estado antes desta operação. Continuam dependendo da autora
a confirmação de A012 e as verificações de interface/NVDA já relacionadas.
