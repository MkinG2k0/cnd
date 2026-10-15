import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plainToDetailHtml } from "./text.ts";

describe("plainToDetailHtml", () => {
  it("escapes HTML and converts newlines to br", () => {
    assert.equal(
      plainToDetailHtml("A <b>x</b>\nB"),
      "A &lt;b&gt;x&lt;/b&gt;<br>B",
    );
  });
});
