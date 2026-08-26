import { NotificationsServerPage } from "@/components/real/NotificationsServerPages";
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <NotificationsServerPage expectedRole="participant" searchParams={searchParams}/>;}
