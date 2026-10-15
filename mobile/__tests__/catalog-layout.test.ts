import { describe, expect, test } from "@jest/globals";

import {
  catalogCellWidth,
  catalogNumColumns,
} from "../src/lib/catalog-layout";

describe("catalog layout", () => {
  test("uses one column on phones", () => {
    expect(catalogNumColumns(390)).toBe(1);
    expect(catalogNumColumns(699)).toBe(1);
  });

  test("uses two columns on tablets", () => {
    expect(catalogNumColumns(700)).toBe(2);
    expect(catalogNumColumns(900)).toBe(2);
  });

  test("uses three columns on large screens", () => {
    expect(catalogNumColumns(1100)).toBe(3);
  });

  test("keeps equal cell widths for multi-column rows", () => {
    expect(catalogCellWidth(800, 2, { gap: 16, horizontalPadding: 32 })).toBe(
      376,
    );
    expect(catalogCellWidth(390, 1)).toBeUndefined();
  });
});
