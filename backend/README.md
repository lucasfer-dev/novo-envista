# Envista Backend — protótipo Java/Spring Boot

> **Status:** referência histórica / não utilizado em produção.

O Envista publicado atualmente roda no Next.js e acessa Supabase Auth, PostgreSQL e Storage pelas camadas de servidor e políticas RLS versionadas no repositório. Este diretório não é iniciado pelo deploy da Vercel, não atende as rotas atuais do produto e não deve receber regras de negócio que existam apenas aqui.

## Por que este diretório foi mantido

Ele registra uma arquitetura avaliada anteriormente para separar um backend Java 21 + Spring Boot. Pode voltar a ser útil caso o produto precise de um serviço dedicado, mas qualquer reativação deve ser tratada como uma migração arquitetural explícita, com integração, autenticação, observabilidade, CI e plano de transição próprios.

## Stack do protótipo

- Java 21
- Spring Boot 3
- Spring Security Resource Server
- PostgreSQL via JDBC
- Flyway

## Execução local do protótipo

```bash
mvn spring-boot:run
```

Executar este serviço localmente não substitui nem altera o backend efetivo do produto atual.

Consulte `../docs/ARCHITECTURE.md` para a arquitetura vigente.
