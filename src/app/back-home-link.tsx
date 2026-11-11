"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { isCapacitorShell } from "../lib/capacitor";
import { cameFromHome } from "../lib/home-scroll";

export function BackHomeLink({
  className,
  children = "← На главную",
  "aria-label": ariaLabel,
}: {
  className?: string;
  children?: ReactNode;
  "aria-label"?: string;
}) {
  const router = useRouter();
  const capacitor = isCapacitorShell();

  if (capacitor) {
    return (
      <a
        href="#catalog"
        className={className}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.preventDefault();
          window.location.hash = "catalog";
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href="/#catalog"
      className={className}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.preventDefault();
        if (cameFromHome()) {
          router.push("/", { scroll: false });
        } else {
          router.push("/#catalog");
        }
      }}
    >
      {children}
    </Link>
  );
}
