import Link from "next/link";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import ProjectCreationWizard from "@/components/projects/ProjectCreationWizard";
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
        <div><h1>Novo projeto</h1><p>Publique sua ideia com poucos dados e complete o projeto ao longo do tempo.</p></div>
        <Link className="secondary" href="/app/projects">Meus projetos</Link>
      </div>
      {error ? <div className="form-error" role="alert">{error === "url" ? "Use apenas links HTTPS válidos." : error === "owner" ? "Você não pode publicar por essa equipe." : error === "title" ? "Informe um nome válido." : "Não foi possível criar o projeto. Revise os campos e tente novamente."}</div> : null}
      <ProjectCreationWizard name={appUser.name} teams={teams} />
    </LegacySocialShell>
  );
}
