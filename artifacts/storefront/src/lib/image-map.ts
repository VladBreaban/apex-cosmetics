import serum from "@assets/Apex-Facial-Serum-Web_1781426371736.png";
import cleanser from "@assets/Apex-Facial-Cleanser-Web_1781426371737.png";
import facialBundle from "@assets/Apex-Facial-Bundle-Web_1781426371738.png";
import conditioner from "@assets/Apex-Conditioner-Web_1781426371738.png";
import essentialBundle from "@assets/Apex-Essential-Bundle-Web_1781426371738.png";
import bodyWash from "@assets/Apex-Body-Wash-Web_1781426371738.png";
import bodyBundle from "@assets/Apex-Body-Bundle-Web_1781426371738.png";
import hairSerum from "@assets/Apex-Hair-Serum-Web_1781426371739.png";
import lotion from "@assets/Apex-Lotion-Web_1781426371739.png";
import hairCare from "@assets/Apex-Hair-Care-Web_1781426371739.png";
import shampoo from "@assets/Apex-Shampoo-Web.png";
import tallow from "@assets/Apex-Tallow-Web.png";
import { apiUrl } from "./api-base";

/**
 * Keys minted by the media store: 32 hex characters plus an image extension.
 *
 * The check matters because the seeded catalog already stores a bundled asset
 * *filename* in `image_key` (e.g. "Apex-Facial-Serum-Web_1781426371736.png").
 * Those are not uploads and there is nothing behind them at /api/assets, so
 * treating every non-empty key as an upload would break the product images on
 * all twelve original products.
 */
const UPLOADED_KEY = /^[0-9a-f]{32}\.(png|jpg|webp|gif)$/;

/**
 * Picture for a product.
 *
 * Prefers an image uploaded through the admin panel, falling back to the
 * name-matched bundled assets below.
 */
export function getProductImage(
  name: string,
  imageKey?: string | null,
): string {
  if (imageKey && UPLOADED_KEY.test(imageKey)) {
    return apiUrl(`/api/assets/${imageKey}`);
  }
  return getBundledProductImage(name);
}

function getBundledProductImage(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("facial serum")) return serum;
  if (n.includes("cleanser")) return cleanser;
  if (n.includes("facial bundle")) return facialBundle;
  if (n.includes("conditioner")) return conditioner;
  if (n.includes("essential bundle")) return essentialBundle;
  if (n.includes("body wash")) return bodyWash;
  if (n.includes("body bundle")) return bodyBundle;
  if (n.includes("hair serum")) return hairSerum;
  if (n.includes("lotion")) return lotion;
  if (n.includes("hair care")) return hairCare;
  if (n.includes("shampoo")) return shampoo;
  if (n.includes("tallow")) return tallow;
  return serum; // fallback
}
