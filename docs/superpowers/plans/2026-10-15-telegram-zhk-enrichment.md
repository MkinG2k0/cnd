# Telegram → ЖК enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One-shot enrich existing Sanity product cards from the ЦНД Telegram export (photos + presentation PDFs + allowlisted texts), without changing prices.

**Architecture:** Pure parse/classify modules under `scripts/telegram-enrich/` build a manifest from `result.json`; an apply CLI uploads images to Sanity, copies allowlisted PDFs to `public/projects/`, and patches products (never `price`). Site/mobile gain a `gallery` field and a simple property-page gallery UI.

**Tech Stack:** TypeScript, Sanity client (`sanity exec` / `getCliClient`), Next.js App Router, Expo mobile (map-content + detail screen), Node test runner via `tsx`.

**Spec:** `docs/superpowers/specs/2026-10-15-telegram-zhk-enrichment-design.md`

## Global Constraints

- Never write or patch product `price`
- Only mapped existing ЖК (see TOPIC_MAP below); no new products
- Skip HEIC, videos (manifest `deferred`/`skip`), legal PDFs, commissions, leads
- Default: keep existing cover `image`; Telegram photos go to `gallery`
- Dry-run before apply; export path is local CLI arg, not committed to the repo
- Texts only via `scripts/telegram-enrich/text-allowlist.json`

## File structure

| File | Responsibility |
|------|----------------|
| `scripts/telegram-enrich/types.ts` | Shared types for messages, manifest, actions |
| `scripts/telegram-enrich/topic-map.ts` | Telegram topic title → product name |
| `scripts/telegram-enrich/classify-media.ts` | Photo/PDF/video/HEIC allow-deny rules |
| `scripts/telegram-enrich/build-manifest.ts` | Parse export → manifest JSON |
| `scripts/telegram-enrich/text.ts` | Allowlist + plain text → simple HTML |
| `scripts/telegram-enrich/apply.ts` | Sanity upload + patch + PDF copy |
| `scripts/telegram-enrich/cli.ts` | `--export`, `--dry-run`, `--apply`, `--only`, `--replace-cover` |
| `scripts/telegram-enrich/text-allowlist.json` | Seed message ids |
| `scripts/telegram-enrich/*.test.ts` | Unit tests for pure modules |
| `studio-cnd/schemaTypes/documents/product.ts` | Add `gallery` |
| `src/sanity/queries.ts`, `src/lib/content.ts` | Fetch/map gallery |
| `src/app/zhk/property-gallery.tsx` | Client gallery UI |
| `src/app/zhk/[slug]/page.tsx`, `src/app/globals.css` | Wire gallery |
| `mobile/src/lib/types.ts`, `queries.ts`, `map-content.ts`, `app/zhk/[slug].tsx` | Mobile gallery |
| `studio-cnd/package.json` | npm script for enrich |

### TOPIC_MAP (lock in code)

```ts
export const TOPIC_MAP: Record<string, string> = {
  "ЖК Новый горизонт": "ЖК Новый Горизонт",
  "ЖК Московский": "ЖК Московский",
  "ЖкК высота": "ЖК Высота",
  "СК ЖБИ": "ЖК Мечта",
  "ЖК Август": "ЖК Август",
  "Жк Сите": "ЖК Сите",
  "Жк Гранд Берег - СК Унистрой": "ЖК Грандберег",
  "ЖК Ботаника - СК АРДВ": "ЖК Ботаника",
  "СК Аркадий СТ - Золотые пески - Новая жизнь": "ЖК Золотые Пески",
};
```

For the Аркада topic: skip any message whose text clearly targets «Новая жизнь» / «Новая Жизнь» without «Золотые пески».

---

### Task 1: Topic map + media classification (pure)

**Files:**
- Create: `scripts/telegram-enrich/types.ts`
- Create: `scripts/telegram-enrich/topic-map.ts`
- Create: `scripts/telegram-enrich/classify-media.ts`
- Create: `scripts/telegram-enrich/classify-media.test.ts`
- Create: `scripts/telegram-enrich/topic-map.test.ts`
- Modify: `package.json` (add `test:telegram-enrich` script)

