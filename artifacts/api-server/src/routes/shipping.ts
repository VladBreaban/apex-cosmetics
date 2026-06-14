import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const PLACEHOLDER_RATES = [
  {
    serviceCode: "usps_priority_mail",
    serviceName: "Priority Mail (2-Day)",
    carrierCode: "stamps_com",
    carrierName: "USPS",
    amountCents: 899,
    estimatedDays: 2,
  },
  {
    serviceCode: "usps_priority_mail_express",
    serviceName: "Priority Mail Express (1-Day)",
    carrierCode: "stamps_com",
    carrierName: "USPS",
    amountCents: 2499,
    estimatedDays: 1,
  },
  {
    serviceCode: "ups_ground",
    serviceName: "UPS Ground (3-5 Days)",
    carrierCode: "ups",
    carrierName: "UPS",
    amountCents: 699,
    estimatedDays: 5,
  },
];

router.post("/shipping/rates", async (req, res): Promise<void> => {
  const { address, itemCount, totalWeightOz } = req.body;

  if (!address || !address.address1 || !address.city || !address.state || !address.zip) {
    res.status(400).json({ error: "Incomplete shipping address" });
    return;
  }

  const apiKey = process.env.SHIPSTATION_API_KEY;
  const apiSecret = process.env.SHIPSTATION_API_SECRET;

  if (apiKey && apiSecret) {
    try {
      const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
      const warehouseRes = await fetch("https://ssapi.shipstation.com/warehouses", {
        headers: { Authorization: `Basic ${credentials}` },
      });

      if (!warehouseRes.ok) {
        throw new Error(`ShipStation warehouses fetch failed: ${warehouseRes.status}`);
      }

      const warehouses = (await warehouseRes.json()) as Array<{ warehouseId: number; isDefault: boolean; originAddress?: { postalCode?: string } }>;
      const warehouse = warehouses.find((w) => w.isDefault) ?? warehouses[0];

      if (!warehouse) {
        throw new Error("No ShipStation warehouse configured");
      }

      const weightOz = totalWeightOz ?? (itemCount ?? 1) * 8;

      const ratesRes = await fetch("https://ssapi.shipstation.com/shipments/getrates", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carrierCode: null,
          serviceCode: null,
          packageCode: "package",
          fromPostalCode: warehouse.originAddress?.postalCode ?? "90210",
          toState: address.state,
          toCountry: address.country ?? "US",
          toPostalCode: address.zip,
          toCity: address.city,
          weight: { value: weightOz, units: "ounces" },
          dimensions: { units: "inches", length: 6, width: 4, height: 4 },
          confirmation: "none",
          residential: true,
        }),
      });

      if (!ratesRes.ok) {
        throw new Error(`ShipStation rates fetch failed: ${ratesRes.status}`);
      }

      const raw = (await ratesRes.json()) as Array<{
        serviceCode: string;
        serviceName: string;
        carrierCode: string;
        shipmentCost: number;
        otherCost: number;
        transitDays?: number;
      }>;

      const rates = raw.map((r) => ({
        serviceCode: r.serviceCode,
        serviceName: r.serviceName,
        carrierCode: r.carrierCode,
        carrierName: r.carrierCode.toUpperCase().replace(/_/g, " "),
        amountCents: Math.round((r.shipmentCost + r.otherCost) * 100),
        estimatedDays: r.transitDays ?? 5,
      }));

      res.json({ rates, isLive: true });
      return;
    } catch (err) {
      logger.error({ err }, "ShipStation rates fetch failed — falling back to placeholders");
    }
  }

  res.json({ rates: PLACEHOLDER_RATES, isLive: false });
});

export default router;
