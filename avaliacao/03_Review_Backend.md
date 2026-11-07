# Instrumento de revisão do backend

Laura Vieira · Instrumento de trabalho do TCC · 05/11/2026

## 1. Condições de execução

Ler os documentos 01_Regras_e_Requisitos.md e 04_Registro_e_Acompanhamento.md. Identificar repositório, commit, alterações locais, ambiente e instrumentos usados. Examinar os arquivos reais, sem presumir comportamento não demonstrado. Usar null ou declarar a limitação quando uma informação não estiver disponível.

Na REV-01, inventariar as funcionalidades e examinar o escopo definido a partir do código disponível. Nas rodadas seguintes, revisar o conjunto de alterações e dependências pertinentes. Todas as rodadas usam os mesmos dois produtos: relatório em Markdown e achados em JSON separado. Na primeira rodada, iniciar o registro de achados vazio.

A revisão não altera código, dependências, configuração, migrations ou seeds e não executa autofix. É permitido escrever os arquivos de avaliação solicitados. Correções são realizadas em etapa separada, após preservar a revisão. Executar testes quando incluídos no pedido e em ambiente apropriado; operações que alterem dados exigem banco de teste isolado.

Para cada item, registrar alcance, arquivos/componentes examinados, método, evidência da inspeção e resultado de cobertura, inclusive sem achados. Informar o que ficou fora da rodada, parcialmente examinado ou pendente. Presença de código ou de teste não comprova execução nem conformidade.

Não ampliar funcionalidades nem acrescentar frameworks, Playwright ou axe-core. NVDA e usuários são procedimentos da avaliação final. Verificações dependentes desses métodos ficam explicitamente pendentes até essa etapa.

## 2. Pontos de revisão

| ID | Inspeção a realizar | Referências | Evidência complementar |
|---|---|---|---|
| BE01 | Rotas/controllers, services por entidade, repositories, models e dependências; regras fora da borda HTTP e acesso ao banco pelos repositories | AR01 | Arquivos e chamadas concretas; separar melhoria arquitetural de defeito |
| BE02 | Campos obrigatórios/opcionais, limites, null versus omissão em edição parcial e validação do estado resultante | CT01 | Casos B01/B02 e persistência |
| BE03 | Normalização dos nomes, tamanho após normalização, unicidade global de escola e parcial de turma ativa por escola; conflitos em renomear/reativar | CT02 | Índices/migrations e testes de integração; não basta consulta prévia |
| BE04 | Telefone canônico fixo/celular ou null, limpeza na edição e rejeição dos formatos fora do contrato | CT03 | B01/B02 |
| BE05 | Enums no código, combinação segmento/grupo, turno e situação; ausência de default silencioso de status; capacidade inteira >= 0 | CT01, CT04 | B01/B02; atualização parcial e limites técnicos |
| BE06 | Existência dos vínculos; mudança de setor permitida e schoolId de turma imutável; proteção contra alteração de IDs/datas | R02, R03, R12 | B03/B04/B10 por API e persistência |
| BE07 | Filtros por escola e situação; contrato do padrão ativas; soma somente de current, zero sem ativas e total independente do filtro | R04–R06 | B05/B06 |
| BE08 | Exclusão bloqueada por qualquer turma, inclusive encerrada; ausência de cascata; proteção por FK e tradução de conflitos | R07–R11 | B07–B09 com banco de teste |
| BE09 | Erros estruturados e consistentes que permitam à interface identificar causa/campo e orientar recuperação; sem SQL/stack trace para usuário | R09, R10; H01, H02, H05, H09 | Contrato e consumo real no frontend |
| BE10 | Dados suficientes para identificação dos registros, datas, filtros e total; respostas que distingam vazio de falha | R04–R06, R12; H01, H06 | Respostas da API e integração |
| BE11 | Coerência entre model, migrations e seeds; tipos, índices e opcionais; atomicidade quando houver múltiplas escritas dependentes | CT05; R08 | Banco de teste reconstruído conforme projeto, sem dados reais |
| BE12 | Testes com asserções significativas, regras e erros cobertos, limites de mocks e regressões; duplicação/legibilidade com impacto concreto | Casos B01–B10; AR01 | Comandos, ambiente, saídas e códigos de retorno |

## 3. Acessibilidade e usabilidade no backend

A revisão verifica suporte à interação: identificação de erros e campos, regras coerentes, respostas previsíveis, ausência de perda indevida e dados necessários à interface. Referências Hxx são relações com a tarefa, não uma avaliação completa da heurística pela API.

Não marcar Axx como atendido por um resultado do backend. Semântica HTML, foco, contraste e anúncios são avaliados no frontend/execução. Um bloqueio por FK com mensagem genérica demonstra proteção de integridade, mas pode revelar um problema de comunicação. Não relatar esse caso como exclusão indevida sem evidência.

## 4. Casos automatizados prioritários

