import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, "..", "..", "attached_assets");

/**
 * Move the product photos out of the storefront bundle and into the media store.
 *
 * Until this runs, product images exist *only* inside the storefront's build:
 * `products.image_key` holds a bare filename like
 * "Apex-Facial-Serum-Web_1781426371736.png", but the storefront never reads it
 * — it matches on product *name* against images imported in
 * `artifacts/storefront/src/lib/image-map.ts`, which Vite emits under a
 * content-hashed name. So the value in the database resolves to nothing, the
 * admin panel cannot render a photo, and no one can change one.
 *
 * After this, every product carries a real content-addressed key, the admin
 * shows the photo, and the storefront prefers the uploaded image over its
 * bundled fallback.
 *
 * Images are re-encoded on the way through. The sources are ~7MB PNGs — heavy
 * enough that the storefront is shipping 7MB per product photo today, and over
 * the API's 5MB upload cap besides.
 *
 * Talks only to the API, so it needs no database access.
 *
 * Usage:
 *   API_BASE_URL=https://api.apex-cosmetics.com \
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=... \
 *   tsx ./src/backfill-product-images.ts [--dry-run] [--force]
 */
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 82;

/**
 * Product name -> source image, mirroring `getProductImage` in
 * artifacts/storefront/src/lib/image-map.ts. Order matters: "facial bundle"
 * must be tested before "bundle" would be, and the storefront checks
 * "facial serum" before "serum".
 */
const NAME_RULES: Array<[match: string, file: string]> = [
  ["facial serum", "Apex-Facial-Serum-Web_1781426371736.png"],
  ["cleanser", "Apex-Facial-Cleanser-Web_1781426371737.png"],
  ["facial bundle", "Apex-Facial-Bundle-Web_1781426371738.png"],
  ["conditioner", "Apex-Conditioner-Web_1781426371738.png"],
  ["essential bundle", "Apex-Essential-Bundle-Web_1781426371738.png"],
  ["body wash", "Apex-Body-Wash-Web_1781426371738.png"],
  ["body bundle", "Apex-Body-Bundle-Web_1781426371738.png"],
  ["hair serum", "Apex-Hair-Serum-Web_1781426371739.png"],
  ["lotion", "Apex-Lotion-Web_1781426371739.png"],
  ["hair care", "Apex-Hair-Care-Web_1781426371739.png"],
  ["shampoo", "Apex-Shampoo-Web.png"],
  ["tallow", "Apex-Tallow-Web.png"],
];

/** Keys minted by the media store — anything else is a legacy filename. */
const UPLOADED_KEY = /^[0-9a-f]{32}\.(png|jpg|webp|gif)$/;

interface Product {
  id: string;
  name: string;
  imageKey: string | null;
}

function sourceFor(productName: string): string | null {
  const n = productName.toLowerCase();
  for (const [match, file] of NAME_RULES) {
    if (n.includes(match)) return file;
  }
  return null;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  // Without --force, products that already carry an uploaded key are skipped,
  // so a re-run does not overwrite a photo someone set by hand in the admin.
  const force = process.argv.includes("--force");

  const apiBase = required("API_BASE_URL").replace(/\/+$/, "");
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = required("ADMIN_PASSWORD");

  const available = new Set(await readdir(ASSETS_DIR));

  // --- sign in -------------------------------------------------------------
  const loginRes = await fetch(`${apiBase}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!loginRes.ok) {
    throw new Error(
      `Login failed (${loginRes.status}). Check ADMIN_USERNAME / ADMIN_PASSWORD.`,
    );
  }
  const cookie = (loginRes.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .join("; ");
  if (!cookie) throw new Error("Login succeeded but returned no session cookie.");

  // --- fetch the catalog ---------------------------------------------------
  const listRes = await fetch(`${apiBase}/api/admin/products?limit=200`, {
    headers: { cookie },
  });
  if (listRes.status === 404) {
    throw new Error(
      "GET /api/admin/products returned 404 — deploy the API before running this.",
    );
  }
  if (!listRes.ok) throw new Error(`Could not list products (${listRes.status}).`);

  const { data: products } = (await listRes.json()) as { data: Product[] };
  console.log(`${products.length} products\n`);

  let uploaded = 0;
  let skipped = 0;
  let missing = 0;

  for (const product of products) {
    const label = product.name.padEnd(34);

    if (product.imageKey && UPLOADED_KEY.test(product.imageKey) && !force) {
      console.log(`  ${label} already uploaded — skipping (--force to replace)`);
      skipped++;
      continue;
    }

    const file = sourceFor(product.name);
    if (!file || !available.has(file)) {
      console.log(`  ${label} no source image — leaving as is`);
      missing++;
      continue;
    }

    const source = path.join(ASSETS_DIR, file);
    const webp = await sharp(source)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // sharp's metadata().size is undefined for a file input, so stat the source.
    const { size: sourceBytes } = await stat(source);
    const shrink = `${(sourceBytes / 1048576).toFixed(1)}MB -> ${(webp.length / 1024).toFixed(0)}KB`;

    if (dryRun) {
      console.log(`  ${label} would upload  ${shrink}`);
      continue;
    }

    const upload = await fetch(
      `${apiBase}/api/admin/products/${encodeURIComponent(product.id)}/image`,
      {
        method: "POST",
        headers: { cookie, "content-type": "image/webp" },
        body: new Uint8Array(webp),
      },
    );

    if (!upload.ok) {
      const body = (await upload.json().catch(() => null)) as { error?: string } | null;
      console.log(`  ${label} FAILED (${upload.status}) ${body?.error ?? ""}`);
      continue;
    }

    const updated = (await upload.json()) as Product;
    console.log(`  ${label} ${updated.imageKey}  ${shrink}`);
    uploaded++;
  }

  console.log(
    `\n${dryRun ? "Dry run. " : ""}${uploaded} uploaded, ${skipped} skipped, ${missing} without a source.`,
  );
}

main().catch((err) => {
  console.error("Backfill failed:", err.message);
  process.exit(1);
});
