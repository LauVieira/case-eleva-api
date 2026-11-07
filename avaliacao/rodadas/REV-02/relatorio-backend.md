# REV-02 — revisão das funcionalidades novas do handover

## Cabeçalho da rodada

- Rodada: REV-02.
- Execução: r01.
- Data e responsável: 07/11/2026; revisão por IA, Codex. Data de referência da autora em America/Sao_Paulo; instantes UTC efetivos nos logs.
- Objetivo e tipo de atividade: inspeção e verificação das seis operações acrescentadas na seção 3 do handover, com comparação dos IDs pertinentes da REV-01.
- Repositório e branch: case-eleva-api, main.
- Commit: `88999fc422b6fce8a562f0adb9d88868f84f6e74`.
- Alterações locais anteriores à avaliação: `package-lock.json` modificado e `HANDOVER.md` sem rastreamento. O código da aplicação e os testes existentes correspondem ao commit. O patch do lock está em [EV01_package-lock_preexistente.patch](evidencias/EV01_package-lock_preexistente.patch); o handover foi copiado no snapshot. Os novos arquivos desta rodada ficam em `avaliacao/rodadas/REV-02/`.
- Versão do outro repositório: não envolvido.
- Instrumentos: documentos [01](../../01_Regras_e_Requisitos.md), [03](../../03_Review_Backend.md), [04](../../04_Registro_e_Acompanhamento.md) e [06](../../06_Modelo_Achados.json), com data textual 05/11/2026; documento 01 inclui as decisões de 07/11/2026. Versões exatas preservadas por conteúdo e SHA256 em [EV01](evidencias/EV01_manifesto_antes.json) e no [snapshot](evidencias/EV01_codigo_e_instrumentos.snapshot.json).
- Ferramenta e modelo identificável: Codex, base GPT-6 conforme identificação do agente; identificador exato da variante não informado na sessão.
- Ambiente e base fictícia: Windows x64, Node v24.16.0, npm 11.13.0, Jest 26.6.3, Supertest 6.1.3, Sequelize 6.5.0, pg 8.5.1, Joi 17.4.0, ESLint 7.20.0 e PostgreSQL 18.6. Banco `case_eleva`, com schemas exclusivos `eleva_test_<pid>_<identificador>` e dados fictícios. Credenciais omitidas.
- Escopo e requisitos selecionados: somente as seis rotas do inventário; BE01–BE12, CT01–CT05, AR01 e R02–R12 na parcela pertinente a essas operações. A24 e Hxx somente como suporte da API, sem resultado de atendimento da interface.
- Exclusões: funcionalidades anteriores da seção 2 do handover como objeto independente de revisão; implementações futuras da seção 7; frontend, navegador, teclado, contraste, NVDA e sessões com usuários; correções de código, dependências, configuração, migrations e seeds.
- Arquivo de achados: [achados-backend.json](achados-backend.json). Emitido um ID novo: `REV-02-BE-A001`.
- Pedido e contexto: [pedido-backend.txt](pedido-backend.txt), incluindo a correção de escopo e a autorização da autora. A leitura prévia da REV-01 foi usada para evitar duplicação. Não havia `avaliacao/achados.json`; o arquivo da REV-01 foi consultado e preservado.

## Inventário do escopo

| Funcionalidade | Rota e fluxo examinado | Situação | Alcance |
|---|---|---|---|
| Edição parcial de escola | `PATCH /schools/:id`; SchoolController → SchoolService → SchoolRepository; SectorRepository e ClassRepository como dependências | implementado | Campos, estado resultante, opcionais, mudança de setor, vínculos, datas, conflitos e falhas; `REV-02-BE-A001` |
| Exclusão de escola | `DELETE /schools/:id`; SchoolController → SchoolService → SchoolRepository; ClassRepository na checagem | implementado | Qualquer turma bloqueia; FK, corrida entre checagem e exclusão, ausência de cascata, 204 e erros |
| Cadastro de turma | `POST /schools/:id/classes`; SchoolController → ClassService → ClassRepository; SchoolRepository | implementado | Escola da URL, campos obrigatórios, normalização, opções, capacidade, índice e FK; `REV-02-BE-A001` |
| Edição parcial de turma | `PATCH /classes/:id`; ClassController → ClassService → ClassRepository | implementado | Estado resultante, vínculo imutável, datas, situação, unicidade e efeitos nas consultas; `REV-02-BE-A001` |
| Exclusão de turma | `DELETE /classes/:id`; ClassController → ClassService → ClassRepository | implementado | Ativa/encerrada, capacidade zero, registros preservados e exclusão posterior da escola |
| Detalhes de turma | `GET /classes/:id`; ClassController → ClassService → ClassRepository; associação School | implementado | Todos os campos persistidos, escola por ID/nome, isolamento, reflexo das edições e ausência de mutação |

