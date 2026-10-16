import { describe, expect, test } from "@jest/globals";

import { PERSIST_MAX_AGE, createAppQueryClient } from "../src/query/client";

describe("query client offline defaults", () => {
  test("keeps cache without time-based eviction", () => {
    expect(PERSIST_MAX_AGE).toBe(Number.MAX_SAFE_INTEGER);

    const client = createAppQueryClient();
    const defaults = client.getDefaultOptions().queries;

    expect(defaults?.gcTime).toBe(Infinity);
    expect(defaults?.staleTime).toBe(0);
    expect(defaults?.networkMode).toBe("offlineFirst");
  });
});
