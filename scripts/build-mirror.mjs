import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SITE_HTML = path.join(ROOT, "site.html");
const META_PATH = path.join(ROOT, "content", "tilda-meta.json");
const OUT_DIR = path.join(ROOT, "public", "mirror");
const OUT_FILE = path.join(OUT_DIR, "index.html");

async function main() {
  const raw = await fs.readFile(SITE_HTML, "utf8");
  const meta = JSON.parse(await fs.readFile(META_PATH, "utf8"));

  // Build URL map from downloaded local images + css
  const urlMap = new Map();

  // Images in public/tilda/images
  const imgDir = path.join(ROOT, "public", "tilda", "images");
  const imgs = await fs.readdir(imgDir);
  for (const name of imgs) {
    // Reverse-engineer from safeName pattern: folder__file
    const local = `/tilda/images/${name}`;
    if (name.startsWith("img__")) {
      urlMap.set(
        `https://static.tildacdn.com/img/${name.slice(5)}`,
        local,
      );
      continue;
    }
    const idx = name.indexOf("__");
    if (idx === -1) continue;
    const folder = name.slice(0, idx);
    const file = name.slice(idx + 2);
    urlMap.set(`https://static.tildacdn.com/${folder}/${file}`, local);
  }

  for (const css of meta.css) {
    // Prefer matching original URLs from HTML
  }

  // Map CSS files from meta by reading original link hrefs
  const cssHrefs = [
    ...raw.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi),
  ]
    .map((m) => m[0].match(/href=["']([^"']+)["']/i)?.[1])
    .filter(Boolean)
    .map((u) => u.replace(/&amp;/g, "&"));

  cssHrefs.forEach((href, i) => {
    if (meta.css[i]) urlMap.set(href, meta.css[i]);
    urlMap.set(href.split("?")[0], meta.css[i]);
  });

  // Favicon / og
  const faviconOrig =
    raw.match(/rel="(?:shortcut icon|icon)"\s+href="([^"]+)"/i)?.[1] || "";
  const ogOrig =
    raw.match(/property="og:image"\s+content="([^"]+)"/i)?.[1] || "";
  if (faviconOrig) urlMap.set(faviconOrig, meta.favicon);
  if (ogOrig) urlMap.set(ogOrig, meta.ogImage);

  let html = raw;

  for (const [remote, local] of urlMap.entries()) {
    if (!remote || !local) continue;
    html = html.split(remote).join(local);
  }

  // thb -> local full images
  html = html.replace(
    /https:\/\/thb\.tildacdn\.com\/(tild[^/]+)\/-\/[^/]+\/([^"'\\\s]+)/g,
    (full, folder, file) => {
      const original = `https://static.tildacdn.com/${folder}/${file}`;
      return urlMap.get(original) || full;
    },
  );

  html = html
    .replaceAll('href="http://tilda.cc"', 'href="/"')
    .replaceAll("href='http://tilda.cc'", "href='/'")
    .replaceAll('href="https://tilda.cc/"', 'href="/"')
    .replaceAll('href="https://tilda.cc"', 'href="/"')
    .replaceAll('content="http://cnd05.ru"', 'content="https://cnd05.ru"');

  // Point asset paths correctly when served from /mirror/
  // Our assets are absolute /tilda/... so fine for both / and /mirror/

  // Add base-friendly note: serve at /
  // Remove Tilda project analytics noise optionally — keep for fidelity

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, html, "utf8");
  console.log("Wrote", OUT_FILE, "bytes", html.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
