from pathlib import Path

def patch(path, replacements):
    p=Path(path); text=p.read_text(encoding='utf-8')
    for old,new,label in replacements:
        if old not in text: raise SystemExit(f'pattern not found: {path} / {label}')
        text=text.replace(old,new,1)
    p.write_text(text,encoding='utf-8')

patch('components/real/TeamsViews.tsx',[
('import Link from "next/link";\n','import Link from "next/link";\nimport TeamLogoPanel from "@/components/storage/TeamLogoPanel";\n','team logo import'),
('  owner_id: string;\n};','  owner_id: string;\n  logo_path: string | null;\n};','team logo type'),
('        <aside className={styles.stack}>\n          {canManage && <section className={styles.card}>\n            <h3>Convidar membro</h3>','        <aside className={styles.stack}>\n          <TeamLogoPanel teamId={team.id} currentPath={team.logo_path} canManage={canManage} />\n          {canManage && <section className={styles.card}>\n            <h3>Convidar membro</h3>','team logo panel'),
])
patch('components/real/TeamsServerPages.tsx',[
('teams(id,slug,name,description,category,city,institution,tags,visibility,owner_id)','teams(id,slug,name,description,category,city,institution,tags,visibility,owner_id,logo_path)','team list logo'),
('id,slug,name,description,category,city,institution,tags,visibility,owner_id")','id,slug,name,description,category,city,institution,tags,visibility,owner_id,logo_path")','team detail logo'),
])
patch('components/real/ProjectsViews.tsx',[
('import Link from "next/link";\n','import Link from "next/link";\nimport ProjectFilesPanel from "@/components/storage/ProjectFilesPanel";\n','project files import'),
('</section></div>\n <aside className={styles.stack}>','</section><ProjectFilesPanel projectId={project.id} slug={project.slug} canEdit={canEdit} /></div>\n <aside className={styles.stack}>','project files panel'),
])
