# Telegram → ЖК enrichment (one-shot) — Design Spec

**Date:** 2026-10-15  
**Status:** Approved — plan in `docs/superpowers/plans/2026-10-15-telegram-zhk-enrichment.md`  
**Goal:** One-time enrichment of existing product cards from the ЦНД Telegram group export — media + marketing texts. **Do not change prices.**

## Problem

The private Telegram supergroup «ЦНД» holds photos, presentation PDFs, and usable marketing copy for ЖК already listed on the site. That material is not on the public cards. We need a controlled one-shot import, not a live Telegram sync.

## Goals

- Enrich **existing** Sanity `product` documents only (mapped topics)
- Import public photos into a new `gallery` (+ optional cover update)
- Attach presentation PDFs via `projectPdf` / `public/projects/`
- Merge allowlisted marketing texts into `detailHtml`
- Leave `price` untouched
- Dry-run first; human review in Studio before treating content as final

## Non-goals (v1)

- New ЖК not already on the site (Притяжение, Сириус, Брода, Ватан, Халимбекаульская, …)
- Live Telegram bot / continuous sync
- Importing commissions, leads (Запросы/Предложения), chessboards, private invite links
- Legal PDFs (РнС, ЕГРН, ДДУ forms) as public downloads
- Video player / video upload to product pages
- Changing catalog prices from Telegram quotes
- Custom CMS migration (separate track)

## Source

Path (local, not in repo):

`ChatExport_2026-10-14/` — `result.json`, `photos/`, `files/`, `video_files/`

Group: private supergroup «ЦНД», forum topics, ~2026-09-09 → 2026-10-12.

## Topic → product mapping

| Telegram topic | Site / Sanity product |
|----------------|------------------------|
| ЖК Новый горизонт | ЖК Новый Горизонт |
| ЖК Московский | ЖК Московский |
| ЖкК высота | ЖК Высота |
| СК ЖБИ (Мечта materials) | ЖК Мечта |
| ЖК Август | ЖК Август |
| Жк Сите | ЖК Сите |
| Жк Гранд Берег - СК Унистрой | ЖК Грандберег |
| ЖК Ботаника - СК АРДВ | ЖК Ботаника |
| СК Аркадий СТ - Золотые пески - Новая жизнь | ЖК Золотые Пески — only messages/files that clearly refer to «Золотые пески»; content for «Новая жизнь» is skipped in v1 (separate site product, no auto-merge) |

Unmapped / excluded topics: Притяжение, Брода, Сириус, Ватан, Халимбекаульская, IQ квартал (empty), Контент, Запросы, Предложения, Информация.

## Schema changes

Extend `studio-cnd/schemaTypes/documents/product.ts`:

- Add `gallery`: `array` of `image` (hotspot enabled)
- Keep `image` as catalog cover / OG / hero primary
- Keep `projectPdf` as string path (e.g. `/projects/novyy-gorizont.pdf`)
- No schema field for price mutation; importer must never patch `price`

Site/mobile content mapping must pass `gallery` through Sanity queries and `src/lib/content.ts` (and mobile equivalents where the detail screen exists).

## Site UI

On `/zhk/[slug]`:

- Keep the existing main `image` as the primary hero
- If `gallery` has items, show a thumb strip (or simple prev/next) **below** the hero; selecting a thumb swaps the large preview without removing the cover from catalog/OG
- Keep existing PDF link when `projectPdf` is set
- Catalog cards and OG continue to use `image` only

Mobile: reuse `gallery` on the detail screen if present; list cards stay cover-only.

## Import pipeline

One-shot script (new file under `scripts/`, same spirit as `migrate-to-sanity.ts`):

```
result.json
  → parse messages by topic (reply_to → topic root)
  → apply mapping + media allow/deny rules
  → write manifest JSON
  → --dry-run | --apply
```

### CLI

- `--export <path>` — path to ChatExport folder (required)
- `--dry-run` — write manifest only, no Sanity/public writes
- `--apply` — upload assets and patch products
- Optional: `--only <slug-or-name>` for single product

### Manifest

Machine-readable report per product:

- telegram topic id/title
- sanity document id / name
- photos: local path → action (`gallery` / `cover` / `skip`)
- pdfs: local path → `projectPdf` path or `skip` + reason
- texts: message ids → `detailHtml` strategy (`append` / `replace` / `skip`)
- videos: listed as `deferred`
- explicit note: `price` not modified

### Media rules

**Photos (jpg/jpeg/png):**

- Upload to Sanity
- First selected photo → update `image` only when `--replace-cover` is set **or** cover is missing; default: keep current cover, put all into `gallery`
- Idempotency: store Telegram message id in asset metadata / filename prefix so re-run does not duplicate

**HEIC:** skip in v1 (list in manifest as `skip: heic`). No conversion step in this phase.

**PDF:**

- Allow if filename/path indicates presentation (`презентация`, `проектное предложение`, clear marketing deck) **or** listed in a small whitelist file
- Deny legal/docs keywords: `разрешение`, `зеленка`, `егрн`, `договор`, `уступк`, `выписка`, and similar
- Copy allowed PDF to `public/projects/<slug>.pdf` (or slug-suffixed if multiple) and set `projectPdf`

**Video:** record in manifest as `deferred`; do not upload in v1.

**Text:**

- Only messages listed in `scripts/telegram-text-allowlist.json` (message id → product + `append`|`replace`)
- Convert plain text / light markup to simple HTML compatible with existing `formatPropertyDetail` (`br`, `strong`)
- Never import commission table or lead templates

Initial allowlist seed (from export review; editable before apply):

| Message id | Product | Strategy | Notes |
|------------|---------|----------|-------|
| 32, 33 | ЖК Мечта | append | purchase terms + delivery dates |
| 166 | ЖК Грандберег | replace or append if empty | marketing card |
| 169 | ЖК Золотые Пески | replace or append if empty | marketing card (Золотые пески only) |

Other topic texts (captions like «Лобби», sheet links) stay out of allowlist unless added manually after dry-run.

### Safety

- Never write `price`
- Never publish private/legal files
- Prefer dry-run → human review of manifest → apply → Studio spot-check

## Verification

1. Dry-run manifest covers only mapped products; excluded topics absent
2. After apply, Sanity products show new gallery / PDF / detailHtml; `price` unchanged vs before
3. `/zhk/[slug]` shows gallery + PDF for enriched products
4. Catalog / mobile list still show correct cover and old prices
5. Re-running `--apply` does not duplicate gallery images

## Open decisions (resolved)

- Approach: script helper → Sanity (not full autopublish without review) — **chosen**
- Field scope: media + texts, **not prices** — **chosen**
- Cover: keep existing by default; gallery gets Telegram photos — **chosen**

## Follow-ups (out of this spec)

- Add missing ЖК from Telegram as new products
- Optional video field + player
- Live Telegram → CMS sync
- Agent-only surfaces for leads/commissions
