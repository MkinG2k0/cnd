import { expect, test } from "@jest/globals";
import { normalizeSlugs, toggleSlug } from "../src/lib/favorites-store";

test("normalizeSlugs dedupes and drops empties", () => {
  expect(normalizeSlugs(["a", "", "a", "b"])).toEqual(["a", "b"]);
});

test("toggleSlug adds and removes", () => {
  expect(toggleSlug([], "x")).toEqual(["x"]);
  expect(toggleSlug(["x", "y"], "x")).toEqual(["y"]);
});
