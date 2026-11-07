# Regras de negócio e requisitos do sistema

Laura Vieira · Instrumento de trabalho do TCC · 05/11/2026

## 1. Finalidade e uso

Este documento define o escopo e os requisitos usados na implementação e na avaliação do sistema. Os instrumentos 02 e 03 orientam a revisão de frontend e backend. O instrumento 04 define o relatório de rodada em Markdown e os arquivos de achados em JSON. O guia pessoal 05 orienta a execução do trabalho.

Os requisitos são identificados por R01–R13, Axx e Hxx. Os contratos usam CT01 (campos, seção 2.4), CT02 (normalização e unicidade, 2.5), CT03 (telefone, 2.6), CT04 (segmentos, turnos e situação, 2.7), CT05 (seeds e persistência, 2.8) e AR01 (arquitetura, seção 5). Citar também entidade, campo e aspecto quando necessário.

A avaliação começa na rodada REV-01, com inspeção do código disponível e inventário das funcionalidades. Essa rodada e as seguintes utilizam o mesmo formato de relatório e achados. Uma funcionalidade prevista e ainda ausente é registrada como lacuna de implementação; a diferença entre a arquitetura existente e a arquitetura alvo não é automaticamente um defeito funcional.

Revisão de código, verificações no navegador, teclado, contraste e testes automatizados pertinentes acompanham o desenvolvimento. Sessões com usuários e verificação técnica com NVDA ocorrem na etapa final. A aplicação parcial do recorte não permite declarar conformidade integral com as normas.

## 2. Escopo e regras confirmadas

### 2.1 Operações por entidade

| Entidade | Operações nesta versão | Limites |
|---|---|---|
| Setor | Listar setores; consultar escolas de um setor | Cadastro prévio por seed; sem criar, editar ou excluir setores pela aplicação/API pública do escopo |
| Escola | Cadastrar, listar por setor, consultar, editar, excluir; consultar suas turmas e capacidade total | Pode mudar para outro setor existente; não possui dados avançados nem indicadores de ocupação |
| Turma | Cadastrar em uma escola, listar por escola, consultar detalhes, editar e excluir | Escola definida no cadastro e imutável depois; detalhes incluem datas de criação e última atualização |

Dados atuais da turma: id, schoolId, name, grade, segment, shift, status, maxOccupancy, createdAt e updatedAt. Mostrar o vínculo com a escola de forma compreensível, pelo nome; não usar identificadores internos como informação principal. Não é necessário criar campos editáveis para IDs ou datas gerenciadas pelo sistema.

### 2.2 Regras de negócio

| ID | Regra confirmada |
|---|---|
| R01 | Setores são dados administrativos previamente cadastrados. Remover “Adicionar Setor” da interface. |
| R02 | Escola pode mudar de setor; validar a existência do destino. Suas turmas continuam vinculadas à mesma escola. |
| R03 | Turma pertence a uma escola existente. Rejeitar tentativa de transferi-la, inclusive por requisição direta à API. |
| R04 | Usar “Ativa” para current e “Encerrada” para completed. Permitir editar a situação. |
| R05 | Ao abrir a listagem de turmas de uma escola, mostrar ativas por padrão. Permitir selecionar Ativas, Todas e Encerradas; identificar a seleção visual e programaticamente. |
| R06 | Capacidade total da escola = soma de maxOccupancy apenas das turmas current. O filtro visual não altera esse total. A soma sem turmas ativas é zero. |
| R07 | Bloquear exclusão de escola com qualquer turma vinculada, inclusive encerrada. Não excluir dependentes em cascata. |
| R08 | Preservar integridade na API e nas restrições do banco. Uma verificação no service não dispensa a proteção da chave estrangeira. |
| R09 | Informar por que a operação foi bloqueada e o que fazer: remover primeiro as turmas, depois a escola. Não criar exclusão de setores para demonstrar a regra. |
| R10 | Confirmar exclusões identificando o registro; permitir cancelar sem mutação. Validar dados antes de salvar e preservar o preenchimento após erro. |
| R11 | Turma pode ser excluída após confirmação. Não inventar dependências de matrícula: não existem neste escopo. Se o código atual revelar outras dependências, registrar para análise. |
| R12 | Atualização mantém a data de criação e reflete a última edição na data de atualização; apresentar datas de modo compreensível e consistente. |
| R13 | Remover “Dados avançados”, “Vagas ocupadas” da escola e “Alunos matriculados” da turma. Renomear a ação ambígua “Apagar informações” para “Excluir escola”. |

