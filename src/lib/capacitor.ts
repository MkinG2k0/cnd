export function isCapacitorShell(): boolean {
  return process.env.NEXT_PUBLIC_CAPACITOR === "1";
}

export function capacitorProductHash(slug: string): string {
  return `#zhk/${slug}`;
}

export function parseCapacitorProductSlug(hash: string): string | null {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!value.startsWith("zhk/")) return null;
  const slug = value.slice("zhk/".length).split(/[/?#]/)[0];
  return slug || null;
}

/** Site assets that ship in the APK stay relative; remote-only files need an absolute host. */
const DEFAULT_SITE_ASSET_ORIGIN = "https://cnd-kohl.vercel.app";
/** Real PDFs are in Git LFS; Vercel currently ships pointers, GitHub media serves the bytes. */
const DEFAULT_PDF_ASSET_ORIGIN =
  "https://media.githubusercontent.com/media/MkinG2k0/cnd/master/public";

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function withOrigin(origin: string, path: string): string {
  return `${origin.replace(/\/$/, "")}${normalizePath(path)}`;
}

export function siteAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!isCapacitorShell()) return normalizePath(path);
  const origin =
    process.env.NEXT_PUBLIC_SITE_ASSET_ORIGIN || DEFAULT_SITE_ASSET_ORIGIN;
  return withOrigin(origin, path);
}

export function projectPdfUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!isCapacitorShell()) return normalizePath(path);
  const origin =
    process.env.NEXT_PUBLIC_PDF_ASSET_ORIGIN || DEFAULT_PDF_ASSET_ORIGIN;
  return withOrigin(origin, path);
}

/** Open PDF in an in-browser viewer instead of triggering a file download. */
export function browserPdfViewerUrl(fileUrl: string): string {
  return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fileUrl)}`;
}
