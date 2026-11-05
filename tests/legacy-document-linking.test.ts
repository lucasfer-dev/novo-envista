import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20261105030000_legacy_document_linking.sql", "utf8");
const action = readFileSync("lib/account/security-actions.ts", "utf8");
const page = readFileSync("app/account/security/page.tsx", "utf8");

describe("private login identifiers for legacy accounts", () => {
  it("does not let public or signed-in API callers write someone else's identifier", () => {
    expect(migration).toContain("revoke all on function public.link_legacy_login_document");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
    expect(migration).toContain("private.cpf_identifier_hash");
    expect(migration).toContain("on conflict do nothing");
    expect(migration).toContain("consume_private_rate_limit");
  });

  it("requires verified account ownership and password reauthentication", () => {
    expect(action).toContain("currentUser()");
    expect(action).toContain("user.email_confirmed_at");
    expect(action).toContain("signInWithPassword");
    expect(action).toContain("passwordCheck.user?.id !== user.id");
    expect(action).toContain('formData.get("document_declaration") === "on"');
    expect(action).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("only shows the link form when the verified user has no mapping", () => {
    expect(page).toContain('supabase.rpc("has_my_login_document")');
    expect(page).toContain("documentStatusError");
    expect(page).toContain("hasLoginDocument ?");
    expect(page).toContain("linkLoginDocumentAction");
    expect(page).not.toContain("cpf_hash");
  });
});
