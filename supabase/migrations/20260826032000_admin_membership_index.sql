create index admin_memberships_granted_by_idx
on public.admin_memberships (granted_by)
where granted_by is not null;
