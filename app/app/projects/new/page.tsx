import { NewProjectServerPage } from "@/components/real/ProjectsServerPages";
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <NewProjectServerPage expectedRole="participant" searchParams={searchParams}/>;}
