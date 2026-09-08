import { test, expect } from "@playwright/test";

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("Envista critical public auth journeys", () => {
  test("login exposes only real authentication entry points", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Entrar no Envista" })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /demo/i })).toHaveCount(0);
    await expect(page.getByText(/participante demo/i)).toHaveCount(0);
    await expect(page.getByText(/investidor demo/i)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Esqueci minha senha" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Criar conta" })).toBeVisible();
  });

  test("participant area requires a real authenticated session", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("investor area requires a real authenticated session", async ({ page }) => {
    await page.goto("/investor");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("password recovery and registration remain reachable", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Esqueci minha senha" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);

    await page.goto("/login");
    await page.getByRole("link", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("auth screens do not overflow a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/login");
    await expectNoHorizontalOverflow(page);

    await page.goto("/forgot-password");
    await expectNoHorizontalOverflow(page);

    await page.goto("/register");
    await expectNoHorizontalOverflow(page);
  });
});
