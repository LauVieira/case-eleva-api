# Testes das funcionalidades existentes

A suíte começou pela caracterização do comportamento observado no sistema, antes
da refatoração em camadas. A referência inicial tinha 94 testes em três suítes.
Essa etapa não usava funcionalidades futuras dos requisitos como expectativas.

Depois, as correções funcionais foram autorizadas separadamente. As expectativas
afetadas passaram a representar o contrato corrigido; os registros anteriores e
as versões dos testes permanecem nas evidências. Os testes atuais, portanto, já
não descrevem integralmente o comportamento original.

## O que é verificado

| Área | Verificações atuais |
| --- | --- |
| Setores | Listagem completa e ordenada; escolas somente do setor consultado; vazio, ausência e identificador inválido. |
| Cadastro de escola | Campos obrigatórios/opcionais, limites, telefone canônico, setor existente, rejeição de campos extras e de IDs/datas enviados pelo cliente; nenhuma gravação após rejeição. |
| Edição de escola | PATCH parcial; preservação de campos omitidos e createdAt; renovação de updatedAt; validação do estado completo; troca de setor sem mudar turmas; conflitos globais e no setor informado, inclusive concorrentes. |
| Exclusão de escola | DELETE sem turmas; bloqueio por qualquer turma, inclusive encerrada ou de capacidade zero; integridade sem cascata e proteção contra inserção de turma entre checagem e exclusão. |
| Nomes de escola | Sanitização antes da validação; espaços internos e minúsculas; acentos preservados; unicidade global e conflito em criações concorrentes. |
| Consulta da escola | Dados persistidos e totalCapacity calculado somente com turmas current; zero sem ativas; soma independente do filtro da listagem. |
| Turmas da escola | current por padrão; filtros current, completed e all; ordenação, isolamento por escola e filtro inválido. |
| Cadastro de turma | Escola da URL; campos e situação obrigatórios; normalização do nome; opções de segmento/grupo/ano e turno; capacidade zero e limite técnico; unicidade de ativas por escola e conflito concorrente; mensagens de erro e ausência de gravação após rejeição. |
| Edição de turma | PATCH parcial; vínculo imutável; campos omitidos e data de criação preservados; estado completo e combinação segmento/ano validados; encerramento e reativação; conflitos de nome, inclusive concorrentes; reflexos nos filtros e na capacidade da escola. |
| Persistência | Colunas opcionais, tamanhos, status textual sem padrão, índice único parcial, capacidade não negativa, limites do inteiro e chaves estrangeiras sem exclusão em cascata. |
| Models de turma | Opções de segmento/ano/turno, limites de nome e capacidade; não substituem testes de futuras rotas de escrita. |
| Migrations e seeds | Migrations reais; reversão/reaplicação das novas migrations em base vazia e das seeds; dados normalizados, datas e quatro segmentos. |
| Erros | JSON; campo, causa e orientação em português; JSON malformado em 400, validação em 422, ausência em 404, conflito em 409 e falha inesperada em 500 sem detalhes internos. |
| Sanitização | Objetos/arrays aninhados, tipos diversos, HTML, entidades e espaços; sem modificar a entrada. |

O Joi valida e converte strings numéricas dos IDs; os serviços utilizam o valor
retornado pela validação. Também aceita notação decimal ou exponencial quando o
resultado é um inteiro positivo dentro do limite. Letras misturadas ao número,
frações, zero, negativos e valores acima do limite são rejeitados. Telefone tem
validação estrita: continua sendo texto canônico ou null. Sanitização, normalização
dos nomes e atribuição de null aos opcionais permanecem fora do Joi.

Os testes HTTP exercitam o app Express pelas rotas, usando Supertest e PostgreSQL
real. Um teste sincroniza as consultas de duplicidade para provocar duas inserções
concorrentes. Outro provoca uma falha de repository para conferir o erro inesperado.
Esses controles pontuais não simulam as restrições do banco.

## Edição parcial de escola

