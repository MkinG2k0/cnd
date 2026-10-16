import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveProductName, shouldSkipArcadaMessage } from "./topic-map.ts";

describe("resolveProductName", () => {
  it("maps Мечта topic", () => {
    assert.equal(resolveProductName("СК ЖБИ"), "ЖК Мечта");
  });
  it("returns null for excluded topics", () => {
    assert.equal(resolveProductName("Запросы"), null);
    assert.equal(resolveProductName("Жк притяжение - ск прайм"), null);
  });
});

describe("shouldSkipArcadaMessage", () => {
  it("skips Новая жизнь-only copy", () => {
    assert.equal(shouldSkipArcadaMessage("ЖК Новая жизнь — сдача 2027"), true);
  });
  it("keeps Золотые пески", () => {
    assert.equal(shouldSkipArcadaMessage("ЖК «Золотые пески» люкс у моря"), false);
  });
});
