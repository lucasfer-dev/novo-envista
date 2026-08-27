# Envista

Plataforma web para participantes, equipes, projetos, aprendizado e conexão com investidores.

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase Auth/Postgres
- Java 21 e Spring Boot no serviço `backend/`

## Desenvolvimento

Instale as dependências e inicie o frontend:

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

## Build

```bash
npm run build
```

## Backend Java

```bash
cd backend
mvn spring-boot:run
```

## Estrutura principal

- `app/` — rotas e páginas Next.js
- `components/` — componentes e interface do produto
- `lib/` — autenticação, integrações e utilitários
- `data/` — dados usados pela experiência do produto
- `backend/` — serviço Java/Spring Boot
- `supabase/` — migrations e configuração do banco

Consulte `SECURITY.md` para as práticas de segurança do projeto.
