"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationsBell({userId,prefix}:{userId:string;prefix:"/app"|"/investor"}){
 const supabase=useMemo(()=>createClient(),[]);const [count,setCount]=useState(0);
 const refresh=useCallback(async()=>{const {count:next}=await supabase.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",userId).is("read_at",null);setCount(next??0);},[supabase,userId]);
 useEffect(()=>{void refresh();const channel=supabase.channel(`notifications:${userId}`).on("postgres_changes",{event:"*",schema:"public",table:"notifications",filter:`user_id=eq.${userId}`},()=>{void refresh();}).subscribe();return()=>{void supabase.removeChannel(channel);};},[refresh,supabase,userId]);
 return <Link href={`${prefix}/notifications`} aria-label={count?`${count} notificações não lidas`:"Notificações"} style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center",width:38,height:38,borderRadius:10,border:"1px solid #e4e7ec",textDecoration:"none",color:"#344054"}}>
  <span aria-hidden="true">🔔</span>{count>0?<span style={{position:"absolute",top:-6,right:-6,minWidth:20,height:20,padding:"0 5px",borderRadius:999,display:"grid",placeItems:"center",background:"#d92d20",color:"white",fontSize:11,fontWeight:800}}>{count>99?"99+":count}</span>:null}
 </Link>;
}
