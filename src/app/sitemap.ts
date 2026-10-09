import type { MetadataRoute } from "next";
import {
  SITE_URL,
  content,
  productPath,
} from "../lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

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
