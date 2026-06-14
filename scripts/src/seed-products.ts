import { getUncachableStripeClient } from "./stripeClient";

const PRODUCTS = [
  {
    name: "Copper Peptide Facial Serum",
    description:
      "A concentrated copper peptide serum that visibly firms, brightens, and smooths skin. 2 FL OZ. Clinically tested formula for daily use.",
    unitAmount: 6800,
    category: "skincare",
    imageKey: "Apex-Facial-Serum-Web_1781426371736.png",
    featured: true,
  },
  {
    name: "Copper Peptide Facial Cleanser",
    description:
      "A gentle yet effective copper peptide cleanser that removes impurities while preserving your skin barrier. 3.4 FL OZ.",
    unitAmount: 4200,
    category: "skincare",
    imageKey: "Apex-Facial-Cleanser-Web_1781426371737.png",
    featured: true,
  },
  {
    name: "Copper Peptide Conditioner",
    description:
      "Strengthens and revitalizes hair with copper peptide technology. Reduces breakage, adds shine. 8 FL OZ.",
    unitAmount: 3800,
    category: "haircare",
    imageKey: "Apex-Conditioner-Web_1781426371738.png",
    featured: false,
  },
  {
    name: "Copper Peptide Body Wash",
    description:
      "A luxurious body wash infused with copper peptides for daily skin renewal. Leaves skin soft and supple. 8 FL OZ.",
    unitAmount: 3200,
    category: "bodycare",
    imageKey: "Apex-Body-Wash-Web_1781426371738.png",
    featured: false,
  },
  {
    name: "Copper Peptide Hair Serum",
    description:
      "A lightweight hair serum that targets thinning, breakage, and dullness. Apply directly to scalp or lengths. 2 FL OZ.",
    unitAmount: 5800,
    category: "haircare",
    imageKey: "Apex-Hair-Serum-Web_1781426371739.png",
    featured: true,
  },
  {
    name: "Copper Peptide Body Lotion",
    description:
      "Rich daily body lotion with copper peptides for firmer, more youthful-looking skin. Absorbs quickly. 8 FL OZ.",
    unitAmount: 3600,
    category: "bodycare",
    imageKey: "Apex-Lotion-Web_1781426371739.png",
    featured: false,
  },
  {
    name: "Facial Bundle",
    description:
      "The complete Apex Health facial routine. Includes Copper Peptide Facial Serum + Facial Cleanser. Save 15% vs buying individually.",
    unitAmount: 9400,
    category: "bundles",
    imageKey: "Apex-Facial-Bundle-Web_1781426371738.png",
    featured: true,
  },
  {
    name: "Hair Care Bundle",
    description:
      "Complete copper peptide hair system. Includes Hair Serum + Conditioner for maximum results.",
    unitAmount: 8600,
    category: "bundles",
    imageKey: "Apex-Hair-Care-Web_1781426371739.png",
    featured: false,
  },
  {
    name: "Body Bundle",
    description:
      "Full-body copper peptide care. Includes Body Wash + Body Lotion for a daily routine that transforms your skin.",
    unitAmount: 5800,
    category: "bundles",
    imageKey: "Apex-Body-Bundle-Web_1781426371738.png",
    featured: false,
  },
  {
    name: "Essential Bundle",
    description:
      "The ultimate Apex Health starter kit. Includes Facial Serum, Facial Cleanser, Hair Serum, and Body Lotion. Best value.",
    unitAmount: 15800,
    category: "bundles",
    imageKey: "Apex-Essential-Bundle-Web_1781426371738.png",
    featured: true,
  },
];

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  console.log("Checking for existing Apex Health products...");
  const existing = await stripe.products.search({
    query: "metadata['imageKey']:*",
  });

  if (existing.data.length > 0) {
    console.log(
      `Found ${existing.data.length} existing products. Skipping seed.`,
    );
    console.log(
      "To re-seed, deactivate existing products first in the Stripe dashboard.",
    );
    return;
  }

  console.log(`Creating ${PRODUCTS.length} Apex Health products...`);

  for (const p of PRODUCTS) {
    const product = await stripe.products.create({
      name: p.name,
      description: p.description,
      metadata: {
        category: p.category,
        imageKey: p.imageKey,
        featured: String(p.featured),
      },
    });

    await stripe.prices.create({
      product: product.id,
      unit_amount: p.unitAmount,
      currency: "usd",
    });

    console.log(`Created: ${product.name} — $${(p.unitAmount / 100).toFixed(2)}`);
  }

  console.log("\nAll products created successfully!");
  console.log(
    "Webhooks will sync data to the database. Run the API server to trigger syncBackfill().",
  );
}

seedProducts().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
