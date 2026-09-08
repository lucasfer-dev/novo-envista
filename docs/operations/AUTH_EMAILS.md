# Auth e e-mails de produção

Este runbook registra a configuração de Supabase Auth que acompanha o código do Envista. As opções abaixo vivem no Dashboard do Supabase e não são migrations PostgreSQL, por isso precisam ser conferidas sempre que o domínio oficial mudar.

## URL Configuration

Enquanto o domínio próprio não estiver configurado:

- **Site URL:** `https://envista-novo.vercel.app`
- **Redirect URLs:**
  - `https://envista-novo.vercel.app/**`
  - `https://*-akaakashiseijuro-4610s-projects.vercel.app/**`
  - `http://localhost:3000/**`

Quando houver domínio próprio:

1. altere `NEXT_PUBLIC_SITE_URL` na Vercel para o domínio oficial;
2. altere **Site URL** no Supabase para o mesmo domínio;
3. adicione `https://DOMINIO-OFICIAL/**` à allow list;
4. mantenha o alias `envista-novo.vercel.app` durante a transição/rollback;
5. faça um cadastro novo e uma recuperação de senha reais antes de marcar o release como GO.

O código de produção usa `emailRedirectTo`/`redirectTo` explicitamente. A configuração do Supabase continua necessária porque URLs que não estão na allow list podem cair no **Site URL** padrão. Portanto, deixar o Site URL em `localhost` quebra confirmação de e-mail e recuperação mesmo quando a aplicação está publicada.

## Rotas oficiais

- confirmação/cadastro via PKCE: `/auth/callback?next=/onboarding`
- recuperação via PKCE: `/auth/callback?next=/update-password`
- confirmação SSR/token hash: `/auth/confirm?token_hash=...&type=...`
- redefinição de senha: `/update-password`
- erro amigável: `/auth/error`

`/auth/callback` aceita tanto `code` (PKCE) quanto `token_hash` + `type`. `/auth/confirm` também reconhece `recovery` e envia diretamente para `/update-password`.

## Template — Confirm signup

**Assunto:** `Confirme seu e-mail | Envista`

Use `{{ .ConfirmationURL }}` como destino do botão. Não monte o link manualmente com `localhost` ou com uma URL fixa de preview.

```html
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#17202a">
  <h2 style="margin-bottom:8px">Bem-vindo ao Envista</h2>
  <p>Confirme seu e-mail para concluir a criação da conta e continuar seu perfil.</p>
  <p style="margin:28px 0">
    <a href="{{ .ConfirmationURL }}" style="background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block">Confirmar meu e-mail</a>
  </p>
  <p style="font-size:13px;color:#667085">Se você não criou uma conta no Envista, pode ignorar esta mensagem.</p>
</div>
```

## Template — Reset password

**Assunto:** `Redefina sua senha | Envista`

Use `{{ .ConfirmationURL }}` como destino do botão. O `redirectTo` enviado pela aplicação aponta para `/auth/callback?next=/update-password`.

```html
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#17202a">
  <h2 style="margin-bottom:8px">Redefinição de senha</h2>
  <p>Recebemos uma solicitação para alterar a senha da sua conta Envista.</p>
  <p style="margin:28px 0">
    <a href="{{ .ConfirmationURL }}" style="background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block">Definir nova senha</a>
  </p>
  <p style="font-size:13px;color:#667085">Se não foi você, ignore este e-mail. Sua senha atual continuará válida.</p>
</div>
```

## Teste obrigatório

Faça os testes usando uma caixa de e-mail real:

1. criar conta;
2. abrir o e-mail de confirmação em janela anônima;
3. confirmar que a URL final é pública e termina no onboarding;
4. sair da conta;
5. solicitar “Esqueci minha senha”;
6. abrir o e-mail de recuperação em janela anônima;
7. confirmar que chega em `/update-password` com sessão válida;
8. definir nova senha;
9. confirmar redirecionamento para login e acesso com a nova senha;
10. confirmar que um link antigo/usado mostra `/auth/error` com opção de solicitar outro link.
