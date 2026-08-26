import { SocialServerPage } from "@/components/real/SocialServerPages";
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <SocialServerPage expectedRole="investor" searchParams={searchParams}/>;}
