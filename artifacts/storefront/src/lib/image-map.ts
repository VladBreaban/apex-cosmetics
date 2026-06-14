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

export function getProductImage(name: string): string {
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
  return serum; // fallback
}
