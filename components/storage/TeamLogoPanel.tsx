import TeamLogoUploader from "@/components/storage/TeamLogoUploader";
import { requireProductUser } from "@/lib/auth/require-product-user";
export default async function TeamLogoPanel({teamId,currentPath,canManage}:{teamId:string;currentPath?:string|null;canManage:boolean}){if(!canManage)return null;const {userId}=await requireProductUser();return <TeamLogoUploader teamId={teamId} userId={userId} currentPath={currentPath}/>;}
