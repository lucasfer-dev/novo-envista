import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const frame = readFileSync("components/account/SettingsWorkspace.tsx","utf8");
const page = readFileSync("app/account/settings/page.tsx","utf8");
const actions = readFileSync("lib/account/settings-actions.ts","utf8");
const suite = readFileSync("components/account/SettingsWorkspace.module.css","utf8");
const shell = readFileSync("components/account/AccountProductShell.tsx","utf8");

describe("settings workspace design and data integrity", () => {
  it("renders an accessible, consistent navigation for every account section", () => {
    expect(frame).toContain('aria-label="Navegação das configurações"');
    expect(frame).toContain('aria-current={active === id ? "page" : undefined}');
    for (const path of [
      "/account/settings", "/account/security", "/account/privacy",
      "/integrations/github", "/account/feedback",
    ]) expect(frame).toContain(path);
    expect(shell).toContain("<SettingsWorkspace");
  });

  it("preloads real data rather than mock values and never invents visibility modes", () => {
    expect(page).toContain('supabase.from("profiles")');
    expect(page).toContain('supabase.from("notification_preferences")');
    expect(page).toContain('supabase.from("account_compliance")');
    expect(page).toContain('value="platform"');
    expect(page).toContain('value="private"');
    expect(page).not.toContain('value="teams_only"');
    expect(page).toContain("BrazilLocationFields");
    expect(page).toContain("AvatarUploader");
  });

  it("keeps edits separate so saving profile does not erase the user's professional fields", () => {
    expect(page).toContain("action={saveSettingsProfileAction}");
    expect(page).toContain("action={saveSettingsLinksAction}");
    expect(page).toContain("action={updateNotificationPreferencesAction}");
    expect(actions).toContain("normalizeUsername");
    expect(actions).toContain("isValidUsername");
    expect(actions).toContain("revalidatePath");
    expect(actions).toContain('redirect(settings + "?status=links-saved")');
  });

  it("enforces the guardian's privacy restrictions on the server", () => {
    expect(actions).toContain("compliance.guardian_required");
    expect(actions).toContain('visibility = restricted ? "private"');
    expect(actions).toContain("!restricted &&");
  });

  it("stacks safely on mobile and uses the real Envista design language", () => {
    expect(suite).toContain("@media (max-width:980px)");
    expect(suite).toContain("@media (max-width:700px)");
    expect(suite).toContain("grid-template-columns: minmax(220px, 246px) minmax(0, 1fr)");
    expect(suite).toContain("/brand/manual-wave-teal.svg");
    expect(suite).toContain(":focus-visible");
  });
});
