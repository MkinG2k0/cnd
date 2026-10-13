import { describe, expect, test } from "@jest/globals";

declare const __dirname: string;
declare function require(name: string): any;

const { readFileSync } = require("fs");
const { join } = require("path");

const root = join(__dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("navigation shell", () => {
  test("registers the three Russian tabs", () => {
    const layout = read("app/(tabs)/_layout.tsx");

    expect(layout).toContain('name="index"');
    expect(layout).toContain("Каталог");
    expect(layout).toContain('name="favorites"');
    expect(layout).toContain("Избранное");
    expect(layout).toContain('name="contacts"');
    expect(layout).toContain("Контакты");
  });

  test("provides favorites and registers product and quiz screens", () => {
    const layout = read("app/_layout.tsx");

    expect(layout).toContain("<FavoritesProvider>");
    expect(layout).toContain('name="zhk/[slug]"');
    expect(layout).toContain('name="quiz"');
    expect(layout).toContain("presentation: 'modal'");
  });

  test("shared product UI implements the required contracts", () => {
    const favoriteButton = read("src/components/FavoriteButton.tsx");
    const productCard = read("src/components/ProductCard.tsx");

    expect(favoriteButton).toContain("toggle(slug)");
    expect(favoriteButton).toContain("В избранное");
    expect(favoriteButton).toContain("Убрать из избранного");
    expect(productCard).toContain("money(price)");
    expect(productCard).toContain("pathname: \"/zhk/[slug]\"");
  });
});
