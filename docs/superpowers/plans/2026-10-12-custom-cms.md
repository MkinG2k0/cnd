# Custom Headless CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private multi-tenant headless CMS (Next.js admin + API + thin SDK) with DB-stored schemas, draft/publish, and per-project `db`/`s3` media storage so clients get only URL + login.

**Architecture:** New pnpm monorepo at `D:\Project\studio\cms` with `apps/web` (Next.js App Router: admin UI + `/api/admin/*` + `/api/v1/*`) and `packages/sdk` (`createClient`). Postgres via Prisma; sessions in httpOnly cookies; API keys hashed; all rows scoped by `projectId`.

**Tech Stack:** Next.js 15+, React 19, TypeScript, Prisma, PostgreSQL, argon2, Vitest, pnpm workspaces, `@aws-sdk/client-s3` (S3 adapter), TipTap or textarea-based HTML for `richtext` MVP.

## Global Constraints

- Everything on Next.js — no Nest/Hono/separate API service
- One shared Postgres for all projects; schemas live in DB (`content_types.fields` JSON)
- Roles only: `superadmin` | `editor` (editor: content + media only)
- Field types MVP: `string`, `text`, `number`, `boolean`, `image`, `file`, `reference`, `array`, `richtext` (HTML string), `slug`, `datetime`, `object` (one nesting level)
- Public API returns published data only; filters: `type`, `limit`, `offset`
- Storage driver per project: `db` | `s3`; public media always via `/api/v1/:projectId/media/:id`
- Password hashing: argon2; API keys stored as hash; CORS allowlist on project (empty = deny browser origins)
- Out of scope: version history, draft preview, webhooks, i18n, page builder, Sanity migration
- Spec: `docs/superpowers/specs/2026-10-12-custom-cms-design.md` (in cnd repo; copy or link from cms README)

---

## File Structure (new repo `D:\Project\studio\cms`)

```
cms/
  package.json                 # pnpm workspace root
  pnpm-workspace.yaml
  .env.example
  apps/web/
    package.json
    prisma/schema.prisma
    prisma/seed.ts
    src/app/
      layout.tsx
      page.tsx                  # redirect → /projects or /login
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
    src/lib/
      db.ts
      auth/password.ts
      auth/session.ts
      auth/require-user.ts
      auth/api-key.ts
      auth/rate-limit.ts
      tenancy.ts
      schema/field-types.ts
      schema/validate-type.ts
      schema/validate-entry.ts
      entries/status.ts
      storage/types.ts
      storage/db-driver.ts
      storage/s3-driver.ts
      storage/index.ts
      cors.ts
    src/components/
      login-form.tsx
      project-form.tsx
      schema-builder.tsx
      entry-form.tsx
      media-picker.tsx
      status-badge.tsx
    vitest.config.ts
    src/lib/**/*.test.ts
  packages/sdk/
    package.json
    src/index.ts
    src/client.ts
    src/client.test.ts
    tsconfig.json
```

---

### Task 1: Scaffold monorepo + Prisma schema

**Files:**
- Create: `D:\Project\studio\cms/package.json`
- Create: `D:\Project\studio\cms/pnpm-workspace.yaml`
- Create: `D:\Project\studio\cms/.env.example`
- Create: `D:\Project\studio\cms/.gitignore`
- Create: `D:\Project\studio\cms/apps/web/package.json`
- Create: `D:\Project\studio\cms/apps/web/prisma/schema.prisma`
- Create: `D:\Project\studio\cms/apps/web/src/lib/db.ts`
- Create: `D:\Project\studio\cms/README.md`

**Interfaces:**
- Consumes: none
- Produces: Prisma models `User`, `Project`, `ProjectMember`, `ApiKey`, `ContentType`, `Entry`, `Media`, `MediaBlob`, `Session`; `getDb()` singleton

- [ ] **Step 1: Create repo root and workspace files**

