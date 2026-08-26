import { notFound } from "next/navigation";
import ProductShell from "@/components/real/ProductShell";
import { NewTeamView, TeamDetailView, TeamsIndex } from "@/components/real/TeamsViews";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";

type Search = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function TeamsServerIndex({ expectedRole, searchParams }: { expectedRole: ProductRole; searchParams: Search }) {
  const { supabase, userId, appUser } = await requireProductUser(expectedRole);
  const query = await searchParams;
  const [{ data: memberships }, { data: invitations }] = await Promise.all([
    supabase
      .from("team_members")
      .select("role_label,access_level,joined_at,teams(id,slug,name,description,category,city,institution,tags,visibility,owner_id)")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false }),
    supabase
      .from("team_invitations")
      .select("id,role_label,access_level,teams(id,slug,name)")
      .eq("invitee_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <ProductShell user={appUser} title="Equipes">
      <TeamsIndex
        role={expectedRole}
        memberships={(memberships ?? []) as never[]}
        invitations={(invitations ?? []) as never[]}
        status={first(query.status)}
        error={first(query.error)}
      />
    </ProductShell>
  );
}

export async function NewTeamServerPage({ expectedRole, searchParams }: { expectedRole: ProductRole; searchParams: Search }) {
  const { appUser } = await requireProductUser(expectedRole);
  const query = await searchParams;
  return <ProductShell user={appUser} title="Criar equipe"><NewTeamView role={expectedRole} error={first(query.error)} /></ProductShell>;
}

export async function TeamServerDetail({ expectedRole, slug, searchParams }: { expectedRole: ProductRole; slug: string; searchParams: Search }) {
  const { supabase, userId, appUser } = await requireProductUser(expectedRole);
  const query = await searchParams;
  const { data: team } = await supabase
    .from("teams")
    .select("id,slug,name,description,category,city,institution,tags,visibility,owner_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!team) notFound();

  const { data: membership } = await supabase
    .from("team_members")
    .select("access_level")
    .eq("team_id", team.id)
    .eq("user_id", userId)
    .maybeSingle();
  const canManage = team.owner_id === userId || membership?.access_level === "owner" || membership?.access_level === "admin";

  const membersPromise = supabase
    .from("team_members")
    .select("user_id,role_label,access_level,joined_at,profiles!team_members_user_id_fkey(id,username,display_name,avatar_path)")
    .eq("team_id", team.id)
    .order("joined_at", { ascending: true });
  const invitationsPromise = canManage
    ? supabase
        .from("team_invitations")
        .select("id,invitee_id,role_label,access_level,created_at,profiles!team_invitations_invitee_id_fkey(username,display_name)")
        .eq("team_id", team.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : Promise.resolve({ data: [] as unknown[] });

  const [{ data: members }, { data: invitations }] = await Promise.all([membersPromise, invitationsPromise]);

  return (
    <ProductShell user={appUser} title={team.name}>
      <TeamDetailView
        role={expectedRole}
        user={appUser}
        team={team as never}
        members={(members ?? []) as never[]}
        invitations={(invitations ?? []) as never[]}
        canManage={Boolean(canManage)}
        status={first(query.status)}
        error={first(query.error)}
      />
    </ProductShell>
  );
}
