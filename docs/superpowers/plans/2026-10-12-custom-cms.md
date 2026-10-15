# Custom Headless CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private multi-tenant headless CMS as a single Next.js app (admin UI + REST API) with DB-stored schemas, draft/publish, and per-project `db`/`s3` media — clients get only URL + login; consumer sites use plain `fetch`.

**Architecture:** One clean Next.js repo (App Router). Admin pages + `/api/admin/*` (session cookie) + `/api/v1/*` (API key). Postgres via Prisma. No monorepo, no SDK package — sites call the public API with `fetch`.

**Tech Stack:** Next.js (current stable), React, TypeScript, Prisma, PostgreSQL, argon2, Zod, Vitest, `@aws-sdk/client-s3` (S3 adapter), HTML `<textarea>` for `richtext` MVP.

## Global Constraints

- Single Next.js project — no Nest/Hono, no pnpm workspaces, no `packages/sdk`
- Consumer integration: plain `fetch` + `Authorization: Bearer <apiKey>` (document in README)
- One shared Postgres for all projects; schemas in DB (`content_types.fields` JSON)
- Roles only: `superadmin` | `editor` (editor: content + media only)
- Field types MVP: `string`, `text`, `number`, `boolean`, `image`, `file`, `reference`, `array`, `richtext` (HTML string), `slug`, `datetime`, `object` (one nesting level)
- Public API returns published data only; filters: `type`, `limit`, `offset`
- Storage driver per project: `db` | `s3`; public media always via `/api/v1/:projectId/media/:id`
- Password hashing: argon2; API keys stored as hash; CORS allowlist on project (empty = deny browser origins)
- Out of scope: SDK package, version history, draft preview, webhooks, i18n, page builder, Sanity migration
- Spec reference: `docs/superpowers/specs/2026-10-12-custom-cms-design.md` (amendment: fetch instead of SDK)

---

## File Structure (new repo — push this as the CMS project)

```
/
  package.json
  .env.example
  .gitignore
  README.md
  prisma/
    schema.prisma
    seed.ts
  vitest.config.ts
  src/
    app/
      layout.tsx
      page.tsx                          # → /projects or /login
      login/page.tsx
      projects/page.tsx
      projects/[projectId]/page.tsx
      projects/[projectId]/types/page.tsx
      projects/[projectId]/keys/page.tsx
      projects/[projectId]/members/page.tsx
      projects/[projectId]/media/page.tsx
      projects/[projectId]/entries/[type]/page.tsx
      projects/[projectId]/entries/[type]/[entryId]/page.tsx
      api/admin/auth/login/route.ts
      api/admin/auth/logout/route.ts
      api/admin/auth/me/route.ts
      api/admin/projects/route.ts
      api/admin/projects/[projectId]/route.ts
      api/admin/projects/[projectId]/members/route.ts
      api/admin/projects/[projectId]/keys/route.ts
      api/admin/projects/[projectId]/types/route.ts
      api/admin/projects/[projectId]/types/[typeId]/route.ts
      api/admin/projects/[projectId]/entries/route.ts
      api/admin/projects/[projectId]/entries/[entryId]/route.ts
      api/admin/projects/[projectId]/entries/[entryId]/publish/route.ts
      api/admin/projects/[projectId]/media/route.ts
      api/admin/projects/[projectId]/media/[mediaId]/route.ts
      api/v1/[projectId]/entries/route.ts
      api/v1/[projectId]/entries/[entryId]/route.ts
      api/v1/[projectId]/entries/by-slug/[type]/[slug]/route.ts
      api/v1/[projectId]/types/route.ts
      api/v1/[projectId]/media/[mediaId]/route.ts
    lib/
      db.ts
      auth/password.ts
      auth/session.ts
      auth/require-user.ts
      auth/api-key.ts
      auth/rate-limit.ts
      tenancy.ts
      cors.ts
      schema/field-types.ts
      schema/validate-type.ts
      schema/validate-entry.ts
      entries/status.ts
      storage/types.ts
      storage/db-driver.ts
      storage/s3-driver.ts
      storage/index.ts
    components/
      login-form.tsx
      project-form.tsx
      schema-builder.tsx
      entry-form.tsx
      media-picker.tsx
      status-badge.tsx
    lib/**/*.test.ts
  scripts/
    smoke.ts
```

