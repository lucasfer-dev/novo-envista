# Inventário Inicial de Dados Pessoais

Este inventário deve ser atualizado junto com o schema. Nenhuma categoria nova deve entrar no produto sem finalidade, necessidade, acesso e retenção definidos.

| Categoria | Exemplos | Local | Visibilidade | Finalidade inicial | Retenção inicial |
|---|---|---|---|---|---|
| Identidade de conta | UUID, e-mail de autenticação | Supabase Auth | privada | autenticar e recuperar conta | enquanto a conta existir + obrigações legais aplicáveis |
| Perfil de diretório | username, nome de exibição, bio, avatar, organização | `public.profiles` | própria ou plataforma, conforme opção | identidade e descoberta na plataforma | enquanto a conta existir |
| Localização/escola publicadas voluntariamente | `public_city`, `public_state`, `public_school` | `public.profiles` | própria ou plataforma | contexto público escolhido pelo usuário | enquanto publicado/conta existir |
| Preferência de contato | `allow_messages` | `public.profiles` | plataforma | controlar possibilidade de contato | enquanto a conta existir |
| Conformidade etária | faixa `child/adolescent/adult/unknown` | `public.account_compliance` | somente titular + operação confiável | aplicar proteções adequadas à idade | enquanto necessário para a conta |
| Consentimento de responsável | status/data/referência de verificação | `public.account_compliance` | somente titular + operação confiável | comprovar fluxo aplicável a crianças | conforme obrigação e política de retenção definida antes do lançamento |
| Aceites legais | tipo, versão, data/hora, contexto | `public.legal_acceptances` | somente titular + operação confiável | demonstrar versão aceita de Termos/Aviso | conforme necessidade jurídica e princípio da necessidade |
| Privilégio administrativo | vínculo de admin e concessão | `public.admin_memberships` | somente operação confiável | autorização administrativa | enquanto o privilégio existir + trilha necessária |
| Avatar | arquivo JPEG/PNG/WebP | Storage `avatars` | condicionado ao perfil | identidade visual | enquanto usado; versões antigas devem ser removidas |

## Dados que não devem entrar em `profiles`

- e-mail;
- telefone;
- endereço completo;
- senha ou token;
- data de nascimento completa;
- documento de identidade;
- dados sensíveis;
- informação de responsável legal.

Se uma funcionalidade futura realmente exigir uma dessas categorias, ela deve usar armazenamento privado separado, RLS próprio, finalidade documentada e revisão de minimização antes da implementação.

## Crianças e adolescentes

A fundação não persiste data de nascimento completa. O fluxo de onboarding deverá receber a informação necessária para aferição de faixa etária, calcular a categoria no lado confiável e descartar a data exata, salvo se uma necessidade jurídica/produto específica for documentada.

Perfis novos nascem privados e mensagens desabilitadas. A exposição passa a ser uma escolha explícita do fluxo de onboarding, respeitando proteções adicionais para menores.

## Terceiros / operadores a documentar antes do lançamento

- Supabase — Auth, banco, Storage e possivelmente Realtime;
- Vercel — hospedagem e execução do Next.js;
- SMTP/e-mail transacional futuro;
- analytics somente se realmente necessário;
- qualquer provedor de IA ou integração que receba dados pessoais.

Para cada terceiro, registrar finalidade, categorias de dados, região/transferência internacional, contrato/termos aplicáveis e prazo de retenção.
