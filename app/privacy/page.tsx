import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";

export default function PrivacyPage() {
  return (
    <AuthShell
      wide
      title="Aviso de Privacidade — versão beta"
      description="Versão internal-2026-08-26-v2. Material provisório para testes controlados; controlador, contatos institucionais, bases legais e retenção ainda precisam de revisão final antes do lançamento público amplo."
    >
      <div className={styles.notice}>
        O cadastro beta está ativo. A central de privacidade já permite registrar solicitações, mas este Aviso ainda será substituído por uma versão jurídica final. A ciência deste documento não transforma automaticamente todas as finalidades de tratamento em consentimento.
      </div>
      <div className={styles.legal}>
        <h2>Dados tratados no beta</h2>
        <ul>
          <li>e-mail e credenciais tratados pelo Supabase Auth;</li>
          <li>nome de exibição, username, organização e campos opcionais de perfil;</li>
          <li>faixa etária declarada e informações de conformidade, sem armazenar a data de nascimento completa nesta fundação;</li>
          <li>equipes, projetos, inscrições, progresso de cursos e demais informações criadas pelo usuário;</li>
          <li>posts, comentários, follows, denúncias, bloqueios e mensagens diretas quando essas funcionalidades forem utilizadas;</li>
          <li>arquivos enviados aos espaços privados de armazenamento da plataforma;</li>
          <li>eventos de aceite, solicitações de privacidade e trilhas administrativas necessárias à segurança/moderação;</li>
          <li>dados técnicos de segurança e requisição processados pela infraestrutura de hospedagem para operação, proteção contra abuso e entrega do serviço.</li>
        </ul>
        <h2>Finalidades técnicas do beta</h2>
        <p>Autenticar contas, manter sessão, permitir o funcionamento de perfis/equipes/projetos/cursos, aplicar controles de segurança e faixa etária, entregar funcionalidades sociais escolhidas pelo usuário, registrar documentos apresentados e prevenir abuso ou acesso não autorizado.</p>
        <h2>Privacidade por padrão</h2>
        <p>Perfis novos começam privados e sem mensagens. Dados de conformidade etária ficam separados do diretório público. O lançamento para crianças e adolescentes depende da conclusão dos mecanismos de idade, responsável/supervisão e demais salvaguardas aplicáveis.</p>
        <h2>Mensagens e moderação</h2>
        <p>Mensagens diretas são destinadas aos participantes da conversa. A arquitetura administrativa foi desenhada para permitir acesso ao conteúdo de uma mensagem apenas quando ela estiver vinculada a uma denúncia, em vez de fornecer leitura geral de conversas privadas.</p>
        <h2>Fornecedores</h2>
        <p>A infraestrutura atual utiliza Supabase para autenticação, banco e armazenamento e Vercel para hospedagem da aplicação. As condições definitivas de retenção, transferências internacionais, papéis de controlador/operador e fornecedores deverão constar da documentação final.</p>
        <h2>Direitos e contato</h2>
        <p>A central de privacidade do produto permite registrar pedidos de acesso, correção, exportação e exclusão para tratamento operacional. Antes do lançamento público amplo também deverá ser publicado um canal institucional definitivo, com identificação do controlador e procedimento documentado de atendimento.</p>
        <h2>Retenção</h2>
        <p>A política definitiva de retenção e descarte ainda está em elaboração. Por isso, este ambiente não deve ser usado para inserir dados desnecessários, dados sensíveis ou informações de terceiros apenas para fins de teste.</p>
      </div>
    </AuthShell>
  );
}