As consultas de escola, capacidade, listagem e setor foram utilizadas para observar os efeitos dessas operações. Sua execução nos testes não amplia o objeto da inspeção. Models, associações, constantes, sanitização, erros e migrations foram examinados como dependências dos seis fluxos. As seeds foram executadas pela suíte de regressão, sem nova revisão independente de seu conteúdo.

## Cobertura das verificações

Evidências: **EV01** identifica versão e conteúdo; **EV02** contém a suíte existente completa; **EV03b** contém as sondas complementares ajustadas; **EV04** contém os trechos numerados e o ESLint. Os caminhos estão listados ao final. Os estados descrevem o alcance da inspeção, sem aprovação global.

| Item | Requisito e aspecto | Local examinado | Método e evidência | Estado de cobertura | IDs ou limite |
|---|---|---|---|---|---|
| BE01 | AR01: direção e responsabilidades dos seis fluxos | Routers, controllers, services e repositories de escola/turma; app | Leitura das chamadas em EV04; HTTP em EV02 | examinado sem apontamento | A criação permanece no SchoolController conforme decisão do handover |
| BE02 | CT01: parcialidade, obrigatórios, null/omissão e campos mantidos | Schemas e métodos createClass/updateClass/updateSchool | Estado resultante em código; rejeições e persistência em EV02; S01–S04 e S06 em EV03b | examinado com apontamento | `REV-02-BE-A001`; concorrência da mesma turma delimitada abaixo |
| BE02 | CT01: limites exatos e excessos | PATCH de escola; POST/PATCH de turma | EV02, seis suítes; EV03b S01/S02 e capacidade textual S03 | examinado sem apontamento neste aspecto | Limite técnico de inteiro, sem teto adicional de negócio |
| BE03 | CT02: sanitização, normalização, acentos e próprio nome | Services e normaliseName; schemas; Class model | EV04; casos de nome nas três suítes de escrita, EV02 | examinado sem apontamento neste aspecto | O apontamento de entrada de BE02 é tratado no ID único |
| BE03 | CT02: unicidade global de escola e parcial de turma ativa | Repositories e índice `classes_current_name_unique` | EV02: conflitos comuns e concorrentes, renomeação/reativação e preservação da rejeitada | examinado sem apontamento | Concorrência de nomes de registros distintos efetivamente exercitada |
| BE04 | CT03: fixo/celular canônicos, limpeza e telefone estrito | PATCH de escola; schoolSchema | EV02: null, vazio, máscara e número; EV03b S01/S02: formatos válidos e tipo | examinado sem apontamento | Omissão conserva o valor; null permite limpeza |
| BE05 | CT04: segmento/grupo/ano, turno, situação sem padrão e capacidade | classOptions, classSchema, ClassService e Class model | EV02: 17 combinações no cadastro, opções e incompatibilidades parciais; EV03b S04: 17 combinações na edição | examinado sem apontamento neste aspecto | Requisições isoladas; pendência conhecida de mesma turma fora do recorte adicional |
| BE06 | R02: mudança de setor, existência do destino e turmas preservadas | updateSchool/validateSectorChange | EV02 schools.patch; EV03b S05 confirma detalhes após mudança | examinado sem apontamento | Desaparecimento concorrente de setor permanece fora da rodada |
| BE06 | R03 e CT01: vínculo de turma e campos gerenciados | ClassService e schemas de escrita | EV02: escola da URL; schoolId, id e datas rejeitados; FK quando a escola desaparece | examinado sem apontamento neste aspecto | Sem inferir que UPDATE direto em SQL tem vínculo imutável |
| BE07 | R04–R06: efeitos das novas escritas nos filtros e total | Retornos das consultas após criar, editar e excluir | EV02: escolas/turmas distintas, encerrar/reativar, capacidade e exclusão da última turma | examinado sem apontamento | Consultas usadas como observação dos efeitos, sem nova auditoria independente |
| BE08 | R07–R09: bloqueio por qualquer turma e FK sem cascata | validateSchoolDeletion; existsBySchoolId; delete de escola | EV02 schools.delete: ativa/encerrada, zero e inserção após checagem; testes de FK reais | examinado sem apontamento | Integridade comprovada com PostgreSQL, sem simular a constraint |
| BE08 | R11: exclusão de turma e preservação dos demais registros | deleteClass; ClassRepository.delete | EV02 classes.delete: quatro combinações situação/capacidade, 204, outras turmas e escola | examinado sem apontamento | Confirmação e cancelamento da interface não examinados |
| BE09 | R09/R10: JSON, campo/orientação e separação de falhas | Middleware, UpdateError/DeleteError, services e repositories | EV02: 400/422/404/409/500; EV03b: S02 e S06; EV04 | examinado com apontamento | `REV-02-BE-A001`; consumo e apresentação no frontend pendentes |
| BE10 | R12: datas, vínculo compreensível, detalhes e vazio/falha | GET de turma e respostas das novas escritas | EV02 classes.details e suítes de escrita/exclusão; EV03b S05 | examinado sem apontamento | Formatação de nomes/datas no frontend não examinada |
| BE11 | CT05/R08: colunas, índices, FKs e coerência das dependências | Models, associações e migrations usadas pelos testes | EV04 e EV01; EV02 persistence.contract/contracts.verification como apoio | examinado sem apontamento no suporte aos seis fluxos | Sem novas migrations/seeds; sem migração de dados reais ou avaliação de produção |
| BE12 | B01–B10 no recorte: asserções, persistência e limites de mocks | Seis suítes, helper e sondas | EV02: 250 casos das seis suítes e 172 adicionais de regressão; EV03b: 35 sondas | examinado com apontamento | `REV-02-BE-A001`; a passagem da suíte existente não encerra o resultado da rodada |
| A24; H01, H02, H05, H06, H09 | Suporte da API à identificação, erro e recuperação | Dados e mensagens das seis operações | Inspeção e HTTP nas evidências citadas | parcialmente examinado | Nenhum Axx/Hxx declarado atendido; navegador e NVDA fora da rodada |
| R01, R13; demais Axx/Hxx | Setores administrativos e aspectos de interface | Fora dos seis fluxos delimitados | Sem avaliação independente | fora da rodada | Frontend e avaliação final conforme planejamento da autora |

