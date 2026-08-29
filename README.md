# Envista

Plataforma web para participantes, equipes, projetos, aprendizado e conexão com investidores.

## Arquitetura em produção

O produto publicado hoje é uma aplicação **Next.js 16 + React 19 + TypeScript** conectada diretamente ao **Supabase Auth, PostgreSQL e Storage**. As regras de autorização de dados são reforçadas por RLS, funções e triggers versionadas em `supabase/migrations/`.

O diretório `backend/` contém um protótipo histórico em Java/Spring Boot. Ele **não faz parte do deploy atual, não atende as rotas de produção e não é a fonte de verdade das regras do produto**. Foi mantido apenas como referência para uma possível separação futura de serviços.

A experiência de demonstração usa dados locais e é deliberadamente isolada das rotas autenticadas reais.

Consulte `docs/ARCHITECTURE.md` para os limites entre produção, demo e protótipos.

## Stack ativa

- Next.js 16
- React 19
- TypeScript
- Supabase Auth
- PostgreSQL + Row Level Security
- Supabase Storage
- Vercel

## Desenvolvimento

Instale as dependências e inicie a aplicação:

```bash
npm install
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

## Variáveis de ambiente

Crie `.env.local` a partir de `.env.example` e configure as variáveis do ambiente utilizado.

Credenciais privilegiadas, como `service_role`, senhas de banco e chaves secretas, não devem ser adicionadas ao repositório nem expostas em variáveis `NEXT_PUBLIC_*`.

## Testes e segurança

```bash
npm test
npm run security:scan
```

Pull requests também passam pelo build de produção e pelos fluxos críticos em navegador real.

## Build

```bash
npm run build
```

## Operação e release

Antes de uma abertura pública ou mudança importante, use os runbooks em `docs/operations/`:

- `RELEASE.md` — gates, smoke tests, go/no-go e rollback;
- `BACKUP_RECOVERY.md` — backup, restauração de banco e cuidados com Storage;
- `INCIDENT_RESPONSE.md` — triagem e resposta a incidentes.

## Estrutura principal

- `app/` — rotas e páginas Next.js
- `components/real/` — superfícies persistidas do produto
- `components/demo/` — isolamento da experiência demonstrativa local
- `components/` — componentes compartilhados e shell visual histórico ainda em migração
- `lib/` — autenticação, regras de servidor, integrações e utilitários
- `supabase/` — migrations e configuração autoritativa de dados/RLS
- `data/` — fixtures usadas pela experiência demonstrativa
- `backend/` — protótipo Java/Spring Boot não utilizado em produção
- `docs/` — decisões operacionais, privacidade, segurança e arquitetura

Consulte `SECURITY.md` para as práticas de segurança do projeto.
