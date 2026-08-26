# Prevenção de abuso e hardening de requisições

Este documento descreve as camadas técnicas usadas pelo Envista para reduzir brute force, spam, automação abusiva, CSRF, abuso de escrita e exaustão de recursos. Nenhuma camada isolada deve ser tratada como proteção absoluta.

## Camadas atuais

### 1. Borda / Next.js

O `proxy.ts` aplica uma proteção best-effort antes das Server Actions e Route Handlers:

- rejeita requisições inseguras (`POST`, `PUT`, `PATCH`, `DELETE`) quando `Origin`/`Sec-Fetch-Site` indicam origem cruzada;
- limita login a 10 POSTs por minuto por IP;
- limita cadastro a 5 POSTs por 10 minutos por IP;
- limita recuperação de senha a 5 POSTs por 15 minutos por IP;
- limita outras requisições inseguras a 120 por minuto por IP;
- responde `429` com `Retry-After` e `Cache-Control: no-store`.

Na Vercel, `x-forwarded-for` é sobrescrito pela plataforma na borda e representa o IP público observado pela Vercel. O valor não é persistido pelo Envista nesta implementação.

O limitador em memória é propositalmente apenas a primeira camada: instâncias serverless podem ter memória independente e reiniciar. Não deve ser usado como única proteção para operações autenticadas.

### 2. Quotas atômicas no Supabase

A migration de hardening cria uma tabela privada de contadores e triggers `BEFORE INSERT`. O ator sempre é obtido por `auth.uid()`; IDs enviados pelo cliente não escolhem a quota consumida.

Limites iniciais:

| Escopo | Limite |
| --- | --- |
| mensagens diretas | 30/minuto |
| novas conversas | 30/hora |
| posts | 10/10 minutos |
| comentários | 30/10 minutos |
| curtidas | 120/10 minutos |
| follows | 60/10 minutos |
| equipes | 10/hora |
| projetos | 20/hora |
| convites de equipe | 30/hora |
| anexos de projeto | 30/hora |
| denúncias de mensagem | 20/dia |
| solicitações de privacidade | 20/dia |

Essas quotas continuam valendo mesmo se um usuário autenticado tentar gravar diretamente pela Data API do Supabase, porque a limitação ocorre no banco.

### 3. Autorização e menor privilégio

RLS continua sendo a camada autoritativa de acesso a dados. Rate limiting não substitui políticas de autorização. Admin é separado do papel de produto por `admin_memberships`; mensagens privadas só ficam disponíveis para moderação quando existe denúncia correspondente.

### 4. Payload, browser e headers

- Server Actions aceitam no máximo 256 KB; uploads de arquivos seguem diretamente para o Supabase Storage com regras próprias;
- CSP, HSTS, `nosniff`, `DENY`, `Permissions-Policy`, COOP e CORP reduzem classes de ataque no navegador;
- rotas de autenticação, conta e admin recebem `Cache-Control: private, no-store`;
- logout por POST faz validação explícita de origem.

### 5. Supply chain e segredos

O Security CI executa testes, build, `npm audit` e um scanner de arquivos versionados que bloqueia padrões conhecidos de chave secreta do Supabase e material de chave privada. O scanner não substitui secret scanning do provedor nem rotação de credenciais após exposição.

## Proteções de plataforma recomendadas antes de tráfego público relevante

- manter as mitigações automáticas de DDoS da Vercel habilitadas;
- configurar regra de rate limiting no Vercel Firewall/WAF para login, cadastro e recuperação de senha, se disponível no plano;
- avaliar BotID/CAPTCHA em cadastro e autenticação conforme sinais reais de abuso;
- revisar os limites nativos do Supabase Auth;
- criar alertas para aumento de `429`, falhas de autenticação, denúncias e erros de quota;
- testar periodicamente tentativas de acesso horizontal e vertical contra RLS/admin.

## Operação e incidentes

Ao detectar abuso, preservar evidências necessárias sem registrar senhas, tokens, corpos de mensagens privadas ou segredos em logs. Seguir `docs/security/incident-response.md` para triagem, contenção, rotação de credenciais e avaliação de comunicação regulatória.

## Limitações conhecidas

Rate limiting reduz abuso; não impede todo DDoS distribuído nem substitui WAF/CDN. RLS reduz acesso indevido; não substitui revisão de lógica de negócio. Controles técnicos também não tornam o produto automaticamente conforme à LGPD ou ao ECA Digital: documentos, papéis de controlador/operador, retenção, direitos dos titulares, aferição de idade, supervisão parental e análise do melhor interesse precisam de decisão operacional/jurídica própria.
