-- O módulo de competições foi removido do produto.
-- Mantemos as tabelas históricas para não apagar dados de forma destrutiva,
-- mas nenhum cliente autenticado pode ler ou escrever nelas.

do $$
begin
  if to_regclass('public.competitions') is not null then
    execute 'revoke all on table public.competitions from anon, authenticated';
    execute 'drop policy if exists competitions_select_platform_or_admin on public.competitions';
    execute 'drop policy if exists competitions_insert_admin on public.competitions';
    execute 'drop policy if exists competitions_update_admin on public.competitions';
    execute 'drop policy if exists competitions_delete_admin on public.competitions';
    execute 'alter table public.competitions enable row level security';
    execute 'comment on table public.competitions is ''Schema histórico inativo; módulo de competições removido do produto.''';
  end if;

  if to_regclass('public.competition_team_registrations') is not null then
    execute 'revoke all on table public.competition_team_registrations from anon, authenticated';
    execute 'drop policy if exists competition_registrations_select_platform_or_admin on public.competition_team_registrations';
    execute 'drop policy if exists competition_registrations_insert_admin on public.competition_team_registrations';
    execute 'drop policy if exists competition_registrations_update_admin on public.competition_team_registrations';
    execute 'drop policy if exists competition_registrations_delete_admin on public.competition_team_registrations';
    execute 'alter table public.competition_team_registrations enable row level security';
    execute 'comment on table public.competition_team_registrations is ''Schema histórico inativo; módulo de competições removido do produto.''';
  end if;
end $$;
