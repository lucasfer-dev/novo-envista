import { redirect } from "next/navigation";
import EnvistaApp from "@/components/EnvistaApp";
import LegacyExploreServerPage from "@/components/explore/LegacyExploreServerPage";
import TaxonomyNavigationEnhancer from "@/components/explore/TaxonomyNavigationEnhancer";
import {
  DemoCompetitionDetailServerPage,
  DemoCompetitionsServerPage,
} from "@/components/competitions/CompetitionsServerPage";
import type { User } from "@/types";

export type DemoRole = "participant" | "investor";

type Search = Promise<Record<string, string | string[] | undefined>>;

const legacyCompetitionSlugs = new Set(["envista-challenge-2026", "obt", "jovens-inovadores"]);

const demoProfiles: Record<DemoRole, User> = {
  participant: {
    id: "demo-participant",
    username: "demo",
    name: "Conta Demo",
    role: "participant",
    bio: "Ambiente demonstrativo do Envista.",
    school: "Envista Demo",
    city: "Rio de Janeiro",
    state: "RJ",
  },
  investor: {
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
  },
};

export function parseDemoRole(value: string | undefined): DemoRole | null {
  return value === "participant" || value === "investor" ? value : null;
}

export function DemoProductPage({ role, pathname, searchParams }: { role: DemoRole; pathname: string; searchParams: Search }) {
  const profile = demoProfiles[role];
  const base = role === "investor" ? "/investor" : "/app";
  const otherBase = role === "investor" ? "/app" : "/investor";

  if (pathname === otherBase || pathname.startsWith(`${otherBase}/`)) redirect(base);

  if (pathname === `${base}/explore`) {
    return <LegacyExploreServerPage expectedRole={role} pathname={pathname} searchParams={searchParams} demoUser={profile} />;
  }

  const competition = pathname.match(new RegExp(`^${base}/competitions(?:/([^/]+))?$`));
  if (competition) {
    const item = competition[1];
    if (!item) return <DemoCompetitionsServerPage user={profile} />;
    if (legacyCompetitionSlugs.has(item)) redirect(`${base}/competitions`);
    return <DemoCompetitionDetailServerPage user={profile} slug={item} />;
  }

  return <><TaxonomyNavigationEnhancer /><EnvistaApp authenticatedProfile={profile} /></>;
}
