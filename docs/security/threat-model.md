# Threat Model Inicial — Envista

## Ativos principais

- contas e sessões Supabase Auth;
- perfis e preferências de privacidade;
- dados de conformidade etária;
- projetos, equipes, posts, likes, follows e mensagens quando forem migrados;
- arquivos no Supabase Storage;
- credenciais de infraestrutura e integrações;
- registros de aceite e incidentes.

## Fronteiras de confiança

1. navegador do usuário;
2. Next.js/Vercel;
3. Supabase Auth/API/Postgres/Storage/Realtime;
4. serviços externos futuros;
5. ferramentas administrativas.

Tudo que vem do navegador é não confiável, inclusive `role`, ids, flags de permissão, nomes de arquivo e dados de formulário.

## Ameaças prioritárias e controles

### Acesso a dados de outro usuário

Controles: RLS, grants mínimos, policies por `auth.uid()`, testes de autorização e nenhuma confiança em `localStorage`.

### Escalada para administrador

Controles: admin fora de `profiles`; `admin_memberships` sem grants para cliente; usuário não consegue selecionar `admin` no cadastro.

### Exposição acidental de dados pessoais

Controles: `profiles` contém somente dados destinados ao diretório; conformidade fica em tabela separada; perfil nasce `private`; mensagens nascem desabilitadas; nenhuma leitura anônima de perfil nesta fase.

### Exposição de menores

Controles: não persistir data de nascimento completa na fundação; guardar somente faixa etária calculada por fluxo confiável; consentimento de responsável não pode ser gravado pelo próprio cliente; novos perfis privados por padrão.

### Roubo/vazamento de segredo

Controles: somente publishable key no cliente; validação que rejeita chave diferente de `sb_publishable_*`; `.env*` ignorado; nenhuma `service_role` no repositório.

### Upload malicioso

Controles: bucket privado; limite de 2 MB; JPEG/PNG/WebP; escrita somente na pasta do próprio `auth.uid()`; futuras validações de conteúdo devem ocorrer antes de tornar arquivos acessíveis em funcionalidades sensíveis.

### XSS/clickjacking/injeção de conteúdo

Controles: React escapando texto por padrão, CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, validação de entrada e proibição de HTML arbitrário sem sanitização.

### Abuso de autenticação/spam

Controles planejados para o PR de Auth: rate limits do Supabase, CAPTCHA quando necessário, confirmação de e-mail, mensagens de erro não enumeráveis e limites de ações sociais.

### Falha de dependência

Controles: `npm audit` no CI, Dependabot e atualização rápida para vulnerabilidades altas/críticas.

## Regras de revisão

Atualizar este threat model sempre que entrar:

- nova tabela;
- novo papel/permissão;
- upload;
- integração externa;
- pagamento;
- IA com dados de usuário;
- analytics/trackers;
- API pública;
- fluxo específico para crianças/adolescentes.
