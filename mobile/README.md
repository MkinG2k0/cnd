# CND Android (Expo)

Мобильное приложение ЦНД на Expo Router. Контент загружается из Sanity (те же project/dataset, что и у сайта).

## Локальный запуск

```bash
cd mobile
npm install
cp .env.example .env   # Windows: copy .env.example .env
npx expo start
```

Откройте приложение в Expo Go (QR) или эмуляторе Android (`a` в терминале Metro).

## Production-сборка Android (EAS)

Установите [EAS CLI](https://docs.expo.dev/build/setup/) и войдите в аккаунт Expo (`eas login`). Профили сборки — в `eas.json` (`development`, `preview`, `production`).

```bash
cd mobile
npm install
cp .env.example .env
# production Android bundle (AAB для Google Play)
npx eas build -p android --profile production
```

Для внутреннего APK используйте профиль `preview`:

```bash
npx eas build -p android --profile preview
```

После сборки загрузите AAB в Google Play Console и пройдите проверку релиза.

## Переменные окружения

Скопируйте `.env.example` в `.env` и при необходимости обновите значения Sanity.

## Google Play и публикация

- **Push-уведомления:** массовые рассылки настраиваются через [Expo push tool](https://expo.dev/notifications) или FCM; в приложении регистрируется Expo push token (см. `src/notifications/register.ts`).
- **Data safety (Play Console):** укажите сбор push-токена для уведомлений; избранное хранится только на устройстве (AsyncStorage), на сервер не отправляется.
- **Политика конфиденциальности:** перед отправкой в магазин нужен публичный URL на домене сайта — `https://cnd05.ru/privacy` (страница на Next-сайте).

## Тесты

```bash
cd mobile
npm test
```
