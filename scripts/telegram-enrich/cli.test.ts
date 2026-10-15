import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateArgs } from "./cli.ts";

describe("validateArgs", () => {
  it("rejects --only without a value", () => {
    assert.throws(
      () => validateArgs(["--export", "export", "--only"]),
      /--only requires a product name/,
    );
  });

  it("rejects --only followed by another flag", () => {
    assert.throws(
      () => validateArgs(["--export", "export", "--only", "--apply"]),
      /--only requires a product name/,
    );
  });
});
