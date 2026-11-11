"use client";

import Image from "next/image";
import Link from "next/link";
import {
  formatPropertyDetail,
  money,
  phoneHref,
  productPath,
  relatedProducts,
  whatsappURL,
  type Product,
  type SiteContent,
} from "../lib/content";
import { BackHomeLink } from "./back-home-link";
import { ProductLink } from "./product-link";
import { ProjectPdfButton } from "./project-pdf-button";
import { PropertyGallery } from "./zhk/property-gallery";

interface PropertyDetailViewProps {
  content: SiteContent;
  product: Product;
  className?: string;
}

export function PropertyDetailView({
  content,
  product,
  className,
}: PropertyDetailViewProps) {
  const phoneLink = phoneHref(content.contacts.phone);
  const related = relatedProducts(content.products, product);
  const wa = whatsappURL(
    content.contacts.whatsapp,
    `Добрый день! Интересует ${product.name}. Подскажите подробности, пожалуйста.`,
  );

  return (
    <div className={className}>
      <a className="skip" href="#property-main">
        Перейти к описанию
      </a>

      <header className="header wrap">
        <BackHomeLink className="brand" aria-label="ЦНД — на главную">
          <Image src={content.logo} alt="" width={57} height={57} sizes="57px" />
          <span>
            <b>ЦНД</b>
            <small>
              Центр недвижимости
              <br />
              Дагестана
            </small>
          </span>
        </BackHomeLink>
        <nav aria-label="Основная навигация">
          <BackHomeLink>Наши дома</BackHomeLink>
          <Link href="/#about">О нас</Link>
          <Link href="/#team">Сотрудники</Link>
          <Link href="/#contacts">Контакты</Link>
        </nav>
        <a className="header-phone" href={phoneLink}>
          {content.contacts.phone}
          <span>Связаться с нами</span>
        </a>
      </header>

      <main id="property-main" className="property-page">
        <div className="wrap property-top">
          <nav className="breadcrumbs" aria-label="Хлебные крошки">
            <BackHomeLink>Главная</BackHomeLink>
            <span aria-hidden="true">/</span>
            <BackHomeLink>Наши дома</BackHomeLink>
            <span aria-hidden="true">/</span>
            <span>{product.name}</span>
          </nav>
          <BackHomeLink className="back-home" />
        </div>

        <article className="wrap property-layout">
          <PropertyGallery
            cover={product.image}
            images={product.gallery ?? []}
            name={product.name}
          />

          <div className="property-info">
            <p className="property-city">{product.city}</p>
            <h1>{product.name}</h1>
            <p className="property-lead">{product.description}</p>
            <p className="property-price">
              от {money(product.price)}
              <small>по опубликованной цене в каталоге</small>
            </p>

            <div className="property-actions">
              <a
                className="button"
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
              >
                Связаться с менеджером <span aria-hidden="true">↗</span>
              </a>
              <a className="button outline" href={phoneLink}>
                Позвонить
              </a>
              {product.projectPdf ? (
                <ProjectPdfButton
                  name={product.name}
                  href={product.projectPdf}
                />
              ) : null}
            </div>

            <div
              className="property-detail property-detail-block"
              dangerouslySetInnerHTML={{
                __html: formatPropertyDetail(product.detailHtml),
              }}
            />

            <div className="property-home-cta">
              <p>Смотрите весь каталог новостроек на главной странице ЦНД</p>
              <BackHomeLink className="button light-green">
                Все жилые комплексы
              </BackHomeLink>
            </div>
          </div>
        </article>

        {related.length > 0 ? (
          <section
            className="wrap related-section"
            aria-labelledby="related-title"
          >
            <h2 id="related-title">Ещё в {product.city}</h2>
            <div className="related-grid">
              {related.map((item) => (
                <ProductLink
                  key={item.id}
                  href={productPath(item)}
                  className="related-card"
                >
                  <Image
                    src={item.image}
                    alt=""
                    width={400}
                    height={280}
                    loading="lazy"
                    sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
                    quality={75}
                  />
                  <div>
                    <h3>{item.name}</h3>
                    <p>{money(item.price)}</p>
                  </div>
                </ProductLink>
              ))}
            </div>
            <BackHomeLink className="text-link related-home">
              Вернуться на главную <span aria-hidden="true">↗</span>
            </BackHomeLink>
          </section>
        ) : (
          <section className="wrap related-section">
            <BackHomeLink className="button outline">
              ← На главную ЦНД
            </BackHomeLink>
          </section>
        )}
      </main>

      <footer className="wrap footer">
        <BackHomeLink className="footer-brand">
          ЦНД <span>Недвижимость Дагестана</span>
        </BackHomeLink>
        <BackHomeLink>Наши дома</BackHomeLink>
        <Link href="/#about">О нас</Link>
        <Link href="/#contacts">Контакты</Link>
      </footer>
    </div>
  );
}
