import { Router, type IRouter } from "express";
import { storage } from "../storage";
import { requireAdminSession } from "../middlewares/adminAuth";
import {
  AdminCreateCategoryBody,
  AdminUpdateCategoryBody,
  AdminUpdateCategoryParams,
  AdminDeleteCategoryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Slugs are the value stored on `products.category` and used in storefront
 * URLs, so they are constrained here rather than accepting whatever the admin
 * typed. Names are free text.
 */
function invalidSlug(slug: string): string | null {
  if (slug.length < 2 || slug.length > 60) {
    return "Slug must be between 2 and 60 characters.";
  }
  if (!SLUG.test(slug)) {
    return "Slug may contain only lowercase letters, numbers and single hyphens.";
  }
  return null;
}

// Public — the storefront's category nav. `productCount` is stripped: it is an
// admin-only figure and counts inactive products too, so publishing it would
// promise a category has stock it does not show.
router.get("/categories", async (_req, res): Promise<void> => {
  const { data } = await storage.listCategories({ activeOnly: true });
  res.json({
    data: data.map(({ productCount: _productCount, ...category }) => category),
  });
});

router.get(
  "/admin/categories",
  requireAdminSession,
  async (_req, res): Promise<void> => {
    const [categories, unmanaged] = await Promise.all([
      storage.listCategories(),
      storage.listUnmanagedCategorySlugs(),
    ]);
    res.json({ ...categories, unmanaged });
  },
);

router.post(
  "/admin/categories",
  requireAdminSession,
  async (req, res): Promise<void> => {
    const parsed = AdminCreateCategoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { slug, name, description, imageKey, sortOrder } = parsed.data;

    const slugError = invalidSlug(slug);
    if (slugError) {
      res.status(400).json({ error: slugError });
      return;
    }
    if (!name.trim()) {
      res.status(400).json({ error: "Name is required." });
      return;
    }

    if (await storage.getCategory(slug)) {
      res.status(409).json({ error: `The slug "${slug}" is already in use.` });
      return;
    }

    const created = await storage.createCategory({
      slug,
      name: name.trim(),
      description: description ?? null,
      imageKey: imageKey ?? null,
      sortOrder: sortOrder ?? 0,
    });

    res.status(201).json(created);
  },
);

router.patch(
  "/admin/categories/:slug",
  requireAdminSession,
  async (req, res): Promise<void> => {
    const params = AdminUpdateCategoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = AdminUpdateCategoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const currentSlug = params.data.slug;
    const { slug: nextSlug, name, description, imageKey, sortOrder, active } =
      parsed.data;

    if (!(await storage.getCategory(currentSlug))) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    // Renaming happens first: everything after it addresses the new slug.
    let slug = currentSlug;
    if (nextSlug !== undefined && nextSlug !== currentSlug) {
      const slugError = invalidSlug(nextSlug);
      if (slugError) {
        res.status(400).json({ error: slugError });
        return;
      }
      if (await storage.getCategory(nextSlug)) {
        res
          .status(409)
          .json({ error: `The slug "${nextSlug}" is already in use.` });
        return;
      }
      await storage.renameCategorySlug(currentSlug, nextSlug);
      slug = nextSlug;
    }

    const updated = await storage.updateCategory(slug, {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(imageKey !== undefined ? { imageKey } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
      ...(active !== undefined ? { active } : {}),
    });

    if (!updated) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    res.json(updated);
  },
);

router.delete(
  "/admin/categories/:slug",
  requireAdminSession,
  async (req, res): Promise<void> => {
    const params = AdminDeleteCategoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    // Products on this category are not deleted — they keep selling, just
    // uncategorised. deleteCategory clears the slug from them in the same
    // transaction.
    const deleted = await storage.deleteCategory(params.data.slug);
    if (!deleted) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    res.json(deleted);
  },
);

export default router;
