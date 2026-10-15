import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { buildManifest } from "./build-manifest.ts";

describe("buildManifest", () => {
  it("maps topic photos and skips legal pdf", () => {
    const root = mkdtempSync(path.join(tmpdir(), "tg-enrich-"));
    mkdirSync(path.join(root, "photos"), { recursive: true });
    writeFileSync(
      path.join(root, "result.json"),
      JSON.stringify({
        name: "ЦНД",
        messages: [
          {
            id: 2,
            type: "service",
            action: "topic_created",
            title: "СК ЖБИ",
            date: "2026-09-09T00:00:00",
          },
          {
            id: 10,
            type: "message",
            reply_to_message_id: 2,
            photo: "photos/a.jpg",
            date: "2026-09-09T01:00:00",
            text: "",
          },
          {
            id: 11,
            type: "message",
            reply_to_message_id: 2,
            file: "files/Разрешение_на_строительство_x.pdf",
            file_name: "Разрешение_на_строительство_x.pdf",
            mime_type: "application/pdf",
            date: "2026-09-09T01:01:00",
            text: "",
          },
          {
            id: 12,
            type: "message",
            reply_to_message_id: 2,
            file: "files/ЖК МЕЧТА презентация .pdf",
            file_name: "ЖК МЕЧТА презентация .pdf",
            mime_type: "application/pdf",
            date: "2026-09-09T01:02:00",
            text: "",
          },
        ],
      }),
    );

    const manifest = buildManifest(root);
    const product = manifest.products.find((p) => p.productName === "ЖК Мечта");
    assert.ok(product);
    assert.equal(product.photos.length, 1);
    assert.equal(product.photos[0].action, "gallery");
    assert.equal(
      product.pdfs
        .find((pdf) => pdf.action === "projectPdf")
        ?.relativePath.includes("презентац"),
      true,
    );
    assert.ok(product.pdfs.some((pdf) => pdf.action === "skip"));
    assert.equal(manifest.priceNote, "never modified");
  });

  it("skips entire message when text looks like agent commission copy", () => {
    const root = mkdtempSync(path.join(tmpdir(), "tg-enrich-"));
    mkdirSync(path.join(root, "photos"), { recursive: true });
    writeFileSync(
      path.join(root, "result.json"),
      JSON.stringify({
        messages: [
          {
            id: 2,
            type: "service",
            action: "topic_created",
            title: "СК ЖБИ",
          },
          {
            id: 20,
            type: "message",
            reply_to_message_id: 2,
            photo: "photos/commission.jpg",
            text: "Комиссия агенту 3% при сделке",
          },
        ],
      }),
    );

    const manifest = buildManifest(root);
    const photos = manifest.products.flatMap((p) => p.photos);
    assert.equal(photos.length, 0);
    assert.equal(
      photos.some((p) => p.relativePath.includes("commission")),
      false,
    );
  });
});