---

### Task 1: Scaffold Next.js + Prisma schema

**Files:**
- Create: `package.json`, `.env.example`, `.gitignore`, `README.md`
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

**Interfaces:**
- Consumes: none
- Produces: Prisma models + `getDb()`

- [ ] **Step 1: Create Next.js app in empty folder**

```bash
pnpm dlx create-next-app@latest . --typescript --eslint --app --src-dir --tailwind --turbopack --import-alias "@/*" --use-pnpm --yes
pnpm add @prisma/client argon2 zod
pnpm add -D prisma vitest tsx @types/node
```

```env
# .env.example
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/studio_cms
SESSION_SECRET=change-me-to-a-long-random-string
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=change-me
```

```json
// package.json scripts (add)
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "smoke": "tsx scripts/smoke.ts"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 2: Prisma schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  superadmin
  editor
}

enum StorageDriver {
  db
  s3
}

enum EntryStatus {
  draft
  published
}

model User {
  id           String          @id @default(cuid())
  email        String          @unique
  passwordHash String
  role         Role            @default(editor)
  createdAt    DateTime        @default(now())
  memberships  ProjectMember[]
  sessions     Session[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Project {
  id            String          @id @default(cuid())
  name          String
  slug          String          @unique
  storageDriver StorageDriver   @default(db)
  s3Bucket      String?
  s3Region      String?
  s3Prefix      String?
  corsOrigins   String[]        @default([])
  createdAt     DateTime        @default(now())
  members       ProjectMember[]
  apiKeys       ApiKey[]
  contentTypes  ContentType[]
  entries       Entry[]
  media         Media[]
}

model ProjectMember {
  id        String  @id @default(cuid())
  projectId String
  userId    String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
}

model ApiKey {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  label     String
  keyHash   String   @unique
  prefix    String
  createdAt DateTime @default(now())
}

model ContentType {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name      String
  title     String
  fields    Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([projectId, name])
}

model Entry {
  id            String      @id @default(cuid())
  projectId     String
  project       Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  typeName      String
  slug          String?
  dataDraft     Json
  dataPublished Json?
  status        EntryStatus @default(draft)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([projectId, typeName])
  @@unique([projectId, typeName, slug])
}

model Media {
  id         String     @id @default(cuid())
  projectId  String
  project    Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  filename   String
  mimeType   String
  size       Int
  storageKey String
  blob       MediaBlob?
  createdAt  DateTime   @default(now())
}

model MediaBlob {
  id      String @id @default(cuid())
  mediaId String @unique
  media   Media  @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  data    Bytes
}
```

- [ ] **Step 3: db helper + migrate**

```ts
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
```

```bash
cp .env.example .env
pnpm db:migrate
# name: init
```

Expected: migration applied.

- [ ] **Step 4: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js CMS with Prisma schema"
```

---

### Task 2: Password hashing + session auth

**Files:**
- Create: `src/lib/auth/password.ts`, `session.ts`, `require-user.ts`
- Create: `src/lib/auth/password.test.ts`
- Create: `src/app/api/admin/auth/login/route.ts`, `logout/route.ts`, `me/route.ts`
- Create: `src/app/login/page.tsx`, `src/components/login-form.tsx`
- Create: `prisma/seed.ts`, `vitest.config.ts`

**Interfaces:**
- Produces: `hashPassword`, `verifyPassword`, `createSession`, `destroySession`, `getSessionUser`, `requireUser`, `requireSuperadmin`
- Cookie: `cms_session`

- [ ] **Step 1: Failing password test**

```ts
// src/lib/auth/password.test.ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("secret-pass");
    expect(hash).not.toContain("secret-pass");
    expect(await verifyPassword("secret-pass", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
```

```bash
pnpm test src/lib/auth/password.test.ts
```

Expected: FAIL until implemented.

- [ ] **Step 2: Implement auth**

```ts
// src/lib/auth/password.ts
import argon2 from "argon2";

export async function hashPassword(plain: string) {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(plain: string, hash: string) {
  return argon2.verify(hash, plain);
}
```

```ts
// src/lib/auth/session.ts
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

export const SESSION_COOKIE = "cms_session";
const SESSION_DAYS = 14;

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createSession(userId: string) {
  const raw = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await getDb().session.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt },
  });
  return raw;
}

