"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";
import { parseCapacitorProductSlug } from "../lib/capacitor";
import {
  getProductBySlug,
  type SiteContent,
} from "../lib/content";
import { fetchSiteContent } from "../lib/fetch-site-content";
import { Home } from "./home";
import { PropertyDetailView } from "./property-detail-view";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; content: SiteContent };

function readSlug(): string | null {
  if (typeof window === "undefined") return null;
  return parseCapacitorProductSlug(window.location.hash);
}

export function CapacitorShell() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchSiteContent()
      .then((content) => {
        if (!cancelled) setState({ status: "ready", content });
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Не удалось загрузить каталог";
        if (!cancelled) setState({ status: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sync = () => setSlug(readSlug());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: { remove: () => Promise<void> } | undefined;
    void App.addListener("backButton", ({ canGoBack }) => {
      if (readSlug()) {
        window.location.hash = "catalog";
        return;
      }
      if (!canGoBack) {
        void App.exitApp();
      }
    }).then((listener) => {
      handle = listener;
    });
    return () => {
      void handle?.remove();
    };
  }, []);

  if (state.status === "loading") {
    return (
      <main className="wrap" style={{ padding: "48px 0" }}>
        <p>Загрузка каталога…</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="wrap" style={{ padding: "48px 0" }}>
        <p>{state.message}</p>
        <button
          type="button"
          className="button"
          onClick={() => window.location.reload()}
        >
          Повторить
        </button>
      </main>
    );
  }

  const { content } = state;
  if (slug) {
    const product = getProductBySlug(content.products, slug);
    if (!product) {
      return (
        <main className="wrap" style={{ padding: "48px 0" }}>
          <p>Объект не найден</p>
          <a className="button" href="#catalog">
            К каталогу
          </a>
        </main>
      );
    }
    return <PropertyDetailView content={content} product={product} />;
  }

  return <Home content={content} />;
}
