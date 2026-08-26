import Link from "next/link";
import styles from "./AdminShell.module.css";

type Props={profile:{username:string;display_name:string};title:string;children:React.ReactNode};

export default function AdminShell({profile,title,children}:Props){
 const nav=[["/admin","Visão geral"],["/admin/users","Usuários"],["/admin/courses","Cursos"],["/admin/moderation","Moderação"],["/admin/privacy","Privacidade"]] as const;
 return <div className={styles.shell}>
  <aside className={styles.side}>
   <Link className={styles.brand} href="/admin"><img src="/envista-logo.png" alt=""/><span>Envista Admin</span></Link>
   <nav className={styles.nav} aria-label="Administração">{nav.map(([href,label])=><Link href={href} key={href}>{label}</Link>)}</nav>
   <div className={styles.meta}><strong>{profile.display_name}</strong><span>@{profile.username}</span></div>
  </aside>
  <main className={styles.main}><header className={styles.top}><strong>{title}</strong><span className={styles.badge}>Admin verificado</span></header><div className={styles.content}>{children}</div></main>
 </div>;
}
