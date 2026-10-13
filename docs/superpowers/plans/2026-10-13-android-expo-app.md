# CND Android Expo App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an Android Expo app in `mobile/` that browses ЖК from Sanity, saves local favorites, receives broadcast pushes, and converts via quiz → WhatsApp plus call/WhatsApp — same CMS as cnd05.ru.

**Architecture:** Independent Expo Router app under `mobile/`. `@sanity/client` + GROQ for catalog/settings; AsyncStorage for favorite slugs; Expo Notifications for FCM/Expo push; `Linking` for tel/WhatsApp/PDF. Pure logic lives in `mobile/src/lib/` and is unit-tested with Jest; screens consume hooks.

**Tech Stack:** Expo (latest stable SDK) + Expo Router, TypeScript, React Native, `@sanity/client`, `@sanity/image-url`, `@react-native-async-storage/async-storage`, `expo-notifications`, `expo-linking`, `expo-web-browser`, Jest.

## Global Constraints

- App lives only in `mobile/` — do not merge into root Next.js `package.json`
- Sanity: project `8i7jup9p`, dataset `production`, API version `2026-10-11` (same as site)
- Android only for MVP; application id `ru.cnd05.app`
- No accounts, no comparison, no Capacitor/WebView of the site, no custom push backend
- Favorites: device-local slugs only; never shown on the website
- Conversion: quiz → WhatsApp message parity with site; plus `tel:` / WhatsApp shortcuts
- UI language: Russian
- Brand colors from `DESIGN.md`: forest `#193e35`, brass `#b39b65`, pale `#f3f5f2`, ink `#202d28`, muted `#68736d`, error `#a72e20`
- Spec: `docs/superpowers/specs/2026-10-13-android-expo-app-design.md`

---

## File Structure

```
mobile/
  package.json
  app.json
  eas.json
  .env.example
  .gitignore
  README.md
  tsconfig.json
  jest.config.js
  app/
    _layout.tsx                 # root: providers, notification observer, theme
    (tabs)/
      _layout.tsx               # Catalog | Favorites | Contacts
      index.tsx                 # Catalog
      favorites.tsx
      contacts.tsx
    zhk/[slug].tsx              # Product detail
    quiz.tsx                    # Quiz modal/stack screen
  src/
    theme/tokens.ts
    sanity/env.ts
    sanity/client.ts
    sanity/image.ts
    sanity/queries.ts
    lib/types.ts
    lib/map-content.ts          # Sanity → app types
    lib/format.ts               # money, phoneHref, stripHtml
    lib/whatsapp.ts             # whatsappURL, buildQuizMessage
    lib/catalog.ts              # filter/sort products
    lib/favorites-store.ts      # AsyncStorage read/write + pure helpers
    hooks/useFavorites.tsx
    hooks/useCatalogData.ts
    hooks/useSiteSettings.ts
    components/ProductCard.tsx
    components/EmptyState.tsx
    components/ErrorState.tsx
    components/FavoriteButton.tsx
    notifications/register.ts
    notifications/observer.ts
  __tests__/
    format.test.ts
    whatsapp.test.ts
    catalog.test.ts
    favorites-store.test.ts
    map-content.test.ts
```

---

### Task 1: Scaffold Expo app in `mobile/`

**Files:**
- Create: `mobile/` (via create-expo-app)
- Create: `mobile/.env.example`
- Create: `mobile/README.md`
- Modify: `mobile/app.json` (name, slug, android.package, scheme, plugins)
- Create: `mobile/eas.json`

**Interfaces:**
- Produces: runnable Expo project; scheme `cnd`; package `ru.cnd05.app`

- [ ] **Step 1: Create the Expo project**

From repo root `D:\Project\studio\cnd`:

```bash
npx create-expo-app@latest mobile --template tabs
```

Expected: `mobile/` with Expo Router tabs template and TypeScript.

- [ ] **Step 2: Install app dependencies**

```bash
cd mobile
npx expo install @sanity/client @sanity/image-url @react-native-async-storage/async-storage expo-notifications expo-device expo-constants expo-linking expo-web-browser
npm install --save-dev jest @types/jest ts-jest
```

- [ ] **Step 3: Configure `app.json`**

Set at least:

```json
{
  "expo": {
    "name": "ЦНД",
    "slug": "cnd",
    "scheme": "cnd",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "android": {
      "package": "ru.cnd05.app",
      "adaptiveIcon": {
        "backgroundColor": "#193e35"
      },
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": false,
          "data": [
            {
              "scheme": "cnd",
              "host": "zhk",
              "pathPrefix": "/"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "color": "#193e35"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

Keep existing icon/splash assets from the template until brand assets are added later.

- [ ] **Step 4: Add env example and EAS config**

`mobile/.env.example`:

```
EXPO_PUBLIC_SANITY_PROJECT_ID=8i7jup9p
EXPO_PUBLIC_SANITY_DATASET=production
EXPO_PUBLIC_SANITY_API_VERSION=2026-10-11
```

Copy to `mobile/.env` locally (do not commit `.env`).

`mobile/eas.json`:

```json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

