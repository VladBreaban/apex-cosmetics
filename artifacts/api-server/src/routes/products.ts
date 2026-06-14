import { Router, type IRouter } from "express";
import { storage } from "../storage";
import {
  ListProductsQueryParams,
  ListProductsResponse,
  ListFeaturedProductsResponse,
  GetProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { category, limit = 50, offset = 0 } = params.data;
  try {
    const result = await storage.listProductsWithPrices({
      activeOnly: true,
      category: category ?? null,
      limit: limit ?? 50,
      offset: offset ?? 0,
    });
    res.json(ListProductsResponse.parse(result));
  } catch {
    res.json(ListProductsResponse.parse({ data: [], total: 0 }));
  }
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  try {
    const result = await storage.listProductsWithPrices({
      activeOnly: true,
      featured: true,
      limit: 10,
      offset: 0,
    });
    res.json(ListFeaturedProductsResponse.parse(result));
  } catch {
    res.json(ListFeaturedProductsResponse.parse({ data: [], total: 0 }));
  }
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const product = await storage.getProductWithPrices(params.data.id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
});

export default router;
