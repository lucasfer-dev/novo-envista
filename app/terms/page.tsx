import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";

export default function TermsPage() {
  return (
    <AuthShell
      wide
      title="Termos de Uso"
      description="Versão 2026-09-11-v2. Estes termos regulam o uso do Envista e das funcionalidades oferecidas na plataforma."
    >
      <div className={styles.legal}>
        <h2>1. O Envista</h2>
        <p>O Envista é uma plataforma de aprendizagem, projetos, equipes, competições e conexão entre participantes e investidores. O uso da plataforma deve respeitar estes Termos, a legislação aplicável e os direitos de terceiros.</p>

        <h2>2. Conta, identidade e segurança</h2>
        <p>Para novos cadastros, o usuário deve informar dados verdadeiros, incluindo CPF próprio e data de nascimento. Esses dados podem ser conferidos por meio do serviço oficial Consulta CPF do Serpro antes da criação da conta. Não é permitido cadastrar-se usando CPF ou dados de identidade de outra pessoa, burlar a verificação, compartilhar credenciais ou tentar obter acesso não autorizado.</p>

        <h2>3. Perfis de participante e investidor</h2>
        <p>Participantes podem aprender, criar projetos, integrar equipes e publicar sua evolução. Investidores podem explorar, salvar e acompanhar projetos. O envio de interesse a um projeto exige conta de investidor verificada. A verificação indica apenas que a conta passou pelos controles internos definidos pelo Envista; não representa recomendação financeira, garantia de capacidade de investimento ou endosso.</p>

        <h2>4. Conteúdo do usuário</h2>
        <p>O usuário continua responsável pelo conteúdo que publica e deve possuir os direitos ou autorizações necessários para compartilhá-lo. Não é permitido publicar conteúdo ilícito, fraudulento, abusivo, que viole propriedade intelectual, privacidade ou outros direitos de terceiros.</p>

        <h2>5. Projetos, autoria e métricas</h2>
        <p>Projetos podem ser pessoais ou vinculados a equipes. O Envista pode registrar métricas limitadas de uso, como visualizações agregadas, para oferecer analytics ao responsável pelo projeto e melhorar segurança e experiência. Uma visualização, clique ou uso de botão de cópia não constitui, isoladamente, prova de plágio ou apropriação de conteúdo.</p>

        <h2>6. Comunicação e convivência</h2>
        <p>Não é permitido assediar usuários, enviar spam, tentar obter dados pessoais por meios indevidos, contornar bloqueios ou usar os recursos de comunicação para fraude, exploração ou abordagem incompatível com a finalidade da plataforma.</p>

        <h2>7. Crianças e adolescentes</h2>
        <p>O Envista aplica proteções adicionais conforme a faixa etária derivada das informações fornecidas e verificadas no cadastro, incluindo restrições de visibilidade e comunicação. Recursos podem ser limitados quando necessário para segurança, melhor interesse e cumprimento das regras aplicáveis.</p>

        <h2>8. Moderação e segurança</h2>
        <p>Conteúdos, contas ou funcionalidades podem ser restringidos quando houver indícios de violação destes Termos, risco de segurança, abuso, fraude ou necessidade de proteção de usuários. Controles técnicos reduzem riscos, mas nenhum sistema é absolutamente invulnerável.</p>

        <h2>9. Disponibilidade e evolução</h2>
        <p>O Envista pode evoluir funcionalidades, corrigir comportamentos, alterar limites e realizar manutenções. Mudanças relevantes destes Termos serão versionadas e, quando necessário, apresentadas novamente ao usuário.</p>

        <h2>10. Privacidade</h2>
        <p>O tratamento de dados pessoais, inclusive o fluxo de validação de CPF e data de nascimento, é descrito no Aviso de Privacidade. A aceitação destes Termos não transforma automaticamente todas as finalidades de tratamento em consentimento.</p>
      </div>
    </AuthShell>
  );
}
