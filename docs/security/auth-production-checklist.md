# Autenticação — checklist de produção

Este documento complementa o hardening do código. Alguns controles de Auth vivem no painel do Supabase e precisam ser configurados no ambiente antes de um lançamento público amplo.

## Fluxos implementados no código

- login com resposta genérica para credenciais inválidas;
- cadastro sem enumeração de contas existentes;
- recuperação de senha sem revelar se o e-mail existe;
- confirmação SSR por `token_hash` em `/auth/confirm`, mantendo `/auth/callback` como fallback PKCE;
- senha mínima de 12 caracteres no aplicativo;
- revogação global de refresh tokens após troca de senha, com encerramento local como fallback;
- Cloudflare Turnstile opcional em login, cadastro e recuperação;
- bloqueio de submissão dupla enquanto Server Actions estão pendentes;
- rate limit de borda e headers de segurança mantidos pelo proxy/configuração do Next.js.

## Supabase Auth — obrigatório antes de ativar CAPTCHA

1. Em **Authentication > Bot and Abuse Protection**, habilitar CAPTCHA e escolher Cloudflare Turnstile.
2. Inserir a **Secret Key** do Turnstile somente no Supabase. Nunca colocar a Secret Key em `NEXT_PUBLIC_*`, GitHub ou `vercel.json`.
3. Na Vercel, definir apenas `NEXT_PUBLIC_TURNSTILE_SITE_KEY` para os ambientes que devem exigir o desafio.
4. Validar login, cadastro e recuperação depois de habilitar a proteção no Supabase.

Se a site key não estiver definida, o componente não é renderizado e o fluxo continua funcionando para desenvolvimento/teste. Se a site key estiver definida, as Server Actions passam a exigir `cf-turnstile-response`.

## Confirmação de e-mail e recuperação

Manter **Confirm email** habilitado. Para SSR, preferir templates que enviem o usuário para `/auth/confirm` usando `TokenHash`, em vez de depender exclusivamente do navegador que iniciou o PKCE.

O endpoint aceita `token_hash`, `type` e um `next` interno validado. Para cadastro, o destino deve ser `/onboarding`. Para recuperação, o destino deve ser `/update-password`. O callback PKCE existente continua disponível para compatibilidade durante a migração dos templates.

## URLs

- Site URL de produção: `https://novo-envista.vercel.app` enquanto esse for o domínio oficial.
- Manter apenas redirects realmente necessários na allowlist do Supabase Auth.
- Não usar curingas amplos em produção sem necessidade.

## E-mail

Antes de tráfego real em escala:

- configurar SMTP próprio;
- validar SPF/DKIM/DMARC no domínio de envio;
- revisar remetente e templates;
- testar confirmação, recuperação e expiração de links;
- manter mensagens que não revelem existência de conta.

## Senhas e sessões

- alinhar no painel do Supabase a política mínima de senha com o aplicativo (12 caracteres ou mais);
- se o plano permitir, habilitar proteção contra senhas vazadas;
- manter JWT com validade curta/moderada, sem aumentar indiscriminadamente a expiração;
- a troca de senha deve exigir novo login após revogar sessões anteriores.

## Rate limits

Os limites no proxy são uma camada best-effort por instância/serverless. Configurar também os limites nativos do Supabase Auth e usar proteção de borda/WAF para tráfego distribuído. Nunca considerar um `Map` em memória como defesa suficiente contra ataque distribuído.

## Verificação antes de merge/deploy

- `npm test` verde;
- `npm run build` verde;
- `npm audit --omit=dev --audit-level=high` verde;
- Security CI/secret scan verde;
- Supabase Security Advisor sem findings críticos;
- testar manualmente login válido/inválido, cadastro, confirmação, reset e logout;
- após habilitar Turnstile, testar token ausente, inválido, expirado e válido.
