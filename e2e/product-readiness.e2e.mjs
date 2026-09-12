import { test, expect } from "@playwright/test";

const protectedRoutes = [
  "/app/interests",
  "/app/projects/new",
  "/investor/interests",
  "/investor/verification",
];

test.describe("Envista product readiness routes", () => {
  for (const route of protectedRoutes) {
    test(`${route} requires authentication`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login(?:\?|$)/);
      await expect(page.getByRole("heading", { name: "Entrar no Envista" })).toBeVisible();
    });
  }

  test("registration route remains available when signup is closed", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Criar conta" })).toBeVisible();
    await expect(page.getByText(/cadastro está temporariamente fechado/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Já tenho uma conta" })).toBeVisible();
  });

  test("public legal pages no longer present themselves as internal beta documents", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "Termos de Uso" })).toBeVisible();
    await expect(page.getByText(/versão interna de teste/i)).toHaveCount(0);

    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Aviso de Privacidade" })).toBeVisible();
    await expect(page.getByText(/material provisório/i)).toHaveCount(0);
  });
});
