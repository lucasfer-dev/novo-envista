# Primeiro experimento no Envista

**Meta:** comprovar o fluxo Orca → CLI oficial → (Alethe opcional) → GitHub sem tocar na produção.

1. Abra o repo local no Orca e crie a worktree `ai-audit-readonly`.
2. Selecione Codex ou Claude Code em permissões **Manual** e faça uma auditoria somente leitura do cadastro.
3. Exija: arquivos responsáveis, caminho de autenticação, teste existente, riscos e plano de correção em até 6 passos. Até 2 workers se houver delegação útil; não execute scripts de terceiros ou migrações.
4. Compare um agente sozinho com Alethe em `savings`: duração, cota/tokens reportados, qualidade e evidências. Não extrapole os números.
5. Após aprovar uma correção pequena, implemente na branch e rode testes relevantes.
6. Faça commit + push para o GitHub e crie PR draft. Não faça merge antes de revisar.

Comandos básicos na worktree:
```powershell
git status
npm run typecheck
npm test
npm run security:scan
```

Build e E2E após instalar dependências e configurar ambiente adequado. Não declare sucesso sem logs reais.
