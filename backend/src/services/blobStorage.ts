import { del, issueSignedToken, presignUrl, put } from "@vercel/blob";
import type { BlobAccessType } from "@vercel/blob";
import { config } from "../config/env.js";

let resolvedBlobAccess: BlobAccessType | null = null;

export function useBlobStorage(): boolean {
  return Boolean(config.blobReadWriteToken);
}

export function isBlobConfigured(): boolean {
  return useBlobStorage();
}

/** On Vercel, covers must use Blob — local /uploads paths are not persisted or served. */
export function assertBlobStorageAvailable(): void {
  if (process.env.VERCEL === "1" && !useBlobStorage()) {
    throw new Error(
      "Cover uploads require Vercel Blob. In your Vercel project, create a Blob store, connect it to the backend service, and redeploy so BLOB_READ_WRITE_TOKEN is set."
    );
  }
}

export function isBlobUrl(url: string): boolean {
  return url.startsWith("https://") && url.includes(".blob.vercel-storage.com/");
}

export function isPrivateBlobUrl(url: string): boolean {
  return isBlobUrl(url) && url.includes(".private.blob.vercel-storage.com");
}

export function isLocalCoverUrl(url: string): boolean {
  return url.startsWith("/uploads/covers/");
}

function configuredBlobAccess(): BlobAccessType | null {
  const value = process.env.BLOB_ACCESS?.trim().toLowerCase();
  if (value === "public" || value === "private") return value;
  return null;
}

function isPrivateStoreError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("private store") || message.includes("private access");
}

function blobPathname(url: string): string {
  return decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
}

export async function uploadCoverBlob(
  pathname: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (!config.blobReadWriteToken) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  const preferred =
    configuredBlobAccess() ?? resolvedBlobAccess ?? ("public" as BlobAccessType);

  try {
    const blob = await put(pathname, body, {
      access: preferred,
      token: config.blobReadWriteToken,
      contentType,
      addRandomSuffix: false,
    });
    resolvedBlobAccess = preferred;
    return blob.url;
  } catch (error) {
    if (preferred === "public" && isPrivateStoreError(error)) {
      const blob = await put(pathname, body, {
        access: "private",
        token: config.blobReadWriteToken,
        contentType,
        addRandomSuffix: false,
      });
      resolvedBlobAccess = "private";
      return blob.url;
    }
    throw error;
  }
}

export async function getReadableCoverUrl(coverUrl: string): Promise<string> {
  if (!coverUrl || !isPrivateBlobUrl(coverUrl) || !config.blobReadWriteToken) {
    return coverUrl;
  }

  const pathname = blobPathname(coverUrl);
  const validUntil = Date.now() + 60 * 60 * 1000;

  const signed = await issueSignedToken({
    token: config.blobReadWriteToken,
    pathname,
    operations: ["get"],
    validUntil,
  });

  const { presignedUrl } = await presignUrl(signed, {
    operation: "get",
    pathname,
    access: "private",
    validUntil,
  });

  return presignedUrl;
}

export async function deletePublicBlob(url: string): Promise<void> {
  if (!config.blobReadWriteToken || !isBlobUrl(url)) return;

  await del(url, { token: config.blobReadWriteToken });
}
