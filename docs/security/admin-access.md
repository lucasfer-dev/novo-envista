# Acesso ao painel administrativo

O painel administrativo existe apenas sob `/admin` e não deve ser linkado na navegação normal do produto. Ocultar o link é somente uma medida de descoberta; a segurança real é feita por autorização no servidor e no banco.

## Regra de autorização

- sessão Supabase válida;
- registro correspondente em `public.admin_memberships`;
- RLS e funções administrativas conferem `auth.uid()` no banco;
- nenhuma flag de `localStorage`, query string, role de produto ou edição de HTML concede acesso;
- `admin_memberships` não possui fluxo de autopromoção pelo cliente.

## Provisionamento inicial

A primeira associação administrativa deve ser criada por um processo confiável diretamente no ambiente administrativo do Supabase ou por uma rotina privilegiada fora do navegador. Não adicionar service role ao frontend e não criar endpoint público de bootstrap.

Depois do provisionamento, a conta autenticada pode abrir `/admin`. Contas sem associação são redirecionadas para a tela de acesso negado.

## Escopo de moderação

O painel não concede leitura geral das mensagens privadas. O admin só recebe acesso ao conteúdo de mensagem quando existe uma denúncia associada, conforme as policies de RLS.

## Competições

Somente admins criam e editam competições e inscrevem/desinscrevem equipes. Usuários autenticados comuns podem ler apenas competições publicadas/encerradas e os vínculos de equipe correspondentes.
