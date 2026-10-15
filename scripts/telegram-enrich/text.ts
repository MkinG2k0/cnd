import allowlist from "./text-allowlist.json" with { type: "json" };
import type { ManifestTextStrategy } from "./types.ts";

type TextRule = {
  productName: string;
  strategy: ManifestTextStrategy;
};

export function plainToDetailHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r\n|\r|\n/g, "<br>");
}

export function getTextRule(messageId: number): TextRule | null {
  const rule = (allowlist as Record<string, TextRule>)[String(messageId)];
  return rule ?? null;
}

export function messageText(msg: { text?: unknown }): string {
  if (typeof msg.text === "string") return msg.text;
  if (Array.isArray(msg.text)) {
    return msg.text
      .map((part) =>
        typeof part === "string" ? part : (part as { text?: string }).text || "",
      )
      .join("");
  }
  return "";
}