## Comparação com a REV-01

Referência imutável: [achados-backend.json da REV-01](../REV-01/achados-backend.json). A tabela registra o resultado da comparação no alcance desta rodada; não atualiza confirmação, situação ou histórico naquele arquivo e não encerra aspectos externos ao backend revisado.

| ID original | Alcance da comparação | Resultado desta rodada | Evidência |
|---|---|---|---|
| REV-01-BE-A001 | Dependências dos seis fluxos | Não reencontrado no recorte examinado | EV04; EV02 |
| REV-01-BE-A002 | Reutilização da normalização pelas novas escritas | Não reencontrado nesse uso; cadastro anterior de escola fora da inspeção | EV02, suítes de PATCH e cadastro de turma |
| REV-01-BE-A003 | Contrato compartilhado utilizado pelo PATCH de escola | Parcela pertinente verificada; sem reabrir a revisão do cadastro anterior | EV02 schools.patch; EV03b S01/S02 |
| REV-01-BE-A004 | Tratamento de erros utilizado pelas novas operações | Casos anteriores não reencontrados nesses fluxos; sem reavaliação de frontend | EV02; EV04 |
| REV-01-BE-A005 | Operação pertinente integralmente no escopo | Não reencontrado no backend revisado | EV02 schools.patch; EV04 |
| REV-01-BE-A006 | Operação pertinente no backend | Não reencontrado no backend revisado; aspectos de interface não avaliados | EV02 schools.delete |
| REV-01-BE-A007 | Quatro operações de turma acrescentadas | Não reencontrado no backend revisado | EV02 classes.create/patch/delete/details |
| REV-01-BE-A008 | Efeitos das novas escritas nas consultas anteriores | Verificado como apoio; sem reabrir avaliação independente das consultas | EV02: alterações de situação/capacidade e exclusões |
| REV-01-BE-A009 | Parcela das novas entradas HTTP e suas constraints | Parcela pertinente verificada; sem conclusão sobre proteção de UPDATE direto do vínculo | EV02 classes.create/patch e apoio de persistência |
| REV-01-BE-A010 | Seeds anteriores | Fora da inspeção independente; execução de regressão registrada | EV02 persistence.contract/contracts.verification |
| REV-01-BE-A011 | Infraestrutura anterior dos testes | Fora da inspeção funcional independente; execução e encerramento observados | EV02 e EV03b |
| REV-01-BE-A012 | Testes das seis operações antes ausentes | Parcela pertinente verificada; sem declarar cobertura exaustiva ou confirmação da autora | EV02; EV03b |

