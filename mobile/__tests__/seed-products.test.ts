import { describe, expect, test } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";

import type { Product } from "../src/lib/types";
import { queryKeys } from "../src/query/keys";
import { seedProductQueries } from "../src/query/seed-products";

const sample: Product[] = [
  {
    id: "1",
    sanityId: "p1",
    name: "ЖК А",
    slug: "a",
    description: "",
    detailHtml: "",
    price: 1,
    city: "Сочи",
    imageUrl: "https://cdn.sanity.io/a.jpg",
  },
  {
    id: "2",
    sanityId: "p2",
    name: "ЖК Б",
    slug: "b",
    description: "",
    detailHtml: "",
    price: 2,
    city: "Сочи",
    imageUrl: "https://cdn.sanity.io/b.jpg",
  },
];

describe("seedProductQueries", () => {
  test("writes each product under its slug query key", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity } },
    });

    seedProductQueries(client, sample);

    expect(client.getQueryData(queryKeys.product("a"))).toEqual(sample[0]);
    expect(client.getQueryData(queryKeys.product("b"))).toEqual(sample[1]);
  });
});