```json
// package.json
{
  "name": "studio-cms",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @studio-cms/web dev",
    "build": "pnpm --filter @studio-cms/sdk build && pnpm --filter @studio-cms/web build",
    "test": "pnpm -r test",
    "db:migrate": "pnpm --filter @studio-cms/web exec prisma migrate dev",
    "db:seed": "pnpm --filter @studio-cms/web exec prisma db seed"
  },
  "packageManager": "pnpm@9.15.0"
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```env
# .env.example
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/studio_cms
SESSION_SECRET=change-me-to-a-long-random-string
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=change-me
```

- [ ] **Step 2: Scaffold Next.js app**

Run from `D:\Project\studio\cms`:

```bash
pnpm dlx create-next-app@latest apps/web --typescript --eslint --app --src-dir --tailwind --turbopack --import-alias "@/*" --use-pnpm --yes
```

Then set `apps/web/package.json` name to `@studio-cms/web` and add deps:

```bash
cd apps/web
pnpm add @prisma/client argon2 zod uuid
pnpm add -D prisma vitest @types/uuid
```

- [ ] **Step 3: Write Prisma schema**

```prisma
// apps/web/prisma/schema.prisma
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
  id          String     @id @default(cuid())
  projectId   String
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  filename    String
  mimeType    String
  size        Int
  storageKey  String
  blob        MediaBlob?
  createdAt   DateTime   @default(now())
}

model MediaBlob {
  id      String @id @default(cuid())
  mediaId String @unique
  media   Media  @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  data    Bytes
}
```

- [ ] **Step 4: Add db helper and migrate**

```ts
// apps/web/src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
```

Copy `.env.example` → `apps/web/.env` (and root `.env` if preferred). Run:

```bash
cd D:\Project\studio\cms\apps\web
pnpm exec prisma migrate dev --name init
```

Expected: migration applied, client generated.

- [ ] **Step 5: Commit**

```bash
cd D:\Project\studio\cms
git init
git add .
git commit -m "chore: scaffold cms monorepo with prisma schema"
```

---

### Task 2: Password hashing + session auth

**Files:**
- Create: `apps/web/src/lib/auth/password.ts`
- Create: `apps/web/src/lib/auth/session.ts`
- Create: `apps/web/src/lib/auth/require-user.ts`
- Create: `apps/web/src/lib/auth/password.test.ts`
- Create: `apps/web/src/lib/auth/session.test.ts`
- Create: `apps/web/src/app/api/admin/auth/login/route.ts`
- Create: `apps/web/src/app/api/admin/auth/logout/route.ts`
- Create: `apps/web/src/app/api/admin/auth/me/route.ts`
- Create: `apps/web/src/app/login/page.tsx`
- Create: `apps/web/src/components/login-form.tsx`
- Create: `apps/web/prisma/seed.ts`
- Create: `apps/web/vitest.config.ts`

**Interfaces:**
- Consumes: `getDb()`
- Produces:
  - `hashPassword(plain: string): Promise<string>`
  - `verifyPassword(plain: string, hash: string): Promise<boolean>`
  - `createSession(userId: string): Promise<string>` // raw token
  - `destroySession(rawToken: string): Promise<void>`
  - `getSessionUser(rawToken: string | undefined): Promise<User | null>`
  - `requireUser(req): Promise<User>` / `requireSuperadmin(req)`
  - Cookie name: `cms_session`

- [ ] **Step 1: Write failing password tests**

```ts
// apps/web/src/lib/auth/password.test.ts
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

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd apps/web && pnpm exec vitest run src/lib/auth/password.test.ts
```

Expected: FAIL module not found / export missing.

- [ ] **Step 3: Implement password + session helpers**

```ts
// apps/web/src/lib/auth/password.ts
import argon2 from "argon2";

