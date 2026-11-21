---
name: visual-regression
description: Compara uma interface do Envista com uma imagem de referência aprovada, verificando screenshots reais, comportamento responsivo e estados de uso. Use em auditorias UI/UX e revisões de PR.
---

# Auditoria visual do Envista

1. Localize a referência aprovada e a rota exata. Sem referência, solicite/registre o impedimento em vez de inventar a aparência.
2. Identifique se a tela exige autenticação e dados reais. Não assuma que uma fixture reproduz o resultado final.
3. Abra a aplicação no navegador disponível com autorização e capture screenshots em viewport equivalente à referência. Adicione desktop (1440×900) e mobile (390×844) se pertinente.
4. Compare quantitativamente onde possível: posição e largura do conteúdo, sidebar, colunas, altura dos cards, crops, fontes, espaçamento, overflow e cores.
5. Teste estados: carregamento, vazio, erro, com conteúdo e interações existentes (sem modificar dados de produção por engano).
6. Reporte tabela curta: problema | evidência | impacto | recomendação.
7. Critério de aprovação: nenhuma divergência crítica; testes relevantes aprovados; capturas verificáveis. Se alguma etapa não foi possível, declare a verificação incompleta.

Nunca informe "pixel-perfect" apenas com base em código, testes estáticos ou screenshots de uma página simulada.
