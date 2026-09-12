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

  test("retired demo URL returns to the real login", async ({ page }) => {
    await page.goto("/auth/demo");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Entrar no Envista" })).toBeVisible();
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

  test("email confirmation GET is scanner-safe and requires the expected type", async ({ page }) => {
    await page.goto("/confirm-email?token_hash=render-only-token&type=email");

    await expect(page.getByRole("heading", { name: "Confirme seu e-mail" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirmar meu e-mail" })).toBeVisible();
    await expect(page).toHaveURL(/\/confirm-email\?token_hash=render-only-token&type=email$/);
  });

  test("password recovery GET is scanner-safe and requires the expected type", async ({ page }) => {
    await page.goto("/recover-account?token_hash=render-only-token&type=recovery");

    await expect(page.getByRole("heading", { name: "Redefinição de senha" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar para criar nova senha" })).toBeVisible();
    await expect(page).toHaveURL(/\/recover-account\?token_hash=render-only-token&type=recovery$/);
  });

  test("typed token links reject the wrong flow without contacting Supabase", async ({ page }) => {
    await page.goto("/confirm-email?token_hash=render-only-token&type=recovery");
    await expect(page.getByRole("button", { name: "Confirmar meu e-mail" })).toHaveCount(0);
    await expect(page.getByRole("alert")).toContainText(/tipo inválido|possui um tipo inválido/i);

    await page.goto("/recover-account?token_hash=render-only-token&type=email");
    await expect(page.getByRole("button", { name: "Continuar para criar nova senha" })).toHaveCount(0);
    await expect(page.getByRole("alert")).toContainText(/não corresponde|inválido/i);
  });

  test("legacy GET callbacks forward confirmation/recovery credentials without consuming them", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=legacy-confirm&type=email");
    await expect(page).toHaveURL(/\/confirm-email\?token_hash=legacy-confirm&type=email$/);
    await expect(page.getByRole("button", { name: "Confirmar meu e-mail" })).toBeVisible();

    await page.goto("/auth/confirm?token_hash=legacy-recovery&type=recovery");
    await expect(page).toHaveURL(/\/recover-account\?token_hash=legacy-recovery&type=recovery$/);
    await expect(page.getByRole("button", { name: "Continuar para criar nova senha" })).toBeVisible();
  });

  test("custom email pages fail safely when credentials are missing", async ({ page }) => {
    await page.goto("/confirm-email");
    await expect(page.getByRole("alert")).toContainText(/link de confirmação está incompleto/i);
    await expect(page.getByRole("button", { name: "Confirmar meu e-mail" })).toHaveCount(0);

    await page.goto("/recover-account");
    await expect(page.getByRole("alert")).toContainText(/link de recuperação está incompleto/i);
    await expect(page.getByRole("button", { name: "Continuar para criar nova senha" })).toHaveCount(0);
  });

  test("auth screens do not overflow a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/login");
    await expectNoHorizontalOverflow(page);
    await page.goto("/forgot-password");
    await expectNoHorizontalOverflow(page);
    await page.goto("/confirm-email?token_hash=render-only-token&type=email");
    await expectNoHorizontalOverflow(page);
    await page.goto("/recover-account?token_hash=render-only-token&type=recovery");
    await expectNoHorizontalOverflow(page);
    await page.goto("/register");
    await expectNoHorizontalOverflow(page);
  });
});
