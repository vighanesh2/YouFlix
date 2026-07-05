const loadedUrls = new Set<string>();

export function isImageCached(url: string): boolean {
  return Boolean(url && loadedUrls.has(url));
}

export function markImageCached(url: string): void {
  if (url) loadedUrls.add(url);
}

export function clearImageCache(): void {
  loadedUrls.clear();
}
