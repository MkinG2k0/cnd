import AsyncStorage from "@react-native-async-storage/async-storage";

export const FAVORITES_KEY = "cnd.favorites.slugs";

export function normalizeSlugs(slugs: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of slugs) {
    const slug = raw.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

export function toggleSlug(slugs: string[], slug: string): string[] {
  const set = new Set(normalizeSlugs(slugs));
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return Array.from(set);
  if (set.has(normalizedSlug)) set.delete(normalizedSlug);
  else set.add(normalizedSlug);
  return Array.from(set);
}

export async function loadFavoriteSlugs(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return normalizeSlugs(parsed.map(String));
  } catch {
    return [];
  }
}

export async function saveFavoriteSlugs(slugs: string[]): Promise<void> {
  await AsyncStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(normalizeSlugs(slugs)),
  );
}
