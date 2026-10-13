import { useCallback, useEffect, useRef, useState } from "react";

import { fetchProducts } from "../src/lib/map-content";
import type { Product } from "../src/lib/types";

type CatalogData = {
  products: Product[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

export function useCatalogData(): CatalogData {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextProducts = await fetchProducts();
      if (mounted.current) {
        setProducts(nextProducts);
      }
    } catch (reason) {
      if (mounted.current) {
        setError(
          reason instanceof Error
            ? reason
            : new Error("Не удалось загрузить каталог"),
        );
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();

    return () => {
      mounted.current = false;
    };
  }, [reload]);

  return { products, loading, error, reload };
}
