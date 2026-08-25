# Envista Backend — Java 21 + Spring Boot

Backend separado do Next.js. A regra de negócio ficará em Java; Supabase será usado como infraestrutura (PostgreSQL, Auth e Storage).

## Arquitetura
- Spring Boot 3 / Java 21
- Spring Security Resource Server para validar JWT emitido pelo Supabase Auth
- PostgreSQL do Supabase via JDBC
- Flyway para migrations
- Controllers REST para projetos, equipes, social e admin

## Próxima etapa: Supabase
Preencher as variáveis de ambiente em produção e conectar o datasource ao projeto Supabase. Não coloque a `SUPABASE_SERVICE_ROLE_KEY` no frontend.

## Executar
```bash
mvn spring-boot:run
```
