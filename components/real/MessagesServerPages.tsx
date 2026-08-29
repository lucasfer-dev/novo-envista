import { notFound } from "next/navigation";
import ProductShell from "@/components/real/ProductShell";
import { ConversationView, MessagesIndexView } from "@/components/real/MessagesViews";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";

type Search = Promise<Record<string,string|string[]|undefined>>;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}

export async function MessagesServerPage({expectedRole,searchParams}:{expectedRole:ProductRole;searchParams:Search}){
  const {supabase,userId,appUser}=await requireProductUser(expectedRole);
  const query=await searchParams;
  const {data:conversations}=await supabase.from("direct_conversations").select("id,user_a,user_b,created_at").order("created_at",{ascending:false});
  const rows=conversations??[];
  const targetIds=Array.from(new Set(rows.map((row:any)=>row.user_a===userId?row.user_b:row.user_a)));
  let profiles:any[]=[]; let messages:any[]=[];
  if(targetIds.length){const result=await supabase.from("profiles").select("id,username,display_name").in("id",targetIds);profiles=result.data??[];}
  if(rows.length){const result=await supabase.from("direct_messages").select("conversation_id,body,created_at").in("conversation_id",rows.map((row:any)=>row.id)).order("created_at",{ascending:false}).limit(250);messages=result.data??[];}
  const profileMap=new Map(profiles.map((profile:any)=>[profile.id,profile]));
  const threads=rows.map((row:any)=>{const targetId=row.user_a===userId?row.user_b:row.user_a;const profile=profileMap.get(targetId);const last=messages.find((message:any)=>message.conversation_id===row.id);return {id:row.id,targetId,targetName:profile?.display_name??"Conta privada",targetUsername:profile?.username??null,lastBody:last?.body??null,lastAt:last?.created_at??null};});
  return <ProductShell user={appUser} title="Mensagens" variant="legacyDark"><MessagesIndexView role={expectedRole} threads={threads} status={first(query.status)} error={first(query.error)}/></ProductShell>;
}

export async function ConversationServerPage({expectedRole,conversationId,searchParams}:{expectedRole:ProductRole;conversationId:string;searchParams:Search}){
  const {supabase,userId,appUser}=await requireProductUser(expectedRole); const query=await searchParams;
  const {data:conversation}=await supabase.from("direct_conversations").select("id,user_a,user_b").eq("id",conversationId).maybeSingle();
  if(!conversation)notFound();
  const targetId=conversation.user_a===userId?conversation.user_b:conversation.user_a;
  const [{data:profile},{data:messages},{data:blocks}]=await Promise.all([
    supabase.from("profiles").select("id,username,display_name,allow_messages,profile_visibility").eq("id",targetId).maybeSingle(),
    supabase.from("direct_messages").select("id,sender_id,body,created_at").eq("conversation_id",conversationId).order("created_at",{ascending:true}).limit(200),
    supabase.from("user_blocks").select("blocker_id,blocked_id").or(`and(blocker_id.eq.${conversation.user_a},blocked_id.eq.${conversation.user_b}),and(blocker_id.eq.${conversation.user_b},blocked_id.eq.${conversation.user_a})`),
  ]);
  const blockedByMe=(blocks??[]).some((block:any)=>block.blocker_id===userId&&block.blocked_id===targetId);
  const blockedMe=(blocks??[]).some((block:any)=>block.blocker_id===targetId&&block.blocked_id===userId);
  const canSend=!blockedByMe&&!blockedMe&&Boolean(profile?.allow_messages)&&profile?.profile_visibility==="platform";
  const target={id:targetId,display_name:profile?.display_name??"Conta privada",username:profile?.username??null};
  return <ProductShell user={appUser} title="Mensagens" variant="legacyDark"><ConversationView role={expectedRole} currentUserId={userId} conversationId={conversationId} target={target} messages={(messages??[]) as never[]} blockedByMe={blockedByMe} blockedMe={blockedMe} canSend={canSend} status={first(query.status)} error={first(query.error)}/></ProductShell>;
}
