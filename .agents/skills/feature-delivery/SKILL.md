---
name: feature-delivery
description: Ajuda a implementar uma funcionalidade do Envista de forma incremental, com contratos claros, revisão de segurança, testes e validação visual antes de PR ou deploy.
---

# Entrega incremental

1. Defina objetivo, usuário beneficiado, critérios de aceite e limite da tarefa.
2. Mapeie frontend e ações/queries reais no repositório. Identifique dados, rotas e permissões existentes.
3. Se houver frentes independentes, delegue investigação frontend e revisão de backend a subagentes; evite edição simultânea do mesmo arquivo.
4. Implemente a menor mudança capaz de satisfazer os critérios de aceite. Preserve a identidade visual oficial.
5. Execute `npm run typecheck`, `npm test` e `npm run build`. Rode Playwright no fluxo alterado quando possível.
6. Para UI, aplique a skill `visual-regression` e não se limite a testes sintéticos.
7. Documente riscos, falhas e evidência. Peça autorização antes de merge/deploy.
