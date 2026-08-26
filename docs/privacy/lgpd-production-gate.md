# Gate de Privacidade e LGPD antes de usuários reais

Este checklist é um controle de produto/engenharia e não substitui revisão jurídica. A existência de controles técnicos, RLS, rate limiting ou documentos provisórios não deve ser interpretada como declaração de conformidade jurídica.

## Situação do ambiente de teste

O cadastro foi habilitado para testes reais, mas o gate de lançamento público amplo **continua incompleto**. Enquanto os itens jurídicos/operacionais abaixo estiverem pendentes, o ambiente deve ser tratado como beta/teste controlado e não como produto juridicamente pronto para escala.

Já implementado na camada técnica:

- [x] RLS e menor privilégio nas tabelas públicas;
- [x] perfil novo privado e mensagens desabilitadas por padrão;
- [x] exportação de dados e fila de solicitações de privacidade;
- [x] Security Advisor sem findings conhecidos na última auditoria;
- [x] Security CI com testes, build, dependency audit e secret scan;
- [x] rate limiting de aplicação e quotas atômicas no banco para superfícies de abuso;
- [x] headers de segurança, limitação de payload e validação de origem para requisições inseguras.

## Bloqueadores antes de lançamento público amplo

- [ ] definir quem é o controlador dos dados e seus dados de contato;
- [ ] definir canal oficial para exercício de direitos dos titulares;
- [ ] publicar Aviso de Privacidade final com linguagem clara e adequada ao público;
- [ ] publicar Termos de Uso finais e versionar ambos os documentos;
- [ ] registrar aceite dos Termos e ciência/apresentação da versão do Aviso de Privacidade por fluxo confiável;
- [ ] mapear bases legais por finalidade, sem usar consentimento como solução genérica;
- [ ] quando consentimento for de fato a base legal, criar registro específico, livre, informado, inequívoco e revogável;
- [ ] definir retenção e rotina de exclusão/anonimização por categoria;
- [ ] documentar operadores/terceiros e transferências internacionais;
- [ ] decidir e documentar a atuação do encarregado/DPO quando aplicável;
- [ ] concluir fluxo seguro de exclusão de conta e processo operacional de atendimento de direitos;
- [ ] revisar/configurar limites nativos do Supabase Auth e CAPTCHA/Bot protection conforme risco real;
- [ ] configurar SMTP próprio, templates e URLs de e-mail para produção;
- [ ] revisar logs para impedir vazamento de dados pessoais, tokens ou conteúdo privado;
- [ ] executar dependency/security CI sem vulnerabilidade alta/crítica não tratada antes de cada release relevante;
- [ ] avaliar e documentar a necessidade/obrigação concreta de Relatório de Impacto à Proteção de Dados (RIPD) e relatórios de risco aplicáveis.

## Crianças e adolescentes — requisito de primeira classe

A LGPD exige que o melhor interesse de crianças e adolescentes prevaleça no tratamento de seus dados. A Lei nº 15.211/2025 (Estatuto Digital da Criança e do Adolescente) está em vigor desde 17/03/2026 e alcança produtos ou serviços digitais direcionados a esse público ou de acesso provável por ele. Entre outras obrigações, prevê proteção por padrão, gerenciamento de riscos, mecanismos adequados à idade e salvaguardas de supervisão parental.

Antes de abrir o produto em escala para esse público:

- [ ] definir método proporcional e juridicamente revisado de aferição de idade;
- [x] impedir exposição pública enquanto a faixa etária estiver `unknown` no banco;
- [x] evitar persistir data de nascimento completa na fundação atual;
- [ ] implementar fluxo verificável de responsável/supervisão parental quando exigido pelo caso de uso e pela legislação aplicável;
- [x] perfil novo nasce com privacidade elevada e mensagens desligadas;
- [ ] revisar localização, escola e demais campos públicos por faixa etária;
- [ ] fornecer explicações e controles em linguagem simples e adequada à idade;
- [ ] revisar mecanismos sociais, mensagens, denúncias, bloqueio e exposição pública sob a ótica do melhor interesse;
- [ ] definir a política final para contas de adolescentes antes de permitir exposição/mensagens em escala;
- [ ] documentar avaliação de riscos específica de crianças/adolescentes e a decisão/obrigação de relatório de impacto;
- [ ] avaliar formalmente se o Envista se enquadra no conceito legal de rede social da Lei nº 15.211/2025;
- [ ] se houver enquadramento como rede social, implementar o vínculo exigido pelo art. 24 para contas de crianças e adolescentes de até 16 anos com conta de responsável legal;
- [ ] substituir a faixa ampla `adolescent` por mecanismo que permita cumprir o corte jurídico aplicável sem coletar dados além do necessário; hoje o sistema não distingue 16 de 17 anos;
- [ ] implementar mecanismo público e acessível para notificação de violações de direitos de crianças/adolescentes, com processo de análise, retirada quando cabível, comunicação e recurso, conforme requisitos legais aplicáveis;
- [ ] definir procedimento contra uso abusivo dos instrumentos de denúncia, incluindo critérios, notificação, recurso, sanções proporcionais e registro dos casos quando exigido.

A tabela `account_compliance` separa a faixa etária do perfil público e impede que a aplicação trate a idade como simples preferência visual. Hoje, contas novas começam privadas e sem mensagens. Isso é uma salvaguarda técnica, mas **não resolve sozinho** o requisito de vínculo com responsável para usuários de até 16 anos caso o produto seja enquadrado como rede social, nem substitui aferição etária proporcional.

## Direitos dos titulares

O produto e a operação devem suportar processo claro para:

- confirmação de tratamento;
- acesso;
- correção;
- informação sobre compartilhamentos;
- revogação de consentimento quando essa for a base legal;
- anonimização, bloqueio ou eliminação quando cabível;
- portabilidade quando aplicável;
- oposição e revisão de decisões automatizadas quando aplicável.

A interface já registra solicitações, mas isso não substitui um canal oficial, responsáveis internos, prazos e procedimento documentado de atendimento.

## Incidentes

Seguir `docs/security/incident-response.md`. A Resolução CD/ANPD nº 15/2024 disciplina comunicação de incidentes que possam acarretar risco ou dano relevante. A análise de obrigação, prazo e conteúdo da comunicação deve fazer parte da resposta a incidentes, com apoio jurídico/DPO quando necessário.

## Decisões que precisam de revisão jurídica antes do lançamento

- bases legais definitivas por finalidade;
- texto final de Aviso de Privacidade e Termos;
- identidade e papel do controlador, operadores e parceiros;
- política de retenção e descarte;
- fluxo de menores, aferição etária e supervisão/responsável;
- enquadramento ou não do Envista como rede social para fins da Lei nº 15.211/2025;
- procedimento de notificação, moderação, retirada e recurso relacionado a violações de direitos de crianças/adolescentes;
- transferência internacional de dados;
- papel do Envista, escolas e parceiros como controlador/operador em cada cenário;
- critérios e procedimento para solicitações de titulares;
- política de moderação e resposta a conteúdo/conduta denunciada;
- necessidade, escopo e versão publicável de RIPD/relatórios de risco aplicáveis.
