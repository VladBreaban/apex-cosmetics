import { apiUrl } from "./api-base";

/** Keys minted by the media store: 32 hex characters plus an image extension. */
const UPLOADED_KEY = /^[0-9a-f]{32}\.(png|jpg|webp|gif)$/;

/**
 * True when this `image_key` is an upload the API can serve.
 *
 * The seeded catalog stores bundled asset *filenames* in `image_key` (e.g.
 * "Apex-Facial-Serum-Web_1781426371736.png"). The storefront resolves those
 * against its own bundle; the API knows nothing about them, so the admin must
 * not render them as <img src> or every original product shows a broken image.
 */
export function isUploadedImage(key: string | null | undefined): key is string {
  return Boolean(key) && UPLOADED_KEY.test(key!);
}

/**
 * Public URL for an uploaded image key.
 *
 * Images are served by the API (`GET /api/assets/:key`), not by whatever host
 * happens to be serving this bundle — the admin SPA and the API sit on
 * different origins in the deployed setup.
 */
export function assetUrl(key: string): string {
  return apiUrl(`/api/assets/${key}`);
}

/**
 * Upload a product image.
 *
 * Hand-written rather than using the generated `useAdminUploadProductImage`:
 * Orval emits `body: JSON.stringify(blob)` for a binary request body, which
 * serialises a File to `"{}"` and uploads nothing. The endpoint is still in
 * openapi.yaml so the contract stays complete — just do not call the generated
 * client for it.
 */
export async function uploadProductImage(
  productId: string,
  file: File,
): Promise<void> {
  const res = await fetch(
    apiUrl(`/api/admin/products/${encodeURIComponent(productId)}/image`),
    {
      method: "POST",
      credentials: "include",
      headers: { "content-type": file.type || "application/octet-stream" },
      body: file,
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(
      (data && typeof data.error === "string" && data.error) ||
        "Upload failed. Please try again.",
    );
  }
}