Exemplo de mensagem: “Não é possível excluir esta escola porque existem turmas vinculadas a ela. Exclua primeiro as turmas e tente novamente.” A mensagem deve permitir localizar também turmas encerradas pelo filtro correspondente.

### 2.3 Fora do escopo

- Login, permissões e perfis administrativos; manutenção de setores por usuário autorizado fica para evolução futura.
- Alunos, matrículas e cálculo de ocupação; grade curricular, funcionários e demais novos módulos.
- Mapa dos setores, dados avançados, tabelas na interface, menus flutuantes/submenus, atalhos próprios, arraste/gestos, animações e limites de tempo.
- Novos frameworks, migração de stack, abstrações genéricas sem necessidade e metas arbitrárias de cobertura.
- Integração de Playwright ou axe-core; simulação de conexão lenta e testes de desempenho.

Não confundir “não implementar agora” com “defeito de acessibilidade”. Na versão examinada, controles que prometem ações inexistentes podem ser achados de usabilidade; funções futuras ausentes são lacunas funcionais, não reprovação automática de todos os critérios.

### 2.4 Contrato dos campos — decisões fechadas

Aplicar as mesmas regras no cadastro e na edição. Campos obrigatórios não aceitam null, texto vazio ou somente espaços. Nas edições parciais, campo omitido mantém o valor atual; isso é diferente de enviar null para apagá-lo. Validar o estado resultante completo, inclusive segmento/grupo e situação/unicidade. IDs e datas são gerenciados pelo sistema, não são campos de edição livre.

| Entidade/campo | Obrigatório | Regra final |
|---|---|---|
| Escola.name | Sim | Nome normalizado conforme seção 2.5; 1 a 100 caracteres após normalização; único globalmente entre todos os setores |
| Escola.address | Sim | Campo único de texto, com trim; 1 a 255 caracteres; sem desmembrar rua, número, bairro etc. |
| Escola.headteacher | Não | Trim; até 150 caracteres; manter capitalização informada; vazio ou somente espaços é salvo como null; permitir limpar na edição |
| Escola.phone | Não | Texto no formato canônico da seção 2.6 ou null; aceitar fixo/celular; string vazia não é um segundo formato válido da API |
| Escola.sectorId | Sim | Inteiro positivo que identifique setor existente; pode ser alterado para outro setor válido |
| Turma.name | Sim | Nome normalizado conforme seção 2.5; 1 a 50 caracteres; único apenas entre turmas ativas da mesma escola |
| Turma.schoolId | Sim, no cadastro | Inteiro positivo de escola existente; vínculo imutável depois; rejeitar tentativa de trocar a escola pela API |
| Turma.segment | Sim | Valor pertencente às quatro opções da seção 2.7, validadas no código |
| Turma.grade | Sim | Grupo/ano pertencente ao segmento selecionado, validado no backend |
| Turma.shift | Sim | Matutino, Vespertino, Noturno ou Integral, com enum/constantes no código |
| Turma.status | Sim, no cadastro | Somente current/completed; frontend seleciona current inicialmente e envia o valor; backend não atribui padrão nem o banco. Edição oferece as duas opções; omissão em edição parcial preserva situação existente |
| Turma.maxOccupancy | Sim | Inteiro maior ou igual a zero; rejeitar negativos/fracionários; sem teto adicional de negócio. Respeitar o limite técnico do tipo inteiro e tratar entradas fora dele sem erro bruto de banco |
| IDs, createdAt e updatedAt | Gerenciados pelo sistema | Não aceitar alteração arbitrária pelo cliente; preservar data de criação e atualizar data de edição |

