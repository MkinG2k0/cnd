import { client } from "../sanity/client";
import { imageUrl } from "../sanity/image";
import { PRODUCTS_QUERY, SITE_SETTINGS_QUERY } from "../sanity/queries";
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
  slug?: string;
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

type SanityProduct = {
  _id: string;
  legacyId?: string | null;
  name: string;
  slug?: string | null;
  description: string;
  detailHtml?: string | null;
  price: number;
  city: string;
  image?: unknown;
  projectPdf?: string | null;
};

type SanitySettings = {
  logo?: unknown;
  quizIntro?: string | null;
  teamDescription?: string | null;
  about?: string[] | null;
  founder?: {
    name?: string | null;
    role?: string | null;
    bio?: string | null;
    image?: unknown;
  } | null;
  team?:
    | {
        name?: string | null;
        role?: string | null;
        image?: unknown;
      }[]
    | null;
  contacts?: {
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    whatsapp?: string | null;
    telegram?: string | null;
    instagram?: string | null;
  } | null;
  quiz?:
    | {
        title?: string | null;
        options?: string[] | null;
        images?: unknown[] | null;
      }[]
    | null;
};

const fetchOptions = { next: { revalidate: 60 } };

export async function getContent(): Promise<SiteContent> {
  const [settings, products] = await Promise.all([
    client.fetch<SanitySettings | null>(SITE_SETTINGS_QUERY, {}, fetchOptions),
    client.fetch<SanityProduct[]>(PRODUCTS_QUERY, {}, fetchOptions),
  ]);

  if (!settings) {
    throw new Error("Sanity siteSettings not found. Run migration first.");
  }

  const mappedProducts: Product[] = (products ?? []).map((product) => ({
    id: product.legacyId || product._id,
    name: product.name,
    description: product.description,
    detailHtml: product.detailHtml || "",
    price: product.price,
    image: imageUrl(product.image as never, 1200),
    city: product.city,
    projectPdf: product.projectPdf || undefined,
    slug: product.slug || slugifyName(product.name),
  }));

  const seen = new Set<string>();
  for (const product of mappedProducts) {
    const slug = productSlug(product);
    if (seen.has(slug)) {
      throw new Error(`Duplicate product slug: ${slug}`);
    }
    seen.add(slug);
  }

  return {
    products: mappedProducts,
    about: settings.about ?? [],
    founder: {
      name: settings.founder?.name || "",
      role: settings.founder?.role || "",
      bio: settings.founder?.bio || "",
      image: imageUrl(settings.founder?.image as never, 800),
    },
    team: (settings.team ?? []).map((member) => ({
      name: member.name || "",
      role: member.role || "",
      image: imageUrl(member.image as never, 600),
    })),
    contacts: {
      phone: settings.contacts?.phone || "",
      email: settings.contacts?.email || "",
      address: settings.contacts?.address || "",
      whatsapp: settings.contacts?.whatsapp || "",
      telegram: settings.contacts?.telegram || "",
      instagram: settings.contacts?.instagram || "",
    },
    quiz: (settings.quiz ?? []).map((question) => ({
      title: question.title || "",
      options: question.options ?? [],
      images: (question.images ?? [])
        .map((img) => imageUrl(img as never, 800))
        .filter(Boolean),
    })),
    logo: imageUrl(settings.logo as never, 200),
    quizIntro: settings.quizIntro || "",
    teamDescription: settings.teamDescription || "",
  };
}

export function productSlug(product: Product) {
  return product.slug || slugifyName(product.name);
}

export function productPath(product: Product) {
  return `/zhk/${productSlug(product)}`;
}

export function getProductBySlug(products: Product[], slug: string) {
  return products.find((p) => productSlug(p) === slug) ?? null;
}

export function allProductSlugs(products: Product[]) {
  return products.map((p) => productSlug(p));
}

export function relatedProducts(products: Product[], product: Product, limit = 3) {
  return products
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
