import { TeamServerDetail } from "@/components/real/TeamsServerPages";
export default async function Page({ params, searchParams }: { params: Promise<{slug:string}>; searchParams: Promise<Record<string,string|string[]|undefined>> }) { const { slug } = await params; return <TeamServerDetail expectedRole="investor" slug={slug} searchParams={searchParams}/>; }
