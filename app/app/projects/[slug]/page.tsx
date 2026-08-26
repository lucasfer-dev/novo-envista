import { ProjectServerDetail } from "@/components/real/ProjectsServerPages";
export default async function Page({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {slug}=await params;return <ProjectServerDetail expectedRole="participant" slug={slug} searchParams={searchParams}/>;}
