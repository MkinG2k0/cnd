import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildManifest } from "./build-manifest.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type CliArgs = {
  exportPath: string;
  dryRun: boolean;
  replaceCover: boolean;
  onlyProductName?: string;
};

export function validateArgs(argv: string[]): CliArgs {
  const exportIdx = argv.indexOf("--export");
  if (
    exportIdx === -1 ||
    !argv[exportIdx + 1] ||
    argv[exportIdx + 1].startsWith("--")
  ) {
    throw new Error(
      "Usage: --export <ChatExportDir> [--dry-run|--apply] [--only Name] [--replace-cover]",
    );
  }

  const onlyIdx = argv.indexOf("--only");
  const onlyProductName = onlyIdx >= 0 ? argv[onlyIdx + 1] : undefined;
  if (onlyIdx >= 0 && (!onlyProductName || onlyProductName.startsWith("--"))) {
    throw new Error("--only requires a product name");
  }

  return {
    exportPath: argv[exportIdx + 1],
    dryRun: argv.includes("--dry-run") || !argv.includes("--apply"),
    replaceCover: argv.includes("--replace-cover"),
    onlyProductName,
  };
}

export async function runCli(argv: string[]) {
  const { exportPath, dryRun, replaceCover, onlyProductName } =
    validateArgs(argv);

  const manifest = buildManifest(exportPath, { onlyProductName, replaceCover });
  const out = path.resolve(__dirname, "last-manifest.json");
  writeFileSync(out, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Wrote ${out} (${manifest.products.length} products)`);

  if (dryRun) {
    console.log("Dry-run only. Pass --apply to upload/patch.");
    return;
  }

  const { applyManifest } = await import("./apply.ts");
  await applyManifest(exportPath, manifest, { replaceCover });
}
