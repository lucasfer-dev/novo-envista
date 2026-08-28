import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import EnvistaApp from "@/components/EnvistaApp";
import LegacySocialServerPage from "@/components/social/LegacySocialServerPage";
import LegacyExploreServerPage from "@/components/explore/LegacyExploreServerPage";
import TaxonomyNavigationEnhancer from "@/components/explore/TaxonomyNavigationEnhancer";
import {
  CompetitionDetailServerPage,
  CompetitionsServerPage,
  DemoCompetitionDetailServerPage,
  DemoCompetitionsServerPage,
} from "@/components/competitions/CompetitionsServerPage";
import {
  LegacyNewProjectPage,
  LegacyProjectDetailPage,
  LegacyProjectsIndexPage,
} from "@/components/projects/LegacyProjectsServerPage";
import {
  LegacyNewTeamPage,
  LegacyTeamDetailPage,
  LegacyTeamsIndexPage,
} from "@/components/teams/LegacyTeamsServerPage";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, parseProductRole } from "@/lib/auth/validation";
import type { ProductRole } from "@/lib/auth/require-product-user";
import type { User } from "@/types";

const DEMO_COOKIE = "envista_demo";

const demoParticipant: User = {
  id: "demo-participant",
  username: "demo",
  name: "Conta Demo",
  role: "participant",
  bio: "Ambiente demonstrativo do Envista.",
  school: "Envista Demo",
  city: "Rio de Janeiro",
  state: "RJ",
};

function isProtectedProductPath(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/") || pathname === "/investor" || pathname.startsWith("/investor/");
}

