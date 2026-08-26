import { redirect } from "next/navigation";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { updatePasswordAction } from "@/app/auth/actions";
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
    <AuthShell title="Definir nova senha" description="A nova senha será armazenada e verificada pelo Supabase Auth.">
      {params.error ? <div className={styles.error}>Não foi possível alterar a senha. Confira os campos e tente novamente.</div> : null}
      <form action={updatePasswordAction} className={styles.form}>
        <label>
          Nova senha
          <input type="password" name="password" autoComplete="new-password" minLength={10} maxLength={128} required />
        </label>
        <label>
          Confirmar nova senha
          <input type="password" name="password_confirmation" autoComplete="new-password" minLength={10} maxLength={128} required />
        </label>
        <button className={`${styles.primary} ${styles.full}`} type="submit">Atualizar senha</button>
      </form>
    </AuthShell>
  );
}
