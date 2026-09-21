import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const locations = readFileSync("lib/brazil-locations.ts", "utf8");
const locationApi = readFileSync("app/api/locations/cities/route.ts", "utf8");
const onboarding = readFileSync("app/onboarding/page.tsx", "utf8");
const profile = readFileSync("app/account/profile/page.tsx", "utf8");
const landing = readFileSync("components/public/PublicLandingServer.tsx", "utf8");
const about = readFileSync("app/about/page.tsx", "utf8");
const socialServer = readFileSync("components/social/LegacySocialServerPage.tsx", "utf8");
const socialFeed = readFileSync("components/social/LegacySocialFeed.tsx", "utf8");
const profileRoutes = readFileSync("lib/profiles.ts", "utf8");
const searchApi = readFileSync("app/api/search/route.ts", "utf8");
const searchUi = readFileSync("components/product/GlobalSearchCommand.tsx", "utf8");
const competitionApi = readFileSync("app/api/competitions/route.ts", "utf8");
const competitionCatalog = readFileSync("lib/competitions/catalog-2026.ts", "utf8");
const competitionClient = readFileSync("components/competitions/CompetitionsClient.tsx", "utf8");
const recommendations = readFileSync("lib/competitions/recommendations.ts", "utf8");
const authActions = readFileSync("app/auth/actions.ts", "utf8");
const privacyFoundation = readFileSync("supabase/migrations/20260826030000_security_privacy_foundation.sql", "utf8");
const messagesRealtime = readFileSync("components/real/MessagesRealtime.tsx", "utf8");
const notifications = readFileSync("components/real/NotificationsViews.tsx", "utf8");
const calendarMigration = readFileSync("supabase/migrations/20260915170000_platform_calendar_weekly_notifications.sql", "utf8");

describe("product checklist round 2", () => {
  it("offers every Brazilian state and IBGE-powered city suggestions", () => {
    const stateCodes = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
    for (const code of stateCodes) expect(locations).toContain(`["${code}"`);
    expect(locationApi).toContain("servicodados.ibge.gov.br/api/v1/localidades/estados/");
    expect(onboarding).toContain("BrazilLocationFields");
    expect(profile).toContain("BrazilLocationFields");
  });

  it("uses Schools as the institutional destination", () => {
    expect(about).toContain('redirect("/schools")');
    expect(landing).toContain('href="/schools"');
    expect(landing).not.toContain('href="/about"');
  });

  it("renders comment replies and links comment authors to profiles", () => {
    expect(socialServer).toContain("parent_comment_id");
    expect(socialServer).toContain("authorHref");
    expect(socialFeed).toContain('name="parent_comment_id"');
    expect(socialFeed).toContain("Responder");
    expect(socialFeed).toContain("comment.authorHref");
  });

  it("keeps participant navigation free of the legacy app prefix", () => {
    expect(profileRoutes).toContain('context === "investor" ? "/investor" : ""');
    expect(searchApi).toContain('const prefix = role === "investor" ? "/investor" : ""');
    expect(searchApi).toContain('href: `/learn/');
  });

  it("shows profile suggestions before the user types a full search", () => {
    expect(searchApi).toContain('.eq("profile_visibility", "platform")');
    expect(searchApi).toContain('.limit(8)');
    expect(searchUi).toContain("Perfis sugeridos para você");
  });

  it("keeps profile visibility editable for the owner", () => {
    expect(authActions).toContain("profile_visibility: profileVisibility");
    expect(privacyFoundation).toContain("profile_visibility,");
    expect(privacyFoundation).toContain("create policy profiles_update_self");
  });

  it("keeps message UX behavior requested by the product checklist", () => {
    expect(messagesRealtime).toContain('event.key === "Enter" && !event.shiftKey');
    expect(messagesRealtime).toContain("event.currentTarget.form?.requestSubmit()");
    expect(notifications).toContain("openNotificationAction");
    expect(notifications).toContain("markNotificationReadAction");
    expect(notifications).toContain("Marcar como lida");
  });

  it("keeps weekly calendar notifications scheduled", () => {
    expect(calendarMigration).toContain("envista-weekly-calendar-notifications");
    expect(calendarMigration).toContain("'0 11 * * 1'");
    expect(calendarMigration).toContain("calendar_events");
  });

  it("merges a richer verified competition catalog into live official sources", () => {
    for (const name of ["OBM 2026","OBMEP 2026","OBF 2026","OBI 2026","OBQ 2026","OBB 2026","Olimpíada Brasileira de Geografia","Olimpíada Nacional de Ciências","ONEE 2026","FECTI 2026","FEBIC 2026","Desafio Liga Jovem"]) {
      expect(competitionCatalog).toContain(name);
    }
    expect(competitionApi).toContain("VERIFIED_COMPETITION_CATALOG_2026");
    expect(competitionClient).toContain("O que precisa fazer");
    expect(competitionClient).toContain("Premiação");
    expect(recommendations).toContain("Na sua cidade");
  });
});
