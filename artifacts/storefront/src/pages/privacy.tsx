import { LegalPage } from "@/pages/legal";

export default function Privacy() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="June 2026"
      intro="Apex Health Laboratories ('Apex Health', 'we', 'us') respects your privacy. This policy explains what information we collect when you visit our store or place an order, how we use it, and the choices you have."
      sections={[
        {
          heading: "Information we collect",
          body: [
            "Order & contact details: when you make a purchase or contact us, we collect your name, email address, shipping and billing address, and order history.",
            "Payment information: card payments are processed securely by Stripe. We do not store your full card number on our servers.",
            "Usage data: we collect basic analytics such as pages viewed and device type to improve the store experience.",
          ],
        },
        {
          heading: "How we use your information",
          body: [
            "To process and fulfil your orders, send order confirmations, and provide customer support.",
            "To respond to your enquiries submitted through our contact form.",
            "To improve our products, website, and service. We never sell your personal information.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "We use essential cookies to keep your cart and session working, and optional analytics cookies to understand how the store is used. You can control cookies through your browser settings.",
          ],
        },
        {
          heading: "Data sharing",
          body: [
            "We share data only with the service providers needed to run the store — for example Stripe for payments and our shipping partners for delivery. These providers are bound to protect your information.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You may request access to, correction of, or deletion of your personal data at any time. To exercise these rights, contact us at hello@apexhealth.com.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Questions about this policy? Email hello@apexhealth.com and our team will respond within one business day.",
          ],
        },
      ]}
    />
  );
}