PATCH /schools/:id aceita um ou mais campos entre sectorId, name, address,
headteacher e phone. Os campos omitidos mantêm seus valores; o estado resultante
completo é validado antes de salvar. headteacher vazio vira null; phone só pode
ser texto canônico ou null. Corpo vazio, campos extras, IDs e datas no corpo são
rejeitados. A resposta 200 contém a escola persistida, sem totalCapacity, como no
cadastro; createdAt é preservado e updatedAt reflete a edição.

Quando sectorId é enviado, uma função separada valida o destino e verifica o
nome resultante nele. Conflito no setor informado retorna 409 com a mensagem
“Já existe uma escola com este nome neste setor”. A unicidade global continua
valendo para os outros setores, com a mensagem geral de nome duplicado.
Setor inexistente e dados inválidos retornam 422; escola inexistente, 404.
JSON malformado ou primitivo é rejeitado pelo parser existente com 400.

## Exclusão de escola

DELETE /schools/:id retorna 204 sem corpo ao excluir uma escola sem turmas.
Uma função separada no service verifica a existência de qualquer turma vinculada,
sem filtro por situação. Se houver, retorna 409 com o motivo e a orientação:
“Não é possível excluir esta escola porque existem turmas vinculadas a ela.
Exclua primeiro as turmas e tente novamente.” Turmas encerradas também bloqueiam
a exclusão; o filtro Encerradas ou Todas permite localizá-las.

A chave estrangeira protege a exclusão mesmo se uma turma for inserida depois
da checagem; esse conflito também retorna 409. Nenhum dependente é excluído em
cascata. ID inválido retorna 422; escola inexistente na consulta inicial, 404;
falha na exclusão retorna 500 com mensagem de tentativa novamente, sem detalhes
internos. A confirmação identificando a escola e a possibilidade de cancelar
pertencem à interface e não são verificadas por estes testes da API.

## Cadastro de turma

POST /schools/:id/classes cria uma turma na escola identificada pela URL.
O schoolsRouter encaminha ao SchoolController; as regras ficam no ClassService,
que consulta SchoolRepository e ClassRepository. O corpo contém name, segment,
grade, shift, status e maxOccupancy, todos obrigatórios. schoolId, IDs, datas e
campos desconhecidos no corpo são rejeitados; a escola é definida pela URL.

Exemplo de corpo:

~~~json
{
  "name": "Turma A",
  "segment": "Ensino Fundamental",
  "grade": "1º ano",
  "shift": "Matutino",
  "status": "current",
  "maxOccupancy": 20
}
~~~

O nome é sanitizado e normalizado antes de validar o limite de 50 caracteres.
grade precisa pertencer ao segmento selecionado; turnos e situações seguem as
constantes existentes. status deve ser enviado como current ou completed, sem
padrão no backend. maxOccupancy aceita zero até 2147483647, sem teto adicional
de negócio. Joi converte texto numérico em capacidade inteira quando válido.

A resposta 201 contém a turma persistida com schoolId, id, createdAt e updatedAt.
Turmas current só podem repetir nome em escolas diferentes; encerradas podem
repetir nomes. Conflitos de ativas retornam 409 com “Já existe uma turma ativa
com este nome nesta escola. Informe outro nome.” O índice parcial garante essa
regra em criações concorrentes. Escola inexistente retorna 404; dados inválidos,
422; JSON malformado ou primitivo, 400; falhas inesperadas, 500 sem detalhes
internos. Os testes verificam também as mensagens de erro completas.

## Edição parcial de turma

PATCH /classes/:id aceita name, segment, grade, shift, status e maxOccupancy.
A rota usa ClassController e ClassService. A criação permanece no SchoolController,
em POST /schools/:id/classes. Na edição, schoolId é imutável: enviá-lo é rejeitado
mesmo que repita a escola atual. id, createdAt, updatedAt e campos desconhecidos
também são rejeitados. É necessário enviar pelo menos um campo editável.

