import { expect, test } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL?.trim();
const password = process.env.E2E_USER_PASSWORD;
const expectedRole = process.env.E2E_EXPECTED_ROLE === "investor" ? "investor" : "participant";
const expectedHome = expectedRole === "investor" ? "/investor" : "/app";

test.describe("dashboard autenticado", () => {
  test("login abre o produto sem cair no error boundary", async ({ page }) => {
    test.skip(!email || !password, "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD para executar o smoke autenticado.");

    await page.goto(`/login?next=${encodeURIComponent(expectedHome)}`);
    await page.getByLabel("E-mail").fill(email!);
    await page.getByLabel("Senha").fill(password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 });

    const postLoginPath = new URL(page.url()).pathname;
    expect(postLoginPath, "A conta E2E precisa ter onboarding e conformidade concluídos.").not.toBe("/onboarding");
    expect(postLoginPath).not.toBe("/guardian-required");

    await page.goto(expectedHome);
    await expect(page).toHaveURL(new RegExp(`${expectedHome.replace("/", "\\/")}(?:$|\\?)`));
    await expect(page.getByText("Não foi possível carregar esta página")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Olá,/ })).toBeVisible();
  });
});
