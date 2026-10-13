# CND Android App (Expo) — Design Spec

**Date:** 2026-10-13  
**Status:** Ready for user review  
**Stack:** Expo (React Native) + TypeScript, Sanity CDN, Expo Notifications / FCM  
**Platform (MVP):** Android only

## Problem

The marketing site [cnd05.ru](https://cnd05.ru) converts visitors through a ЖК catalog, WhatsApp quiz, and phone contact. An Android app should feel more useful than a browser bookmark: local favorites and broadcast push notifications, while keeping the same content source and conversion paths.

## Goals

- Client-facing Android app for browsing new-build complexes (ЖК) in Dagestan
- Local favorites (device-only; no account)
- Broadcast push notifications (new objects / promotions)
- Conversion parity with the site: multi-step quiz → WhatsApp, plus call / WhatsApp shortcuts
- Same Sanity project/dataset as the website (`8i7jup9p` / `production`)
- Live in-repo under `mobile/` next to the Next.js site and `studio-cnd/`

## Non-goals (MVP)

- iOS
- User accounts / SMS login / cross-device favorite sync
- Side-by-side ЖК comparison
- Agent / CRM / team cabinet
- Push admin UI inside Sanity or a custom backend
- Full offline catalog cache
- Packaging the Next.js site in a WebView / Capacitor shell
- Sharing favorites UI with the public website

## Decisions already locked

| Topic | Choice |
|--------|--------|
| Audience | Clients only (enhanced vs website) |
| MVP extras | Favorites + broadcast pushes; comparison later |
| Identity | No account; favorites local; account later if sync needed |
| Conversion | Quiz + call / WhatsApp (site parity) |
| Implementation | Expo + Sanity (not Capacitor) |
| Repo layout | `mobile/` inside this repository |

## Architecture

```
[Expo app in mobile/]
    |-- GROQ / @sanity/client --> [Sanity CDN: products, siteSettings]
    |-- AsyncStorage             (favorite slugs / ids)
    |-- Expo Notifications + FCM (broadcast pushes)
    +-- Linking                  (tel:, WhatsApp, PDF URLs, deep links)
```

The Next.js site remains a separate client of the same CMS. The app does not embed `cnd05.ru`.

### Repository layout

```
cnd/
  src/            # Next.js site
  studio-cnd/     # Sanity Studio
  mobile/         # Expo Android app (own package.json)
  docs/
```

Root `package.json` stays the website. `mobile/` is an independent Expo project (not merged into the site workspace for MVP).

## Navigation and screens

**Bottom tabs**

1. **Catalog** — ЖК list with city filter, text search, price sort; entry to quiz
2. **Favorites** — locally saved ЖК
3. **Contacts** — phone, WhatsApp, Telegram, email, address; short about / founder from Sanity

**Stack / overlays**

- Catalog (or Favorites) → **ЖК detail**
- Quiz as modal or stack screen from catalog / detail / CTA
- Push tap → catalog or `zhk/{slug}` via deep link (`cnd://zhk/{slug}` or HTTPS app link once configured)

## Data

### Sanity

- Client: `@sanity/client` with `EXPO_PUBLIC_SANITY_PROJECT_ID`, `EXPO_PUBLIC_SANITY_DATASET`, API version aligned with the site
- Queries mirror site needs: product list, product by slug, site settings (contacts, quiz, team/about as needed for Contacts)
- Images via Sanity image CDN URLs
- `projectPdf` opened externally (system viewer / browser)

### Favorites

- App-only; website never shows favorites UI
- Persist array of product slug or `_id` in AsyncStorage
- Heart toggle on list rows and detail
- Favorites tab resolves current product payloads from Sanity; unpublished / missing items are dropped or shown as unavailable

### Pushes

- Request permission on first launch (or first meaningful session)
- Broadcast campaigns for MVP via Expo Push / Firebase Console (no in-house admin)
- Optional deep link payload with slug
- MVP uses Expo’s project-level push delivery (device tokens handled by Expo). No custom token-registration backend in MVP; add one only if Expo project push tools prove insufficient

### Conversion

- Quiz steps from `siteSettings.quiz`; finish opens WhatsApp with composed answers (same number / intent as site)
- Detail and Contacts expose `tel:` and WhatsApp
- Detail may pass selected ЖК name into the WhatsApp message when quiz is started from that object

## Visual direction

- Brand tokens from site `DESIGN.md` (forest / brass / pale surfaces)
- Native Android patterns: bottom tabs, system back, list/detail density
- Do not clone the web hero layout; catalog is the primary home surface

## Error handling

- Network / Sanity failure: empty or error state with retry; no crash
- Favorites ids remain readable offline from AsyncStorage even if catalog refresh fails
- Missing PDF or contact channel: hide or disable the action

## Build and Play Store

- Expo + EAS Build → Android App Bundle
- Suggested application id: `ru.cnd05.app` (confirm at project init)
- Store requirements: privacy policy on `cnd05.ru`, Data safety form (disclose push/device data honestly), screenshots, content rating, current target SDK
- Store narrative: native favorites + pushes + call/WhatsApp — not a bare website wrapper

## Testing (MVP acceptance)

Manual checklist on emulator + one physical Android device:

- [ ] Catalog loads from Sanity; city filter, search, price sort work
- [ ] Detail shows content; PDF opens when present
- [ ] Favorite toggle persists across app restart
- [ ] Favorites tab lists saved ЖК; removing works
- [ ] Quiz completes and opens WhatsApp with answers
- [ ] Call and WhatsApp actions work from detail and contacts
- [ ] Push permission flow works; notification open routes to catalog or detail
- [ ] Offline / failed fetch shows recoverable UI

## Future (explicitly later)

- iOS from the same Expo app
- Accounts and cloud favorite sync
- ЖК comparison
- In-app or Sanity-driven push campaign UI
- Richer offline cache
- Optional hybrid WebView only if a specific screen is cheaper to reuse from the site

## Success criteria

A user can discover a fitting ЖК in the app, save it to favorites, receive broadcast pushes about new listings/promotions, and convert via quiz → WhatsApp or direct call — using the same CMS content as the website, without requiring an account.
