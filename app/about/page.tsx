import { redirect } from "next/navigation";

export const metadata = {
  title: "Para escolas | Envista",
  description: "Use o Envista para conectar aprendizagem prática, equipes, projetos e oportunidades dentro da escola.",
};

export default function AboutPage() {
  redirect("/schools");
}
