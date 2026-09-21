# Política operacional para menores — Envista

## Regra atual

Até existir um fluxo completo e auditável de responsável legal, contas classificadas como `child` ou `adolescent` permanecem bloqueadas para uso normal do produto quando `guardian_consent_verified_at` estiver vazio.

A regra existe em três camadas:

1. navegação/Server Components;
2. Server Actions;
3. banco/RLS e funções de autorização.

Isso impede que a proteção dependa apenas da interface.

## Padrões obrigatórios

- perfil privado por padrão;
- mensagens desativadas por padrão;
- sem publicidade comportamental;
- sem liberação por flag manual não auditada;
- verificação de responsável deve gerar evento auditável;
- não solicitar documentos do responsável fora de fluxo oficial;
- qualquer novo recurso social deve ser testado com conta de menor não verificada.

## Antes de habilitar fluxo de responsável

É obrigatório definir e implementar:
- vínculo entre conta do menor e conta/identidade do responsável;
- método de verificação proporcional ao risco;
- registro de data, método e responsável pela validação;
- mecanismo de revogação/alteração;
- experiência clara para responsável e menor;
- revisão de privacidade e segurança do novo fluxo.
