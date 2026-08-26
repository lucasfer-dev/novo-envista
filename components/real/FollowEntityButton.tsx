import { requireProductUser } from "@/lib/auth/require-product-user";
import { toggleFollowAction } from "@/lib/social-real/actions";
import styles from "./Social.module.css";

type TargetType="profile"|"team"|"project";
export default async function FollowEntityButton({targetType,targetId,returnTo}:{targetType:TargetType;targetId:string;returnTo:string}){
 const {supabase,userId}=await requireProductUser(); if(targetType==="profile"&&targetId===userId)return null;
 const column=targetType==="profile"?"target_profile_id":targetType==="team"?"target_team_id":"target_project_id";
 const {data}=await supabase.from("follows").select("follower_id").eq("follower_id",userId).eq(column,targetId).maybeSingle();
 return <form action={toggleFollowAction}><input type="hidden" name="target_type" value={targetType}/><input type="hidden" name="target_id" value={targetId}/><input type="hidden" name="return_to" value={returnTo}/><button className={styles.follow}>{data?"Seguindo":"Seguir"}</button></form>;
}