**Interfaces:**
- Produces: `resolveProductName(topicTitle: string): string | null`
- Produces: `classifyFile(fileName: string, mimeType?: string): "photo" | "presentation_pdf" | "legal_pdf" | "heic" | "video" | "other"`
- Produces: `shouldSkipArcadaMessage(text: string): boolean`

- [ ] **Step 1: Write failing tests**

```ts
// scripts/telegram-enrich/topic-map.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveProductName, shouldSkipArcadaMessage } from "./topic-map.ts";

describe("resolveProductName", () => {
  it("maps Мечта topic", () => {
    assert.equal(resolveProductName("СК ЖБИ"), "ЖК Мечта");
  });
  it("returns null for excluded topics", () => {
    assert.equal(resolveProductName("Запросы"), null);
    assert.equal(resolveProductName("Жк притяжение - ск прайм"), null);
  });
});

describe("shouldSkipArcadaMessage", () => {
  it("skips Новая жизнь-only copy", () => {
    assert.equal(shouldSkipArcadaMessage("ЖК Новая жизнь — сдача 2027"), true);
  });
  it("keeps Золотые пески", () => {
    assert.equal(shouldSkipArcadaMessage("ЖК «Золотые пески» люкс у моря"), false);
  });
});
```

```ts
// scripts/telegram-enrich/classify-media.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyFile } from "./classify-media.ts";

describe("classifyFile", () => {
  it("allows presentation pdf", () => {
    assert.equal(
      classifyFile("Презентация_Новый_горизонт_1_и_16_блок.pdf", "application/pdf"),
      "presentation_pdf",
    );
  });
  it("denies legal pdf", () => {
    assert.equal(
      classifyFile("Разрешение_на_строительство_Новый_Горизонт_.pdf", "application/pdf"),
      "legal_pdf",
    );
    assert.equal(classifyFile("Выписка_из_ЕГРН....pdf", "application/pdf"), "legal_pdf");
  });
  it("marks heic and video", () => {
    assert.equal(classifyFile("IMG_3512.HEIC", "image/heic"), "heic");
    assert.equal(classifyFile("video_1.mp4", "video/mp4"), "video");
  });
  it("treats jpg as photo", () => {
    assert.equal(classifyFile("photo_1.jpg"), "photo");
  });
});
```

- [ ] **Step 2: Register test script and run (expect FAIL)**

Add to root `package.json` scripts:

```json
"test:telegram-enrich": "npx --yes tsx --test scripts/telegram-enrich/*.test.ts"
```

Run: `npm run test:telegram-enrich`  
Expected: FAIL (modules missing)

- [ ] **Step 3: Implement modules**

```ts
// scripts/telegram-enrich/types.ts
export type MediaClass =
  | "photo"
  | "presentation_pdf"
  | "legal_pdf"
  | "heic"
  | "video"
  | "other";

export type ManifestPhotoAction = "gallery" | "cover" | "skip";
export type ManifestPdfAction = "projectPdf" | "skip";
export type ManifestTextStrategy = "append" | "replace" | "skip";

export type EnrichManifest = {
  generatedAt: string;
  exportPath: string;
  products: ManifestProduct[];
  priceNote: "never modified";
};

export type ManifestProduct = {
  productName: string;
  topicId: number;
  topicTitle: string;
  photos: { messageId: number; relativePath: string; action: ManifestPhotoAction; reason?: string }[];
  pdfs: { messageId: number; relativePath: string; action: ManifestPdfAction; reason?: string; publicPath?: string }[];
  texts: { messageId: number; strategy: ManifestTextStrategy; preview: string }[];
  videos: { messageId: number; relativePath: string; action: "deferred" }[];
};
```

