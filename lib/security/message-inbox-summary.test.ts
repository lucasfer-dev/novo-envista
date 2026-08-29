import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("message inbox summaries", () => {
  it("computes inbox activity and unread counts in Postgres", () => {
    const migration = read("supabase/migrations/20260829020000_message_thread_summaries.sql");
    expect(migration).toContain("create or replace function public.get_message_threads()");
    expect(migration).toContain("unread_count bigint");
    expect(migration).toContain("message.created_at > s.last_read_at");
    expect(migration).toContain("grant execute on function public.get_message_threads() to authenticated");
  });

  it("does not scan a fixed batch of messages in the inbox server page", () => {
    const serverPage = read("components/real/MessagesServerPages.tsx");
    expect(serverPage).toContain('supabase.rpc("get_message_threads")');
    expect(serverPage).not.toContain('.limit(250)');
  });

  it("shows unread counts in the inbox", () => {
    const view = read("components/real/MessagesViews.tsx");
    expect(view).toContain("unreadCount");
    expect(view).toContain("unreadBadge");
  });
});
