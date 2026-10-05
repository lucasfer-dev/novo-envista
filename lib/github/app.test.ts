import { describe, expect, it } from "vitest";
import { summarizeGitHubEvent } from "@/lib/github/app";

describe("summarizeGitHubEvent", () => {
  it("summarizes push events without persisting the raw payload", () => {
    const summary = summarizeGitHubEvent("push", {
      ref: "refs/heads/main",
      compare: "https://github.com/envista/demo/compare/1...2",
      sender: { login: "lucas" },
      repository: {
        name: "demo",
        full_name: "envista/demo",
        html_url: "https://github.com/envista/demo",
        private: false,
      },
      commits: [{ id: "1" }, { id: "2" }],
      head_commit: {
        message: "feat: integração GitHub",
        timestamp: "2026-10-05T12:00:00Z",
      },
    });

    expect(summary).toMatchObject({
      eventType: "push",
      title: "lucas enviou 2 commits para demo",
      summary: "feat: integração GitHub",
      repositoryFullName: "envista/demo",
      isPublic: true,
    });
  });

  it("marks private repository activity as non-public", () => {
    const summary = summarizeGitHubEvent("release", {
      action: "published",
      repository: {
        name: "private-app",
        full_name: "envista/private-app",
        html_url: "https://github.com/envista/private-app",
        private: true,
      },
      release: {
        tag_name: "v1.0.0",
        html_url: "https://github.com/envista/private-app/releases/tag/v1.0.0",
        body: "Primeira versão.",
        published_at: "2026-10-05T12:00:00Z",
      },
    });

    expect(summary?.eventType).toBe("release");
    expect(summary?.isPublic).toBe(false);
  });

  it("ignores unsupported webhook events", () => {
    expect(summarizeGitHubEvent("ping", { zen: "Keep it logically awesome." })).toBeNull();
  });
});
