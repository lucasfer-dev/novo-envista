# Integração GitHub do Envista

A integração usa um **GitHub App**. O Envista não persiste tokens de acesso do GitHub: guarda apenas o `installation_id` e gera tokens temporários para cada operação.

## Configuração do GitHub App

Use:

- Setup URL: `https://useenvista.com.br/api/github/callback`
- Webhook URL: `https://useenvista.com.br/api/github/webhook`
- Webhook secret: valor forte e aleatório, igual a `GITHUB_APP_WEBHOOK_SECRET`

Permissões recomendadas do repositório:

- Metadata: Read-only
- Contents: Read & write (necessário para Releases)
- Issues: Read & write
- Discussions: Read & write
- Pull requests: Read-only

Eventos recomendados:

- Push
- Pull request
- Issues
- Release
- Discussion
- Installation
- Installation repositories

A instalação deve permitir que a pessoa escolha **somente os repositórios desejados**.

## Variáveis de ambiente

Configure na Vercel e no desenvolvimento:

- `GITHUB_APP_ID`
- `GITHUB_APP_SLUG`
- `GITHUB_APP_PRIVATE_KEY_BASE64`
- `GITHUB_APP_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

`GITHUB_APP_PRIVATE_KEY_BASE64` deve conter o arquivo de chave privada do GitHub App convertido integralmente para base64. Nunca versione a chave original ou o valor base64.

`SUPABASE_SERVICE_ROLE_KEY` é usada somente na rota de webhook para associar eventos assinados a uma instalação. Ela nunca deve receber o prefixo `NEXT_PUBLIC_`.

## Banco de dados

A migration `20261005110000_github_integration.sql` cria:

- `github_connections`
- `github_repositories`
- `github_events`

As políticas RLS permitem:

- cada usuário gerenciar a própria conexão;
- repositórios privados somente para o proprietário;
- repositórios públicos apenas quando marcados para aparecer no perfil;
- eventos públicos somente quando pertencem a um perfil visível na plataforma.

## Fluxo

1. O usuário acessa `/integrations/github`.
2. `/api/github/connect` inicia a instalação do GitHub App com um `state` temporário HttpOnly.
3. O GitHub retorna para `/api/github/callback`.
4. O Envista valida o estado, registra a instalação e sincroniza os repositórios.
5. O webhook recebe atividade futura e grava somente dados resumidos — o payload bruto não é persistido.
6. A tela permite controlar quais repositórios públicos aparecem no perfil.
7. O modal de publicação cria GitHub Discussions, Releases ou Issues usando token temporário da instalação.

## Privacidade

Repositórios privados nunca podem ser marcados para aparecer no perfil. O webhook guarda apenas título, resumo, tipo de evento, links e identificadores necessários para a experiência; o payload completo enviado pelo GitHub não é salvo.
