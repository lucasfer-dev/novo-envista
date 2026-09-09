# Auth e e-mails de produção

Este runbook registra a configuração de Supabase Auth que acompanha o código do Envista. As opções abaixo vivem no Dashboard do Supabase e não são migrations PostgreSQL, por isso precisam ser conferidas sempre que o domínio oficial mudar.

## Objetivo do fluxo

Confirmação de e-mail e recuperação de senha devem acontecer visualmente dentro do Envista. O Supabase continua responsável por emitir e validar credenciais, mas o primeiro endereço aberto pelo usuário deve ser uma página do próprio produto.

Os links novos usam `token_hash` e só consomem a credencial depois de uma ação explícita do usuário. Isso reduz problemas causados por scanners/prefetchers de provedores de e-mail que podem abrir links automaticamente.

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

Fluxo novo:

- confirmação visual: `/confirm-email?token_hash=...`
- recuperação visual: `/recover-account?token_hash=...`
- criação da nova senha após validação: `/update-password`
- erro amigável: `/auth/error`

Compatibilidade com e-mails antigos:

- `/auth/callback` continua aceitando `code` PKCE e `token_hash`;
- `/auth/confirm` continua aceitando links token-hash antigos;
- `/confirm-email` e `/recover-account` também aceitam `code` PKCE recebido de um template antigo que ainda use `{{ .ConfirmationURL }}`.

Não remova as rotas legadas enquanto puderem existir e-mails antigos válidos em caixas de entrada.

## Template — Confirm signup

**Assunto:** `Confirme seu e-mail | Envista`

O botão deve apontar para o `RedirectTo` que a aplicação enviou (`/confirm-email`) e anexar o hash gerado pelo Supabase. Não use `{{ .ConfirmationURL }}` no template novo.

```html
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#17202a">
  <h2 style="margin-bottom:8px">Bem-vindo ao Envista</h2>
  <p>Confirme seu e-mail para concluir a criação da conta e continuar seu perfil.</p>
  <p style="margin:28px 0">
    <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}" style="background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block">Confirmar meu e-mail</a>
  </p>
  <p style="font-size:13px;color:#667085">O link abre uma página segura do Envista. A confirmação só é concluída quando você confirma a ação nessa página.</p>
  <p style="font-size:13px;color:#667085">Se você não criou uma conta no Envista, pode ignorar esta mensagem.</p>
</div>
```

## Template — Reset password

**Assunto:** `Redefina sua senha | Envista`

O botão deve apontar para o `RedirectTo` que a aplicação enviou (`/recover-account`) e anexar o hash de recuperação.

```html
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#17202a">
  <h2 style="margin-bottom:8px">Redefinição de senha</h2>
  <p>Recebemos uma solicitação para alterar a senha da sua conta Envista.</p>
  <p style="margin:28px 0">
    <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}" style="background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block">Redefinir minha senha</a>
  </p>
  <p style="font-size:13px;color:#667085">O link abre o Envista primeiro. Sua senha não é alterada até você validar o link e definir uma nova senha.</p>
  <p style="font-size:13px;color:#667085">Se não foi você, ignore este e-mail. Sua senha atual continuará válida.</p>
</div>
```

## Sequência de confirmação

1. `signUp` envia `emailRedirectTo=https://.../confirm-email`;
2. o template monta `{{ .RedirectTo }}?token_hash={{ .TokenHash }}`;
3. o usuário abre `/confirm-email` sem consumir o token;
4. ao clicar **Confirmar meu e-mail**, uma Server Action chama `verifyOtp` com `type: email`;
5. a sessão é gravada nos cookies do Envista;
6. o usuário segue para `/onboarding`.

## Sequência de recuperação

1. `/forgot-password` chama `resetPasswordForEmail` com `redirectTo=https://.../recover-account`;
2. o template monta `{{ .RedirectTo }}?token_hash={{ .TokenHash }}`;
3. o usuário abre `/recover-account` sem alterar a senha;
4. ao clicar **Continuar para criar nova senha**, uma Server Action chama `verifyOtp` com `type: recovery`;
5. a sessão temporária de recuperação é gravada nos cookies;
6. o usuário segue para `/update-password`;
7. após salvar, as sessões são encerradas e o usuário volta ao login.

## Teste obrigatório

Faça os testes usando uma caixa de e-mail real:

1. criar uma conta nova;
2. confirmar que o botão do e-mail aponta para `envista-novo.vercel.app/confirm-email?...`;
3. abrir o e-mail em janela anônima e confirmar que a página do Envista aparece antes da confirmação;
4. clicar **Confirmar meu e-mail** e confirmar chegada ao onboarding;
5. sair da conta;
6. solicitar **Esqueci minha senha**;
7. confirmar que o botão do e-mail aponta para `envista-novo.vercel.app/recover-account?...`;
8. abrir o link e confirmar que a senha ainda não foi alterada;
9. clicar para continuar e confirmar chegada em `/update-password` com sessão válida;
10. definir nova senha;
11. confirmar redirecionamento para login e acesso com a nova senha;
12. confirmar que um link antigo/usado mostra `/auth/error` com opção de solicitar outro link;
13. confirmar que um e-mail antigo que ainda entregue `code` PKCE continua utilizável durante a transição.
