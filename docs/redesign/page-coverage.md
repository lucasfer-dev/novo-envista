# Aplicação do padrão em todas as famílias de páginas

A mudança usa os componentes e as rotas existentes. As regras comuns ficam em `design-system.css`, `brand-identity.css` e no shell compartilhado; os módulos mantêm a geometria necessária a cada função.

| Família | Aplicação |
| --- | --- |
| Início de participante e investidor | Navegação única, hierarquia, ilustrações e cartões de informação com dados existentes. |
| Social, explorar e perfis públicos | Shell, busca, ações, cartões e arte temática dos projetos nas rotas legadas realmente utilizadas. |
| Projetos, detalhes e criação | Arte por categoria, cabeçalho compartilhado, formulário escuro em cinco etapas, foco visível e grade adaptável. |
| Equipes e workspace | Navegação, cartões e ações comuns; projetos das equipes recebem a mesma arte. |
| Competições, calendário, atividade e insights | Escala visual compartilhada; preservação dos estados, filtros, datas e indicadores. |
| Mensagens e notificações | Cabeçalhos, listas, ações primárias/secundárias e estados vazios consistentes. |
| Cursos, módulos e aulas | Cabeçalho comum, identidade nas capas, progresso e materiais preservados. |
| Conta, perfil e configurações | Superfícies, cores, tipografia e controles; edição de perfil corrigida para o padrão. |
| GitHub e verificação de investidor | Shell consistente e ações com hierarquia preservada. |
| Administração | Tokens comuns de superfícies, tipografia e largura da navegação, mantendo organização e segurança próprias. |
| Landing page, catálogo e projeto público | Textura original da marca e arte de projetos; navegação pública preservada. |
| Autenticação, responsáveis e páginas institucionais | AuthShell com símbolo e textura oficiais; formulários e conteúdo legal preservados. |
| Carregamento, erro e página inexistente | Geometria do shell, símbolo oficial, ações de recuperação, foco e movimento reduzido. |

## Verificação desta ampliação

- TypeScript e build de produção aprovados; 42 arquivos de testes, 189 testes aprovados.
- Revisão em Chromium dos componentes reais de criação de projeto, notificações, caixa de mensagens, catálogo de cursos, curso, aula e shell administrativo com dados locais de exemplo.
- Rotas reais de cadastro, privacidade, termos e página inexistente revisadas sem sessão.
- Larguras de 1440, 768, 390 e 320px: nenhuma rolagem horizontal indevida, imagem quebrada ou exceção JavaScript nas vistas revisadas.
- O acesso a `/guardian-required` sem sessão foi redirecionado para login, conforme a proteção existente; isso não é uma validação da tela de responsável autenticada.
- A rota temporária de revisão e os dados de exemplo foram removidos. As capturas anteriores estão em `docs/redesign`.

A revisão visual não executa publicação de projetos, envio de mensagens, administração ou integrações com contas reais. Esses fluxos exigem uma conta de teste autenticada e não foram simulados como operações bem-sucedidas.
