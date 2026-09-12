import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";

export default function PrivacyPage() {
  return (
    <AuthShell
      wide
      title="Aviso de Privacidade"
      description="Versão 2026-09-11-v1. Este aviso explica quais dados o Envista trata, para quais finalidades e quais controles estão disponíveis ao usuário."
    >
      <div className={styles.legal}>
        <h2>1. Escopo</h2>
        <p>O Envista é uma plataforma de aprendizagem, projetos, equipes, competições e conexão entre participantes e investidores. Este aviso se aplica aos dados tratados durante o uso da plataforma e dos seus recursos de conta.</p>

        <h2>2. Dados tratados</h2>
        <ul>
          <li>dados de conta, como e-mail, nome de exibição, username e credenciais de autenticação;</li>
          <li>CPF somente quando o usuário optar por cadastrá-lo como identificador alternativo de login; o número não é exibido no perfil e é convertido em identificador protegido para comparação;</li>
          <li>faixa etária declarada e informações de conformidade necessárias para aplicar proteções adequadas à idade;</li>
          <li>dados opcionais de perfil, como cidade, escola, organização, bio e imagem;</li>
          <li>conteúdo criado pelo usuário, incluindo projetos, equipes, arquivos, posts, comentários, progresso em cursos e inscrições;</li>
          <li>mensagens diretas, denúncias, bloqueios, notificações e registros necessários à segurança e moderação;</li>
          <li>eventos de uso estritamente relacionados à operação do produto, como visualizações agregadas de projetos e interações necessárias para segurança, auditoria e melhoria da experiência;</li>
          <li>dados técnicos de requisição processados pela infraestrutura de hospedagem e autenticação para entrega, proteção contra abuso e prevenção de acesso não autorizado.</li>
        </ul>

        <h2>3. Finalidades</h2>
        <p>Os dados são tratados para autenticar contas, fornecer as funcionalidades contratadas pelo usuário, manter projetos e equipes, permitir colaboração, entregar cursos e competições, prevenir abuso, proteger contas e conteúdos, moderar denúncias, cumprir obrigações aplicáveis e melhorar a confiabilidade do serviço.</p>

        <h2>4. Privacidade por padrão</h2>
        <p>Perfis novos começam privados e com novas mensagens desativadas. O usuário pode revisar as opções disponíveis em sua conta. Contas de crianças permanecem sujeitas a proteções adicionais, incluindo restrições de visibilidade e comunicação.</p>

        <h2>5. Investidores e contatos com projetos</h2>
        <p>Contas de investidor passam por uma etapa de verificação antes de usar a função “Tenho interesse”. Quando um investidor inicia esse contato, a identidade profissional necessária para o responsável pelo projeto avaliar a aproximação pode ser exibida a esse responsável, mesmo que o perfil geral do investidor não esteja público para toda a plataforma.</p>

        <h2>6. Métricas de projeto</h2>
        <p>O Envista pode registrar eventos limitados de uso, como a visualização de um projeto, para gerar métricas agregadas ao responsável pelo conteúdo. Essas métricas não são apresentadas como prova de plágio, cópia ou intenção do usuário. Eventos são limitados ao necessário para a funcionalidade informada.</p>

        <h2>7. Fornecedores</h2>
        <p>A infraestrutura atual utiliza Supabase para autenticação, banco de dados e armazenamento e Vercel para hospedagem e entrega da aplicação. Esses fornecedores processam dados conforme suas funções técnicas na prestação do serviço.</p>

        <h2>8. Retenção e segurança</h2>
        <p>Os dados são mantidos pelo período necessário às finalidades do produto, obrigações aplicáveis, prevenção de fraude e exercício regular de direitos. O Envista utiliza controles de acesso, políticas de autorização, autenticação reforçada para administração, limites antiabuso e separação de informações privadas para reduzir riscos de acesso indevido.</p>

        <h2>9. Direitos do usuário</h2>
        <p>A área “Privacidade e meus dados” permite solicitar acesso, correção, exportação e exclusão, conforme a natureza do dado e as hipóteses de retenção aplicáveis. O usuário também pode revisar visibilidade de perfil e permissões de mensagens.</p>

        <h2>10. Atualizações</h2>
        <p>Este aviso pode ser atualizado quando funcionalidades, fornecedores ou práticas relevantes mudarem. Mudanças materiais poderão exigir nova ciência ou aceite quando aplicável.</p>
      </div>
    </AuthShell>
  );
}
