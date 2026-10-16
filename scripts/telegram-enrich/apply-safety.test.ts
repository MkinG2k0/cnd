import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProductPatch } from "./apply.ts";

describe("buildProductPatch", () => {
  it("never includes price", () => {
    const patch = buildProductPatch({
      gallery: [],
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: "image-cover" },
      },
      projectPdf: "/projects/x.pdf",
      detailHtml: "hi",
    });

    assert.equal("price" in patch, false);
    assert.deepEqual(Object.keys(patch).sort(), [
      "detailHtml",
      "gallery",
      "image",
      "projectPdf",
    ]);
  });
});
