import { spawnSync } from "node:child_process";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const tmp = path.join(root, ".capacitor-tmp");
const parked = [
  ["src/app/sitemap.ts", "sitemap.ts"],
  ["src/app/robots.ts", "robots.ts"],
  // Large local PDFs — open from CDN/Sanity URLs, do not ship inside the APK.
  ["public/projects", "projects"],
];

async function parkBuildExtras() {
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  for (const [from, name] of parked) {
    const abs = path.join(root, from);
    try {
      await rename(abs, path.join(tmp, name));
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }
  }
}

async function restoreBuildExtras() {
  for (const [from, name] of parked) {
    const parkedPath = path.join(tmp, name);
    try {
      await rename(parkedPath, path.join(root, from));
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }
  }
  await rm(tmp, { recursive: true, force: true });
}

await parkBuildExtras();
let result = spawnSync(
  "npx",
  ["next", "build"],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_CAPACITOR: "1",
    },
    shell: process.platform === "win32",
  },
);

// Next may exit non-zero after a successful export due to a security nudge.
// Retry once, then accept a complete `out/index.html` as success.
const { access } = await import("node:fs/promises");
async function exportReady() {
  try {
    await access(path.join(root, "out", "index.html"));
    return true;
  } catch {
    return false;
  }
}

if ((result.status ?? 1) !== 0 && !(await exportReady())) {
  result = spawnSync(
    "npx",
    ["next", "build"],
    {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_PUBLIC_CAPACITOR: "1",
      },
      shell: process.platform === "win32",
    },
  );
}

await restoreBuildExtras();
if ((result.status ?? 1) !== 0 && (await exportReady())) {
  console.warn(
    "next build exited non-zero, but out/index.html exists — continuing Capacitor sync",
  );
  process.exit(0);
}
process.exit(result.status ?? 1);