`mobile/README.md` — short: how to `npm install`, copy `.env`, `npx expo start`, note that content comes from Sanity.

- [ ] **Step 5: Verify Expo starts**

```bash
cd mobile
npx expo start --android
```

Expected: Metro starts; Android emulator/device shows tabs template (or QR for Expo Go).

- [ ] **Step 6: Commit**

```bash
git add mobile
git commit -m "Scaffold Expo Android app under mobile/"
```

---

### Task 2: Theme tokens + Jest harness

**Files:**
- Create: `mobile/src/theme/tokens.ts`
- Create: `mobile/jest.config.js`
- Modify: `mobile/package.json` (test script)

**Interfaces:**
- Produces: `colors`, `spacing` exports from `src/theme/tokens.ts`

- [ ] **Step 1: Add theme tokens**

```ts
// mobile/src/theme/tokens.ts
export const colors = {
  forest: "#193e35",
  forestDeep: "#123128",
  forestHover: "#28594b",
  brass: "#b39b65",
  ink: "#202d28",
  muted: "#68736d",
  pale: "#f3f5f2",
  line: "#dce2dc",
  surface: "#ffffff",
  error: "#a72e20",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
```

- [ ] **Step 2: Configure Jest for TypeScript pure modules**

`mobile/jest.config.js`:

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleFileExtensions: ["ts", "tsx", "js"],
  testMatch: ["**/*.test.ts"],
};
```

In `mobile/package.json` scripts:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 3: Run Jest once (no tests yet)**

```bash
cd mobile
npm test
```

Expected: Jest exits with "No tests found" or similar non-zero — acceptable; next tasks add tests. If Jest errors on config, fix config before continuing.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/theme/tokens.ts mobile/jest.config.js mobile/package.json
git commit -m "Add CND theme tokens and Jest harness for mobile"
```

---

### Task 3: Sanity client, queries, mapping (TDD)

**Files:**
- Create: `mobile/src/sanity/env.ts`
- Create: `mobile/src/sanity/client.ts`
- Create: `mobile/src/sanity/image.ts`
- Create: `mobile/src/sanity/queries.ts`
- Create: `mobile/src/lib/types.ts`
- Create: `mobile/src/lib/map-content.ts`
- Create: `mobile/src/lib/format.ts`
- Test: `mobile/__tests__/format.test.ts`
- Test: `mobile/__tests__/map-content.test.ts`

**Interfaces:**
- Produces:
  - `Product`, `QuizQuestion`, `SiteSettings` types
  - `mapProduct(raw): Product`, `mapSiteSettings(raw): SiteSettings`
  - `money(value: number): string`, `phoneHref(phone: string): string`, `stripHtml(html: string): string`
  - `fetchProducts(): Promise<Product[]>`, `fetchProductBySlug(slug: string): Promise<Product | null>`, `fetchSiteSettings(): Promise<SiteSettings>`
  - Favorites key field: `product.slug: string` (required after mapping)

- [ ] **Step 1: Write failing format tests**

