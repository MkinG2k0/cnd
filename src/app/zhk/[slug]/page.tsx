import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  SITE_NAME,
  SITE_URL,
  content,
  formatPropertyDetail,
  getProductBySlug,
  money,
  phoneHref,
  productDescription,
  productPath,
  productSlug,
  relatedProducts,
  whatsappURL,
} from "../../../lib/content";
import { BackHomeLink } from "../../back-home-link";
import { ProjectPdfButton } from "../../project-pdf-button";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return content.products.map((product) => ({
    slug: productSlug(product),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: "Объект не найден" };
  }

  const title = `${product.name} — квартиры в ${product.city}`;
  const description = `${productDescription(product, 140)} Цена от ${money(product.price)}. Подбор квартиры с ЦНД.`;
  const url = `${SITE_URL}${productPath(product)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "ru_RU",
      url,
      siteName: SITE_NAME,
      title: `${product.name} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: product.image,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ЦНД`,
      description,
      images: [product.image],
    },
    keywords: [
      product.name,
      `квартиры ${product.city}`,
      `новостройки ${product.city}`,
      "ЦНД",
      "Недвижимость Дагестана",
      "купить квартиру",
    ],
  };
}

export default async function PropertyPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const phoneLink = phoneHref(content.contacts.phone);
  const related = relatedProducts(product);
  const pageUrl = `${SITE_URL}${productPath(product)}`;
  const wa = whatsappURL(
    content.contacts.whatsapp,
    `Добрый день! Интересует ${product.name}. Подскажите подробности, пожалуйста.`,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: product.name,
    description: productDescription(product, 300),
    url: pageUrl,
    image: `${SITE_URL}${product.image}`,
    datePosted: "2026-10-09",
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: pageUrl,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: product.city,
      addressRegion: "Республика Дагестан",
      addressCountry: "RU",
    },
    seller: {
      "@type": "RealEstateAgent",
      name: SITE_NAME,
      url: SITE_URL,
      telephone: content.contacts.phone,
      email: content.contacts.email,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Наши дома",
        item: `${SITE_URL}/#catalog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

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
          <div className="property-media">
            <Image
              src={product.image}
              alt={product.name}
              width={960}
              height={660}
              sizes="(max-width: 900px) 100vw, 50vw"
              quality={75}
              preload
            />
          </div>

          <div className="property-info">
            <p className="property-city">{product.city}</p>
            <h1>{product.name}</h1>
            <p className="property-lead">{product.description}</p>
            <p className="property-price">
              от {money(product.price)}
              <small>по опубликованной цене в каталоге</small>
            </p>

            <div className="property-actions">
              <a className="button" href={wa} target="_blank" rel="noopener noreferrer">
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
          <section className="wrap related-section" aria-labelledby="related-title">
            <h2 id="related-title">Ещё в {product.city}</h2>
            <div className="related-grid">
              {related.map((item) => (
                <Link
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
                </Link>
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
    </>
  );
}
