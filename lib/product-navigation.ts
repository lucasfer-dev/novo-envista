import type { ProductRole } from "@/lib/auth/require-product-user";

export function normalizeProductPath(path: string) {
  if (path === "/app") return "/home";
  return path.startsWith("/app/") ? path.slice(4) : path;
}

export function productNavigation(role: ProductRole) {
  const investor = role === "investor";
  const prefix = investor ? "/investor" : "";
  return [
    { href: investor ? "/investor" : "/home", label: "Início", icon: "home" },
    { href: `${prefix}/explore`, label: "Explorar", icon: "explore" },
    { href: investor ? "/investor/saved" : "/app/projects", label: "Projetos", icon: "projects" },
    { href: `${prefix}/competitions`, label: "Competições", icon: "competitions" },
    { href: `${prefix}/messages`, label: "Mensagens", icon: "messages" },
  ] as const;
}

export function productNavActive(path: string, href: string) {
  const normalized = normalizeProductPath(path);
  const target = normalizeProductPath(href);
  if (target === "/home") return ["/home", "/social"].includes(normalized);
  if (target === "/investor") return ["/investor", "/investor/social"].includes(normalized);
  if (target === "/projects" && ["/teams", "/workspace", "/insights", "/interests"].some(p => normalized === p || normalized.startsWith(`${p}/`))) return true;
  if (target === "/investor/saved" && ["/investor/projects", "/investor/teams", "/investor/interests", "/investor/following"].some(p => normalized === p || normalized.startsWith(`${p}/`))) return true;
  if (target.endsWith("/competitions") && normalized === target.replace("/competitions", "/calendar")) return true;
  return normalized === target || normalized.startsWith(`${target}/`);
}
