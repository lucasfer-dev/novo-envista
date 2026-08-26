import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";

export default function PrivacyPage() {
  return (
    <AuthShell wide title="Aviso de Privacidade — versão interna" description="Versão internal-2026-08-26-v1. Material de teste; controlador, contatos, bases legais e retenção ainda serão finalizados antes do lançamento público.">
      <div className={styles.notice}>Ler este aviso registra ciência da versão apresentada no fluxo interno. Isso não transforma automaticamente todas as finalidades de tratamento em “consentimento”.</div>
      <div className={styles.legal}>
        <h2>Dados usados nesta etapa</h2>
        <ul>
          <li>e-mail e credenciais tratados pelo Supabase Auth;</li>
          <li>nome de exibição, username e campos opcionais do perfil;</li>
          <li>faixa etária declarada, sem armazenar a data de nascimento completa;</li>
          <li>versão dos documentos apresentada/aceita e horário do evento.</li>
        </ul>
        <h2>Finalidades técnicas iniciais</h2>
        <p>Autenticar a conta, manter sessão, criar o perfil, aplicar controles adequados à faixa etária, registrar versões jurídicas e proteger o acesso aos dados.</p>
        <h2>Privacidade por padrão</h2>
        <p>Perfis novos começam privados e sem mensagens. Dados de conformidade etária ficam separados do diretório público. Crianças permanecem bloqueadas até existir um fluxo adequado de responsável.</p>
        <h2>Fornecedores</h2>
        <p>A infraestrutura atual utiliza Supabase para autenticação, banco e armazenamento e Vercel para hospedagem da aplicação. As condições de transferência internacional e retenção serão documentadas na versão final.</p>
        <h2>Direitos e contato</h2>
        <p>O canal definitivo para exercício dos direitos previstos na legislação brasileira será publicado antes do cadastro público. A versão final também definirá controlador, retenção, bases legais e procedimentos de exclusão/correção.</p>
      </div>
    </AuthShell>
  );
}
