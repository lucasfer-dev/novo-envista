import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const notificationsServer = readFileSync("components/real/NotificationsServerPages.tsx", "utf8");
const messagesServer = readFileSync("components/real/MessagesServerPages.tsx", "utf8");
const realtime = readFileSync("components/real/MessagesRealtime.tsx", "utf8");

describe("remaining large-list pagination", () => {
  it("paginates notifications in Postgres instead of loading a fixed 100", () => {
    expect(notificationsServer).toContain("PAGE_SIZE = 30");
    expect(notificationsServer).toContain(".range(from, from + PAGE_SIZE - 1)");
    expect(notificationsServer).not.toContain(".limit(100)");
  });

  it("loads the newest message window and uses a cursor for older history", () => {
    expect(messagesServer).toContain("MESSAGE_PAGE_SIZE = 100");
    expect(messagesServer).toContain('order("created_at", { ascending: false })');
    expect(messagesServer).toContain('.lt("created_at", before)');
    expect(messagesServer).toContain("MESSAGE_PAGE_SIZE + 1");
  });

  it("keeps historical message pages read-only and non-realtime", () => {
    expect(realtime).toContain("live = true");
    expect(realtime).toContain("if (!live) return");
    expect(realtime).toContain("Volte às mensagens mais recentes");
  });
});