Não impor obrigatoriedade de diretor(a) ou telefone no banco: ajustar schema/model/migration para aceitar null. Uma escola pode ser cadastrada antes de ter diretor(a). O nome do diretor é texto informativo, sem dependência de um módulo de funcionários.

### 2.5 Normalização, apresentação e unicidade dos nomes

Para Escola.name e Turma.name, antes de validar tamanho, procurar duplicidade e salvar:

1. Aplicar trim para remover espaços das extremidades.
2. Reduzir sequências de espaços em branco internos a um único espaço.
3. Converter para minúsculas, preservando acentos.
4. Rejeitar resultado vazio e validar o limite de tamanho.

Aplicar a todas as turmas, inclusive encerradas. Exemplo: `  TURMA   A  ` é salvo como `turma a`. Não criar campo extra com nome original ou versão normalizada: o próprio nome salvo já é normalizado.

- Escola: manter UNIQUE(name). A unicidade vale globalmente, não por setor.
- Turma: usar índice único parcial em (schoolId, name), condicionado a status = 'current'. Não usar UNIQUE(name) global nem UNIQUE(schoolId, name) sem condição: encerradas podem repetir nomes e escolas diferentes podem ter nomes iguais.
- Verificar conflitos ao cadastrar, renomear ou reativar uma turma. Reativação conflitante é rejeitada, mantendo o estado anterior.
- Consulta prévia de duplicidade pode ajudar a mensagem, mas a restrição única no banco garante a regra em gravações concorrentes. Traduzir conflito do banco em mensagem compreensível.
- Não implementar comparação que remova acentos: `jose` e `josé` permanecem distintos.

Na apresentação, o frontend capitaliza a primeira letra de cada palavra do nome da escola e apresenta o nome da turma inteiro em maiúsculas. A formatação não altera o valor canônico persistido. O backend sempre normaliza qualquer entrada novamente, mesmo quando enviada por formulário de edição.

Nas escolas, usar denominações por extenso quando necessário, como “Centro Integrado de Educação Pública”, sem expansão automática de siglas. Esse prefixo tem 36 caracteres; com o espaço seguinte, restam 63 no limite de 100 para nome/número da unidade. Se uma seed real do projeto ultrapassar o limite, registrar a ocorrência para ajuste pontual na modernização; não truncar ou abreviar silenciosamente.

### 2.6 Contrato único de telefone entre frontend e backend

- Armazenar como texto: `+55` + DDD de dois dígitos + número local de oito dígitos (fixo) ou nove (celular), sem máscara/espaços/pontuação adicional.
- Exemplos de formato: fixo `+552223456789`; celular `+5522998765432`.
- Sem telefone, o frontend envia null; edição pode enviar null para limpar. O backend não aceita string vazia, formato nacional com máscara ou número JSON como alternativas ao contrato.
- O formulário pode aceitar digitação com máscara e exibir `(22) 2345-6789` ou `(22) 99876-5432`, mas converte para o formato canônico antes de enviar à API.
- Validar a estrutura canônica no backend. A verificação de formato não comprova existência, titularidade ou funcionamento da linha; não acrescentar consulta externa de telefonia.

### 2.7 Segmentos, grupos/anos, turnos e situação

| Segmento | Opções de grade | Rótulo no formulário |
|---|---|---|
| Educação Infantil — Creche | Berçário; Maternal I; Maternal II | Grupo |
| Educação Infantil — Pré-escola | Jardim I; Jardim II | Grupo |
| Ensino Fundamental | 1º ano; 2º ano; 3º ano; 4º ano; 5º ano; 6º ano; 7º ano; 8º ano; 9º ano | Ano |
| Ensino Médio | 1º ano; 2º ano; 3º ano | Ano |

Turnos: Matutino, Vespertino, Noturno e Integral. Situações: Ativa (current) e Encerrada (completed).

