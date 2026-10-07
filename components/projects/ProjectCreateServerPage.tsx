import LegacySocialShell from "@/components/social/LegacySocialShell";
import { requireProductUser } from "@/lib/auth/require-product-user";
import { ProjectCreateView } from "./ProjectCreateView";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function errorMessage(code?: string) {
  if (code === "title") return "Informe um nome de projeto com pelo menos 2 caracteres.";
  if (code === "owner") return "Você não pode publicar em nome dessa equipe.";
  if (code) return "Não foi possível criar o projeto. Revise os campos e tente novamente.";
  return "";
}

export async function ProjectCreateServerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, userId, appUser } = await requireProductUser("participant");
  const query = await searchParams;
  const rawError = Array.isArray(query.error) ? query.error[0] : query.error;
  const failure = errorMessage(rawError);
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id,teams(id,name)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  const teams = (memberships ?? []).map((item: any) => one<any>(item.teams)).filter(Boolean) as Array<{ id: string; name: string }>;

  return (
    <LegacySocialShell user={appUser} role="participant" pathname="/projects/new">
      <ProjectCreateView name={appUser.name} teams={teams} failure={failure} />
    </LegacySocialShell>
  );
}