O único ID novo desta rodada foi confrontado com os doze registros anteriores e não reproduz um problema já descrito neles. As três ocorrências relacionadas a esse ID permanecem agrupadas no mesmo objeto JSON. A pendência conhecida da seção 7.1 do handover não foi recadastrada nem apresentada como descoberta desta revisão.

## Testes e verificações executados

Todos os resultados abaixo pertencem ao commit e ao ambiente do cabeçalho. As asserções existentes não foram modificadas. O código de apoio de integração executa migrations em schemas exclusivos e encerra os pools de Sequelize e pg; não migra ou limpa `public`.

| Caso | Dados e comando ou passos | Esperado | Observado | Resultado | Evidência e IDs |
|---|---|---|---|---|---|
| Seis suítes do escopo | PATCH/exclusão de escola; cadastro/PATCH/exclusão/detalhes de turma; executadas na suíte completa | Contratos, mensagens, persistência, vínculos e datas conforme cada caso | 250 casos aprovados: 52 + 20 + 83 + 62 + 18 + 15 | passou | EV02; nomes e resultados individuais no log |
| Regressão existente | 18 suítes sob `tests`, incluindo as seis acima | Nenhuma regressão nos casos existentes; encerramento sem forceExit | 422 testes aprovados, saída 0, 19,866 s; sem aviso de handles abertos | passou | EV02 |
| B01/B02 | Escritas válidas, limites, null/omissão, rejeições, normalização e conflitos | Persistir o válido; rejeitar o inválido sem gravação | Casos existentes passaram; complementos S01/S02/S03 passaram | passou nesses casos | EV02; EV03b |
| B03/B04/B10 | Mudar setor; tentar enviar schoolId/id/datas; editar turma | Vínculos e criação preservados; rejeição dos campos protegidos | Casos existentes passaram; S04/S05 passaram | passou nesses casos | EV02; EV03b |
| B05/B06 | Consultar filtros e total após as novas escritas | Situação e capacidade refletidas nas consultas, sem mistura de escola | Casos das suítes de escrita/exclusão passaram | passou | EV02 |
| B07/B08/B09 | Escola com ativa/encerrada/zero; FK após checagem; excluir última turma e depois escola | Bloquear pai com dependente; permitir exclusões válidas e preservar demais registros | Casos existentes passaram com FK real e mensagens esperadas | passou | EV02 |
| S01–S05 e controle S06, execução ajustada | 5 limites/formatos de PATCH de escola, 5 tipos inválidos, 3 capacidades textuais, 17 combinações na edição, 1 consulta após mudança de setor e 1 controle de campo desconhecido | Respostas e persistência de acordo com o contrato | 32 casos aprovados | passou | EV03b |
| S06-escola, S06-cadastro e S06-turma | Corpos e leituras posteriores preservados nas observações do log | 422 e dados preservados | 200/201/200, respectivamente; mutações observadas; três asserções falharam | falhou | EV03b; `REV-02-BE-A001` |
| Primeira execução das sondas | 35 casos no script original | Mesmas expectativas de contrato | 31 passaram e 4 falharam; uma falha de preparação de S04, além das três de S06 | falhou; preparação de um caso ajustada separadamente | EV03 e script original preservados |
| Reprodução do arquivo de sondas arquivado como texto | Mesmo conteúdo de EV03b; extensão e descoberta definidas somente na chamada | Mesmos 35 casos e expectativas | 32 passaram, três S06 falharam; saída 1 e encerramento normal | falhou nos mesmos três casos | EV03c; `REV-02-BE-A001` |
| ESLint sem autofix | Arquivos dos fluxos e suas seis suítes, listados no comando de EV04 | Saída 0, sem alteração de arquivo | Saída 0 | passou | EV04 |
| Preservação | Comparação SHA256 dos arquivos protegidos antes/depois e do commit | Nenhuma alteração na aplicação, testes existentes, instrumentos ou REV-01 | Commit e os 141 arquivos protegidos preservados | passou | [EV05](evidencias/EV05_preservacao.json) |

