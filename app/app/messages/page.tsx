import { MessagesServerPage } from "@/components/real/MessagesServerPages";
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <MessagesServerPage expectedRole="participant" searchParams={searchParams}/>;}
