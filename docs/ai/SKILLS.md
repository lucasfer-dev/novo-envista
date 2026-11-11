# Skills do Envista: instalação com revisão

Execute no PowerShell **dentro do clone local do Envista**. Instalações de skills alteram arquivos locais; só serão refletidas no GitHub após commit e push. Revise a origem e o conteúdo de `SKILL.md` e hooks antes de confirmar. Não instale todas globalmente.

## Núcleo sob demanda

```powershell
npx skills add anthropics/skills --skill frontend-design
npx skills add vercel-labs/agent-skills --skill react-best-practices --skill web-design-guidelines
npx skills add supabase/agent-skills --skill supabase --skill supabase-postgres-best-practices
npx skills add Kc1t/alethe-orchestrate-skill --skill alethe
```

Na seleção interativa, marque Codex/Claude Code conforme o CLI que realmente usa, selecione instalação por projeto e revise scripts e permissões. No Orca, abra a área Skills e confira a descoberta das skills do clone.

## Metodologia / economia (não ativar indiscriminadamente)

**Superpowers**: instalar pelo plugin oficial do CLI, não por comando genérico sem revisar:
- Claude Code: `/plugin install superpowers@claude-plugins-official`
- Codex: dentro do CLI, `/plugins`, busque Superpowers e instale.
Use `executing-plans` nas tarefas relevantes para evitar subagente a cada microetapa; atenção: o plugin pode iniciar metodologia e hooks automáticos.

**Ponytail**: instalar primeiro apenas as skills, se aprovado, para evitar hooks automáticos:
```powershell
npx skills add DietrichGebert/ponytail
```
Selecione as skills necessárias. Não habilite regras globais repetidas. Se usar o plugin completo, revise os hooks. Não supor que economia medida em benchmark se repete nas suas cotas.

**Playwright**: o Envista já inclui `@playwright/test` e pasta `e2e/`. Use os testes existentes antes de instalar outro runner. Para controle pontual de navegador com baixo contexto, opcionalmente: `npm install -g @playwright/cli@latest` e `playwright-cli install --skills`. Revise a instalação primeiro.

**Auditoria de segurança**: Differential Review (Trail of Bits) apenas em mudanças críticas. **Token Hygiene**: somente diagnóstico pontual, se a revisão de contexto indicar necessidade; evitar ferramenta adicional sem prova de ganho.

## Política de escolha

- UI nova: frontend-design; auditoria visual: web-design-guidelines.
- React/Next performance: react-best-practices.
- Auth, integrações e Supabase: supabase.
- SQL, schema, RLS e migrations: supabase-postgres-best-practices.
- Bug difícil: systematic-debugging do Superpowers (se instalado).
- Alteração trivial: nenhuma skill nova, um agente.
- Não carregar a documentação inteira no contexto; usar arquivos e referências sob demanda.

## Verificação

```powershell
npx skills list
npx skills list -g
git status --short
```

Revise todos os arquivos adicionados antes de commitar. Nunca inclua `.env.local`, tokens ou resultados com dados reais. Se a instalação criar arquivos inesperados, interrompa e peça revisão.
