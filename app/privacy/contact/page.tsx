import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { submitPrivacyContactAction } from "./actions";

export const metadata = {
  title: "Privacidade e direitos | Envista",
  description: "Canal público para solicitações relacionadas a dados pessoais e privacidade no Envista.",
};

export default async function PrivacyContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <AuthShell
      wide
      title="Privacidade e seus direitos"
      description="Use este canal para falar com o Envista sobre seus dados pessoais, mesmo sem estar logado."
    >
      {status === "sent" ? (
        <>
          <div className={styles.success} role="status">
            Solicitação registrada. Ela será tratada conforme a natureza do pedido e a legislação aplicável.
          </div>
          <div className={styles.actions}>
            <Link className={`${styles.primary} ${styles.full}`} href="/">Voltar ao Envista</Link>
          </div>
        </>
      ) : (
        <>
          {error ? (
            <div className={styles.error} role="alert">
              {error === "invalid"
                ? "Revise o e-mail e o tipo de solicitação."
                : "Não foi possível registrar agora. Tente novamente em instantes."}
            </div>
          ) : null}

          <div className={styles.notice}>
            Não envie senha, documento completo, dados bancários ou informações desnecessárias. Se precisarmos confirmar sua identidade, faremos isso por um método proporcional ao pedido.
          </div>

          <form action={submitPrivacyContactAction} className={styles.form}>
            <label>
              E-mail para retorno
              <input name="email" type="email" autoComplete="email" maxLength={254} required />
            </label>

            <label>
              Tipo de solicitação
              <select name="request_type" defaultValue="" required>
                <option value="" disabled>Selecione</option>
                <option value="access">Acesso aos meus dados</option>
                <option value="correction">Correção de dados</option>
                <option value="deletion">Exclusão / eliminação</option>
                <option value="portability">Exportação / portabilidade</option>
                <option value="sharing">Informações sobre compartilhamentos</option>
                <option value="minor">Conta de criança/adolescente ou responsável</option>
                <option value="other">Outro assunto de privacidade</option>
              </select>
            </label>

            <label>
              Contexto <span className={styles.muted}>(opcional)</span>
              <textarea
                name="message"
                maxLength={2000}
                placeholder="Explique somente o necessário para entendermos sua solicitação."
              />
            </label>

            <label style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>

            <button className={`${styles.primary} ${styles.full}`} type="submit">
              Registrar solicitação
            </button>
          </form>

          <p className={styles.muted}>
            Consulte também o <Link href="/privacy">Aviso de Privacidade</Link> e os <Link href="/terms">Termos de Uso</Link>.
          </p>
        </>
      )}
    </AuthShell>
  );
}