Definir enums/constantes no código do backend, persistindo valores como texto; não criar enums nativos no banco nem tabelas de administração dessas opções. Aplicar também a status, substituindo o enum nativo existente durante a modernização. Manter os valores current/completed; quaisquer identificadores internos das demais opções devem ser consistentes entre contrato e mapeamento de apresentação.

No frontend, usar menus de seleção em cadastro e edição. Grupo/ano depende do segmento: ao alterá-lo, limpar a seleção anterior se ficar incompatível; não trocar automaticamente para um grupo arbitrário. O backend valida a combinação no cadastro e no estado resultante da edição, mesmo quando a requisição é enviada diretamente à API.

Usar a nomenclatura aprovada como convenção do estudo de caso. Faixas etárias são apenas referência descritiva, sem validação de idade, pois alunos e matrículas estão fora do escopo. Não usar G1–G5 nem denominar o Ensino Médio por “série”.

### 2.8 Seeds e organização da execução

Não realizar tratamento de dados legados nem migração de dados reais. Se seeds divergirem de regras atuais ou das regras alvo, registrar a divergência na rodada e corrigir as seeds na implementação; preservar a evidência da versão examinada. Atualizar as migrations necessárias ao schema alvo continua fazendo parte da implementação: ausência de dados legados não dispensa definir colunas opcionais, tipos e índices.

Não restam decisões de modelagem/validação em aberto. Convidar participantes e agendar as três sessões são tarefas operacionais do guia pessoal, não pendências de contrato.

## 3. Requisitos operacionais de acessibilidade

### 3.1 Alcance e leitura

O recorte contém 25 verificações operacionais que agrupam aspectos afins. Não equivale a 25 critérios normativos nem a uma avaliação integral da ABNT ou das WCAG. Os identificadores Axx são códigos do instrumento; sua sequência não representa uma escala ou obrigação de incluir os números ausentes.

As referências ABNT servem para localizar requisitos. Consultar o texto integral quando a decisão depender de alternativas ou exceções. Somente o procedimento delimitado é avaliado. Uma conclusão parcial não comprova atendimento ao item normativo inteiro.

Selecionar aspectos dos níveis A e AA. Em A33, avaliar ampliação de texto; a largura de 80 caracteres não integra o recorte. A31 não inclui requisitos de aparência de foco AAA. As referências normativas fundamentam as mesmas verificações operacionais.

Métodos: IC = inspeção de código; IN = interação no navegador; LT = NVDA; CC = cálculo de contraste com cores efetivas. Reutilizar uma evidência entre IDs quando ela de fato cobrir cada aspecto. Uma falha basta para registrar falha no recorte; ausência de achados da IA não significa aprovação.

