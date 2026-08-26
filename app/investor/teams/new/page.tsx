import { NewTeamServerPage } from "@/components/real/TeamsServerPages";
export default function Page({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) { return <NewTeamServerPage expectedRole="investor" searchParams={searchParams}/>; }
