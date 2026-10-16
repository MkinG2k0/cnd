import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../store-screenshots/google-play");
const base = process.env.PLAY_URL || "http://localhost:8081";
// CSS viewport = phone; deviceScaleFactor 3 → exact Google Play 1080×1920
const CSS_WIDTH = 360;
const CSS_HEIGHT = 640;
const DPR = 3;

async function shot(page, name) {
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, type: "png" });
  console.log("saved", file);
}

async function waitSettled(page) {
  await page.waitForTimeout(1500);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: CSS_WIDTH, height: CSS_HEIGHT },
    deviceScaleFactor: DPR,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await page.goto(base, { waitUntil: "networkidle", timeout: 120000 });
  await waitSettled(page);
  await shot(page, "01-home-hero.png");

  // Catalog section with city filters + cards
  const homesHeading = page.getByText("Наши дома").first();
  if (await homesHeading.count()) {
    await homesHeading.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -80));
    await waitSettled(page);
  }
  await shot(page, "02-catalog-filters.png");

  // Seed favorites for a filled store screenshot
  const favButtons = page.getByRole("button", { name: /В избранное/i });
  const favCount = Math.min(await favButtons.count(), 3);
  for (let i = 0; i < favCount; i += 1) {
    await favButtons.nth(i).click();
    await page.waitForTimeout(300);
  }

  // Open property detail
  const detailLink = page.getByRole("link", { name: /Подробнее: ЖК Московский/i }).first();
  if (await detailLink.count()) {
    await detailLink.click();
  } else {
    await page.getByRole("link", { name: /^Подробнее$/i }).first().click();
  }
  await page.waitForLoadState("networkidle");
  await waitSettled(page);
  await shot(page, "03-zhk-detail.png");

  // Favorites
  await page.goto(`${base}/favorites`, { waitUntil: "networkidle", timeout: 60000 });
  await waitSettled(page);
  await shot(page, "04-favorites.png");

  // Quiz / подбор
  await page.goto(`${base}/quiz`, { waitUntil: "networkidle", timeout: 60000 });
  await waitSettled(page);
  await shot(page, "05-quiz.png");

  // Contacts
  await page.goto(`${base}/contacts`, { waitUntil: "networkidle", timeout: 60000 });
  await waitSettled(page);
  await shot(page, "06-contacts.png");

  // Home with menu open
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await waitSettled(page);
  const menuBtn = page.getByRole("button", { name: /Открыть меню/i });
  if (await menuBtn.count()) {
    await menuBtn.click();
    await waitSettled(page);
    await shot(page, "07-menu.png");
  }

  await browser.close();
  console.log("done", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