```ts
// mobile/__tests__/format.test.ts
import { money, phoneHref, stripHtml } from "../src/lib/format";

test("money formats RUB with ru-RU grouping", () => {
  expect(money(4500000)).toMatch(/4[\s\u00a0]500[\s\u00a0]000/);
  expect(money(4500000)).toContain("₽");
});

test("phoneHref strips non-digits except leading +", () => {
  expect(phoneHref("+7 (933) 211-61-98")).toBe("tel:+79332116198");
});

test("stripHtml removes tags and collapses space", () => {
  expect(stripHtml("<p>ЖК&nbsp;<b>Тест</b></p>")).toBe("ЖК Тест");
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd mobile
npm test -- __tests__/format.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement format helpers**

```ts
// mobile/src/lib/format.ts
export function money(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
```

- [ ] **Step 4: Run format tests — expect PASS**

```bash
cd mobile
npm test -- __tests__/format.test.ts
```

- [ ] **Step 5: Write failing map-content tests**

```ts
// mobile/__tests__/map-content.test.ts
import { mapProduct, mapSiteSettings } from "../src/lib/map-content";

test("mapProduct prefers slug.current and builds image URL string", () => {
  const product = mapProduct({
    _id: "p1",
    legacyId: "legacy-1",
    name: "ЖК Тест",
    slug: "zhk-test",
    description: "Описание",
    detailHtml: "<p>Детали</p>",
    price: 1000000,
    city: "Махачкала",
    imageUrl: "https://cdn.sanity.io/images/example.jpg",
    projectPdf: "https://example.com/a.pdf",
  });
  expect(product).toEqual({
    id: "legacy-1",
    sanityId: "p1",
    name: "ЖК Тест",
    slug: "zhk-test",
    description: "Описание",
    detailHtml: "<p>Детали</p>",
    price: 1000000,
    city: "Махачкала",
    imageUrl: "https://cdn.sanity.io/images/example.jpg",
    projectPdf: "https://example.com/a.pdf",
  });
});

test("mapProduct falls back id to _id and empty optional fields", () => {
  const product = mapProduct({
    _id: "p2",
    name: "Без slug",
    slug: "bez-slug",
    description: "",
    price: 0,
    city: "Каспийск",
    imageUrl: "",
  });
  expect(product.id).toBe("p2");
  expect(product.projectPdf).toBeUndefined();
  expect(product.detailHtml).toBe("");
});

test("mapSiteSettings maps contacts and quiz", () => {
  const settings = mapSiteSettings({
    quizIntro: "Intro",
    about: ["A"],
    founder: { name: "Мустафа", role: "Основатель", bio: "Bio", imageUrl: "" },
    contacts: {
      phone: "+7 933",
      email: "a@b.c",
      address: "Адрес",
      whatsapp: "https://wa.me/79332116198",
      telegram: "https://t.me/x",
      instagram: "https://instagram.com/x",
    },
    quiz: [{ title: "Планировка", options: ["1", "2"], images: [] }],
  });
  expect(settings.contacts.whatsapp).toContain("wa.me");
  expect(settings.quiz[0].title).toBe("Планировка");
  expect(settings.founder.name).toBe("Мустафа");
});
```

- [ ] **Step 6: Run map tests — expect FAIL**

```bash
cd mobile
npm test -- __tests__/map-content.test.ts
```

- [ ] **Step 7: Implement types, Sanity layer, mapping**

```ts
// mobile/src/lib/types.ts
export type Product = {
  id: string;
  sanityId: string;
  name: string;
  slug: string;
  description: string;
  detailHtml: string;
  price: number;
  city: string;
  imageUrl: string;
  projectPdf?: string;
};

export type QuizQuestion = {
  title: string;
  options: string[];
  images: string[];
};

export type SiteSettings = {
  quizIntro: string;
  about: string[];
  founder: { name: string; role: string; bio: string; imageUrl: string };
  contacts: {
    phone: string;
    email: string;
    address: string;
    whatsapp: string;
    telegram: string;
    instagram: string;
  };
  quiz: QuizQuestion[];
};
```

```ts
// mobile/src/sanity/env.ts
export const projectId = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.EXPO_PUBLIC_SANITY_DATASET ?? "";
export const apiVersion =
  process.env.EXPO_PUBLIC_SANITY_API_VERSION ?? "2026-10-11";

export function assertSanityEnv() {
  if (!projectId || !dataset) {
    throw new Error(
      "Missing EXPO_PUBLIC_SANITY_PROJECT_ID or EXPO_PUBLIC_SANITY_DATASET",
    );
  }
}
```

```ts
// mobile/src/sanity/client.ts
import { createClient } from "@sanity/client";
import { apiVersion, assertSanityEnv, dataset, projectId } from "./env";

assertSanityEnv();

export const sanity = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});
```

```ts
// mobile/src/sanity/image.ts
import { createImageUrlBuilder } from "@sanity/image-url";
import { dataset, projectId } from "./env";

const builder = createImageUrlBuilder({ projectId, dataset });

export function imageUrl(
  source: Parameters<typeof builder.image>[0] | string | null | undefined,
  width = 1200,
): string {
  if (!source) return "";
  if (typeof source === "string") return source;
  return builder.image(source).width(width).auto("format").url();
}
```

```ts
// mobile/src/sanity/queries.ts
export const PRODUCTS_QUERY = `*[_type == "product"] | order(sortOrder asc) {
  _id,
  legacyId,
  name,
  "slug": slug.current,
  description,
  detailHtml,
  price,
  city,
  image,
  projectPdf,
  sortOrder
}`;

export const PRODUCT_BY_SLUG_QUERY = `*[_type == "product" && slug.current == $slug][0] {
  _id,
  legacyId,
  name,
  "slug": slug.current,
  description,
  detailHtml,
  price,
  city,
  image,
  projectPdf,
  sortOrder
}`;

export const SITE_SETTINGS_QUERY = `*[_id == "siteSettings"][0]{
  quizIntro,
  about,
  founder{ name, role, bio, image },
  contacts{ phone, email, address, whatsapp, telegram, instagram },
  quiz[]{ title, options, images }
}`;
```

Implement `map-content.ts` so GROQ results are mapped with `imageUrl(...)` for images; for unit tests, accept a pre-resolved `imageUrl` string on a DTO shape OR export a lower-level mapper that accepts already-stringified image URLs (as in the tests above). Recommended: tests call mappers with plain DTOs that already have `imageUrl` strings; live fetch functions resolve Sanity images then call the same mappers.

```ts
// mobile/src/lib/map-content.ts
import type { Product, SiteSettings } from "./types";
import { imageUrl } from "../sanity/image";
import { sanity } from "../sanity/client";
import {
  PRODUCT_BY_SLUG_QUERY,
  PRODUCTS_QUERY,
  SITE_SETTINGS_QUERY,
} from "../sanity/queries";

