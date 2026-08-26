# Resposta a Incidentes de Segurança

Este documento é um playbook operacional. Ele não substitui avaliação jurídica quando houver incidente real.

## 1. Detectar e preservar

- registrar data/hora em que o incidente foi conhecido;
- preservar logs e evidências relevantes sem copiar dados pessoais além do necessário;
- identificar ambiente, contas, tabelas, arquivos e integrações possivelmente afetados;
- evitar alterações destrutivas antes de preservar evidências mínimas.

## 2. Conter

Conforme o caso:

- revogar/rotacionar credenciais comprometidas;
- encerrar sessões suspeitas;
- desabilitar temporariamente uma rota, integração ou recurso vulnerável;
- restringir policies/grants de banco;
- bloquear uploads ou ações abusadas;
- corrigir a origem antes de restaurar acesso normal.

## 3. Avaliar impacto

Registrar:

- categorias de dados afetadas;
- número aproximado de titulares e registros;
- presença de dados de autenticação, dados sensíveis ou dados de crianças/adolescentes;
- possibilidade de acesso, alteração, perda ou divulgação;
- duração e alcance do incidente;
- medidas já tomadas.

## 4. Comunicação e LGPD

A Resolução CD/ANPD nº 15/2024 exige comunicação à ANPD e aos titulares quando o incidente puder acarretar risco ou dano relevante. O prazo geral indicado pela ANPD é de **3 dias úteis** a partir do conhecimento do incidente, ressalvada legislação específica.

Não presumir automaticamente que todo erro é comunicável nem atrasar uma comunicação necessária. A avaliação deve ser documentada.

Quando a informação ainda estiver incompleta, seguir o procedimento de comunicação preliminar/complementar previsto pela ANPD.

## 5. Registro

Manter registro dos incidentes de segurança com dados pessoais pelo período exigido pela regulamentação aplicável. A Resolução CD/ANPD nº 15/2024 prevê guarda do registro por pelo menos **5 anos**.

O registro interno deve conter, no mínimo:

- data do conhecimento;
- descrição do evento;
- dados/categorias afetadas;
- titulares potencialmente afetados;
- avaliação de risco/dano;
- medidas técnicas e administrativas;
- decisão sobre comunicação e justificativa;
- datas das comunicações realizadas;
- ações corretivas e responsáveis.

## 6. Pós-incidente

- corrigir a causa raiz;
- revisar RLS, grants, logs e credenciais;
- adicionar teste que impeça regressão quando possível;
- revisar retenção e minimização de dados;
- executar Supabase Security Advisor;
- registrar aprendizado e prazo para pendências.

## Referências oficiais

- LGPD — Lei nº 13.709/2018, art. 48.
- Resolução CD/ANPD nº 15/2024 — Regulamento de Comunicação de Incidente de Segurança.
- Canal de Comunicação de Incidente de Segurança da ANPD.
