import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "public", "assets", "logo.png");
const res = path.join(root, "android", "app", "src", "main", "res");

const densities = [
  { name: "mdpi", launcher: 48, foreground: 108, splash: 320 },
  { name: "hdpi", launcher: 72, foreground: 162, splash: 480 },
  { name: "xhdpi", launcher: 96, foreground: 216, splash: 720 },
  { name: "xxhdpi", launcher: 144, foreground: 324, splash: 960 },
  { name: "xxxhdpi", launcher: 192, foreground: 432, splash: 1280 },
];

async function iconOnWhite(size, padRatio = 0.12) {
  const inset = Math.round(size * padRatio);
  const inner = Math.max(1, size - inset * 2);
  const logo = await sharp(src)
    .resize(inner, inner, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logo, left: inset, top: inset }])
    .png()
    .toBuffer();
}

async function splash(width, height) {
  const side = Math.round(Math.min(width, height) * 0.42);
  const logo = await sharp(src)
    .resize(side, side, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function main() {
  const fg1080 = await iconOnWhite(1080, 0.18);
  await ensureDir(path.join(res, "drawable"));
  await writeFile(path.join(res, "drawable", "ic_launcher_foreground.png"), fg1080);
  await writeFile(path.join(res, "drawable", "splash.png"), await splash(1080, 1920));

  for (const d of densities) {
    const mipmap = path.join(res, `mipmap-${d.name}`);
    await ensureDir(mipmap);
    const legacy = await iconOnWhite(d.launcher, 0.08);
    const foreground = await iconOnWhite(d.foreground, 0.18);
    await writeFile(path.join(mipmap, "ic_launcher.png"), legacy);
    await writeFile(path.join(mipmap, "ic_launcher_round.png"), legacy);
    await writeFile(path.join(mipmap, "ic_launcher_foreground.png"), foreground);

    const port = path.join(res, `drawable-port-${d.name}`);
    const land = path.join(res, `drawable-land-${d.name}`);
    await ensureDir(port);
    await ensureDir(land);
    await writeFile(path.join(port, "splash.png"), await splash(d.splash, Math.round(d.splash * 1.78)));
    await writeFile(path.join(land, "splash.png"), await splash(Math.round(d.splash * 1.78), d.splash));
  }

  console.log("Capacitor Android icons and splash updated from public/assets/logo.png");
}

await main();
