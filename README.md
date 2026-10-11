# CND — Недвижимость Дагестана

Маркетинговый сайт агентства новостроек Дагестана на Next.js. Каталог ЖК, квиз в WhatsApp, страницы объектов и проектная документация (PDF).

Продакшен: [cnd05.ru](https://cnd05.ru) (после переключения DNS). Превью: [cnd-kohl.vercel.app](https://cnd-kohl.vercel.app).

## Разработка

```bash
npm install
npm run dev
```

Продакшен-сборка:

```bash
npm run build
npm start
```

## Структура

- `src/app/` — UI: главная, `/zhk/[slug]`, квиз, SEO (`robots`, `sitemap`)
- `src/sanity/` — клиент и GROQ-запросы к Sanity
- `studio-cnd/` — Sanity Studio (standalone, порт 3333)
- `content/site.json` — исходный снимок контента (для миграции)
- `content/project-pdfs.json` — привязка PDF к ЖК
- `public/assets/` — исходные фото (загружены в Sanity)
- `public/projects/` — проектная документация (Git LFS)
- `DESIGN.md` / `PRODUCT.md` — дизайн-система и продуктовый контекст

## Sanity

```bash
# сайт
npm run dev

# админка контента (отдельный терминал)
cd studio-cnd
npm run dev
```

Studio: http://localhost:3333  
Вход — аккаунт Sanity (email). Проект: `8i7jup9p`, dataset: `production`.

Переменные в `.env.local`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=8i7jup9p
NEXT_PUBLIC_SANITY_DATASET=production
```

Повторный импорт из JSON (если нужно):

```bash
cd studio-cnd
npm run migrate
```
