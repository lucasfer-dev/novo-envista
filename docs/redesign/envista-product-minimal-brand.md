# Envista — interface minimalista com identidade viva

## Direção

O produto usa a clareza de navegação e conteúdo encontrada em interfaces como o X, sem copiar a identidade da plataforma. O resultado deve parecer uma rede de inovação: limpa, funcional, reconhecível e viva.

### Princípios

1. **O conteúdo vem primeiro:** navegação compacta, listas legíveis, divisórias finas, botões claros e poucos cards.
2. **A marca aparece com intenção:** azul `#0086a7`, turquesa `#00a99d` e verde `#22b573`. Use a progressão das três cores em áreas selecionadas (CTA principal, progresso ou superfície editorial). Não aplique degradês a toda a interface.
3. **Fundos escuros, mas não mortos:** `#061a23` para a base, `#0a2430` para superfícies. Pequenas áreas de iluminação radial e textura em baixa opacidade são permitidas em componentes de destaque.
4. **Patterns oficiais são assinatura, não ruído:** `/brand/envista-pattern-original.png` na barra lateral e em superfícies editoriais limitadas. Sempre deixe o texto em área limpa; limite a opacidade do pattern e remova distrações atrás dos controles.
5. **Uma hierarquia por vez:** título simples, ação principal evidente, metadados discretos e área de conteúdo como foco. Evite repetir buscas, títulos, filtros e blocos de resultados vazios.
6. **Interação clara:** estados de hover e foco visíveis, transições discretas, navegação por teclado, mensagens de erro compreensíveis e ações baseadas em dados reais.
7. **Responsividade real:** sidebar compacta em desktop, drawer funcional no mobile; preservar legibilidade, ordem de tabulação e áreas clicáveis confortáveis.

### Distribuição de cor

- **Azul:** referências a descoberta, informação e tecnologia.
- **Turquesa:** navegação ativa, interações primárias e conexão.
- **Verde:** progresso, resultados positivos e evolução.
- **Branco/cinza:** títulos, textos e informações secundárias; o texto não deve disputar atenção com acentos saturados.

### Comportamento esperado por área

- **Home:** único destaque editorial no topo e resumos menores, com calendário e jornada reais.
- **Explorar / Social / Notificações:** experiência de feed, abas simples e estados vazios honestos.
- **Projetos / Equipes / Investidores:** listagens e perfis profissionais; metadados úteis antes de decoração.
- **Aprender / Competições:** capas e desafios podem usar o pattern de maneira sutil; andamento e prazo devem permanecer legíveis.
- **Mensagens:** conversas limpas, cores associadas ao remetente, nunca a avisos falsos.
- **Workspace / Insights:** priorizar métricas, atividades e tarefas reais, não cartões cenográficos.

### Revisão antes de publicar

- O design continua reconhecível como Envista sem o logotipo?
- Há apenas uma busca e uma ação principal em cada contexto?
- Contraste, foco, zoom e layout mobile continuam funcionais?
- O conteúdo real permanece legível sem efeitos decorativos?
- A página ainda fica bonita se não houver registros?

Os estilos compartilhados vivem em `app/product-x-minimal.css` e `app/product-brand-alive.css`, com refinamentos de cada módulo no seu próprio CSS Module.

## Governança de patterns (10/11/2026)
A heurística de minimalismo da Nielsen Norman Group e as diretrizes de ilustrações da Atlassian recomendam preservar a tarefa e a mensagem, usando padrões ambientais com intenção.

**Locais permitidos no produto:** banner principal da Home, detalhe visual de curso em destaque em Aprender, painel de oportunidade do Explorar, textura pequena no rodapé da sidebar.

**Locais sem pattern:** cabeçalhos globais, feeds e mensagens, notificações, filtros, listas e cards de projetos/equipes/competições, métricas, calendários, estados vazios repetidos. Usar ícones, paleta (#0086a7, #00a99d, #22b573), tipografia e contraste para comunicar a marca.

Revisar em desktop/mobile, com e sem dados, contraste e foco. Critérios são decisões de projeto, não percentuais cientificamente validados. Referências: https://www.nngroup.com/articles/ten-usability-heuristics/ ; https://www.nngroup.com/articles/signal-noise-ratio/ ; https://atlassian.design/foundations/illustrations ; https://linear.app/docs/projects .

## Auditoria de composição por tela — 10/11/2026

O pattern não deve ser aplicado em toda a página nem removido de todos os componentes. Cada uso abaixo foi escolhido a partir do componente React e da estrutura CSS atual, com atenção a estados vazios e áreas promocionais. A prévia de build não substitui inspeção visual autenticada no navegador.

| Tela | Local do pattern | Condição | Onde não usar |
| --- | --- | --- | --- |
| Home | Hero principal com personagem/globo | Sempre | Métricas, jornada, calendário lateral |
| Explorar | Painel de oportunidade; estado vazio de descoberta suaviza o painel lateral | Painel sempre, vazio apenas sem comunidade | Filtros, resultados, lista de categorias |
| Social | Link do desafio em destaque na coluna lateral | Apenas com competição real | Feed, composer, comentários |
| Notificações | Lateral do estado vazio | Apenas sem notificações | Itens, abas, cabeçalho |
| Projetos | Faixa direita do estado vazio | Apenas sem projetos | Cartões, formulário, listagem |
| Equipes | Faixa direita do estado vazio | Apenas sem equipes | Convites, lista de membros, formulário |
| Aprender | Área ilustrada do curso em destaque | Apenas se houver curso destacado | Catálogo, aula, player |
| Competições | Painel contextual de recomendação de oportunidade | Apenas com match de projetos/equipes | Cards repetidos, regulamento, filtros |
| Calendário | Detalhe no estado vazio | Apenas sem eventos | Eventos reais, datas, controles |
| Mensagens | Nenhum | — | Mensagens, composer |
| Workspace/Insights | Nenhum: utilizar cores e linhas de status | — | Métricas e tarefas |
| Sidebar | Marca d'água leve no rodapé | Global | Sobre os links e ícones |

Atenção: a intensidade visual real depende do contraste do PNG original e deve ser revisada em desktop e mobile. Não duplicar patterns em uma mesma área sem contexto. Princípios: Nielsen Norman Group (heurística 8 de minimalismo) e Atlassian Design System (ambient pattern para áreas promocionais, spot illustrations contextualizadas).
