# REV-01 — inspeção do backend

## Cabeçalho da rodada

- Rodada: REV-01
- Execução: r01
- Data e responsável: 2026-11-06; revisão por IA
- Objetivo e tipo de atividade: inspeção do backend original
- Repositório e branch: case-eleva-api, main
- Commit e alterações locais: 9a9aa9e1a77a6c6b484c3219c6120489620d094f (2021-02-19); working tree com `src/utils/database.js` e `package-lock.json` modificados. A execução usou o working tree. `avaliacao/` não está no commit.
- Versão do outro repositório quando necessária: não envolvido
- Instrumentos utilizados: `avaliacao/01_Regras_e_Requisitos.md`, `avaliacao/03_Review_Backend.md`, `avaliacao/04_Registro_e_Acompanhamento.md` e `avaliacao/06_Modelo_Achados.json`, texto datado de 05/11/2026. Documentos 02 e 05 ausentes neste repositório.
- Ferramenta e modelo identificável: Cursor, Grok 4.7
- Ambiente e base fictícia: Windows, Node v24.16.0, npm 11.13.0, Jest 26.6.3, PostgreSQL 18.6, banco `case_eleva`. Sondas com dados fictícios. A suíte e a limpeza final deixaram `sectors`, `schools` e `classes` com 0 linhas. `SequelizeMeta` preservada. Sem credenciais neste relatório.
- Escopo e requisitos selecionados: BE01–BE12, CT01–CT05, AR01, R01–R13 no que a API alcança, casos B01–B10. A24 apenas na resposta da API.
- Exclusões desta rodada: frontend; semântica, foco, contraste, teclado e leitor de tela; NVDA; pessoas usuárias; Playwright; axe-core; correção de código
- Arquivo de achados: `avaliacao/rodadas/REV-01/achados-backend.json`
- Pedido e contexto fornecido: `avaliacao/rodadas/REV-01/pedido-backend.txt`. Leitura limitada a este repositório. Achados emitidos: REV-01-BE-A001, A002, A003, A004, A005, A006, A007, A008, A009, A010, A011, A012.

## Inventário do escopo

| Funcionalidade ou componente | Arquivos ou rotas | Situação de implementação | Observação de alcance |
|---|---|---|---|
| Listar setores | `GET /sectors`; `src/routers/sectorsRouter.js`; `src/controllers/SectorController.js` | implementado | Leitura de código e suíte |
| Escolas de um setor | `GET /sectors/:id/schools` | implementado | Leitura de código, suíte e sonda |
| Consultar escola | `GET /schools/:id` | implementado | Leitura de código, suíte e sonda |
| Cadastrar escola | `POST /schools`; `src/schemas/schoolSchema.js`; `src/controllers/SchoolController.js` | parcial | REV-01-BE-A002, REV-01-BE-A003, REV-01-BE-A004 |
| Editar escola | nenhuma rota | não implementado | REV-01-BE-A005 |
| Excluir escola | nenhuma rota | não implementado | REV-01-BE-A006 |
| Listar turmas da escola | `GET /schools/:id/classes` | parcial | REV-01-BE-A008 |
| Capacidade total da escola | nenhuma rota nem campo na consulta | não implementado | REV-01-BE-A008 |
| Cadastrar, consultar, editar e excluir turma | nenhuma rota | não implementado | REV-01-BE-A007, REV-01-BE-A009 |
| Setor: criar, editar, excluir | nenhuma rota | não implementado | Fora das operações previstas para setor |
| Modelos, migrations e seeds | `src/models/`, `migrations/`, `seeders/` | parcial | REV-01-BE-A003, REV-01-BE-A009, REV-01-BE-A010 |
| Erros HTTP | `src/app.js`; `src/errors/` | parcial | REV-01-BE-A004 |
| Services e repositories | ausentes | não implementado | REV-01-BE-A001 |
| Testes | `tests/` | parcial | REV-01-BE-A011, REV-01-BE-A012 |

## Cobertura das verificações

