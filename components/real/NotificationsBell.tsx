"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = { userId: string; prefix: "/app" | "/investor"; dark?: boolean };

function BellLink({ count, prefix, dark = false }: { count: number; prefix: "/app" | "/investor"; dark?: boolean }) {
  return (
    <Link
      href={`${prefix}/notifications`}
      prefetch={false}
      aria-label={count ? `${count} notificações não lidas` : "Notificações"}
      style={{
        position:"relative",
        display:"inline-flex",
        alignItems:"center",
        justifyContent:"center",
        width:36,
        height:36,
        borderRadius:8,
        border:dark ? "1px solid rgba(255,255,255,.08)" : "1px solid #e4e7ec",
        background:dark ? "transparent" : "#fff",
        textDecoration:"none",
        color:dark ? "#98a6b8" : "#344054",
      }}
    >
      <Bell size={17} strokeWidth={1.9} aria-hidden="true" />
      {count > 0 ? (
        <span style={{position:"absolute",top:-5,right:-5,minWidth:18,height:18,padding:"0 4px",borderRadius:999,display:"grid",placeItems:"center",background:"#ff647c",color:"white",fontSize:10,fontWeight:800}}>
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

function LiveNotificationsBell({ userId, prefix, dark = false }: Props) {
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

  return <BellLink count={count} prefix={prefix} dark={dark} />;
}

export default function NotificationsBell({ userId, prefix, dark = false }: Props) {
  if (!UUID_RE.test(userId)) return <BellLink count={0} prefix={prefix} dark={dark} />;
  return <LiveNotificationsBell userId={userId} prefix={prefix} dark={dark} />;
}
