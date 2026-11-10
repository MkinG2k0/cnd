# ЦНД — Capacitor (Android)

Статическая оболочка сайта (`out/` после `next export`) + живой каталог из Sanity CDN.

- applicationId: `ru.cnd05.app`
- Контент ЖК обновляется без новой сборки APK (клиентский fetch Sanity)
- Push в MVP нет

## Сборка

Из корня репозитория:

```bash
npm install
npm run cap:sync
npm run cap:open
```

В Android Studio: Build → Build APK(s) / Generate Signed Bundle.

Только веб-статика без sync:

```bash
npm run build:capacitor
```

Выход: `/workspace/out`
