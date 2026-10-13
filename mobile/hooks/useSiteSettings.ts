import { useCallback, useEffect, useRef, useState } from "react";

import { fetchSiteSettings } from "../src/lib/map-content";
import type { SiteSettings } from "../src/lib/types";

type SiteSettingsData = {
  settings: SiteSettings | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

export function useSiteSettings(): SiteSettingsData {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextSettings = await fetchSiteSettings();
      if (mounted.current) {
        setSettings(nextSettings);
      }
    } catch (reason) {
      if (mounted.current) {
        setError(
          reason instanceof Error
            ? reason
            : new Error("Не удалось загрузить настройки"),
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

  return { settings, loading, error, reload };
}
