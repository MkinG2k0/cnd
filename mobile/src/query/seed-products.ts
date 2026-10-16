import type { QueryClient } from "@tanstack/react-query";

import type { Product } from "../lib/types";
import { queryKeys } from "./keys";

/** Warm per-slug cache so product screens open offline after a catalog visit. */
export function seedProductQueries(
  queryClient: QueryClient,
  products: Product[],
) {
  for (const product of products) {
    queryClient.setQueryData(queryKeys.product(product.slug), product);
  }
}
