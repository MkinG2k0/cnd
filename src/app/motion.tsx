"use client";

import { useEffect } from "react";

export function MotionRoot() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    function enable() {
      if (reduce.matches) {
        root.classList.remove("js-motion");
        return;
      }
      root.classList.add("js-motion");
    }

    enable();
    reduce.addEventListener("change", enable);

    const nodes = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-inview");
          io.unobserve(entry.target);
          nodes.delete(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    function observeAll() {
      document.querySelectorAll(".reveal:not(.is-inview)").forEach((el) => {
        if (nodes.has(el)) return;
        nodes.add(el);
        io.observe(el);
      });
    }

    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      reduce.removeEventListener("change", enable);
      io.disconnect();
      mo.disconnect();
      root.classList.remove("js-motion");
    };
  }, []);

  return null;
}
