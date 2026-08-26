import { TeamsServerIndex } from "@/components/real/TeamsServerPages";
export default function Page({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) { return <TeamsServerIndex expectedRole="participant" searchParams={searchParams}/>; }
