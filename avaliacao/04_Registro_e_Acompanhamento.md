# Registro e acompanhamento das revisões

Laura Vieira · Instrumento de trabalho do TCC · 05/11/2026

## 1. Organização do trabalho

A avaliação começa em REV-01 com a inspeção da versão disponível. O relatório registra o inventário e o alcance da análise; os achados ficam em arquivo JSON separado. A mesma estrutura se aplica às revisões durante a implementação e à avaliação final.

Usar uma única pasta avaliacao, preferencialmente versionada em um dos repositórios. Se frontend e backend forem separados, informar ao agente o caminho dos instrumentos e do registro central. Não manter duas cópias independentes do acompanhamento.

| Local | Conteúdo |
|---|---|
| avaliacao/instrumentos/ | Documentos 01 a 04 e modelo 06 |
| avaliacao/rodadas/REV-01/ | Pedidos, relatórios, JSON de achados e evidências da rodada |
| avaliacao/rodadas/REV-02/ | Mesmo conjunto de arquivos para a rodada seguinte |
| avaliacao/achados.json | Acompanhamento consolidado de todos os achados |
| avaliacao/final/FINAL-01/ | Relatórios, achados JSON e evidências da primeira avaliação final |

Uma rodada reúne um conjunto coerente de verificações. Pode abranger um ou ambos os repositórios. A primeira registra a situação encontrada; as seguintes examinam alterações e dependências. A autora define o alcance sem presumir que todo o sistema foi examinado.

## 2. Arquivos produzidos em cada rodada

- pedido-frontend.txt e/ou pedido-backend.txt: instrução exata e contexto disponibilizado.
- relatorio-frontend.md e/ou relatorio-backend.md: cabeçalho, inventário, cobertura, testes e pendências. Não contêm descrições de achados.
- achados-frontend.json e/ou achados-backend.json: achados do revisor, usando o contrato da seção 5.
- evidencias/: trechos exportados, saídas de testes, capturas e observações necessárias para sustentar conclusões.

Na primeira execução, usar execucao r01 no cabeçalho e no JSON. Se houver reavaliação na mesma rodada, usar r02 e arquivos novos, por exemplo relatorio-frontend-r02.md e achados-frontend-r02.json. Versões e datas de cada execução precisam estar identificadas. Não sobrescrever um relatório ou JSON de revisão encerrado.

O acompanhamento da autora fica exclusivamente em avaliacao/achados.json. O formato é o mesmo dos arquivos de achados da rodada, com tipo_documento consolidado. Os produtos da revisão são preservados; o consolidado recebe confirmação, decisão, correção e reavaliação, com histórico. Assim, o resultado emitido pelo revisor e a situação conferida pela autora podem ser distinguidos.

## 3. Sequência da rodada

1. Identificar versão, objetivo, escopo, instrumentos, ambiente e dados. Preservar o estado antes de alterações.
2. Enviar o pedido e executar a revisão. Produzir relatório Markdown e achados JSON separados.
3. Conferir a cobertura e cada achado. A autora confirma, rejeita com justificativa ou mantém pendente. O agente pode organizar os registros a partir de informações verificáveis.
4. Inserir ou atualizar cada objeto no consolidado. Registrar duplicidades sem contar o mesmo problema duas vezes.
5. Implementar as correções escolhidas em etapa separada. Registrar commit e participação de ferramentas quando houver.
6. Reavaliar pelo método pertinente e guardar novos produtos. Atualizar situação e histórico no consolidado.
7. Fechar a rodada com resumo de IDs e pendências no relatório, sem repetir a descrição dos achados. Versionar e sincronizar os registros.

A primeira rodada usa um consolidado vazio. Durante sua inspeção, funcionalidades previstas ainda ausentes são lacunas de implementação, distintas de falhas em funcionalidades existentes. Diferença em relação à arquitetura alvo, isoladamente, não comprova defeito funcional.

## 4. Modelo do relatório Markdown

Copiar a estrutura abaixo para cada repositório. Campos sem informação devem indicar não informado ou não executado, conforme o caso.

### Cabeçalho da rodada

- Rodada: [REV-XX]
- Execução: [r01]
- Data e responsável: [preencher]
- Objetivo e tipo de atividade: [inspeção/reavaliação/avaliação final]
- Repositório e branch: [preencher]
- Commit e alterações locais: [hash; nenhuma alteração ou caminho do patch e arquivos novos]
- Versão do outro repositório quando necessária: [preencher ou não envolvido]
- Instrumentos utilizados: [nomes e versão identificável por data/commit/cópia]
- Ferramenta e modelo identificável: [preencher; não inventar]
- Ambiente e base fictícia: [SO, runtime, navegador quando usado e preparação; sem credenciais]
- Escopo e requisitos selecionados: [IDs, funcionalidades e aspectos]
- Exclusões desta rodada: [justificativa]
- Arquivo de achados: [caminho relativo do JSON]
- Pedido e contexto fornecido: [caminhos e limites de acesso]

