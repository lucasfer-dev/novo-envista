# Envista — Beta Readiness

Este runbook registra os gates mínimos para tratar o Envista como beta funcional e reduzir a chance de confundir volume de funcionalidades com maturidade de produto.

## 1. Arquitetura e dados

- Contas reais devem usar exclusivamente os caminhos persistidos em Next.js + Supabase.
- `EnvistaApp`, fixtures e componentes marcados como legacy podem permanecer apenas como dívida de interface/compatibilidade; não podem simular sessão, autorização ou persistência de uma conta real.
- Toda nova mutação sensível deve continuar protegida no servidor/banco mesmo se a interface for ignorada.
- Tabelas expostas devem permanecer protegidas por RLS e policies adequadas ao ownership.

## 2. Funil de ativação

O funil autoritativo é derivado de gravações bem-sucedidas no banco, não de cliques do frontend. Eventos atuais:

- `onboarding_completed`
- `project_created`
- `team_created`
- `course_started`
- `course_completed`
- `investor_verification_requested`
- `investor_interest_created`
- `message_started`

`product_events` não recebe INSERT direto de `authenticated`. Os eventos são produzidos por triggers internas e o usuário comum não pode consultar a tabela; a leitura agregada fica no painel administrativo.

Privacidade: não registrar IP, fingerprint, texto livre, conteúdo de mensagens, termos pesquisados ou payloads de formulários nesse funil.

## 3. Qualidade dos projetos

O cockpit mostra um `Project Readiness Score` determinístico e explicável. O score mede completude de apresentação (problema, solução, impacto, tags, necessidades, README, capa, localização e evidência externa) e nunca deve ser apresentado como probabilidade de investimento ou qualidade intrínseca do projeto.

Um futuro `Investor Match` só deve ser liberado quando o investidor tiver uma tese/preferências explicitamente cadastradas (setores, estágios, geografia e outros critérios relevantes). Não inventar um percentual de compatibilidade sem sinais suficientes.

## 4. Segurança

Antes de abertura pública relevante:

- executar os advisors de Security e Performance do Supabase;
- executar `npm run security:scan`, `npm run typecheck`, `npm test`, `npm run build` e `npm audit --omit=dev --audit-level=high`;
- validar RLS tentando ler/alterar dados de outra conta sem usar a interface;
- validar Storage com o mesmo princípio;
- revisar funções `SECURITY DEFINER` e manter somente as que tenham justificativa explícita e superfície allowlisted;
- manter `account_private_identifiers` sem policy pública enquanto a funcionalidade estiver pausada;
- habilitar Leaked Password Protection no Supabase Auth quando disponível no plano/configuração do projeto.

A RPC `get_public_project_share(text)` é uma exceção intencional: ela precisa ler uma projeção pública allowlisted sem conceder SELECT anônimo às tabelas base. Seu `EXECUTE` deve continuar limitado explicitamente a `anon` e `authenticated`, nunca ao `PUBLIC` implícito.

## 5. Performance

Foreign keys relevantes devem ter índices de suporte. Não remover índices apenas porque o advisor marca `unused_index` numa base com pouco tráfego; reavaliar após volume representativo e consultas reais.

## 6. Observabilidade

- Vercel: acompanhar erros de runtime, status HTTP e falhas de build.
- Supabase: acompanhar advisors, Auth e falhas de banco.
- Produto: usar o funil agregado para encontrar gargalos de ativação.
- Evitar observabilidade baseada em coleta excessiva de dados pessoais.

## 7. Validação com usuários

Antes de chamar o produto de validado, realizar uma rodada com usuários reais (participantes e investidores) e medir, no mínimo:

1. cadastro e confirmação de e-mail;
2. conclusão do onboarding;
3. primeira ação de valor do papel escolhido;
4. retorno ao produto em outro dia;
5. pontos de abandono e dúvidas recorrentes.

Não usar número de telas, commits ou funcionalidades como substituto para retenção e uso real.

## 8. Go / No-Go

**Go para beta controlado** quando:

- produção e CI estão verdes;
- fluxos críticos de auth passam em navegador real;
- não existem achados críticos/altos não tratados;
- backup/rollback estão documentados;
- o funil de ativação está registrando ações reais;
- os primeiros usuários conseguem concluir a jornada principal sem intervenção técnica.

**No-Go** se autenticação, autorização/RLS, recuperação de senha, deploy, dados persistidos ou rollback estiverem instáveis.
