import { Image } from "expo-image";

import type { Product, SiteSettings } from "../lib/types";

function uniqueUrls(urls: Array<string | undefined | null>): string[] {
  return [...new Set(urls.filter((url): url is string => Boolean(url?.trim())))];
}

export function prefetchProductImages(products: Product[]) {
  const urls = uniqueUrls(products.map((product) => product.imageUrl));
  if (urls.length === 0) return;
  void Image.prefetch(urls);
}

export function prefetchSiteSettingsImages(settings: SiteSettings) {
  const urls = uniqueUrls([
    settings.founder.imageUrl,
    ...settings.quiz.flatMap((question) => question.images),
  ]);
  if (urls.length === 0) return;
  void Image.prefetch(urls);
}
