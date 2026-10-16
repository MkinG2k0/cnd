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

/** Agent-internal copy (commissions, lead request/offer templates) — skip whole message. */
export function isInternalOnlyMessage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (lower.includes("комисси")) return true;

  if (/🔎\s*запрос/i.test(trimmed)) return true;

  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() ?? "";
  if (/^запрос\s*$/i.test(firstLine) || /^запрос\s*[\n\r]/i.test(trimmed)) {
    return hasLeadBudgetFields(trimmed);
  }

  if (/🏗\s*предложение/i.test(trimmed)) return true;

  if (/^предложение\s*$/i.test(firstLine) && hasLeadBudgetFields(trimmed)) {
    return true;
  }
  if (/^предложение\s*[\n\r]/i.test(trimmed) && hasLeadBudgetFields(trimmed)) {
    return true;
  }

  return false;
}

function hasLeadBudgetFields(text: string): boolean {
  return /(?:^|\n)\s*(?:бюджет\s*:?|до\s+\d[\d\s]*(?:₽|руб|млн))/im.test(text);
}
