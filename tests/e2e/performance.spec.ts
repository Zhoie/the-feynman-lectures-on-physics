import { expect, test, type Page } from "@playwright/test";

type PerformanceSnapshot = {
  cls: number;
  lcp: number;
  longTasks: number[];
};

async function installPerformanceObservers(page: Page) {
  await page.addInitScript(() => {
    const snapshot: PerformanceSnapshot = {
      cls: 0,
      lcp: 0,
      longTasks: [],
    };
    (
      window as Window & { __feynmanPerformance?: PerformanceSnapshot }
    ).__feynmanPerformance = snapshot;

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        };
        if (!shift.hadRecentInput) snapshot.cls += shift.value;
      }
    }).observe({ type: "layout-shift", buffered: true });

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const latest = entries.at(-1);
      if (latest) snapshot.lcp = latest.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        snapshot.longTasks.push(entry.duration);
      }
    }).observe({ type: "longtask", buffered: true });
  });
}

test("chapter startup stays inside its performance budget", async ({
  page,
}) => {
  await installPerformanceObservers(page);
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto("/volume/volume-1/atoms-in-motion", {
    waitUntil: "networkidle",
  });
  await page
    .waitForFunction(
      () =>
        (window as Window & {
          __feynmanPerformance?: PerformanceSnapshot;
        }).__feynmanPerformance?.lcp,
      undefined,
      { timeout: 3_000 },
    )
    .catch(() => undefined);

  const metrics = await page.evaluate(() => {
    const snapshot = (
      window as Window & { __feynmanPerformance?: PerformanceSnapshot }
    ).__feynmanPerformance ?? {
      cls: 0,
      lcp: 0,
      longTasks: [],
    };
    const scripts = performance
      .getEntriesByType("resource")
      .filter(
        (entry) =>
          (entry as PerformanceResourceTiming).initiatorType === "script",
      )
      .reduce(
        (total, entry) =>
          total + (entry as PerformanceResourceTiming).encodedBodySize,
        0,
      );
    return { ...snapshot, scripts };
  });

  console.log("chapter performance", metrics);
  expect(metrics.lcp).toBeGreaterThan(0);
  expect(metrics.lcp).toBeLessThanOrEqual(3_000);
  expect(metrics.cls).toBeLessThanOrEqual(0.02);
  expect(metrics.scripts).toBeLessThanOrEqual(260_000);
  expect(Math.max(0, ...metrics.longTasks)).toBeLessThanOrEqual(250);
});

test("heavy laboratory animation keeps a fluent frame cadence", async ({
  page,
}) => {
  await installPerformanceObservers(page);
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto("/lab/v1-ch01-s02-matter-is-made-of-atoms");
  await expect(page.getByRole("img", { name: /simulation/i })).toBeVisible();
  await page.waitForTimeout(500);

  const startup = await page.evaluate(() => {
    const snapshot = (
      window as Window & { __feynmanPerformance?: PerformanceSnapshot }
    ).__feynmanPerformance ?? {
      cls: 0,
      lcp: 0,
      longTasks: [],
    };
    const scripts = performance
      .getEntriesByType("resource")
      .filter(
        (entry) =>
          (entry as PerformanceResourceTiming).initiatorType === "script",
      )
      .reduce(
        (total, entry) =>
          total + (entry as PerformanceResourceTiming).encodedBodySize,
        0,
      );
    return { ...snapshot, scripts };
  });

  const frameTimes = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const samples: number[] = [];
        let previous = performance.now();
        const deadline = previous + 3_000;
        const sample = (now: number) => {
          samples.push(now - previous);
          previous = now;
          if (now >= deadline) {
            resolve(samples.slice(1));
            return;
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );

  const ordered = [...frameTimes].sort((a, b) => a - b);
  const p95 = ordered[Math.floor(ordered.length * 0.95)] ?? Infinity;
  const framesOver50 = frameTimes.filter((duration) => duration > 50).length;

  console.log("laboratory frame cadence", {
    lcp: startup.lcp,
    cls: startup.cls,
    scripts: startup.scripts,
    frames: frameTimes.length,
    p95,
    framesOver50,
  });
  expect(startup.lcp).toBeGreaterThan(0);
  expect(startup.lcp).toBeLessThanOrEqual(3_000);
  expect(startup.cls).toBeLessThanOrEqual(0.02);
  expect(startup.scripts).toBeLessThanOrEqual(260_000);
  expect(frameTimes.length).toBeGreaterThan(120);
  expect(p95).toBeLessThanOrEqual(25);
  expect(framesOver50).toBe(0);
});

test("reduced motion and offscreen canvases suspend continuous work", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const client = await page.context().newCDPSession(page);
  await client.send("Performance.enable");

  const taskDuration = async () => {
    const result = await client.send("Performance.getMetrics");
    return (
      result.metrics.find((metric) => metric.name === "TaskDuration")?.value ??
      0
    );
  };

  await page.goto("/lab/v1-ch01-s02-matter-is-made-of-atoms");
  await expect(page.getByText("Paused", { exact: true })).toBeVisible();
  const runtimeText = page.getByText(/Frames \d+/);
  const frameCount = async () => {
    const text = await runtimeText.textContent();
    return Number(text?.match(/Frames (\d+)/)?.[1] ?? 0);
  };

  const pausedFramesStart = await frameCount();
  const pausedStart = await taskDuration();
  await page.waitForTimeout(2_000);
  const pausedWork = (await taskDuration()) - pausedStart;
  const pausedFramesEnd = await frameCount();

  await page.getByRole("button", { name: "Play" }).click();
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(250);

  const offscreenFramesStart = await frameCount();
  const offscreenStart = await taskDuration();
  await page.waitForTimeout(2_000);
  const offscreenWork = (await taskDuration()) - offscreenStart;
  const offscreenFramesEnd = await frameCount();

  console.log("suspended canvas work", {
    pausedMilliseconds: pausedWork * 1_000,
    offscreenMilliseconds: offscreenWork * 1_000,
    pausedFrames: pausedFramesEnd - pausedFramesStart,
    offscreenFrames: offscreenFramesEnd - offscreenFramesStart,
  });
  expect(pausedFramesEnd - pausedFramesStart).toBe(0);
  expect(offscreenFramesEnd - offscreenFramesStart).toBeLessThanOrEqual(2);
  expect(pausedWork).toBeLessThanOrEqual(0.05);
  expect(offscreenWork).toBeLessThanOrEqual(0.05);
});
