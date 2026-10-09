import fs from "node:fs/promises";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const ROOT = process.cwd();
const SITE_HTML = path.join(ROOT, "site.html");
const PUBLIC_DIR = path.join(ROOT, "public", "tilda");
const CONTENT_DIR = path.join(ROOT, "content");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CND-Import/1.0)" },
  });
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  await ensureDir(path.dirname(dest));
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

function safeName(url) {
  const u = new URL(url);
  const base = path.basename(u.pathname);
  const folder = u.pathname.split("/").filter(Boolean).slice(0, -1).join("__");
  return (folder ? `${folder}__${base}` : base).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function extractTagBlock(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = html.match(re);
  return m ? m[1] : "";
}

async function main() {
  const html = await fs.readFile(SITE_HTML, "utf8");

  const title =
    html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ||
    "Недвижимость Дагестана";
  const description =
    html
      .match(
        /<meta\s+name="description"\s+content="([^"]*)"/i,
      )?.[1]
      ?.trim() ||
    html
      .match(
        /property="og:description"\s+content="([^"]*)"/i,
      )?.[1]
      ?.trim() ||
    "Квартиры в новостройках Дагестана";

  const favicon =
    html.match(
      /rel="(?:shortcut icon|icon)"\s+href="([^"]+)"/i,
    )?.[1] ||
    "https://static.tildacdn.com/tild3966-3834-4935-b739-636331653337/EnTjLTAN0gFKiGRE1Es3.jpg";

  const ogImage =
    html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1] || favicon;

  // Collect full-size static images (skip tiny thb placeholders)
  const imageUrls = [
    ...new Set(
      [
        ...html.matchAll(
          /https:\/\/static\.tildacdn\.com\/tild[^"'\\\s<>]+/g,
        ),
      ]
        .map((m) => m[0].replace(/&amp;/g, "&"))
        .filter((u) => /\.(jpe?g|png|webp|gif|svg)$/i.test(u.split("?")[0])),
    ),
  ];

  // Also logo / copy images under /img/
  const extraImgs = [
    ...new Set(
      [
        ...html.matchAll(
          /https:\/\/static\.tildacdn\.com\/img\/[^"'\\\s<>]+/g,
        ),
      ].map((m) => m[0]),
    ),
  ];

  const allImages = [...new Set([...imageUrls, ...extraImgs, favicon, ogImage])];

  await ensureDir(path.join(PUBLIC_DIR, "images"));
  const urlMap = new Map();

  console.log(`Downloading ${allImages.length} images...`);
  for (const url of allImages) {
    const name = safeName(url);
    const dest = path.join(PUBLIC_DIR, "images", name);
    const local = `/tilda/images/${name}`;
    try {
      await download(url, dest);
      urlMap.set(url, local);
      console.log("OK", name);
    } catch (e) {
      console.warn("SKIP", url, e.message);
    }
  }

  // CSS from head + body link tags
  const cssUrls = [
    ...new Set(
      [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)]
        .map((m) => m[0].match(/href=["']([^"']+)["']/i)?.[1])
        .filter(Boolean)
        .map((u) => u.replace(/&amp;/g, "&")),
    ),
  ];

  // External scripts (keep CDN for Tilda runtime reliability, also mirror page CSS/JS)
  const jsUrls = [
    ...new Set(
      [...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)]
        .map((m) => m[1].replace(/&amp;/g, "&"))
        .filter((u) => u.startsWith("http")),
    ),
  ];

  await ensureDir(path.join(PUBLIC_DIR, "css"));
  await ensureDir(path.join(PUBLIC_DIR, "js"));

  const localCss = [];
  for (const url of cssUrls) {
    const name = safeName(url.split("?")[0]) + (url.includes("?") ? ".css" : "");
    const fileName = name.endsWith(".css") ? name : `${name}.css`;
    const dest = path.join(PUBLIC_DIR, "css", fileName);
    const local = `/tilda/css/${fileName}`;
    try {
      await download(url, dest);
      localCss.push(local);
      urlMap.set(url, local);
      // also map without query
      urlMap.set(url.split("?")[0], local);
      console.log("CSS", fileName);
    } catch (e) {
      console.warn("CSS SKIP", url, e.message);
      localCss.push(url);
    }
  }

  // Keep JS on CDN (Tilda often loads more dynamically); still rewrite known page block js if present
  let body = extractTagBlock(html, "body");
  // Prefer inner allrecords if present
  const allrecords = body.match(
    /(<div id="allrecords"[\s\S]*?<\/div>\s*<!--\/allrecords-->)/i,
  );
  if (allrecords) {
    // Keep scripts after allrecords too (Tilda puts some at end of body)
    const after = body.slice(body.indexOf(allrecords[1]) + allrecords[1].length);
    body = allrecords[1] + after;
  }

  // Rewrite asset URLs to local
  for (const [remote, local] of urlMap.entries()) {
    body = body.split(remote).join(local);
  }

  // Fix logo / home links pointing to tilda
  body = body
    .replaceAll('href="http://tilda.cc"', 'href="/"')
    .replaceAll("href='http://tilda.cc'", "href='/'")
    .replaceAll('href="https://tilda.cc/"', 'href="/"')
    .replaceAll('href="https://tilda.cc"', 'href="/"');

  // Replace tiny thb placeholders with local full images where mapped
  body = body.replace(
    /https:\/\/thb\.tildacdn\.com\/(tild[^/]+)\/-\/[^/]+\/([^"'\\\s]+)/g,
    (full, folder, file) => {
      const original = `https://static.tildacdn.com/${folder}/${file}`;
      return urlMap.get(original) || full;
    },
  );

  await ensureDir(CONTENT_DIR);
  await fs.writeFile(path.join(CONTENT_DIR, "tilda-body.html"), body, "utf8");

  // Favicon locally
  const favLocal = urlMap.get(favicon) || favicon;
  const ogLocal = urlMap.get(ogImage) || ogImage;

  const meta = {
    title,
    description: description.replace(/&quot;/g, '"'),
    favicon: favLocal,
    ogImage: ogLocal,
    css: localCss,
    js: jsUrls,
  };
  await fs.writeFile(
    path.join(CONTENT_DIR, "tilda-meta.json"),
    JSON.stringify(meta, null, 2),
    "utf8",
  );

  console.log("\nDone.");
  console.log("Images:", urlMap.size);
  console.log("CSS:", localCss.length);
  console.log("JS (CDN):", jsUrls.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
