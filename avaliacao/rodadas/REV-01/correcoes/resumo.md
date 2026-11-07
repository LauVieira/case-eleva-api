# Correções das funcionalidades existentes — 07/11/2026

As cinco levas foram concluídas. O trabalho manteve a arquitetura em camadas e
alterou os comportamentos funcionais expressamente autorizados, usando o documento
01_Regras_e_Requisitos.md, datado de 05/11/2026. Não foram criadas rotas de edição,
exclusão ou escrita de turmas.

O planejamento foi ajustado pelas dependências: a aceitação de diretor e telefone
nulos exigiu antecipar sua migration para a primeira leva; a normalização dos nomes
exigiu tratar o conflito concorrente de unicidade na segunda. As demais mudanças
de persistência e seeds precederam os filtros e a capacidade.

## Ciclos executados

Em cada leva, os novos testes foram executados antes da implementação e suas
falhas foram registradas. Depois da correção, foi executada a suíte completa.
Os números das duas colunas têm alcances diferentes: antes mostra o arquivo de
novos testes; depois mostra todos os testes disponíveis naquele momento.

| Leva | Alteração | Antes | Depois | Evidências |
| --- | --- | --- | --- | --- |
| 1 | Limites e tipos do cadastro, opcionais nulos, telefone canônico e IDs válidos; Joi sem conversão. | 17 falhas e 15 aprovações | 119 aprovados, 7 suítes | [Antes](../evidencias/LEVA1_antes.txt), [depois](../evidencias/LEVA1_depois.txt) |
| 2 | Normalização dos nomes de escola antes de validar/gravar; unicidade global e conflito concorrente em 409. | 3 falhas e 1 aprovação | 123 aprovados, 8 suítes | [Antes](../evidencias/LEVA2_antes.txt), [depois](../evidencias/LEVA2_depois.txt) |
| 3 | Models e novas migrations; índice parcial, status textual, restrições e seeds coerentes; erros em JSON. | 12 falhas | 135 aprovados, 9 suítes | [Antes](../evidencias/LEVA3_antes.txt), [depois](../evidencias/LEVA3_depois.txt) |
| 4 | Turmas ativas por padrão; filtros current, completed e all, com validação e isolamento por escola. | 7 falhas e 1 aprovação | 143 aprovados, 10 suítes | [Antes](../evidencias/LEVA4_antes.txt), [depois](../evidencias/LEVA4_depois.txt) |
| 5 | totalCapacity em GET /schools/:id, somando apenas ativas e retornando zero quando não houver. | 6 falhas | 149 aprovados, 11 suítes | [Antes](../evidencias/LEVA5_antes.txt), [depois](../evidencias/LEVA5_depois.txt) |

A revisão complementar da terceira leva acrescentou orientação em português nas
mensagens, exemplo de pré-escola nas seeds e verificações de reversão/reaplicação.
Esse ciclo foi preservado separadamente: [antes](../evidencias/LEVA3_antes_complemento.txt),
com 8 falhas e 4 aprovações, e [depois](../evidencias/LEVA3_depois_complemento.txt),
com 161 testes aprovados. A verificação final acrescentou três casos para
reativação conflitante e limites do tipo inteiro no banco.

## Verificação final

Resultado: **164 testes aprovados em 12 suítes**, com coleta de cobertura e
verificação de conexões abertas, sem forceExit. O ESLint terminou com saída zero.

- [Execução completa, cobertura e versão](../evidencias/LEVA5_depois_final.txt).
- [Cópia exata do código verificado](../evidencias/LEVA5_depois_final.snapshot.json).
- [Inspeção das dependências e ESLint](../evidencias/VERIFICACAO_FINAL_estatica.txt).

Cobertura nessa versão: 99,08% de instruções, 92,65% de ramificações, 100% de funções e
99,5% de linhas. Não se usou meta percentual como condição de aprovação.

O commit de referência é 753bc06eb8f7a9f97c3e4aa50c0bc0a6c9acf687, acompanhado das
alterações locais descritas no log. Cada execução preserva o estado dos fontes,
testes, migrations e seeds em um arquivo identificado por SHA256. Nenhum commit
foi criado nesta entrega. A modificação preexistente de package-lock.json foi
preservada.

