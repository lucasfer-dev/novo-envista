---
name: envista-workflow
description: Fluxo de implementação e revisão do Envista. Use em tarefas do repositório que exijam decidir arquivos, testes, permissões, validação e PR no GitHub. Não carregue em consultas simples.
---

# Fluxo Envista (enxuto)

1. Identifique intenção, escopo, risco e arquivos responsáveis; não leia a árvore inteira.
2. Para tarefa pequena, siga direto com um único agente. Para tarefa complexa, apresente plano de até 6 passos e peça aprovação.
3. Consulte somente as skills técnicas necessárias (frontend, React, Supabase, Postgres, QA ou segurança).
4. Implemente na branch/worktree; mantenha os padrões visuais existentes e a fonte de verdade de Auth/RLS.
5. Execute checks direcionados e registre evidências verificáveis. E2E se alterar um fluxo de usuário.
6. Abra PR no GitHub. Não faça merge ou deploy sem aprovação.

Política de consumo: evite invocar subagentes sem independência de tarefas, evite enviar logs longos ao modelo, use resumo curto entre etapas e encerre tentativas repetidas sem progresso. Não otimize tokens reduzindo testes de segurança.