type ProductDto = {
  _id: string;
  legacyId?: string | null;
  name: string;
  slug: string | null;
  description: string;
  detailHtml?: string | null;
  price: number;
  city: string;
  imageUrl?: string;
  image?: unknown;
  projectPdf?: string | null;
};

type SettingsDto = {
  quizIntro?: string | null;
  about?: string[] | null;
  founder?: {
    name?: string | null;
    role?: string | null;
    bio?: string | null;
    imageUrl?: string;
    image?: unknown;
  } | null;
  contacts?: Partial<SiteSettings["contacts"]> | null;
  quiz?:
    | {
        title?: string | null;
        options?: string[] | null;
        images?: unknown[] | null;
      }[]
    | null;
};

export function mapProduct(raw: ProductDto): Product {
  const slug = raw.slug?.trim();
  if (!slug) {
    throw new Error(`Product ${raw._id} missing slug`);
  }
  return {
    id: raw.legacyId || raw._id,
    sanityId: raw._id,
    name: raw.name,
    slug,
    description: raw.description || "",
    detailHtml: raw.detailHtml || "",
    price: raw.price,
    city: raw.city,
    imageUrl: raw.imageUrl ?? imageUrl(raw.image as never, 1200),
    projectPdf: raw.projectPdf || undefined,
  };
}

export function mapSiteSettings(raw: SettingsDto): SiteSettings {
  return {
    quizIntro: raw.quizIntro || "",
    about: raw.about ?? [],
    founder: {
      name: raw.founder?.name || "",
      role: raw.founder?.role || "",
      bio: raw.founder?.bio || "",
      imageUrl:
        raw.founder?.imageUrl ?? imageUrl(raw.founder?.image as never, 800),
    },
    contacts: {
      phone: raw.contacts?.phone || "",
      email: raw.contacts?.email || "",
      address: raw.contacts?.address || "",
      whatsapp: raw.contacts?.whatsapp || "",
      telegram: raw.contacts?.telegram || "",
      instagram: raw.contacts?.instagram || "",
    },
    quiz: (raw.quiz ?? []).map((q) => ({
      title: q.title || "",
      options: q.options ?? [],
      images: (q.images ?? [])
        .map((img) =>
          typeof img === "string" ? img : imageUrl(img as never, 800),
        )
        .filter(Boolean),
    })),
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const rows = await sanity.fetch<ProductDto[]>(PRODUCTS_QUERY);
  return (rows ?? [])
    .filter((row) => row.slug)
    .map((row) => mapProduct(row));
}

export async function fetchProductBySlug(
  slug: string,
): Promise<Product | null> {
  const row = await sanity.fetch<ProductDto | null>(PRODUCT_BY_SLUG_QUERY, {
    slug,
  });
  if (!row?.slug) return null;
  return mapProduct(row);
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const raw = await sanity.fetch<SettingsDto | null>(SITE_SETTINGS_QUERY);
  if (!raw) {
    throw new Error("Sanity siteSettings not found");
  }
  return mapSiteSettings(raw);
}
```

Note: `mapProduct` / `mapSiteSettings` unit tests use DTOs with `imageUrl` already set so Jest does not need Sanity credentials. `sanity/client.ts` calls `assertSanityEnv()` at import — for unit tests of mappers only, either lazy-init the client inside fetch functions (preferred) or mock env vars in Jest `setupFiles`. **Prefer lazy client:**

```ts
// mobile/src/sanity/client.ts (lazy version)
import { createClient, type SanityClient } from "@sanity/client";
import { apiVersion, assertSanityEnv, dataset, projectId } from "./env";

let client: SanityClient | null = null;

export function getSanity(): SanityClient {
  if (!client) {
    assertSanityEnv();
    client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
    });
  }
  return client;
}
```

Update `map-content.ts` fetch helpers to use `getSanity()` instead of importing a hot client.

- [ ] **Step 8: Run all lib tests — expect PASS**

```bash
cd mobile
npm test
```

- [ ] **Step 9: Commit**

```bash
git add mobile/src mobile/__tests__
git commit -m "Add Sanity client and content mappers for mobile app"
```

---

### Task 4: Catalog filter/sort + WhatsApp quiz message (TDD)

**Files:**
- Create: `mobile/src/lib/catalog.ts`
- Create: `mobile/src/lib/whatsapp.ts`
- Test: `mobile/__tests__/catalog.test.ts`
- Test: `mobile/__tests__/whatsapp.test.ts`

**Interfaces:**
- Produces:
  - `filterProducts(products, { city, query, sort }): Product[]`
  - `CityFilter = "all" | string`
  - `SortMode = "default" | "asc" | "desc"`
  - `whatsappURL(base: string, message: string): string`
  - `isCustomOption(value: string): boolean`
  - `buildQuizMessage({ quiz, answers, customs, contactName, contactPhone, productName? }): string`

- [ ] **Step 1: Write failing catalog tests**

```ts
// mobile/__tests__/catalog.test.ts
import { filterProducts } from "../src/lib/catalog";
import type { Product } from "../src/lib/types";

