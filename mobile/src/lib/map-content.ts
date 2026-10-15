import {
  PRODUCT_BY_SLUG_QUERY,
  PRODUCTS_QUERY,
  SITE_SETTINGS_QUERY,
} from "../sanity/queries";
import type { Product, SiteSettings } from "./types";

type ProductDto = {
  _id: string;
  legacyId?: string | null;
  name: string;
  slug: string | null;
  description: string;
  detailHtml?: string | null;
  price: number;
  city: string;
  imageUrl?: string;
  image?: unknown;
  galleryUrls?: string[] | null;
  projectPdf?: string | null;
};

type SettingsDto = {
  quizIntro?: string | null;
  about?: string[] | null;
  founder?: {
    name?: string | null;
    role?: string | null;
    bio?: string | null;
    imageUrl?: string;
    image?: unknown;
  } | null;
  contacts?: Partial<SiteSettings["contacts"]> | null;
  quiz?:
    | {
        title?: string | null;
        options?: string[] | null;
        images?: unknown[] | null;
      }[]
    | null;
};

export function mapProduct(raw: ProductDto): Product {
  const slug = raw.slug?.trim();
  if (!slug) {
    throw new Error(`Product ${raw._id} missing slug`);
  }

  return {
    id: raw.legacyId || raw._id,
    sanityId: raw._id,
    name: raw.name,
    slug,
    description: raw.description || "",
    detailHtml: raw.detailHtml || "",
    price: raw.price,
    city: raw.city,
    imageUrl: raw.imageUrl || "",
    galleryUrls: raw.galleryUrls ?? [],
    projectPdf: raw.projectPdf || undefined,
  };
}

export function mapSiteSettings(raw: SettingsDto): SiteSettings {
  return {
    quizIntro: raw.quizIntro || "",
    about: raw.about ?? [],
    founder: {
      name: raw.founder?.name || "",
      role: raw.founder?.role || "",
      bio: raw.founder?.bio || "",
      imageUrl: raw.founder?.imageUrl || "",
    },
    contacts: {
      phone: raw.contacts?.phone || "",
      email: raw.contacts?.email || "",
      address: raw.contacts?.address || "",
      whatsapp: raw.contacts?.whatsapp || "",
      telegram: raw.contacts?.telegram || "",
      instagram: raw.contacts?.instagram || "",
    },
    quiz: (raw.quiz ?? []).map((question) => ({
      title: question.title || "",
      options: question.options ?? [],
      images: (question.images ?? []).filter(
        (image): image is string => typeof image === "string" && Boolean(image),
      ),
    })),
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const [{ getSanity }, { imageUrl }] = await Promise.all([
    import("../sanity/client"),
    import("../sanity/image"),
  ]);
  const rows = await getSanity().fetch<ProductDto[]>(PRODUCTS_QUERY);
  return (rows ?? [])
    .filter((row) => row.slug)
    .map((row) =>
      mapProduct({
        ...row,
        imageUrl: row.imageUrl ?? imageUrl(row.image as never, 1200),
      }),
    );
}

export async function fetchProductBySlug(
  slug: string,
): Promise<Product | null> {
  const [{ getSanity }, { imageUrl }] = await Promise.all([
    import("../sanity/client"),
    import("../sanity/image"),
  ]);
  const row = await getSanity().fetch<ProductDto | null>(
    PRODUCT_BY_SLUG_QUERY,
    { slug },
  );
  if (!row?.slug) return null;

  return mapProduct({
    ...row,
    imageUrl: row.imageUrl ?? imageUrl(row.image as never, 1200),
  });
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const [{ getSanity }, { imageUrl }] = await Promise.all([
    import("../sanity/client"),
    import("../sanity/image"),
  ]);
  const raw = await getSanity().fetch<SettingsDto | null>(SITE_SETTINGS_QUERY);
  if (!raw) {
    throw new Error("Sanity siteSettings not found");
  }

  return mapSiteSettings({
    ...raw,
    founder: raw.founder
      ? {
          ...raw.founder,
          imageUrl:
            raw.founder.imageUrl ?? imageUrl(raw.founder.image as never, 800),
        }
      : raw.founder,
    quiz: (raw.quiz ?? []).map((question) => ({
      ...question,
      images: (question.images ?? [])
        .map((image) =>
          typeof image === "string" ? image : imageUrl(image as never, 800),
        )
        .filter(Boolean),
    })),
  });
}
