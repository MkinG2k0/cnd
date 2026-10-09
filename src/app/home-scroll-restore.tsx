"use client";

import { useEffect } from "react";
import { consumeHomeScroll } from "../lib/home-scroll";

/** Restores catalog scroll when returning from a ЖК page. */
export function HomeScrollRestore() {
  useEffect(() => {
    const top = consumeHomeScroll();
    if (top == null) return;

    const apply = () => window.scrollTo({ top, behavior: "auto" });
    apply();
    const a = window.requestAnimationFrame(apply);
    const t = window.setTimeout(apply, 100);
    return () => {
      window.cancelAnimationFrame(a);
      window.clearTimeout(t);
    };
  }, []);

  return null;
}
