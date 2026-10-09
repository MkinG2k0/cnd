"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
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

  return (
    <Link
      href="/#catalog"
      className={className}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.preventDefault();
        // Exact scroll is restored by HomeScrollRestore on the home page.
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
