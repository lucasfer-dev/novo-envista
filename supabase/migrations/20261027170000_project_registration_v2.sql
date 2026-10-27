-- Ampliação do perfil dos projetos. Campos opcionais preservam os projetos existentes.
alter table public.projects
  add column if not exists project_type text not null default 'personal',
  add column if not exists target_audience text not null default '',
  add column if not exists differentiator text not null default '',
  add column if not exists objective text not null default '',
  add column if not exists team_description text not null default '',
  add column if not exists challenges text not null default '',
  add column if not exists technologies text[] not null default '{}',
  add column if not exists collaboration_roles text[] not null default '{}',
  add column if not exists seeking_investment boolean not null default false,
  add column if not exists business_model text not null default '',
  add column if not exists target_market text not null default '',
  add column if not exists traction text not null default '',
  add column if not exists investment_amount text not null default '',
  add column if not exists use_of_funds text not null default '',
  add column if not exists pitch_deck_url text not null default '';

alter table public.projects
  add constraint projects_profile_type_valid check (project_type in ('personal', 'startup', 'academic', 'social', 'research', 'other')),
  add constraint projects_target_audience_len check (char_length(target_audience) <= 2000),
  add constraint projects_differentiator_len check (char_length(differentiator) <= 4000),
  add constraint projects_objective_len check (char_length(objective) <= 2000),
  add constraint projects_team_description_len check (char_length(team_description) <= 2000),
  add constraint projects_challenges_len check (char_length(challenges) <= 4000),
  add constraint projects_technologies_max check (cardinality(technologies) <= 20),
  add constraint projects_collaboration_roles_max check (cardinality(collaboration_roles) <= 10),
  add constraint projects_business_model_len check (char_length(business_model) <= 2000),
  add constraint projects_target_market_len check (char_length(target_market) <= 2000),
  add constraint projects_traction_len check (char_length(traction) <= 2000),
  add constraint projects_investment_amount_len check (char_length(investment_amount) <= 100),
  add constraint projects_use_of_funds_len check (char_length(use_of_funds) <= 2000),
  add constraint projects_pitch_deck_url_len check (char_length(pitch_deck_url) <= 500),
  add constraint projects_investment_data_consistency check (
    seeking_investment or (
      business_model = '' and target_market = '' and traction = ''
      and investment_amount = '' and use_of_funds = '' and pitch_deck_url = ''
    )
  );

create index if not exists projects_type_visible_idx
  on public.projects(project_type) where visibility = 'platform';
create index if not exists projects_seeking_investment_idx
  on public.projects(updated_at desc) where seeking_investment and visibility = 'platform';

comment on column public.projects.team_description is 'Resumo da equipe; a autoria efetiva é controlada por owner_user_id/owner_team_id.';
comment on column public.projects.pitch_deck_url is 'Link HTTPS para pitch deck; arquivos internos são tratados pelo sistema existente de anexos.';