| ID | Referência ABNT | Procedimento/condição operacional neste recorte | Método |
|---|---|---|---|
| A01 | 5.1.1; 5.1.3; 5.1.4; 5.1.6; 5.1.13 | Percorrer ações por teclado, com foco perceptível, sequência coerente, sem aprisionamento ou ocultação completa. Verificar entrada/saída de confirmação e foco após mudança de tela. | IC + IN |
| A05 | 5.2.1–5.2.3 | Conferir alternativa de imagens informativas e nome de ícones funcionais; ignorar decoração na leitura. | IC + LT |
| A07 | 5.3.1; 5.3.2; 5.3.5 | Comparar títulos visuais e semânticos; navegar por títulos e compreender a organização da tela. | IC + LT |
| A08 | 5.4.1; 5.4.2; 5.4.5 | Identificar conteúdo principal e navegação; distinguir regiões repetidas quando necessário. | IC + LT |
| A09 | 5.5.1; 5.5.2 | Verificar estrutura de listas para conjuntos de setores/escolas/turmas, ainda que visualmente sejam cartões. | IC + LT |
| A11 | 5.7.1; 5.7.2; 5.7.4 | Abrir links; conferir destino, função e nome compreensível no contexto. | IC + IN + LT |
| A12 | 5.7.12 | Quando houver navegação repetida, verificar mecanismo para chegar diretamente ao conteúdo principal. | IC + IN |
| A14 | 5.7.15 | Comparar posição relativa e comportamento da navegação compartilhada nas telas do percurso. | IN |
| A16 | 5.8.1–5.8.3 | Acionar salvar, editar, excluir, cancelar e filtros; verificar semântica de ação e nome. | IC + IN + LT |
| A17 | 5.8.5 | Comparar rótulos de comandos equivalentes; usar “Excluir escola”/“Excluir turma” e termos consistentes. | IN |
| A19 | 5.8.9; 5.8.10 | Focar e preencher campos não deve provocar envio ou navegação inesperados. | IN |
| A22 | 5.9.1–5.9.4; 5.9.7 | Conferir rótulos associados, indicação de obrigatoriedade e identificação de campos pelo leitor. | IC + IN + LT |
| A23 | 5.9.5; 5.9.6; 5.9.8 | Conferir tipos de entrada, instruções e agrupamentos nos formulários onde necessários. | IC + IN + LT |
| A24 | 5.9.9; 5.9.10 | Enviar dados inválidos conforme os contratos da seção 2; identificar campo/erro e orientação de correção. | IC + IN + LT |
| A25 | 5.9.12 | Para criação/edição, verificar mecanismo de revisão, confirmação ou validação que detecte erros de entrada e permita correção antes de finalizar; campos required isolados não provam proteção completa. Para exclusão, confirmar registro e cancelamento sem alteração. Registrar o mecanismo aplicado. | IC + IN |
| A28 | 5.10.1–5.10.4 | Conferir instruções e sequência; testar largura de 320 px CSS e orientação, sem perda de conteúdo/operação nas telas do recorte, respeitando exceções. | IC + IN |
| A29 | 5.11.1 | Conferir situação, filtro e erros: informação necessária não depende apenas de cor. | IN |
| A30 | 5.11.3 | Medir pares distintos de texto/fundo efetivos: mínimo 4,5:1, ou 3:1 para texto grande (18 pt ou 14 pt em negrito); registrar exceções pertinentes. | IN + CC |
| A31 | 5.11.4–5.11.6 | Medir contraste das partes essenciais de controles/indicadores de estado e foco: 3:1 nas relações aplicáveis; registrar exceções. Não inferir pelas cores declaradas no código. | IN + CC |
| A33 | 5.12.7; recorte de ampliação | Ampliar texto a 200% e verificar preservação de conteúdo e funções. Não avaliar limite de 80 caracteres (5.12.6). | IN |
| A35 | 5.13.1–5.13.3 | Conferir título de cada página, idioma principal e trechos em outro idioma quando aplicáveis. | IC + IN + LT |
| A37 | 5.13.5; 5.13.6 | Conferir ausência de bloqueio ao zoom e ordem lógica de leitura; reutilizar evidência de ampliação sem duplicar teste. | IC + IN + LT |
| A38 | 5.13.7; 5.13.10 | Conferir nome acessível de controles e sua correspondência ao texto visível. | IC + IN + LT |
| A39 | 5.13.8 | Conferir anúncio de resultado, erro e sucesso sem busca visual; observar carregamento apenas quando aparecer normalmente. Não atrasar rede para provocá-lo. | IC + LT |
| A40 | 5.13.12; 5.13.13 | Conferir função e estados dos controles customizados efetivamente existentes. Inspecionar HTML gerado por LinkContainer antes de concluir sobre ele; React por si só não significa controle customizado. | IC + IN + LT |

A aparência responsiva e o contraste precisam de evidência renderizada. Leitura do código não comprova fala do NVDA, ordem efetiva do foco ou funcionamento da confirmação.

### 3.2 Exclusões e condições

| IDs/temas | Decisão |
|---|---|
| A13, A18, A20, A32, A34 | Fora da avaliação sistemática por delimitação da pesquisa, não “não aplicáveis” automaticamente |
| A06 | Mapa retirado; fora do roteiro. Confirmar ausência de outros conteúdos abrangidos, como imagens com texto, antes de chamar o grupo inteiro de não aplicável |
| A10 | Tabelas fora do projeto da interface. Confirmar ausência no inventário da versão examinada |
| A02, A03, A04, A15, A21, A26, A27, A36, A41, A42 | Recursos fora do projeto. Se algo existir na versão examinada, registrar a presença e o limite do recorte, sem presumir ausência |
| Áudio/vídeo, autenticação, AAA, eMAG como instrumento | Fora do recorte; não adicionar testes nem módulos para cobri-los |

