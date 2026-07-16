import { expect, test } from "@playwright/test";

test("static routes expose correct metadata and discovery output", async ({
  page,
  request,
}) => {
  await page.goto("/volume/volume-1/atoms-in-motion");
  await expect(page).toHaveTitle(
    "Atoms in Motion · Volume I · The Feynman Lectures on Physics",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://localhost:3000/volume/volume-1/atoms-in-motion",
  );

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const sitemapText = await sitemap.text();
  expect(sitemapText.match(/<url>/g)).toHaveLength(257);
  expect(sitemapText).toContain("/lab/v1-ch01-s01-introduction</loc>");
});

test("deep-linked experiment stays visible and animation controls persist", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    "/volume/volume-1/atoms-in-motion?experiment=v1-ch01-reaction-coordinate",
  );

  const activeTab = page.getByRole("tab", {
    name: "1-4 Reaction Coordinate",
  });
  await expect(activeTab).toHaveAttribute("aria-selected", "true");
  await expect(activeTab).toBeInViewport();

  const tabBounds = await activeTab.boundingBox();
  expect(tabBounds).not.toBeNull();
  expect(tabBounds?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((tabBounds?.x ?? 0) + (tabBounds?.width ?? 0)).toBeLessThanOrEqual(
    390,
  );

  const pauseButton = page.getByRole("button", { name: "Pause" });
  await pauseButton.click();
  await expect(page.getByText("Animation paused")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Animation paused")).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByText("Animation running")).toBeVisible();

  const documentWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(documentWidth).toBe(390);
});

test("laboratory controls, pause, reset, and runtime details remain usable", async ({
  page,
}) => {
  await page.goto("/lab/v1-ch01-s02-matter-is-made-of-atoms");
  await expect(page.getByRole("img", { name: /simulation/i })).toBeVisible();

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("Paused", { exact: true })).toBeVisible();

  const temperature = page.getByRole("slider", { name: /temperature/i });
  const initialValue = await temperature.inputValue();
  await temperature.fill("1.4");
  expect(await temperature.inputValue()).not.toBe(initialValue);

  await page.getByRole("button", { name: "Reset defaults" }).click();
  await expect(temperature).toHaveValue(initialValue);

  await page.getByText("Model confidence and sources").click();
  await expect(page.getByText(/Frames \d+/)).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();
});

test("repeated experiment switches keep one live canvas", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/volume/volume-1/atoms-in-motion");
  const first = page.getByRole("tab", { name: "1-1 Atomic Motion" });
  const second = page.getByRole("tab", { name: "1-2 Brownian Diffusion" });
  await expect(first).toHaveAttribute("aria-selected", "true");

  for (let index = 0; index < 50; index += 1) {
    const target = index % 2 === 0 ? second : first;
    await target.click();
    await expect(target).toHaveAttribute("aria-selected", "true");
  }

  await expect(page.locator("canvas")).toHaveCount(1);
  expect(consoleErrors).toEqual([]);
});
