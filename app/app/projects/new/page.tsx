import Link from "next/link";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import ProjectRegistrationWizard from "@/components/projects/ProjectRegistrationWizard";
import { requireProductUser } from "@/lib/auth/require-product-user";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, userId, appUser } = await requireProductUser("participant");
  const params = await searchParams;
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id,teams(id,name)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  const teams = (memberships ?? []).map((item: any) => one<any>(item.teams)).filter(Boolean) as Array<{ id: string; name: string }>;
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <LegacySocialShell user={appUser} role="participant" pathname="/app/projects/new">
      <div className="page-head">
        <div><h1>Novo projeto</h1><p>Compartilhe sua ideia em quatro etapas. Preencha só o essencial e complemente depois.</p></div>
        <Link className="secondary" href="/app/projects">Cancelar</Link>
      </div>
      {error ? <div className="form-error" role="alert">{error === "url" ? "Use somente links HTTPS válidos." : error === "owner" ? "Você não pode publicar por essa equipe." : error === "title" ? "Informe um nome válido." : "Não foi possível criar o projeto."}</div> : null}
      <ProjectRegistrationWizard name={appUser.name} teams={teams} />
    </LegacySocialShell>
  );
}
