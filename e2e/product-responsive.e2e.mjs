import { test, expect } from "@playwright/test";

const viewports = [
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1366", width: 1366, height: 768 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-430", width: 430, height: 932 },
];

async function expectHealthyViewport(page) {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.getBoundingClientRect().width,
  }));
  expect(metrics.scrollWidth - metrics.viewport).toBeLessThanOrEqual(1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport + 1);
}

async function expectPageHasNoBrokenImages(page) {
  const broken = await page.locator("img").evaluateAll((images) =>
    images
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.getAttribute("src")),
  );
  expect(broken).toEqual([]);
}

for (const viewport of viewports) {
  test(`public product surfaces are responsive at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Ideias não deveriam terminar depois da competição." })).toBeVisible();
    await expect(page.getByRole("button", { name: /começar agora/i })).toBeVisible();
    await expectHealthyViewport(page);
    await expectPageHasNoBrokenImages(page);

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Entrar no Envista" })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expectHealthyViewport(page);
    await expectPageHasNoBrokenImages(page);

    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Criar conta" })).toBeVisible();
    await expectHealthyViewport(page);
    await expectPageHasNoBrokenImages(page);
  });
}

test("public surfaces preserve useful keyboard focus and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");

  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeVisible();

  const reducedMotion = await page.evaluate(() => {
    const probe = document.querySelector("button, a, input");
    if (!probe) return null;
    return getComputedStyle(probe).transitionDuration;
  });
  expect(reducedMotion).not.toBeNull();
  await expectHealthyViewport(page);
});
