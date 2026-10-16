export const queryKeys = {
  products: ["products"] as const,
  product: (slug: string) => ["product", slug] as const,
  siteSettings: ["siteSettings"] as const,
};
