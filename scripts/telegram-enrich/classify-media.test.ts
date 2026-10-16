import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyFile } from "./classify-media.ts";

describe("classifyFile", () => {
  it("allows presentation pdf", () => {
    assert.equal(
      classifyFile("Презентация_Новый_горизонт_1_и_16_блок.pdf", "application/pdf"),
      "presentation_pdf",
    );
  });
  it("denies legal pdf", () => {
    assert.equal(
      classifyFile("Разрешение_на_строительство_Новый_Горизонт_.pdf", "application/pdf"),
      "legal_pdf",
    );
    assert.equal(classifyFile("Выписка_из_ЕГРН....pdf", "application/pdf"), "legal_pdf");
  });
  it("marks heic and video", () => {
    assert.equal(classifyFile("IMG_3512.HEIC", "image/heic"), "heic");
    assert.equal(classifyFile("video_1.mp4", "video/mp4"), "video");
  });
  it("treats jpg as photo", () => {
    assert.equal(classifyFile("photo_1.jpg"), "photo");
  });
  it("default-denies unknown pdf names as legal_pdf", () => {
    assert.equal(classifyFile("random.pdf", "application/pdf"), "legal_pdf");
  });
});
