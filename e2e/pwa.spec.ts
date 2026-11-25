import { expect, test } from "@playwright/test";

/** Width and height from a PNG's header (IHDR chunk). */
function pngSize(png: Buffer) {
  expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

test("the site can be installed as an app", async ({ page, request }) => {
  await page.goto("/");

  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  const manifestResponse = await request.get(manifestHref ?? "");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    short_name: "Expenses",
    start_url: "/",
    display: "standalone",
  });

  for (const icon of manifest.icons as { src: string; sizes: string }[]) {
    const image = await request.get(icon.src);
    expect(image.ok(), icon.src).toBe(true);
    expect(image.headers()["content-type"]).toContain("image/png");
    const [width, height] = icon.sizes.split("x").map(Number);
    expect(pngSize(await image.body()), icon.src).toEqual({ width, height });
  }

  const appleHref = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute("href");
  const appleIcon = await request.get(appleHref ?? "");
  expect(pngSize(await appleIcon.body())).toEqual({ width: 180, height: 180 });
  await expect(
    page.locator('meta[name="apple-mobile-web-app-title"]'),
  ).toHaveAttribute("content", "Expenses");
});