const sample: Product[] = [
  {
    id: "1",
    sanityId: "1",
    name: "Каспий Резиденс",
    slug: "kaspiy",
    description: "У моря",
    detailHtml: "",
    price: 3000000,
    city: "Каспийск",
    imageUrl: "",
  },
  {
    id: "2",
    sanityId: "2",
    name: "Центр Махачкала",
    slug: "centr",
    description: "В центре",
    detailHtml: "",
    price: 5000000,
    city: "Махачкала",
    imageUrl: "",
  },
];

test("filters by city", () => {
  expect(
    filterProducts(sample, { city: "Каспийск", query: "", sort: "default" }),
  ).toHaveLength(1);
});

test("filters by query case-insensitively", () => {
  expect(
    filterProducts(sample, { city: "all", query: "центр", sort: "default" }),
  ).toEqual([sample[1]]);
});

test("sorts by price asc/desc", () => {
  const asc = filterProducts(sample, {
    city: "all",
    query: "",
    sort: "asc",
  });
  expect(asc.map((p) => p.slug)).toEqual(["kaspiy", "centr"]);
  const desc = filterProducts(sample, {
    city: "all",
    query: "",
    sort: "desc",
  });
  expect(desc.map((p) => p.slug)).toEqual(["centr", "kaspiy"]);
});
```

- [ ] **Step 2: Implement catalog helper**

```ts
// mobile/src/lib/catalog.ts
import type { Product } from "./types";

export type CityFilter = "all" | string;
export type SortMode = "default" | "asc" | "desc";

export function filterProducts(
  products: Product[],
  opts: { city: CityFilter; query: string; sort: SortMode },
): Product[] {
  const q = opts.query.trim().toLocaleLowerCase("ru");
  let list = products.filter(
    (p) =>
      (opts.city === "all" || p.city === opts.city) &&
      `${p.name} ${p.description}`.toLocaleLowerCase("ru").includes(q),
  );
  if (opts.sort !== "default") {
    list = [...list].sort((a, b) =>
      opts.sort === "asc" ? a.price - b.price : b.price - a.price,
    );
  }
  return list;
}

export const CITIES = ["Махачкала", "Каспийск", "Дербент"] as const;
```

- [ ] **Step 3: Write failing WhatsApp tests**

```ts
// mobile/__tests__/whatsapp.test.ts
import {
  buildQuizMessage,
  isCustomOption,
  whatsappURL,
} from "../src/lib/whatsapp";

test("whatsappURL sets text query param", () => {
  const href = whatsappURL("https://wa.me/79332116198", "Привет");
  expect(href).toContain("wa.me/79332116198");
  expect(decodeURIComponent(href)).toContain("Привет");
});

test("isCustomOption detects custom labels", () => {
  expect(isCustomOption("Свой вариант")).toBe(true);
  expect(isCustomOption("1-комнатная")).toBe(false);
});

test("buildQuizMessage includes answers and optional product", () => {
  const msg = buildQuizMessage({
    quiz: [{ title: "Планировка", options: [], images: [] }],
    answers: [["Студия"]],
    customs: [""],
    contactName: "Али",
    contactPhone: "+7999",
    productName: "ЖК Тест",
  });
  expect(msg).toContain("Помогите подобрать квартиру");
  expect(msg).toContain("Планировка Студия");
  expect(msg).toContain("ФИО: Али");
  expect(msg).toContain("Телефон: +7999");
  expect(msg).toContain("Интересует ЖК: ЖК Тест");
});
```

- [ ] **Step 4: Implement WhatsApp helpers**

```ts
// mobile/src/lib/whatsapp.ts
import type { QuizQuestion } from "./types";

export function whatsappURL(base: string, message: string) {
  const link = new URL(base);
  link.searchParams.set("text", message);
  return link.href;
}

export function isCustomOption(value: string) {
  return /^(Свой|Ваш) вариант$/.test(value);
}

function answerText(
  answers: string[][],
  customs: string[],
  index: number,
) {
  return (answers[index] || [])
    .map((value) =>
      isCustomOption(value) ? customs[index] || value : value,
    )
    .join(", ");
}

