# Custom Headless CMS — Design Spec

**Date:** 2026-10-12  
**Status:** Approved for planning  
**Stack:** Next.js (admin + API), Postgres; consumer sites use plain `fetch`

## Problem

Sanity works for structured content, but clients must register in Sanity’s ecosystem. We need a private CMS where a client gets only an admin URL + login/password, with one shared database for all of our projects.

## Goals

- Embed easily into Next.js sites via REST + plain `fetch`
- Simple setup and integration per site (`projectId` + API key)
- Separate single Next.js CMS app (no monorepo; low traffic, multi-project)
- One Postgres database for all projects; schemas stored in DB
- Visual schema builder for the developer (superadmin only)
- Clients edit content only (draft → publish)
- Per-project media storage: `db` or `s3`, chosen by developer

## Non-goals (MVP)

- Nested roles beyond `superadmin` / `editor`
- Version history / rollback
- Draft preview on the live site
- Webhooks
- i18n
- Page builder / portable-text parity with Sanity
- Separate Nest/Hono (or other) API service — everything stays on Next.js
- Monorepo / published SDK package — sites call the API with `fetch`

## Architecture

```
[Site Next.js] --fetch/REST--> [CMS Next.js: /api/v1 + admin] --Prisma--> [Postgres]
                                         |
                                         +-- storage adapter (db | s3)
```

Single deployable Next.js app (one repo):

1. **Admin UI** — authenticated app routes (`/login`, `/projects`, …)
2. **Public REST API** (`/api/v1/...`) — published content only
3. **Admin API** — session-authenticated mutations under `/api/admin/...`

## Data model (Postgres)

| Table | Purpose |
|--------|---------|
| `users` | credentials, role (`superadmin` \| `editor`) |
| `projects` | name, slug, `storage_driver` (`db` \| `s3`), optional S3 config, status |
| `project_members` | user ↔ project membership for editors |
| `api_keys` | per-project site keys (store hash only; plaintext shown once) |
| `content_types` | schema per project: name, title, fields JSON |
| `entries` | content: type, optional slug, `data_draft`, `data_published`, status, timestamps |
| `media` | file metadata + storage reference (blob id or S3 key) |
| `media_blobs` | optional; used when `storage_driver = db` |

### Content type schema (JSON)

Supported field types (MVP set B):

`string`, `text`, `number`, `boolean`, `image`, `file`, `reference`, `array`, `richtext`, `slug`, `datetime`, `object`

`richtext` stores HTML string in MVP (simple editor, matches existing site content patterns). Nested `object` fields are a flat group of the same scalar/media/reference types (one nesting level).

Example:

```json
{
  "name": "product",
  "title": "ЖК",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "slug", "type": "slug", "from": "title" },
    { "name": "gallery", "type": "array", "of": "image" },
    { "name": "body", "type": "richtext" }
  ]
}
```

### Entry lifecycle

1. Editor edits `data_draft`
2. Save persists draft only
3. Publish copies `data_draft` → `data_published`, sets status `published`
4. If draft diverges from published → UI status `modified`
5. Public API reads only `data_published`

### Tenancy

All content, types, media, and keys are scoped by `projectId`. Superadmin sees all projects; editors see only membership projects.

## API

### Public (Bearer API key)

- `GET /api/v1/:projectId/entries?type=&limit=&offset=`
- `GET /api/v1/:projectId/entries/:id`
- `GET /api/v1/:projectId/entries/by-slug/:type/:slug`
- `GET /api/v1/:projectId/types` (optional, debug)
- `GET /api/v1/:projectId/media/:id` — streams or redirects to the file; sites always use this URL so `db` vs `s3` stays opaque

Returns published data only. No GROQ; filters limited to `type`, `limit`, `offset`.

### Admin (session cookie)

- Auth: login / logout
- Superadmin: projects, content types, API keys, members, storage settings
- Superadmin + editor: entries CRUD, publish, media upload/list/delete

## Site integration (fetch)

No SDK. Consumer sites call the public API directly:

```ts
const res = await fetch(
  `${process.env.CMS_URL}/api/v1/${process.env.CMS_PROJECT_ID}/entries?type=product`,
  {
    headers: { Authorization: `Bearer ${process.env.CMS_API_KEY}` },
    next: { revalidate: 60 },
  },
)
const products = await res.json()
```

Media URL: `${CMS_URL}/api/v1/${projectId}/media/${mediaId}`.

## Admin UI

### Superadmin

- `/login`
- `/projects` — create/list; set storage driver
- `/projects/[id]/types` — schema builder (field add/edit/reorder via order controls)
- `/projects/[id]/keys` — API keys
- `/projects/[id]/members` — attach editors
- Media library per project

### Editor

- `/projects/[id]` — dashboard
- `/projects/[id]/entries/[type]` — list
- `/projects/[id]/entries/[type]/[entryId]` — form from schema; Save / Publish
- Status badges: `draft` / `published` / `modified`
- No access to schema builder or (by default) API keys

### Client handoff

Give: admin URL + username + password. Client never registers in a third-party CMS cloud.

## Storage

Per-project adapter selected by developer:

| Driver | Behavior |
|--------|----------|
| `db` | bytes in Postgres blob table; `media` holds metadata |
| `s3` | object in bucket; `media` holds key, mime, size, public or signed URL strategy |

Admin and public media APIs hide the driver difference from editors and sites.

## Security

- Password hashing: argon2
- Admin sessions: httpOnly secure cookies
- API keys: salted hash at rest; plaintext only at creation time
- Enforce `projectId` scope on every query
- Public API: published-only; basic per-key rate limiting
- Per-project CORS allowlist field on `projects`; empty list means deny browser origins (server-side SDK fetch unaffected)
- Editors cannot mutate content types, API keys, or global users

## Project layout (CMS repo)

New standalone Next.js repository (not a monorepo, not inside a marketing site):

```
/                 # Next.js app (admin UI + API)
prisma/           # schema + seed
src/app/          # pages + route handlers
src/lib/          # auth, schema, storage, tenancy
```

First consumer can be the existing CND site after CMS MVP is ready; migration from Sanity is out of scope for this CMS MVP itself.

## Success criteria

1. Superadmin creates a project, defines types in UI, creates an editor user
2. Editor logs in with URL + credentials, edits draft, publishes
3. A Next.js site reads published entries via `fetch` + API key
4. Two projects share one DB with isolated data
5. One project can use `db` storage, another `s3`, without API changes for the site

## Open decisions for implementation plan (not blockers)

- Exact ORM: Prisma preferred unless plan finds a better fit
- Hosting target (VPS / Vercel + managed Postgres) — deploy detail, not product shape
