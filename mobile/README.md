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

## Sanity CORS (нужно для Expo Web)

Каталог на `http://localhost:8081` ходит в Sanity прямо из браузера. Если origin не в allowlist, API отвечает `403 CORS Origin not allowed`, и экран показывает «Не удалось загрузить каталог».

Добавить origin (из папки `studio-cnd`):

```bash
npx sanity cors add http://localhost:8081 --no-credentials
npx sanity cors add http://127.0.0.1:8081 --no-credentials
```

Нативное Android-приложение CORS не использует: Origin-заголовок туда не уходит.

## Google Play и публикация

- **Push-уведомления:** [Expo push tool](https://expo.dev/notifications) отправляет уведомление на конкретные Expo push token и сам по себе не выполняет массовую рассылку без списка токенов.
- `getExpoPushTokenAsync` требует настоящий EAS project ID. После `eas init` добавьте выданный ID в `app.json` по пути `expo.extra.eas.projectId`; не используйте вымышленное значение.
- У MVP нет собственного push-бэкенда. Поэтому оператору нужно отдельно собрать токены устройств: при development-сборке токен печатается в лог с префиксом `Expo push token:`, а последний полученный токен сохраняется на устройстве в AsyncStorage под ключом `cnd.push.token`. В дальнейшем массовую доставку можно реализовать через разрешённую инфраструктуру, например FCM topics.
- **Data safety (Play Console):** укажите сбор push-токена для уведомлений; избранное хранится только на устройстве (AsyncStorage), на сервер не отправляется.
- **Политика конфиденциальности:** перед отправкой в магазин нужен публичный URL на домене сайта — `https://cnd05.ru/privacy` (страница на Next-сайте).

## Тесты

```bash
cd mobile
npm test
```
