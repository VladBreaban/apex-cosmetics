import { LegalPage } from "@/pages/legal";

export default function Refunds() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Refund & Return Policy"
      updated="August 2026"
      intro="We want you to be satisfied with every formulation you order. This policy explains when a return or refund is available, how to request one, and how long it takes."
      sections={[
        {
          heading: "Return window",
          body: [
            "You may request a return within 30 days of delivery. Requests made after 30 days cannot be accepted.",
            "Products must be unused and in their original packaging, with any seals intact. Because our formulations are cosmetic products applied to the skin, opened items cannot be resold and are not eligible for return unless they arrived damaged or defective.",
          ],
        },
        {
          heading: "Damaged, defective or incorrect items",
          body: [
            "If your order arrives damaged, defective, or is not what you ordered, contact us within 7 days of delivery and include your order number and photographs of the item and packaging.",
            "We will replace the item or issue a full refund, including original shipping, at no cost to you. You will not be asked to return a damaged product at your own expense.",
          ],
        },
        {
          heading: "How to request a return",
          body: [
            "Email hello@apexhealth.com with your order number and the reason for the return. We will confirm whether the item is eligible and send return instructions.",
            "Please do not ship anything back before receiving those instructions — returns sent without prior authorisation cannot be tracked to your order and may not be refunded.",
          ],
        },
        {
          heading: "Refunds",
          body: [
            "Approved refunds are issued to the original payment method. We process them within 5 business days of receiving and inspecting the returned item; your bank or card issuer may take a further 5 to 10 business days to post the credit.",
            "Refunds cover the price of the returned product. Original shipping charges are not refunded except where the item was damaged, defective, or sent in error.",
            "Return postage is your responsibility unless the return is due to our error. We recommend a tracked service, as we cannot refund an item that does not reach us.",
          ],
        },
        {
          heading: "Exchanges",
          body: [
            "We do not process direct exchanges. If you would like a different product, request a refund for the original item and place a new order.",
          ],
        },
        {
          heading: "Bundles and sets",
          body: [
            "Bundles are returnable only as a complete set. If any item in a bundle has been opened or used, the bundle is no longer eligible for return.",
          ],
        },
        {
          heading: "Cancelling an order",
          body: [
            "Orders can be cancelled at no cost any time before they are dispatched. Email us as soon as possible with your order number. Once an order has shipped it falls under the return process above.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Questions about a return or refund? Email hello@apexhealth.com with your order number and we will respond within two business days.",
          ],
        },
      ]}
    />
  );
}
