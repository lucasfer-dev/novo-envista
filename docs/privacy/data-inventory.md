# Inventário de Dados Pessoais

Este inventário deve ser atualizado junto com o schema. Nenhuma categoria nova deve entrar no produto sem finalidade, necessidade, acesso e retenção definidos.

| Categoria | Exemplos | Local | Visibilidade | Finalidade inicial | Retenção inicial |
|---|---|---|---|---|---|
| Identidade de conta | UUID, e-mail de autenticação | Supabase Auth | privada | autenticar e recuperar conta | enquanto a conta existir + obrigações legais aplicáveis |
| Perfil de diretório | username, nome de exibição, bio, avatar, organização | `public.profiles` | própria ou plataforma, conforme opção e proteção etária | identidade e descoberta na plataforma | enquanto a conta existir |
| Localização/escola publicadas voluntariamente | `public_city`, `public_state`, `public_school` | `public.profiles` | própria ou plataforma quando permitido | contexto público escolhido pelo usuário | enquanto publicado/conta existir |
| Preferência de contato | `allow_messages` | `public.profiles` | plataforma | controlar possibilidade de contato | enquanto a conta existir |
| Conformidade etária | faixa `child/adolescent/adult/unknown` | `public.account_compliance` | somente titular + operação confiável | aplicar proteções adequadas à idade | enquanto necessário para a conta |
| Consentimento de responsável | status/data/referência de verificação | `public.account_compliance` | somente titular + operação confiável | comprovar fluxo aplicável a crianças | conforme obrigação e política de retenção definida antes do lançamento |
| Eventos de documentos legais | tipo, versão, data/hora, contexto | `public.legal_acceptances` | somente titular + operação confiável | registrar aceite de Termos e ciência/apresentação do Aviso de Privacidade | conforme necessidade jurídica e princípio da necessidade |
| Privilégio administrativo | vínculo de admin e concessão | `public.admin_memberships` | somente operação confiável | autorização administrativa | enquanto o privilégio existir + trilha necessária |
| Equipes e vínculos | equipe, função, nível de acesso, convites | `public.teams`, `public.team_members`, `public.team_invitations` | conforme RLS da equipe | colaboração e gestão de equipes | enquanto a equipe/vínculo existir + histórico operacional necessário |
| Projetos | autoria, equipe, descrição, estágio, tags, visibilidade | `public.projects` | privada/plataforma conforme opção | portfólio e colaboração | enquanto o projeto existir |
| Arquivos | avatar, logo, anexos de projeto | Supabase Storage + `public.project_attachments` | privada ou por URL assinada conforme autorização | identidade visual e documentos do projeto | enquanto usados; versões removidas devem ser excluídas quando possível |
| Social | posts, curtidas, comentários e follows | `public.posts`, `public.post_likes`, `public.post_comments`, `public.follows` | conforme RLS e visibilidade do autor | interação social dentro da plataforma | enquanto o conteúdo/vínculo existir ou até moderação/exclusão aplicável |
| Mensagens privadas | conversa, participantes, corpo da mensagem, leitura | `public.conversations`, `public.conversation_participants`, `public.messages` | apenas participantes; admin somente para conteúdo denunciado | comunicação direta | política de retenção final deve ser definida antes do lançamento público |
| Bloqueios e denúncias | usuário bloqueado, denúncia, motivo, status | `public.user_blocks`, `public.message_reports` | titular e moderação conforme necessidade | segurança, prevenção de abuso e moderação | enquanto necessário para segurança, contestação e obrigações aplicáveis |
| Cursos e progresso | matrícula, aulas concluídas e datas | `public.course_enrollments`, `public.lesson_progress` | somente titular + operação autorizada | aprendizado e acompanhamento de progresso | enquanto a conta existir ou conforme política educacional definida |
| Notificações | tipo, título, referência interna, leitura | `public.notifications` | somente titular | informar eventos do produto | enquanto útil ao usuário; política de expiração pode ser aplicada posteriormente |
| Solicitações de privacidade | tipo do pedido, detalhes, status e resposta administrativa | `public.privacy_requests` | titular + admin | atender direitos do titular e registrar tratamento do pedido | conforme necessidade de comprovação e política final de retenção |
| Trilha administrativa | ação, tipo/alvo técnico e metadata curta | `public.admin_audit_log` | somente admin | responsabilização e investigação operacional | prazo final deve ser definido antes do go-live |

## Dados que não devem entrar em `profiles`

- e-mail;
- telefone;
- endereço completo;
- senha ou token;
- data de nascimento completa;
- documento de identidade;
- dados sensíveis;
- informação de responsável legal.

Se uma funcionalidade realmente exigir uma dessas categorias, ela deve usar armazenamento privado separado, RLS próprio, finalidade documentada e revisão de minimização antes da implementação.

## Crianças e adolescentes

A fundação não persiste data de nascimento completa. O onboarding recebe apenas a informação necessária para enquadrar a conta em faixa etária e persiste a categoria, não a data exata.

Perfis novos nascem privados e mensagens desabilitadas. Enquanto `age_band` estiver `unknown`, o banco impede que o próprio cliente libere perfil público ou mensagens. Para `child`, o acesso ao produto permanece condicionado ao fluxo de responsável e mensagens diretas continuam bloqueadas. Regras específicas para adolescentes devem permanecer sob revisão antes do lançamento público.

## Mensagens e moderação

Mensagens não são tratadas como criptografia ponta a ponta. O acesso normal é restrito aos participantes pela RLS. O painel administrativo não recebe leitura geral das conversas: a política administrativa de moderação permite acesso ao conteúdo de mensagem somente quando houver denúncia relacionada.

## Schema histórico inativo

As tabelas `public.competitions` e `public.competition_team_registrations` podem existir em ambientes que receberam uma migration anterior. Elas não fazem parte do produto ativo, não possuem interface e o papel `authenticated` não recebe acesso a elas. Nenhuma nova coleta ou gravação deve ocorrer nessas tabelas enquanto o módulo permanecer desativado.

## Documentos legais

O browser não possui INSERT direto em `legal_acceptances`. O fluxo de Auth/onboarding registra eventos apenas para versões conhecidas do documento.

Uma entrada de `privacy` não deve ser tratada automaticamente como consentimento LGPD. O Aviso de Privacidade informa o tratamento; a base legal precisa ser definida por finalidade. Quando consentimento for realmente a base legal de uma finalidade específica, esse consentimento deve ter fluxo e registro próprios.

## Terceiros / operadores a documentar antes do lançamento

- Supabase — Auth, banco, Storage e Realtime;
- Vercel — hospedagem e execução do Next.js;
- SMTP/e-mail transacional futuro;
- analytics somente se realmente necessário;
- qualquer provedor de IA ou integração que receba dados pessoais.

Para cada terceiro, registrar finalidade, categorias de dados, região/transferência internacional, contrato/termos aplicáveis e prazo de retenção.
