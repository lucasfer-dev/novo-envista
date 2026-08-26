-- Policies explícitas para o schema histórico de competições.
-- As permissões de tabela continuam revogadas; estas policies apenas deixam
-- o estado de bloqueio inequívoco para RLS e para os advisors do Supabase.

do $$
begin
  if to_regclass('public.competitions') is not null then
    execute 'drop policy if exists competitions_disabled on public.competitions';
    execute 'create policy competitions_disabled on public.competitions for all to authenticated using (false) with check (false)';
  end if;

  if to_regclass('public.competition_team_registrations') is not null then
    execute 'drop policy if exists competition_registrations_disabled on public.competition_team_registrations';
    execute 'create policy competition_registrations_disabled on public.competition_team_registrations for all to authenticated using (false) with check (false)';
  end if;
end $$;
