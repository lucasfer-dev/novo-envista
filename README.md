# Envista

Plataforma web para participantes, equipes, projetos, aprendizado e conexão com investidores.

> Este repositório é apresentado como um case de engenharia full stack. A documentação separa explicitamente o caminho de produção, superfícies históricas e protótipos para que nenhuma funcionalidade seja considerada existente apenas por estar descrita no README.

[Aplicação publicada](https://novo-envista.vercel.app/) · [Arquitetura](docs/ARCHITECTURE.md) · [Política de segurança](SECURITY.md)

## O problema

O Envista organiza diferentes perfis e fluxos de uma plataforma de inovação em uma aplicação única:

- participantes acompanham projetos, aprendizado e conexões;
- equipes organizam iniciativas e colaboração;
- investidores visualizam informações autorizadas;
- o sistema precisa manter isolamento de dados entre usuários e perfis.

O objetivo técnico é manter uma experiência web simples sem transferir a responsabilidade de segurança para o frontend.

## O que está comprovado no repositório

- Aplicação Next.js com React e TypeScript.
- Autenticação real via Supabase Auth.
- PostgreSQL com migrations versionadas.
- Autorização de dados reforçada por Row Level Security, funções e triggers.
- Supabase Storage para arquivos.
- Organização por rotas, componentes, serviços, utilitários e tipos.
- Testes unitários, fluxos E2E e verificações de segurança configuradas no projeto.
- Build de produção e deploy na Vercel.
- Pull requests públicos com evolução incremental do produto.

## Arquitetura em produção

```text
Browser
  │
  ▼
Next.js App Router
  ├── Server Components / Server Actions
  ├── autenticação e sessão
  ├── regras de mutação
  └── componentes React/TypeScript
        │
        ├── Supabase Auth
        ├── PostgreSQL + RLS + functions + triggers
        └── Supabase Storage

Deploy: Vercel
```

A fonte autoritativa de autorização é o banco, por meio das policies e objetos versionados em `supabase/migrations/`. O frontend não deve ser tratado como uma barreira de segurança.

O diretório `backend/` contém um protótipo histórico em Java/Spring Boot. Ele não participa do deploy atual, não atende as rotas de produção e não é a fonte de verdade das regras do produto. Ele permanece documentado para evitar confusão arquitetural.

## Fluxos principais para demonstração

Ao apresentar o projeto, valide estes fluxos em uma instância configurada:

1. autenticar um usuário real;
2. acessar uma área protegida conforme o papel do usuário;
3. criar ou atualizar uma entidade permitida;
4. confirmar que um usuário sem autorização não consegue acessar dados de outro;
5. executar os testes e o build de produção.

As telas públicas históricas e fixtures em `data/` não representam uma sessão real nem substituem o caminho persistido.

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase Auth
- PostgreSQL
- Row Level Security
- Supabase Storage
- Vitest
- Playwright
- Vercel

## Desenvolvimento local

Requisitos: Node.js 22.x.

```bash
npm install
npm run dev
```

A aplicação fica disponível em [http://localhost:3000](http://localhost:3000).

Crie `.env.local` a partir de `.env.example`. Nunca coloque `service_role`, senhas de banco ou tokens privados em variáveis `NEXT_PUBLIC_*`.

## Verificação local

```bash
npm run typecheck
npm test
npm run security:scan
npm run build
```

Os comandos acima verificam, respectivamente, tipagem, testes, regras de segurança e build de produção. Os fluxos de navegador e os checks de pull request devem ser considerados a validação final dos caminhos críticos.

## Operação e release

Antes de uma abertura pública ou mudança importante, use os runbooks:

- [Release](docs/operations/RELEASE.md): gates, smoke tests, go/no-go e rollback;
- [Backup e recuperação](docs/operations/BACKUP_RECOVERY.md): banco e Storage;
- [Resposta a incidentes](docs/operations/INCIDENT_RESPONSE.md): triagem e contenção.

## Estrutura

- `app/`: rotas e páginas Next.js;
- `components/`: componentes compartilhados e superfícies em migração;
- `lib/`: autenticação, regras de servidor, integrações e utilitários;
- `services/`: integrações e serviços de domínio;
- `supabase/`: migrations e configuração autoritativa de dados/RLS;
- `tests/` e `e2e/`: verificações automatizadas;
- `types/`: contratos TypeScript;
- `docs/`: arquitetura, segurança e operação;
- `backend/`: protótipo Java não produtivo.

## Limitações conhecidas

Este projeto ainda possui superfícies históricas em migração. Por isso, uma funcionalidade só deve ser considerada pronta quando estiver no caminho persistido, protegida por autorização, coberta por testes relevantes e validada em build/deploy.

O projeto não declara métricas de usuários, disponibilidade ou escala que não estejam instrumentadas e verificadas.

## Uso de IA no desenvolvimento

IA pode ser utilizada para acelerar implementação, mas cada mudança deve ser revisada com:

- requisito e comportamento esperado;
- análise de autorização e dados;
- testes positivos e negativos;
- typecheck, build e validação E2E;
- revisão do diff e das consequências de manutenção.

O critério de aceitação é o comportamento verificável do sistema, não a quantidade de código gerado.

## Licença e segurança

Consulte [SECURITY.md](SECURITY.md) para práticas de segurança e relato responsável de vulnerabilidades.
