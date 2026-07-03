import fs from "fs";
import path from "path";
import type { Request } from "express";
import multer from "multer";

const COVERS_DIR = path.resolve("uploads/covers");

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

fs.mkdirSync(COVERS_DIR, { recursive: true });

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error("Cover must be a JPEG, PNG, WebP, GIF, or AVIF image."));
}

export const coverUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

export function getCoverPublicUrl(filename: string): string {
  return `/uploads/covers/${filename}`;
}

export const coversUploadDir = COVERS_DIR;
