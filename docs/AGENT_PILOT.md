# Piloto de agentes — somente Envista

## O que foi instalado

- `AGENTS.md`: regras do projeto, compartilhadas pelo Codex e pelo Google Antigravity.
- `.codex/config.toml`: ativa no máximo 3 subagentes paralelos por sessão local.
- `.codex/agents/`: frontend, backend_reviewer e visual_qa para Codex.
- `.agents/agents/envista-visual-qa.md`: QA visual selecionável no Antigravity.
- `.agents/skills/`: visual-regression e feature-delivery, compatíveis com ambos.

Nenhum modelo ou API pago adicional é configurado. Cada ferramenta usa a assinatura/conta com a qual você já está conectado.

## Teste 1 — Codex, sem modificar código

Abra o repositório no Codex (app, extensão ou terminal), com o projeto confiável e uma nova sessão.
Cole:

> Analise a página Social do Envista, sem editar nenhum arquivo. Coordene os subagentes frontend, backend_reviewer e visual_qa em paralelo: (1) mapa dos componentes e CSS; (2) contratos dos dados reais; (3) diferenças entre a referência visual disponível e o código atual. Espere os três terminarem. Entregue um relatório com as 5 correções prioritárias, evidências nos arquivos e o que falta verificar em navegador autenticado. Não crie PR e não faça deploy.

Se não houver screenshot acessível ao agente, forneça a imagem no chat. Não aceite afirmações de equivalência visual sem captura real.

## Teste 2 — Google Antigravity, sem modificar código

1. Abra a mesma pasta do Envista no Antigravity.
2. Confira a customização do workspace `envista-visual-qa` (na lista de agentes ou em `/agents` quando disponível).
3. Selecione esse agente e peça:

> Audite a página /social do Envista usando a skill visual-regression, sem alterar código. Compare a referência aprovada com uma captura real na resolução equivalente. Liste divergências de proporção, tipografia, alinhamento, estados vazios e responsividade. Não afirme fidelidade quando não puder acessar a sessão autenticada.

## Depois do diagnóstico

Escolha uma única divergência de baixa complexidade e abra uma branch separada. Execute `npm ci`, `npm run typecheck`, `npm test`, `npm run build` e testes visuais pertinentes. Só depois proponha um PR, sem merge automático.

## Segurança

- Não compartilhe chaves Supabase, arquivos .env nem cookies de autenticação com agentes.
- Permissões dos subagentes derivam da sessão principal; pedir "não editar" não substitui controles de permissão da ferramenta.
- Use aprovação manual/read-only para o primeiro teste, quando disponível.
- Codex e Antigravity não se convocam automaticamente entre si. Faça as comparações e a integração manualmente neste piloto.
