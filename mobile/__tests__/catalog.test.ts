import { expect, test } from "@jest/globals";
import { filterProducts } from "../src/lib/catalog";
import type { Product } from "../src/lib/types";

const sample: Product[] = [
  {
    id: "1",
    sanityId: "1",
    name: "Каспий Резиденс",
    slug: "kaspiy",
    description: "У моря",
    detailHtml: "",
    price: 3000000,
    city: "Каспийск",
    imageUrl: "",
  },
  {
    id: "2",
    sanityId: "2",
    name: "Центр Махачкала",
    slug: "centr",
    description: "В центре",
    detailHtml: "",
    price: 5000000,
    city: "Махачкала",
    imageUrl: "",
  },
];

test("filters by city", () => {
  expect(
    filterProducts(sample, { city: "Каспийск", query: "", sort: "default" }),
  ).toHaveLength(1);
});

test("filters by query case-insensitively", () => {
  expect(
    filterProducts(sample, { city: "all", query: "центр", sort: "default" }),
  ).toEqual([sample[1]]);
});

test("sorts by price asc/desc", () => {
  const asc = filterProducts(sample, {
    city: "all",
    query: "",
    sort: "asc",
  });
  expect(asc.map((p) => p.slug)).toEqual(["kaspiy", "centr"]);
  const desc = filterProducts(sample, {
    city: "all",
    query: "",
    sort: "desc",
  });
  expect(desc.map((p) => p.slug)).toEqual(["centr", "kaspiy"]);
});
