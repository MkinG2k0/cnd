import projectPdfs from "../../content/project-pdfs.json";
import site from "../../content/site.json";
import { formatPropertyDetail } from "./format-detail";

export { formatPropertyDetail };

export type Product = {
  id: string;
  name: string;
  description: string;
  detailHtml: string;
  price: number;
  image: string;
  city: string;
  projectPdf?: string;
};

export type QuizQuestion = {
  title: string;
  options: string[];
  images?: string[];
};

export type SiteContent = {
  products: Product[];
  about: string[];
  founder: {
    name: string;
    role: string;
    bio: string;
    image: string;
  };
  team: { name: string; role: string; image: string }[];
  contacts: {
    phone: string;
    email: string;
    address: string;
    whatsapp: string;
    telegram: string;
    instagram: string;
  };
  quiz: QuizQuestion[];
  logo: string;
  quizIntro: string;
  teamDescription: string;
};

const pdfByName = projectPdfs.byName as Record<string, string>;

export const content = {
  ...(site as SiteContent),
  products: (site as SiteContent).products.map((product) => ({
    ...product,
    projectPdf: pdfByName[product.name],
  })),
} satisfies SiteContent;

export const SITE_URL = "https://cnd05.ru";
export const SITE_NAME = "ЦНД — Недвижимость Дагестана";

const CYR_TO_LAT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function slugifyName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .split("")
    .map((ch) => CYR_TO_LAT[ch] ?? ch)
    .join("")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function productSlug(product: Product) {
  return slugifyName(product.name);
}

export function productPath(product: Product) {
  return `/zhk/${productSlug(product)}`;
}

export function getProductBySlug(slug: string) {
  return content.products.find((p) => productSlug(p) === slug) ?? null;
}

export function allProductSlugs() {
  return content.products.map((p) => productSlug(p));
}

export function relatedProducts(product: Product, limit = 3) {
  return content.products
    .filter((p) => p.id !== product.id && p.city === product.city)
    .slice(0, limit);
}

export function money(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function cityCounts(products: Product[]) {
  const cities = ["Махачкала", "Каспийск", "Дербент"] as const;
  return cities.map((city) => ({
    city,
    count: products.filter((p) => p.city === city).length,
  }));
}

export function whatsappURL(base: string, message: string) {
  const link = new URL(base);
  link.searchParams.set("text", message);
  return link.href;
}

export function isCustomOption(value: string) {
  return /^(Свой|Ваш) вариант$/.test(value);
}

export function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function productDescription(product: Product, max = 160) {
  const text = product.description || stripHtml(product.detailHtml);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

// Ensure slugs stay unique at build time
(() => {
  const seen = new Set<string>();
  for (const product of content.products) {
    const slug = productSlug(product);
    if (seen.has(slug)) {
      throw new Error(`Duplicate product slug: ${slug}`);
    }
    seen.add(slug);
  }
})();