```ts
// scripts/telegram-enrich/topic-map.ts
export const TOPIC_MAP: Record<string, string> = {
  "ЖК Новый горизонт": "ЖК Новый Горизонт",
  "ЖК Московский": "ЖК Московский",
  "ЖкК высота": "ЖК Высота",
  "СК ЖБИ": "ЖК Мечта",
  "ЖК Август": "ЖК Август",
  "Жк Сите": "ЖК Сите",
  "Жк Гранд Берег - СК Унистрой": "ЖК Грандберег",
  "ЖК Ботаника - СК АРДВ": "ЖК Ботаника",
  "СК Аркадий СТ - Золотые пески - Новая жизнь": "ЖК Золотые Пески",
};

export function resolveProductName(topicTitle: string): string | null {
  return TOPIC_MAP[topicTitle] ?? null;
}

export function shouldSkipArcadaMessage(text: string): boolean {
  const t = text.toLowerCase();
  const mentionsNewLife = t.includes("новая жизнь");
  const mentionsGold = t.includes("золотые пески");
  return mentionsNewLife && !mentionsGold;
}
```

```ts
// scripts/telegram-enrich/classify-media.ts
import type { MediaClass } from "./types.ts";

const LEGAL_RE =
  /разрешен|зеленк|егрн|договор|уступк|выписк|дду|форм[аы]_/i;
const PRESENTATION_RE = /презентац|проектн(ое|ого)\s*предложен/i;

export function classifyFile(fileName: string, mimeType?: string): MediaClass {
  const lower = fileName.toLowerCase();
  const mime = (mimeType || "").toLowerCase();

  if (mime.includes("heic") || lower.endsWith(".heic")) return "heic";
  if (mime.startsWith("video/") || /\.(mp4|mov)$/i.test(lower)) return "video";
  if (mime === "application/pdf" || lower.endsWith(".pdf")) {
    if (LEGAL_RE.test(fileName)) return "legal_pdf";
    if (PRESENTATION_RE.test(fileName)) return "presentation_pdf";
    return "legal_pdf"; // unknown PDF → deny by default
  }
  if (mime.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(lower)) return "photo";
  return "other";
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm run test:telegram-enrich`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/telegram-enrich/
git commit -m "feat: add telegram enrich topic map and media classifiers"
```

---

### Task 2: Build manifest from export JSON

**Files:**
- Create: `scripts/telegram-enrich/text-allowlist.json`
- Create: `scripts/telegram-enrich/text.ts`
- Create: `scripts/telegram-enrich/build-manifest.ts`
- Create: `scripts/telegram-enrich/build-manifest.test.ts`
- Create: `scripts/telegram-enrich/text.test.ts`

**Interfaces:**
- Consumes: `resolveProductName`, `classifyFile`, `shouldSkipArcadaMessage`
- Produces: `messageText(msg): string`
- Produces: `plainToDetailHtml(text: string): string`
- Produces: `buildManifest(exportRoot: string, options?: { onlyProductName?: string; replaceCover?: boolean }): EnrichManifest`

- [ ] **Step 1: Write failing tests for text + minimal fixture manifest**

```ts
// scripts/telegram-enrich/text.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plainToDetailHtml } from "./text.ts";

describe("plainToDetailHtml", () => {
  it("escapes HTML and converts newlines to br", () => {
    assert.equal(
      plainToDetailHtml("A <b>x</b>\nB"),
      "A &lt;b&gt;x&lt;/b&gt;<br>B",
    );
  });
});
```

```ts
// scripts/telegram-enrich/build-manifest.test.ts
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { buildManifest } from "./build-manifest.ts";

