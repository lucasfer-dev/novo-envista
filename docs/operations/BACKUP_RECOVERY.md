# Backup e recuperação

Este runbook define o procedimento mínimo para recuperar o Envista depois de perda de dados, migration incorreta ou exclusão acidental.

## O que é fonte de verdade

- PostgreSQL/Supabase: perfis, equipes, projetos, social, mensagens, progresso, moderação e metadados de arquivos.
- Supabase Storage: bytes de avatars, logos e anexos privados.
- GitHub `main`: código da aplicação e histórico das migrations.
- Vercel: artefatos/deploys da aplicação, não o banco de dados.

## Atenção: backup de banco não é backup de Storage

Os backups do banco Supabase incluem o banco e os metadados do Storage, mas **não restauram os objetos/bytes armazenados no Storage**. Restaurar um backup antigo do PostgreSQL não traz de volta um arquivo que foi apagado do bucket depois daquele ponto.

Por isso, recuperação de banco e recuperação de arquivos devem ser tratadas como dois problemas separados.

Referência oficial: https://supabase.com/docs/guides/platform/backups

## Antes de uma migration de risco

1. Confirme que a mudança está versionada em `supabase/migrations/` e passou pelo Security CI.
2. Verifique a página **Database > Backups** do projeto e identifique o restore point mais recente disponível para o plano atual.
3. Para mudanças destrutivas ou de alto impacto, mantenha também um dump lógico fora do projeto usando o Supabase CLI/`pg_dump`, de acordo com a política operacional da equipe.
4. Não coloque dumps, tokens, connection strings ou dados reais no GitHub.
5. Registre o commit, PR, migration e horário imediatamente anterior à execução.

## Recuperação de banco

### Incidente pequeno e reversível

Prefira uma migration corretiva. Não reescreva uma migration que já foi aplicada em produção.

1. Pare novas mutações somente se elas puderem ampliar o dano.
2. Identifique a migration/ação causadora.
3. Crie uma nova migration que restaure o estado correto.
4. Valide constraints, RLS e dados afetados.
5. Registre o ocorrido e a correção.

### Perda/corrupção ampla de dados

1. Declare incidente e evite novos writes enquanto o ponto de recuperação é decidido.
2. Use **Database > Backups** no Dashboard Supabase para escolher um backup anterior ao incidente.
3. Se PITR estiver habilitado, selecione o ponto no tempo apropriado; caso contrário, use o backup disponível mais próximo anterior ao incidente.
4. Considere restaurar primeiro para um **novo projeto** quando o plano/recurso disponível permitir, para validar os dados sem sobrescrever imediatamente a produção.
5. Verifique tabelas críticas, Auth, RLS, migrations e contagens antes de apontar tráfego para o ambiente recuperado.
6. Reconfigure manualmente itens que uma restauração para novo projeto não replica, incluindo Storage objects/settings, Auth settings/API keys, Realtime settings e outros itens indicados pelo Supabase.

Referência oficial para restaurar em novo projeto: https://supabase.com/docs/guides/platform/clone-project

## Storage

Buckets atuais relevantes:

- `avatars`
- `team-assets`
- `project-assets`

A aplicação mantém os buckets privados e usa policies/RLS. Para uma política de backup de arquivos realmente recuperável, configure uma cópia externa/versionada dos objetos antes de depender de Storage para dados insubstituíveis. Essa cópia não deve ficar no repositório Git.

Durante um incidente de Storage:

1. Não apague metadados adicionais até entender a extensão do problema.
2. Compare `project_attachments.path`, `profiles.avatar_path` e `teams.logo_path` com os objetos existentes.
3. Restaure bytes a partir da cópia externa quando disponível.
4. Só remova referências órfãs depois de confirmar que o arquivo não será recuperado.

## RPO/RTO

Até a equipe formalizar SLAs comerciais, trate os números abaixo como metas internas, não garantias ao usuário:

- RPO de banco: limitado pelo tipo/retention de backup disponível no plano Supabase; PITR reduz significativamente a janela quando habilitado.
- RTO: variável conforme tamanho do banco, restauração, validação e reconfiguração. A própria restauração pode deixar o projeto indisponível temporariamente.
- RPO de Storage: depende da rotina externa de cópia dos objetos; backup do banco sozinho não cobre os bytes.

## Teste de recuperação

Pelo menos antes de um lançamento importante e depois de mudanças relevantes na estratégia de dados:

1. Confirme que existe um backup recuperável.
2. Faça um restore/clonagem em ambiente separado quando o plano permitir.
3. Rode smoke tests contra esse ambiente.
4. Verifique Auth, RLS, projetos, equipes, mensagens, cursos e moderação.
5. Registre data, duração, problemas encontrados e ações corretivas.

Um backup nunca testado deve ser tratado como uma hipótese de recuperação, não como uma recuperação comprovada.
