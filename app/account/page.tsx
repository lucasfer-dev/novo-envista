import Link from "next/link";
import { AuthShell, authStyles as styles } from "@/components/auth/AuthShell";
import { requireProductUser } from "@/lib/auth/require-product-user";

export default async function AccountPage(){
 const {appUser,role}=await requireProductUser();const home=role==="investor"?"/investor":"/app";
 return <AuthShell wide title="Minha conta" description="Gerencie seu perfil, privacidade e dados sem sair do fluxo principal do Envista.">
  <div className={styles.form}>
   <div className={styles.grid2}>
    <section><h2 style={{fontSize:18}}>Perfil</h2><p>Nome, foto, bio, instituição e como seu perfil aparece para outras pessoas.</p><Link className={styles.primary} href="/account/profile">Editar perfil</Link></section>
    <section><h2 style={{fontSize:18}}>Privacidade e dados</h2><p>Exporte seus dados, faça solicitações de privacidade e consulte as opções da sua conta.</p><Link className={styles.primary} href="/account/privacy">Abrir privacidade</Link></section>
    <section><h2 style={{fontSize:18}}>Senha e acesso</h2><p>Use o fluxo seguro de recuperação para definir uma nova senha quando necessário.</p><Link className={styles.secondary} href="/forgot-password">Recuperar ou trocar senha</Link></section>
    <section><h2 style={{fontSize:18}}>Voltar ao produto</h2><p>Continue de onde parou no seu painel de {role==="investor"?"investidor":"participante"}.</p><Link className={styles.secondary} href={home}>Voltar ao Envista</Link></section>
   </div>
   <p style={{marginTop:18,color:"#667085"}}>Conta atual: <strong>{appUser.name}</strong> · @{appUser.username}</p>
  </div>
 </AuthShell>;
}
