import type { Metadata } from "next";
import meta from "../../content/tilda-meta.json";

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  icons: {
    icon: meta.favicon,
  },
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: "https://cnd05.ru",
    type: "website",
    images: [{ url: meta.ogImage }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
