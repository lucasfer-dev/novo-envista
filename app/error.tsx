"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f7f9fb",color:"#111a26"}}>
      <section style={{maxWidth:560,textAlign:"center",padding:32,border:"1px solid #e5eaf0",borderRadius:20,background:"#fff"}}>
        <img src="/envista-logo.png" alt="" style={{width:52,height:52,objectFit:"contain"}} />
        <h1>Não foi possível carregar esta página</h1>
        <p style={{color:"#667085",lineHeight:1.6}}>Tente novamente. Se o problema continuar, volte ao início e retome a navegação.</p>
        <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
          <button onClick={reset} style={{border:0,borderRadius:10,padding:"11px 16px",background:"#111a26",color:"#fff",fontWeight:700,cursor:"pointer"}}>Tentar novamente</button>
          <a href="/" style={{border:"1px solid #d9e0e8",borderRadius:10,padding:"10px 16px",color:"#223044",textDecoration:"none",fontWeight:700}}>Voltar ao início</a>
        </div>
      </section>
    </main>
  );
}
