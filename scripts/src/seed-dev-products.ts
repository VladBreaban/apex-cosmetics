import pg from "pg";

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
];

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // Create schema and tables if missing
    await client.query(`CREATE SCHEMA IF NOT EXISTS stripe`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "stripe"."products" (
        "id" text primary key,
        "object" text,
        "active" boolean,
        "description" text,
        "metadata" jsonb,
        "name" text,
        "created" integer,
        "images" jsonb,
        "livemode" boolean,
        "package_dimensions" jsonb,
        "shippable" boolean,
        "statement_descriptor" text,
        "unit_label" text,
        "updated" integer,
        "url" text
      )
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'stripe')) THEN
          CREATE TYPE "stripe"."pricing_type" AS ENUM ('one_time', 'recurring');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_tiers' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'stripe')) THEN
          CREATE TYPE "stripe"."pricing_tiers" AS ENUM ('graduated', 'volume');
        END IF;
      END
      $$
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "stripe"."prices" (
        "id" text primary key,
        "object" text,
        "active" boolean,
        "currency" text,
        "metadata" jsonb,
        "nickname" text,
        "recurring" jsonb,
        "type" stripe.pricing_type,
        "unit_amount" integer,
        "billing_scheme" text,
        "created" integer,
        "livemode" boolean,
        "lookup_key" text,
        "tiers_mode" stripe.pricing_tiers,
        "transform_quantity" jsonb,
        "unit_amount_decimal" text,
        "product" text references stripe.products
      )
    `);

    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i < PRODUCTS.length; i++) {
      const p = PRODUCTS[i];
      const priceId = `price_apex_${String(i + 1).padStart(3, "0")}`;

      await client.query(
        `INSERT INTO stripe.products (id, object, active, description, metadata, name, created, images, livemode)
         VALUES ($1, 'product', true, $2, $3, $4, $5, '[]', false)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           metadata = EXCLUDED.metadata,
           active = EXCLUDED.active`,
        [
          p.id,
          p.description,
          JSON.stringify({ category: p.category, imageKey: p.imageKey, featured: String(p.featured) }),
          p.name,
          now - i * 100,
        ]
      );

      await client.query(
        `INSERT INTO stripe.prices (id, object, active, currency, metadata, type, unit_amount, billing_scheme, created, livemode, product)
         VALUES ($1, 'price', true, 'usd', '{}', 'one_time', $2, 'per_unit', $3, false, $4)
         ON CONFLICT (id) DO UPDATE SET
           unit_amount = EXCLUDED.unit_amount,
           active = EXCLUDED.active`,
        [priceId, p.unitAmount, now - i * 100, p.id]
      );

      console.log(`✓ ${p.name} — $${(p.unitAmount / 100).toFixed(2)}`);
    }

    console.log("\nAll 10 products seeded successfully!");
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
