# Envista — Recuperação do login por documento nas contas antigas

## Diagnóstico
A auditoria de 05/11/2026 identificou sete contas históricas sem registro
em account_private_identifiers; seis já concluíram o onboarding. Elas podem
continuar entrando por e-mail, mas o login por CPF/CNPJ não localiza o vínculo.
Não inventar nem inferir CPF/CNPJ dos usuários.

## Implantação segura
1. Verificar Security CI e Browser E2E verdes no PR.
2. Confirmar que SUPABASE_SERVICE_ROLE_KEY está somente no servidor Vercel e
   corresponde ao projeto definido em NEXT_PUBLIC_SUPABASE_URL. Não expor o valor.
3. Aplicar primeiro 20261105030000_legacy_document_linking.sql no Supabase.
   A migração adiciona RPCs e permissões; não altera contas existentes.
4. Verificar EXECUTE de has_my_login_document apenas para authenticated e
   de link_legacy_login_document apenas para service_role.
5. Publicar o aplicativo testado e acompanhar erros de login/segurança.
6. Com uma conta de teste controlada sem vínculo, entrar por e-mail,
   vincular documento próprio em Conta > Login e segurança, sair e entrar
   com CPF/CNPJ. Não usar documentos de terceiros.
7. Testar senha incorreta, CPF/CNPJ inválido, documento já em outra conta,
   throttling, captcha, logout, menores de idade e recuperação de senha.
8. Acompanhar somente contagens e classes de erro, sem dados pessoais.

## Reversão
Reverter deploy do aplicativo, se necessário. As RPCs são aditivas.
Se for necessário suspender vinculações, revogar EXECUTE em
link_legacy_login_document de service_role antes do rollback.
Não excluir vínculos válidos já confirmados pelos próprios titulares.

## Pendências manuais
- Habilitar Leaked Password Protection no painel do Supabase Auth.
- Verificar SMTP, templates, allowlist de redirects e configuração Turnstile.
- Melhorar observabilidade e retenção de logs (sem tokens, senhas ou documentos).
- Criar E2E real de cadastro e login em ambiente separado de homologação.
