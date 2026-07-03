import fs from "fs";
import path from "path";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { coversUploadDir, getCoverPublicUrl } from "../config/uploads.js";

const POSTER_WIDTH = 400;
const HERO_WIDTH = 1280;

export async function saveCoverAsAvif(
  buffer: Buffer,
  variant: "poster" | "hero" = "hero"
): Promise<string> {
  const width = variant === "hero" ? HERO_WIDTH : POSTER_WIDTH;
  const filename = `${randomUUID()}.avif`;
  const filepath = path.join(coversUploadDir, filename);

  await sharp(buffer)
    .rotate()
    .resize(width, undefined, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .avif({ quality: 62, effort: 4 })
    .toFile(filepath);

  return getCoverPublicUrl(filename);
}

export function deleteCoverFile(coverUrl: string): void {
  if (!coverUrl.startsWith("/uploads/covers/")) return;
  const filename = path.basename(coverUrl);
  const filepath = path.join(coversUploadDir, filename);
  fs.unlink(filepath, () => {});
}
