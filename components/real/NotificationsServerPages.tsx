import ProductShell from "@/components/real/ProductShell";
import { NotificationsView } from "@/components/real/NotificationsViews";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";

type Search = Promise<Record<string, string | string[] | undefined>>;
const PAGE_SIZE = 30;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function positivePage(value: string | undefined) { const page = Number(value); return Number.isSafeInteger(page) && page > 0 ? page : 1; }

export async function NotificationsServerPage({ expectedRole, searchParams }: { expectedRole: ProductRole; searchParams: Search }) {
  const { supabase, appUser } = await requireProductUser(expectedRole);
  const query = await searchParams;
  const requestedPage = positivePage(first(query.page));
  const basePath = expectedRole === "investor" ? "/investor/notifications" : "/app/notifications";

  const [{ count: totalCount }, { count: unreadCount }] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);

  const pageCount = Math.max(1, Math.ceil((totalCount ?? 0) / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const from = (page - 1) * PAGE_SIZE;
  const { data } = await supabase
    .from("notifications")
    .select("id,kind,title,body,href,read_at,created_at")
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  return (
    <ProductShell user={appUser} title="Notificações" variant="legacyDark">
      <NotificationsView
        notifications={(data ?? []) as never[]}
        status={first(query.status)}
        unreadTotal={unreadCount ?? 0}
        page={page}
        pageCount={pageCount}
        total={totalCount ?? 0}
        basePath={basePath}
      />
    </ProductShell>
  );
}