| Item | Requisito e aspecto | Local examinado | Método e evidência da inspeção | Estado de cobertura | IDs de achados ou pendência |
|---|---|---|---|---|---|
| BE01 | Direção controller, service, repository e model | `src/controllers/`, `src/routers/`, `src/models/` | Leitura: controllers chamam models; não há services nem repositories | examinado com apontamento | REV-01-BE-A001 |
| BE02 | Campos de escola no cadastro | `src/schemas/schoolSchema.js`; `POST /schools` | Sonda EV03_casos.txt | examinado com apontamento | REV-01-BE-A002, REV-01-BE-A003 |
| BE02 | Campos de turma e edição parcial | rotas e `src/models/Class.js` | Leitura e sondas de rota ausente | não implementado | REV-01-BE-A005, REV-01-BE-A007, REV-01-BE-A009 |
| BE03 | Unicidade global do nome da escola | `SchoolController.createSchool`; índice `schools_name_key` | Sonda de duplicata exata, caixa, espaços e corrida | examinado com apontamento | REV-01-BE-A003, REV-01-BE-A004 |
| BE03 | Unicidade parcial de turma ativa | `migrations/20210219004712-create-classes-table.js`; `pg_indexes` | SQL com duas turmas current de mesmo nome; EV05 | examinado com apontamento | REV-01-BE-A009 |
| BE04 | Telefone canônico ou null | `schoolSchema.js`; colunas `phone` | Sonda de omissão, null, vazio, canônico, máscara e número | examinado com apontamento | REV-01-BE-A003 |
| BE05 | Enums, combinação, turno, situação e capacidade | model e migration de `classes`; insert SQL | SQL de combinação, capacidade negativa, status fora do enum e fracionário | examinado com apontamento | REV-01-BE-A009 |
| BE05 | Ausência de default silencioso de status | migration de `classes`, coluna `status` | Leitura: NOT NULL, sem default; enum current/completed | examinado sem apontamento | API de cadastro ausente: REV-01-BE-A007 |
| BE06 | Existência do setor no cadastro | `POST /schools`; FK `schools_sectorId_fkey` | Sonda com sectorId inexistente, 0, -1 e 1.5 | examinado com apontamento | REV-01-BE-A004 |
| BE06 | Mudança de setor e schoolId imutável | rotas de edição | PUT, PATCH e POST de turma | não implementado | REV-01-BE-A005, REV-01-BE-A007, REV-01-BE-A009 |
| BE06 | IDs e datas no cadastro de escola | `POST /schools` com `id` e `createdAt` | Sonda extra-id: 422 | examinado sem apontamento | Mensagem genérica em REV-01-BE-A004 |
| BE07 | Filtro de situação e total das ativas | `GET /schools/:id/classes`; `GET /schools/:id` | Sonda list-mixed-status | examinado com apontamento | REV-01-BE-A008 |
| BE08 | Exclusão, cascata e FK | migration; DELETE SQL; DELETE HTTP | SQL 23503 com turma e sucesso sem turma; HTTP 404 | examinado com apontamento | REV-01-BE-A006 |
| BE09 | Erro identificável, sem SQL na resposta | `src/app.js` | Sondas 404, 409, 422 e 500; corpo sem SQL | examinado com apontamento | REV-01-BE-A004 |
| BE10 | Identificação, datas, vazio e falha | respostas de escola, setor e turma | Consulta, lista vazia de turmas e id inexistente | parcialmente examinado | REV-01-BE-A008, REV-01-BE-A010 |
| BE11 | Coerência model, migration e seed | models, migrations, seeders, catálogo do banco | Comparação de arquivo e EV05 | examinado com apontamento | REV-01-BE-A003, REV-01-BE-A009, REV-01-BE-A010 |
| BE12 | Asserções, casos e limites dos testes | `tests/` | EV01, EV02 e EV04 | examinado com apontamento | REV-01-BE-A011, REV-01-BE-A012 |
| CT01 | Contrato de campos | cadastro de escola e schema | EV03_casos.txt | examinado com apontamento | REV-01-BE-A002, REV-01-BE-A003, REV-01-BE-A005 |
| CT02 | Normalização e unicidade | cadastro de escola; tabela `classes` | EV03 e SQL | examinado com apontamento | REV-01-BE-A002, REV-01-BE-A003, REV-01-BE-A009 |
| CT03 | Telefone | cadastro e seeds | EV03 e EV05 | examinado com apontamento | REV-01-BE-A003, REV-01-BE-A010 |
| CT04 | Segmento, turno e situação | model, migration, seeds e SQL | EV05 e SQL | examinado com apontamento | REV-01-BE-A009, REV-01-BE-A010 |
| CT05 | Seeds e persistência | seeders e banco antes da suíte | EV05 | examinado com apontamento | REV-01-BE-A010 |
| AR01 | Arquitetura alvo | `src/` | Leitura da árvore | examinado com apontamento | REV-01-BE-A001 |
| R01 | Setores pré-cadastrados, sem CRUD público | `sectorsRouter.js` | Leitura e `GET /sectors` | examinado sem apontamento | Interface fora da rodada |
| R02 | Escola muda de setor e turmas permanecem | rota de edição | Ausência de PUT/PATCH | não implementado | REV-01-BE-A005 |
| R03 | Turma em escola existente e schoolId imutável | rotas de turma; UPDATE SQL | POST ausente; UPDATE SQL alterou schoolId | não implementado | REV-01-BE-A007, REV-01-BE-A009 |
| R04 | Situação current/completed editável | model e listagem | Enum no banco; sem rota de edição nem filtro | não implementado | REV-01-BE-A007, REV-01-BE-A008 |
| R05 | Listagem padrão das ativas e seleção | `GET /schools/:id/classes` | Sonda com current e completed | examinado com apontamento | REV-01-BE-A008 |
| R06 | Soma só das turmas current | consulta da escola e da lista | Payload sem total | examinado com apontamento | REV-01-BE-A008 |
| R07 | Exclusão de escola bloqueada por qualquer turma | API e FK | HTTP ausente; SQL bloqueado | examinado com apontamento | REV-01-BE-A006 |
| R08 | FK além da checagem de aplicação | migrations e DELETE SQL | EV05; 23503 | parcialmente examinado | Tradução na API: REV-01-BE-A004, REV-01-BE-A006 |
| R09 | Mensagem de bloqueio e próximo passo | respostas de erro e exclusão | Sondas de erro; exclusão ausente | examinado com apontamento | REV-01-BE-A004, REV-01-BE-A006 |
| R10 | Confirmação de exclusão e preservação após erro | API | Exclusão ausente; validação do POST | parcialmente examinado | REV-01-BE-A002, REV-01-BE-A004, REV-01-BE-A006; confirmação de tela fora da rodada |
| R11 | Exclusão de turma | rota | DELETE de turma ausente | não implementado | REV-01-BE-A007 |
| R12 | createdAt preservado e updatedAt de edição | respostas e seeds | Create da API preenche as duas; seeds nulas; sem edição | parcialmente examinado | REV-01-BE-A005, REV-01-BE-A007, REV-01-BE-A010 |
| R13 | Rótulos de interface | nenhum arquivo de interface | Repositório só de API | fora da rodada | Frontend |
| A24 | Campo e orientação do erro | corpo das respostas do POST e do GET | EV03_casos.txt | parcialmente examinado | REV-01-BE-A004; navegador e NVDA pendentes |
| A01, A05, A07, A08, A09, A11, A12, A14, A16, A17, A19, A22, A23, A25, A28, A29, A30, A31, A33, A35, A37, A38, A39, A40 | Verificações operacionais de interface | não há interface neste repositório | Não executadas | não examinado | Etapa de frontend ou avaliação final |
| H01, H02, H03, H04, H05, H06, H07, H08, H09, H10 | Heurísticas nas tarefas de tela | API apenas como suporte | Sem percurso de interface | parcialmente examinado | Relação nos achados; avaliação de tela pendente |

