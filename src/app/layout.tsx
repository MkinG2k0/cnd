import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";
import { SITE_NAME, SITE_URL, getContent } from "../lib/content";
import "./globals.css";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-golos",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ЦНД`,
  },
  description:
    "Недвижимость Дагестана. Каталог жилых комплексов в Махачкале, Каспийске и Дербенте. Индивидуальный подбор квартиры с ЦНД.",
  applicationName: "ЦНД",
  authors: [{ name: "ЦНД — Центр недвижимости Дагестана" }],
  creator: "ЦНД",
  publisher: "ЦНД",
  keywords: [
    "недвижимость Дагестана",
    "новостройки Махачкала",
    "квартиры Каспийск",
    "ЖК Дербент",
    "ЦНД",
    "купить квартиру Дагестан",
    "агентство недвижимости",
  ],
  icons: {
    icon: "/assets/logo.jpg",
    apple: "/assets/logo.jpg",
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description:
      "Каталог новостроек Дагестана: Махачкала, Каспийск, Дербент. Подбор квартиры и сопровождение сделки.",
    images: [
      {
        url: "/assets/property-09.jpg",
        width: 1200,
        height: 630,
        alt: "Жилые комплексы ЦНД в Дагестане",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description:
      "Каталог новостроек Дагестана. Подбор квартиры с ЦНД.",
    images: ["/assets/property-09.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "theme-color": "#193e35",
  },
};

function absoluteUrl(url: string) {
  if (!url) return SITE_URL;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const content = await getContent();

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    alternateName: "ЦНД",
    url: SITE_URL,
    logo: absoluteUrl(content.logo),
    image: `${SITE_URL}/assets/property-09.jpg`,
    telephone: content.contacts.phone,
    email: content.contacts.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "5-я линия Акушинского 25",
      addressLocality: "Махачкала",
      addressRegion: "Республика Дагестан",
      addressCountry: "RU",
    },
    areaServed: ["Махачкала", "Каспийск", "Дербент", "Дагестан"],
    sameAs: [content.contacts.telegram, content.contacts.instagram],
  };

  return (
    <html lang="ru" className={golos.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
