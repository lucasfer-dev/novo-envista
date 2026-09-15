import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";

export default function TermsPage() {
  return (
    <AuthShell
      wide
      title="Termos de Uso"
      description="Versão 2026-09-15-v2 · Vigente a partir de 15 de setembro de 2026."
    >
      <div className={styles.legal}>
        <p>Estes Termos regulam o acesso e o uso do Envista. Ao criar ou utilizar uma conta, o usuário concorda em respeitar estas regras, a legislação aplicável e os direitos de terceiros. O Aviso de Privacidade explica como os dados pessoais são tratados.</p>

        <h2>1. O que é o Envista</h2>
        <p>O Envista é uma plataforma voltada a aprendizagem, projetos, equipes, portfólios, competições, oportunidades e conexões entre participantes, instituições e investidores. Algumas funcionalidades podem estar em fase de teste, receber alterações ou ser disponibilizadas apenas a determinados tipos de conta.</p>

        <h2>2. Cadastro, informações da conta e segurança</h2>
        <p>O usuário deve fornecer informações verdadeiras nos campos obrigatórios, manter os dados da conta atualizados e proteger suas credenciais. É proibido compartilhar uma conta de modo que comprometa a segurança da plataforma, utilizar identidade de terceiros sem autorização, contornar controles técnicos ou tentar obter acesso a dados e áreas para os quais não exista autorização.</p>
        <p>O Envista pode solicitar confirmação de e-mail e utilizar identificadores privados de conta, como CPF ou CNPJ, quando disponibilizados pelo usuário. Esses identificadores são destinados a segurança e identificação da conta e não integram o perfil público.</p>

        <h2>3. Tipos de conta</h2>
        <p>Participantes podem criar perfil, aprender, publicar conteúdos, formar equipes, registrar projetos e acompanhar oportunidades e competições. Contas de investidor ou organização podem explorar projetos e, quando os requisitos aplicáveis forem atendidos, manifestar interesse e iniciar contatos permitidos pela plataforma.</p>
        <p>Selos, verificações ou classificações internas indicam somente que determinados controles do Envista foram concluídos. Eles não constituem recomendação, certificação profissional, garantia financeira ou endosso do usuário, projeto ou organização.</p>

        <h2>4. Crianças e adolescentes</h2>
        <p>O Envista aplica proteções adicionais de acordo com a faixa etária declarada. Recursos de visibilidade, comunicação e interação podem ser limitados para proteger usuários mais jovens e atender requisitos legais. Quando necessário, determinadas funcionalidades poderão depender de consentimento ou validação de responsável legal.</p>

        <h2>5. Conteúdo publicado pelo usuário</h2>
        <p>O usuário permanece responsável pelo conteúdo que publica e deve possuir os direitos ou autorizações necessários para compartilhá-lo. Não é permitido publicar material ilícito, fraudulento, discriminatório, abusivo, ameaçador, que viole propriedade intelectual, privacidade, imagem, segredo comercial ou outros direitos de terceiros.</p>
        <p>Ao tornar um conteúdo visível na plataforma, o usuário concede ao Envista uma licença limitada, não exclusiva e pelo período necessário para hospedar, processar, exibir e distribuir esse conteúdo dentro das funcionalidades da própria plataforma. Essa autorização não transfere a titularidade da obra para o Envista.</p>

        <h2>6. Projetos, autoria e propriedade intelectual</h2>
        <p>Projetos podem ser pessoais ou vinculados a equipes. O responsável pelo projeto deve respeitar os direitos de integrantes, colaboradores e terceiros, inclusive quanto a código, imagens, marcas, documentos e demais materiais utilizados.</p>
        <p>Métricas como visualizações, interações, salvamentos ou acessos podem ser registradas para funcionamento, analytics, segurança e melhoria do produto. Uma visualização, clique, cópia de link ou outra interação isolada não constitui prova automática de plágio, apropriação de ideia ou violação de propriedade intelectual.</p>

        <h2>7. Competições, eventos e informações de terceiros</h2>
        <p>O Envista pode organizar ou agregar informações sobre competições, olimpíadas, eventos e oportunidades mantidas por terceiros. Datas, requisitos, locais, regulamentos, inscrições e resultados continuam sujeitos às regras e aos canais oficiais de cada organizador.</p>
        <p>O usuário deve confirmar informações importantes no site oficial antes de realizar inscrição, viagem, pagamento ou envio de projeto. A exibição de uma competição no Envista não significa parceria ou vínculo com o organizador, salvo quando isso estiver expressamente informado.</p>

        <h2>8. Investidores, interesses e contatos</h2>
        <p>O Envista facilita descoberta e comunicação entre usuários, projetos e potenciais interessados. A plataforma não promete investimento, contratação, retorno financeiro ou sucesso comercial e, salvo quando explicitamente informado em serviço específico, não atua como instituição financeira, corretora ou consultoria de investimentos.</p>
        <p>Negociações externas, diligências, contratos, pagamentos e transferências realizadas entre usuários são responsabilidade das partes envolvidas.</p>

        <h2>9. Mensagens, comentários e convivência</h2>
        <p>Os recursos sociais e de comunicação devem ser usados de forma respeitosa e compatível com a finalidade da plataforma. É proibido assediar, ameaçar, perseguir, enviar spam, aplicar golpes, solicitar dados pessoais de forma indevida, contornar bloqueios ou explorar usuários vulneráveis.</p>
        <p>Usuários podem ter ferramentas para bloquear, denunciar, restringir mensagens ou tornar o perfil privado. O Envista poderá analisar denúncias e aplicar medidas proporcionais quando houver indícios de abuso ou violação destes Termos.</p>

        <h2>10. Moderação, suspensão e encerramento</h2>
        <p>O Envista pode remover ou limitar conteúdo, restringir funcionalidades, suspender ou encerrar contas quando houver indícios consistentes de fraude, abuso, violação destes Termos, risco à segurança, obrigação legal ou necessidade de proteger outros usuários. Sempre que apropriado e possível, medidas serão adotadas de forma proporcional ao risco identificado.</p>

        <h2>11. Uso aceitável e segurança técnica</h2>
        <p>Não é permitido explorar vulnerabilidades sem autorização, automatizar acesso de forma abusiva, realizar scraping proibido, sobrecarregar deliberadamente a infraestrutura, distribuir malware, tentar elevar privilégios ou interferir no funcionamento normal do serviço. Pesquisas de segurança devem respeitar os canais e autorizações indicados pelo Envista.</p>

        <h2>12. Disponibilidade e evolução do serviço</h2>
        <p>O Envista pode alterar funcionalidades, corrigir comportamentos, realizar manutenções, impor limites técnicos e descontinuar recursos. Embora sejam adotadas medidas razoáveis de disponibilidade e segurança, não é possível garantir funcionamento ininterrupto ou ausência absoluta de falhas.</p>

        <h2>13. Responsabilidades</h2>
        <p>Cada usuário é responsável por suas decisões, publicações, contatos e pela verificação de informações relevantes antes de agir. O Envista não controla integralmente conteúdos e condutas de terceiros e não garante a veracidade de toda informação publicada por usuários ou organizações externas.</p>
        <p>Nada nestes Termos busca excluir direitos ou responsabilidades que não possam ser afastados pela legislação brasileira.</p>

        <h2>14. Privacidade e proteção de dados</h2>
        <p>O tratamento de dados pessoais segue o <Link href="/privacy">Aviso de Privacidade</Link> e a legislação aplicável, incluindo a Lei Geral de Proteção de Dados Pessoais quando pertinente. A aceitação destes Termos não transforma automaticamente todas as finalidades de tratamento em consentimento.</p>

        <h2>15. Alterações destes Termos</h2>
        <p>Alterações relevantes serão publicadas com nova versão e data. Quando necessário, o Envista poderá solicitar nova manifestação do usuário antes de continuar o uso de determinadas funcionalidades.</p>

        <h2>16. Lei aplicável e contato</h2>
        <p>Estes Termos são regidos pela legislação brasileira. Questões, solicitações ou denúncias relacionadas ao uso da plataforma devem ser encaminhadas pelos canais oficiais de suporte disponibilizados pelo Envista.</p>

        <div className={styles.notice}><strong>Versão vigente:</strong> 2026-09-15-v2. O registro de aceite mantém a versão apresentada ao usuário.</div>
      </div>
    </AuthShell>
  );
}
