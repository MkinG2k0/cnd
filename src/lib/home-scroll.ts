const SCROLL_KEY = "cnd-home-scroll";
const FLAG_KEY = "cnd-from-home";

export function rememberHomeScroll() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  sessionStorage.setItem(FLAG_KEY, "1");
}

export function consumeHomeScroll(): number | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SCROLL_KEY);
  sessionStorage.removeItem(SCROLL_KEY);
  sessionStorage.removeItem(FLAG_KEY);
  if (raw == null) return null;
  const top = Number(raw);
  return Number.isFinite(top) ? top : null;
}

export function cameFromHome(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(FLAG_KEY) === "1";
}
