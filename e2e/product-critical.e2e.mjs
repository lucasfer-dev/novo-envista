import { test, expect } from "@playwright/test";

async function loginAsDemo(page, role) {
  await page.goto("/login");
  const label = role === "investor" ? "Entrar como investidor demo" : "Entrar como participante demo";
  await page.getByRole("button", { name: label }).click();
  await expect(page).toHaveURL(role === "investor" ? /\/investor$/ : /\/app$/);
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("Envista critical role journeys", () => {
  test("participant demo gets participant navigation and cannot enter investor area", async ({ page }) => {
    await loginAsDemo(page, "participant");

    const nav = page.getByLabel("Navegação principal");
    await expect(nav.getByText("Meus projetos", { exact: true })).toBeVisible();
    await expect(nav.getByText("Minhas equipes", { exact: true })).toBeVisible();
    await expect(nav.getByText("Aprender", { exact: true })).toBeVisible();
    await expect(nav.getByText("Projetos salvos", { exact: true })).toHaveCount(0);

    await page.goto("/investor");
    await expect(page).toHaveURL(/\/app$/);
  });

  test("investor demo gets investor capabilities and cannot enter participant area", async ({ page }) => {
    await loginAsDemo(page, "investor");

    const nav = page.getByLabel("Navegação principal");
    await expect(nav.getByText("Projetos salvos", { exact: true })).toBeVisible();
    await expect(nav.getByText("Seguindo", { exact: true })).toBeVisible();
    await expect(nav.getByText("Perfil", { exact: true })).toBeVisible();

    await page.goto("/app");
    await expect(page).toHaveURL(/\/investor$/);
  });

  test("participant demo keeps competition navigation inside participant context", async ({ page }) => {
    await loginAsDemo(page, "participant");
    await page.getByLabel("Navegação principal").getByText("Competições", { exact: true }).click();
    await expect(page).toHaveURL(/\/app\/competitions$/);
    await expect(page.getByRole("heading", { name: /Competições/i })).toBeVisible();
  });

  test("investor demo keeps discovery and competition navigation inside investor context", async ({ page }) => {
    await loginAsDemo(page, "investor");
    const nav = page.getByLabel("Navegação principal");

    await nav.getByText("Explorar", { exact: true }).click();
    await expect(page).toHaveURL(/\/investor\/explore/);

    await nav.getByText("Competições", { exact: true }).click();
    await expect(page).toHaveURL(/\/investor\/competitions$/);
    await expect(page.getByRole("heading", { name: /Competições/i })).toBeVisible();
  });

  test("participant and investor home shells do not overflow a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await loginAsDemo(page, "participant");
    await expectNoHorizontalOverflow(page);

    await page.context().clearCookies();
    await loginAsDemo(page, "investor");
    await expectNoHorizontalOverflow(page);
  });
});
