# Regras de design aplicadas ao Envista

## Diagnóstico

A versão anterior adicionava imagens, mas conservava cabeçalhos em caixas grandes, uma busca curta, espaços de seção excessivos e regras de ritmo sobrepostas. Isso afastava a composição da referência fornecida e fazia blocos secundários competirem com os projetos.

A direção mantém a paleta oficial, os símbolos, as texturas originais, os gradientes nas ações principais e a navegação compartilhada. As referências profissionais orientam composição e usabilidade; não substituem a identidade do Envista.

## Pesquisa e aplicação

| Referência primária | Princípio observado | Aplicação no Envista |
| --- | --- | --- |
| [Linear: atualização de março de 2026](https://linear.app/now/behind-the-latest-design-refresh) | Navegação, divisores e elementos auxiliares têm peso menor que o conteúdo principal; ações ocupam posições previsíveis. | Cabeçalhos integrados à página, busca mais ampla, cards de projeto com imagem proporcional e atividades compactas. |
| [Linear: redesign da interface](https://linear.app/now/how-we-redesigned-the-linear-ui) | Alinhamento, densidade e hierarquia são tratados como um sistema entre as vistas. | Mesma escala de títulos nas abas, mesmas margens e comparação visual de início, projetos, competições e GitHub. |
| [Atlassian: espaçamento](https://atlassian.design/foundations/spacing) | Escala limitada de espaços, agrupamento por proximidade e ritmo previsível. | Tokens de 4, 8, 12, 16, 20, 24 e 32px; agrupamentos internos menores e separação entre seções de 24px. |
| [GitHub/Primer: princípios](https://primer-docs-preview.github.com/product/getting-started/) | Padrões familiares, coesão entre páginas e eficiência em diferentes dispositivos. | Shell único, hierarquia de ações preservada, alternativas para vazio/falha e revisão em cinco larguras. |

## Contrato visual

- **Cores:** azul `#0086a7`, teal `#00a99d`, verde `#22b573`, tinta `#0f1923`; cores de aviso/erro conservam significado próprio.
- **Hierarquia:** título de página → título de seção → título de card → descrição/metadados. Apenas a home tem saudação maior.
- **Ações:** principal em gradiente; secundária contornada; navegação e links auxiliares com menor peso; exclusão preserva cor destrutiva.
- **Imagens:** símbolo oficial para Envista; arte temática e iniciais nos demais projetos; imagens ilustrativas de oportunidades não se apresentam como marcas oficiais.
- **Cabeçalhos:** título e contexto à esquerda, ação à direita no desktop; empilhamento no celular. Textura de marca aparece de forma localizada, sem transformar toda aba em uma capa.
- **Coleções:** gaps de 16px; padding de 16–20px em cards; separação de 24px entre seções. Conteúdo e ações determinam o tamanho dos cards.
- **Estados:** informação de inscrição, datas e progresso somente quando há dados; ausência e falha têm saída útil.
- **Acessibilidade:** foco visível, teclado, menus com retorno de foco, leitura de status e respeito a movimento reduzido.

## Propriedade do CSS

`design-system.css` define os tokens. `brand-identity.css` aplica a marca e a geometria do shell. `dashboard-spacing.css` mantém apenas o ritmo das coleções. `authenticated-layout-v2.css` compõe a home. Os módulos cuidam da geometria específica das funcionalidades. O antigo arquivo de espaçamento com mais de 200 linhas de overrides foi substituído por regras curtas e explícitas.

## Evidências e limites

As capturas usam os componentes reais de início, projetos, competições e GitHub com dados locais de exemplo. Não são capturas de contas de usuários. API e dados são simulados apenas para revisão. A rota de inspeção é removida antes do commit.

Os fluxos autenticados continuam sujeitos ao smoke test em uma conta de teste conectada ao ambiente. A revisão visual não comprova operações de publicação, mensagens ou vinculação GitHub com dados reais.
