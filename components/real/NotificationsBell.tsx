"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function BellLink({ count, prefix }: { count: number; prefix: "/app" | "/investor" }) {
  return (
    <Link
      href={`${prefix}/notifications`}
      prefetch={false}
      aria-label={count ? `${count} notificações não lidas` : "Notificações"}
      style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center",width:38,height:38,borderRadius:10,border:"1px solid #e4e7ec",textDecoration:"none",color:"#344054"}}
    >
      <span aria-hidden="true">🔔</span>
      {count > 0 ? (
        <span style={{position:"absolute",top:-6,right:-6,minWidth:20,height:20,padding:"0 5px",borderRadius:999,display:"grid",placeItems:"center",background:"#d92d20",color:"white",fontSize:11,fontWeight:800}}>
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

function LiveNotificationsBell({ userId, prefix }: { userId: string; prefix: "/app" | "/investor" }) {
  const supabase = useMemo(() => createClient(), []);
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { count: next, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);
      if (!error) setCount(next ?? 0);
    } catch {
      setCount(0);
    }
  }, [supabase, userId]);

  useEffect(() => {
    void refresh();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          () => { void refresh(); },
        )
        .subscribe();
    } catch {
      channel = null;
    }
    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [refresh, supabase, userId]);

  return <BellLink count={count} prefix={prefix} />;
}

export default function NotificationsBell({ userId, prefix }: { userId: string; prefix: "/app" | "/investor" }) {
  if (!UUID_RE.test(userId)) return <BellLink count={0} prefix={prefix} />;
  return <LiveNotificationsBell userId={userId} prefix={prefix} />;
}
