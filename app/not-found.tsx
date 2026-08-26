import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f7f9fb",color:"#111a26"}}>
      <section style={{maxWidth:560,textAlign:"center",padding:32,border:"1px solid #e5eaf0",borderRadius:20,background:"#fff"}}>
        <img src="/envista-logo.png" alt="" style={{width:52,height:52,objectFit:"contain"}} />
        <p style={{fontWeight:800,color:"#0095ad",marginBottom:8}}>404</p>
        <h1 style={{margin:"0 0 10px"}}>Página não encontrada</h1>
        <p style={{color:"#667085",lineHeight:1.6}}>Este endereço não existe ou não está mais disponível no Envista.</p>
        <Link href="/" style={{display:"inline-flex",marginTop:12,padding:"11px 16px",borderRadius:10,background:"#111a26",color:"#fff",textDecoration:"none",fontWeight:700}}>Voltar ao início</Link>
      </section>
    </main>
  );
}
