import { test, expect } from "@playwright/test";

test.describe("Envista identity v2 / real browser", () => {
  test("preserves important pathways and uses official brand materials on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: /seu projeto.*merece ir.*além/i })).toBeVisible();
    await expect(page.locator(".ev-brand").first()).toContainText("ENVISTA");
    await expect(page.locator(".ev-brandDescriptor")).toBeVisible();
    await expect(page.locator(".ev-manifestoSeal")).toBeVisible();
    await expect(page.locator(".ev-showcaseWindow")).toBeVisible();
    await expect(page.locator(".ev-heroVisualAxis")).toBeVisible();
    await expect(page.getByRole("link", { name: /começar meu projeto/i })).toHaveAttribute("href", "/register");
    await expect(page.getByRole("heading", { name: /projetos que não ficam/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /uma ideia é só/i })).toBeVisible();
    const backdrop = await page.locator(".ev-processSection").evaluate((element) =>
      getComputedStyle(element, "::after").backgroundImage
    );
    expect(backdrop).toContain("envista-pattern-original.png");
    const header = await page.locator(".ev-header").evaluate((element) => getComputedStyle(element).position);
    expect(header).toBe("sticky");
  });

  for (const width of [320, 375, 768, 1024]) {
    test(`fits width ${width}px without lateral scrolling or hiding the primary action`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".ev-showcaseWindow")).toBeVisible();
      const overflow = await page.evaluate(() =>
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth
      );
      expect(overflow).toBeLessThanOrEqual(2);
      if (width <= 740) {
        await page.locator(".ev-mobileNav summary").click();
        await expect(page.locator(".ev-mobileNav nav").getByRole("link", { name: "Para escolas" })).toBeVisible();
        await expect(page.locator(".ev-mobileNav nav").getByRole("link", { name: "Começar projeto" })).toBeVisible();
      } else {
        await expect(page.locator(".ev-desktopNav").getByRole("link", { name: "Começar projeto" })).toBeVisible();
      }
    });
  }

  test("exposes a keyboard skip link without hiding focused controls", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.locator(".ev-skipLink")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#conteudo")).toBeFocused();
  });
});
