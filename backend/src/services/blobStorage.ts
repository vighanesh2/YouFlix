import { del, put } from "@vercel/blob";
import { config } from "../config/env.js";

export function useBlobStorage(): boolean {
  return Boolean(config.blobReadWriteToken);
}

export function isBlobUrl(url: string): boolean {
  return url.startsWith("https://") && url.includes(".blob.vercel-storage.com/");
}

export async function uploadPublicBlob(
  pathname: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (!config.blobReadWriteToken) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  const blob = await put(pathname, body, {
    access: "public",
    token: config.blobReadWriteToken,
    contentType,
    addRandomSuffix: false,
  });

  return blob.url;
}

export async function deletePublicBlob(url: string): Promise<void> {
  if (!config.blobReadWriteToken || !isBlobUrl(url)) return;

  await del(url, { token: config.blobReadWriteToken });
}
