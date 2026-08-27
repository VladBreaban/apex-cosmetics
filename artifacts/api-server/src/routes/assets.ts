import { Router, type IRouter } from "express";
import { readImage, MediaError } from "../lib/mediaStore";

const router: IRouter = Router();

/**
 * Serve an uploaded image by key.
 *
 * Public and unauthenticated: these are product photos on a storefront. Keys
 * are content-addressed, so the bytes behind one can never change and the
 * response is safe to cache immutably.
 */
router.get("/assets/:key", async (req, res): Promise<void> => {
  try {
    const { bytes, contentType } = await readImage(req.params.key);
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.send(bytes);
  } catch (err) {
    const status = err instanceof MediaError ? err.status : 500;
    res.status(status).json({ error: status === 404 ? "Not found" : "Failed to read image" });
  }
});

export default router;
