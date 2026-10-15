import { createReadStream, copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCliClient } from "sanity/cli";
import { plainToDetailHtml } from "./text.ts";
import type { EnrichManifest } from "./types.ts";

type ImageValue = {
  _type: "image";
  _key?: string;
  asset: { _type: "reference"; _ref: string };
};

type ProductPatchInput = {
  gallery?: ImageValue[];
  image?: ImageValue;
  projectPdf?: string;
  detailHtml?: string;
};

type ExistingGalleryImage = {
  _key?: string;
  _type?: "image";
  asset?: { _type: "reference"; _ref: string };
  originalFilename?: string;
  [key: string]: unknown;
};

type ExistingProduct = {
  _id: string;
  gallery?: ExistingGalleryImage[];
  detailHtml?: string;
};

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export function buildProductPatch(input: ProductPatchInput): ProductPatchInput {
  return {
    ...(input.gallery !== undefined ? { gallery: input.gallery } : {}),
    ...(input.image !== undefined ? { image: input.image } : {}),
    ...(input.projectPdf !== undefined
      ? { projectPdf: input.projectPdf }
      : {}),
    ...(input.detailHtml !== undefined
      ? { detailHtml: input.detailHtml }
      : {}),
  };
}

function exportFile(exportRoot: string, relativePath: string): string {
  const root = path.resolve(exportRoot);
  const file = path.resolve(root, relativePath);
  const relative = path.relative(root, file);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Export file is outside export root: ${relativePath}`);
  }
  return file;
}

export async function applyManifest(
  exportRoot: string,
  manifest: EnrichManifest,
  options: { replaceCover?: boolean } = {},
): Promise<void> {
  const client = getCliClient({ apiVersion: "2026-10-11" });
  let updatedProducts = 0;
  let uploadedImages = 0;
  let copiedPdfs = 0;

  for (const product of manifest.products) {
    const existing = await client.fetch<ExistingProduct | null>(
      `*[_type == "product" && name == $name][0]{
        _id,
        detailHtml,
        gallery[]{
          ...,
          "originalFilename": asset->originalFilename
        }
      }`,
      { name: product.productName },
    );
    if (!existing) {
      throw new Error(`Sanity product not found: ${product.productName}`);
    }

    const existingGallery = existing.gallery ?? [];
    const gallery: ImageValue[] = existingGallery
      .filter(
        (
          image,
        ): image is ExistingGalleryImage & {
          _type: "image";
          asset: { _type: "reference"; _ref: string };
        } => Boolean(image.asset?._ref),
      )
      .map(({ originalFilename: _originalFilename, ...image }) => image);
    const knownKeys = new Set(
      existingGallery.flatMap((image) => image._key ?? []),
    );
    const knownFilenames = new Set(
      existingGallery.flatMap((image) => image.originalFilename ?? []),
    );
    let galleryChanged = false;
    let cover: ImageValue | undefined;

    for (const photo of product.photos) {
      if (photo.action === "skip") continue;

      const key = `tg-${photo.messageId}`;
      const filename = `tg-${photo.messageId}-${path.basename(photo.relativePath)}`;
      const existingImage = existingGallery.find(
        (image) => image._key === key || image.originalFilename === filename,
      );
      if (existingImage) {
        if (
          photo.action === "cover" &&
          options.replaceCover &&
          existingImage.asset
        ) {
          cover = { _type: "image", asset: existingImage.asset };
        }
        continue;
      }
      if (knownKeys.has(key) || knownFilenames.has(filename)) continue;

      const asset = await client.assets.upload(
        "image",
        createReadStream(exportFile(exportRoot, photo.relativePath)),
        { filename },
      );
      const image: ImageValue = {
        _type: "image",
        _key: key,
        asset: { _type: "reference", _ref: asset._id },
      };
      gallery.push(image);
      knownKeys.add(key);
      knownFilenames.add(filename);
      galleryChanged = true;
      uploadedImages += 1;

      if (photo.action === "cover" && options.replaceCover) {
        cover = { _type: "image", asset: image.asset };
      }
    }

    let projectPdf: string | undefined;
    for (const pdf of product.pdfs) {
      if (pdf.action !== "projectPdf") continue;
      const publicPath = pdf.publicPath;
      if (!publicPath) {
        throw new Error(`Missing publicPath for PDF message ${pdf.messageId}`);
      }
      const destination = path.join(
        PROJECT_ROOT,
        "public",
        publicPath.replace(/^[/\\]+/, ""),
      );
      mkdirSync(path.dirname(destination), { recursive: true });
      copyFileSync(exportFile(exportRoot, pdf.relativePath), destination);
      projectPdf = publicPath;
      copiedPdfs += 1;
    }

    let detailHtml = existing.detailHtml ?? "";
    let detailChanged = false;
    for (const text of product.texts) {
      if (text.strategy === "skip") continue;
      const nextHtml = plainToDetailHtml(text.preview);
      if (text.strategy === "replace") {
        if (detailHtml !== nextHtml) {
          detailHtml = nextHtml;
          detailChanged = true;
        }
      } else if (!detailHtml.includes(nextHtml)) {
        detailHtml = detailHtml
          ? `${detailHtml}<br><br>${nextHtml}`
          : nextHtml;
        detailChanged = true;
      }
    }

    const patch = buildProductPatch({
      ...(galleryChanged ? { gallery } : {}),
      ...(cover ? { image: cover } : {}),
      ...(projectPdf ? { projectPdf } : {}),
      ...(detailChanged ? { detailHtml } : {}),
    });
    if (Object.keys(patch).length === 0) continue;

    await client.patch(existing._id).set(patch).commit();
    updatedProducts += 1;
  }

  console.log(
    `Apply complete: ${updatedProducts} products, ${uploadedImages} images, ${copiedPdfs} PDFs.`,
  );
}
