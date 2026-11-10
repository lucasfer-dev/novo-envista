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
