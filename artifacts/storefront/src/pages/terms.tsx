import { LegalPage } from "@/pages/legal";

export default function Terms() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated="June 2026"
      intro="These terms govern your use of the Apex Health Laboratories store and the purchase of our products. By placing an order you agree to the terms below."
      sections={[
        {
          heading: "Orders & pricing",
          body: [
            "All prices are listed in US dollars and are subject to change without notice. We reserve the right to refuse or cancel any order, including in cases of suspected fraud or pricing errors.",
            "An order is confirmed only once payment has been successfully processed and you receive an order confirmation.",
          ],
        },
        {
          heading: "Payments",
          body: [
            "Payments are handled securely through Stripe. By submitting an order you authorise us to charge your selected payment method for the total amount, including any applicable taxes and shipping.",
          ],
        },
        {
          heading: "Shipping & delivery",
          body: [
            "We aim to dispatch orders promptly. Delivery times are estimates and may vary. Risk of loss passes to you once the order is delivered to the carrier.",
          ],
        },
        {
          heading: "Returns & refunds",
          body: [
            "If you are not satisfied with your purchase, contact us within 30 days of delivery. Unopened products in original condition may be eligible for a refund or exchange. Refunds are issued to the original payment method.",
          ],
        },
        {
          heading: "Product use",
          body: [
            "Our products are cosmetic skincare formulations for external use only. They are not intended to diagnose, treat, cure, or prevent any disease. Always patch test and discontinue use if irritation occurs. Consult a professional if you have specific skin concerns.",
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "To the fullest extent permitted by law, Apex Health Laboratories is not liable for any indirect or consequential damages arising from the use of our products or website.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Questions about these terms? Email hello@apexhealth.com.",
          ],
        },
      ]}
    />
  );
}
