import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";

export default function TermsPage() {
  return (
    <AuthShell wide title="Termos de Uso — versão interna" description="Versão internal-2026-08-26-v1. Material de teste do fluxo; não é o texto jurídico final de lançamento.">
      <div className={styles.notice}>O cadastro público permanece desabilitado. Este documento existe para validar versionamento, registro de aceite e experiência de onboarding antes da revisão jurídica final.</div>
      <div className={styles.legal}>
        <h2>1. Uso da plataforma</h2>
        <p>O Envista é uma plataforma de aprendizagem, projetos, equipes e conexão entre participantes e investidores. O uso deve respeitar a lei, os direitos de terceiros e as regras de segurança da plataforma.</p>
        <h2>2. Conta</h2>
        <p>O usuário deve fornecer informações compatíveis com o fluxo de cadastro e proteger suas credenciais. Privilégios administrativos não são escolhidos pelo usuário.</p>
        <h2>3. Conteúdo e convivência</h2>
        <p>Não é permitido publicar conteúdo ilícito, violar direitos de terceiros, tentar acessar dados sem autorização, abusar de funcionalidades sociais ou contornar controles de segurança e proteção etária.</p>
        <h2>4. Segurança e disponibilidade</h2>
        <p>Controles técnicos reduzem riscos, mas nenhum sistema é absolutamente invulnerável. Vulnerabilidades devem ser reportadas de forma responsável pelo canal que será publicado antes do lançamento.</p>
        <h2>5. Mudanças</h2>
        <p>Versões futuras serão identificadas e, quando necessário, apresentadas novamente ao usuário. Esta versão interna será substituída antes do cadastro público.</p>
      </div>
    </AuthShell>
  );
}
