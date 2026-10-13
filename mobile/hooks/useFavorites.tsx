import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadFavoriteSlugs,
  saveFavoriteSlugs,
  toggleSlug,
} from "../src/lib/favorites-store";

type FavoritesContextValue = {
  slugs: string[];
  ready: boolean;
  isFavorite: (slug: string) => boolean;
  toggle: (slug: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadFavoriteSlugs().then((value) => {
      if (!alive) return;
      setSlugs(value);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback((slug: string) => {
    setSlugs((prev) => {
      const next = toggleSlug(prev, slug);
      void saveFavoriteSlugs(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      slugs,
      ready,
      isFavorite: (slug: string) => slugs.includes(slug),
      toggle,
    }),
    [slugs, ready, toggle],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
