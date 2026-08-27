import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * On-disk store for uploaded product and category images.
 *
 * Files land in MEDIA_DIR. On Azure App Service the default is under /home,
 * which is the only path that survives a restart or a scale operation — the
 * rest of the container filesystem is ephemeral, so an image written there
 * would vanish on the next deploy.
 *
 * Keys are content-addressed (sha256 of the bytes), so uploading the same file
 * twice reuses one entry, and a key can be served with an immutable cache
 * header: the bytes behind a key can never change.
 *
 * Nothing deletes from here. Because keys are content-addressed, two products
 * that were given the same file share one entry, so removing an image from one
 * product must not unlink the bytes. Clearing a product's image only nulls its
 * `image_key`; orphaned files are cheap and can be swept offline.
 *
 * Blob Storage is the natural upgrade if images ever need a CDN or more than
 * one App Service instance shares them; only this module would change.
 */
const MAX_BYTES = 5 * 1024 * 1024;

/** Magic-byte signatures, so the stored type comes from the file, not the header. */
const SIGNATURES: Array<{
  ext: string;
  contentType: string;
  test: (b: Buffer) => boolean;
}> = [
  {
    ext: "png",
    contentType: "image/png",
    test: (b) =>
      b.length > 8 &&
      b.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
  },
  {
    ext: "jpg",
    contentType: "image/jpeg",
    test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: "webp",
    contentType: "image/webp",
    test: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    ext: "gif",
    contentType: "image/gif",
    test: (b) => b.length > 6 && b.subarray(0, 6).toString("ascii").startsWith("GIF8"),
  },
];

const CONTENT_TYPE_BY_EXT = new Map(
  SIGNATURES.map((s) => [s.ext, s.contentType] as const),
);

export function mediaDir(): string {
  if (process.env.MEDIA_DIR) return path.resolve(process.env.MEDIA_DIR);
  // WEBSITE_INSTANCE_ID is only set inside App Service.
  if (process.env.WEBSITE_INSTANCE_ID) return "/home/data/media";
  return path.resolve(process.cwd(), ".media");
}

export class MediaError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

/** Rejects anything that is not a plain `<hex>.<ext>` name this module minted. */
function assertSafeKey(key: string): void {
  if (!/^[0-9a-f]{32}\.(png|jpg|webp|gif)$/.test(key)) {
    throw new MediaError("Not found", 404);
  }
}

export function contentTypeForKey(key: string): string {
  const ext = key.split(".").pop() ?? "";
  return CONTENT_TYPE_BY_EXT.get(ext) ?? "application/octet-stream";
}

/**
 * Persist image bytes and return the key to store on the product row.
 * Throws MediaError when the payload is empty, oversized, or not an image.
 */
export async function saveImage(bytes: Buffer): Promise<string> {
  if (bytes.length === 0) {
    throw new MediaError("Empty upload.");
  }
  if (bytes.length > MAX_BYTES) {
    throw new MediaError(
      `Image is larger than ${Math.round(MAX_BYTES / 1024 / 1024)}MB.`,
      413,
    );
  }

  const match = SIGNATURES.find((s) => s.test(bytes));
  if (!match) {
    throw new MediaError("Only PNG, JPEG, WebP and GIF images are accepted.");
  }

  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 32);
  const key = `${digest}.${match.ext}`;

  const dir = mediaDir();
  await mkdir(dir, { recursive: true });
  // Content-addressed, so an existing file with this name already holds these
  // exact bytes; rewriting it is harmless and avoids a stat round-trip.
  await writeFile(path.join(dir, key), bytes);

  return key;
}

export async function readImage(
  key: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  assertSafeKey(key);
  try {
    const bytes = await readFile(path.join(mediaDir(), key));
    return { bytes, contentType: contentTypeForKey(key) };
  } catch {
    throw new MediaError("Not found", 404);
  }
}
