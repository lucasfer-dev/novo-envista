# Envista — instruções para agentes

Este repositório é o Envista de produção (Next.js App Router, React, TypeScript, Supabase, PostgreSQL/RLS, Vitest e Playwright).

## Fonte de verdade
- Leia `README.md`, `SECURITY.md` e os arquivos diretamente relacionados antes de propor mudanças.
- A identidade visual aprovada e os arquivos de marca em `public/brand/` são referências. Não invente imagens oficiais, conteúdo, curtidas, usuários, métricas ou funcionalidades.
- As telas autenticadas e os dados reais são a referência funcional. Fixtures e screenshots sintéticos não provam que a tela autenticada está correta.
- Reaproveite componentes e padrões existentes. Não reescreva páginas inteiras quando uma mudança localizada resolve o problema.
- O backend atual é Supabase/PostgreSQL; o protótipo histórico em `backend/` não é o backend de produção.

## Como trabalhamos
1. Identifique o comportamento esperado, os critérios de aceite e os arquivos impactados.
2. Para tarefas complexas, delegue **análises independentes** a no máximo três subagentes: frontend, backend_reviewer, visual_qa. Uma tarefa pequena deve permanecer com um agente.
3. Um único agente é responsável por editar cada arquivo. Agentes que trabalham em paralelo não devem modificar os mesmos arquivos.
4. Antes de implementar UI, registre viewport, screenshot de referência e estados reais: carregando, vazio, erro, com conteúdo e mobile.
5. Não declare fidelidade visual apenas porque o CSS compila. Compare captura do navegador real (preferencialmente autenticado) com a referência. Registre as diferenças remanescentes.
6. Verifique: `npm run typecheck`, `npm test`, `npm run build`; execute testes Playwright pertinentes e reporte o que foi ou não rodado.
7. Entregue um resumo com arquivos, testes, riscos, screenshots/links quando disponíveis e pontos ainda não validados.

## Guardrails
- Nunca exponha secrets, tokens, cookies ou dados pessoais em logs, commits ou screenshots.
- Não modifique autenticação, RLS, migrações, storage policies ou permissões sem revisão específica. Nenhum subagente deve executar migrações em produção.
- Não abra PR, faça merge ou realize deploy de produção sem autorização explícita para essa ação.
- Não esconda falhas com mock data nem ajuste testes para simplesmente ignorar o problema.
- Para o primeiro piloto, trabalhe **somente em análise/leitura**, sem alterar código de produto.

## Skills disponíveis
- `visual-regression`: verificação visual e UX com evidências.
- `feature-delivery`: entrega incremental e validação de funcionalidades.
