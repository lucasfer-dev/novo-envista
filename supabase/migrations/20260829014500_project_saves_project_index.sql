-- Cover the project_saves.project_id foreign key used by project cleanup and investor save lookups.
create index if not exists project_saves_project_idx
  on public.project_saves(project_id);
