import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const actions = readFileSync("lib/messages/actions.ts", "utf8");
const serverPages = readFileSync("components/real/MessagesServerPages.tsx", "utf8");
const realtime = readFileSync("components/real/MessagesRealtime.tsx", "utf8");
const views = readFileSync("components/real/MessagesViews.tsx", "utf8");
const css = readFileSync("components/real/Messages.module.css", "utf8");
const migration = readFileSync("supabase/migrations/20260915192918_sync_message_read_notifications.sql", "utf8");

describe("messages UX and read state", () => {
  it("uses the clean participant messages URL", () => {
    expect(actions).toContain('return role === "investor" ? "/investor/messages" : "/messages";');
    expect(serverPages).toContain('return role === "investor" ? "/investor/messages" : "/messages";');
  });

  it("marks both clean and legacy message notifications as read", () => {
    expect(serverPages).toContain('`/messages/${conversationId}`');
    expect(serverPages).toContain('`/app/messages/${conversationId}`');
    expect(serverPages).toContain('.eq("kind", "message")');
    expect(serverPages).toContain('.update({ read_at: readAt })');
  });

  it("keeps read state synchronized while a conversation is open", () => {
    expect(realtime).toContain('from("message_read_state").upsert');
    expect(realtime).toContain('from("notifications")');
    expect(realtime).toContain('.update({ read_at: readAt })');
    expect(realtime).toContain('void markRead();');
  });

  it("syncs notifications from the semantic read-state in Postgres", () => {
    expect(migration).toContain("after insert or update of last_read_at on public.message_read_state");
    expect(migration).toContain("update public.notifications");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("and kind = 'message'");
  });

  it("renders a conversation-first inbox and a focused chat shell", () => {
    expect(views).toContain("Caixa de entrada");
    expect(views).toContain("Suas conversas");
    expect(views).toContain("Nova conversa");
    expect(views).toContain("conversationShell");
    expect(views).toContain("unreadBadge");
    expect(css).toContain(".inboxLayout");
    expect(css).toContain(".threadUnread");
    expect(css).toContain(".conversationShell");
    expect(css).toContain("100dvh");
  });

  it("sends on Enter while preserving Shift+Enter for a line break", () => {
    expect(realtime).toContain('event.key === "Enter" && !event.shiftKey');
    expect(realtime).toContain("event.currentTarget.form?.requestSubmit()");
    expect(realtime).toContain("Shift + Enter quebra a linha");
  });
});
