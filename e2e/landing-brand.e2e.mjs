import { test, expect } from "@playwright/test";

test.describe("official Envista editorial homepage", () => {
  test("shows the authentic identity, a working primary CTA and live project showcase", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: /seu projeto.*merece ir.*além/i })).toBeVisible();
    await expect(page.locator(".ev-brand").first()).toContainText("ENVISTA");
    await expect(page.locator(".ev-showcaseWindow")).toBeVisible();
    await expect(page.getByRole("link", { name: /começar meu projeto/i })).toHaveAttribute("href", "/register");
    await expect(page.getByRole("heading", { name: /projetos que não ficam/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /uma ideia é só/i })).toBeVisible();
  });

  test("mobile navigation and editorial layout fit a narrow screen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator(".ev-showcaseWindow")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const horizontalOverflow = await page.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(2);
    await page.locator("details.ev-mobileNav summary").click();
    await expect(page.locator("details.ev-mobileNav nav").getByRole("link", { name: "Para escolas" })).toBeVisible();
  });
});
