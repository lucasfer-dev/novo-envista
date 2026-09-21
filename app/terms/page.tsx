import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";

const SUPPORT_EMAIL = process.env.LEGAL_SUPPORT_EMAIL?.trim() || "suporte@useenvista.com.br";
const CONTROLLER_NAME = process.env.LEGAL_CONTROLLER_NAME?.trim() || "Envista";

export default function TermsPage() {
  return (
    <AuthShell
      wide
      title="Termos de Uso"
      description="Versão 2026-09-21-v5 · Vigente a partir de 21 de setembro de 2026."
    >
      <div className={styles.legal}>
        <p>Estes Termos regulam o acesso e o uso do Envista. Ao criar ou utilizar uma conta, o usuário concorda em respeitar estas regras, a legislação brasileira e os direitos de terceiros. O <Link href="/privacy">Aviso de Privacidade</Link> integra este conjunto de regras.</p>

        <h2>1. Serviço</h2>
        <p>O Envista é uma plataforma de aprendizagem, colaboração, projetos, equipes, portfólios, competições, oportunidades e conexões entre participantes, instituições e investidores. Funcionalidades podem evoluir, ser limitadas por categoria de conta ou ser descontinuadas por razões técnicas, jurídicas ou de segurança.</p>

        <h2>2. Cadastro, identificação e segurança</h2>
        <p>O usuário deve fornecer informações verdadeiras, manter os dados essenciais atualizados e proteger suas credenciais. Para criação da conta, o Envista exige e-mail, nome, CPF ou CNPJ válido, data de nascimento e aceite expresso destes Termos. O CPF ou CNPJ é utilizado como identificador privado e pode também ser usado no login. A data de nascimento é utilizada para determinar a faixa etária e aplicar as proteções correspondentes, conforme detalhado no Aviso de Privacidade. O aceite dos Termos é registrado com a versão vigente e o horário do evento.</p>
        <p>É proibido usar identidade ou documento de terceiros sem autorização, informar deliberadamente idade falsa para contornar proteções, compartilhar conta de modo inseguro, contornar controles de acesso ou tentar obter dados sem permissão.</p>

        <h2>3. Menores de idade</h2>
        <p>O Envista aplica proteção reforçada a crianças e adolescentes. Contas de menores não são liberadas para uso normal enquanto a verificação aplicável do responsável legal não estiver concluída. Recursos sociais, mensagens, visibilidade e outras funcionalidades podem permanecer bloqueados ou limitados por padrão.</p>
        <p>O melhor interesse do menor prevalece. O Envista poderá restringir ou suspender funcionalidades quando houver risco à segurança, privacidade ou integridade de crianças e adolescentes.</p>

        <h2>4. Tipos de conta</h2>
        <p>Participantes podem aprender, formar equipes e registrar projetos. Contas de investidor ou organização podem explorar projetos e, após as verificações aplicáveis, manifestar interesse. Verificações internas não constituem certificação profissional, recomendação de investimento ou garantia de idoneidade.</p>

        <h2>5. Conteúdo do usuário</h2>
        <p>O usuário continua titular dos direitos que possuir sobre o conteúdo que publica. Ao disponibilizar conteúdo no Envista, concede licença não exclusiva, limitada e necessária para hospedar, processar, exibir e distribuir esse conteúdo dentro das funcionalidades do serviço.</p>
        <p>É proibido publicar conteúdo ilícito, fraudulento, discriminatório, abusivo, ameaçador, sexualmente exploratório, que viole direitos autorais, marcas, privacidade, imagem, segredo comercial ou direitos de terceiros.</p>

        <h2>6. Projetos, autoria e ideias</h2>
        <p>O Envista não transfere para si a titularidade dos projetos publicados. Métricas, visualizações, cliques ou acessos não constituem prova automática de autoria, plágio, apropriação ou investimento. Usuários e equipes devem documentar autoria e acordos internos quando isso for relevante.</p>

        <h2>7. Competições e oportunidades de terceiros</h2>
        <p>Informações sobre competições, eventos e oportunidades de terceiros podem mudar. O usuário deve conferir regulamentos, datas, requisitos e condições nos canais oficiais antes de tomar decisões ou realizar pagamentos.</p>

        <h2>8. Investidores e negociações</h2>
        <p>O Envista facilita descoberta e comunicação, mas não garante investimento, contratação, retorno financeiro ou sucesso comercial. Salvo informação expressa em contrário, o Envista não atua como corretora, instituição financeira, consultoria de investimentos ou representante das partes.</p>

        <h2>9. Conduta, mensagens e segurança</h2>
        <p>É proibido assediar, ameaçar, perseguir, aplicar golpes, enviar spam, explorar usuários vulneráveis, solicitar dados indevidos, distribuir malware, contornar bloqueios, realizar scraping abusivo ou explorar vulnerabilidades sem autorização.</p>

        <h2>10. Moderação e medidas de proteção</h2>
        <p>O Envista poderá remover conteúdo, limitar alcance, restringir recursos, suspender ou encerrar contas quando houver fraude, abuso, risco à segurança, violação destes Termos ou obrigação legal. Medidas serão proporcionais ao risco e poderão preservar evidências necessárias à investigação.</p>

        <h2>11. Disponibilidade</h2>
        <p>O serviço pode passar por manutenção, correções, limites técnicos e mudanças de funcionalidade. Não há garantia de operação ininterrupta, mas o Envista adota medidas razoáveis de segurança, continuidade e recuperação.</p>

        <h2>12. Responsabilidade</h2>
        <p>Nada nestes Termos exclui direitos obrigatórios previstos na legislação brasileira, inclusive direitos do consumidor quando aplicáveis. Cada usuário é responsável por suas decisões, conteúdos e negociações externas realizadas com terceiros.</p>

        <h2>13. Privacidade</h2>
        <p>O tratamento de dados pessoais segue o <Link href="/privacy">Aviso de Privacidade</Link>, a LGPD e, quando aplicável, as regras de proteção de crianças e adolescentes no ambiente digital.</p>

        <h2>14. Alterações</h2>
        <p>Alterações materiais serão publicadas com nova versão e data. Quando exigido, o Envista solicitará nova aceitação antes de liberar a continuidade de determinados recursos.</p>

        <h2>15. Lei aplicável e contato</h2>
        <p>Estes Termos são regidos pela legislação brasileira, sem prejuízo de normas obrigatórias aplicáveis ao usuário. O responsável pela operação é {CONTROLLER_NAME}. Dúvidas de suporte podem ser encaminhadas para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>

        <div className={styles.notice}><strong>Versão vigente:</strong> 2026-09-21-v5.</div>
      </div>
    </AuthShell>
  );
}
