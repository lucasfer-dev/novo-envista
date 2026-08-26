import { notFound } from "next/navigation";
import EnvistaApp from "@/components/EnvistaApp";

function isProtectedProductPath(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/") || pathname === "/investor" || pathname.startsWith("/investor/");
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const pathname = slug.length ? `/${slug.join("/")}` : "/";

  // As áreas autenticadas possuem rotas reais próprias. Uma rota interna que
  // não existe deve retornar 404 em vez de cair silenciosamente no MVP mock.
  if (isProtectedProductPath(pathname)) notFound();

  return <EnvistaApp />;
}
