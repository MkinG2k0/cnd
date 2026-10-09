# CND — Недвижимость Дагестана

Next.js-копия сайта [cnd05.ru](https://cnd05.ru/) с перенесённым контентом, фото и текущим дизайном (Tilda).

## Разработка

```bash
npm install
npm run dev
```

Продакшен:

```bash
npm run build
npm start
```

## Повторный импорт с Tilda

Если нужно обновить контент с оригинала:

```bash
# скачать HTML
# Invoke-WebRequest -Uri "https://cnd05.ru/" -OutFile "site.html" -UseBasicParsing

npm run import:tilda
```

## Структура

- `public/mirror/index.html` — полная страница-зеркало
- `public/tilda/` — локальные CSS и изображения
- `content/` — метаданные импорта
- `scripts/` — скрипты импорта