export function buildQuizMessage(input: {
  quiz: QuizQuestion[];
  answers: string[][];
  customs: string[];
  contactName: string;
  contactPhone: string;
  productName?: string;
}) {
  return [
    "Добрый день! Помогите подобрать квартиру.",
    input.productName ? `Интересует ЖК: ${input.productName}` : "",
    ...input.quiz.map(
      (q, i) => `${q.title} ${answerText(input.answers, input.customs, i)}`,
    ),
    input.contactName ? `ФИО: ${input.contactName}` : "",
    input.contactPhone ? `Телефон: ${input.contactPhone}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd mobile
npm test
```

- [ ] **Step 6: Commit**

```bash
git add mobile/src/lib/catalog.ts mobile/src/lib/whatsapp.ts mobile/__tests__
git commit -m "Add catalog filter and WhatsApp quiz message helpers"
```

---

### Task 5: Favorites store (TDD)

**Files:**
- Create: `mobile/src/lib/favorites-store.ts`
- Create: `mobile/hooks/useFavorites.tsx`
- Test: `mobile/__tests__/favorites-store.test.ts`

**Interfaces:**
- Produces:
  - `FAVORITES_KEY = "cnd.favorites.slugs"`
  - `normalizeSlugs(slugs: string[]): string[]` (unique, stable order)
  - `toggleSlug(slugs: string[], slug: string): string[]`
  - `loadFavoriteSlugs(): Promise<string[]>`
  - `saveFavoriteSlugs(slugs: string[]): Promise<void>`
  - `FavoritesProvider` + `useFavorites()` → `{ slugs, isFavorite(slug), toggle(slug), ready }`

- [ ] **Step 1: Write failing pure-store tests**

```ts
// mobile/__tests__/favorites-store.test.ts
import { normalizeSlugs, toggleSlug } from "../src/lib/favorites-store";

test("normalizeSlugs dedupes and drops empties", () => {
  expect(normalizeSlugs(["a", "", "a", "b"])).toEqual(["a", "b"]);
});

test("toggleSlug adds and removes", () => {
  expect(toggleSlug([], "x")).toEqual(["x"]);
  expect(toggleSlug(["x", "y"], "x")).toEqual(["y"]);
});
```

- [ ] **Step 2: Implement store**

```ts
// mobile/src/lib/favorites-store.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const FAVORITES_KEY = "cnd.favorites.slugs";

export function normalizeSlugs(slugs: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of slugs) {
    const slug = raw.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

export function toggleSlug(slugs: string[], slug: string): string[] {
  const set = new Set(normalizeSlugs(slugs));
  if (set.has(slug)) set.delete(slug);
  else set.add(slug);
  return Array.from(set);
}

export async function loadFavoriteSlugs(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return normalizeSlugs(parsed.map(String));
  } catch {
    return [];
  }
}

export async function saveFavoriteSlugs(slugs: string[]): Promise<void> {
  await AsyncStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(normalizeSlugs(slugs)),
  );
}
```

For pure unit tests, Jest may fail resolving the AsyncStorage native module when importing the file. Split pure helpers into the same file but ensure tests only import pure functions — if Jest still evaluates AsyncStorage import, add:

```js
// mobile/jest.setup.js
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
```

and reference it from `jest.config.js` via `setupFiles: ["<rootDir>/jest.setup.js"]`. Install mock if needed:

```bash
cd mobile
npm install --save-dev @react-native-async-storage/async-storage
```

(Already a runtime dependency; mock path ships with the package.)

- [ ] **Step 3: Implement FavoritesProvider**

```tsx
// mobile/hooks/useFavorites.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadFavoriteSlugs,
  saveFavoriteSlugs,
  toggleSlug,
} from "../src/lib/favorites-store";

type FavoritesContextValue = {
  slugs: string[];
  ready: boolean;
  isFavorite: (slug: string) => boolean;
  toggle: (slug: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadFavoriteSlugs().then((value) => {
      if (!alive) return;
      setSlugs(value);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback((slug: string) => {
    setSlugs((prev) => {
      const next = toggleSlug(prev, slug);
      void saveFavoriteSlugs(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      slugs,
      ready,
      isFavorite: (slug: string) => slugs.includes(slug),
      toggle,
    }),
    [slugs, ready, toggle],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd mobile
npm test
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/lib/favorites-store.ts mobile/hooks/useFavorites.tsx mobile/__tests__/favorites-store.test.ts mobile/jest.setup.js mobile/jest.config.js
git commit -m "Add local favorites store and FavoritesProvider"
```

---

### Task 6: Navigation shell + shared UI chrome

**Files:**
- Modify: `mobile/app/_layout.tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx`
- Create: `mobile/src/components/EmptyState.tsx`
- Create: `mobile/src/components/ErrorState.tsx`
- Create: `mobile/src/components/FavoriteButton.tsx`
- Create: `mobile/src/components/ProductCard.tsx`

**Interfaces:**
- Consumes: `FavoritesProvider`, `colors`
- Produces: tab routes `index` / `favorites` / `contacts`; shared card + states

- [ ] **Step 1: Wire root layout**

Replace template root layout so it wraps `FavoritesProvider`, sets StatusBar, and uses stack for `zhk/[slug]` and `quiz`:

- Tabs group as main UI
- `zhk/[slug]` and `quiz` as stack screens (`quiz` presentation: `modal`)

Use Expo Router patterns from the tabs template; keep Russian titles: «Каталог», «Избранное», «Контакты».

- [ ] **Step 2: Build shared components**

`EmptyState` / `ErrorState`: title, optional subtitle, optional retry button (forest/brass styling).

`FavoriteButton`: heart toggle calling `useFavorites().toggle(slug)`; accessibility label «В избранное» / «Убрать из избранного».

`ProductCard`: image, name, city, `money(price)`, favorite button; `onPress` → `router.push(`/zhk/${slug}`)`.

- [ ] **Step 3: Manual smoke**

```bash
cd mobile
npx expo start
```

Expected: three Russian tabs visible; placeholder screens ok for now.

- [ ] **Step 4: Commit**

```bash
git add mobile/app mobile/src/components
git commit -m "Add Expo navigation shell and shared product UI"
```

---

### Task 7: Catalog screen

**Files:**
- Create: `mobile/hooks/useCatalogData.ts`
- Modify: `mobile/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `fetchProducts`, `filterProducts`, `ProductCard`
- Produces: working catalog with city chips, search, sort, quiz CTA, error/retry

- [ ] **Step 1: Hook `useCatalogData`**

Load products on mount; expose `{ products, loading, error, reload }`.

- [ ] **Step 2: Implement catalog UI**

- City chips: Все + `CITIES`
- TextInput search
- Sort control: по умолчанию / дешевле / дороже
- FlatList of `ProductCard`
- Header button «Подобрать» → `/quiz`
- ErrorState on failure; EmptyState when filters match nothing

- [ ] **Step 3: Manual verify against Sanity**

With `.env` set, confirm real ЖК names/prices load (same dataset as site).

- [ ] **Step 4: Commit**

```bash
git add mobile/app/(tabs)/index.tsx mobile/hooks/useCatalogData.ts
git commit -m "Implement catalog screen with Sanity data and filters"
```

---

### Task 8: Product detail screen

**Files:**
- Modify: `mobile/app/zhk/[slug].tsx`

**Interfaces:**
- Consumes: `fetchProductBySlug`, `useFavorites`, `phoneHref`, `whatsappURL`, `fetchSiteSettings` (for WhatsApp base) or pass contacts via parallel fetch
- Produces: detail with favorite, call, WhatsApp, PDF, quiz CTA with productName

- [ ] **Step 1: Implement detail screen**

- Load by `useLocalSearchParams().slug`
- Show image, name, city, price, description / stripped detailHtml
- Actions:
  - FavoriteButton
  - Позвонить → `Linking.openURL(phoneHref(phone))`
  - WhatsApp → open contacts.whatsapp (optional short message with ЖК name)
  - PDF → `WebBrowser.openBrowserAsync(projectPdf)` if present
  - «Подобрать квартиру» → `router.push({ pathname: "/quiz", params: { productName } })`
- Missing product → EmptyState «Объект не найден»
- Fetch error → ErrorState + retry

- [ ] **Step 2: Manual verify**

Open a known slug from catalog; test call/WhatsApp/PDF/favorite.

- [ ] **Step 3: Commit**

```bash
git add mobile/app/zhk
git commit -m "Add ЖК detail screen with conversion actions"
```

---

### Task 9: Favorites tab

**Files:**
- Modify: `mobile/app/(tabs)/favorites.tsx`

**Interfaces:**
- Consumes: `useFavorites`, `fetchProducts` (or filter in-memory from catalog cache)
- Produces: list of favorited products; drop missing slugs quietly

- [ ] **Step 1: Implement favorites screen**

- If `!ready` show loading
- Load all products (reuse `useCatalogData` or fetch once); `products.filter(p => slugs.includes(p.slug))`
- EmptyState: «Пока ничего нет» + button to catalog `router.push("/")`
- ProductCard with remove via favorite toggle

- [ ] **Step 2: Manual verify persistence**

Force-close app / reload; favorites remain.

- [ ] **Step 3: Commit**

```bash
git add mobile/app/(tabs)/favorites.tsx
git commit -m "Implement favorites tab with local persistence"
```

---

### Task 10: Contacts screen

**Files:**
- Create: `mobile/hooks/useSiteSettings.ts`
- Modify: `mobile/app/(tabs)/contacts.tsx`

**Interfaces:**
- Consumes: `fetchSiteSettings`
- Produces: phone/WhatsApp/Telegram/email/address + short about/founder

- [ ] **Step 1: Implement contacts**

- Linking actions for each available channel (hide empty)
- Show `about` paragraphs and founder name/role/bio if present
- Error/retry states

- [ ] **Step 2: Manual verify**

Tap phone and WhatsApp.

- [ ] **Step 3: Commit**

```bash
git add mobile/hooks/useSiteSettings.ts mobile/app/(tabs)/contacts.tsx
git commit -m "Implement contacts screen from Sanity settings"
```

---

### Task 11: Quiz screen → WhatsApp

**Files:**
- Modify: `mobile/app/quiz.tsx`

**Interfaces:**
- Consumes: `fetchSiteSettings`, `buildQuizMessage`, `whatsappURL`, `isCustomOption`
- Route params: optional `productName?: string`

- [ ] **Step 1: Port quiz flow from site behavior**

Mirror `src/app/quiz-panel.tsx` logic:

- Steps = quiz questions + final contact/consent step
- Selection mode **must match site** (`src/app/quiz-panel.tsx`): multi-select (checkbox) **only when `step === 2`** (районы); all other question steps are single-select (radio). Show help text «Отметьте один или несколько вариантов» only on step 2.
- Custom option requires text
- Final step: name (optional), phone (optional with same regex), consent required
- On submit: `Linking.openURL(whatsappURL(contacts.whatsapp, buildQuizMessage(...)))` then `router.back()`

- [ ] **Step 2: Manual verify**

Complete quiz; WhatsApp opens with Russian message including answers.

- [ ] **Step 3: Commit**

```bash
git add mobile/app/quiz.tsx
git commit -m "Add quiz flow that opens WhatsApp with answers"
```

---

### Task 12: Push notifications + deep links

**Files:**
- Create: `mobile/src/notifications/register.ts`
- Create: `mobile/src/notifications/observer.ts`
- Modify: `mobile/app/_layout.tsx`

**Interfaces:**
- Produces: permission request; Expo push token logged in dev; notification tap navigates to `/zhk/[slug]` when `data.slug` or `data.url` present

- [ ] **Step 1: Implement registration helper**

```ts
// mobile/src/notifications/register.ts
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  if (!Device.isDevice) {
    return null;
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return null;

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) {
    // Expo Go / local: still attempt without projectId when supported
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch {
      return null;
    }
  }
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}
```

- [ ] **Step 2: Observer for taps**

```ts
// mobile/src/notifications/observer.ts
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

function redirectFromNotification(notification: Notifications.Notification) {
  const data = notification.request.content.data as {
    slug?: string;
    url?: string;
  };
  if (typeof data?.url === "string") {
    router.push(data.url as never);
    return;
  }
  if (typeof data?.slug === "string" && data.slug) {
    router.push(`/zhk/${data.slug}`);
  }
}

export function useNotificationObserver() {
  useEffect(() => {
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) {
      redirectFromNotification(last.notification);
    }
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      redirectFromNotification(response.notification);
    });
    return () => sub.remove();
  }, []);
}
```

Call `useNotificationObserver()` and `registerForPushNotificationsAsync()` once from root layout (after first paint). Log token with `console.log` in `__DEV__` for manual Expo push tool testing.

Deep link scheme: also handle `cnd://zhk/{slug}` via Expo Router linking config if not automatic — with `scheme: "cnd"` and route `zhk/[slug]`, path `cnd://zhk/kaspiy` should resolve; verify manually.

