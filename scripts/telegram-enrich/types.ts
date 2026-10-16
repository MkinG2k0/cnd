export type MediaClass =
  | "photo"
  | "presentation_pdf"
  | "legal_pdf"
  | "heic"
  | "video"
  | "other";

export type ManifestPhotoAction = "gallery" | "cover" | "skip";
export type ManifestPdfAction = "projectPdf" | "skip";
export type ManifestTextStrategy = "append" | "replace" | "skip";

export type EnrichManifest = {
  generatedAt: string;
  exportPath: string;
  products: ManifestProduct[];
  priceNote: "never modified";
};

export type ManifestProduct = {
  productName: string;
  topicId: number;
  topicTitle: string;
  photos: { messageId: number; relativePath: string; action: ManifestPhotoAction; reason?: string }[];
  pdfs: { messageId: number; relativePath: string; action: ManifestPdfAction; reason?: string; publicPath?: string }[];
  texts: { messageId: number; strategy: ManifestTextStrategy; preview: string }[];
  videos: { messageId: number; relativePath: string; action: "deferred" }[];
};
