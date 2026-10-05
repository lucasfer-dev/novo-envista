import Link from "next/link";
import { ArrowRight, FolderKanban, Trophy } from "lucide-react";
import { requireProductUser, type ProductRole } from "@/lib/auth/require-product-user";
import ProjectCard from "./ProjectCard";
import { loadProjectMedia } from "@/lib/projects/media";
import styles from "./HomeProjectRail.module.css";

export default async function HomeProjectRail({ role }: { role: ProductRole }) {
  const { supabase, userId, appUser } = await requireProductUser(role);
  const investor = role === "investor";
  const { data: memberships } = !investor ? await supabase.from("team_members").select("team_id").eq("user_id", userId) : { data: [] };
  const teams = (memberships ?? []).map(m => m.team_id);
  let query = supabase.from("projects").select("id,slug,title,short_description,stage,category,tags,updated_at").order("updated_at", { ascending: false }).limit(2);
  query = investor ? query.eq("visibility", "platform") : teams.length ? query.or(`owner_user_id.eq.${userId},owner_team_id.in.(${teams.join(",")})`) : query.eq("owner_user_id", userId);
  const { data: projects, error } = await query;
  const media = await loadProjectMedia(supabase, (projects ?? []).map(p => p.id));
  return <section className={styles.rail}>
    <header className={styles.heading}><div><h1>Olá, {appUser.name.split(" ")[0]}.</h1><p>{investor ? "Acompanhe ideias, pessoas e projetos com potencial." : "O que você vai construir hoje?"}</p></div><Link href={investor ? "/investor/explore" : "/app/projects"}>{investor ? "Explorar projetos" : "Todos os projetos"}<ArrowRight size={16} /></Link></header>
    <div className={styles.layout}><div><h2>{investor ? "Em construção no Envista" : "Continue construindo"}</h2>{error ? <p role="alert">Não foi possível carregar seus projetos. Recarregue a página.</p> : projects?.length ? <div className={styles.projects}>{projects.map(project => <ProjectCard key={project.id} project={project} cover={media.get(project.id)?.[0]?.url} href={`${investor ? "/investor" : "/app"}/projects/${project.slug}${investor ? "?from=explore" : ""}`} />)}</div> : <div className={styles.empty}><FolderKanban size={24} /><h3>Uma ideia já é um começo.</h3><p>Organize seu projeto e registre a evolução, do primeiro protótipo à próxima entrega.</p><Link className="primary" href={investor ? "/investor/explore" : "/projects/new"}>{investor ? "Descobrir projetos" : "Criar primeiro projeto"}</Link></div>}</div><aside className={styles.opportunity}><Trophy size={24} /><h2>Seu próximo passo pode ir mais longe.</h2><p>Descubra competições e oportunidades para colocar o que você construiu em movimento.</p><Link href={`${investor ? "/investor" : ""}/competitions`}>Encontrar oportunidades<ArrowRight size={16} /></Link>{!investor ? <Link href="/learn">Continuar aprendendo</Link> : <Link href="/investor/interests">Acompanhar interesses</Link>}</aside></div>
  </section>;
}