describe("buildManifest", () => {
  it("maps topic photos and skips legal pdf", () => {
    const root = mkdtempSync(path.join(tmpdir(), "tg-enrich-"));
    mkdirSync(path.join(root, "photos"), { recursive: true });
    writeFileSync(
      path.join(root, "result.json"),
      JSON.stringify({
        name: "ЦНД",
        messages: [
          {
            id: 2,
            type: "service",
            action: "topic_created",
            title: "СК ЖБИ",
            date: "2026-09-09T00:00:00",
          },
          {
            id: 10,
            type: "message",
            reply_to_message_id: 2,
            photo: "photos/a.jpg",
            date: "2026-09-09T01:00:00",
            text: "",
          },
          {
            id: 11,
            type: "message",
            reply_to_message_id: 2,
            file: "files/Разрешение_на_строительство_x.pdf",
            file_name: "Разрешение_на_строительство_x.pdf",
            mime_type: "application/pdf",
            date: "2026-09-09T01:01:00",
            text: "",
          },
          {
            id: 12,
            type: "message",
            reply_to_message_id: 2,
            file: "files/ЖК МЕЧТА презентация .pdf",
            file_name: "ЖК МЕЧТА презентация .pdf",
            mime_type: "application/pdf",
            date: "2026-09-09T01:02:00",
            text: "",
          },
        ],
      }),
    );

    const manifest = buildManifest(root);
    const product = manifest.products.find((p) => p.productName === "ЖК Мечта");
    assert.ok(product);
    assert.equal(product.photos.length, 1);
    assert.equal(product.photos[0].action, "gallery");
    assert.equal(product.pdfs.find((p) => p.action === "projectPdf")?.relativePath.includes("презентац"), true);
    assert.ok(product.pdfs.some((p) => p.action === "skip"));
    assert.equal(manifest.priceNote, "never modified");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm run test:telegram-enrich`  
Expected: FAIL on missing modules

- [ ] **Step 3: Implement text allowlist + helpers + buildManifest**

`scripts/telegram-enrich/text-allowlist.json`:

```json
{
  "32": { "productName": "ЖК Мечта", "strategy": "append" },
  "33": { "productName": "ЖК Мечта", "strategy": "append" },
  "166": { "productName": "ЖК Грандберег", "strategy": "append" },
  "169": { "productName": "ЖК Золотые Пески", "strategy": "append" }
}
```

```ts
// scripts/telegram-enrich/text.ts
import allowlist from "./text-allowlist.json" with { type: "json" };
import type { ManifestTextStrategy } from "./types.ts";

export function plainToDetailHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r\n|\r|\n/g, "<br>");
}

export function getTextRule(messageId: number):
  | { productName: string; strategy: ManifestTextStrategy }
  | null {
  const rule = (allowlist as Record<string, { productName: string; strategy: ManifestTextStrategy }>)[
    String(messageId)
  ];
  return rule ?? null;
}

export function messageText(msg: { text?: unknown }): string {
  if (typeof msg.text === "string") return msg.text;
  if (Array.isArray(msg.text)) {
    return msg.text
      .map((part) => (typeof part === "string" ? part : (part as { text?: string }).text || ""))
      .join("");
  }
  return "";
}
```

`build-manifest.ts` outline (implement fully):

1. Read `result.json`
2. Index `topic_created` → `{ id, title }`
3. For each `type === "message"`, resolve topic via `reply_to_message_id` (if reply points to another message, walk once to topic root)
4. `resolveProductName(title)`; skip if null
5. If product is Золотые Пески and `shouldSkipArcadaMessage(text)` → skip message
6. Classify photo/file; push to product buckets
7. Photos default `action: "gallery"`; if `options.replaceCover` and first photo, `action: "cover"`
8. PDFs: `presentation_pdf` → `projectPdf` with `publicPath: /projects/<slug>.pdf` (slugify product name); else `skip`
9. Videos → `deferred`; HEIC → photo entry with `action: "skip", reason: "heic"`
10. Texts: if `getTextRule(id)` matches product → include with strategy + preview
11. Optional filter `--only` by product name
12. Return `{ generatedAt, exportPath, products, priceNote: "never modified" }`

Slug helper: copy the same `slugifyName` logic used in `src/lib/content.ts` into `scripts/telegram-enrich/slug.ts` (do not import from Next app).

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm run test:telegram-enrich`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/telegram-enrich/
git commit -m "feat: build telegram enrich manifest from chat export"
```

---

### Task 3: CLI dry-run

**Files:**
- Create: `scripts/telegram-enrich/cli.ts`
- Create: `scripts/enrich-from-telegram.ts` (thin entry for `sanity exec` or `tsx`)
- Modify: `studio-cnd/package.json` (script `enrich:telegram`)
- Modify: root `package.json` (script `enrich:telegram`)

**Interfaces:**
- Consumes: `buildManifest`
- Produces: writes `scripts/telegram-enrich/last-manifest.json` on dry-run/apply

- [ ] **Step 1: Implement CLI**

```ts
// scripts/telegram-enrich/cli.ts
import { writeFileSync } from "node:fs";
import path from "node:path";
import { buildManifest } from "./build-manifest.ts";

export async function runCli(argv: string[]) {
  const exportIdx = argv.indexOf("--export");
  if (exportIdx === -1 || !argv[exportIdx + 1]) {
    throw new Error("Usage: --export <ChatExportDir> [--dry-run|--apply] [--only Name] [--replace-cover]");
  }
  const exportPath = argv[exportIdx + 1];
  const dryRun = argv.includes("--dry-run") || !argv.includes("--apply");
  const replaceCover = argv.includes("--replace-cover");
  const onlyIdx = argv.indexOf("--only");
  const onlyProductName = onlyIdx >= 0 ? argv[onlyIdx + 1] : undefined;

  const manifest = buildManifest(exportPath, { onlyProductName, replaceCover });
  const out = path.resolve("scripts/telegram-enrich/last-manifest.json");
  writeFileSync(out, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Wrote ${out} (${manifest.products.length} products)`);

  if (dryRun) {
    console.log("Dry-run only. Pass --apply to upload/patch.");
    return;
  }

  const { applyManifest } = await import("./apply.ts");
  await applyManifest(exportPath, manifest, { replaceCover });
}
```

```ts
// scripts/enrich-from-telegram.ts
import { runCli } from "./telegram-enrich/cli.ts";

runCli(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Root script:

```json
"enrich:telegram": "npx --yes tsx scripts/enrich-from-telegram.ts"
```

- [ ] **Step 2: Dry-run against real export**

Run (adjust path if needed):

```bash
npm run enrich:telegram -- --export "c:/Users/mk/Downloads/Telegram Desktop/ChatExport_2026-10-14" --dry-run
```

Expected: `last-manifest.json` with mapped products only; legal PDFs `skip`; videos `deferred`; `priceNote: "never modified"`.

- [ ] **Step 3: Spot-check manifest**

Manually confirm Мечта has presentation PDF + photos; Информация/Запросы absent.

- [ ] **Step 4: Commit** (do not commit `last-manifest.json` if it contains local paths — add to `.gitignore`)

```gitignore
scripts/telegram-enrich/last-manifest.json
```

```bash
git add scripts/enrich-from-telegram.ts scripts/telegram-enrich/cli.ts package.json .gitignore
git commit -m "feat: add telegram enrich dry-run CLI"
```

---

### Task 4: Sanity schema `gallery`

**Files:**
- Modify: `studio-cnd/schemaTypes/documents/product.ts`
- Run typegen from `studio-cnd` when convenient

**Interfaces:**
- Produces: `gallery` field `array` of `image`

- [ ] **Step 1: Add gallery field after `image`**

```ts
defineField({
  name: 'gallery',
  title: 'Галерея',
  type: 'array',
  of: [{type: 'image', options: {hotspot: true}}],
}),
```

- [ ] **Step 2: Verify Studio loads**

Run: `cd studio-cnd && npm run dev`  
Expected: product editor shows «Галерея»

- [ ] **Step 3: Commit**

```bash
git add studio-cnd/schemaTypes/documents/product.ts
git commit -m "feat: add product gallery field in Sanity schema"
```

---

### Task 5: Web content mapping + property gallery UI

**Files:**
- Modify: `src/sanity/queries.ts`
- Modify: `src/lib/content.ts`
- Create: `src/app/zhk/property-gallery.tsx`
- Modify: `src/app/zhk/[slug]/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `Product.gallery?: string[]` (CDN URLs)
- Produces: `<PropertyGallery cover={string} images={string[]} name={string} />`

- [ ] **Step 1: Extend query + types + mapper**

In `PRODUCTS_QUERY` add:

```
gallery,
```

In `Product` type:

```ts
gallery?: string[];
```

In `SanityProduct`:

```ts
gallery?: unknown[] | null;
```

In map:

```ts
gallery: (product.gallery ?? [])
  .map((img) => imageUrl(img as never, 1200))
  .filter(Boolean),
```

- [ ] **Step 2: Client gallery component**

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";

export function PropertyGallery({
  cover,
  images,
  name,
}: {
  cover: string;
  images: string[];
  name: string;
}) {
  const slides = images.length ? images : [cover];
  const [index, setIndex] = useState(0);
  const current = slides[index] ?? cover;

  return (
    <div className="property-media">
      <Image
        src={current}
        alt={name}
        width={960}
        height={660}
        sizes="(max-width: 900px) 100vw, 50vw"
        quality={75}
        preload={index === 0}
      />
      {slides.length > 1 ? (
        <div className="property-thumbs" role="list">
          {slides.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              className={i === index ? "is-active" : undefined}
              aria-label={`Фото ${i + 1}`}
              onClick={() => setIndex(i)}
            >
              <Image src={src} alt="" width={120} height={80} sizes="120px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

When `gallery` is non-empty, pass `images={[cover, ...gallery]}` **or** `images={gallery}` with cover remaining first — prefer `[cover, ...gallery.filter(u => u !== cover)]` so cover stays first without dupes.

Replace the single `<Image>` in `page.tsx` property-media with:

```tsx
<PropertyGallery
  cover={product.image}
  images={product.gallery ?? []}
  name={product.name}
/>
```

CSS additions in `globals.css`:

```css
.property-thumbs{display:flex;gap:8px;overflow-x:auto;padding:10px;background:#e8eee8}
.property-thumbs button{border:0;padding:0;border-radius:8px;overflow:hidden;opacity:.7;cursor:pointer;flex:0 0 auto}
.property-thumbs button.is-active{opacity:1;outline:2px solid #2f5d50}
.property-thumbs img{display:block;width:72px;height:52px;object-fit:cover}
```

(Use existing forest/green tokens from the stylesheet instead of inventing a purple theme.)

- [ ] **Step 3: Smoke-check locally**

Run: `npm run dev` → open a product page  
Expected: thumbs appear only when gallery has images (empty OK before apply)

- [ ] **Step 4: Commit**

```bash
git add src/sanity/queries.ts src/lib/content.ts src/app/zhk/property-gallery.tsx src/app/zhk/[slug]/page.tsx src/app/globals.css
git commit -m "feat: render product gallery on web property pages"
```

---

### Task 6: Mobile gallery plumbing

**Files:**
- Modify: `mobile/src/lib/types.ts`
- Modify: `mobile/src/sanity/queries.ts`
- Modify: `mobile/src/lib/map-content.ts`
- Modify: `mobile/__tests__/map-content.test.ts`
- Modify: `mobile/app/zhk/[slug].tsx`

**Interfaces:**
- Produces: `Product.galleryUrls: string[]`

- [ ] **Step 1: Failing test for gallery mapping**

```ts
test("mapProduct maps galleryUrls", () => {
  const product = mapProduct({
    _id: "p1",
    name: "ЖК Тест",
    slug: "zhk-test",
    description: "",
    price: 1,
    city: "Махачкала",
    imageUrl: "https://cdn/cover.jpg",
    galleryUrls: ["https://cdn/a.jpg", "https://cdn/b.jpg"],
  });
  expect(product.galleryUrls).toEqual([
    "https://cdn/a.jpg",
    "https://cdn/b.jpg",
  ]);
});
```

Extend `ProductDto` / `Product` / `mapProduct` accordingly. Update queries:

```
"galleryUrls": gallery[].asset->url,
```

(or map via `imageUrl` like cover — follow existing cover pattern in `map-content.ts`).

- [ ] **Step 2: Run mobile test — FAIL then implement — PASS**

Run: `cd mobile && npm test -- map-content.test.ts`  
Expected: FAIL → implement → PASS

- [ ] **Step 3: Detail screen horizontal thumb strip**

Below the main `Image`, if `product.galleryUrls.length`:

```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {/* cover + gallery thumbs; onPress sets selectedUri state for main Image */}
</ScrollView>
```

Keep list cards on cover only.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/lib/types.ts mobile/src/sanity/queries.ts mobile/src/lib/map-content.ts mobile/__tests__/map-content.test.ts mobile/app/zhk/[slug].tsx
git commit -m "feat: show product gallery on mobile detail screen"
```

---

### Task 7: Apply path (Sanity upload + PDF + patch)

**Files:**
- Create: `scripts/telegram-enrich/apply.ts`
- Create: `scripts/telegram-enrich/apply-safety.test.ts` (assert patch shape never includes price)

**Interfaces:**
- Consumes: `EnrichManifest`
- Produces: `buildProductPatch(...): object` without `price`
- Produces: `applyManifest(exportRoot, manifest, options)`

- [ ] **Step 1: Safety unit test**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProductPatch } from "./apply.ts";

describe("buildProductPatch", () => {
  it("never includes price", () => {
    const patch = buildProductPatch({
      gallery: [],
      projectPdf: "/projects/x.pdf",
      detailHtml: "hi",
    });
    assert.equal("price" in patch, false);
  });
});
```

- [ ] **Step 2: Implement apply**

Use `getCliClient` from `sanity/cli` (same as `migrate-to-sanity.ts`), run via:

```json
"enrich:telegram:apply": "cd studio-cnd && sanity exec ../scripts/enrich-from-telegram.ts --with-user-token"
```

Or from apply module when `--apply`:

1. For each product in manifest, `fetch *[_type=="product" && name==$name][0]{_id, gallery, detailHtml, projectPdf, image}`
2. Upload each photo with `action !== skip"`; filename `tg-{messageId}-{basename}`; skip if asset with matching originalFilename already referenced in gallery
3. Append image refs to `gallery` (with `_key: tg-{messageId}`)
4. If cover action and `--replace-cover`, set `image`
5. Copy presentation PDF to `public/projects/<slug>.pdf` (`fs.copyFileSync`); set `projectPdf`
6. Texts: `append` → `detailHtml + "<br><br>" + plainToDetailHtml(text)` if not already contained; `replace` → overwrite
7. `client.patch(id).set(patch).commit()` — patch keys only among `gallery`, `image?`, `projectPdf?`, `detailHtml?`
8. Log summary; never log/set price

- [ ] **Step 3: Run safety test PASS; dry-run still works**

- [ ] **Step 4: Optional real apply (manual gate)**

```bash
npm run enrich:telegram -- --export "c:/Users/mk/Downloads/Telegram Desktop/ChatExport_2026-10-14" --apply --only "ЖК Мечта"
```

Verify in Studio: gallery filled, price unchanged, PDF link works.

- [ ] **Step 5: Commit**

```bash
git add scripts/telegram-enrich/apply.ts scripts/telegram-enrich/apply-safety.test.ts studio-cnd/package.json package.json
git commit -m "feat: apply telegram enrich manifest to Sanity products"
```

---

### Task 8: End-to-end verification checklist

**Files:** none (verification only); update design status if desired

- [ ] **Step 1: Full dry-run** — confirm mapped set only
- [ ] **Step 2: Apply all mapped products** (after spot-check)
- [ ] **Step 3: Compare prices** in Studio vs pre-apply notes / site.json — unchanged
- [ ] **Step 4: Web** `/zhk/...` gallery + PDF for enriched products
- [ ] **Step 5: Mobile** detail thumbs
- [ ] **Step 6: Re-run `--apply --only "ЖК Мечта"`** — no duplicate gallery keys/images
- [ ] **Step 7: Mark design spec Status: Implemented** (optional)

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Existing products only + TOPIC_MAP | 1–2 |
| Gallery schema | 4 |
| Photos → gallery, cover default keep | 2, 7 |
| Presentation PDF allow / legal deny | 1–2, 7 |
| HEIC skip, video deferred | 1–2 |
| Allowlisted texts → detailHtml | 2, 7 |
| Never change price | 2, 7 safety test |
| Dry-run / apply CLI | 3, 7 |
| Web gallery UI | 5 |
| Mobile gallery | 6 |
| Verification | 8 |
| No new ЖК / no live bot | Non-goals — no tasks |

## Placeholder / consistency check

- Types `EnrichManifest` / `ManifestProduct` defined in Task 1 and used in 2–3–7
- `classifyFile` return unions match manifest actions
- Cover policy: default gallery-only; `--replace-cover` optional — consistent with spec
