# Gate de Privacidade e LGPD antes de usuários reais

Este checklist é um controle de produto/engenharia e não substitui revisão jurídica.

## Bloqueadores antes de abrir cadastro real

- [ ] definir quem é o controlador dos dados e seus dados de contato;
- [ ] definir canal para exercício de direitos dos titulares;
- [ ] publicar Aviso de Privacidade com linguagem clara e adequada ao público;
- [ ] publicar Termos de Uso e versionar ambos os documentos;
- [ ] registrar aceite da versão aplicável no fluxo de onboarding;
- [ ] mapear bases legais por finalidade, sem usar consentimento como solução genérica;
- [ ] definir retenção e rotina de exclusão/anonimização por categoria;
- [ ] documentar operadores/terceiros e transferências internacionais;
- [ ] decidir e documentar a atuação do encarregado/DPO quando aplicável;
- [ ] implementar acesso, correção, exclusão e demais direitos do titular;
- [ ] implementar fluxo seguro de exclusão de conta;
- [ ] configurar Auth: confirmação de e-mail, rate limits e CAPTCHA quando necessário;
- [ ] revisar logs para impedir vazamento de dados pessoais/tokens;
- [ ] executar Supabase Security Advisor sem findings críticos;
- [ ] executar dependency/security CI sem vulnerabilidade alta/crítica não tratada.

## Crianças e adolescentes — requisito de primeira classe

A LGPD exige melhor interesse de crianças e adolescentes. Para crianças, o art. 14 prevê consentimento específico e em destaque de ao menos um dos pais ou responsável legal, além de transparência sobre dados e uso.

A Lei nº 15.211/2025 (Estatuto Digital da Criança e do Adolescente), vigente desde 17/03/2026, acrescenta deveres específicos para produtos/serviços direcionados ou de acesso provável por crianças e adolescentes.

Antes de habilitar conta real para esse público:

- [ ] definir método proporcional de aferição de idade;
- [ ] evitar guardar data de nascimento completa se uma faixa etária for suficiente;
- [ ] implementar fluxo verificável de responsável legal quando exigido;
- [ ] perfil de menor deve nascer com privacidade elevada;
- [ ] minimizar descoberta, localização e contato por padrão;
- [ ] fornecer explicações em linguagem simples e adequada à idade;
- [ ] revisar mecanismos sociais, mensagens e exposição pública sob a ótica do melhor interesse;
- [ ] avaliar necessidade de Relatório de Impacto à Proteção de Dados (RIPD), especialmente por envolver menores e funcionalidades sociais.

A tabela `account_compliance` foi criada justamente para que o cliente não consiga declarar sozinho faixa etária/consentimento verificado.

## Direitos dos titulares

O produto deve permitir processo claro para:

- confirmação de tratamento;
- acesso;
- correção;
- informação sobre compartilhamentos;
- revogação de consentimento quando essa for a base legal;
- anonimização, bloqueio ou eliminação quando cabível;
- portabilidade quando aplicável;
- oposição e revisão de decisões automatizadas quando aplicável.

## Incidentes

Seguir `docs/security/incident-response.md`. A Resolução CD/ANPD nº 15/2024 disciplina comunicação de incidentes que possam acarretar risco ou dano relevante e prevê prazo geral de 3 dias úteis para comunicação à ANPD e titulares, além de registro de incidentes por pelo menos 5 anos.

## Decisões que precisam de revisão jurídica antes do lançamento

- bases legais definitivas por finalidade;
- texto final de Aviso de Privacidade e Termos;
- política de retenção;
- fluxo de menores e consentimento de responsável;
- transferência internacional de dados;
- papel do Envista, escolas e parceiros como controlador/operador em cada cenário;
- critérios e procedimento para solicitações de titulares.
