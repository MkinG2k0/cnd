import type { EnrichManifest } from "./types.ts";

export async function applyManifest(
  _exportPath: string,
  _manifest: EnrichManifest,
  _options: { replaceCover?: boolean } = {},
): Promise<void> {
  throw new Error("Task 7: apply not implemented yet");
}
