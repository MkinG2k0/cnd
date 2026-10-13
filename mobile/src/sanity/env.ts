export const projectId = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.EXPO_PUBLIC_SANITY_DATASET ?? "";
export const apiVersion =
  process.env.EXPO_PUBLIC_SANITY_API_VERSION ?? "2026-10-11";

export function assertSanityEnv() {
  if (!projectId || !dataset) {
    throw new Error(
      "Missing EXPO_PUBLIC_SANITY_PROJECT_ID or EXPO_PUBLIC_SANITY_DATASET",
    );
  }
}
