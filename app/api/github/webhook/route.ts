import { NextResponse } from "next/server";
import { createGitHubWebhookAdminClient } from "@/lib/github/admin";
import {
  summarizeGitHubEvent,
  syncGitHubRepositories,
  verifyGitHubWebhookSignature,
} from "@/lib/github/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const eventName = request.headers.get("x-github-event") || "";
  const deliveryId = request.headers.get("x-github-delivery");

  if (!verifyGitHubWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const installationId = Number(payload?.installation?.id);
  if (!Number.isSafeInteger(installationId) || installationId <= 0) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const supabase = createGitHubWebhookAdminClient();
    const { data: connection } = await supabase
      .from("github_connections")
      .select("user_id")
      .eq("installation_id", String(installationId))
      .maybeSingle();

    if (!connection?.user_id) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (eventName === "installation" && payload?.action === "deleted") {
      await supabase.from("github_connections").delete().eq("user_id", connection.user_id);
      return NextResponse.json({ ok: true });
    }

    if (eventName === "installation_repositories") {
      await syncGitHubRepositories(supabase, connection.user_id, installationId);
      return NextResponse.json({ ok: true, synced: true });
    }

    const summary = summarizeGitHubEvent(eventName, payload);
    if (!summary) return NextResponse.json({ ok: true, ignored: true });

    const { error } = await supabase.from("github_events").upsert(
      {
        user_id: connection.user_id,
        github_delivery_id: deliveryId,
        event_type: summary.eventType,
        event_action: summary.action,
        title: summary.title,
        summary: summary.summary,
        repository_full_name: summary.repositoryFullName,
        repository_html_url: summary.repositoryHtmlUrl,
        event_html_url: summary.eventHtmlUrl,
        is_public: summary.isPublic,
        occurred_at: summary.occurredAt,
      },
      { onConflict: "github_delivery_id", ignoreDuplicates: true },
    );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("github.webhook.failed", error);
    return NextResponse.json({ error: "webhook_failed" }, { status: 500 });
  }
}
