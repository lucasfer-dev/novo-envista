import { expect, test } from "@playwright/test";

test.describe("rotas públicas essenciais", () => {
  test("home pública abre sem erro", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByText("Envista", { exact: true }).first()).toBeVisible();
  });

  test("login permanece acessível", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /entrar|login/i })).toBeVisible();
  });

  test("documentos públicos permanecem acessíveis", async ({ page }) => {
    const terms = await page.goto("/terms");
    expect(terms?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /termos/i }).first()).toBeVisible();

    const privacy = await page.goto("/privacy");
    expect(privacy?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /privacidade/i }).first()).toBeVisible();
  });
});

test.describe("contrato das rotas internas", () => {
  test("rota interna inexistente retorna 404 e não cai no MVP antigo", async ({ request }) => {
    const response = await request.get("/app/rota-que-nao-existe");
    expect(response.status()).toBe(404);
  });

  test("rota inexistente do investidor também retorna 404", async ({ request }) => {
    const response = await request.get("/investor/rota-que-nao-existe");
    expect(response.status()).toBe(404);
  });
});
