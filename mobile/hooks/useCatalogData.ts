import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { fetchProducts } from "../src/lib/map-content";
import type { Product } from "../src/lib/types";
import { queryKeys } from "../src/query/keys";
import { prefetchProductImages } from "../src/query/prefetch-images";
import { seedProductQueries } from "../src/query/seed-products";

type CatalogData = {
  products: Product[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

export function useCatalogData(): CatalogData {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
  });

  useEffect(() => {
    if (!query.data) return;
    seedProductQueries(queryClient, query.data);
    prefetchProductImages(query.data);
  }, [query.data, queryClient]);

  return {
    products: query.data ?? [],
    loading: query.isPending && !query.data,
    error: query.error,
    reload: async () => {
      await query.refetch();
    },
  };
}
