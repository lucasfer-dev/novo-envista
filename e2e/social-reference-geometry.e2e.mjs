import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const moduleCss = readFileSync("components/social/LegacySocialFeed.module.css", "utf8")
  .replace(/:global\(([^()]+)\)/g, "$1");

const desktopViewports = [
  { width: 1672, height: 941 },
  { width: 2560, height: 932 },
  { width: 1440, height: 900 },
];

for (const viewport of desktopViewports) {
  test("Social clean layout at " + viewport.width + "x" + viewport.height, async ({ page }) => {
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
        '<section class="mainColumn"><div class="feedHeader"><div class="feedIntro"><span class="feedEyebrow">Comunidade Envista</span><h1>Social</h1><p>Conecte-se, compartilhe ideias, acompanhe projetos e converse com a comunidade Envista.</p></div><div class="heroGlobe"></div></div>',
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
        rail = get(".sideColumn"), social = get(".socialPage"), sidebar = get(".sidebar");
      return {
        headX: head.x, headY: head.y, headBottom: head.bottom, heroHeight: head.height,
        composerX: composer.x, composerY: composer.y, composerRadius: parseFloat(getComputedStyle(document.querySelector(".composer")).borderRadius),
        postY: timeline.y, railX: rail.x, railY: rail.y,
        coverHeight: cover.height, coverWidth: cover.width,
        socialWidth: social.width, socialRight: social.right,
        sidebarWidth: sidebar.width,
        documentScrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        banner: getComputedStyle(document.querySelector(".feedHeader"), "::before").content,
      };
    });

    expect(dimensions.headX, JSON.stringify(dimensions)).toBeCloseTo(dimensions.composerX, 0);
    expect(dimensions.railY, JSON.stringify(dimensions)).toBeCloseTo(dimensions.headY, 0);
    expect(dimensions.socialWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(1337);
    expect(dimensions.heroHeight, JSON.stringify(dimensions)).toBeGreaterThanOrEqual(70);
    expect(dimensions.heroHeight, JSON.stringify(dimensions)).toBeLessThanOrEqual(200);
    expect(dimensions.composerY, JSON.stringify(dimensions)).toBeGreaterThanOrEqual(dimensions.headBottom);
    expect(dimensions.composerRadius, JSON.stringify(dimensions)).toBeGreaterThanOrEqual(14);
    expect(dimensions.railX, JSON.stringify(dimensions)).toBeGreaterThan(dimensions.headX);
    expect(dimensions.coverHeight, JSON.stringify(dimensions)).toBeLessThanOrEqual(239);
    expect(dimensions.documentScrollWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(viewport.width + 1);
    expect(dimensions.banner, JSON.stringify(dimensions)).toBe("none");
  });
}
