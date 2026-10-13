import { createClient, type SanityClient } from "@sanity/client";
import { apiVersion, assertSanityEnv, dataset, projectId } from "./env";

let client: SanityClient | null = null;

export function getSanity(): SanityClient {
  if (!client) {
    assertSanityEnv();
    client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
    });
  }

  return client;
}
