import { spawnSync } from "node:child_process";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const tmp = path.join(root, ".capacitor-tmp");
const parked = [
  ["src/app/sitemap.ts", "sitemap.ts"],
  ["src/app/robots.ts", "robots.ts"],
];

async function parkSeoRoutes() {
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  for (const [from, name] of parked) {
    await rename(path.join(root, from), path.join(tmp, name));
  }
}

async function restoreSeoRoutes() {
  for (const [from, name] of parked) {
    await rename(path.join(tmp, name), path.join(root, from));
  }
  await rm(tmp, { recursive: true, force: true });
}

await parkSeoRoutes();
const result = spawnSync(
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
await restoreSeoRoutes();
process.exit(result.status ?? 1);
