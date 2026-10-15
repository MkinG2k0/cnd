/** Breakpoints aligned with web `.properties` grid (560 / 800). */
export function catalogNumColumns(windowWidth: number): 1 | 2 | 3 {
  if (windowWidth >= 1100) return 3;
  if (windowWidth >= 700) return 2;
  return 1;
}

export function catalogCellWidth(
  windowWidth: number,
  numColumns: number,
  options: { gap?: number; horizontalPadding?: number } = {},
): number | undefined {
  if (numColumns <= 1) return undefined;
  const gap = options.gap ?? 16;
  const horizontalPadding = options.horizontalPadding ?? 32;
  const inner = windowWidth - horizontalPadding - gap * (numColumns - 1);
  return Math.floor(inner / numColumns);
}
