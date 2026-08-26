# Política de Segurança — Envista

## Escopo

Esta política cobre o frontend Next.js, integrações Supabase, banco PostgreSQL, Storage, autenticação, rotas de servidor e automações que tratem dados do Envista.

O runtime suportado a partir da integração Supabase é **Node.js 22 ou superior**.

## Princípios obrigatórios

- negar acesso por padrão;
- RLS em toda tabela exposta pelo Supabase;
- nenhuma chave `service_role`, `sb_secret_*`, senha de banco ou token privado em `NEXT_PUBLIC_*`, código-fonte, logs ou issues;
- dados públicos e dados de conformidade devem permanecer separados;
- coletar somente o dado necessário para uma finalidade definida;
- privilégios administrativos nunca são escolhidos pelo usuário;
- alterações de schema devem ser versionadas em `supabase/migrations`;
- mudanças que afetem autorização devem passar por testes, build e Security Advisor antes do merge;
- dados reais não devem ser copiados para ambientes de teste sem necessidade e proteção equivalente.

## Relato de vulnerabilidade

Não publique credenciais, dados pessoais, provas de conceito com dados reais ou detalhes exploráveis em uma issue pública.

Antes do lançamento com usuários reais, o projeto deve configurar um canal privado de segurança/privacidade e publicar esse contato no Aviso de Privacidade. Quando disponível, prefira o recurso privado de relato de vulnerabilidade do repositório.

Ao relatar, informe de forma mínima:

- componente afetado;
- impacto observado;
- passos suficientes para reprodução sem incluir dados pessoais de terceiros;
- ambiente afetado;
- sugestão de mitigação, se houver.

## Segredos

Chaves publishable do Supabase podem ser usadas no browser, mas não substituem autorização. A proteção de dados depende de Auth + RLS + grants corretos.

Chaves privilegiadas devem existir somente em ambiente de servidor quando houver necessidade concreta. O projeto não deve criar um cliente `service_role` por conveniência.

## Dependências

PRs devem manter `npm audit --omit=dev --audit-level=high` sem vulnerabilidades altas/críticas conhecidas antes do merge, salvo exceção documentada com mitigação e prazo de correção.

## Incidentes

Incidentes com dados pessoais seguem o playbook em `docs/security/incident-response.md`. Não apagar evidências necessárias para investigação e não comunicar conclusões antes de confirmar escopo e impacto.
