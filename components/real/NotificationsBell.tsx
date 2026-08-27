"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationsBell({ userId, prefix }: { userId: string; prefix: "/app" | "/investor" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let disposed = false;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    let supabase: ReturnType<typeof createClient> | null = null;

    async function start() {
      try {
        supabase = createClient();
        const { count: next } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .is("read_at", null);

        if (!disposed) setCount(next ?? 0);

        channel = supabase
          .channel(`notifications:${userId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
            async () => {
              try {
                if (!supabase || disposed) return;
                const { count: refreshed } = await supabase
                  .from("notifications")
                  .select("id", { count: "exact", head: true })
                  .eq("user_id", userId)
                  .is("read_at", null);
                if (!disposed) setCount(refreshed ?? 0);
              } catch {
                // Realtime é progressivo e nunca deve derrubar o shell.
              }
            },
          )
          .subscribe();
      } catch {
        // Mantém o link funcional mesmo sem badge quando o cliente ou Realtime falhar.
      }
    }

    void start();

    return () => {
      disposed = true;
      if (supabase && channel) void supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href={`${prefix}/notifications`}
      aria-label={count ? `${count} notificações não lidas` : "Notificações"}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, border: "1px solid #e4e7ec", textDecoration: "none", color: "#344054" }}
    >
      <Bell aria-hidden="true" size={18} strokeWidth={1.9} />
      {count > 0 ? (
        <span style={{ position: "absolute", top: -6, right: -6, minWidth: 20, height: 20, padding: "0 5px", borderRadius: 999, display: "grid", placeItems: "center", background: "#d92d20", color: "white", fontSize: 11, fontWeight: 800 }}>
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
