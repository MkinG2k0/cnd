import { createClient } from "@sanity/client";
import { apiVersion, dataset, projectId } from "../sanity/env";
import { PRODUCTS_QUERY, SITE_SETTINGS_QUERY } from "../sanity/queries";
import {
  mapSiteContent,
  type SanityProduct,
  type SanitySettings,
  type SiteContent,
} from "./content";

const browserClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});

export async function fetchSiteContent(): Promise<SiteContent> {
  const [settings, products] = await Promise.all([
    browserClient.fetch<SanitySettings | null>(SITE_SETTINGS_QUERY),
    browserClient.fetch<SanityProduct[]>(PRODUCTS_QUERY),
  ]);

  if (!settings) {
    throw new Error("Sanity siteSettings not found. Run migration first.");
  }

  return mapSiteContent(settings, products ?? []);
}
