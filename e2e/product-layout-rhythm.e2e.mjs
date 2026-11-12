import { test, expect } from "@playwright/test";

/**
 * Authenticated product geometry without production user fixtures.
 * The test loads real global CSS, then recreates only the shell landmarks.
 */
const viewports = [
  { name: "desktop-1440", width: 1440, height: 900, gutter: 24 },
  { name: "wide-1920", width: 1920, height: 1080, gutter: 32 },
  { name: "ultrawide-2560", width: 2560, height: 1080, gutter: 32 },
  { name: "tablet-820", width: 820, height: 1180, gutter: 20 },
  { name: "mobile-390", width: 390, height: 844, gutter: 16 },
];
const layoutTypes = ["standard", "home", "social", "explore"];

function attributes(type) {
  if (type === "home") return 'data-envista-home-page="true"';
  if (type === "social") return 'data-envista-social-reference="true"';
  if (type === "explore") return 'data-envista-clean-explore="true"';
  return "";
}

async function fixture(page, type) {
  await page.goto("/login");
  await page.evaluate((attributes) => {
    document.body.innerHTML =
      '<div class="app-shell" data-envista-product-shell data-envista-x-sidebar="true" ' + attributes + '>' +
      '<aside class="sidebar" aria-label="Navegação principal"></aside>' +
      '<main class="main"><header class="topbar"><span class="layout-probe-top">Busca</span></header>' +
      '<div class="page-wrap"><div class="layout-probe-card">Conteúdo</div></div></main></div>';
  }, attributes(type));
  await page.evaluate(() => document.fonts.ready);
}

for (const viewport of viewports) {
  for (const type of layoutTypes) {
    test("product " + type + " grid aligns at " + viewport.name, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await fixture(page, type);
      const geometry = await page.evaluate(() => {
        const wrapper = document.querySelector(".main > .page-wrap");
        const topbar = document.querySelector(".main > .topbar");
        const content = document.querySelector(".layout-probe-card");
        const headerProbe = document.querySelector(".layout-probe-top");
        const main = document.querySelector(".main");
        const w = wrapper.getBoundingClientRect(), m = main.getBoundingClientRect();
        const pad = getComputedStyle(wrapper), headerPad = getComputedStyle(topbar);
        return {
          gutter: parseFloat(getComputedStyle(document.querySelector(".app-shell")).getPropertyValue("--ev-page-gutter")),
          contentLeft: content.getBoundingClientRect().left,
          topbarLeft: headerProbe.getBoundingClientRect().left,
          wrapperWidth: w.width,
          mainWidth: m.width,
          paddingLeft: parseFloat(pad.paddingLeft),
          paddingRight: parseFloat(pad.paddingRight),
          headerPaddingLeft: parseFloat(headerPad.paddingLeft),
          scrollWidth: document.documentElement.scrollWidth,
          viewport: document.documentElement.clientWidth,
        };
      });
      expect(geometry.gutter, JSON.stringify(geometry)).toBe(viewport.gutter);
      expect(geometry.paddingLeft, JSON.stringify(geometry)).toBe(viewport.gutter);
      expect(geometry.paddingRight, JSON.stringify(geometry)).toBe(viewport.gutter);
      expect(Math.abs(geometry.topbarLeft - geometry.contentLeft), JSON.stringify(geometry)).toBeLessThanOrEqual(1);
      expect(geometry.scrollWidth - geometry.viewport, JSON.stringify(geometry)).toBeLessThanOrEqual(1);
      expect(geometry.wrapperWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.mainWidth + 1);
      if (type === "standard") {
        expect(geometry.wrapperWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(1601);
      } else if (viewport.width === 2560) {
        // Product dashboards use the available pane width, not an article cap.
        expect(geometry.wrapperWidth, JSON.stringify(geometry)).toBeGreaterThan(1800);
      }
    });
  }
}

test("Direct messages remain a full-height application pane", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await page.evaluate(() => {
    document.body.innerHTML =
      '<div class="app-shell" data-envista-product-shell data-envista-x-sidebar="true" data-envista-messages-layout="true">' +
      '<aside class="sidebar"></aside><main class="main">' +
      '<header class="topbar"><span>Busca</span></header>' +
      '<div class="page-wrap"><div class="layout-probe-card">Mensagens</div></div></main></div>';
  });
  const geometry = await page.evaluate(() => {
    const main = document.querySelector(".main").getBoundingClientRect();
    const wrapper = document.querySelector(".page-wrap").getBoundingClientRect();
    return { mainWidth: main.width, wrapperWidth: wrapper.width, mainHeight: main.height, wrapperHeight: wrapper.height };
  });
  expect(geometry.wrapperWidth, JSON.stringify(geometry)).toBeGreaterThan(geometry.mainWidth - 2);
  expect(geometry.mainHeight, JSON.stringify(geometry)).toBe(900);
  expect(geometry.wrapperHeight, JSON.stringify(geometry)).toBeGreaterThan(700);
});
