import { createImageUrlBuilder } from "@sanity/image-url";
import { dataset, projectId } from "./env";

const builder = createImageUrlBuilder({ projectId, dataset });

export function urlForImage(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source);
}

export function imageUrl(
  source: Parameters<typeof builder.image>[0] | string | null | undefined,
  width = 1200,
): string {
  if (!source) return "";
  if (typeof source === "string") return source;
  return urlForImage(source).width(width).auto("format").url();
}
