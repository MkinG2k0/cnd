import type { Product } from "./types";

export type CityFilter = "all" | string;
export type SortMode = "default" | "asc" | "desc";

export function filterProducts(
  products: Product[],
  opts: { city: CityFilter; query: string; sort: SortMode },
): Product[] {
  const q = opts.query.trim().toLocaleLowerCase("ru");
  let list = products.filter(
    (p) =>
      (opts.city === "all" || p.city === opts.city) &&
      `${p.name} ${p.description}`.toLocaleLowerCase("ru").includes(q),
  );
  if (opts.sort !== "default") {
    list = [...list].sort((a, b) =>
      opts.sort === "asc" ? a.price - b.price : b.price - a.price,
    );
  }
  return list;
}

export const CITIES = ["Махачкала", "Каспийск", "Дербент"] as const;