Examinado sem apontamento não é declaração de atendimento.

## Testes e verificações executados

| Caso | Versão e ambiente | Dados e comando ou passos | Esperado | Observado | Resultado | Evidência e IDs |
|---|---|---|---|---|---|---|
| Suíte com cobertura da configuração | Node v24.16.0, Jest 26.6.3, banco `case_eleva`, working tree | `node .\node_modules\jest\bin\jest.js --runInBand --watchman=false --forceExit --testTimeout=20000` | Asserções existentes e processo encerrado | Três suítes PASS; em seguida SourceMapConsumer no CoverageReporter | falhou | EV01. Falha de ambiente do reporter, depois das asserções PASS |
| Suíte sem cobertura | Mesmo ambiente | `node .\node_modules\jest\bin\jest.js --runInBand --coverage=false --watchman=false --forceExit --verbose` | 15 testes existentes | 15 passed, 3 suites, saída 0. Aviso de handles abertos no forceExit | passou | EV02. REV-01-BE-A011, REV-01-BE-A012 |
| sectors.test.js com turma presente | Mesmo ambiente, uma turma inserida antes | `jest tests/integration/sectors.test.js --runInBand --coverage=false --forceExit` | Suíte executa | Suíte não chega aos testes: FK `classes_schoolId_fkey` no DELETE de schools | falhou | EV04. REV-01-BE-A011 |
| B01 | API no working tree, dados fictícios | POST com setor, nome, endereço, diretor e telefone; GET seguinte | Persistência e leitura | 201 e 201 leitura do mesmo registro, com createdAt e updatedAt | passou | EV03_casos.txt, B01-create e B01-read. Edição não faz parte deste resultado |
| B01, subcaso sem diretor e sem telefone | Mesmo ambiente | POST sem headteacher e sem phone | Aceitos e gravados como null | 422 JSON genérico nos dois | falhou | EV03_casos.txt. REV-01-BE-A003 |
| B02 | Mesmo ambiente | Inválidos, referência inexistente e duplicidade, inclusive subcasos de nome, endereço, diretor e telefone | Rejeição sem gravação indevida | Vazio estrito, número e duplicata exata rejeitados; espaços, caixa, máscara, tamanhos acima do contrato e sectorId inválido não seguem o contrato | falhou | EV03_casos.txt. REV-01-BE-A002, REV-01-BE-A003, REV-01-BE-A004 |
| B03 | API | Mudar escola de setor | Novo vínculo e turmas na mesma escola | PUT e PATCH em `/schools/:id` respondem 404 HTML | não implementado | EV03_casos.txt. REV-01-BE-A005 |
| B04 | API | Mudar schoolId da turma | Rejeição e vínculo preservado | Não há rota. UPDATE SQL alterou schoolId | não implementado | EV03_casos.txt, sql-move-school. REV-01-BE-A007, REV-01-BE-A009 |
| B05 | API | Ativas, todas, encerradas e outra escola | Lista filtrada e sem mistura | GET de turmas devolveu current e completed juntos; sem parâmetro de filtro | não implementado | EV03_casos.txt, list-mixed-status. REV-01-BE-A008 |
| B06 | API e SQL | Ativa 30, encerrada 20, depois encerrar a ativa | Total 30 e depois 0, independente do filtro | Consulta da escola não tem total. Capacidade negativa foi gravada por SQL | não implementado | EV03_casos.txt. REV-01-BE-A008, REV-01-BE-A009 |
| B07 | API | Excluir escola com turma ativa e com só encerrada | As duas bloqueadas e registros preservados | DELETE HTTP 404 HTML. DELETE SQL com turma retornou 23503 | não implementado | EV03_casos.txt. REV-01-BE-A006 |
| B08 | API | Excluir turma e depois escola sem dependências | Exclusões permitidas, sem cascata | Sem rotas. SQL apagou a escola depois de apagar as turmas | não implementado | EV03_casos.txt, sql-delete-school-without-class. REV-01-BE-A006, REV-01-BE-A007 |
| B09 | Banco `case_eleva` | Integridade por FK, sem mock | FK impede órfão e exclusão do pai vinculado | `schools_sectorId_fkey` e `classes_schoolId_fkey` sem cascata; DELETE do pai vinculado retornou 23503 | passou | EV05 e EV03_casos.txt. Tradução HTTP em REV-01-BE-A004 |
| B10 | API | Edição de turma | createdAt preservado, updatedAt coerente, campos protegidos | Não há rota de edição | não implementado | EV03_casos.txt. REV-01-BE-A007 |

