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
import {
  FollowingServerPage,
  InvestorSavedServerPage,
  RealHomeServerPage,
} from "@/components/real/LegacyDashboardServerPages";
import { LegacyPublicProfileServerPage } from "@/components/real/LegacyProfileServerPage";
import {
  CourseServerPage,
  LearnServerPage,
  LessonServerPage,
} from "@/components/real/CoursesServerPages";
import {
  ConversationServerPage,
  MessagesServerPage,
} from "@/components/real/MessagesServerPages";
import { NotificationsServerPage } from "@/components/real/NotificationsServerPages";
import { homeForRole } from "@/lib/auth/validation";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";
import type { User } from "@/types";

const DEMO_COOKIE = "envista_demo";
const LEGACY_COMPETITION_SLUGS = new Set(["envista-challenge-2026", "obt", "jovens-inovadores"]);

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

const demoInvestor: User = {
  id: "demo-investor",
  username: "investidor-demo",
  name: "Investidor Demo",
  role: "investor",
  bio: "Ambiente demonstrativo do perfil investidor no Envista.",
  city: "Rio de Janeiro",
  state: "RJ",
  organization: "Envista Ventures",
  jobTitle: "Analista de Inovação",
  organizationType: "Investidor",
  interests: ["Tecnologia", "Educação", "IA", "Impacto social"],
  stages: ["Protótipo", "MVP", "Projeto ativo"],
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
  const demoRole = cookieStore.get(DEMO_COOKIE)?.value;

  // A demo continua intencionalmente local. Contas reais nunca passam por este bloco.
  if (demoRole === "participant") {
    if (pathname.startsWith("/investor")) redirect("/app");
    if (pathname === "/app/explore") {
      return <LegacyExploreServerPage expectedRole="participant" pathname={pathname} searchParams={searchParams} demoUser={demoParticipant} />;
    }
    const demoCompetition = pathname.match(/^\/app\/competitions(?:\/([^/]+))?$/);
    if (demoCompetition) {
      const item = demoCompetition[1];
      if (!item) return <DemoCompetitionsServerPage user={demoParticipant} />;
      if (LEGACY_COMPETITION_SLUGS.has(item)) redirect("/app/competitions");
      return <DemoCompetitionDetailServerPage user={demoParticipant} slug={item} />;
    }
    return <><TaxonomyNavigationEnhancer /><EnvistaApp authenticatedProfile={demoParticipant} /></>;
  }

  if (demoRole === "investor") {
    if (pathname.startsWith("/app")) redirect("/investor");
    if (pathname === "/investor/explore") {
      return <LegacyExploreServerPage expectedRole="investor" pathname={pathname} searchParams={searchParams} demoUser={demoInvestor} />;
    }
    const demoCompetition = pathname.match(/^\/investor\/competitions(?:\/([^/]+))?$/);
    if (demoCompetition) {
      const item = demoCompetition[1];
      if (!item) return <DemoCompetitionsServerPage user={demoInvestor} />;
      if (LEGACY_COMPETITION_SLUGS.has(item)) redirect("/investor/competitions");
      return <DemoCompetitionDetailServerPage user={demoInvestor} slug={item} />;
    }
    return <><TaxonomyNavigationEnhancer /><EnvistaApp authenticatedProfile={demoInvestor} /></>;
  }

  // Homes reais.
  if (pathname === "/app") return <RealHomeServerPage expectedRole="participant" pathname={pathname} />;
  if (pathname === "/investor") return <RealHomeServerPage expectedRole="investor" pathname={pathname} />;

  // Social e descoberta reais.
  if (pathname === "/app/social") return <LegacySocialServerPage expectedRole="participant" searchParams={searchParams} />;
  if (pathname === "/investor/social") return <LegacySocialServerPage expectedRole="investor" searchParams={searchParams} />;
  if (pathname === "/app/explore") return <LegacyExploreServerPage expectedRole="participant" pathname={pathname} searchParams={searchParams} />;
  if (pathname === "/investor/explore") return <LegacyExploreServerPage expectedRole="investor" pathname={pathname} searchParams={searchParams} />;

  // Aprendizado real: cursos, matrículas e progresso no Supabase.
  if (pathname === "/app/learn") return <LearnServerPage />;
  const lessonRoute = pathname.match(/^\/app\/learn\/([^/]+)\/lesson\/([^/]+)$/);
  if (lessonRoute) return <LessonServerPage slug={lessonRoute[1]} lessonId={lessonRoute[2]} searchParams={searchParams} />;
  const courseRoute = pathname.match(/^\/app\/learn\/([^/]+)$/);
  if (courseRoute) return <CourseServerPage slug={courseRoute[1]} searchParams={searchParams} />;

  // Mensagens reais para ambos os papéis.
  const messagesRoute = pathname.match(/^\/(app|investor)\/messages(?:\/([^/]+))?$/);
  if (messagesRoute) {
    const expectedRole = roleFromBase(messagesRoute[1]);
    const conversationId = messagesRoute[2];
    if (!conversationId) return <MessagesServerPage expectedRole={expectedRole} searchParams={searchParams} />;
    return <ConversationServerPage expectedRole={expectedRole} conversationId={conversationId} searchParams={searchParams} />;
  }

  // Notificações reais.
  if (pathname === "/app/notifications") return <NotificationsServerPage expectedRole="participant" searchParams={searchParams} />;
  if (pathname === "/investor/notifications") return <NotificationsServerPage expectedRole="investor" searchParams={searchParams} />;

  // Coleções reais do investidor.
  if (pathname === "/investor/saved") return <InvestorSavedServerPage pathname={pathname} searchParams={searchParams} />;
  if (pathname === "/investor/following") return <FollowingServerPage expectedRole="investor" pathname={pathname} />;

  // Perfil e configurações próprios agora apontam para o editor persistido no Supabase.
  if (pathname === "/investor/profile" || pathname === "/investor/settings" || pathname === "/app/settings") redirect("/account/profile");
  if (pathname.startsWith("/app/profile/")) redirect("/account/profile");

  // Perfis públicos reais, independentemente da origem da navegação.
  const sourcedProfile = pathname.match(/^\/(app|investor)\/(explore|social|messages)\/(participants|investors)\/([^/]+)$/);
  if (sourcedProfile) {
    const expectedRole = roleFromBase(sourcedProfile[1]);
    return <LegacyPublicProfileServerPage expectedRole={expectedRole} username={sourcedProfile[4]} pathname={pathname} />;
  }
  const directProfile = pathname.match(/^\/(app|investor)\/(participants|investors)\/([^/]+)$/);
  if (directProfile) {
    const expectedRole = roleFromBase(directProfile[1]);
    return <LegacyPublicProfileServerPage expectedRole={expectedRole} username={directProfile[3]} pathname={pathname} />;
  }

  const directCompetition = pathname.match(/^\/(app|investor)\/competitions(?:\/([^/]+))?$/);
  if (directCompetition) {
    const expectedRole = roleFromBase(directCompetition[1]);
    const item = directCompetition[2];
    const competitionBase = expectedRole === "investor" ? "/investor/competitions" : "/app/competitions";
    if (!item) return <CompetitionsServerPage expectedRole={expectedRole} />;
    if (LEGACY_COMPETITION_SLUGS.has(item)) redirect(competitionBase);
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
    return <LegacyProjectDetailPage expectedRole={expectedRole} pathname={pathname} slug={item} backHref={fromExplore ? exploreBase : projectBase} publicView={fromExplore} searchParams={searchParams} />;
  }

  const sourcedProject = pathname.match(/^\/(app|investor)\/(social|explore|messages)\/projects\/([^/]+)$/);
  if (sourcedProject) {
    const expectedRole = roleFromBase(sourcedProject[1]);
    const appBase = expectedRole === "investor" ? "/investor" : "/app";
    return <LegacyProjectDetailPage expectedRole={expectedRole} pathname={pathname} slug={sourcedProject[3]} backHref={`${appBase}/${sourcedProject[2]}`} publicView searchParams={searchParams} />;
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
    return <LegacyTeamDetailPage expectedRole={expectedRole} pathname={pathname} slug={item} backHref={fromExplore ? exploreBase : teamBase} publicView={fromExplore} searchParams={searchParams} />;
  }

  const sourcedTeam = pathname.match(/^\/(app|investor)\/(social|explore|messages)\/teams\/([^/]+)$/);
  if (sourcedTeam) {
    const expectedRole = roleFromBase(sourcedTeam[1]);
    const appBase = expectedRole === "investor" ? "/investor" : "/app";
    return <LegacyTeamDetailPage expectedRole={expectedRole} pathname={pathname} slug={sourcedTeam[3]} backHref={`${appBase}/${sourcedTeam[2]}`} publicView searchParams={searchParams} />;
  }

  // Não existe mais fallback mock para contas autenticadas.
  const { role } = await requireProductUser();
  redirect(homeForRole(role));
}
