/**
 * cloudinaryService.ts
 *
 * Higher-level Cloudinary helpers used by the scraper pipeline.
 * All operations delegate to services/cloudinary.ts which lazy-inits credentials
 * so the server starts cleanly even when Cloudinary env vars are absent.
 */

import fetch from 'node-fetch';
import cloudinary, { uploadImage, deleteImage as cldDelete, ensureConfigured, isAllowedImageUrl } from './cloudinary';
export { isAllowedImageUrl };

export interface UploadResult {
  url: string;
  publicId: string;
  /** Width in pixels — populated when Cloudinary returns dimensions; 0 when uploaded via buffer without metadata. */
  width: number;
  /** Height in pixels — populated when Cloudinary returns dimensions; 0 when uploaded via buffer without metadata. */
  height: number;
}

/**
 * Upload an external image URL to Cloudinary by fetching it locally first,
 * then streaming the bytes. Works for CDN URLs that block Cloudinary's
 * own fetch-by-URL feature (common with AliExpress / eBay CDNs).
 *
 * @param imageUrl Remote image URL (validate with isAllowedImageUrl before calling)
 * @param folder   Cloudinary folder (e.g. "products/scraped")
 */
export const uploadImageFromUrl = async (
  imageUrl: string,
  folder: string = 'products/competitors',
): Promise<UploadResult> => {
  if (!imageUrl || !imageUrl.startsWith('http') || !isAllowedImageUrl(imageUrl)) {
    throw new Error('Image URL is not allowed (SSRF protection)');
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Image download failed: HTTP ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // uploadImage handles ensureConfigured() internally
  const { url, public_id } = await uploadImage(buffer, folder);
  return { url, publicId: public_id, width: 0, height: 0 };
};

/**
 * Upload multiple image URLs in parallel (batched to avoid overwhelming Cloudinary).
 */
export const uploadMultipleImages = async (
  imageUrls: string[],
  folder: string = 'products/competitors',
): Promise<UploadResult[]> => {
  const validUrls = imageUrls.filter((u) => u && u.startsWith('http'));
  const settled = await Promise.allSettled(
    validUrls.map((url) => uploadImageFromUrl(url, folder)),
  );

  return settled
    .map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.warn(`Image upload failed at index ${i}:`, r.reason);
      return null;
    })
    .filter((r): r is UploadResult => r !== null);
};

/**
 * Delete a Cloudinary asset by its public ID.
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  await cldDelete(publicId);
};

/**
 * Build an optimized Cloudinary delivery URL for a given public ID.
 * Applies auto-quality and format transforms for smallest file size.
 */
export const getOptimizedImageUrl = (
  publicId: string,
  width?: number,
  height?: number,
): string => {
  ensureConfigured();
  return cloudinary.url(publicId, {
    secure: true,
    quality: 'auto',
    fetch_format: 'auto',
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    crop: 'fit',
  });
};
