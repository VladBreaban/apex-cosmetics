import pg from "pg";

const { Client } = pg;

/**
 * One-shot migration: move the catalog out of the `stripe.*` mirror schema and
 * into the `products` / `prices` tables this application now owns.
 *
 * The mirror was populated by `stripe-replit-sync`, which stored category,
 * imageKey and featured inside Stripe's free-form `metadata` JSON. Those become
 * real columns here.
 *
 * Idempotent — re-running upserts rather than duplicating. The source
 * `stripe.*` tables are left untouched so this can be verified before dropping
 * them; see the note printed at the end.
 */
async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const mirrorExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'stripe' AND table_name = 'products'
      ) AS present
    `);

    if (!mirrorExists.rows[0]?.present) {
      console.log("No stripe.products table found — nothing to migrate.");
      return;
    }

    const products = await client.query(`
      SELECT id, name, description, active, metadata, created
      FROM stripe.products
    `);

    let productCount = 0;
    for (const row of products.rows) {
      const meta = row.metadata ?? {};
      await client.query(
        // created_at carries over from the mirror's epoch `created` column.
         // Catalog order is "newest first", so letting these default to now()
         // would reverse the storefront's product order.
        `INSERT INTO products (id, name, description, active, category, image_key, featured, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8))
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           active = EXCLUDED.active,
           category = EXCLUDED.category,
           image_key = EXCLUDED.image_key,
           featured = EXCLUDED.featured,
           created_at = EXCLUDED.created_at,
           updated_at = now()`,
        [
          row.id,
          row.name,
          row.description ?? null,
          row.active ?? true,
          meta.category ?? null,
          meta.imageKey ?? null,
          // The mirror stored this as the string "true"/"false".
          meta.featured === "true" || meta.featured === true,
          row.created ?? Math.floor(Date.now() / 1000),
        ],
      );
      productCount++;
    }

    const prices = await client.query(`
      SELECT id, product, unit_amount, currency, active
      FROM stripe.prices
      WHERE product IS NOT NULL
    `);

    let priceCount = 0;
    let orphaned = 0;
    for (const row of prices.rows) {
      // A price whose product never made it across would violate the foreign
      // key; skip it loudly rather than aborting the whole migration.
      const parent = await client.query(`SELECT 1 FROM products WHERE id = $1`, [
        row.product,
      ]);
      if (parent.rowCount === 0) {
        console.warn(`  ! skipping price ${row.id} — no product ${row.product}`);
        orphaned++;
        continue;
      }

      await client.query(
        `INSERT INTO prices (id, product_id, unit_amount, currency, active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           product_id = EXCLUDED.product_id,
           unit_amount = EXCLUDED.unit_amount,
           currency = EXCLUDED.currency,
           active = EXCLUDED.active`,
        [
          row.id,
          row.product,
          row.unit_amount ?? 0,
          row.currency ?? "usd",
          row.active ?? true,
        ],
      );
      priceCount++;
    }

    console.log(`\nMigrated ${productCount} products and ${priceCount} prices.`);
    if (orphaned > 0) {
      console.log(`${orphaned} price(s) skipped for missing products.`);
    }
    console.log(
      "\nThe stripe.* schema was left in place. Once the storefront and admin\n" +
        "have been verified against the new tables, drop it with:\n" +
        "  DROP SCHEMA stripe CASCADE;",
    );
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
