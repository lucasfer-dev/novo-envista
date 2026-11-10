import LegacySocialShell from "@/components/social/LegacySocialShell";
import { NotificationsView } from "@/components/real/NotificationsViews";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";

type Search = Promise<Record<string, string | string[] | undefined>>;
const PAGE_SIZE = 30;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function positivePage(value: string | undefined) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export async function NotificationsServerPage({
  expectedRole,
  searchParams,
}: {
  expectedRole: ProductRole;
  searchParams: Search;
}) {
  const { supabase, appUser, userId } = await requireProductUser(expectedRole);
  const query = await searchParams;
  const filter = first(query.filter) === "unread" ? "unread" as const : "all" as const;
  const requestedPage = positivePage(first(query.page));
  const basePath = expectedRole === "investor" ? "/investor/notifications" : "/app/notifications";

  const [{ count: totalCount }, { count: unreadCount }] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
  ]);

  const filteredTotal = filter === "unread" ? (unreadCount ?? 0) : (totalCount ?? 0);
  const pageCount = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const from = (page - 1) * PAGE_SIZE;

  let notificationsQuery = supabase
    .from("notifications")
    .select("id,kind,title,body,href,read_at,created_at")
    .eq("user_id", userId);

  if (filter === "unread") {
    notificationsQuery = notificationsQuery.is("read_at", null);
  }

  const { data } = await notificationsQuery
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  return (
    <LegacySocialShell user={appUser} role={expectedRole} pathname={basePath}>
      <NotificationsView
        notifications={(data ?? []) as never[]}
        status={first(query.status)}
        unreadTotal={unreadCount ?? 0}
        page={page}
        pageCount={pageCount}
        total={filteredTotal}
        basePath={basePath}
        filter={filter}
      />
    </LegacySocialShell>
  );
}
