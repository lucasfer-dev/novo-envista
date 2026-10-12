# Envista como case de portfólio

Este documento orienta uma demonstração técnica de cinco minutos. Ele não substitui testes ou evidências de execução.

## Narrativa

O Envista é uma plataforma web multiárea. O desafio principal não é apenas renderizar telas: é manter identidade, sessão e autorização coerentes quando diferentes perfis acessam os mesmos recursos.

## Demonstração recomendada

1. Mostrar a aplicação publicada.
2. Explicar a separação entre área pública, rotas autenticadas e protótipo Java.
3. Entrar com uma conta real configurada no ambiente.
4. Demonstrar um fluxo de leitura e um fluxo de mutação.
5. Mostrar a migration ou policy responsável pelo isolamento.
6. Executar `npm run typecheck`, `npm test` e `npm run build`.
7. Explicar uma limitação conhecida e o próximo passo de engenharia.

## Perguntas que o autor precisa responder

- Qual é a fonte de verdade da autorização?
- O que impede um usuário de trocar um ID na URL e acessar outro registro?
- O que acontece se a interface for ignorada e a API do Supabase for chamada diretamente?
- Quais mudanças exigem migration?
- Como você investigaria uma falha que só ocorre em produção?
- Qual parte do sistema ainda é dívida técnica?
- Em que pontos a IA ajudou e como o resultado foi validado?

## Matriz de evidências

| Competência | Evidência no repositório | Como validar |
| --- | --- | --- |
| TypeScript/React | `app/`, `components/`, `types/` | typecheck e revisão do diff |
| Banco relacional | `supabase/migrations/` | aplicar migration em ambiente de teste |
| Autorização | policies, funções e triggers | casos positivos e negativos |
| Testes | `tests/` e `e2e/` | executar Vitest e Playwright |
| Segurança | `SECURITY.md` e scan | rodar security scan |
| Operação | runbooks em `docs/operations/` | simular release e rollback |
| Manutenção | commits e PRs | explicar motivação e risco |
| IA aplicada | revisão humana e testes | descrever o que foi aceito, corrigido ou rejeitado |

## Limites da apresentação

Não afirmar que o produto possui escala, usuários, disponibilidade ou integrações funcionais sem evidência verificável. Não apresentar o protótipo Java como backend de produção. Não confundir documentação com teste executado.
