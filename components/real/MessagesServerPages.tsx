import { notFound } from "next/navigation";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import ProtectedFeatureGate from "@/components/guardian/ProtectedFeatureGate";
import { ConversationView, MessagesIndexView } from "@/components/real/MessagesViews";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";

type Search = Promise<Record<string, string | string[] | undefined>>;
const MESSAGE_PAGE_SIZE = 100;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function cursor(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
function messagesPath(role: ProductRole) { return role === "investor" ? "/investor/messages" : "/messages"; }

export async function MessagesServerPage({ expectedRole, searchParams }: { expectedRole: ProductRole; searchParams: Search }) {
  const { supabase, userId, appUser, compliance } = await requireProductUser(expectedRole);
  if (compliance.guardian_locked) {
    return (
      <LegacySocialShell user={appUser} role={expectedRole} pathname={messagesPath(expectedRole)}>
        <ProtectedFeatureGate
          feature="messages"
          nextHref={messagesPath(expectedRole)}
          returnHref={expectedRole === "investor" ? "/investor" : "/home"}
        />
      </LegacySocialShell>
    );
  }

  const query = await searchParams;

  const [{ data: summaries, error: summaryError }, { data: suggestionRows }] = await Promise.all([
    supabase.rpc("get_message_threads"),
    supabase
      .from("profiles")
      .select("id,username,display_name")
      .eq("profile_visibility", "platform")
      .eq("allow_messages", true)
      .neq("id", userId)
      .not("username", "is", null)
      .order("display_name")
      .limit(10),
  ]);
  const rows = summaryError ? [] : (summaries ?? []);
  const targetIds = Array.from(new Set(rows.map((row: any) => row.target_id).filter(Boolean)));

  let profiles: any[] = [];
  if (targetIds.length) {
    const result = await supabase.from("profiles").select("id,username,display_name").in("id", targetIds);
    profiles = result.data ?? [];
  }

  const profileMap = new Map(profiles.map((profile: any) => [profile.id, profile]));
  const threads = rows.map((row: any) => {
    const profile = profileMap.get(row.target_id);
    return {
      id: row.id,
      targetId: row.target_id,
      targetName: profile?.display_name ?? "Conta privada",
      targetUsername: profile?.username ?? null,
      lastBody: row.last_body ?? null,
      lastAt: row.last_at ?? row.created_at,
      unreadCount: Number(row.unread_count ?? 0),
    };
  });

  const suggestions = (suggestionRows ?? []).filter((item: any) => item.username).map((item: any) => ({
    id: item.id,
    username: item.username as string,
    displayName: item.display_name as string,
  }));
  const requestedTarget = first(query.to);
  let initialUsername = suggestions.find((item) => item.id === requestedTarget)?.username ?? "";
  if (!initialUsername && requestedTarget) {
    const { data: requestedProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", requestedTarget)
      .eq("profile_visibility", "platform")
      .eq("allow_messages", true)
      .maybeSingle();
    initialUsername = requestedProfile?.username ?? "";
  }

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={messagesPath(expectedRole)}>
      <MessagesIndexView
        role={expectedRole}
        threads={threads}
        suggestions={suggestions}
        initialUsername={initialUsername}
        status={first(query.status)}
        error={summaryError ? "inbox" : first(query.error)}
      />
    </LegacySocialShell>
  );
}

export async function ConversationServerPage({ expectedRole, conversationId, searchParams }: { expectedRole: ProductRole; conversationId: string; searchParams: Search }) {
  const { supabase, userId, appUser, compliance } = await requireProductUser(expectedRole);
  if (compliance.guardian_locked) {
    return (
      <LegacySocialShell user={appUser} role={expectedRole} pathname={messagesPath(expectedRole)}>
        <ProtectedFeatureGate
          feature="messages"
          nextHref={messagesPath(expectedRole)}
          returnHref={expectedRole === "investor" ? "/investor" : "/home"}
        />
      </LegacySocialShell>
    );
  }

  const query = await searchParams;
  const before = cursor(first(query.before));
  const base = messagesPath(expectedRole);
  const { data: conversation } = await supabase.from("direct_conversations").select("id,user_a,user_b").eq("id", conversationId).maybeSingle();
  if (!conversation) notFound();

  const targetId = conversation.user_a === userId ? conversation.user_b : conversation.user_a;
  let messageQuery = supabase
    .from("direct_messages")
    .select("id,sender_id,body,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(MESSAGE_PAGE_SIZE + 1);
  if (before) messageQuery = messageQuery.lt("created_at", before);

  const [{ data: profile }, { data: messageRows }, { data: blocks }] = await Promise.all([
    supabase.from("profiles").select("id,username,display_name,allow_messages,profile_visibility").eq("id", targetId).maybeSingle(),
    messageQuery,
    supabase.from("user_blocks").select("blocker_id,blocked_id").or(`and(blocker_id.eq.${conversation.user_a},blocked_id.eq.${conversation.user_b}),and(blocker_id.eq.${conversation.user_b},blocked_id.eq.${conversation.user_a})`),
  ]);

  if (!before) {
    const readAt = new Date().toISOString();
    const messageNotificationPaths = [
      `/messages/${conversationId}`,
      `/app/messages/${conversationId}`,
      `/investor/messages/${conversationId}`,
    ];
    await Promise.all([
      supabase
        .from("message_read_state")
        .upsert({ conversation_id: conversationId, user_id: userId, last_read_at: readAt }, { onConflict: "conversation_id,user_id" }),
      supabase
        .from("notifications")
        .update({ read_at: readAt })
        .eq("user_id", userId)
        .eq("kind", "message")
        .in("href", messageNotificationPaths)
        .is("read_at", null),
    ]);
  }

  const rawMessages = messageRows ?? [];
  const hasOlder = rawMessages.length > MESSAGE_PAGE_SIZE;
  const messages = rawMessages.slice(0, MESSAGE_PAGE_SIZE).reverse();
  const olderCursor = hasOlder && messages.length ? messages[0].created_at : null;
  const blockedByMe = (blocks ?? []).some((block: any) => block.blocker_id === userId && block.blocked_id === targetId);
  const blockedMe = (blocks ?? []).some((block: any) => block.blocker_id === targetId && block.blocked_id === userId);
  const canSend = !blockedByMe && !blockedMe && Boolean(profile?.allow_messages) && profile?.profile_visibility === "platform";
  const target = { id: targetId, display_name: profile?.display_name ?? "Conta privada", username: profile?.username ?? null };

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={`${base}/${conversationId}`}>
      <ConversationView
        role={expectedRole}
        currentUserId={userId}
        conversationId={conversationId}
        target={target}
        messages={messages as never[]}
        blockedByMe={blockedByMe}
        blockedMe={blockedMe}
        canSend={canSend}
        historyMode={Boolean(before)}
        hasOlder={hasOlder}
        olderCursor={olderCursor}
        status={first(query.status)}
        error={first(query.error)}
      />
    </LegacySocialShell>
  );
}