A primeira sonda S04 reenviava `Ensino Fundamental / 1º ano` para uma fixture que já possuía esses valores e tinha `updatedAt` nulo. Essa preparação não produzia uma edição efetiva para sustentar a expectativa de atualização da data. A cópia ajustada parte de `Ensino Médio / 2º ano` somente nesse caso, mantendo a expectativa e todos os demais casos. O script e o log anteriores foram preservados. A falha dessa preparação não foi contabilizada como achado da aplicação.

Comandos usados para registrar as primeiras execuções, a partir da raiz:

```powershell
node avaliacao/rodadas/REV-02/evidencias/registrar-revisao.js suite
node avaliacao/rodadas/REV-02/evidencias/registrar-revisao.js sondas
node avaliacao/rodadas/REV-02/evidencias/registrar-sondas-ajustadas.js
```

Os registradores preservam evidências com escrita exclusiva e recusam sobrescrever uma execução encerrada. Os scripts de sondas foram posteriormente arquivados como `.test.js.txt`, preservando seu conteúdo byte a byte e os nomes utilizados nas execuções em [EV03_arquivamento_scripts.json](evidencias/EV03_arquivamento_scripts.json). Essa extensão mantém as sondas fora da descoberta padrão do Jest e não altera os testes usuais do projeto. Os logs originais e seus registradores foram mantidos como registros históricos.

Para reproduzir as sondas arquivadas, usar um novo nome de log:

```powershell
node avaliacao/rodadas/REV-02/evidencias/reproduzir-sondas.js EV03_nova_reproducao.txt
```

O comando usa `--testMatch` e `--moduleFileExtensions` apenas nessa chamada, com `--runTestsByPath` e `--roots` restritos às evidências. Sua execução nesta rodada está em EV03c. Para repetir a suíte existente, consultar os argumentos de EV02 e escolher outra pasta de cobertura, sem sobrescrever os registros.

A coleta da suíte existente abrange `src`, exceto `server.js`, conforme a configuração do projeto: 98,57% de instruções, 94,25% de ramificações, 100% de funções e 98,68% de linhas. Esses percentuais são globais da execução de regressão, não exclusivos das seis operações. As sondas complementares não coletaram cobertura. Não foi imposta meta nem inferida ausência de defeitos a partir dos percentuais.

## Verificações pendentes e limitações

