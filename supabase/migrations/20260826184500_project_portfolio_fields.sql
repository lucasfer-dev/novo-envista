alter table public.projects
  add column if not exists impact text not null default '',
  add column if not exists needs text[] not null default '{}',
  add column if not exists website_url text not null default '',
  add column if not exists repository_url text not null default '';

alter table public.projects
  drop constraint if exists projects_impact_length,
  add constraint projects_impact_length check (char_length(impact) <= 6000),
  drop constraint if exists projects_website_url_length,
  add constraint projects_website_url_length check (char_length(website_url) <= 500),
  drop constraint if exists projects_repository_url_length,
  add constraint projects_repository_url_length check (char_length(repository_url) <= 500),
  drop constraint if exists projects_needs_count,
  add constraint projects_needs_count check (cardinality(needs) <= 20);
