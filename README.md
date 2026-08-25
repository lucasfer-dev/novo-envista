# Envista Platform

Base do produto Envista com frontend Next.js/React e backend Java/Spring Boot.

## O que mudou nesta versão
- `Projetos` → `Meus Projetos`; `Equipes` → `Minhas equipes`.
- exclusão de projeto/equipe para conteúdos próprios;
- curtidas em projetos e `Seguir` no lugar de `Acompanhar`;
- não permite salvar/seguir o próprio projeto na tela de detalhe;
- status Participante/Investidor visível no perfil e navegação;
- Configurações;
- onboarding participante com cidade/estado obrigatórios;
- onboarding investidor com tipo de organização e cargo opcional;
- área de investidor com Explorar, Projetos, Equipes e Competições;
- nova área Social com posts por indivíduo ou equipe e seguir pessoas;
- acesso e painel administrativo para aulas, métricas e moderação;
- atalho `Ctrl K` removido (busca continua acessível pelo botão);
- backend Java 21 + Spring Boot criado em `/backend`;
- migrations iniciais PostgreSQL/Flyway e estrutura pronta para Supabase Auth/Postgres/Storage.

## Frontend
```bash
npm install
npm run dev
```

## Backend Java
```bash
cd backend
mvn spring-boot:run
```

## Supabase
A próxima etapa é preencher as credenciais reais e aplicar as migrations ao projeto Supabase. O frontend nunca deve receber `SUPABASE_SERVICE_ROLE_KEY`.

Consulte `.env.example` e `backend/README.md`.


## Build

```bash
npm install
npm run build
```

O frontend usa TypeScript em modo `strict`. O tipo das threads de mensagens foi explicitado para evitar `implicit any` durante o build de produção.