### Inventário do escopo

| Funcionalidade ou componente | Arquivos ou rotas | Situação de implementação | Observação de alcance |
|---|---|---|---|
| [item] | [localização] | [implementado/parcial/não implementado/não determinado] | [limite da inspeção] |

O inventário descreve o que existe e o que foi incluído na análise. Quando houver problema, a descrição detalhada pertence ao JSON; aqui cabe citar somente seu ID.

### Cobertura das verificações

| Item | Requisito e aspecto | Local examinado | Método e evidência da inspeção | Estado de cobertura | IDs de achados ou pendência |
|---|---|---|---|---|---|
| [FE/BE/A/H/CT] | [aspecto específico] | [arquivo/componente/estado] | [o que foi conferido] | [estado] | [ID ou verificação necessária] |

Estados: examinado sem apontamento; examinado com apontamento; parcialmente examinado; não examinado; fora da rodada; não aplicável com justificativa; não implementado. Registrar uma linha por aspecto/componente necessário para interpretar a cobertura. Ocorrências idênticas de um componente compartilhado podem ser agrupadas, desde que listadas.

Examinado sem apontamento não significa atende ou aprovado. Uma inspeção pode estar completa para o aspecto de código e manter pendente a confirmação em execução. A linha precisa explicar o alcance e a evidência; marcar um estado sem suporte não comprova cobertura.

### Testes e verificações executados

| Caso | Versão e ambiente | Dados e comando ou passos | Esperado | Observado | Resultado | Evidência e IDs |
|---|---|---|---|---|---|---|
| [caso] | [preencher] | [preencher] | [antes da execução] | [depois da execução] | [estado] | [caminho/IDs] |

Resultados: passou, falhou, não executado, não implementado ou não aplicável com justificativa. Registrar o comportamento observado é parte da evidência do caso; análise do problema, impacto e recomendação pertencem ao JSON. Quando não executar testes, declarar isso. Presença de teste no repositório não equivale a execução.

### Verificações pendentes e limitações

| Verificação | Motivo da pendência | Método necessário | Momento previsto | IDs relacionados |
|---|---|---|---|---|
| [aspecto] | [motivo] | [navegador/teste/NVDA/usuários] | [rodada/final] | [IDs ou nenhum] |

Uma pendência metodológica não exige inventar um defeito. Se houver indício de problema, registrá-lo também no JSON e relacionar seu ID. NVDA e usuários ficam para a etapa final.

### Fechamento pela autora

- Data e versão após intervenções: [preencher]
- IDs reavaliados: [lista]
- IDs que permanecem pendentes: [lista]
- Arquivos de reavaliação: [caminhos]
- Limites da cobertura e destino das verificações pendentes: [preencher]
- Decisão de fechamento: [preencher]

O fechamento pode ser acrescentado após a revisão, sem reescrever o conteúdo emitido pelo revisor. Distinguir a autoria desta seção. A confirmação, a justificativa e o tratamento de cada achado ficam no consolidado JSON.

## 5. Contrato do arquivo de achados JSON

Usar JSON válido, UTF-8, indentação de dois espaços, um campo por linha e a mesma ordem de campos em todos os objetos. Cada achado é um objeto completo; repetir os nomes dos campos favorece a leitura. Não usar comentários, vírgulas finais, Markdown, texto fora do objeto JSON ou células com várias colunas concatenadas.

A raiz contém tipo_documento, versao_formato, rodada, execucao e achados. tipo_documento aceita revisao ou consolidado nos registros reais; modelo e exemplo são reservados a materiais de preenchimento. versao_formato é 1.0. Nos arquivos de revisão, informar rodada e execucao. No consolidado, ambas ficam null porque ele reúne rodadas. achados é uma lista de objetos; se não houver apontamentos, usar [].

O arquivo 06_Modelo_Achados.json apresenta todos os campos. Seu objeto vazio é somente um molde, não um achado. Para iniciar um arquivo real, usar tipo_documento apropriado e remover esse objeto, começando com achados: []. Para inserir um achado real, preencher uma cópia do molde com evidências da execução.

### Campos de cada achado

