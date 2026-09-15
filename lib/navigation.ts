const exactNavRoutes = new Set(["/home", "/app", "/investor", "/admin"]);

export function isNavItemActive(pathname: string, href: string) {
  if (exactNavRoutes.has(href)) return pathname === href;

  return pathname === href || pathname.startsWith(`${href}/`);
}
