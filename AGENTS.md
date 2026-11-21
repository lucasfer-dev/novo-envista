# Envista — regras para agentes

Projeto: Next.js 16, React 19, TypeScript, Supabase Auth/PostgreSQL/RLS, Vitest, Playwright e Vercel.
Fonte de verdade: README.md, docs/ARCHITECTURE.md, SECURITY.md, docs/operations/RELEASE.md e supabase/migrations/.

## Processo
- Comece pela menor investigação possível: busque símbolos e arquivos específicos; não despeje a árvore inteira ou logs longos no contexto.
- Tarefa pequena e clara: um agente, sem orquestração; tarefa complexa: plano curto e aprovação antes de escrever.
- Alethe, quando acionado, é o único coordenador externo; não iniciar outro fluxo automático de subagentes dentro dos workers.
- Limite inicial: dois workers simultâneos; escolha modelos leves para buscas e testes simples, elevando o esforço apenas quando necessário.
- Skills e documentação detalhada são sob demanda. Não carregar todas as skills em cada sessão.
- Mantenha a identidade visual aprovada; consulte docs/redesign/ e componentes existentes antes de redesenhar.
- Não invente dados, métricas, usuários, integrações ou funcionalidades que não existam.

## Segurança e GitHub
- Trabalhe em uma branch/worktree isolada. Nunca faça push direto em main, merge ou deploy automático.
- Não execute migrações remotas, comandos destrutivos, limpeza de dados ou operações com segredos sem aprovação explícita.
- Para autenticação, políticas RLS e multi-tenant, exija revisão de segurança e testes de permissão negativos.
- Ao concluir: npm run typecheck, npm test, npm run security:scan; npm run build quando fizer sentido; testes E2E para fluxos alterados.
- Gere commit e PR no GitHub com resumo, testes efetivamente executados e limitações. Peça aprovação antes de merge e produção.

Papéis especializados: arquiteto, frontend-ux, backend, qa e seguranca. Use apenas os indispensáveis.
Mais detalhes: docs/ai/ORCA-ALETHE.md e docs/ai/SKILLS.md.