Presença de teste no repositório foi distinguida da execução. Os comandos acima foram executados.

## Verificações pendentes e limitações

| Verificação | Motivo da pendência | Método necessário | Momento previsto | IDs relacionados |
|---|---|---|---|---|
| A24 na interface | A API foi inspecionada; navegador e leitor de tela não | Interação no navegador e NVDA | Frontend e avaliação final | REV-01-BE-A004 |
| Demais Axx e heurísticas na tela | Este repositório não tem interface | Inspeção de código da interface, navegador, contraste e NVDA | Frontend e avaliação final | nenhum |
| R01, R10 e R13 na interface | Rótulos, confirmação e remoção de ação de setor | Navegador | Frontend | REV-01-BE-A006 |
| Banco isolado de teste | `config/config.js` usa a mesma DATABASE_URL em development e test | Banco separado | Próximas execuções automatizadas | REV-01-BE-A012 |
| Cobertura do `npm test` neste Node | Reporter v8-to-istanbul falha depois das suítes PASS | Node compatível com Jest 26 ou reporter corrigido na implementação | Quando a suíte for reexecutada | nenhum |
| Manter o próprio nome na edição | Rota de edição ausente | API de edição, quando existir | Reavaliação da implementação | REV-01-BE-A005 |
| Reativar turma homônima | Rota e índice ausentes | API e constraint, quando existirem | Reavaliação da implementação | REV-01-BE-A009 |
| Seeds no banco | As linhas foram apagadas nesta rodada | `npm run seeds`, pela autora | Depois desta inspeção | REV-01-BE-A010 |

O working tree difere do commit em `src/utils/database.js`: SSL só entra quando `NODE_ENV=production`. Os testes rodaram com `NODE_ENV=test`, portanto sem esse SSL. O `package-lock.json` local também difere; não houve `npm install` nesta rodada.

## Fechamento pela autora

Seção da autora. O revisor não a preencheu.

- Data e versão após intervenções: não informado
- IDs reavaliados: não informado
- IDs que permanecem pendentes: não informado
- Arquivos de reavaliação: não informado
- Limites da cobertura e destino das verificações pendentes: não informado
- Decisão de fechamento: não informado
