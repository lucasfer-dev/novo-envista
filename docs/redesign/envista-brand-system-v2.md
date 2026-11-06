# Envista — Direção visual 2.0 · auditoria e decisões (05/11/2026)

## Inventário de marca conferido contra os arquivos oficiais enviados
- Símbolo de linhas contínuas com interseção orgânica (duas versões: gradiente verde→teal→azul e branca).
- Logotipo tipográfico ENVISTA, também em branco e gradiente.
- Paleta aprovada: `#0086a7` (azul), `#00a99d` (teal), `#22b573` (verde) e `#0f1923` (marinho escuro).
- Pattern de pictogramas em fundo escuro e duas texturas materiais com verde e teal.
- Ativos já no código: `public/brand/envista-symbol-*.svg`, `envista-texture-original.png`, `envista-pattern-original.png`.

## Análise da experiência atual
A homepage já tem navegação clara e seções distintas, mas utiliza o mesmo símbolo centralizado como arte dos projetos e explora pouco a textura/pattern como sistema gráfico. A geometria da marca não participa da composição: limita-se a marca-d'água e backdrops. Parte do texto escuro sobre a ponta azul do gradiente pode falhar contraste AA.

## Critérios e trade-offs considerados
| Proposta | Decisão | Motivo |
| --- | --- | --- |
| Pattern em **todas** as superfícies | Rejeitada | Ruído visual; prejudica a hierarquia de conteúdo (NN/g / gestalt de figura-fundo). |
| Pattern contido em hero, portfólio, painel institucional e CTA | Aprovada | Assinatura de marca repetível, sem competir com texto ou ações. |
| Grandes símbolos translúcidos e contornos da marca | Aprovada | Memorabilidade e assinatura gráfica mantendo alt vazio por serem decorativos. |
| Cards de projetos todos com o mesmo logotipo no centro | Rejeitada | Projetos reais perdem identidade; usar monogramas e marca menor. |
| Mais botões e links nas primeiras dobras | Rejeitada | Complexidade de escolha (Lei de Hick); manter cadastro e exploração. |
| Enormes animações/parallax | Rejeitada | Desempenho, distração e redução de movimento; microtransições opcionais. |
| Variar materiais entre seções em vez de uma única superfície escura | Aprovada | Contraste de ritmo, escaneabilidade, proximidade e diferença de hierarquia. |
| Reduzir controles clicáveis em mobile | Rejeitada | Lei de Fitts e WCAG 2.2: ampliar áreas de toque. |

## Regras de aplicação
1. Primeiro a leitura, depois identidade, depois microdecoração; nada de pattern atrás de parágrafos sem camada de proteção.
2. Texto comum WCAG 2.2 AA: mínimo 4,5:1; componentes essenciais e ícones funcionais 3:1. Variante escura de texto no gradiente deve passar na parada azul (mais escura).
3. Estados de foco visíveis, sem overflow entre 320–1440px, touch target de preferência 44px+, `prefers-reduced-motion`.
4. Preservar ordem semântica, headings e rotas do funil; evitar números fictícios, sliders decorativos e conteúdo inventado.
5. CSS de escopo `.ev-page` para não alterar os formulários e áreas autenticadas.

## Fontes consultadas
- W3C WCAG 2.2 (português): https://www.w3.org/Translations/WCAG22-pt-BR/
- W3C WAI Non-text Contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- Nielsen Norman Group — Visual hierarchy: https://www.nngroup.com/articles/visual-hierarchy-ux-definition/
- Laws of UX — Hicks, Fitts, Jakob e Gestalt: https://lawsofux.com/

## Testes de aceitação
- Build/TS/CI Security, navegação e layout mobile via Playwright.
- Contraste calculado da parada azul: novo foreground `#000c10` (verificar >4.5:1).
- Textos decorativos marcados `aria-hidden`; links reais continuam operantes.
- Home mantém CTA principal e dados da vitrine pública quando houver registros.
