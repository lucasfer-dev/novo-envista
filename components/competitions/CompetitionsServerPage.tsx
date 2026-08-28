import ProductShell from "@/components/real/ProductShell";
import { CompetitionDetailClient, CompetitionsBrowser } from "@/components/competitions/CompetitionsClient";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";
import type { CompetitionRecommendationContext } from "@/lib/competitions/recommendations";
import type { User } from "@/types";

const emptyRecommendationContext: CompetitionRecommendationContext = { teams: [], projects: [] };

async function loadRecommendationContext(
  supabase: Awaited<ReturnType<typeof requireProductUser>>["supabase"],
  userId: string,
  role: ProductRole,
): Promise<CompetitionRecommendationContext> {
  if (role !== "participant") return emptyRecommendationContext;

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);
  const teamIds = Array.from(new Set((memberships || []).map((row) => row.team_id).filter(Boolean)));

  const [teamsResult, personalProjectsResult, teamProjectsResult] = await Promise.all([
    teamIds.length
      ? supabase.from("teams").select("id,slug,name,description,category,city,tags").in("id", teamIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("projects")
      .select("id,slug,title,short_description,category,location,tags,owner_team_id")
      .eq("owner_user_id", userId),
    teamIds.length
      ? supabase
          .from("projects")
          .select("id,slug,title,short_description,category,location,tags,owner_team_id")
          .in("owner_team_id", teamIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const projectsById = new Map<string, any>();
  for (const project of [...(personalProjectsResult.data || []), ...(teamProjectsResult.data || [])]) {
    projectsById.set(project.id, project);
  }

  return {
    teams: (teamsResult.data || []).map((team) => ({
      id: team.id,
      slug: team.slug,
      name: team.name,
      description: team.description || "",
      category: team.category || "",
      city: team.city || "",
      tags: team.tags || [],
    })),
    projects: Array.from(projectsById.values()).map((project) => ({
      id: project.id,
      slug: project.slug,
      title: project.title,
      shortDescription: project.short_description || "",
      category: project.category || "",
      location: project.location || "",
      tags: project.tags || [],
      ownerTeamId: project.owner_team_id || null,
    })),
  };
}

export async function CompetitionsServerPage({ expectedRole }: { expectedRole: ProductRole }) {
  const { appUser, supabase, userId, role } = await requireProductUser(expectedRole);
  const basePath = expectedRole === "investor" ? "/investor/competitions" : "/app/competitions";
  const recommendationContext = await loadRecommendationContext(supabase, userId, role);
  return (
    <ProductShell user={appUser} title="Competições" variant="legacyDark">
      <CompetitionsBrowser basePath={basePath} recommendationContext={recommendationContext} />
    </ProductShell>
  );
}

export async function CompetitionDetailServerPage({ expectedRole, slug }: { expectedRole: ProductRole; slug: string }) {
  const { appUser, supabase, userId, role } = await requireProductUser(expectedRole);
  const basePath = expectedRole === "investor" ? "/investor/competitions" : "/app/competitions";
  const recommendationContext = await loadRecommendationContext(supabase, userId, role);
  return (
    <ProductShell user={appUser} title="Competições" variant="legacyDark">
      <CompetitionDetailClient basePath={basePath} slug={slug} recommendationContext={recommendationContext} />
    </ProductShell>
  );
}

export function DemoCompetitionsServerPage({ user }: { user: User }) {
  return (
    <ProductShell user={user} title="Competições" variant="legacyDark">
      <CompetitionsBrowser basePath="/app/competitions" recommendationContext={emptyRecommendationContext} />
    </ProductShell>
  );
}

export function DemoCompetitionDetailServerPage({ user, slug }: { user: User; slug: string }) {
  return (
    <ProductShell user={user} title="Competições" variant="legacyDark">
      <CompetitionDetailClient basePath="/app/competitions" slug={slug} recommendationContext={emptyRecommendationContext} />
    </ProductShell>
  );
}