Não reapresentar A20 como necessário por haver exclusão: cancelar uma confirmação de exclusão (A25) é diferente de testar o cancelamento de eventos de ponteiro (A20).

### 3.3 Estados de avaliação

- Não verificado: estado inicial; também usar quando faltou execução/evidência.
- Atende ao recorte verificado: todos os passos aplicáveis definidos para as ocorrências selecionadas foram conferidos; informar alcance.
- Não atende ao recorte: falha confirmada, com evidência.
- Não aplicável: condição realmente ausente, com justificativa.
- Não implementado: operação prevista ainda ausente; não conta como aprovação.
- Fora do recorte: exclusão deliberada da pesquisa, distinta de ausência.

Resultados são locais ao recorte; não calcular “percentual de acessibilidade do sistema”. Achado confirmado/indício é uma classificação da evidência, distinta do resultado de um teste.

## 4. Requisitos de usabilidade por tarefas

As dez heurísticas de Nielsen são referências interpretativas. Não haverá 20 itens obrigatórios em cada tela nem uma nota geral de usabilidade. Relacionar um achado às heurísticas pertinentes sem multiplicá-lo.

| Referência | Pergunta aplicada às tarefas |
|---|---|
| H01 — Visibilidade do estado | A pessoa distingue processamento, vazio, resultado, sucesso e erro? |
| H02 — Correspondência com o domínio | Entende setor, escola, turma, segmento, grupo/ano e situação? |
| H03 — Controle e liberdade | Pode voltar ou cancelar sem alterações indesejadas? |
| H04 — Consistência | Termos e ações equivalentes mantêm significado? |
| H05 — Prevenção de erros | Há validação e proteção contra exclusão acidental? |
| H06 — Reconhecimento | Consegue identificar escola, turma e setor sem memorizar IDs? |
| H07 — Eficiência | Os percursos e filtros evitam passos desnecessários? Não exigir busca ou atalhos novos. |
| H08 — Minimalismo | A tela mostra informações úteis e ações realmente disponíveis? |
| H09 — Recuperação de erros | Entende a causa, o próximo passo e consegue corrigir sem refazer tudo? |
| H10 — Ajuda | Rótulos/instruções locais bastam nas situações de dúvida? Não criar central de ajuda. |

## 5. Arquitetura alvo AR01

- Rotas/controllers: receber dados HTTP, encaminhar à aplicação e produzir respostas. Validação de formato pode ser feita na entrada; regras de negócio pertencem ao service.
- Services: coordenar casos de uso e aplicar regras de negócio, inclusive vínculos e capacidade.
- Repositories: concentrar acesso ao banco e consultas, incluindo agregação quando apropriado; sem req/res, status HTTP ou dependência de services.
- Models: representar persistência e relacionamentos no ORM. Restrições do banco protegem integridade.
- Direção: controller → service → repository → model/banco. Não acessar banco diretamente do controller ou do service neste desenho; service usa repository. Evitar dependências circulares.
- Não criar repository genérico, interfaces, contêiner de injeção ou abstrações extras por obrigação. Não reescrever stack. Preservar contratos existentes salvo alteração funcional explicitada.

Organizar services e repositories por entidade, conforme as responsabilidades reais. Mudanças estruturais que preservam comportamento são distinguidas de correções e ampliações funcionais. A ausência dessa arquitetura na versão examinada não constitui, sozinha, defeito funcional.

## 6. Aplicação e referências

Registrar na rodada a versão deste documento utilizada. Mudanças de requisito precisam de decisão da autora, data e motivo. As conclusões devem corresponder ao requisito e à versão efetivamente examinados.

