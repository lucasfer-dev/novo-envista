import { GlobalSearchServerPage } from "@/components/real/SearchServerPage";
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <GlobalSearchServerPage expectedRole="participant" searchParams={searchParams}/>;}
