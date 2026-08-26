import { redirect } from "next/navigation";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { updatePasswordAction } from "@/app/auth/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login?error=session");
  const params = await searchParams;

  return (
    <AuthShell title="Definir nova senha" description="Ao salvar, as sessões anteriores serão encerradas e será necessário entrar novamente.">
      {params.error ? <div className={styles.error}>Não foi possível alterar a senha. Confira os campos e tente novamente.</div> : null}
      <form action={updatePasswordAction} className={styles.form}>
        <label>
          Nova senha
          <input type="password" name="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} maxLength={128} required />
          <span className={styles.muted}>Use uma senha exclusiva com pelo menos {MIN_PASSWORD_LENGTH} caracteres.</span>
        </label>
        <label>
          Confirmar nova senha
          <input type="password" name="password_confirmation" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} maxLength={128} required />
        </label>
        <AuthSubmitButton className={`${styles.primary} ${styles.full}`} pendingText="Atualizando...">
          Atualizar senha
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
