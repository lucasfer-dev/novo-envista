# Resposta a incidentes

Runbook curto para indisponibilidade, erro de autorização, abuso, vazamento de credencial ou perda de dados no Envista.

## Prioridade

1. Proteger usuários e impedir ampliação do dano.
2. Preservar evidências operacionais úteis sem copiar conteúdo privado desnecessariamente.
3. Restaurar a função essencial do produto.
4. Corrigir a causa e registrar ações preventivas.

## Classificação inicial

### SEV-1

- acesso indevido a dados privados;
- credencial privilegiada exposta/comprometida;
- perda/corrupção ampla de dados;
- indisponibilidade generalizada sem alternativa.

### SEV-2

- função crítica quebrada para parte relevante dos usuários;
- scanner/integração degradado sem vazamento de dados;
- fila de mensagens, uploads ou Auth com falha ampla.

### SEV-3

- erro localizado, visual ou com workaround seguro.

## Primeiros passos

- Registre horário, impacto percebido, primeiro sinal e release/deployment atual.
- Consulte `/api/health`, Vercel runtime logs e eventos estruturados por `request_id`.
- Verifique Supabase Database/Auth/Storage conforme o componente afetado.
- Não publique tokens, cookies, dumps, e-mails, conteúdo de mensagens ou dados de menores em issues/logs públicos.
- Se uma credencial privilegiada puder ter vazado, revogue/rotacione a credencial pelo provedor correspondente e depois corrija a origem do vazamento.

## Autorização/RLS

Se houver suspeita de acesso entre contas:

1. Trate como SEV-1 até provar o contrário.
2. Identifique tabela/RPC/policy e papel afetados.
3. Se necessário, desabilite temporariamente a superfície vulnerável no app sem remover RLS.
4. Crie uma migration corretiva; não edite migration histórica aplicada.
5. Reexecute testes de isolamento de usuário/papel e Security Advisor.
6. Avalie alcance por logs/metadados mínimos disponíveis.

## Auth

Para rajada de login/signup/reset:

- confira rate limits e logs do Supabase Auth;
- mantenha os limites de aplicação/banco já existentes;
- avalie CAPTCHA e SMTP/rate limits antes de relaxar proteção;
- não desative confirmação/verificações de segurança apenas para “fazer voltar”.

## Banco de dados

Para migration ruim ou perda de dados, siga `BACKUP_RECOVERY.md`. Prefira correção forward quando não houve perda ampla. Restauração é uma operação de maior impacto e pode envolver downtime.

## Storage

Lembre que backup do PostgreSQL não restaura bytes apagados do Storage. Preserve metadados e use a cópia externa/versionada definida pela política de backup da equipe.

## Scanner de competições

O scanner possui fallback e logs estruturados. Se fontes externas falharem:

- diferencie falha da fonte oficial, falha do scanner e falha do fallback;
- não classifique informação antiga como inscrição aberta só para evitar tela vazia;
- prefira estado degradado/indeterminado a uma afirmação incorreta.

## Encerramento

Antes de fechar o incidente:

- causa identificada;
- impacto e janela temporal registrados;
- correção implantada e validada;
- dados/Storage conferidos quando aplicável;
- alertas/testes/runbooks atualizados para evitar repetição;
- necessidade de comunicação aos usuários ou responsáveis avaliada pela equipe adequada.

O post-mortem deve focar em sistema, sinais e barreiras que faltaram, não em encontrar um culpado individual.
