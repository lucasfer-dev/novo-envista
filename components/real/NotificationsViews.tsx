import { deleteNotificationAction, markAllNotificationsReadAction, openNotificationAction } from "@/lib/notifications/actions";
import styles from "./Notifications.module.css";

type Notification = { id:string; kind:string; title:string; body:string; href:string; read_at:string|null; created_at:string };

export function NotificationsView({notifications,status}:{notifications:Notification[];status?:string}){
 const unread=notifications.filter(item=>!item.read_at).length;
 return <>
  <div className={styles.head}>
    <div><h1>Notificações</h1><p className={styles.muted}>{unread?`${unread} não lida${unread===1?"":"s"}.`:"Tudo em dia."}</p></div>
    {unread>0?<form action={markAllNotificationsReadAction}><button className={styles.secondary}>Marcar todas como lidas</button></form>:null}
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
 </>;
}
