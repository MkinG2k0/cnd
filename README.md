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
- `content/site.json` — тексты, ЖК, команда, контакты, квиз
- `content/project-pdfs.json` — привязка PDF к ЖК
- `public/assets/` — фото объектов, команды, логотип
- `public/projects/` — проектная документация (Git LFS)
- `DESIGN.md` / `PRODUCT.md` — дизайн-система и продуктовый контекст
