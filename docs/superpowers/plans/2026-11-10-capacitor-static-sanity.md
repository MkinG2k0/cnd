# Capacitor Static Sanity Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Android Capacitor APK with static Next export and live Sanity catalog (no push).

**Architecture:** Conditional `NEXT_PUBLIC_CAPACITOR=1` build exports `out/`; Capacitor Android loads it; client fetches Sanity; detail via `#zhk/{slug}`.

**Tech Stack:** Next.js 16, Sanity CDN, Capacitor 7 Android

## Global Constraints

- Do not break Vercel SSR site build without the Capacitor env flag
- No secrets in the APK (public Sanity dataset only)
- Keep `mobile/` Expo and `mobile-web/` as-is for now
- Respond/docs in repo stay Russian where user-facing

---

### Task 1: Shared content mapping + browser fetch

- [x] Extract Sanity → `SiteContent` mapping usable from client
- [x] Add `fetchSiteContent()` without Next `revalidate` options
- [x] Keep `getContent()` for SSR site

### Task 2: Capacitor app shell UI

- [x] Client shell: load Sanity, show Home or property detail from hash
- [x] Product links in shell use `#zhk/{slug}`
- [x] Wire `page.tsx` / layout for capacitor vs web

### Task 3: Static export config + scripts

- [x] Conditional `next.config` for export + unoptimized images
- [x] Handle `sitemap`/`robots` under export
- [x] npm scripts: `build:capacitor`, `cap:sync`

### Task 4: Capacitor Android project

- [x] `capacitor.config.ts`, add Android, appId `ru.cnd05.app`
- [x] README for Android Studio / APK build

### Task 5: Verify

- [x] `npm run build` (web) still works
- [x] `npm run build:capacitor` produces `out/`
- [x] `npx cap sync android` succeeds
