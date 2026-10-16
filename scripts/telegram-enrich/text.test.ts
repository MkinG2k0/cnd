import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isInternalOnlyMessage, plainToDetailHtml } from "./text.ts";

describe("isInternalOnlyMessage", () => {
  it("flags commission copy", () => {
    assert.equal(isInternalOnlyMessage("Комиссия агенту 3%"), true);
  });

  it("flags lead request and offer templates", () => {
    assert.equal(isInternalOnlyMessage("🔎 ЗАПРОС\nБюджет: до 8 млн"), true);
    assert.equal(
      isInternalOnlyMessage("ЗАПРОС\nРайон: центр\nБюджет: 7 млн"),
      true,
    );
    assert.equal(
      isInternalOnlyMessage("🏗 ПРЕДЛОЖЕНИЕ\nЖК Мечта, 2к"),
      true,
    );
    assert.equal(
      isInternalOnlyMessage("ПРЕДЛОЖЕНИЕ\nБюджет: до 12 млн ₽"),
      true,
    );
  });

  it("allows normal marketing copy", () => {
    assert.equal(
      isInternalOnlyMessage("Уникальное предложение у моря — скидка 5%"),
      false,
    );
    assert.equal(isInternalOnlyMessage("Лобби и двор-парк"), false);
  });
});

describe("plainToDetailHtml", () => {
  it("escapes HTML and converts newlines to br", () => {
    assert.equal(
      plainToDetailHtml("A <b>x</b>\nB"),
      "A &lt;b&gt;x&lt;/b&gt;<br>B",
    );
  });
});
