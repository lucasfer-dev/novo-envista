import { CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { confirmGuardianVerificationAction } from "@/app/guardian/actions";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import flowStyles from "@/components/guardian/GuardianFlow.module.css";
import { createClient } from "@/lib/supabase/server";

function relationshipLabel(value: string | null) {
  if (value === "mother") return "Mãe";
  if (value === "father") return "Pai";
  if (value === "legal_guardian") return "Responsável legal";
  if (value === "other") return "Outro responsável legal";
  return "Responsável legal";
}

export default async function GuardianConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const token = typeof params.token === "string" ? params.token.trim().slice(0, 256) : "";
  const errorCode = typeof params.error === "string" ? params.error : "";

  if (status === "success") {
    return (
      <AuthShell title="Confirmação concluída" description="A conta vinculada já pode atualizar o Envista e continuar o fluxo normalmente.">
        <div className={flowStyles.successHero}>
          <div className={flowStyles.successIcon}><CheckCircle2 size={28} /></div>
          <h2>Tudo certo por aqui.</h2>
          <p>A confirmação foi registrada. Você não precisa criar uma conta nem um perfil no Envista.</p>
        </div>
        <div className={styles.notice}>Esta página pode ser fechada. A pessoa menor de idade poderá continuar o fluxo no próprio dispositivo.</div>
        <div className={styles.links}><Link href="/">Conhecer o Envista</Link></div>
      </AuthShell>
    );
  }

  if (!token) {
    return (
      <AuthShell title="Link de confirmação inválido" description="Peça ao adolescente para gerar um novo link no Envista.">
        <div className={styles.error}>Este link está incompleto ou expirou.</div>
      </AuthShell>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_guardian_verification_request", {
    confirmation_token: token,
  });
  const request = Array.isArray(data) ? data[0] : data;

  if (error || !request) {
    return (
      <AuthShell title="Link expirado ou inválido" description="Por segurança, links de confirmação são temporários e de uso único.">
        <div className={styles.error}>Solicite um novo link diretamente ao adolescente.</div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Confirme o vínculo"
      description="Você não está criando um perfil no Envista. Esta etapa registra somente a confirmação necessária para a conta protegida."
    >
      <span className={flowStyles.legalBadge}><ShieldCheck size={14} /> CONFIRMAÇÃO DO RESPONSÁVEL</span>

      <div className={styles.notice}>
        <strong>{request.minor_display_name}</strong> informou <strong>{request.guardian_name}</strong> como {relationshipLabel(request.guardian_relationship).toLowerCase()}.
      </div>

      {errorCode ? (
        <div className={styles.error} role="alert">
          Não foi possível confirmar. Confira o CPF informado e se o link ainda está válido.
        </div>
      ) : null}

      <form action={confirmGuardianVerificationAction} className={styles.form}>
        <input type="hidden" name="token" value={token} />

        <label>
          CPF do responsável
          <input
            name="guardian_cpf"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            maxLength={18}
            required
          />
          <span className={styles.muted}>Digite o mesmo CPF informado na criação deste vínculo.</span>
        </label>

        <div className={styles.checks}>
          <label className={styles.check}>
            <input type="checkbox" name="guardian_declaration" required />
            <span>Declaro que sou o responsável legal indicado acima e autorizo a vinculação desta confirmação à conta protegida no Envista.</span>
          </label>
        </div>

        <button className={styles.primary + " " + styles.full} type="submit">Confirmar responsabilidade</button>
      </form>

      <p className={styles.legalHint}>
        O Envista não cria perfil social para o responsável. O CPF completo não é exibido publicamente.
      </p>
    </AuthShell>
  );
}
