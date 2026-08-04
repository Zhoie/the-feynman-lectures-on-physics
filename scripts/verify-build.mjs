import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const nextRoot = path.join(root, ".next");
const siteTitle = "The Feynman Lectures on Physics";

const routes = [
  {
    name: "volume",
    file: "server/app/volume/volume-1.html",
    title: `Volume I · Mainly Mechanics, Radiation, and Heat · ${siteTitle}`,
    canonical: "/volume/volume-1",
    maximumJavaScriptBytes: 575_000,
  },
  {
    name: "chapter",
    file: "server/app/volume/volume-1/atoms-in-motion.html",
    title: `Atoms in Motion · Volume I · ${siteTitle}`,
    canonical: "/volume/volume-1/atoms-in-motion",
    maximumJavaScriptBytes: 575_000,
  },
  {
    name: "transition",
    file: "server/app/volume/volume-1/transition/atoms-in-motion/basic-physics.html",
    title: `Transition · Atoms in Motion → Basic Physics · ${siteTitle}`,
    canonical:
      "/volume/volume-1/transition/atoms-in-motion/basic-physics",
    maximumJavaScriptBytes: 575_000,
  },
  {
    name: "laboratory",
    file: "server/app/lab/v1-ch01-s01-introduction.html",
    title: `1-1 Introduction · Atoms in Motion · ${siteTitle}`,
    canonical: "/lab/v1-ch01-s01-introduction",
    maximumJavaScriptBytes: 575_000,
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function routeJavaScriptBytes(html) {
  const chunks = new Set(
    [...html.matchAll(/<script([^>]+)src="([^"]+\.js)"([^>]*)>/g)]
      .filter((match) => !`${match[1]}${match[3]}`.includes("noModule"))
      .map((match) => match[2])
      .filter((source) => source.startsWith("/_next/"))
      .map((source) => decodeURIComponent(source.replace("/_next/", ""))),
  );

  let total = 0;
  for (const chunk of chunks) {
    total += (await stat(path.join(nextRoot, chunk))).size;
  }
  return total;
}

for (const route of routes) {
  const html = await readFile(path.join(nextRoot, route.file), "utf8");
  assert(
    html.includes(`<title>${route.title}</title>`),
    `${route.name} metadata title is missing`,
  );
  assert(
    html.includes(`rel="canonical"`) && html.includes(route.canonical),
    `${route.name} canonical URL is missing`,
  );
  const bytes = await routeJavaScriptBytes(html);
  assert(
    bytes <= route.maximumJavaScriptBytes,
    `${route.name} initial JavaScript is ${bytes} bytes; budget is ${route.maximumJavaScriptBytes}`,
  );
  console.log(`${route.name}: ${bytes} initial JavaScript bytes`);
}

const volumeHtml = await readFile(
  path.join(nextRoot, routes[0].file),
  "utf8",
);
assert(volumeHtml.includes("/icon.svg?"), "Optimized SVG icon is missing");
assert(!volumeHtml.includes("favicon.ico"), "Legacy favicon is still emitted");

const sitemap = await readFile(
  path.join(nextRoot, "server/app/sitemap.xml.body"),
  "utf8",
);
const registeredLabSource = await readFile(
  path.join(root, "features/labs/registered-lab-ids.ts"),
  "utf8",
);
const registeredLabIds = [
  ...registeredLabSource.matchAll(/^\s+"([^"]+)",$/gm),
].map((match) => match[1]);

assert(registeredLabIds.length === 28, "Expected 28 registered laboratories");
for (const labId of registeredLabIds) {
  assert(
    sitemap.includes(`/lab/${labId}</loc>`),
    `Sitemap is missing laboratory ${labId}`,
  );
}

const sitemapUrlCount = [...sitemap.matchAll(/<url>/g)].length;
assert(
  sitemapUrlCount === 257,
  `Sitemap contains ${sitemapUrlCount} URLs; expected 257`,
);

const iconBytes = (await stat(path.join(root, "app/icon.svg"))).size;
assert(iconBytes <= 2_000, `Application icon is too large: ${iconBytes} bytes`);

console.log(`sitemap: ${sitemapUrlCount} URLs`);
console.log(`icon: ${iconBytes} bytes`);
