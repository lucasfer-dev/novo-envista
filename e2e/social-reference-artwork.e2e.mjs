import { test, expect } from "@playwright/test";

test("the exact Elovia reference cover is a decodable image", async ({ page }) => {
  await page.goto("/login");
  const image = await page.evaluate(async () => {
    const element = new Image();
    element.src = "/brand/social-elovia-reference.webp";
    try {
      await element.decode();
    } catch {
      return { width: 0, height: 0 };
    }
    return { width: element.naturalWidth, height: element.naturalHeight };
  });
  expect(image.width).toBeGreaterThanOrEqual(450);
  expect(image.height).toBeGreaterThanOrEqual(120);
});
