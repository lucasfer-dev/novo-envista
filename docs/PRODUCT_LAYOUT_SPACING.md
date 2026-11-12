# Envista — contrato de espaçamento do produto

O contrato abaixo se aplica apenas às páginas autenticadas dentro de `LegacySocialShell`. A landing pública, login/cadastro, planos e páginas públicas de projeto têm composição própria.

## Fundamentos

Escala de 4/8 px já presente em `app/design-system.css`: 4, 8, 12, 16, 20, 24 e 32 px. O alinhamento externo e o ritmo das seções são centralizados em `app/brand-experience-2026.css`, no bloco `Authenticated Envista product layout contract`.

- [Atlassian — Spacing](https://atlassian.design/foundations/spacing): escala consistente com unidade base de 8 px.
- [Material Design — Responsive UI](https://m1.material.io/layout/responsive-ui.html): margens/gutters responsivos e grades fluidas.
- [USWDS — Typography](https://designsystem.digital.gov/components/typography/): proximidade visual e largura de texto legível.

## Contrato de layout

| Viewport | Gutter externo | Separação de seções | Padding do cabeçalho |
|---|---:|---:|---:|
| Até 640 px | 16 px | 24 px | 16 px |
| 641–980 px | 20 px | 24 px | 20 px |
| 981–1799 px | 24 px | 24 px | 24 px |
| A partir de 1800 px | 32 px | 24 px | 24 px |

- **Entre painéis:** 16 px (12 px em telas pequenas).
- **Entre elementos relacionados:** 8–12 px.
- **Conteúdo padrão:** até 1600 px, com centralização somente em telas maiores.
- **Home, Social e Explore:** layout fluido (sem limite de artigo) e topo um pouco mais compacto.
- **Mensagens:** ocupa a altura e a largura do painel da aplicação, com rolagem interna; não recebe container de artigo.
- **Topbar:** conteúdo e pesquisa iniciam na mesma linha horizontal do corpo, inclusive em monitor ultrawide.
- **Cabeçalho:** `.page-head` alinhado ao conteúdo, com quebra responsiva das ações.

## Regras para manutenção

1. Não adicionar outra largura, `margin: auto` ou `padding-inline` global em `.page-wrap` fora do contrato.
2. Limitar largura de **componentes de leitura/formulário**, não de dashboards inteiros.
3. Usar tokens `--ev-page-section-gap`, `--ev-page-panel-gap`, `--ev-page-inner-gap` para hierarquia de espaçamentos.
4. Deixar conteúdo de cards com altura variável; não forçar alturas que cortem texto.
5. Manter a sidebar e a landing pública independentes.
6. Verificar 1440, 1920, 2560, 820 e 390 px, ausência de overflow, alinhamento da topbar e exceção para Mensagens. Testes em `e2e/product-layout-rhythm.e2e.mjs`.

O contrato global atua apenas sobre layout externo e cabeçalhos compartilhados. Cores, texturas, imagens e proporções internas seguem responsabilidade dos componentes.
