import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";

const PRIVACY_EMAIL = process.env.LEGAL_PRIVACY_EMAIL?.trim() || "privacidade@useenvista.com.br";
const CONTROLLER_NAME = process.env.LEGAL_CONTROLLER_NAME?.trim() || "Envista";

export default function PrivacyPage() {
  return (
    <AuthShell
      wide
      title="Aviso de Privacidade"
      description="Versão 2026-09-25-v6. Transparência sobre dados pessoais, segurança, direitos e proteção de menores."
    >
      <div className={styles.legal}>
        <p><strong>Controlador:</strong> {CONTROLLER_NAME}. <strong>Canal público de privacidade:</strong> <Link href="/privacy/contact">registrar solicitação</Link>. E-mail complementar: <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.</p>

        <h2>1. Escopo e princípios</h2>
        <p>Este Aviso se aplica ao uso do Envista e às operações de tratamento necessárias para autenticação, perfis, projetos, equipes, conteúdos, aprendizado, mensagens, moderação, segurança e conexão entre participantes, instituições e investidores. O tratamento observa finalidade, adequação, necessidade, transparência, segurança, prevenção, não discriminação e responsabilização.</p>

        <h2>2. Dados tratados</h2>
        <ul>
          <li>dados de conta, como e-mail, nome de exibição, username e credenciais de autenticação;</li>
          <li>CPF ou CNPJ, exigido no cadastro para identificação e login. O número completo não é exibido no perfil e o Envista mantém apenas uma representação criptográfica não reversível para localizar a conta;</li>
          <li>data de nascimento no momento do cadastro, utilizada para calcular a faixa etária. A data completa é removida durante a criação da conta e não é persistida; permanece somente a faixa etária necessária às proteções do produto;</li>
          <li>dados mínimos de conformidade, como faixa etária e registros relacionados à proteção de menores;</li>
          <li>quando houver confirmação de responsável, nome declarado, vínculo, registro do evento e representação criptográfica do CPF do responsável; o CPF completo não é exibido no perfil e o token bruto de confirmação não é persistido;</li>
          <li>dados opcionais de perfil, como cidade, estado, escola, organização, bio, imagem e interesses;</li>
          <li>conteúdo criado ou enviado pelo usuário, como projetos, equipes, arquivos, posts, comentários, progresso em cursos e inscrições;</li>
          <li>mensagens, denúncias, bloqueios, notificações e registros necessários à segurança, prevenção de abuso e moderação;</li>
          <li>eventos técnicos e de produto estritamente necessários para segurança, auditoria, confiabilidade e métricas agregadas.</li>
        </ul>

        <h2>3. Finalidades e bases legais</h2>
        <p>Os dados são tratados para executar o serviço solicitado pelo usuário, identificar e proteger contas, aplicar proteções adequadas à idade, cumprir obrigações legais ou regulatórias, exercer direitos, prevenir fraude e abuso, atender solicitações de titulares e, quando aplicável, atender interesses legítimos avaliados com salvaguardas. Consentimento é usado somente quando a legislação exigir e pode ser revogado nos casos aplicáveis.</p>
        <p>Quando um dado for condição necessária para criação ou uso da conta, essa exigência é apresentada de forma destacada no fluxo correspondente. No cadastro, o usuário confirma separadamente que leu este Aviso; essa ciência é registrada com a versão vigente e não é tratada como consentimento genérico para toda finalidade.</p>

        <h2>4. Crianças e adolescentes</h2>
        <p>O Envista adota proteção reforçada para crianças e adolescentes. A faixa etária e a necessidade de confirmação de responsável são calculadas a partir da data de nascimento informada no cadastro. A data completa é descartada durante a criação da conta e não é mantida no perfil.</p>
        <p>Quando a conta puder continuar em modo protegido antes da confirmação do responsável, ela permanece privada, com mensagens desativadas e sem acesso às superfícies sociais protegidas. O núcleo de aprendizagem, projetos, equipes e competições pode continuar disponível conforme as regras da conta.</p>
        <p>A confirmação do responsável é registrada separadamente do perfil social. O Envista mantém apenas os dados necessários para validar e auditar o evento, incluindo representação protegida do identificador utilizado no fluxo. O melhor interesse da criança e do adolescente prevalece sobre objetivos comerciais ou de crescimento da plataforma.</p>
        <p>O Envista não utiliza dados de crianças ou adolescentes para publicidade comportamental ou perfilamento publicitário. Recursos de interação podem ser limitados ou desativados por padrão para esse público.</p>

        <h2>5. Dados públicos e visibilidade</h2>
        <p>O perfil começa privado. O usuário controla as opções de visibilidade permitidas para sua categoria de conta. Projetos e equipes somente são exibidos publicamente quando marcados como visíveis e quando as regras de privacidade do responsável permitirem. Dados privados de conta não são incluídos em superfícies públicas.</p>

        <h2>6. Investidores e contatos</h2>
        <p>Contas de investidor podem estar sujeitas a verificação antes de iniciar contato com projetos. Quando houver manifestação de interesse, dados profissionais estritamente necessários poderão ser compartilhados com o responsável pelo projeto para avaliar a aproximação. O Envista não comercializa dados pessoais para investidores.</p>

        <h2>7. Fornecedores e transferências</h2>
        <p>O Envista utiliza fornecedores de infraestrutura, autenticação, banco de dados, armazenamento e hospedagem, incluindo Supabase e Vercel. Esses fornecedores tratam dados conforme suas funções técnicas e contratos aplicáveis. Quando houver transferência internacional de dados, serão adotadas as salvaguardas exigidas pela legislação brasileira.</p>

        <h2>8. Retenção e eliminação</h2>
        <p>Os dados são mantidos pelo tempo necessário às finalidades informadas, à segurança, prevenção de fraude, exercício regular de direitos e obrigações legais. Solicitações de exclusão serão atendidas quando aplicáveis, sem prejuízo de retenções obrigatórias ou necessárias para defesa de direitos.</p>

        <h2>9. Segurança</h2>
        <p>O Envista utiliza autenticação, controle de acesso, Row Level Security, segregação de dados privados, registro de eventos administrativos, limites antiabuso e práticas de desenvolvimento seguro. Nenhum sistema é absolutamente invulnerável; incidentes relevantes serão tratados segundo o plano de resposta e as obrigações legais aplicáveis.</p>

        <h2>10. Direitos dos titulares</h2>
        <p>O titular pode solicitar, conforme aplicável, confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informação sobre compartilhamentos e revisão de decisões automatizadas, além dos demais direitos previstos na LGPD. Usuários autenticados também podem usar a área de privacidade da conta. Solicitações externas podem ser registradas pelo <Link href="/privacy/contact">canal público de privacidade</Link> ou enviadas para <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.</p>

        <h2>11. Atualizações</h2>
        <p>Alterações relevantes serão publicadas com nova versão e data. Quando necessário, o Envista solicitará nova manifestação do usuário antes da continuidade de determinadas funcionalidades.</p>

        <p>Consulte também os <Link href="/terms">Termos de Uso</Link>.</p>
        <div className={styles.notice}><strong>Versão vigente:</strong> 2026-09-25-v6.</div>
      </div>
    </AuthShell>
  );
}
