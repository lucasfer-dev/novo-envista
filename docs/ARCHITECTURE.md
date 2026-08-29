# Arquitetura do Envista

Este documento descreve a arquitetura que efetivamente atende o produto publicado. O objetivo é evitar que código demonstrativo ou protótipos históricos sejam confundidos com a fonte de verdade de produção.

## 1. Caminho de produção

A aplicação é servida pelo Next.js. As páginas autenticadas usam Server Components/Server Actions e clientes Supabase para trabalhar com:

- Supabase Auth para identidade e sessão;
- PostgreSQL para dados persistidos;
- Row Level Security, funções e triggers em `supabase/migrations/` como limite autoritativo de acesso;
- Supabase Storage para arquivos privados;
- Vercel para build e execução da aplicação Next.js.

As rotas reais de participante (`/app/...`) e investidor (`/investor/...`) devem terminar em componentes de servidor persistidos. Um usuário autenticado real não deve cair no `EnvistaApp` de dados locais como fallback.

## 2. Experiência demo

A demo existe para apresentação sem criar ou alterar contas/dados de produção.

- A entrada é feita por `/auth/demo`.
- O papel demo é mantido no cookie HTTP-only `envista_demo`.
- `components/demo/DemoProductPage.tsx` concentra o roteamento específico da demo.
- O shell histórico `components/EnvistaApp.tsx` e fixtures de `data/` continuam permitidos neste contexto.
- Explore e Competições podem usar páginas específicas de demonstração.
- Trocar manualmente de `/app` para `/investor` (ou o inverso) não muda o papel da demo; o usuário é redirecionado à raiz correta.

A demo nunca deve ser usada para validar persistência, RLS ou permissões reais.

## 3. Área pública histórica

Algumas rotas não autenticadas ainda usam `EnvistaApp` como shell visual histórico. Isso é uma dívida de migração de interface, não um backend alternativo. Essas rotas não devem receber acesso privilegiado ao Supabase nem ser utilizadas como fallback de conta autenticada.

## 4. Diretório `backend/`

`backend/` é um protótipo Java 21/Spring Boot preservado como referência. Atualmente:

- não participa do deploy da Vercel;
- não recebe tráfego do produto;
- não é chamado pelo frontend atual;
- não é a fonte de verdade das migrations;
- não deve receber novas regras que não existam no caminho de produção.

Se um backend Java dedicado for retomado, isso deve ocorrer em uma iniciativa própria, com contrato de API, validação JWT, migrations coordenadas, observabilidade, testes e estratégia de rollout/rollback.

## 5. Fonte de verdade por responsabilidade

| Responsabilidade | Fonte de verdade atual |
| --- | --- |
| Rotas e UI web | `app/`, `components/` |
| Sessão/autenticação | Supabase Auth + `lib/auth/` |
| Autorização de dados | RLS/funções/triggers em `supabase/migrations/` |
| Regras de mutação do produto | Server Actions + banco/RLS |
| Arquivos | Supabase Storage + policies/migrations |
| Demo | `components/demo/`, `EnvistaApp`, `data/` |
| Backend Java | Protótipo não produtivo em `backend/` |
| Testes de release | Vitest/Security CI + Browser E2E |

## 6. Regra para novas funcionalidades

Uma funcionalidade voltada para conta real deve nascer no caminho persistido. Não adicione uma nova ação apenas ao `EnvistaApp`/localStorage e presuma que ela existe no produto real. Para alterações sensíveis, a proteção precisa continuar válida mesmo que alguém ignore a interface e chame Supabase diretamente.

Antes de remover código marcado como histórico/legacy, confirme que ele não é usado pela demo, pela área pública ou por um redirecionamento de compatibilidade. O objetivo é migrar por fatias testáveis, não apagar o protótipo de uma vez.
