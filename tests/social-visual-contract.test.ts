import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const feed = readFileSync("components/social/LegacySocialFeed.tsx", "utf8");
const stylesheet = readFileSync("components/social/LegacySocialFeed.module.css", "utf8");
const page = readFileSync("components/social/LegacySocialServerPage.tsx", "utf8");
const shell = readFileSync("components/social/LegacySocialShell.tsx", "utf8");
const competitions = readFileSync("components/social/SocialCompetitionSpotlight.tsx", "utf8");

describe("approved social UI / UX and existing functional contracts", () => {
  it("shows the full social interface without invented posts or metrics", () => {
    expect(feed).toContain("Conecte-se, compartilhe ideias, acompanhe projetos");
    expect(feed).toContain("SocialCompetitionSpotlight");
    expect(feed).toContain("Assuntos em pauta");
    expect(feed).toContain("Sugestões de pessoas");
    expect(feed).toContain("Próximos eventos");
    expect(feed).toContain("items.map((item)");
    expect(feed).not.toContain("142 curtidas");
    expect(feed).not.toContain("1.324 publicações");
  });

  it("preserves secure and real post workflows", () => {
    expect(feed).toContain('action={createPostAction}');
    expect(feed).toContain('name="visibility" defaultValue="private"');
    expect(feed).toContain('<option value="platform">Público no Envista</option>');
    expect(feed).toContain('name="project_id"');
    expect(feed).toContain('name="github_repository_id"');
    expect(feed).toContain('action={togglePostLikeAction}');
    expect(feed).toContain('action={addPostCommentAction}');
    expect(feed).toContain('action={toggleFollowAction}');
    expect(feed).toContain('action={deletePostAction}');
    expect(feed).toContain('composerDraftKey');
  });

  it("uses real events and competition sources with meaningful empty states", () => {
    expect(page).toContain('from("platform_calendar_events")');
    expect(competitions).toContain('fetch("/api/competitions"');
    expect(competitions).toContain('item.status === "OPEN" || item.status === "UPCOMING"');
    expect(feed).toContain('agenda.length ?');
    expect(feed).toContain('Sem novas pessoas para sugerir agora.');
  });

  it("uses approved participant navigation and responsive styles", () => {
    expect(shell).toContain('pathname === "/social"');
    expect(stylesheet).toContain(".socialLayout {");
    expect(stylesheet).toContain(".competitionPanel {");
    expect(stylesheet).toContain(".projectCover {");
    expect(stylesheet).toContain("@media (max-width:760px)");
    expect(stylesheet).toContain("prefers-reduced-motion:reduce");
  });
});