| Campo | Tipo | Conteúdo |
|---|---|---|
| id | texto | Identificador estável, como REV-01-FE-A001 |
| titulo | texto | Nome curto do problema ou indício |
| rodada_identificacao | texto | Rodada de primeira identificação |
| data_identificacao | texto ou null | Data real, preferencialmente ISO 8601 |
| origem | texto | revisao_ia, inspecao_autora, teste_automatizado, navegador, usuario ou nvda |
| repositorio | texto | frontend, backend ou integrado |
| versao_codigo | objeto | frontend e backend com hashes ou null; alteracoes_locais com descrição/caminho ou null |
| categoria | lista de textos | funcional, integridade, arquitetura, acessibilidade e/ou usabilidade |
| tipo | texto | defeito, indicio, lacuna_implementacao ou melhoria_estrutural |
| requisitos | lista de textos | IDs e aspectos pertinentes; não inventar referência normativa |
| localizacao | texto | Arquivo/trecho, rota, componente e estado, conforme evidência |
| descricao | texto | O que acontece e em quais condições |
| evidencia | texto | Evidência localizável, caminho de arquivo, trecho, passos e dados pertinentes |
| impacto | texto | Consequência na tarefa ou manutenção |
| prioridade | texto | bloqueante, alta, media ou baixa; escala do projeto |
| classificacao | texto | confirmado_no_codigo, confirmado_em_execucao ou indicio |
| sugestao | texto ou null | Encaminhamento delimitado, sem ampliar escopo |
| verificacao_pendente | texto ou null | Método/ação ainda necessária; null quando não houver |
| confirmacao_autora | texto | pendente, confirmado, rejeitado ou duplicado |
| justificativa_confirmacao | texto ou null | Motivo e evidência da decisão humana |
| situacao | texto | Estado de acompanhamento definido abaixo |
| duplicado_de | texto ou null | ID que representa o mesmo problema |
| correcao | objeto ou null | Rodada, versão, descrição, responsável e evidência da intervenção |
| reavaliacao | objeto ou null | Rodada, versão, método, responsável, resultado e evidência da última reavaliação |
| historico | lista de objetos | Eventos em ordem cronológica: data, rodada, evento, responsável, versão, resultado e evidência |

Usar null para valor desconhecido ou ainda não preenchido, e [] para lista sem itens. Uma informação ausente que limite a conclusão precisa ser explicitada no relatório. Nenhum arquivo real deve conter marcadores como [preencher] ou achados fictícios.

classificacao descreve a evidência disponível ao revisor; confirmacao_autora registra uma decisão humana distinta. O revisor pode ter evidência de código, mas não pode preencher a confirmação da autora por conta própria. A emissão da revisão começa com confirmacao_autora pendente, situacao aguardando_confirmacao, correcao/reavaliacao null e historico vazio. Quando reencontrar um ID, essa regra vale ao apontamento da nova revisão; o consolidado conserva o histórico e a confirmação existentes até nova conferência.

Situações permitidas: aguardando_confirmacao; aberto; em_correcao; aguardando_reavaliacao; resolvido_no_recorte; persistente; fora_do_escopo; rejeitado; duplicado. Rejeitado, duplicado e fora_do_escopo exigem justificativa. Somente confirmado pode ser contabilizado como problema confirmado. Uma correção não testada fica aguardando_reavaliacao.

Chaves exatas de correcao: rodada, versao_codigo, descricao, responsavel e evidencia. Chaves exatas de reavaliacao: rodada, versao_codigo, metodo, responsavel, resultado e evidencia. Chaves exatas de cada evento de historico: data, rodada, evento, responsavel, versao_codigo, resultado e evidencia. Usar textos para esses valores, exceto versao_codigo, que é objeto, e data, que pode ser null quando não disponível.

Para versao_codigo e para as versões dentro de correcao, reavaliacao e historico, usar objeto com frontend, backend e alteracoes_locais. Cada hash corresponde ao estado efetivamente examinado. Guardar null no repositório não envolvido. Manter versao_codigo como a versão da primeira identificação; novas versões entram nos eventos e na última intervenção/reavaliação.

## 6. Identificadores e consolidação

Novos achados recebem REV-XX-FE-A001 ou REV-XX-BE-A001, conforme o repositório. Nas verificações integradas, usar IN no lugar de FE/BE; na avaliação final, FINAL-01-IN-A001. A numeração segue a ordem de identificação dentro do prefixo. O ID nunca muda quando o problema é reavaliado.

Depois de cada revisão, a autora confere o JSON e atualiza avaliacao/achados.json. Um achado novo gera um objeto; um ID existente recebe eventos em historico e atualização dos campos de acompanhamento. Não substituir o histórico pelo conteúdo de uma revisão nova. O registro de primeira identificação permanece estável. Se for necessário retificar uma descrição, registrar motivo e conteúdo retificado no histórico.

Achados detectados em ambos os repositórios só são unidos quando representam o mesmo problema. Manter o segundo objeto com confirmacao_autora e situacao duplicado, duplicado_de preenchido e justificativa. A contagem usa o objeto principal. Sem identidade de problema demonstrada, manter registros distintos.

Registrar também descobertas da autora e de testes que ocorram entre revisões, com origem correta. Não atribuir essas descobertas à IA. Sugestões rejeitadas permanecem no JSON com sua decisão; não integram a contagem de problemas confirmados.

