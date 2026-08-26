import ProductShell from "@/components/real/ProductShell";
import { NotificationsView } from "@/components/real/NotificationsViews";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";

type Search=Promise<Record<string,string|string[]|undefined>>;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}

export async function NotificationsServerPage({expectedRole,searchParams}:{expectedRole:ProductRole;searchParams:Search}){
 const {supabase,appUser}=await requireProductUser(expectedRole);const query=await searchParams;
 const {data}=await supabase.from("notifications").select("id,kind,title,body,href,read_at,created_at").order("created_at",{ascending:false}).limit(100);
 return <ProductShell user={appUser} title="Notificações"><NotificationsView notifications={(data??[]) as never[]} status={first(query.status)}/></ProductShell>;
}
