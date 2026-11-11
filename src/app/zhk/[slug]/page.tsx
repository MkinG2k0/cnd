import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isCapacitorShell } from "../../../lib/capacitor";
import {
  SITE_NAME,
  SITE_URL,
  getContent,
  getProductBySlug,
  money,
  productDescription,
  productPath,
  productSlug,
} from "../../../lib/content";
import { CapacitorShell } from "../../capacitor-shell";
import { PropertyDetailView } from "../../property-detail-view";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function absoluteUrl(url: string) {
  if (!url) return SITE_URL;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function generateStaticParams() {
  // Static export requires ≥1 path; Capacitor navigates ЖК via hash on `/`.
  if (isCapacitorShell()) {
    return [{ slug: "_" }];
  }
  const content = await getContent();
  return content.products.map((product) => ({
    slug: productSlug(product),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (isCapacitorShell()) {
    return { title: "Объект" };
  }

  const { slug } = await params;
  const content = await getContent();
  const product = getProductBySlug(content.products, slug);
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
      images: [{ url: product.image, alt: product.name }],
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

function PropertyPageFallback() {
  return (
    <main id="property-main" className="property-page">
      <div className="wrap property-top">
        <p>Загрузка объекта…</p>
      </div>
    </main>
  );
}

export default function PropertyPage({ params }: PageProps) {
  if (isCapacitorShell()) {
    return <CapacitorShell />;
  }

  return (
    <Suspense fallback={<PropertyPageFallback />}>
      <PropertyPageContent params={params} />
    </Suspense>
  );
}

async function PropertyPageContent({ params }: PageProps) {
  const { slug } = await params;
  const content = await getContent();
  const product = getProductBySlug(content.products, slug);
  if (!product) notFound();

  const pageUrl = `${SITE_URL}${productPath(product)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: product.name,
    description: productDescription(product, 300),
    url: pageUrl,
    image: absoluteUrl(product.image),
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
      <PropertyDetailView content={content} product={product} />
    </>
  );
}
