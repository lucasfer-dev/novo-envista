import { PublicProfileServerPage } from "@/components/real/SocialServerPages";
export default async function Page({params}:{params:Promise<{username:string}>}){const {username}=await params;return <PublicProfileServerPage expectedRole="participant" username={username}/>;}
