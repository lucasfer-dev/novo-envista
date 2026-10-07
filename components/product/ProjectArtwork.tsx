export default function ProjectArtwork({ title, category = "", large = false }: {
  title: string; category?: string | null; large?: boolean;
}) {
  const topic = `${title} ${category || ""}`.toLocaleLowerCase("pt-BR");
  const envista = title.trim().toLocaleLowerCase("pt-BR") === "envista";
  const art = /voz|áudio|audio|assistente/.test(topic) ? "voice"
    : /social|sustent|ambiente|educa|impacto/.test(topic) ? "impact" : "build";
  return <span className={`dashboard-project-mark${large ? " large" : ""}`} aria-hidden="true">
    <img src={envista ? "/brand/envista-symbol-gradient.svg" : `/brand/project-${art}.svg`} alt="" width="320" height="200" />
    {!envista && <span>{title.slice(0, 2).toUpperCase()}</span>}
  </span>;
}
