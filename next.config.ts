import type { NextConfig } from "next";

const isCapacitor = process.env.NEXT_PUBLIC_CAPACITOR === "1";

const nextConfig: NextConfig = {
  ...(isCapacitor
    ? {
        output: "export" as const,
        images: {
          unoptimized: true,
          remotePatterns: [
            {
              protocol: "https",
              hostname: "cdn.sanity.io",
            },
          ],
        },
      }
    : {
        cacheComponents: true,
        partialPrefetching: true,
        images: {
          formats: ["image/avif", "image/webp"],
          deviceSizes: [640, 750, 828, 1080, 1200, 1920],
          imageSizes: [64, 96, 128, 256, 384],
          remotePatterns: [
            {
              protocol: "https",
              hostname: "cdn.sanity.io",
            },
          ],
        },
      }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