### Consolidado vazio

```json
{
  "tipo_documento": "consolidado",
  "versao_formato": "1.0",
  "rodada": null,
  "execucao": null,
  "achados": []
}
```

## 7. Evidências e reavaliação

Código: registrar commit, arquivo e trecho; linhas isoladas não são estáveis. Estado sem commit exige patch e cópia de arquivos novos relevantes. Execução: informar ambiente, dados, passos/comando, esperado, observado, saída e código de retorno quando houver. Captura pode complementar, mas não comprova sozinha um percurso de teclado. Guardar somente dados fictícios e não incluir credenciais.

Usar nomes como evidencias/EV01_erro_formulario.png. As referências do JSON devem apontar para arquivos existentes. Uma evidência pode sustentar mais de um critério se cobrir cada aspecto. A autora pode solicitar ao agente a organização dos registros, mas ele não deve inventar observação humana.

correcao registra a última intervenção. reavaliacao registra a última verificação pertinente. O histórico mantém todas as intervenções e verificações, inclusive falhas. Resultado da reavaliação: resolveu_no_recorte, persiste, inconclusivo ou nao_executado. Reabrir um problema recorrente com novo evento, sem apagar sua trajetória.

## 8. Avaliação final e uso dos resultados

Preservar FINAL-01 com commits dos dois repositórios antes das sessões com usuários e NVDA. Usar a mesma versão de código e restaurar dados conforme necessário. Uma correção que interrompa a avaliação exige nova identificação e resultados separados. Os achados dessa etapa usam o mesmo JSON; o contexto, os percursos e as pendências ficam nos relatórios.

Distinguir problemas identificados e corrigidos durante o desenvolvimento, conhecidos que persistiram e identificados pela primeira vez ao final. Para os últimos, verificar se o aspecto/componente tinha sido examinado, se a execução estava pendente e se houve mudanças depois da revisão. Não observação em um percurso não prova ausência em todo o sistema.

No consolidado, guardar a avaliação final em eventos de histórico com rodada FINAL-01, método e evidência. Registrar correções posteriores em rodada própria, como POSFINAL-01. Contar problemas únicos confirmados; preservar separadamente rejeições, indícios, duplicados e itens não reavaliados. A análise descreve contribuições e limites sem atribuir efeito causal isolado à IA ou declarar conformidade integral.

## 9. Conferência antes de encerrar a rodada

Verificar que o JSON abre sem erro, que os campos seguem o modelo, que IDs não se repetem indevidamente no mesmo arquivo e que relatórios citam IDs existentes. Nenhum achado deve estar descrito apenas em uma tabela Markdown. Revisões sem apontamentos ainda precisam do arquivo JSON com lista vazia e da cobertura no relatório.

Confirmar que a versão está identificada, as evidências são acessíveis, os resultados correspondem ao que foi executado, as decisões humanas estão registradas e as pendências têm destino. Sincronizar a pasta de avaliação com o repositório habitual do projeto.

## 10. Exemplo exclusivamente ilustrativo

O objeto abaixo demonstra a organização dos campos. Ele não representa uma inspeção executada e não deve ser importado para o consolidado. Em uma revisão real, substituir tipo_documento por revisao e preencher data, versão, localização e evidência efetivas.

```json
{
  "tipo_documento": "exemplo",
  "versao_formato": "1.0",
  "rodada": "REV-01",
  "execucao": "r01",
  "achados": [
    {
      "id": "REV-01-FE-A001",
      "titulo": "Campos apagados após falha no envio",
      "rodada_identificacao": "REV-01",
      "data_identificacao": null,
      "origem": "revisao_ia",
      "repositorio": "frontend",
      "versao_codigo": {
        "frontend": null,
        "backend": null,
        "alteracoes_locais": null
      },
      "categoria": [
        "usabilidade",
        "funcional"
      ],
      "tipo": "indicio",
      "requisitos": [
        "R10",
        "FE07",
        "H09"
      ],
      "localizacao": "Exemplo fictício: componente de formulário de escola",
      "descricao": "O caminho de erro aparenta limpar os valores preenchidos.",
      "evidencia": "Exemplo fictício de leitura de código; não representa inspeção real.",
      "impacto": "Pode obrigar a pessoa a preencher os dados novamente.",
      "prioridade": "media",
      "classificacao": "indicio",
      "sugestao": "Verificar quando os campos são limpos e preservar os valores após erro.",
      "verificacao_pendente": "Provocar falha de envio no navegador e observar os campos.",
      "confirmacao_autora": "pendente",
      "justificativa_confirmacao": null,
      "situacao": "aguardando_confirmacao",
      "duplicado_de": null,
      "correcao": null,
      "reavaliacao": null,
      "historico": []
    }
  ]
}
```
