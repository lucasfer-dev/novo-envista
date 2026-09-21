# Registro de operações de tratamento — Envista

Este documento é o registro operacional resumido de tratamento de dados do Envista e deve acompanhar mudanças relevantes de produto.

## Controlador e canais

A identificação pública do controlador é configurada por `LEGAL_CONTROLLER_NAME` e `LEGAL_CONTROLLER_DOCUMENT`.
Os canais públicos são configurados por `LEGAL_PRIVACY_EMAIL` e `LEGAL_SUPPORT_EMAIL`.

## Categorias de tratamento

| Operação | Dados principais | Finalidade | Base/justificativa operacional | Retenção orientativa |
| --- | --- | --- | --- | --- |
| Conta e autenticação | e-mail, credenciais, identificador protegido | criar e proteger conta | execução do serviço, segurança e prevenção a fraude | enquanto a conta estiver ativa e períodos legais aplicáveis |
| Perfil | nome, username, bio, localização opcional, instituição | identificação e colaboração | execução do serviço e escolha do titular | enquanto publicado ou até exclusão |
| Conformidade etária | faixa etária, registro de responsável | proteção de menores | obrigação legal e melhor interesse | enquanto necessário à proteção da conta |
| Projetos/equipes | conteúdo, arquivos, autoria, integrantes | colaboração e portfólio | execução do serviço | enquanto mantido pelo usuário/equipe |
| Social/mensagens | posts, comentários, mensagens, bloqueios | comunicação e comunidade | execução do serviço e segurança | conforme conta/conteúdo e necessidades de moderação |
| Moderação | denúncias, decisões e audit log | prevenção de abuso e defesa de direitos | segurança, obrigação legal e exercício de direitos | prazo proporcional ao caso |
| Métricas mínimas | eventos allowlisted e agregações | confiabilidade e melhoria do produto | interesse legítimo avaliado e operação | minimizar e agregar sempre que possível |
| Solicitações LGPD | pedido, histórico e resposta | atender direitos do titular | obrigação legal | prazo necessário para comprovação do atendimento |

## Compartilhamentos

Fornecedores atuais de infraestrutura incluem Supabase e Vercel. Novos operadores devem ser registrados aqui antes de uso em produção.

## Regras

- não usar `user_metadata` como autorização;
- não armazenar CPF/CNPJ cru em perfil público;
- não reutilizar dados de menores para publicidade comportamental;
- aplicar minimização e privacidade por padrão;
- toda nova finalidade incompatível exige revisão jurídica/técnica antes de produção;
- incidentes e solicitações de titulares devem preservar trilha de auditoria.
