# Política operacional para menores — Envista

## Regra atual

O Envista diferencia acesso ao núcleo do produto de funcionalidades sociais protegidas.

- contas `child` continuam exigindo confirmação de responsável antes do acesso normal ao produto;
- contas `adolescent` com `guardian_required = true` podem confirmar um responsável imediatamente ou iniciar o modo protegido;
- adolescentes em modo protegido podem concluir o onboarding e usar o núcleo do Envista, mantendo perfil privado e mensagens desativadas;
- Social e Mensagens exigem confirmação de responsável enquanto `guardian_required = true`;
- adolescentes para os quais `guardian_required = false` e adultos seguem o fluxo normal.

Para novos cadastros, `guardian_required` é derivado da idade exata durante o signup, antes de a data de nascimento ser descartada. A data completa não é persistida.

## Camadas de proteção

A regra não depende apenas da interface. Ela existe em:

1. navegação e Server Components;
2. Server Actions;
3. banco de dados, RLS e funções de autorização.

`private.has_product_access()` controla o núcleo do produto e `private.has_social_access()` controla superfícies sociais sensíveis.

## Confirmação de responsável

O responsável não recebe um perfil social no Envista. O fluxo usa uma solicitação separada de confirmação:

- nome e vínculo declarados;
- CPF validado e armazenado somente por representação protegida;
- token de confirmação aleatório, armazenado apenas por hash;
- expiração do link;
- declaração versionada;
- registro auditável de confirmação.

O CPF bruto do responsável e o token bruto não são persistidos na tabela de solicitações.

## Padrões obrigatórios

- perfil privado por padrão para conta protegida;
- mensagens desativadas enquanto a confirmação aplicável estiver pendente;
- sem publicidade comportamental para menores;
- sem liberação por flag manual não auditada;
- confirmação de responsável deve gerar evento auditável;
- não solicitar documentos fora do fluxo oficial;
- novos recursos sociais devem verificar `private.has_social_access()` ou proteção equivalente no servidor/banco;
- o frontend nunca é a única camada de bloqueio.

## Evolução do fluxo

Mudanças no método de verificação do responsável devem preservar:

- minimização de dados;
- prova auditável do evento;
- expiração e uso único de credenciais de confirmação;
- revogação/alteração do vínculo quando implementada;
- revisão de privacidade e segurança antes de ampliar superfícies sociais.
