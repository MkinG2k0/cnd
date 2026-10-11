import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, getContent } from "../lib/content";
import { Home } from "./home";

export const metadata: Metadata = {
  title: {
    absolute: SITE_NAME,
  },
  description:
    "ЦНД — недвижимость Дагестана. 18 жилых комплексов в Махачкале, Каспийске и Дербенте. Подбор квартиры по вопросам и сопровождение сделки.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: SITE_NAME,
    description:
      "Каталог новостроек Дагестана. Выберите ЖК и оставьте заявку в WhatsApp.",
    url: SITE_URL,
  },
};

export default async function HomePage() {
  const content = await getContent();
  return <Home content={content} />;
}
