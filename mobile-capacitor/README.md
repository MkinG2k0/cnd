# ЦНД — Capacitor (Android)

Статическая оболочка сайта (`out/` после `next export`) + живой каталог из Sanity CDN.

- applicationId: `ru.cnd05.app`
- versionName: `1.1.0` / versionCode: `3`
- Контент ЖК обновляется без новой сборки APK (клиентский fetch Sanity)
- Push в MVP нет
- Target store: RuStore

## Иконка и splash

Источник: `public/assets/logo.png`

```bash
npm run cap:icons
```

## Подпись release

Один раз:

```bash
npm run cap:keystore
```

Создаёт gitignored файлы:

- `android/cnd-upload.keystore`
- `android/keystore.properties`

Пароли можно задать через env: `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, `ANDROID_KEY_ALIAS`.

Шаблон: `android/keystore.properties.example`.

## Dev / sync

```bash
npm install
npm run cap:sync
npm run cap:open
```

## Production APK / AAB

```bash
npm run cap:release
```

Артефакты:

- `android/app/build/outputs/apk/release/app-release.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

Для RuStore обычно достаточно signed APK или AAB.

## Sanity CORS (обязательно для live-каталога)

В allowlist должны быть:

- `https://localhost` (Capacitor Android)
- `capacitor://localhost`

```bash
cd studio-cnd
npx sanity cors add https://localhost --no-credentials
npx sanity cors add capacitor://localhost --no-credentials
```
