import { redirect } from "next/navigation";
import { requireAdminIdentity } from "@/lib/admin/require-admin";
import { AdminMfaClient } from "@/components/admin/AdminMfaClient";

export const dynamic = "force-dynamic";

export default async function AdminMfaPage() {
  const { aal, profile } = await requireAdminIdentity();
  if (aal === "aal2") redirect("/admin");

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f7f9fb", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 560, background: "white", border: "1px solid #e4e7ec", borderRadius: 20, padding: 28, boxShadow: "0 18px 50px rgba(16,24,40,.08)" }}>
        <img src="/envista-logo.png" alt="Envista" style={{ width: 48, height: 48, objectFit: "contain" }} />
        <p style={{ margin: "18px 0 6px", color: "#037fb0", fontWeight: 700 }}>Proteção administrativa</p>
        <h1 style={{ margin: 0, fontSize: 30 }}>Verificação em duas etapas</h1>
        <p style={{ color: "#667085", lineHeight: 1.6 }}>
          {profile.display_name || profile.username || "Administrador"}, o painel administrativo exige um código do seu aplicativo autenticador além da senha.
        </p>
        <AdminMfaClient />
      </section>
    </main>
  );
}
