import fs from "fs";
import path from "path";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { coversUploadDir, getCoverPublicUrl } from "../config/uploads.js";
import {
  assertBlobStorageAvailable,
  deletePublicBlob,
  isBlobUrl,
  uploadCoverBlob,
  useBlobStorage,
} from "./blobStorage.js";

const POSTER_WIDTH = 400;
const HERO_WIDTH = 1280;

async function processCoverBuffer(
  buffer: Buffer,
  variant: "poster" | "hero"
): Promise<Buffer> {
  const width = variant === "hero" ? HERO_WIDTH : POSTER_WIDTH;

  return sharp(buffer)
    .rotate()
    .resize(width, undefined, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .avif({ quality: 62, effort: 4 })
    .toBuffer();
}

export async function saveCoverAsAvif(
  buffer: Buffer,
  variant: "poster" | "hero" = "hero"
): Promise<string> {
  assertBlobStorageAvailable();

  const processed = await processCoverBuffer(buffer, variant);
  const filename = `${randomUUID()}.avif`;

  if (useBlobStorage()) {
    return uploadCoverBlob(
      `covers/${filename}`,
      processed,
      "image/avif"
    );
  }

  const filepath = path.join(coversUploadDir, filename);
  await fs.promises.writeFile(filepath, processed);
  return getCoverPublicUrl(filename);
}

export function deleteCoverFile(coverUrl: string): void {
  if (isBlobUrl(coverUrl)) {
    deletePublicBlob(coverUrl).catch((err) => {
      console.warn("Failed to delete blob cover:", err);
    });
    return;
  }

  if (!coverUrl.startsWith("/uploads/covers/")) return;

  const filename = path.basename(coverUrl);
  const filepath = path.join(coversUploadDir, filename);
  fs.unlink(filepath, () => {});
}