Os testes usaram PostgreSQL real em schemas descartáveis. As migrations de 2021
não foram alteradas. Foram verificadas a reversão e a reaplicação das duas novas
migrations em base vazia, bem como a reversão e a reaplicação de todas as seeds.
Também foram comprovadas as proteções de unicidade e das chaves estrangeiras.

## Acompanhamento dos achados

Os detalhes, testes de cada achado, alcance e pendências estão em
[achados-backend.json](../achados-backend.json). Os registros originais da revisão,
as decisões humanas e os eventos anteriores foram preservados. O mesmo log final
é reutilizado, com identificação dos testes pertinentes em cada reavaliação.

| IDs | Resultado registrado |
| --- | --- |
| REV-01-BE-A001, A002, A003, A004, A008, A010 e A011 | Confirmados e resolvidos no recorte verificado do backend. |
| REV-01-BE-A009 | Confirmado; correção parcial verificada, com aspectos ligados às operações ausentes fora desta entrega. |
| REV-01-BE-A012 | Correção parcial verificada; aspectos ligados às operações ausentes fora desta entrega. Confirmação do achado original permanece pendente. |
| REV-01-BE-A005, A006 e A007 | Confirmados e abertos: operações não implementadas, conforme delimitação desta entrega. |

Os identificadores abreviados na tabela mantêm o prefixo REV-01-BE-.
O resultado de backend não comprova acessibilidade ou usabilidade da interface.

Após orientação expressa da autora em 07/11/2026, todos os achados com correção
integralmente verificada no recorte foram registrados como confirmados e resolvidos.
A confirmação e o encerramento foram acrescentados ao histórico, preservando os
estados anteriores. Correções parciais permanecem identificadas como tais.

## Limites e preparação do ambiente

O desaparecimento concorrente de setor entre consulta e gravação permanece
excluído por decisão expressa da autora. A alteração de situação no teste de
capacidade é feita diretamente no banco para preparar o cenário; não existe nova
rota de edição de turma.

O banco de uso da aplicação não foi migrado nem semeado por estes testes. As novas
migrations exigem dados compatíveis com as restrições. Dados já gravados pelas
seeds antigas não foram convertidos: preparar uma base de desenvolvimento
reconstruída é uma operação separada. As seeds não são idempotentes. O rollback
foi testado sem registros; a volta a NOT NULL pode ser bloqueada se houver opcionais
nulos. Não houve tratamento de dados legados, conforme a delimitação do documento.

## Ajuste posterior: conversão numérica pelo Joi

A autora esclareceu que a conversão de strings numéricas é permitida. A decisão
anterior de desabilitar toda conversão, descrita na primeira leva, foi revista.
Sanitização e normalização textual continuam fora do Joi; telefone permanece
estritamente texto canônico ou null.

O validateId agora usa o valor retornado pelo Joi, eliminando o regex e o Number()
manuais. No cadastro, o serviço também utiliza o resultado validado para consultar
o setor e salvar a escola: sectorId em string numérica é convertido em número.
Notações como "1.0" e "1e3" são aceitas se representarem inteiros positivos no
limite permitido. Textos como "123abc" são rejeitados, sem extração parcial.

O ciclo adicional registrou [6 falhas e 34 aprovações antes](../evidencias/LEVA1_antes_conversao_ids.txt)
e [172 testes aprovados em 12 suítes depois](../evidencias/LEVA1_depois_conversao_ids.txt).
O ESLint também passou. Essa execução não coletou cobertura; os percentuais acima
pertencem à verificação anterior, cujo log foi preservado. O acompanhamento dos
achados A003, A004 e A012 foi atualizado sem apagar os eventos anteriores.

## Verificações que dependem da autora

- Definir a confirmação do achado A012, cuja correção continua parcial. Os achados
  corrigidos já foram confirmados conforme orientação expressa da autora.
- No frontend, conferir a apresentação das mensagens e dos campos com erro, a
  preservação do preenchimento, o filtro selecionado e o total apresentado.
  Navegação, foco e leitura com NVDA permanecem para suas etapas de avaliação.

Rotas ainda ausentes e o caso concorrente de setor não são verificações pendentes
para encerrar esta entrega: permanecem excluídos do trabalho autorizado.
