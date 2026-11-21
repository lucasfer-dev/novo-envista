# Laboratório de agentes do Envista — Windows 11

Objetivo: trabalhar sobre o repositório real, gerar commits/PRs no GitHub e usar as assinaturas oficiais dos CLIs (sem APIs pagas).

## O que é cada peça

- **Orca (Stably)**: aplicativo visual local; registra um clone Git, cria worktrees, abre Claude Code/Codex/Antigravity e acompanha diffs e PRs.
- **Alethe Orchestrate**: skill executada DENTRO de um CLI (Claude ou Codex). Se for acionada, é ela quem organiza os workers; não acione simultaneamente a orquestração do Orca para a mesma tarefa.
- **Papéis**: cinco agentes disponíveis em `.claude/agents/` e `.codex/agents/`. Não são cinco processos permanentes. Alethe pode usar trabalhadores próprios; esses papéis nativos servem para sessões sem Alethe.
- **GitHub**: fonte remota das mudanças; Orca opera arquivos do clone local e publica por `git push`/PR, não edita um repositório remoto diretamente.

## 1. Preparação (PowerShell)

Confirme que Git, gh, Node, Codex e Claude estão disponíveis:

```powershell
git --version
gh --version
node --version
codex --version
codex login status
claude --version
gh auth status
```

Caso Codex falhe com pacote opcional win32, tente `npm install -g @openai/codex@latest --include=optional`. Reabra o PowerShell e verifique de novo.

Clone apenas se o projeto não estiver no seu computador:

```powershell
git clone https://github.com/lucasfer-dev/novo-envista.git
cd novo-envista
git status
```

Se já possui o clone, abra a pasta existente e use `git fetch origin`. Nunca apague alterações locais para configurar agentes.

## 2. Orca

1. Instale o Orca pelo site oficial: https://www.onorca.dev/docs/install
2. Em Settings > Agents > Agent Permissions, escolha **Manual**; revise argumentos customizados que ainda contenham `--dangerously-skip-permissions`, `--dangerously-bypass-approvals-and-sandbox` ou `--yolo`.
3. Em Settings > Integrations, conecte GitHub se necessário; confira também `gh auth status`.
4. Use **Add Repo** e selecione a pasta local `novo-envista`.
5. Clique no **+** ao lado do repositório, crie uma worktree de teste (ex.: `ai-audit-readonly`) e inicie **Codex** ou **Claude Code**. Não abra cinco sessões simultâneas.
6. A branch é local até receber commit/push; use o painel de Git/PR do Orca ou `git push -u origin NOME-DA-BRANCH` e `gh pr create --draft` para publicar um PR.

## 3. Alethe — sem coordenadores duplicados

Instale a skill no projeto no CLI desejado (veja docs/ai/SKILLS.md), reinicie a sessão e tente `/alethe setup`.
- Perfil inicial: `savings`, no máximo 2 workers, somente providers autenticados por assinatura; nenhum fallback para API sem sua permissão.
- **Não** habilite `/alethe always` no começo; invoque manualmente só quando a tarefa justificar delegação.
- Exija prévia de plano, read-only inicial e aprovação antes de escrita, migrações, push e merge.
- Ao fim, `/alethe report`; comparar qualidade, tokens reportados, tempo e retrabalho. Nunca prometer economia sem mensuração.
- Alethe guarda política local em `%APPDATA%\Alethe\`; essa configuração pessoal não é sincronizada pelo GitHub.

## 4. Fluxo seguro com GitHub

1. Tarefa pequena: um CLI numa worktree, sem Alethe.
2. Tarefa complexa: classificação e plano breve; você aprova; Alethe aciona apenas workers independentes necessários.
3. Implementação em uma branch; testes locais `npm run typecheck`, `npm test`, `npm run security:scan`, `npm run build` se aplicável.
4. Revisão de diff, commit e push da branch; abrir PR (preferencialmente draft primeiro).
5. Você aprova o PR; somente então ocorre merge. Deploy de produção permanece separado.

## Primeiro teste — só leitura

Na worktree, inicie Codex/Claude em modo manual e solicite:
"Audite o fluxo de cadastro do Envista sem modificar arquivos. Identifique os arquivos reais, riscos de Auth/RLS, testes existentes, uma melhoria pequena e quais skills seriam necessárias. Se for usar Alethe, limite a 2 workers de leitura; não rode API paga, push ou deploy. Entregue relatório curto e evidências."

Só depois do teste de leitura, escolha uma mudança pequena para um PR.