Campos omitidos preservam seus valores. A validação usa o estado resultante
completo e aplica as mesmas regras do cadastro, incluindo normalização do nome.
Ao alterar só o segmento ou só o grupo/ano, a combinação com o campo mantido
precisa continuar válida. É possível enviar ambos juntos; a API não escolhe
automaticamente outro grupo/ano. null e texto vazio não apagam campos obrigatórios.

status omitido mantém a situação. Ao renomear ou reativar, o nome resultante não
pode coincidir com outra turma ativa da mesma escola. Encerradas podem repetir
nomes. O índice parcial protege também renomeações e reativações concorrentes.
Encerrar e renomear na mesma requisição é permitido, mesmo que o nome já seja
usado por uma ativa. Mudanças de situação e capacidade refletem nas consultas
existentes, sem armazenar um total de capacidade separado na escola.

A resposta 200 contém a turma persistida, preservando createdAt e refletindo a
edição em updatedAt. Erros retornam mensagens em JSON: 422 para dados inválidos,
404 para turma inexistente na consulta inicial, 409 para conflito de nome e
500 para falha na atualização, com “Não foi possível atualizar a turma.
Tente novamente.” Os testes verificam as mensagens completas e os dados
preservados após rejeição.

## Execução

Instale as dependências e disponibilize PostgreSQL. TEST_DATABASE_URL seleciona
o banco dos testes; na ausência dela, utiliza-se DATABASE_URL do ambiente/.env.
O usuário do banco precisa de permissão para criar schemas.

~~~sh
npm.cmd test -- --detectOpenHandles
npm.cmd test -- --coverage=false --runTestsByPath tests/integration/schools.capacity.test.js
npm.cmd test -- --coverageReporters=text --coverageReporters=html
~~~

No PowerShell, npm.cmd funciona mesmo quando a execução de npm.ps1 é bloqueada.
O último comando mostra a tabela no terminal e gera coverage/index.html.
Não há meta percentual de cobertura.

Cada suíte cria um schema exclusivo eleva_test_<pid>_<identificador>. Todas as
migrations são aplicadas ali, com tabelas e referências no mesmo espaço. Não se usa
sync(). Importe o helper antes do app/models; ele configura schema e search_path.
A limpeza ocorre na ordem turmas, escolas e setores. No encerramento, o schema e
as conexões dos dois pools são fechados. As tabelas public não são limpas nem
migradas por essa execução. Os testes devem terminar sem --forceExit.
Uma interrupção forçada pode deixar o schema temporário daquela execução, que não
é reutilizado pela próxima.

## Evidências e limites

O planejamento fica em avaliacao/rodadas/REV-01/correcoes/. Cada leva tem logs
antes/depois em avaliacao/rodadas/REV-01/evidencias/, acompanhados de cópias do
código, testes, migrations e seeds identificadas por SHA256. A falha anterior à
implementação é esperada; o resultado posterior utiliza a suíte completa.

Não são cobertas rotas ausentes de exclusão ou detalhes de turma. Os testes
específicos de capacidade também preparam situações diretamente no banco; os
testes de PATCH exercitam a mudança pela API. Não se verificam frontend, foco,
leitor de tela, SSL de produção,
falhas de rede ou o desaparecimento concorrente de setor, expressamente excluído.
O rollback é conferido sem dados; restaurar NOT NULL depois de gravar opcionais
nulos pode ser bloqueado pelo banco.

As migrations antigas foram preservadas. Aplicar migrations/seeds no banco de uso
é uma operação distinta dos testes. Esta entrega não converte dados de seeds antigas
já gravados: um ambiente com esses dados precisa considerar sua recriação, conforme
o recorte sem dados legados. As seeds não são idempotentes.

A referência histórica de 06/11/2026 registrou 94 testes aprovados e cobertura de
100% de instruções, funções e linhas, com 96,43% de ramificações. Esses números
pertencem àquela versão. A configuração atual usa Babel e inclui src, exceto
server.js, que apenas inicia o listener. Cobertura não comprova ausência de defeitos.