- [ ] **Step 3: Manual verify**

- Permission prompt appears on device
- Send test push from Expo push tool with `{ "slug": "<existing-slug>" }`
- Tap opens detail

- [ ] **Step 4: Commit**

```bash
git add mobile/src/notifications mobile/app/_layout.tsx
git commit -m "Add push registration and notification deep links"
```

---

### Task 13: Play readiness notes + acceptance pass

**Files:**
- Modify: `mobile/README.md`
- Create or note: privacy policy requirement on site (document in README; implementing `/privacy` page on Next site only if missing — check `src/app` first; if absent, add a minimal static privacy page in a follow-up commit within this task)

**Interfaces:**
- Produces: documented EAS build commands + completed manual checklist

- [ ] **Step 1: Extend mobile README**

Include:

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
# production Android bundle
npx eas build -p android --profile production
```

Document: broadcast pushes via Expo/FCM console; Data safety must disclose push tokens; privacy policy URL on cnd05.ru required before store submit.

- [ ] **Step 2: Privacy policy on site if missing**

If no privacy route exists, add a minimal Russian privacy page at `src/app/privacy/page.tsx` covering: contacts via WhatsApp/phone, app favorites stored on device, push tokens for notifications. Link from site footer only if footer already has legal links; otherwise README is enough for MVP store prep.

- [ ] **Step 3: Run automated tests**

```bash
cd mobile
npm test
```

Expected: all unit tests PASS.

- [ ] **Step 4: Manual acceptance checklist** (tick in PR / commit message)

- Catalog loads; city / search / sort work
- Detail + PDF
- Favorites persist
- Favorites tab
- Quiz → WhatsApp
- Call / WhatsApp from detail and contacts
- Push permission + open with slug
- Offline/error retry UI

- [ ] **Step 5: Commit**

```bash
git add mobile/README.md src/app/privacy  # if created
git commit -m "Document mobile build/store steps and finish MVP acceptance notes"
```

---

## Self-Review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Expo in `mobile/` | Task 1 |
| Sanity same project/dataset | Task 3 |
| Catalog filter/search/sort | Tasks 4, 7 |
| Favorites local AsyncStorage | Tasks 5, 9 |
| Broadcast pushes + deep link | Task 12 |
| Quiz + call/WhatsApp | Tasks 8, 10, 11 |
| Contacts | Task 10 |
| Brand tokens | Task 2 |
| Error/retry + empty | Tasks 6–10 |
| EAS / Play notes | Tasks 1, 13 |
| No Capacitor / no accounts / Android only | Global Constraints |

No TBD placeholders. Types use `Product.slug` consistently for favorites and routes.
