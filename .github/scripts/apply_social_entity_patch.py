from pathlib import Path

def patch(path, replacements):
    p=Path(path); text=p.read_text(encoding='utf-8')
    for old,new,label in replacements:
        if old not in text: raise SystemExit(f'pattern not found: {path} / {label}')
        text=text.replace(old,new,1)
    p.write_text(text,encoding='utf-8')

patch('components/real/TeamsViews.tsx',[
('import TeamLogoPanel from "@/components/storage/TeamLogoPanel";\n','import TeamLogoPanel from "@/components/storage/TeamLogoPanel";\nimport FollowEntityButton from "@/components/real/FollowEntityButton";\nimport EntityPostsPanel from "@/components/real/EntityPostsPanel";\n','social imports'),
('        <span className={styles.pill}>{team.visibility === "private" ? "Privada" : "Na plataforma"}</span>','        <div className={styles.actions}><span className={styles.pill}>{team.visibility === "private" ? "Privada" : "Na plataforma"}</span>{team.visibility === "platform" ? <FollowEntityButton targetType="team" targetId={team.id} returnTo={`${base}/${team.slug}`} /> : null}</div>','team follow'),
('          </section>\n        </div>\n\n        <aside className={styles.stack}>','          </section>\n          <EntityPostsPanel teamId={team.id} />\n        </div>\n\n        <aside className={styles.stack}>','team feed'),
])
patch('components/real/ProjectsViews.tsx',[
('import ProjectFilesPanel from "@/components/storage/ProjectFilesPanel";\n','import ProjectFilesPanel from "@/components/storage/ProjectFilesPanel";\nimport FollowEntityButton from "@/components/real/FollowEntityButton";\n','project follow import'),
('<div className={styles.meta}><span className={styles.pill}>{project.stage}</span><span className={styles.pill}>{project.visibility==="private"?"Privado":"Na plataforma"}</span></div>','<div className={styles.meta}><span className={styles.pill}>{project.stage}</span><span className={styles.pill}>{project.visibility==="private"?"Privado":"Na plataforma"}</span>{project.visibility === "platform" ? <FollowEntityButton targetType="project" targetId={project.id} returnTo={`${base}/${project.slug}`} /> : null}</div>','project follow'),
])
