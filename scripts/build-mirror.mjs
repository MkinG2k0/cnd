import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SITE_HTML = path.join(ROOT, "site.html");
const META_PATH = path.join(ROOT, "content", "tilda-meta.json");
const OUT_DIR = path.join(ROOT, "public", "mirror");
const OUT_FILE = path.join(OUT_DIR, "index.html");

function localCssPath(remoteUrl) {
  try {
    const u = new URL(remoteUrl);
    if (u.hostname.includes("fonts.googleapis.com")) {
      return "/tilda/css/css2.css";
    }
    const parts = u.pathname.split("/").filter(Boolean);
    const base = parts[parts.length - 1];
    const folder = parts.slice(0, -1).join("__");
    const name = `${folder}__${base}`.replace(/[^a-zA-Z0-9._-]/g, "_");
    // page blocks css was saved with an extra .css in import
    if (name.includes("tilda-blocks-page") && !name.endsWith(".css.css")) {
      return `/tilda/css/${name}.css`;
    }
    return `/tilda/css/${name}`;
  } catch {
    return null;
  }
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const raw = await fs.readFile(SITE_HTML, "utf8");
  const meta = JSON.parse(await fs.readFile(META_PATH, "utf8"));
  const urlMap = new Map();

  // Images
  const imgDir = path.join(ROOT, "public", "tilda", "images");
  const imgs = await fs.readdir(imgDir);
  for (const name of imgs) {
    const local = `/tilda/images/${name}`;
    if (name.startsWith("img__")) {
      urlMap.set(`https://static.tildacdn.com/img/${name.slice(5)}`, local);
      continue;
    }
    const idx = name.indexOf("__");
    if (idx === -1) continue;
    const folder = name.slice(0, idx);
    const file = name.slice(idx + 2);
    urlMap.set(`https://static.tildacdn.com/${folder}/${file}`, local);
  }

  if (meta.favicon) {
    const faviconOrig =
      raw.match(/rel="(?:shortcut icon|icon)"\s+href="([^"]+)"/i)?.[1] || "";
    if (faviconOrig) urlMap.set(faviconOrig, meta.favicon);
  }
  if (meta.ogImage) {
    const ogOrig =
      raw.match(/property="og:image"\s+content="([^"]+)"/i)?.[1] || "";
    if (ogOrig) urlMap.set(ogOrig, meta.ogImage);
  }

  // CSS: map each remote stylesheet URL to an existing local file by URL, not index
  const cssHrefs = [
    ...new Set(
      [...raw.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*>/gi)]
        .map((m) => m[1].replace(/&amp;/g, "&"))
        .filter((u) => /\.css(\?|$)/i.test(u) || u.includes("fonts.googleapis")),
    ),
  ];

  for (const href of cssHrefs) {
    const candidate = localCssPath(href);
    if (!candidate) continue;
    const abs = path.join(ROOT, "public", candidate.replace(/^\//, ""));
    if (await fileExists(abs)) {
      urlMap.set(href, candidate);
      urlMap.set(href.split("?")[0], candidate);
    } else {
      // keep CDN if local missing
      console.warn("CSS missing locally, keep CDN:", href);
    }
  }

  // Also accept meta.css entries as known locals for any matching basename
  for (const local of meta.css || []) {
    const base = path.basename(local).replace(/\.css\.css$/, ".css");
    for (const href of cssHrefs) {
      if (href.includes(base.replace(/^css__/, "").replace(/\.css$/, "")) ||
          local.includes(path.basename(href.split("?")[0]))) {
        const abs = path.join(ROOT, "public", local.replace(/^\//, ""));
        if (await fileExists(abs) && !urlMap.has(href)) {
          urlMap.set(href, local);
          urlMap.set(href.split("?")[0], local);
        }
      }
    }
  }

  // Explicit critical mappings
  const explicit = {
    "https://static.tildacdn.com/css/tilda-popup-1.1.min.css":
      "/tilda/css/css__tilda-popup-1.1.min.css",
    "https://static.tildacdn.com/css/tilda-catalog-1.1.min.css":
      "/tilda/css/css__tilda-catalog-1.1.min.css",
    "https://static.tildacdn.com/css/tilda-slds-1.4.min.css":
      "/tilda/css/css__tilda-slds-1.4.min.css",
    "https://static.tildacdn.com/css/tilda-cover-1.0.min.css":
      "/tilda/css/css__tilda-cover-1.0.min.css",
    "https://static.tildacdn.com/css/tilda-zoom-2.0.min.css":
      "/tilda/css/css__tilda-zoom-2.0.min.css",
    "https://static.tildacdn.com/css/tilda-catalog-filters-1.0.min.css":
      "/tilda/css/css__tilda-catalog-filters-1.0.min.css",
    "https://static.tildacdn.com/css/tilda-img-select-1.0.min.css":
      "/tilda/css/css__tilda-img-select-1.0.min.css",
  };
  for (const [remote, local] of Object.entries(explicit)) {
    const abs = path.join(ROOT, "public", local.replace(/^\//, ""));
    if (await fileExists(abs)) urlMap.set(remote, local);
  }

  let html = raw;

  // Replace longer URLs first to avoid partial collisions
  const entries = [...urlMap.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [remote, local] of entries) {
    if (!remote || !local) continue;
    html = html.split(remote).join(local);
  }

  // thb placeholders / lazy thumbs -> local full images
  html = html.replace(
    /https:\/\/thb\.tildacdn\.com\/(tild[^/]+)\/-\/[^"'\\\s]+\/([^"'\\\s]+)/g,
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

  // Ensure popup + catalog CSS are present even if rewrite missed them
  const headInject = [
    "/tilda/css/css__tilda-popup-1.1.min.css",
    "/tilda/css/css__tilda-catalog-1.1.min.css",
    "/tilda/css/css__tilda-slds-1.4.min.css",
  ]
    .filter((href) => !html.includes(href))
    .map(
      (href) =>
        `<link rel="stylesheet" href="${href}" type="text/css" media="all" />`,
    )
    .join("");

  if (headInject) {
    html = html.replace("</head>", `${headInject}</head>`);
    console.log("Injected missing CSS links");
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, html, "utf8");

  // sanity
  const checks = [
    "css__tilda-popup-1.1.min.css",
    "css__tilda-catalog-1.1.min.css",
    "css__tilda-slds-1.4.min.css",
  ];
  for (const c of checks) {
    console.log(c, html.includes(c) ? "OK" : "MISSING");
  }
  console.log("thb left", (html.match(/thb\.tildacdn/g) || []).length);
  console.log("Wrote", OUT_FILE, "bytes", html.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
