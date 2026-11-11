# Envista — aplicação do Manual de Identidade Visual (novembro de 2026)

Fonte de verdade: `Manual da Marca Envista.pdf`, de Kauã Sayão Campos. As capturas antigas, protótipos de telas e tratamentos anteriores não são referência normativa.

## Identidade obrigatória

| Elemento | Definição |
| --- | --- |
| Azul | `#0082A3` |
| Ciano | `#00A599` |
| Verde | `#22B173` |
| Azul escuro | `#0F1923` |
| Tipografia | Montserrat Light, Regular, Medium, SemiBold e Bold |
| Símbolo | “E” com olho central, sem rotação, distorção ou mudança de proporção |
| Logo padrão | Colorida, para superfícies com pouco ruído |
| Logo escura | Para fundos coloridos ou com maior textura |
| Logo branca | Somente quando o contraste com fundo escuro permitir |
| Tamanho mínimo do símbolo | 25 px, conforme página 5 do manual |

A direção do degradê da marca deve respeitar a mudança na parte superior do olho, não ser recriada com uma única cor sólida. A marca não pode receber sombras, brilhaços ou contornos arbitrários. Montserrat vale para interface, site público, autenticação e painel administrativo.

## Onde usar cada recurso

| Contexto | Aplicação | Evitar |
| --- | --- | --- |
| Home autenticada | Azul escuro como base, cards sólidos, acento ciano nos CTAs; símbolo discreto no único card de destaque | Globo exagerado, múltiplos degradês e padrões sob informações |
| Explorar, Projetos, Equipes e Competições | Cards sólidos `#172631`, bordas suaves e contraste de texto; ciano em seleção/links | Fundo ilustrado em listas e páginas de trabalho |
| Social e Mensagens | Área central neutra e legível; sem imagem decorativa no feed; estados vazios funcionais | Banner promocional na área de publicação, posts artificiais |
| Aprender, Calendário e Perfil | Mesmos componentes e tipografia; espaços previsíveis; assets apenas em chamadas contextuais | Padrão repetido sob texto e tabelas |
| Cadastro, login e onboarding | Conteúdo em painel de cor sólida; textura verde do manual apenas na coluna institucional, com baixa opacidade | Textura em input, modal, captcha ou feedback de erro |
| Página pública | Textura azul do manual somente no painel ilustrativo do hero; textura ciano pontual na faixa de encerramento | Textura aplicada a cada bloco, overlays animados e globo não previsto |
| Painel administrativo | Superfícies neutras, estados e tabelas com hierarquia inequívoca | Texturas decorativas, sombras chamativas ou gráficos inventados |
| Navegação lateral | Um único contrato global, realce discreto e padrão original somente no rodapé (opacidade baixa) | Sidebar diferente a cada página |

## Arquivos oficiais no produto

- `public/brand/envista-symbol-gradient.svg`
- `public/brand/envista-symbol-ink.svg`
- `public/brand/envista-symbol-white.svg`
- `public/brand/manual-wave-blue.svg` — derivado reduzido do asset azul enviado com o manual
- `public/brand/manual-wave-teal.svg` — derivado reduzido do asset ciano enviado com o manual
- `public/brand/manual-wave-green.svg` — derivado reduzido do asset verde enviado com o manual
- `public/brand/envista-pattern-original.png` — detalhe restrito à parte inferior da navegação

O raster incluído nos SVGs de ondas foi reduzido para uso como textura de baixa frequência. Se for usada uma área de imagem maior, substituí-los pelo master de alta resolução, mantendo as áreas de aplicação acima.

## Implementação

- `app/brand-manual-2026.css` é a camada de tokens e regras compartilhadas, importada por último no layout.
- CSS Modules de páginas particulares ajustam composição e só usam os tokens oficiais como acentos.
- A landing page não cria publicações/projetos fictícios para preencher cards.
- As regras aplicam-se às famílias de páginas públicas, autenticação, participante, investidor, conta e administração.
- Campos, conteúdo, tabelas e ações devem preservar contraste, foco por teclado e responsividade.
- Novo componente não deve introduzir uma nova paleta local fora dos estados semânticos de erro, aviso e sucesso.

## Critérios de aprovação

1. Logo sem distorção, Montserrat legível e paleta oficial.
2. Ausência de overflow horizontal em 390, 768, 1440 e 1920 px.
3. Elementos interativos verdadeiros, estados vazios reais e nenhum conteúdo fictício.
4. Funções existentes de login, publicação, perfil, projeto e administração preservadas.
5. Testes unitários, compilação de TypeScript, build de produção e revisão visual em rota autenticada antes de publicar.