export async function hashPassword(plain: string) {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(plain: string, hash: string) {
  return argon2.verify(hash, plain);
}
```

```ts
// apps/web/src/lib/auth/session.ts
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
// apps/web/src/lib/auth/require-user.ts
import { cookies } from "next/headers";
import { getSessionUser, SESSION_COOKIE } from "./session";

export async function requireUser() {
  const jar = await cookies();
  const user = await getSessionUser(jar.get(SESSION_COOKIE)?.value);
  if (!user) throw new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
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

Wire login/logout/me routes: login verifies email/password → `createSession` → `setSessionCookie`; logout destroys; me returns `{ id, email, role }`.

- [ ] **Step 4: Seed superadmin**

```ts
// apps/web/prisma/seed.ts
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

Add to `apps/web/package.json`:

```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```

```bash
pnpm add -D tsx
pnpm exec prisma db seed
```

- [ ] **Step 5: Login page + form**

Minimal client form POSTs to `/api/admin/auth/login` with `{ email, password }`, redirects to `/projects` on 200.

- [ ] **Step 6: Run tests + manual check**

```bash
pnpm exec vitest run src/lib/auth
pnpm dev
```

Open `/login`, sign in with seed creds, `GET /api/admin/auth/me` returns user.

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat: add argon2 auth, sessions, and login"
```

---

### Task 3: Projects, members, tenancy helpers

**Files:**
- Create: `apps/web/src/lib/tenancy.ts`
- Create: `apps/web/src/lib/tenancy.test.ts`
- Create: `apps/web/src/app/api/admin/projects/route.ts`
- Create: `apps/web/src/app/api/admin/projects/[projectId]/route.ts`
- Create: `apps/web/src/app/api/admin/projects/[projectId]/members/route.ts`
- Create: `apps/web/src/app/projects/page.tsx`
- Create: `apps/web/src/app/projects/[projectId]/page.tsx`
- Create: `apps/web/src/app/projects/[projectId]/members/page.tsx`
- Create: `apps/web/src/components/project-form.tsx`

**Interfaces:**
- Consumes: `requireUser`, `requireSuperadmin`, `getDb`, `hashPassword`
- Produces:
  - `assertProjectAccess(user, projectId): Promise<Project>`
  - Admin: `GET/POST /api/admin/projects`
  - Admin: `GET/PATCH /api/admin/projects/:projectId`
  - Admin: `POST /api/admin/projects/:projectId/members` body `{ email, password? }`

- [ ] **Step 1: Failing tenancy test**

```ts
// apps/web/src/lib/tenancy.test.ts
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

- [ ] **Step 2: Implement tenancy + routes**

```ts
// apps/web/src/lib/tenancy.ts
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
  if (!project) throw new Response(JSON.stringify({ error: "not_found" }), { status: 404 });

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

`POST /api/admin/projects` (superadmin only):

```ts
// body
{ name: string, slug: string, storageDriver: "db" | "s3", s3Bucket?: string, s3Region?: string, s3Prefix?: string, corsOrigins?: string[] }
```

`GET /api/admin/projects`: superadmin → all; editor → membership projects.

`POST .../members` (superadmin): upsert user by email (create with password if new, role `editor`), create `ProjectMember`.

- [ ] **Step 3: UI — projects list/create + members page**

Superadmin sees create form (name, slug, storage driver select). Editor sees list only. Project dashboard links to types/keys/members/media/entries (hide types/keys/members for editor).

- [ ] **Step 4: Test + commit**

```bash
pnpm exec vitest run src/lib/tenancy.test.ts
git add apps/web
git commit -m "feat: projects, members, and tenancy checks"
```

---

### Task 4: API keys

**Files:**
- Create: `apps/web/src/lib/auth/api-key.ts`
- Create: `apps/web/src/lib/auth/api-key.test.ts`
- Create: `apps/web/src/app/api/admin/projects/[projectId]/keys/route.ts`
- Create: `apps/web/src/app/projects/[projectId]/keys/page.tsx`

**Interfaces:**
- Consumes: `requireSuperadmin`, `assertProjectAccess` (superadmin path)
- Produces:
  - `generateApiKey(): { raw: string, prefix: string, hash: string }`
  - `verifyApiKey(raw: string): Promise<{ projectId: string } | null>`
  - `POST /api/admin/projects/:projectId/keys` → `{ id, label, prefix, raw }` (raw once)
  - `GET` list `{ id, label, prefix, createdAt }`
  - `DELETE` by id

- [ ] **Step 1: Failing test for key format**

```ts
import { describe, expect, it } from "vitest";
import { generateApiKey, hashApiKey } from "./api-key";

describe("api-key", () => {
  it("generates cms_ prefix and stable hash", () => {
    const { raw, prefix, hash } = generateApiKey();
    expect(raw.startsWith("cms_")).toBe(true);
    expect(prefix).toBe(raw.slice(0, 12));
    expect(hash).toBe(hashApiKey(raw));
  });
});
```

- [ ] **Step 2: Implement**

```ts
// apps/web/src/lib/auth/api-key.ts
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

Routes: superadmin only. UI shows raw key in a one-time banner after create.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: project API keys with hashed storage"
```

---

### Task 5: Content type schema validation + admin CRUD

**Files:**
- Create: `apps/web/src/lib/schema/field-types.ts`
- Create: `apps/web/src/lib/schema/validate-type.ts`
- Create: `apps/web/src/lib/schema/validate-type.test.ts`
- Create: `apps/web/src/app/api/admin/projects/[projectId]/types/route.ts`
- Create: `apps/web/src/app/api/admin/projects/[projectId]/types/[typeId]/route.ts`

**Interfaces:**
- Consumes: `requireSuperadmin`, `assertProjectAccess`
- Produces:
  - `FieldType` union and Zod schemas
  - `parseContentTypeInput(input): ContentTypeDef` throws ZodError
  - CRUD types under `/api/admin/projects/:projectId/types`

```ts
// apps/web/src/lib/schema/field-types.ts
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
  from?: string;       // slug source
  of?: FieldType;      // array item type (not object/array)
  referenceTo?: string; // content type name
  fields?: FieldDef[]; // object children (scalars/media/reference only)
  order: number;
};

export type ContentTypeDef = {
  name: string;
  title: string;
  fields: FieldDef[];
};
```

- [ ] **Step 1: Tests for invalid nested array/object and bad names**

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

- [ ] **Step 2: Implement Zod validation + routes**

Rules:
- `name`: `/^[a-z][a-z0-9_]*$/`
- unique field names per type
- `object.fields` cannot contain `object` or `array`
- `array.of` cannot be `object` or `array`
- `slug.from` must reference another field name on same type

`POST/GET` collection; `PATCH/DELETE` by `typeId`. Superadmin only.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: content type validation and admin CRUD API"
```

---

### Task 6: Schema builder UI

**Files:**
- Create: `apps/web/src/components/schema-builder.tsx`
- Create: `apps/web/src/app/projects/[projectId]/types/page.tsx`

**Interfaces:**
- Consumes: types admin API
- Produces: UI to create type, add/edit/remove fields, move order up/down, save

- [ ] **Step 1: Build client schema builder**

State: current `ContentTypeDef`. Controls:
- Add field: name, title, type select, required checkbox
- Extra inputs when type is `slug` (`from`), `array` (`of`), `reference` (`referenceTo`), `object` (nested field list)
- ↑ / ↓ buttons mutate `order` then sort
- Save → `POST` or `PATCH`

Gate page: if `me.role !== 'superadmin'` → 403 UI.

- [ ] **Step 2: Manual verify**

Create type `product` with fields from spec example. Reload page — fields persist from GET.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: schema builder UI for content types"
```

---

### Task 7: Entry validation, CRUD, publish

**Files:**
- Create: `apps/web/src/lib/schema/validate-entry.ts`
- Create: `apps/web/src/lib/schema/validate-entry.test.ts`
- Create: `apps/web/src/lib/entries/status.ts`
- Create: `apps/web/src/lib/entries/status.test.ts`
- Create: `apps/web/src/app/api/admin/projects/[projectId]/entries/route.ts`
- Create: `apps/web/src/app/api/admin/projects/[projectId]/entries/[entryId]/route.ts`
- Create: `apps/web/src/app/api/admin/projects/[projectId]/entries/[entryId]/publish/route.ts`

**Interfaces:**
- Consumes: `assertProjectAccess`, content types, Zod
- Produces:
  - `validateEntryData(fields, data): unknown` (normalized draft)
  - `entryUiStatus(entry): "draft" | "published" | "modified"`
  - `POST /entries` `{ typeName, data }`
  - `PATCH /entries/:id` `{ data }` → updates `dataDraft` only
  - `POST /entries/:id/publish` → copy draft → published

```ts
// apps/web/src/lib/entries/status.ts
export function entryUiStatus(entry: {
  status: "draft" | "published";
  dataDraft: unknown;
  dataPublished: unknown | null;
}) {
  if (entry.status === "draft" || entry.dataPublished == null) return "draft";
  const same = JSON.stringify(entry.dataDraft) === JSON.stringify(entry.dataPublished);
  return same ? "published" : "modified";
}
```

- [ ] **Step 1: Tests for required fields + status**

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

- [ ] **Step 2: Implement validation rules (MVP)**

- `string`/`text`/`richtext`/`slug`: string
- `number`: finite number
- `boolean`: boolean
- `datetime`: ISO string
- `image`/`file`: media id string existing in same project (check in route layer)
- `reference`: entry id string
- `array`: array of item type
- `object`: plain object matching child fields
- Auto-set `slug` field from `from` source if empty (slugify)

On create/update extract slug field value into `Entry.slug` column when present.

Publish:

```ts
await db.entry.update({
  where: { id },
  data: {
    dataPublished: entry.dataDraft,
    status: "published",
  },
});
```

Editors + superadmin with project access.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: entry draft CRUD and publish"
```

---

### Task 8: Entry list/form UI

**Files:**
- Create: `apps/web/src/components/status-badge.tsx`
- Create: `apps/web/src/components/entry-form.tsx`
- Create: `apps/web/src/components/media-picker.tsx` (stub: text input for media id until Task 9; replace in Task 9)
- Create: `apps/web/src/app/projects/[projectId]/entries/[type]/page.tsx`
- Create: `apps/web/src/app/projects/[projectId]/entries/[type]/[entryId]/page.tsx`

**Interfaces:**
- Consumes: entries + types APIs, `entryUiStatus`
- Produces: list + dynamic form Save / Publish

- [ ] **Step 1: Dynamic form renderer**

Map field type → input:
- string/slug/datetime → `<input>`
- text/richtext → `<textarea>` (richtext: allow HTML; label “HTML”)
- number → number input
- boolean → checkbox
- image/file → `MediaPicker`
- reference → select loaded from `GET entries?type=referenceTo`
- array → repeatable row of `of` control
- object → nested fieldset

Buttons: Save → PATCH; Publish → POST publish. Show `StatusBadge`.

- [ ] **Step 2: Manual path**

As editor: create entry, save draft (public API still empty — Task 10), publish, badge → published; edit title → modified; publish again → published.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: entry list and schema-driven form UI"
```

---

### Task 9: Media storage adapters + admin upload

**Files:**
- Create: `apps/web/src/lib/storage/types.ts`
- Create: `apps/web/src/lib/storage/db-driver.ts`
- Create: `apps/web/src/lib/storage/s3-driver.ts`
- Create: `apps/web/src/lib/storage/index.ts`
- Create: `apps/web/src/lib/storage/storage.test.ts`
- Create: `apps/web/src/app/api/admin/projects/[projectId]/media/route.ts`
- Create: `apps/web/src/app/api/admin/projects/[projectId]/media/[mediaId]/route.ts`
- Create: `apps/web/src/app/projects/[projectId]/media/page.tsx`
- Modify: `apps/web/src/components/media-picker.tsx`

**Interfaces:**
- Consumes: project `storageDriver`, optional S3 env/project fields
- Produces:
  - `getStorageDriver(project): StorageDriver`
  - `StorageDriver.put({ projectId, filename, mimeType, bytes }): { storageKey }`
  - `StorageDriver.get(storageKey): Promise<Uint8Array | { redirectUrl: string }>`
  - `StorageDriver.delete(storageKey): Promise<void>`

```ts
// apps/web/src/lib/storage/types.ts
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
  get(input: {
    storageKey: string;
    mimeType: string;
  }): Promise<StoredObject>;
  delete(storageKey: string): Promise<void>;
}
```

- [ ] **Step 1: Unit test db driver with Prisma mock or integration**

Prefer integration test skipped without DB; unit-test `getStorageDriver` selection:

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

- [ ] **Step 2: Implement drivers**

`db-driver`: `storageKey = mediaId`; write/read `MediaBlob.data`.

`s3-driver`: use `@aws-sdk/client-s3` `PutObject`/`GetObject`/`DeleteObject`; key = `${s3Prefix}${projectId}/${mediaId}/${filename}`; `get` may return `{ kind: "redirect", url: signedOrPublic }`. Env fallbacks: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT` (for R2/MinIO).

Admin `POST` multipart form field `file` → create `Media` + put bytes. `GET` list. `DELETE` removes storage + row.

- [ ] **Step 3: Media library page + wire MediaPicker**

Picker opens project media list, upload button, returns selected `media.id`.

- [ ] **Step 4: Commit**

```bash
pnpm --filter @studio-cms/web add @aws-sdk/client-s3
git commit -am "feat: db and s3 media storage adapters"
```

---

### Task 10: Public API v1 + CORS + rate limit

**Files:**
- Create: `apps/web/src/lib/auth/rate-limit.ts`
- Create: `apps/web/src/lib/cors.ts`
- Create: `apps/web/src/app/api/v1/[projectId]/entries/route.ts`
- Create: `apps/web/src/app/api/v1/[projectId]/entries/[entryId]/route.ts`
- Create: `apps/web/src/app/api/v1/[projectId]/entries/by-slug/[type]/[slug]/route.ts`
- Create: `apps/web/src/app/api/v1/[projectId]/types/route.ts`
- Create: `apps/web/src/app/api/v1/[projectId]/media/[mediaId]/route.ts`
- Create: `apps/web/src/lib/auth/public-api.test.ts` (helpers)

**Interfaces:**
- Consumes: `verifyApiKey`, storage `get`, entries published
- Produces: public JSON shape:

```ts
type PublicEntry = {
  id: string;
  type: string;
  slug: string | null;
  data: unknown; // dataPublished
  updatedAt: string;
};
```

Auth: `Authorization: Bearer <rawApiKey>`; key’s `projectId` must match URL `projectId`.

- [ ] **Step 1: Implement bearer guard + rate limit**

```ts
// apps/web/src/lib/auth/rate-limit.ts
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
// apps/web/src/lib/cors.ts
export function corsHeaders(origin: string | null, allowlist: string[]) {
  if (!origin || allowlist.length === 0 || !allowlist.includes(origin)) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    Vary: "Origin",
  };
}
```

Handle `OPTIONS` on public routes.

- [ ] **Step 2: Entries handlers**

- List: `where: { projectId, typeName, status: published, dataPublished: { not: null } }`, map to `PublicEntry`
- Get by id / by slug: 404 if not published
- Types: return `{ name, title, fields }` for project
- Media: load media + driver.get → if bytes, `new Response(data, { headers: { "Content-Type": mime } })`; if redirect, `Response.redirect(url, 302)`

Rewrite media ids inside `data`? **MVP:** store media ids in JSON; SDK/helper `mediaUrl(id)` builds `/api/v1/:projectId/media/:id`. Document in README.

- [ ] **Step 3: Manual curl**

```bash
curl -H "Authorization: Bearer cms_..." "http://localhost:3000/api/v1/<projectId>/entries?type=product"
```

Expected: only published entries. Draft-only entry absent.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat: public v1 API with CORS and rate limits"
```

---

### Task 11: SDK package

**Files:**
- Create: `packages/sdk/package.json`
- Create: `packages/sdk/tsconfig.json`
- Create: `packages/sdk/src/client.ts`
- Create: `packages/sdk/src/index.ts`
- Create: `packages/sdk/src/client.test.ts`

**Interfaces:**
- Consumes: public API
- Produces:

```ts
export type CmsClient = {
  getEntries(type: string, opts?: { limit?: number; offset?: number }): Promise<PublicEntry[]>;
  getEntry(id: string): Promise<PublicEntry>;
  getEntryBySlug(type: string, slug: string): Promise<PublicEntry>;
  getTypes(): Promise<Array<{ name: string; title: string; fields: unknown }>>;
  mediaUrl(mediaId: string): string;
};

export function createClient(options: {
  baseUrl: string;
  projectId: string;
  apiKey: string;
  fetch?: typeof fetch;
}): CmsClient;
```

- [ ] **Step 1: Failing test with mock fetch**

```ts
import { describe, expect, it, vi } from "vitest";
import { createClient } from "./client";

describe("createClient", () => {
  it("calls entries endpoint with bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: "1", type: "product", slug: "a", data: {}, updatedAt: "x" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const cms = createClient({
      baseUrl: "http://cms.test",
      projectId: "p1",
      apiKey: "cms_test",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const rows = await cms.getEntries("product");
    expect(rows).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://cms.test/api/v1/p1/entries?type=product",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer cms_test" }),
      }),
    );
  });
});
```

- [ ] **Step 2: Implement + build**

```json
// packages/sdk/package.json
{
  "name": "@studio-cms/sdk",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "devDependencies": { "typescript": "^5", "vitest": "^3" }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/sdk
git commit -m "feat: add @studio-cms/sdk createClient"
```

---

### Task 12: End-to-end smoke script + README

**Files:**
- Create: `apps/web/scripts/smoke.ts`
- Modify: `README.md`
- Modify: `apps/web/src/app/page.tsx` (redirect logged-in → `/projects`, else `/login`)

**Interfaces:**
- Consumes: all prior tasks
- Produces: script proving success criteria 1–5 against local server

- [ ] **Step 1: Smoke script flow**

```ts
// apps/web/scripts/smoke.ts
// 1) login as superadmin
// 2) create project A (db) + project B (s3 or db)
// 3) create type + editor member on A
// 4) login as editor, create entry, publish
// 5) create API key, fetch public entries via SDK
// 6) ensure project B cannot read A’s entries with B’s key
```

Run:

```bash
pnpm --filter @studio-cms/web exec tsx scripts/smoke.ts
```

Expected: exit 0, prints `SMOKE_OK`.

- [ ] **Step 2: README**

Document:
- `pnpm install`, Postgres, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`
- Client handoff: URL + email/password
- Site integration example with `@studio-cms/sdk`
- Storage driver notes (db vs s3 env vars)

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "docs: README and smoke script for CMS MVP"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Next.js admin + API only | 1 |
| One Postgres, schemas in DB | 1, 5 |
| Superadmin schema builder / editor content only | 2, 3, 5, 6, 7, 8 |
| Draft → publish | 7, 8 |
| REST + thin SDK | 10, 11 |
| API keys hashed, session cookies, argon2 | 2, 4 |
| Storage db \| s3 per project | 3, 9 |
| Public media opaque URL | 9, 10 |
| CORS allowlist + rate limit | 10 |
| Success criteria 1–5 | 12 |
| No Sanity migration / versions / webhooks | excluded |

## Self-review notes

- Types/names aligned: `dataDraft` / `dataPublished`, `typeName`, `createClient`, `entryUiStatus`, `cms_session`
- No separate Nest service anywhere in tasks
- S3 project without credentials will fail upload clearly — acceptable; smoke may use `db` for both projects if S3 unavailable
