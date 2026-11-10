export function isCapacitorShell(): boolean {
  return process.env.NEXT_PUBLIC_CAPACITOR === "1";
}

export function capacitorProductHash(slug: string): string {
  return `#zhk/${slug}`;
}

export function parseCapacitorProductSlug(hash: string): string | null {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!value.startsWith("zhk/")) return null;
  const slug = value.slice("zhk/".length).split(/[/?#]/)[0];
  return slug || null;
}
