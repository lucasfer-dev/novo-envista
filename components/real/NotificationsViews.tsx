import Link from "next/link";
import { deleteNotificationAction, markAllNotificationsReadAction, openNotificationAction } from "@/lib/notifications/actions";
import styles from "./Notifications.module.css";

type Notification = { id:string; kind:string; title:string; body:string; href:string; read_at:string|null; created_at:string };
function href(basePath:string,page:number){return page<=1?basePath:`${basePath}?page=${page}`;}

export function NotificationsView({notifications,status,unreadTotal,page,pageCount,total,basePath}:{notifications:Notification[];status?:string;unreadTotal:number;page:number;pageCount:number;total:number;basePath:string}){
 const totalLabel=total===1?"1 notificação":`${total} notificações`;
 return <>
  <div className={styles.head}>
    <div><h1>Notificações</h1><p className={styles.muted}>{unreadTotal?`${unreadTotal} não lida${unreadTotal===1?"":"s"}.`:`${totalLabel} · tudo em dia.`}</p></div>
    {unreadTotal>0?<form action={markAllNotificationsReadAction}><button className={styles.secondary}>Marcar todas como lidas</button></form>:null}
  </div>
  {status==="read"?<div className={styles.notice}>Todas as notificações foram marcadas como lidas.</div>:null}
  <div className={styles.list}>
    {notifications.length===0?<div className={styles.empty}>Você ainda não recebeu notificações.</div>:notifications.map(item=><article className={styles.item} data-unread={!item.read_at} key={item.id}>
      <div className={styles.content}><strong>{item.title}</strong><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString("pt-BR")}</small></div>
      <div className={styles.actions}>
        <form action={openNotificationAction}><input type="hidden" name="notification_id" value={item.id}/><input type="hidden" name="href" value={item.href}/><button className={styles.primary}>{item.read_at?"Abrir":"Ver e marcar lida"}</button></form>
        <form action={deleteNotificationAction}><input type="hidden" name="notification_id" value={item.id}/><button className={styles.danger} aria-label={`Excluir notificação: ${item.title}`}>Excluir</button></form>
      </div>
    </article>)}
  </div>
  {pageCount>1?<nav aria-label="Paginação de notificações" className={styles.actions} style={{justifyContent:"space-between",marginTop:18}}>
    {page>1?<Link className={styles.secondary} href={href(basePath,page-1)}>← Anterior</Link>:<span/>}
    <span className={styles.muted}>Página {page} de {pageCount}</span>
    {page<pageCount?<Link className={styles.secondary} href={href(basePath,page+1)}>Próxima →</Link>:<span/>}
  </nav>:null}
 </>;
}
