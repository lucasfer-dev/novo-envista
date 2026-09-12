import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import suite from "@/components/product/ProfessionalSuite.module.css";
import { createClient } from "@/lib/supabase/server";
import { updateProfessionalProfileAction } from "@/lib/account/professional-actions";

export default async function ProfessionalProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (error || !userId) redirect("/login?error=session");
  const { data: profile } = await supabase.from("profiles").select("display_name,bio,avatar_path,headline,skills,github_url,linkedin_url,website_url,role").eq("id", userId).maybeSingle();
  if (!profile) redirect("/onboarding");
  const params = await searchParams;
  const home = profile.role === "investor" ? "/investor" : "/app";
  const checks = [Boolean(profile.avatar_path), Boolean(profile.bio), Boolean(profile.headline), (profile.skills?.length ?? 0) >= 3, Boolean(profile.github_url || profile.linkedin_url || profile.website_url)];
  const score = Math.round(checks.filter(Boolean).length / checks.length * 100);

  return <AuthShell wide title="Perfil profissional" description="Mostre o que você sabe fazer e deixe seu perfil mais confiável para equipes e oportunidades.">
    {params.status === "saved" ? <div className={styles.success}>Perfil profissional atualizado.</div> : null}{params.error ? <div className={styles.error}>Não foi possível salvar. Use apenas links HTTPS válidos.</div> : null}
    <div className={suite.score} style={{ marginBottom: 20 }}><span className={suite.scoreRing}>{score}%</span><span className={suite.scoreText}><strong>Completude do perfil</strong><span>Avatar, bio, headline, ao menos 3 skills e um link profissional.</span></span></div>
    <form action={updateProfessionalProfileAction} className={styles.form}>
      <label>Headline<input name="headline" defaultValue={profile.headline || ""} maxLength={140} placeholder="Ex.: Desenvolvedor full stack · IA aplicada · Produtos digitais" /><span className={styles.muted}>Uma frase curta sobre o que você faz ou procura.</span></label>
      <label>Skills<input name="skills" defaultValue={(profile.skills ?? []).join(", ")} maxLength={500} placeholder="JavaScript, React, Java, UI/UX, IA" /><span className={styles.muted}>Separe por vírgulas. Mostramos até 20 competências.</span></label>
      <div className={styles.grid2}><label>GitHub<input type="url" name="github_url" defaultValue={profile.github_url || ""} placeholder="https://github.com/..." /></label><label>LinkedIn<input type="url" name="linkedin_url" defaultValue={profile.linkedin_url || ""} placeholder="https://linkedin.com/in/..." /></label></div>
      <label>Site pessoal / portfólio<input type="url" name="website_url" defaultValue={profile.website_url || ""} placeholder="https://..." /></label>
      <div className={styles.actions}><button className={styles.primary} type="submit">Salvar perfil profissional</button><Link className={styles.secondary} href="/account/profile">Dados básicos</Link><Link className={styles.secondary} href="/account/settings">Configurações</Link><Link className={styles.secondary} href={home}>Voltar ao Envista</Link></div>
    </form>
  </AuthShell>;
}