| Verificação | Motivo/limite | Método necessário | Destino | IDs ou referência |
|---|---|---|---|---|
| Confirmação e eventual correção do novo apontamento | Revisão emitida sem decisão humana sobre o achado | Conferência da autora; correção e nova execução dos casos S06, se autorizadas | Etapa separada | `REV-02-BE-A001` |
| Edições concorrentes da mesma turma | Pendência já conhecida e adiada expressamente; fora da implementação adicional revisada | Verificação futura definida na seção 7.1 do documento 01 e do handover | Evolução futura | Sem novo ID nesta rodada |
| Busca parcial de escolas | Proposta futura, fora das seis operações | Implementação e avaliação futuras | Evolução futura | Documento 01, seção 7.2 |
| Desaparecimento concorrente de setor | Limite já decidido pela autora e registrado na REV-01 | Somente se o escopo mudar | Fora desta rodada | DEC01 da REV-01 |
| Confirmação/cancelamento de exclusão, preenchimento após erro e apresentação de filtros/datas | Dependem da interface, ausente deste repositório | Inspeção e interação no frontend | Rodada pertinente de frontend | R10/R12; Axx e Hxx aplicáveis |
| NVDA, teclado, foco, contraste e usuários | Métodos de avaliação da interface/final | Métodos previstos nos instrumentos | Frontend/avaliação final | Sem resultado de atendimento nesta revisão |
| Produção, dados reais e conexão SSL | Testes locais com dados fictícios e schemas isolados | Verificação operacional própria, se solicitada | Fora desta rodada | Nenhum |
| Exaustividade e limites dos mocks | A suíte verifica os cenários nomeados; falhas de operação usam mocks pontuais e não demonstram todos os modos de falha reais | Novos casos somente diante de indício pertinente | Próximas verificações | BE12 |

Os casos de unicidade e FK exercitam o PostgreSQL real; as barreiras sincronizam as requisições sem substituir as constraints. Os casos de falha inesperada e retorno vazio dos repositories verificam a tradução HTTP mediante simulação pontual. O resultado da validação do estado resultante limita-se às requisições isoladas e aos conflitos de unicidade efetivamente exercitados, com a pendência conhecida acima explicitada.

## Índice das evidências

- [EV01_manifesto_antes.json](evidencias/EV01_manifesto_antes.json): commit, ambiente, status inicial e SHA256 dos arquivos protegidos, incluindo toda a REV-01.
- [EV01_codigo_e_instrumentos.snapshot.json](evidencias/EV01_codigo_e_instrumentos.snapshot.json): cópia exata dos fontes/testes necessários à reprodução e dos instrumentos/handover, sem credenciais.
- [EV01_package-lock_preexistente.patch](evidencias/EV01_package-lock_preexistente.patch): diferença local anterior à avaliação.
- [EV02_suite_completa.txt](evidencias/EV02_suite_completa.txt) e [coverage-final.json](evidencias/coverage/coverage-final.json): execução da suíte existente e dados da cobertura.
- [EV03_sondas_complementares.txt](evidencias/EV03_sondas_complementares.txt) e [script original](evidencias/sondas-handover.test.js.txt): primeira execução preservada.
- [EV03b_sondas_complementares_ajustadas.txt](evidencias/EV03b_sondas_complementares_ajustadas.txt) e [script ajustado](evidencias/sondas-handover-ajustadas.test.js.txt): complemento com preparação corrigida, esperado/observado e dados persistidos.
- [EV03c_sondas_arquivadas.txt](evidencias/EV03c_sondas_arquivadas.txt), [registrador de reprodução](evidencias/reproduzir-sondas.js) e [mapeamento dos scripts](evidencias/EV03_arquivamento_scripts.json): reprodução do conteúdo arquivado sem ampliar a descoberta padrão de testes.
- [EV04_inspecao_estatica.txt](evidencias/EV04_inspecao_estatica.txt): comando/saída do ESLint e trechos numerados examinados.
- [EV05_preservacao.json](evidencias/EV05_preservacao.json): conferência final dos hashes e da preservação da REV-01.
- [EV06_conferencia_documental.json](evidencias/EV06_conferencia_documental.json): conferência do formato JSON, referências, evidências e arquivos desta rodada.

## Fechamento pela autora

Seção reservada à autora; não preenchida pelo revisor.

- Data e versão após intervenções: não informado; nenhuma correção nesta revisão.
- IDs reavaliados pela autora: não informado.
- IDs com confirmação pendente: `REV-02-BE-A001`.
- Arquivos de reavaliação após correção: não produzidos.
- Limites da cobertura e destino das pendências: registrados acima; decisão da autora não informada.
- Decisão de fechamento: não informada.