export async function destroySession(raw: string) {
  await getDb().session.deleteMany({ where: { tokenHash: hashToken(raw) } });
}

export async function getSessionUser(raw: string | undefined) {
  if (!raw) return null;
  const session = await getDb().session.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function setSessionCookie(raw: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
```

```ts
// src/lib/auth/require-user.ts
import { cookies } from "next/headers";
import { getSessionUser, SESSION_COOKIE } from "./session";

export async function requireUser() {
  const jar = await cookies();
  const user = await getSessionUser(jar.get(SESSION_COOKIE)?.value);
  if (!user) {
    throw new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  return user;
}

export async function requireSuperadmin() {
  const user = await requireUser();
  if (user.role !== "superadmin") {
    throw new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }
  return user;
}
```

Login route: verify email/password → `createSession` → `setSessionCookie`. Logout clears. Me returns `{ id, email, role }`.

- [ ] **Step 3: Seed + login UI**

```ts
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const db = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL!;
  const password = process.env.SUPERADMIN_PASSWORD!;
  const passwordHash = await hashPassword(password);
  await db.user.upsert({
    where: { email },
    update: { passwordHash, role: "superadmin" },
    create: { email, passwordHash, role: "superadmin" },
  });
}

main().finally(() => db.$disconnect());
```

```bash
pnpm db:seed
pnpm test
pnpm dev
```

Login at `/login` with seed creds; `GET /api/admin/auth/me` returns user.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: argon2 auth, sessions, login"
```

---

### Task 3: Projects, members, tenancy

**Files:**
- Create: `src/lib/tenancy.ts`, `tenancy.test.ts`
- Create: `src/app/api/admin/projects/route.ts`
- Create: `src/app/api/admin/projects/[projectId]/route.ts`
- Create: `src/app/api/admin/projects/[projectId]/members/route.ts`
- Create: `src/app/projects/page.tsx`, `projects/[projectId]/page.tsx`, `.../members/page.tsx`
- Create: `src/components/project-form.tsx`

**Interfaces:**
- Produces: `canAccessProject`, `assertProjectAccess`
- `POST /api/admin/projects` body: `{ name, slug, storageDriver, s3Bucket?, s3Region?, s3Prefix?, corsOrigins? }`
- `POST .../members` body: `{ email, password? }`

- [ ] **Step 1: Tenancy test + implement**

```ts
// src/lib/tenancy.test.ts
import { describe, expect, it } from "vitest";
import { canAccessProject } from "./tenancy";

describe("canAccessProject", () => {
  it("allows superadmin always", () => {
    expect(
      canAccessProject({ role: "superadmin", membershipProjectIds: [] }, "p1"),
    ).toBe(true);
  });
  it("allows editor only for membership", () => {
    expect(
      canAccessProject({ role: "editor", membershipProjectIds: ["p1"] }, "p1"),
    ).toBe(true);
    expect(
      canAccessProject({ role: "editor", membershipProjectIds: ["p1"] }, "p2"),
    ).toBe(false);
  });
});
```

```ts
// src/lib/tenancy.ts
import { getDb } from "@/lib/db";
import type { Role } from "@prisma/client";

export function canAccessProject(
  user: { role: Role; membershipProjectIds: string[] },
  projectId: string,
) {
  if (user.role === "superadmin") return true;
  return user.membershipProjectIds.includes(projectId);
}

export async function assertProjectAccess(
  user: { id: string; role: Role },
  projectId: string,
) {
  const db = getDb();
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
  }
  if (user.role === "superadmin") return project;

  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership) {
    throw new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }
  return project;
}
```

`GET /api/admin/projects`: superadmin → all; editor → membership only. Members route: superadmin upserts editor user + membership.

- [ ] **Step 2: UI**

Projects list/create (storage driver select). Dashboard hides types/keys/members for editors.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: projects, members, tenancy"
```

---

### Task 4: API keys

**Files:**
- Create: `src/lib/auth/api-key.ts`, `api-key.test.ts`
- Create: `src/app/api/admin/projects/[projectId]/keys/route.ts`
- Create: `src/app/projects/[projectId]/keys/page.tsx`

**Interfaces:**
- Produces: `generateApiKey()`, `hashApiKey()`, `verifyApiKey(raw)`
- Raw key shown once on create; format `cms_...`

- [ ] **Step 1: Test + implement**

```ts
// src/lib/auth/api-key.ts
import { createHash, randomBytes } from "crypto";
import { getDb } from "@/lib/db";

export function hashApiKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey() {
  const raw = `cms_${randomBytes(24).toString("base64url")}`;
  return { raw, prefix: raw.slice(0, 12), hash: hashApiKey(raw) };
}

export async function verifyApiKey(raw: string) {
  const row = await getDb().apiKey.findUnique({
    where: { keyHash: hashApiKey(raw) },
  });
  if (!row) return null;
  return { projectId: row.projectId, apiKeyId: row.id };
}
```

Superadmin-only routes: GET list, POST create, DELETE by id.

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: hashed project API keys"
```

---

### Task 5: Content type validation + admin CRUD

**Files:**
- Create: `src/lib/schema/field-types.ts`, `validate-type.ts`, `validate-type.test.ts`
- Create: `src/app/api/admin/projects/[projectId]/types/route.ts`
- Create: `src/app/api/admin/projects/[projectId]/types/[typeId]/route.ts`

**Interfaces:**
- Produces: `FIELD_TYPES`, `FieldDef`, `ContentTypeDef`, `parseContentTypeInput`

```ts
// src/lib/schema/field-types.ts
export const FIELD_TYPES = [
  "string", "text", "number", "boolean", "image", "file",
  "reference", "array", "richtext", "slug", "datetime", "object",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type FieldDef = {
  name: string;
  title: string;
  type: FieldType;
  required?: boolean;
  from?: string;
  of?: FieldType;
  referenceTo?: string;
  fields?: FieldDef[];
  order: number;
};

export type ContentTypeDef = {
  name: string;
  title: string;
  fields: FieldDef[];
};
```

- [ ] **Step 1: Validation tests**

```ts
import { describe, expect, it } from "vitest";
import { parseContentTypeInput } from "./validate-type";

describe("parseContentTypeInput", () => {
  it("accepts product-like schema", () => {
    const def = parseContentTypeInput({
      name: "product",
      title: "ЖК",
      fields: [
        { name: "title", title: "Название", type: "string", required: true, order: 0 },
        { name: "slug", title: "Slug", type: "slug", from: "title", order: 1 },
        { name: "gallery", title: "Галерея", type: "array", of: "image", order: 2 },
        { name: "body", title: "Текст", type: "richtext", order: 3 },
      ],
    });
    expect(def.name).toBe("product");
  });

  it("rejects array of object", () => {
    expect(() =>
      parseContentTypeInput({
        name: "x",
        title: "X",
        fields: [{ name: "a", title: "A", type: "array", of: "object", order: 0 }],
      }),
    ).toThrow();
  });
});
```

Rules: name `/^[a-z][a-z0-9_]*$/`; unique field names; `object`/`array` one level only; `slug.from` must exist. Superadmin CRUD only.

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: content type validation and admin API"
```

---

### Task 6: Schema builder UI

**Files:**
- Create: `src/components/schema-builder.tsx`
- Create: `src/app/projects/[projectId]/types/page.tsx`

**Interfaces:**
- Consumes: types admin API
- Produces: create/edit type, add/remove fields, ↑↓ order, save; 403 for editors

- [ ] **Step 1: Build UI + manual check** — create `product` schema from spec example, reload persists

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: schema builder UI"
```

---

### Task 7: Entry validation, CRUD, publish

**Files:**
- Create: `src/lib/schema/validate-entry.ts`, `validate-entry.test.ts`
- Create: `src/lib/entries/status.ts`, `status.test.ts`
- Create: `src/app/api/admin/projects/[projectId]/entries/route.ts`
- Create: `src/app/api/admin/projects/[projectId]/entries/[entryId]/route.ts`
- Create: `src/app/api/admin/projects/[projectId]/entries/[entryId]/publish/route.ts`

**Interfaces:**
- Produces: `validateEntryData`, `entryUiStatus`
- `POST/PATCH` update `dataDraft` only; `POST .../publish` copies to `dataPublished`

```ts
// src/lib/entries/status.ts
export function entryUiStatus(entry: {
  status: "draft" | "published";
  dataDraft: unknown;
  dataPublished: unknown | null;
}) {
  if (entry.status === "draft" || entry.dataPublished == null) return "draft";
  const same =
    JSON.stringify(entry.dataDraft) === JSON.stringify(entry.dataPublished);
  return same ? "published" : "modified";
}
```

- [ ] **Step 1: Tests for required + status**

```ts
import { describe, expect, it } from "vitest";
import { validateEntryData } from "./validate-entry";
import { entryUiStatus } from "../entries/status";

const fields = [
  { name: "title", title: "T", type: "string" as const, required: true, order: 0 },
];

describe("validateEntryData", () => {
  it("requires title", () => {
    expect(() => validateEntryData(fields, {})).toThrow();
    expect(validateEntryData(fields, { title: "Hi" })).toEqual({ title: "Hi" });
  });
});

describe("entryUiStatus", () => {
  it("detects modified", () => {
    expect(
      entryUiStatus({
        status: "published",
        dataDraft: { title: "B" },
        dataPublished: { title: "A" },
      }),
    ).toBe("modified");
  });
});
```

Validation: scalars by type; `image`/`file` = media id; `reference` = entry id; `array`/`object` per schema; slugify from `from` if empty; sync `Entry.slug` column.

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: entry draft CRUD and publish"
```

---

### Task 8: Entry list/form UI

**Files:**
- Create: `src/components/status-badge.tsx`, `entry-form.tsx`, `media-picker.tsx`
- Create: `src/app/projects/[projectId]/entries/[type]/page.tsx`
- Create: `src/app/projects/[projectId]/entries/[type]/[entryId]/page.tsx`

**Interfaces:**
- Dynamic form from schema; Save / Publish; badges `draft` | `published` | `modified`
- Until Task 9, `MediaPicker` can accept media id string; replace with library after upload exists

- [ ] **Step 1: Form renderer + manual draft→publish path**

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: entry list and schema-driven form"
```

---

### Task 9: Media storage (db | s3) + admin upload

**Files:**
- Create: `src/lib/storage/types.ts`, `db-driver.ts`, `s3-driver.ts`, `index.ts`, `storage.test.ts`
- Create: `src/app/api/admin/projects/[projectId]/media/route.ts`
- Create: `src/app/api/admin/projects/[projectId]/media/[mediaId]/route.ts`
- Create: `src/app/projects/[projectId]/media/page.tsx`
- Modify: `src/components/media-picker.tsx`

**Interfaces:**

```ts
export type StoredObject =
  | { kind: "bytes"; data: Uint8Array; mimeType: string }
  | { kind: "redirect"; url: string };

export interface StorageDriver {
  put(input: {
    projectId: string;
    mediaId: string;
    filename: string;
    mimeType: string;
    bytes: Uint8Array;
  }): Promise<{ storageKey: string }>;
  get(input: { storageKey: string; mimeType: string }): Promise<StoredObject>;
  delete(storageKey: string): Promise<void>;
}
```

- [ ] **Step 1: Driver selection test + implement db/s3**

```ts
import { describe, expect, it } from "vitest";
import { resolveDriverName } from "./index";

describe("resolveDriverName", () => {
  it("returns db or s3 from project", () => {
    expect(resolveDriverName({ storageDriver: "db" })).toBe("db");
    expect(resolveDriverName({ storageDriver: "s3" })).toBe("s3");
  });
});
```

`db`: blob in `MediaBlob`. `s3`: `@aws-sdk/client-s3`, key `${prefix}${projectId}/${mediaId}/${filename}`; env `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT` optional.

- [ ] **Step 2: Upload API + media library + MediaPicker**

- [ ] **Step 3: Commit**

```bash
pnpm add @aws-sdk/client-s3
git add .
git commit -m "feat: db and s3 media storage"
```

---

### Task 10: Public API v1 + CORS + rate limit

**Files:**
- Create: `src/lib/auth/rate-limit.ts`, `src/lib/cors.ts`
- Create: public routes under `src/app/api/v1/[projectId]/...`

**Interfaces:**
- Auth: `Authorization: Bearer <apiKey>`; key project must match URL
- Response entry shape:

```ts
type PublicEntry = {
  id: string;
  type: string;
  slug: string | null;
  data: unknown; // dataPublished
  updatedAt: string;
};
```

Endpoints:
- `GET /api/v1/:projectId/entries?type=&limit=&offset=`
- `GET /api/v1/:projectId/entries/:id`
- `GET /api/v1/:projectId/entries/by-slug/:type/:slug`
- `GET /api/v1/:projectId/types`
- `GET /api/v1/:projectId/media/:id`

- [ ] **Step 1: Rate limit + CORS helpers**

```ts
// src/lib/auth/rate-limit.ts
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 120, windowMs = 60_000) {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || row.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const };
  }
  row.count += 1;
  if (row.count > limit) return { ok: false as const };
  return { ok: true as const };
}
```

```ts
// src/lib/cors.ts
export function corsHeaders(origin: string | null, allowlist: string[]) {
  if (!origin || allowlist.length === 0 || !allowlist.includes(origin)) {
    return {} as Record<string, string>;
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    Vary: "Origin",
  };
}
```

- [ ] **Step 2: Handlers — published only; media streams or redirects**

Media ids in JSON stay as ids. Site builds URL:  
`${CMS_URL}/api/v1/${projectId}/media/${mediaId}`

- [ ] **Step 3: Manual fetch check**

```bash
curl -H "Authorization: Bearer cms_..." \
  "http://localhost:3000/api/v1/<projectId>/entries?type=product"
```

Expected: only published entries.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: public v1 API with CORS and rate limits"
```

---

### Task 11: README fetch examples + smoke script

**Files:**
- Create: `scripts/smoke.ts`
- Modify: `README.md`
- Modify: `src/app/page.tsx` (auth redirect)

**Interfaces:**
- No SDK — document fetch helpers sites can copy
- Smoke proves success criteria with `fetch`

- [ ] **Step 1: README site integration section**

```ts
// example for a Next.js site (Server Component / route handler)
const CMS_URL = process.env.CMS_URL!;
const PROJECT_ID = process.env.CMS_PROJECT_ID!;
const API_KEY = process.env.CMS_API_KEY!;

export async function getEntries(type: string) {
  const res = await fetch(
    `${CMS_URL}/api/v1/${PROJECT_ID}/entries?type=${encodeURIComponent(type)}`,
    {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 60 },
    },
  );
  if (!res.ok) throw new Error(`CMS ${res.status}`);
  return res.json();
}

export function mediaUrl(mediaId: string) {
  return `${CMS_URL}/api/v1/${PROJECT_ID}/media/${mediaId}`;
}
```

Also document: migrate, seed, login, create project, types, editor user, API key, publish, curl/fetch.

- [ ] **Step 2: Smoke script**

```ts
// scripts/smoke.ts
// 1) login superadmin
// 2) create project A (db) + project B (db)
// 3) create type + editor on A
// 4) login editor, create entry, publish
// 5) create API key; fetch public entries with fetch()
// 6) B's key cannot read A's entries
// print SMOKE_OK
```

```bash
pnpm smoke
```

Expected: exit 0, `SMOKE_OK`.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "docs: README fetch integration and smoke script"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Single Next.js admin + API | 1 |
| One Postgres, schemas in DB | 1, 5 |
| Superadmin schemas / editor content | 2–8 |
| Draft → publish | 7, 8 |
| REST + site via fetch (no SDK) | 10, 11 |
| API keys hashed, sessions, argon2 | 2, 4 |
| Storage db \| s3 | 3, 9 |
| Public media opaque URL | 9, 10 |
| CORS + rate limit | 10 |
| Success criteria | 11 |
| No monorepo / no SDK package | enforced globally |

## Self-review notes

- Paths are repo-root (`src/...`, `prisma/...`) — ready to push as a new GitHub project
- Integration is copy-paste `fetch` helpers in consumer sites
- S3 optional at smoke time — both projects may use `db` if S3 unavailable
