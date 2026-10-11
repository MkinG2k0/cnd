import type { MetadataRoute } from "next";
import {
  SITE_URL,
  getContent,
  productPath,
} from "../lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const content = await getContent();

  const home: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const properties = content.products.map((product) => ({
    url: `${SITE_URL}${productPath(product)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...home, ...properties];
}
