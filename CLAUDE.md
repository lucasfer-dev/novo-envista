# Claude Code — Envista

Leia `AGENTS.md` antes de alterar o projeto. Use os mesmos princípios de segurança, revisão, economia de contexto e GitHub descritos lá.

Os cinco subagentes em `.claude/agents/` são especializações disponíveis, não uma equipe que deve rodar em toda tarefa. Use no máximo dois workers por vez nos primeiros testes, e evite delegação aninhada quando Alethe já estiver orquestrando.

Para mudanças de UI, consulte a identidade em `docs/redesign/`; para dados e autenticação, consulte `SECURITY.md` e `supabase/migrations/`.

Não faça merge, deploy ou alteração de produção sem aprovação explícita.