function roleFromBase(value: string): ProductRole {
  return value === "investor" ? "investor" : "participant";
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug = [] } = await params;
  const pathname = slug.length ? `/${slug.join("/")}` : "/";

  if (!isProtectedProductPath(pathname)) return <EnvistaApp />;

  const cookieStore = await cookies();
  if (cookieStore.get(DEMO_COOKIE)?.value === "participant") {
    if (pathname.startsWith("/investor")) redirect("/app");
    if (pathname === "/app/explore") {
      return (
        <LegacyExploreServerPage
          expectedRole="participant"
          pathname={pathname}
          searchParams={searchParams}
          demoUser={demoParticipant}
        />
      );
    }
    const demoCompetition = pathname.match(/^\/app\/competitions(?:\/([^/]+))?$/);
    if (demoCompetition) {
      const item = demoCompetition[1];
      if (!item) return <DemoCompetitionsServerPage user={demoParticipant} />;
      return <DemoCompetitionDetailServerPage user={demoParticipant} slug={item} />;
    }
    return <><TaxonomyNavigationEnhancer /><EnvistaApp authenticatedProfile={demoParticipant} /></>;
  }

  if (pathname === "/app/social") {
    return <LegacySocialServerPage expectedRole="participant" searchParams={searchParams} />;
  }
  if (pathname === "/investor/social") {
    return <LegacySocialServerPage expectedRole="investor" searchParams={searchParams} />;
  }
  if (pathname === "/app/explore") {
    return <LegacyExploreServerPage expectedRole="participant" pathname={pathname} searchParams={searchParams} />;
  }
  if (pathname === "/investor/explore") {
    return <LegacyExploreServerPage expectedRole="investor" pathname={pathname} searchParams={searchParams} />;
  }

  const directCompetition = pathname.match(/^\/(app|investor)\/competitions(?:\/([^/]+))?$/);
  if (directCompetition) {
    const expectedRole = roleFromBase(directCompetition[1]);
    const item = directCompetition[2];
    if (!item) return <CompetitionsServerPage expectedRole={expectedRole} />;
    return <CompetitionDetailServerPage expectedRole={expectedRole} slug={item} />;
  }

  const directProject = pathname.match(/^\/(app|investor)\/projects(?:\/([^/]+))?$/);
  if (directProject) {
    const expectedRole = roleFromBase(directProject[1]);
    const item = directProject[2];
    const projectBase = expectedRole === "investor" ? "/investor/projects" : "/app/projects";
    const exploreBase = expectedRole === "investor" ? "/investor/explore" : "/app/explore";
    const fromExplore = first((await searchParams).from) === "explore";
    if (!item) return <LegacyProjectsIndexPage expectedRole={expectedRole} pathname={pathname} searchParams={searchParams} />;
    if (item === "new") return <LegacyNewProjectPage expectedRole={expectedRole} pathname={pathname} searchParams={searchParams} />;
    return (
      <LegacyProjectDetailPage
        expectedRole={expectedRole}
        pathname={pathname}
        slug={item}
        backHref={fromExplore ? exploreBase : projectBase}
        publicView={fromExplore}
        searchParams={searchParams}
      />
    );
  }

  const sourcedProject = pathname.match(/^\/(app|investor)\/social\/projects\/([^/]+)$/);
  if (sourcedProject) {
    const expectedRole = roleFromBase(sourcedProject[1]);
    const appBase = expectedRole === "investor" ? "/investor" : "/app";
    return (
      <LegacyProjectDetailPage
        expectedRole={expectedRole}
        pathname={pathname}
        slug={sourcedProject[2]}
        backHref={`${appBase}/social`}
        publicView
        searchParams={searchParams}
      />
    );
  }

  const directTeam = pathname.match(/^\/(app|investor)\/teams(?:\/([^/]+))?$/);
  if (directTeam) {
    const expectedRole = roleFromBase(directTeam[1]);
    const item = directTeam[2];
    const teamBase = expectedRole === "investor" ? "/investor/teams" : "/app/teams";
    const exploreBase = expectedRole === "investor" ? "/investor/explore" : "/app/explore";
    const fromExplore = first((await searchParams).from) === "explore";
    if (!item) return <LegacyTeamsIndexPage expectedRole={expectedRole} pathname={pathname} searchParams={searchParams} />;
    if (item === "new") return <LegacyNewTeamPage expectedRole={expectedRole} pathname={pathname} searchParams={searchParams} />;
    return (
      <LegacyTeamDetailPage
        expectedRole={expectedRole}
        pathname={pathname}
        slug={item}
        backHref={fromExplore ? exploreBase : teamBase}
        publicView={fromExplore}
        searchParams={searchParams}
      />
    );
  }

  const sourcedTeam = pathname.match(/^\/(app|investor)\/social\/teams\/([^/]+)$/);
  if (sourcedTeam) {
    const expectedRole = roleFromBase(sourcedTeam[1]);
    const appBase = expectedRole === "investor" ? "/investor" : "/app";
    return (
      <LegacyTeamDetailPage
        expectedRole={expectedRole}
        pathname={pathname}
        slug={sourcedTeam[2]}
        backHref={`${appBase}/social`}
        publicView
        searchParams={searchParams}
      />
    );
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect(`/login?next=${encodeURIComponent(pathname)}`);

  const [profileResult, complianceResult, completionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,username,display_name,role,avatar_path,bio,public_city,public_state,public_school,organization,organization_type")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("account_compliance")
      .select("age_band,guardian_consent_verified_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("onboarding_completions").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (profileResult.error || complianceResult.error || completionResult.error) {
    redirect("/auth/error?reason=profile-query");
  }

  const profile = profileResult.data;
  const compliance = complianceResult.data;
  const completion = completionResult.data;

  if (!profile || !compliance || !completion) redirect("/onboarding");
  if (compliance.age_band === "child" && !compliance.guardian_consent_verified_at) {
    redirect("/guardian-required");
  }

  const role = parseProductRole(profile.role);
  if ((pathname.startsWith("/investor") && role !== "investor") || (pathname.startsWith("/app") && role !== "participant")) {
    redirect(homeForRole(role));
  }

  const authenticatedProfile: User = {
    id: profile.id,
    username: profile.username || "usuario",
    name: profile.display_name || profile.username || "Usuário",
    role,
    avatar: profile.avatar_path || undefined,
    bio: profile.bio || undefined,
    school: profile.public_school || undefined,
    city: profile.public_city || undefined,
    state: profile.public_state || undefined,
    organization: profile.organization || undefined,
    organizationType: profile.organization_type || undefined,
  };

  return <><TaxonomyNavigationEnhancer /><EnvistaApp authenticatedProfile={authenticatedProfile} /></>;
}
