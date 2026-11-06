import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261105230000_fix_profile_grants_and_course_publish.sql");

describe("incidents reported on 05/11/2026", () => {
  it("allows an authenticated user to update only the intended professional fields, subject to RLS", () => {
    expect(migration).toContain("grant update (headline, skills, github_url, linkedin_url, website_url)");
    expect(migration).not.toContain("grant update on table public.profiles");
    const professional = read("lib/account/professional-actions.ts");
    expect(professional).toContain("if ((githubInput && !githubUrl)");
    expect(professional).toContain("profile.professional_save_failed");
    expect(read("app/account/professional/page.tsx")).not.toContain("Não foi possível salvar. Use apenas links HTTPS válidos.");
  });

  it("preserves project inputs across each failed server save instead of redirecting to the first step", () => {
    const action = read("lib/projects/product-actions.ts");
    const wizard = read("components/projects/ProjectRegistrationWizard.tsx");
    expect(action).toContain("createProductProjectWithFeedbackAction");
    expect(action).toContain('logServerEvent("error", "project.create_failed"');
    expect(action).toContain("attempt: (_previous.attempt ?? 0) + 1");
    expect(wizard).toContain("sessionStorage.setItem(draftKey");
    expect(wizard).toContain("sessionStorage.removeItem(draftKey)");
    expect(wizard).toContain("useActionState(createProductProjectWithFeedbackAction");
    expect(wizard).toContain("result.attempt");
  });

  it("retains the user's private Social post after a failed save", () => {
    const feed = read("components/social/LegacySocialFeed.tsx");
    const action = read("lib/social-real/actions.ts");
    expect(feed).toContain("sessionStorage.setItem(composerDraftKey");
    expect(feed).toContain("setComposerBody(draft.body)");
    expect(feed).toContain("status?.startsWith(\"posted\")");
    expect(action).toContain('"social.post_create_failed"');
  });

  it("does not count or complete unpublished courses and lessons", () => {
    const actions = read("lib/courses/actions.ts");
    const server = read("components/real/CoursesServerPages.tsx");
    const client = read("components/real/CoursesViews.tsx");
    expect(migration).toContain("lesson_progress_require_ready_content");
    expect(migration).toContain("courses_require_ready_content");
    expect(migration).toContain("set status='draft'");
    expect(actions).toContain("error=content");
    expect(server).toContain("lesson.content_md");
    expect(client).toContain("contentReady");
    expect(client).toContain("!contentReady?");
  });
});