| ID | Caso | Resultado a demonstrar |
|---|---|---|
| B01 | Cadastro/edição com dados válidos; leitura subsequente | Persistência e contrato corretos |
| B02 | Dados inválidos, referência inexistente e duplicidade conforme CT02 do documento 01 | Rejeição sem gravação indevida |
| B03 | Mudar escola de setor | Novo vínculo válido, turmas preservadas na mesma escola |
| B04 | Tentar mudar schoolId de turma por API | Rejeição; vínculo original preservado |
| B05 | Listagem ativas/todas/encerradas e escola distinta | Resultado filtrado corretamente e sem mistura entre escolas |
| B06 | Capacidade: ativa 30 + encerrada 20; mudar ativa para encerrada | Total inicial 30; depois zero; filtro visual não participa do cálculo |
| B07 | Excluir escola com turma ativa e com apenas encerrada | Ambas bloqueadas; registros preservados |
| B08 | Excluir turma e depois escola sem dependências | Exclusões permitidas, sem cascata |
| B09 | Integridade referencial por integração em banco de teste | FK impede órfãos/exclusão de pai vinculado; não basta mock de repository |
| B10 | Edição de turma | createdAt preservado e updatedAt coerente; campos protegidos não alterados pelo cliente |

Subcasos obrigatórios dentro de B01/B02/B05/B06, sem abrir novos cenários:

- Nome vazio após normalização e nomes acima de 100 caracteres (escola), 50 (turma) ou 150 (diretor); endereço vazio/acima de 255. Conferir aceitação dos limites exatos.
- Nomes de escola com diferenças apenas de capitalização/espaços conflitam, inclusive entre setores. Manter o próprio nome na edição não gera falso conflito.
- Turma ativa com mesmo nome normalizado na mesma escola conflita; em outra escola é permitida; encerradas podem repetir. Reativar uma encerrada conflita se já houver ativa homônima. Testar a proteção única em integração com o banco, não apenas mocks.
- Escola sem diretor/telefone é aceita e ambos podem ser limpos na edição; telefone fixo e celular canônicos são aceitos, telefone fora do contrato é rejeitado.
- Combinação de grupo/ano incompatível com segmento é rejeitada, inclusive em edição parcial. Valor fora dos enums do código é rejeitado.
- Cadastro sem status é rejeitado, sem default silencioso; current e completed são aceitos. Omitir status em atualização parcial mantém o existente.
- Capacidade zero é aceita e soma zero; negativa/fracionária é rejeitada. Caso de soma ativa 30 + encerrada 20 continua válido.

Executar os casos pertinentes à rodada. Registrar separadamente presença do teste, execução, resultado e limitações. Testes unitários com mocks não demonstram a existência/efetividade de constraints. Não impor metas percentuais de cobertura. Falhas preexistentes, falhas de ambiente e regressões devem ser distinguidas.

## 5. Arquivos de saída

Produzir dois arquivos em avaliacao/rodadas/[REV-XX]:

1. relatorio-backend.md: cabeçalho, objetivo, inventário, cobertura, testes executados e verificações pendentes, conforme o documento 04. A cobertura pode citar IDs de achados, sem reproduzir suas descrições.
2. achados-backend.json: todos os apontamentos da revisão no contrato JSON do documento 04, com campos nomeados e indentação de dois espaços. Não inserir achados em tabelas, listas narrativas ou blocos JSON dentro do relatório Markdown.

Para novos achados, usar [REV-XX]-BE-A001, A002 etc. O ID permanece estável nas reavaliações. Consultar avaliacao/achados.json nas rodadas em que ele já contiver registros, reutilizando IDs pertinentes. Se não houver achados, entregar o arquivo com achados: [] e o relatório com cobertura e limites. Não criar objeto fictício para representar ausência de problemas.

O JSON produzido pelo revisor registra classificação e evidência, mas deixa confirmacao_autora como pendente e situacao como aguardando_confirmacao. Somente registrar uma confirmação humana quando ela efetivamente ocorrer. Guardar sugestões rejeitadas e motivos no acompanhamento JSON; não excluí-las para melhorar o resultado aparente.

Reavaliações são arquivos novos, com sufixo -r02, -r03 etc., referenciando a nova versão de código. Não sobrescrever os produtos de uma execução já encerrada. O acompanhamento consolidado fica em avaliacao/achados.json, no mesmo contrato, conforme o documento 04.

## 6. Pedido reutilizável

> Revise o backend na rodada [REV-XX], execução [r01], versão [commit e alterações locais]. Leia os documentos 01, 03 e 04. O objetivo é [objetivo] e o alcance é [funcionalidades/componentes/requisitos]. Faça o inventário do escopo e registre o que foi efetivamente examinado. Não altere código. [Indicar testes incluídos e ambiente isolado, ou apenas inspeção.] Produza relatorio-backend.md com cabeçalho, inventário, cobertura, testes e pendências, e achados-backend.json separado com todos os apontamentos no contrato do documento 04. Não inclua descrições de achados no Markdown. Para a REV-01, comece com registro vazio; nas seguintes, consulte avaliacao/achados.json para reutilizar IDs. Não invente resultados de execução nem confirmação humana. Salve em [pasta da rodada].
