import type { MediaClass } from "./types.ts";

const LEGAL_RE =
  /разрешен|зеленк|егрн|договор|уступк|выписк|дду|форм[аы]_/i;
const PRESENTATION_RE = /презентац|проектн(ое|ого)\s*предложен/i;

export function classifyFile(fileName: string, mimeType?: string): MediaClass {
  const lower = fileName.toLowerCase();
  const mime = (mimeType || "").toLowerCase();

  if (mime.includes("heic") || lower.endsWith(".heic")) return "heic";
  if (mime.startsWith("video/") || /\.(mp4|mov)$/i.test(lower)) return "video";
  if (mime === "application/pdf" || lower.endsWith(".pdf")) {
    if (LEGAL_RE.test(fileName)) return "legal_pdf";
    if (PRESENTATION_RE.test(fileName)) return "presentation_pdf";
    return "legal_pdf"; // unknown PDF → deny by default
  }
  if (mime.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(lower)) return "photo";
  return "other";
}
