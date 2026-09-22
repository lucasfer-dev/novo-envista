import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_project_share", { project_slug: slug });
  const project = data as { title?: string; short_description?: string; category?: string; stage?: string } | null;

  const title = project?.title || "Projeto no Envista";
  const description = project?.short_description || "Projeto, portfólio e evolução em uma página pública.";
  const label = [project?.category, project?.stage].filter(Boolean).join(" · ") || "PROJETO PUBLICADO";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 78px",
          background: "#0b141f",
          color: "#f4f7fb",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: "#00bfa6", color: "#032a25", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 28 }}>E</div>
          <span style={{ fontSize: 32, fontWeight: 750 }}>Envista</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
          <span style={{ color: "#62ddcd", fontSize: 21, fontWeight: 700, marginBottom: 18 }}>{label.toUpperCase()}</span>
          <div style={{ fontSize: title.length > 48 ? 54 : 66, fontWeight: 780, lineHeight: 1.03, letterSpacing: "-2px" }}>{title}</div>
          <div style={{ color: "#a9b7c7", fontSize: 25, lineHeight: 1.35, marginTop: 22, maxWidth: 950 }}>{description.slice(0, 180)}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", color: "#718399", fontSize: 19 }}>
          <span>useenvista.com.br/p/{slug}</span>
          <span style={{ color: "#62ddcd" }}>Projeto · Portfólio · Oportunidades</span>
        </div>
      </div>
    ),
    size,
  );
}
