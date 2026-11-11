# Alethe — otimização conservadora do Envista

O Alethe salva seu perfil, modelos e policy em `%APPDATA%\Alethe`, fora do GitHub. Este repositório versiona um ajustador para a cópia local dos playbooks. **Não contém credenciais, modelos privados ou dados da produção.**

## Aplicar no Windows 11

No PowerShell, dentro de `E:\envista\novo-envista` e na branch `chore/ai-agents-orca-alethe-setup`:

```powershell
git fetch origin
git pull --ff-only
py -3 scripts/ai/optimize_alethe.py
py -3 scripts/ai/optimize_alethe.py --apply
```

O primeiro comando Python mostra o diff sem escrever. O segundo faz backup de `%APPDATA%\Alethe\alethe-playbooks.yaml`, aplica as alterações e executa `doctor`. **Mesmo que o processo do doctor termine com código 0, o script exige `playbooks.valid == true` e `policy.valid == true`; caso contrário, restaura o backup.**

Se a versão do YAML local tiver formato inesperado, o script para antes de alterar. Não é necessário reinstalar Alethe.

## Mudanças pontuais

| Playbook | Fase | Antes | Depois | Justificativa |
| --- | --- | --- | --- | --- |
| Complete | plan | strong | standard | Evita triagem forte em todas as tarefas |
| Complete | quick | strong | standard | Execução direta de tarefas pequenas |
| Complete | read | 4 scouts | 2 scouts | Menos paralelismo inútil |
| Scout then build | brief | strong | standard | Brief não requer modelo máximo por padrão |
| Scout then build | scout | 4 scouts | 2 scouts | Reduz leitura redundante |
| Scout then build | plan | strong | standard | Planejamento moderado na investigação habitual |
| Plan big execute small | investigate | 4 workers | 2 workers | Preserva teto de concorrência |
| Parallel worktrees | build | 3 workers | 2 workers | Alinha com policy de 2 workers |

O script **não altera** `providers`, `tiers`, `profiles`, `quota`, `passive`, `policy`, `prices`, `trust`, `AGENTS.md` ou arquivos do app. As decisões de risco e o review-gate permanecem. Um modelo forte continua disponível para tarefas complexas ou escalonamento. Trocar o tier da etapa do lead **não muda automaticamente o modelo selecionado no Claude Code**: ajuste em `/model` se necessário.

## Validar visualmente

Depois de aplicar:

```text
/alethe editor
/alethe usage
/alethe models
```

Confirme que `Complete → planner` mostra `standard`, que scouts indicam no máximo 2 unidades e que o perfil `savings` continua ativo. O editor é uma **simulação**, não prova de economia real.

## Medir eficiência real sem mexer em produção

1. Pegue o mesmo commit base em **duas worktrees isoladas**.
2. Faça três tarefas comparáveis, com escopo e critérios de aceite iguais: correção visual pequena, investigação de bug de cadastro, implementação de funcionalidade localizada.
3. Compare fluxo padrão versus otimizado: tempo, tokens reportados, quota consumida, chamadas, testes aprovados, defeitos detectados e retrabalho. Não compare apenas o custo estimado em USD: os CLIs estão nas assinaturas.
4. Para tarefa pequena, teste `direct`; bug desconhecido, `scout-then-build`; funcionalidade, `plan-execute`. Permita `complete` só quando nenhuma rota específica se encaixar.
5. Nunca rodar migrações, escrita de dados reais, push para `main`, merge ou deploy automaticamente.

**Limitação da validação nesta entrega:** o script foi testado em fixture para diff, aplicação, backup e idempotência. O ambiente remoto não acessa diretamente o Windows. A validação definitiva do YAML personalizado depende de executar `--apply` no seu PC; a própria automação restaura o estado anterior se `doctor` reprovar.

Fontes técnicas: [documentação dos playbooks](https://github.com/Kc1t/alethe-orchestrate-skill/blob/main/skills/alethe/references/playbooks.md) e [skill oficial](https://github.com/Kc1t/alethe-orchestrate-skill/blob/main/skills/alethe/SKILL.md).
