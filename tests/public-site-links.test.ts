import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const landing = readFileSync("components/public/PublicLandingV3Server.tsx", "utf8");
const about = readFileSync("app/about/page.tsx", "utf8");
const schools = readFileSync("app/schools/page.tsx", "utf8");
const plans = readFileSync("app/plans/page.tsx", "utf8");
const competitions = readFileSync("app/api/competitions/route.ts", "utf8");
const migrations = readFileSync("supabase/migrations/20260826174000_disable_competitions.sql", "utf8");

describe("public release routes and affordances", () => {
  it("keeps the institutional link working without routing to removed Schools", () => {
    expect(landing).toContain('href="/about"');
    expect(about).toContain('title: "Sobre o Envista');
    expect(about).not.toContain('redirect("/schools")');
    expect(schools).toContain('redirect("/about#para-quem")');
  });

  it("does not render nonfunctional links on the landing", () => {
    expect(landing).toContain('<Link href="/projects">Explorar projetos</Link>');
    expect(landing).not.toContain("<a>Explorar projetos</a>");
    expect(landing).not.toContain("<a>Soluções educacionais</a>");
    expect(landing).not.toContain("<a>Conhecer mais</a>");
    expect(landing).toContain("<article className={styles.audienceCard} key={title}>");
    expect(landing).not.toContain("<a className={styles.audienceCard}");
  });

  it("describes discoverable external competitions without promising in-platform registration", () => {
    expect(plans).toContain("Explorar competições e desafios");
    expect(plans).not.toContain("Participar de competições");
    expect(competitions).toContain("scanOfficialCompetitions");
    expect(migrations).toContain("módulo de competições foi removido");
  });
});
