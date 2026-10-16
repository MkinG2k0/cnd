import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { fetchSiteSettings } from "../src/lib/map-content";
import type { SiteSettings } from "../src/lib/types";
import { queryKeys } from "../src/query/keys";
import { prefetchSiteSettingsImages } from "../src/query/prefetch-images";

type SiteSettingsData = {
  settings: SiteSettings | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

export function useSiteSettings(): SiteSettingsData {
  const query = useQuery({
    queryKey: queryKeys.siteSettings,
    queryFn: fetchSiteSettings,
  });

  useEffect(() => {
    if (!query.data) return;
    prefetchSiteSettingsImages(query.data);
  }, [query.data]);

  return {
    settings: query.data ?? null,
    loading: query.isPending && !query.data,
    error: query.error,
    reload: async () => {
      await query.refetch();
    },
  };
}
