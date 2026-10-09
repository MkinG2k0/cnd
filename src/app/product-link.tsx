"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { rememberHomeScroll } from "../lib/home-scroll";

/** Link to a ЖК page that remembers the home scroll position for return. */
export function ProductLink({
  onClick,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        rememberHomeScroll();
        onClick?.(e);
      }}
    />
  );
}
