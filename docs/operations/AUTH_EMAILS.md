# Auth e e-mails de produção

Este runbook registra a configuração de Supabase Auth compatível com o fluxo SSR do Envista em `https://useenvista.com.br`.

## Princípios do fluxo

- `GET /confirm-email` e `GET /recover-account` **não consomem** credenciais.
- `token_hash` só é validado por `verifyOtp` depois de clique explícito do usuário.
- `code` PKCE legado só é trocado por sessão depois de clique explícito.
- `type` é validado contra o fluxo esperado (`email` ou `recovery`).
- a Server Action exige que cookies de sessão sejam persistidos; falha de `Set-Cookie` é erro, não sucesso silencioso.
- recuperação cria um marcador HttpOnly, assinado e de curta duração antes de permitir `/update-password`.
- tokens, hashes, access tokens e refresh tokens nunca devem ir para logs, analytics ou localStorage.

A estratégia de clique explícito protege os links contra Gmail/Outlook/Safe Links, antivírus e outros scanners que fazem prefetch de URLs.

## URL Configuration no Supabase

**Site URL**

`https://useenvista.com.br`

**Redirect URLs mínimas**

- `https://useenvista.com.br/confirm-email`
- `https://useenvista.com.br/recover-account`
- `https://useenvista.com.br/update-password`
- `https://envista-novo.vercel.app/**` (rollback/compatibilidade)
- URLs de preview da Vercel somente se o time realmente testar Auth em preview
- `http://localhost:3000/**` somente para desenvolvimento

O código usa `emailRedirectTo` e `redirectTo` explicitamente. A allowlist do Supabase continua necessária: um redirect não permitido pode cair no Site URL configurado.

## Templates oficiais do Envista

Os templates visuais prontos e versionados ficam em:

- confirmação de cadastro: `supabase/email-templates/confirm-signup.html`
- recuperação de senha: `supabase/email-templates/reset-password.html`

Assuntos recomendados:

- confirmação: **Confirme seu e-mail no Envista**
- recuperação: **Redefina sua senha do Envista**

> Importante: versionar os arquivos no repositório não altera automaticamente o template hospedado pelo Supabase Auth. Em produção, copie o HTML correspondente para **Authentication → Email Templates** (ou aplique a mesma configuração por uma API administrativa autorizada) e confirme o assunto antes do release.

## Template — Confirm signup

O botão deve apontar diretamente para a página visual do Envista e carregar `token_hash` + `type=email`. Não use `{{ .ConfirmationURL }}` neste template porque esse URL pode ser consumido por scanners de e-mail.

O arquivo versionado usa:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">
  Confirmar meu e-mail
</a>
```

## Template — Reset password

O arquivo versionado usa:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">
  Criar nova senha
</a>
```

## Sequência de confirmação

1. `signUp` envia `emailRedirectTo=https://useenvista.com.br/confirm-email`.
2. o e-mail entrega `token_hash` e `type=email`.
3. o GET apenas exibe a página; scanners não consomem o token.
4. o usuário clica **Confirmar meu e-mail**.
5. a Server Action valida `type=email` e chama `verifyOtp`.
6. o cliente SSR grava a sessão em cookies na mesma resposta.
7. sucesso segue para `/confirm-email?status=confirmed` e então onboarding.

## Sequência de recuperação

1. `/forgot-password` chama `resetPasswordForEmail` com `redirectTo=https://useenvista.com.br/recover-account`.
2. o e-mail entrega `token_hash` e `type=recovery`.
3. o GET apenas exibe a página; scanners não consomem o token.
4. o usuário clica **Continuar para criar nova senha**.
5. a Server Action valida `type=recovery` e chama `verifyOtp`.
6. a sessão retornada é persistida em cookies; falha de escrita aborta o fluxo.
7. é emitido `envista-recovery-intent`, HttpOnly/SameSite=Lax, assinado e válido por 15 minutos.
8. `/update-password` exige claims válidas **e** o recovery intent ligado ao mesmo usuário.
9. `updateUser({ password })` altera a senha.
10. o recovery intent é removido e `signOut({ scope: "global" })` revoga refresh tokens/sessões; há fallback local.
11. o usuário segue para `/login?status=password-updated`.

## Compatibilidade com e-mails antigos

- `/confirm-email` e `/recover-account` aceitam `code` PKCE antigo.
- `/auth/callback` e `/auth/confirm` continuam como rotas de compatibilidade.
- para confirmação e recuperação, as rotas legadas agora apenas encaminham a credencial em GET para a página visual; não fazem `verifyOtp`/`exchangeCodeForSession` automaticamente.
- outros tipos legados (`invite`, `email_change`, etc.) preservam o comportamento existente e devem ser auditados separadamente se forem habilitados em produção.

## Variáveis da Vercel

Obrigatórias em produção:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL=https://useenvista.com.br`
- `AUTH_RECOVERY_COOKIE_SECRET` com pelo menos 32 caracteres aleatórios, server-only

Conforme o ambiente:

- `AUTH_SIGNUP_ENABLED=true` para permitir cadastro
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` se Bot Protection/Turnstile estiver configurado no Supabase

Nunca exponha `service_role`, `sb_secret_*`, senha do banco ou `AUTH_RECOVERY_COOKIE_SECRET` em `NEXT_PUBLIC_*`.

## Logging de diagnóstico

Os eventos de Auth registram apenas metadados operacionais, como fluxo, transporte (`token_hash`/PKCE), estágio, código/status do erro e falha de cookie. Nunca registrar e-mail, `token_hash`, `code`, access token, refresh token ou conteúdo de cookies.

O Supabase nem sempre distingue de forma confiável um OTP expirado de um OTP já consumido no erro retornado; nesses casos o log deve preservar o `error_code` original e a UI continua genérica.

## Checklist real de produção

1. confirmar Site URL e Redirect URLs no Supabase;
2. copiar `supabase/email-templates/confirm-signup.html` e `supabase/email-templates/reset-password.html` para os respectivos templates do Supabase Auth e configurar os assuntos;
3. confirmar os links com `type=email`/`type=recovery`;
4. desabilitar link tracking do provedor SMTP, se houver;
5. habilitar Leaked Password Protection no Supabase Auth;
6. configurar `AUTH_RECOVERY_COOKIE_SECRET` na Vercel;
7. criar conta nova em janela privada e abrir o link de confirmação;
8. confirmar que o primeiro GET só mostra a página e não confirma a conta;
9. clicar no botão e confirmar sessão + onboarding;
10. sair e solicitar recuperação;
11. abrir o link e confirmar que o primeiro GET não consome o token;
12. clicar e confirmar chegada a `/update-password`;
13. atualizar a senha e confirmar redirect para `/login?status=password-updated`;
14. confirmar que a senha antiga não autentica e a nova autentica;
15. abrir novamente o link já usado e confirmar erro genérico;
16. testar link inválido, sem token, tipo errado, clique duplo e janela anônima;
17. consultar logs por `auth.email.*`, `auth.cookies.write_failed` e `auth.password_update.*` sem dados sensíveis.
