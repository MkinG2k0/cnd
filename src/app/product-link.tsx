"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import {
  capacitorProductHash,
  isCapacitorShell,
} from "../lib/capacitor";
import { rememberHomeScroll } from "../lib/home-scroll";

/** Link to a ЖК page that remembers the home scroll position for return. */
export function ProductLink({
  href,
  onClick,
  ...props
}: ComponentProps<typeof Link>) {
  const capacitor = isCapacitorShell();
  const path = typeof href === "string" ? href : null;
  const slug =
    path && path.startsWith("/zhk/") ? path.slice("/zhk/".length) : null;

  if (capacitor && slug) {
    return (
      <a
        {...props}
        href={capacitorProductHash(slug)}
        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
          rememberHomeScroll();
          onClick?.(e as never);
        }}
      />
    );
  }

  return (
    <Link
      {...props}
      href={href}
      onClick={(e) => {
        rememberHomeScroll();
        onClick?.(e);
      }}
    />
  );
}
