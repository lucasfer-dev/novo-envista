import { test, expect } from "@playwright/test";

// The real participant Home requires authentication. Reproduce the actual
// navigation structure using the site's production CSS without test credentials.
const primary = ["Início", "Explorar", "Social", "Projetos", "Equipes", "Competições", "Aprender", "Investidores"];
const workspace = ["Workspace", "Mensagens", "Insights"];
const viewports = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 1366, height: 650 },
  { width: 1366, height: 580 },
];

for (const size of viewports) {
  test("sidebar fits viewport " + size.width + "x" + size.height, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/login");
    await page.evaluate(async ({ primary, workspace }) => {
      const links = (names, href) => names.map(name =>
        '<a href="' + href + '"><svg width="18" height="18" aria-hidden="true"></svg><span>' + name + '</span></a>'
      ).join("");
      document.body.innerHTML = [
        '<div class="app-shell" data-envista-product-shell data-envista-home-reference="true">',
        '<aside class="sidebar" id="app-navigation" aria-label="Navegação principal">',
        '<button class="mobile-close" aria-label="Fechar navegação">×</button>',
        '<a class="brand envista-brand-lockup" href="/home"><img src="/brand/envista-symbol-gradient.svg" alt="" /><strong>ENVISTA</strong></a>',
        '<nav aria-label="Seções do produto">' + links(primary, "/explore") + '</nav>',
        '<div class="home-nav-section"><span>Seu espaço</span><nav aria-label="Espaço de trabalho">' + links(workspace, "/workspace") + '</nav></div>',
        '<details class="home-more-menu"><summary>Mais opções</summary><div class="home-more-links">',
        '<a href="/interests">Interesses recebidos</a><a href="/calendar">Calendário</a><a href="/integrations/github">Integrações</a><a href="/account/settings">Configurações</a><a href="/account/feedback">Feedback e suporte</a>',
        '</div></details>',
        '<div class="home-nav-promo"><span class="home-promo-icon" aria-hidden="true"><svg width="27" height="27"></svg></span>',
        '<strong>Envista</strong><p>Ideias, pessoas e oportunidades para levar seus projetos mais longe.</p>',
        '<a href="/explore">Explorar projetos <span>→</span></a></div>',
        '<div class="side-bottom"><div class="user-card"><a href="/account/profile" class="profile-avatar-btn"><span class="avatar">GM</span></a>',
        '<div><b>Gabriel Marinho</b><small>@gabriel_marinho · Participante</small></div><button aria-label="Sair">↗</button></div></div>',
        '</aside></div>',
      ].join("");
      await document.fonts.ready;
    }, { primary, workspace });

    const metrics = await page.evaluate(() => {
      const sidebar = document.querySelector(".sidebar");
      const promo = document.querySelector(".home-nav-promo");
      const cta = promo.querySelector("a");
      const footer = document.querySelector(".side-bottom");
      const rect = element => element.getBoundingClientRect();
      return {
        overflow: getComputedStyle(sidebar).overflowY,
        scrollHeight: sidebar.scrollHeight,
        clientHeight: sidebar.clientHeight,
        promoVisible: getComputedStyle(promo).display !== "none",
        promoBottom: rect(promo).bottom,
        ctaBottom: rect(cta).bottom,
        footerTop: rect(footer).top,
        footerBottom: rect(footer).bottom,
        viewportHeight: window.innerHeight,
      };
    });
    expect(metrics.overflow).toBe("hidden");
    expect(metrics.scrollHeight - metrics.clientHeight, JSON.stringify(metrics)).toBeLessThanOrEqual(2);
    expect(metrics.footerBottom, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewportHeight + 1);
    if (metrics.promoVisible) {
      expect(metrics.ctaBottom, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.promoBottom - 5);
      expect(metrics.promoBottom, JSON.stringify(metrics)).toBeLessThan(metrics.footerTop);
    }

    await page.locator(".home-more-menu summary").click();
    const expanded = await page.evaluate(() => {
      const sidebar = document.querySelector(".sidebar");
      const extra = document.querySelector(".home-more-links").getBoundingClientRect();
      return { diff: sidebar.scrollHeight - sidebar.clientHeight, top: extra.top, bottom: extra.bottom, viewport: innerHeight };
    });
    expect(expanded.diff, JSON.stringify(expanded)).toBeLessThanOrEqual(2);
    expect(expanded.top).toBeGreaterThanOrEqual(0);
    expect(expanded.bottom).toBeLessThanOrEqual(expanded.viewport);
  });
}
