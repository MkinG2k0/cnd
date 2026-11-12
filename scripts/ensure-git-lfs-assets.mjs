import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sample = path.join(root, "public", "projects", "moskovskiy.pdf");

async function isLfsPointer(filePath) {
  try {
    const head = await readFile(filePath, { encoding: "utf8" });
    return head.startsWith("version https://git-lfs.github.com/spec/v1");
  } catch {
    return false;
  }
}

if (!(await isLfsPointer(sample))) {
  process.exit(0);
}

console.warn("Git LFS pointer detected in public/projects — running git lfs pull");
const result = spawnSync("git", ["lfs", "pull", "--include=public/projects/**"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if ((result.status ?? 1) !== 0) {
  console.warn(
    "git lfs pull failed; PDF routes may serve pointer files until LFS is available",
  );
}