Referências: ABNT NBR 17225:2025; WCAG 2.2 (https://www.w3.org/TR/WCAG22/); heurísticas de Nielsen (https://www.nngroup.com/articles/ten-usability-heuristics/). Os códigos Axx são verificações operacionais do estudo; as referências ABNT indicam localização, sem equivalência integral automática entre normas.

## 7. Implementações futuras

### 7.1 Tratamento de requisições concorrentes

Decisão da autora em 07/11/2026: adiar a implementação da proteção de edições
concorrentes da mesma turma. Motivo do registro: foi identificado que duas
requisições podem validar separadamente dados compatíveis com o estado inicial
e, juntas, persistir um estado final inválido. Esta pendência se relaciona a
CT01, CT04 e R08; seu registro não significa que o problema esteja corrigido.

Exemplo confirmado: uma turma em Ensino Fundamental / 1º ano recebe, ao mesmo
tempo, uma edição apenas de segment para Ensino Médio e outra apenas de grade
para 9º ano. As duas podem retornar sucesso e deixar Ensino Médio / 9º ano no
banco, combinação incompatível com o contrato.

Na implementação futura, proteger a leitura, a validação do estado resultante
completo e a gravação contra alterações concorrentes da mesma turma. A abordagem
proposta é executar essas etapas na mesma transação, adquirindo bloqueio do
registro na leitura (SELECT ... FOR UPDATE). A segunda edição deve aguardar a
primeira e validar sobre o estado atualizado. Preservar AR01: o service coordena
as regras e o repository concentra a transação, o bloqueio e o acesso ao banco.

Acrescentar teste automatizado com requisições concorrentes e PostgreSQL real
que reproduza o exemplo. Após a correção, uma edição deve ter sucesso e a outra
deve receber 422 com orientação sobre a combinação inválida, preservando o
estado válido salvo pela primeira. Conferir também edições concorrentes
compatíveis, sem perda de campos omitidos, e liberação do bloqueio após erro.

As validações de requisições isoladas continuam obrigatórias e já bloqueiam
alterar somente o segmento quando o ano mantido fica incompatível. As proteções
existentes por chaves estrangeiras e índices únicos, inclusive para nomes de
turmas ativas, permanecem no escopo atual. O adiamento se refere à proteção
adicional contra edições simultâneas do mesmo registro descrita nesta seção.

### 7.2 Busca de escolas por nome

Proposta da autora registrada em 07/11/2026 para implementação futura: permitir
localizar e acessar uma escola pelo nome, sem precisar saber ou selecionar
previamente o setor ao qual ela pertence.

Motivação: exigir que uma pessoa que já conhece o nome da escola também saiba
seu setor pode impor uma necessidade de memorização e passos adicionais na
navegação. A proposta se relaciona principalmente a H06 — Reconhecimento, por
reduzir a dependência de conhecimento prévio do setor, e a H07 — Eficiência,
por oferecer um caminho direto até a escola. A confirmação dessa dificuldade
como achado depende da avaliação do percurso no frontend.

No backend, prever busca entre escolas de todos os setores, aceitando parte do
nome, sem exigir correspondência exata. Uma possibilidade é consultar com LIKE
do SQL, usando parâmetro de consulta e o padrão de correspondência parcial
%termo%, sem concatenar a entrada diretamente ao comando SQL. Normalizar o
termo de forma compatível com os nomes persistidos e preservar a distinção de
acentos do contrato atual. Manter a direção arquitetural AR01.

No frontend, prever uma barra de busca por nome de escola. Apresentar os
resultados com o nome da escola e seu setor como contexto e permitir abrir
diretamente a escola escolhida. Informar quando não houver resultados e
permitir corrigir ou limpar o termo e realizar outra busca. A busca complementa
o percurso existente de navegação por setores.

Na implementação, testar correspondência parcial, resultados em setores
diferentes, ausência de resultados e acesso à escola selecionada. Verificar
também rótulo acessível, operação por teclado e anúncio dos resultados na
interface. Esta proposta permanece como evolução futura; não cria uma exigência
retroativa de busca no recorte atual de H07.
