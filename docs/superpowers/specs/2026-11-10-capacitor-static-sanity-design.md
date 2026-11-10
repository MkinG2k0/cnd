# Capacitor + static Next + live Sanity — Design

**Date:** 2026-11-10  
**Status:** Approved for implementation  
**MVP:** Android APK for RuStore without push

## Goal

Ship an Android shell that reuses the Next.js UI as a static WebView bundle, while **ЖК/content update from Sanity CDN without rebuilding the APK**.

## Non-goals (MVP)

- Push notifications
- iOS
- Live Next SSR / API routes / Server Actions inside the APK
- Replacing Expo `mobile/` (left untouched)
- Guaranteeing RuStore 8.2 acceptance (no native extras yet; risk accepted)

## Architecture

```
[Capacitor Android APK]
  └── WebView loads local `out/` (next export)
        ├── UI shell (catalog + detail via hash routing)
        └── HTTPS fetch → Sanity CDN (live catalog)
```

- Production website on Vercel stays SSR (`next build` as today).
- Capacitor build uses `NEXT_PUBLIC_CAPACITOR=1` → `output: 'export'`, `images.unoptimized`, client Sanity fetch, hash detail routes (`#zhk/{slug}`) so **new products work without new HTML files in the APK**.
- App id: `ru.cnd05.app` (not the rejected `ru.cnd05.web`).

## Content updates

Client maps the same GROQ queries / mappers as `getContent()`. Opening the app refetches Sanity; editing Studio updates the catalog without a store release.
