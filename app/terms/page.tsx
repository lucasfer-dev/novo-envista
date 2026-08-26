import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";

export default function TermsPage() {
  return (
    <AuthShell
      wide
      title="Termos de Uso — versão beta"
      description="Versão internal-2026-08-26-v2. Material provisório para testes controlados; não é o texto jurídico final de lançamento público."
    >
      <div className={styles.notice}>
        O cadastro está habilitado em modo beta para validação do produto. Estes Termos ainda passarão por revisão jurídica e poderão ser substituídos; contas existentes poderão ser solicitadas a aceitar uma versão final antes do lançamento público amplo.
      </div>
      <div className={styles.legal}>
        <h2>1. Uso da plataforma</h2>
        <p>O Envista é uma plataforma de aprendizagem, projetos, equipes e conexão entre participantes e investidores. O uso deve respeitar a lei, os direitos de terceiros e as regras de segurança da plataforma.</p>
        <h2>2. Conta</h2>
        <p>O usuário deve fornecer informações verdadeiras dentro do fluxo solicitado, manter suas credenciais protegidas e não tentar obter privilégios que não lhe foram atribuídos. Privilégios administrativos não são escolhidos pelo usuário.</p>
        <h2>3. Conteúdo e convivência</h2>
        <p>Não é permitido publicar conteúdo ilícito, violar direitos de terceiros, assediar outros usuários, tentar acessar dados sem autorização, abusar de denúncias, automatizar spam ou contornar controles de segurança e proteção etária.</p>
        <h2>4. Segurança e moderação</h2>
        <p>O Envista utiliza controles técnicos para reduzir abuso e acesso indevido, incluindo limites de requisição, autorização por função e mecanismos de denúncia/bloqueio. Controles técnicos reduzem riscos, mas nenhum sistema é absolutamente invulnerável.</p>
        <h2>5. Contas de crianças e adolescentes</h2>
        <p>O produto está em revisão específica para as exigências aplicáveis a crianças e adolescentes. Durante o beta, funcionalidades podem ser restringidas conforme faixa etária e decisões de segurança. A versão de lançamento deverá incorporar os fluxos de aferição etária, supervisão/responsável e proteção por padrão definidos para o produto.</p>
        <h2>6. Fase beta</h2>
        <p>Este ambiente é destinado à validação controlada do produto. Funcionalidades, regras e documentos podem mudar antes do lançamento público amplo. Dados desnecessários, sensíveis ou pertencentes a terceiros não devem ser inseridos apenas para fins de teste.</p>
        <h2>7. Mudanças</h2>
        <p>Versões futuras serão identificadas e, quando necessário, apresentadas novamente ao usuário. A versão jurídica final deverá ser publicada antes do lançamento público amplo.</p>
      </div>
    </AuthShell>
  );
}
