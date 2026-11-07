import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// Faithful geometry check against the approved 1672x941 Social reference.
// Browser-driven: uses the real global styles and Social CSS Module source
// on an isolated, authentication-free fixture, not just string snapshots.
// Production still renders real items and may have different content.
const moduleCss = readFileSync("components/social/LegacySocialFeed.module.css", "utf8")
  .replace(/:global\(([^()]+)\)/g, "$1");

const desktopViewports = [
  { width: 1672, height: 941, reference: true },
  { width: 2560, height: 932, reference: false },
  { width: 1440, height: 900, reference: false },
];

for (const viewport of desktopViewports) {
  test("Social reference geometry at " + viewport.width + "x" + viewport.height, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/login");

    await page.evaluate(() => {
      document.body.innerHTML = [
        '<div class="app-shell" data-envista-product-shell data-envista-home-reference="true" data-envista-social-reference="true">',
        '<aside class="sidebar"><div class="brand">ENVISTA</div>',
        '<nav><a>Início</a><a>Explorar</a><a class="active">Social</a><a>Projetos</a><a>Equipes</a><a>Competições</a><a>Aprender</a><a>Investidores</a></nav>',
        '<div class="home-nav-section">Seu espaço</div><div class="home-nav-promo"><strong>Envista</strong></div>',
        '<div class="side-bottom">Perfil</div></aside>',
        '<main class="main"><header class="topbar"><span class="global-search">Buscar no Envista</span></header>',
        '<div class="page-wrap"><div class="socialPage"><div class="socialLayout">',
        '<section class="mainColumn"><div class="feedHeader"><h1>Social</h1><p>Conecte-se, compartilhe ideias, acompanhe projetos e converse com a comunidade Envista.</p></div>',
        '<section class="composer"><div class="composerHead"><span class="composerAvatar">GM</span><textarea placeholder="O que você quer compartilhar?"></textarea></div><div class="composerFooter"><span>Projeto&nbsp;&nbsp;&nbsp; Competição&nbsp;&nbsp;&nbsp; Evento</span><button class="publishButton">Publicar</button></div></section>',
        '<div class="timelineToolbar"><div class="feedTabs"><button class="activeTab">Para você</button><button>Seguindo</button><a class="discoverTab">Comunidade</a><a class="discoverTab">Projetos</a></div><div class="sortLabel">Mais recentes</div></div>',
        '<div class="timeline"><article class="timelineUpdate"><div class="identityRow"><span class="timelineAvatar">GM</span><span>Gabriel Marinho</span></div>',
        '<p class="postBody">Novidades no projeto: Oficina Aberta.</p><a class="projectReference"><span class="projectCover"><span class="updateArtwork"><span class="updateArtworkCopy"><span class="updateArtworkKicker">PROJETO DA COMUNIDADE</span><strong>Oficina Aberta</strong><small>Validação</small></span><span class="dashboard-project-mark"><img src="/brand/project-build.svg" /></span></span></span></a>',
        '</article></div></section><aside class="sideColumn"><section class="sideCard competitionPanel">Em destaque</section>',
        '<section class="sideCard topicPanel">Assuntos em alta</section><section class="sideCard peoplePanel">Sugestões de pessoas</section>',
        '<section class="sideCard eventsPanel">Próximos eventos</section></aside>',
        '</div></div></div></main></div>',
      ].join("");
    });
    await page.addStyleTag({ content: moduleCss });

    const dimensions = await page.evaluate(() => {
      const get = (selector) => document.querySelector(selector).getBoundingClientRect();
      const head = get(".feedHeader"), composer = get(".composer"),
        timeline = get(".timelineUpdate"), cover = get(".projectCover"),
        rail = get(".sideColumn"), wrap = get(".page-wrap"),
        social = get(".socialPage"), sidebar = get(".sidebar");
      return {
        headX: head.x, headY: head.y, composerX: composer.x,
        composerY: composer.y, postY: timeline.y, railX: rail.x, railY: rail.y,
        coverHeight: cover.height, coverWidth: cover.width,
        socialWidth: social.width, socialRight: social.right,
        wrapLeft: wrap.left, sidebarWidth: sidebar.width,
        documentScrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        banner: getComputedStyle(document.querySelector(".feedHeader"), "::before").content,
      };
    });

    expect(dimensions.headX, JSON.stringify(dimensions)).toBeCloseTo(dimensions.composerX, 0);
    expect(dimensions.railY, JSON.stringify(dimensions)).toBeCloseTo(dimensions.headY, 0);
    expect(dimensions.socialWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(1337);
    expect(dimensions.coverHeight, JSON.stringify(dimensions)).toBeLessThanOrEqual(239);
    expect(dimensions.documentScrollWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(viewport.width + 1);
    expect(dimensions.banner, JSON.stringify(dimensions)).toBe("none");

    if (viewport.reference) {
      // Approved reference: left navigation 260px, feed x295, rail x1095.
      expect(Math.abs(dimensions.sidebarWidth - 260), JSON.stringify(dimensions)).toBeLessThan(3);
      expect(Math.abs(dimensions.headX - 295), JSON.stringify(dimensions)).toBeLessThan(5);
      expect(Math.abs(dimensions.composerY - 150), JSON.stringify(dimensions)).toBeLessThan(8);
      expect(Math.abs(dimensions.railX - 1095), JSON.stringify(dimensions)).toBeLessThan(10);
    }
  });
}
