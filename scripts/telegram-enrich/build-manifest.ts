import { readFileSync } from "node:fs";
import path from "node:path";
import { classifyFile } from "./classify-media.ts";
import { slugifyName } from "./slug.ts";
import { getTextRule, isInternalOnlyMessage, messageText } from "./text.ts";
import {
  resolveProductName,
  shouldSkipArcadaMessage,
} from "./topic-map.ts";
import type { EnrichManifest, ManifestProduct } from "./types.ts";

type ExportMessage = {
  id?: unknown;
  type?: unknown;
  action?: unknown;
  title?: unknown;
  reply_to_message_id?: unknown;
  photo?: unknown;
  file?: unknown;
  file_name?: unknown;
  mime_type?: unknown;
  text?: unknown;
};

type TelegramExport = {
  messages?: unknown;
};

type Topic = {
  id: number;
  title: string;
};

type BuildManifestOptions = {
  onlyProductName?: string;
  replaceCover?: boolean;
};

function numberId(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function buildManifest(
  exportRoot: string,
  options: BuildManifestOptions = {},
): EnrichManifest {
  const resolvedExportRoot = path.resolve(exportRoot);
  const parsed = JSON.parse(
    readFileSync(path.join(resolvedExportRoot, "result.json"), "utf8"),
  ) as TelegramExport;
  const messages = Array.isArray(parsed.messages)
    ? (parsed.messages as ExportMessage[])
    : [];

  const topics = new Map<number, Topic>();
  const messagesById = new Map<number, ExportMessage>();

  for (const message of messages) {
    const id = numberId(message.id);
    if (id === null) continue;
    messagesById.set(id, message);

    if (
      message.type === "service" &&
      message.action === "topic_created" &&
      typeof message.title === "string"
    ) {
      topics.set(id, { id, title: message.title });
    }
  }

  const products = new Map<string, ManifestProduct>();

  for (const message of messages) {
    if (message.type !== "message") continue;

    const messageId = numberId(message.id);
    const replyId = numberId(message.reply_to_message_id);
    if (messageId === null || replyId === null) continue;

    let topic = topics.get(replyId);
    if (!topic) {
      const parentReplyId = numberId(messagesById.get(replyId)?.reply_to_message_id);
      if (parentReplyId !== null) topic = topics.get(parentReplyId);
    }
    if (!topic) continue;

    const productName = resolveProductName(topic.title);
    if (
      !productName ||
      (options.onlyProductName && productName !== options.onlyProductName)
    ) {
      continue;
    }

    const text = messageText(message);
    if (isInternalOnlyMessage(text)) {
      continue;
    }
    if (
      productName === "ЖК Золотые Пески" &&
      shouldSkipArcadaMessage(text)
    ) {
      continue;
    }

    let product = products.get(productName);
    if (!product) {
      product = {
        productName,
        topicId: topic.id,
        topicTitle: topic.title,
        photos: [],
        pdfs: [],
        texts: [],
        videos: [],
      };
      products.set(productName, product);
    }

    const photoPath = stringValue(message.photo);
    if (photoPath) {
      const hasUsablePhoto = product.photos.some(
        (photo) => photo.action !== "skip",
      );
      product.photos.push({
        messageId,
        relativePath: photoPath,
        action:
          options.replaceCover && !hasUsablePhoto ? "cover" : "gallery",
      });
    }

    const filePath = stringValue(message.file);
    if (filePath) {
      const fileName = stringValue(message.file_name) ?? filePath;
      const mimeType = stringValue(message.mime_type) ?? undefined;
      const mediaClass = classifyFile(fileName, mimeType);

      if (mediaClass === "photo") {
        const hasUsablePhoto = product.photos.some(
          (photo) => photo.action !== "skip",
        );
        product.photos.push({
          messageId,
          relativePath: filePath,
          action:
            options.replaceCover && !hasUsablePhoto ? "cover" : "gallery",
        });
      } else if (mediaClass === "heic") {
        product.photos.push({
          messageId,
          relativePath: filePath,
          action: "skip",
          reason: "heic",
        });
      } else if (mediaClass === "video") {
        product.videos.push({
          messageId,
          relativePath: filePath,
          action: "deferred",
        });
      } else if (
        mediaClass === "presentation_pdf" ||
        mediaClass === "legal_pdf"
      ) {
        product.pdfs.push(
          mediaClass === "presentation_pdf"
            ? {
                messageId,
                relativePath: filePath,
                action: "projectPdf",
                publicPath: `/projects/${slugifyName(productName)}.pdf`,
              }
            : {
                messageId,
                relativePath: filePath,
                action: "skip",
                reason: "legal-or-unknown-pdf",
              },
        );
      }
    }

    const textRule = getTextRule(messageId);
    if (textRule?.productName === productName) {
      product.texts.push({
        messageId,
        strategy: textRule.strategy,
        preview: text,
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    exportPath: resolvedExportRoot,
    products: [...products.values()],
    priceNote: "never modified",
  };
}
