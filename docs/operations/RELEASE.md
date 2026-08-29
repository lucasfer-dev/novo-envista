# Checklist de release

Use este documento para qualquer promoção relevante para produção. Ele separa gates automáticos de verificações que dependem do Dashboard, de decisão humana ou de revisão jurídica.

## 1. Código

Obrigatório antes do merge final:

- Security CI verde: secret scan, testes, build e audit de dependências de produção.
- Browser E2E verde: entrada demo Participante/Investidor, isolamento de papéis e fluxos críticos.
- Nenhuma migration já aplicada foi reescrita; correções entram como migration nova.
- PR revisado quanto a dados privados, permissões, limites e comportamento de erro.
- `main` contém somente a arquitetura de produção documentada em `docs/ARCHITECTURE.md`.

## 2. Supabase

Antes de abrir para usuários reais:

- Security Advisor revisado e sem aviso privilegiado que não tenha justificativa explícita.
- Performance Advisor revisado para regressões importantes nas consultas do release.
- RLS habilitado nas tabelas expostas e policies testadas.
- Backups conferidos em **Database > Backups**; consulte `BACKUP_RECOVERY.md`.
- Auth > Email: mínimo de senha adequado e **leaked password protection** habilitado quando o plano permitir. O Supabase informa que essa proteção usa a base Pwned Passwords/Have I Been Pwned e está disponível no plano Pro ou superior.
- Confirmação de e-mail, SMTP e rate limits de Auth revisados para o volume esperado.
- CAPTCHA deve ser considerado/ativado para signup, login e recuperação antes de campanha pública com risco de bot/spam.
- Site URL e redirect URLs apontam apenas para origens esperadas.

Referências:

- https://supabase.com/docs/guides/deployment/going-into-prod
- https://supabase.com/docs/guides/auth/password-security

## 3. Legal e privacidade

**Bloqueador de lançamento público:** o onboarding atual identifica Termos de Uso e Aviso de Privacidade como versões internas de teste. Eles não devem ser apresentados como documentos finais até serem substituídos por versões aprovadas para o uso real do produto.

Antes do lançamento:

- publicar versões finais/revisadas de Termos e Privacidade;
- versionar os documentos/eventos jurídicos esperados pelo backend;
- validar linguagem e fluxo aplicável a usuários menores de idade e responsável legal;
- confirmar canal de contato e processo para solicitações de privacidade;
- testar exportação/correção/exclusão de conta ponta a ponta.

Esta revisão exige decisão humana/jurídica; não deve ser “resolvida” apenas alterando um texto no código.

## 4. Vercel

Depois do merge:

1. Aguarde o deployment de produção ficar `READY`.
2. Abra `/api/health` e confirme `200`/estado saudável.
3. Faça smoke test no domínio de produção:
   - landing/login;
   - criação/login de conta de teste apropriada;
   - Participante: Home, Social, Explorar, Projetos, Equipes, Competições, Aprender, Mensagens;
   - Investidor: Home, Explorar, Salvos, Seguindo, Interesse e Mensagens;
   - Admin com conta autorizada: dashboard, moderação, privacidade e analytics;
   - mobile em viewport estreita.
4. Confira logs estruturados e ausência de rajada de erros 5xx.

## 5. Rollback

### Código sem migration destrutiva

- Promova/reimplante o último deployment Vercel conhecido como saudável.
- Confirme `/api/health` e os smoke tests críticos.

### Código com migration compatível

Em geral prefira rollback do código apenas quando o schema novo continuar compatível com a versão anterior. Se não for compatível, produza uma correção forward coordenada.

### Erro de dados/schema

Não tente “desaplicar” migrations alterando arquivos históricos. Crie migration corretiva ou siga o runbook de recuperação se houver perda/corrupção de dados.

## 6. Go / No-Go

Só marque **GO** quando todos os itens técnicos automatizáveis estiverem verdes e todos os bloqueadores manuais aplicáveis tiverem responsável e confirmação.

No estado atual do projeto, a proteção de senha vazada depende de configuração do Auth no Dashboard/plano e os documentos jurídicos ainda são explicitamente internos. Portanto esses itens devem permanecer visíveis como pendências reais até serem confirmados, em vez de serem escondidos pelo checklist.
