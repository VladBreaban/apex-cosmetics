import pg from "pg";

/**
 * Seed the catalog for a fresh environment.
 *
 * Writes to the `products` / `prices` tables this application owns. The schema
 * itself comes from Drizzle (`pnpm --filter @workspace/db run push`), not from
 * here. Idempotent: re-running updates the existing rows.
 */

const { Client } = pg;

const PRODUCTS = [
  { id: "prod_apex_001", name: "Copper Peptide Facial Serum", description: "A concentrated copper peptide serum that visibly firms, brightens, and smooths skin. 2 FL OZ. Clinically tested formula for daily use.", category: "skincare", imageKey: "Apex-Facial-Serum-Web_1781426371736.png", featured: true, unitAmount: 6800 },
  { id: "prod_apex_002", name: "Copper Peptide Facial Cleanser", description: "A gentle yet effective copper peptide cleanser that removes impurities while preserving your skin barrier. 3.4 FL OZ.", category: "skincare", imageKey: "Apex-Facial-Cleanser-Web_1781426371737.png", featured: true, unitAmount: 4200 },
  { id: "prod_apex_003", name: "Copper Peptide Conditioner", description: "Strengthens and revitalizes hair with copper peptide technology. Reduces breakage, adds shine. 8 FL OZ.", category: "haircare", imageKey: "Apex-Conditioner-Web_1781426371738.png", featured: false, unitAmount: 3800 },
  { id: "prod_apex_004", name: "Copper Peptide Body Wash", description: "A luxurious body wash infused with copper peptides for daily skin renewal. Leaves skin soft and supple. 8 FL OZ.", category: "bodycare", imageKey: "Apex-Body-Wash-Web_1781426371738.png", featured: false, unitAmount: 3200 },
  { id: "prod_apex_005", name: "Copper Peptide Hair Serum", description: "A lightweight hair serum that targets thinning, breakage, and dullness. Apply directly to scalp or lengths. 2 FL OZ.", category: "haircare", imageKey: "Apex-Hair-Serum-Web_1781426371739.png", featured: true, unitAmount: 5800 },
  { id: "prod_apex_006", name: "Copper Peptide Body Lotion", description: "Rich daily body lotion with copper peptides for firmer, more youthful-looking skin. Absorbs quickly. 8 FL OZ.", category: "bodycare", imageKey: "Apex-Lotion-Web_1781426371739.png", featured: false, unitAmount: 3600 },
  { id: "prod_apex_007", name: "Facial Bundle", description: "The complete Apex Health facial routine. Includes Copper Peptide Facial Serum + Facial Cleanser. Save 15% vs buying individually.", category: "bundles", imageKey: "Apex-Facial-Bundle-Web_1781426371738.png", featured: true, unitAmount: 9400 },
  { id: "prod_apex_008", name: "Hair Care Bundle", description: "Complete copper peptide hair system. Includes Hair Serum + Conditioner for maximum results.", category: "bundles", imageKey: "Apex-Hair-Care-Web_1781426371739.png", featured: false, unitAmount: 8600 },
  { id: "prod_apex_009", name: "Body Bundle", description: "Full-body copper peptide care. Includes Body Wash + Body Lotion for a daily routine that transforms your skin.", category: "bundles", imageKey: "Apex-Body-Bundle-Web_1781426371738.png", featured: false, unitAmount: 5800 },
  { id: "prod_apex_010", name: "Essential Bundle", description: "The ultimate Apex Health starter kit. Includes Facial Serum, Facial Cleanser, Hair Serum, and Body Lotion. Best value.", category: "bundles", imageKey: "Apex-Essential-Bundle-Web_1781426371738.png", featured: true, unitAmount: 15800 },
  { id: "prod_apex_011", name: "Copper Peptide Shampoo", description: "A nourishing copper peptide shampoo that gently cleanses while supporting stronger, fuller-looking hair. 8 FL OZ.", category: "haircare", imageKey: "Apex-Shampoo-Web.png", featured: false, unitAmount: 3800 },
  { id: "prod_apex_012", name: "Copper Peptide Tallow Balm", description: "A deeply moisturizing whipped tallow balm enriched with copper peptides. Restores dry, sensitive skin. 4 OZ.", category: "skincare", imageKey: "Apex-Tallow-Web.png", featured: false, unitAmount: 4800 },
];

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Catalog order is "newest first", so stamp created_at descending down the
  // list to keep the array order above as the storefront order.
  const base = Math.floor(Date.now() / 1000);

  try {
    for (let i = 0; i < PRODUCTS.length; i++) {
      const p = PRODUCTS[i];
      const priceId = `price_apex_${String(i + 1).padStart(3, "0")}`;

      await client.query(
        `INSERT INTO products (id, name, description, active, category, image_key, featured, created_at)
         VALUES ($1, $2, $3, true, $4, $5, $6, to_timestamp($7))
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
          p.id,
          p.name,
          p.description,
          p.category,
          p.imageKey,
          p.featured,
          base - i * 100,
        ],
      );

      await client.query(
        `INSERT INTO prices (id, product_id, unit_amount, currency, active)
         VALUES ($1, $2, $3, 'usd', true)
         ON CONFLICT (id) DO UPDATE SET
           product_id = EXCLUDED.product_id,
           unit_amount = EXCLUDED.unit_amount,
           active = EXCLUDED.active`,
        [priceId, p.id, p.unitAmount],
      );

      console.log(`✓ ${p.name} — $${(p.unitAmount / 100).toFixed(2)}`);
    }

    console.log(`
Seeded ${PRODUCTS.length} products successfully.`);
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
