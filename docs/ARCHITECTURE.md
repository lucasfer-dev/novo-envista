# Arquitetura do Envista

Este documento descreve a arquitetura que efetivamente atende o produto publicado. O objetivo é evitar que código histórico ou protótipos sejam confundidos com a fonte de verdade de produção.

## 1. Caminho de produção

A aplicação é servida pelo Next.js. As páginas autenticadas usam Server Components/Server Actions e clientes Supabase para trabalhar com:

- Supabase Auth para identidade e sessão;
- PostgreSQL para dados persistidos;
- Row Level Security, funções e triggers em `supabase/migrations/` como limite autoritativo de acesso;
- Supabase Storage para arquivos privados;
- Vercel para build e execução da aplicação Next.js.

As rotas reais de participante (`/app/...`) e investidor (`/investor/...`) devem terminar em componentes de servidor persistidos. Um usuário autenticado real não deve cair no `EnvistaApp` de dados locais como fallback.

O produto não oferece mais acesso de conta demo completa. O login público aceita apenas contas reais e não existe rota `/auth/demo`, cookie de papel demo ou roteador de produto demonstrativo.

## 2. Área pública histórica

Algumas rotas não autenticadas ainda usam `EnvistaApp` como shell visual histórico. Isso é uma dívida de migração de interface, não um backend alternativo e não representa uma conta demo autenticada. Essas rotas não devem receber acesso privilegiado ao Supabase nem ser utilizadas como fallback de conta autenticada.

Fixtures em `data/` só podem permanecer onde forem necessárias para superfícies públicas/históricas ainda em migração. Elas não devem ser usadas para simular sessão, papel ou persistência de usuários reais.

## 3. Diretório `backend/`

`backend/` é um protótipo Java 21/Spring Boot preservado como referência. Atualmente:

- não participa do deploy da Vercel;
- não recebe tráfego do produto;
- não é chamado pelo frontend atual;
- não é a fonte de verdade das migrations;
- não deve receber novas regras que não existam no caminho de produção.

Se um backend Java dedicado for retomado, isso deve ocorrer em uma iniciativa própria, com contrato de API, validação JWT, migrations coordenadas, observabilidade, testes e estratégia de rollout/rollback.

## 4. Fonte de verdade por responsabilidade

| Responsabilidade | Fonte de verdade atual |
| --- | --- |
| Rotas e UI web | `app/`, `components/` |
| Sessão/autenticação | Supabase Auth + `lib/auth/` |
| Autorização de dados | RLS/funções/triggers em `supabase/migrations/` |
| Regras de mutação do produto | Server Actions + banco/RLS |
| Arquivos | Supabase Storage + policies/migrations |
| Área pública histórica | `EnvistaApp` + componentes/fixtures ainda em migração |
| Backend Java | Protótipo não produtivo em `backend/` |
| Testes de release | Vitest/Security CI + Browser E2E |

## 5. Regra para novas funcionalidades

Uma funcionalidade voltada para conta real deve nascer no caminho persistido. Não adicione uma nova ação apenas ao `EnvistaApp`/localStorage e presuma que ela existe no produto real. Para alterações sensíveis, a proteção precisa continuar válida mesmo que alguém ignore a interface e chame Supabase diretamente.

Antes de remover código marcado como histórico/legacy, confirme que ele não é usado pela área pública ou por um redirecionamento de compatibilidade. O objetivo é migrar por fatias testáveis, sem reintroduzir caminhos paralelos de autenticação ou dados simulados para contas reais.
