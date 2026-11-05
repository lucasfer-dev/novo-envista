# Envista — correções após a auditoria de 05/11/2026

## Alterações implementadas

- A chave administrativa do Supabase e as credenciais de banco da Vercel foram restritas ao ambiente Production, sem copiar ou exibir valores. As chaves públicas continuam disponíveis em Preview.
- O catálogo de competições usa as datas reais de inscrição para corrigir status de oportunidades já vencidas; a API normaliza também retornos do scanner e fallback.
- O endpoint /api/health verifica respostas de Auth e PostgREST, com timeout e sem divulgar dados internos.
- O onboarding usa um único RPC transacional para perfil, faixa etária, confirmações jurídicas e conclusão. A autorização de responsáveis permanece uma etapa separada e não marca contas pendentes como concluídas.
- Foram incluídos testes automatizados para saúde, competições e invariantes de segurança do onboarding.

## Publicação

1. Exigir Security CI, Browser E2E e preview Vercel verdes.
2. Aplicar a migração 20261105160000_complete_onboarding_atomic.sql ANTES de publicar o app.
3. Validar permissões: a função complete_onboarding_atomic(jsonb) não pode ser executada pelo role anon.
4. Validar /api/health com status 200; 503 deve ser tratado como falha real de dependência.
5. Fazer teste real com uma conta controlada em homologação: cadastro, e-mail, onboarding, projeto, equipe, mensagens e perfil investidor. Nunca usar dados pessoais de terceiros ou criar contas de produção sem autorização apropriada.
6. Validar o status de OBM e MOSTRATEC como CLOSED em novembro de 2026.

## Integração GitHub: ainda requer configuração externa

O código depende de GITHUB_APP_ID, GITHUB_APP_SLUG, GITHUB_APP_PRIVATE_KEY_BASE64 e GITHUB_APP_WEBHOOK_SECRET. Esses valores não existem na Vercel e não podem ser inventados. Configurar uma GitHub App de propriedade do responsável pelo Envista e dar apenas as permissões indispensáveis. O webhook recebe eventos em /api/github/webhook.

Após a configuração, validar conexão, sincronização de repositórios, publicação de uma issue de teste, desconexão e assinatura do webhook. Não dar ao Preview a chave SUPABASE_SERVICE_ROLE_KEY de produção; usar Supabase separado para homologação.

## Segurança ainda pendente no painel Supabase e Cloudflare

- Ativar Leaked Password Protection no Supabase Auth.
- Criar e vincular site key e secret Turnstile; verificar o desafio e o bloqueio por senha antes da abertura pública.
- Auditar as RPCs SECURITY DEFINER de confirmação de responsáveis e verificar rate limits e escopo do token.
- Monitorar logs e configurar alarmes para HTTP 5xx e degradação do /api/health.

## Reversão

Se necessário, retornar ao deploy Vercel anterior. O RPC é aditivo e poderá permanecer sem causar alterações automáticas nos dados. Em caso de abuso, revogar EXECUTE do RPC do role authenticated antes do rollback.
