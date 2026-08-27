import React, { useState } from "react";
import {
  useAdminListCategories,
  useAdminCreateCategory,
  useAdminUpdateCategory,
  useAdminDeleteCategory,
  getAdminListCategoriesQueryKey,
  getAdminListProductsQueryKey,
  type AdminCategory,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Pencil, Trash2, Tags, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/** "Facial Serums" -> "facial-serums", matching the server's slug rule. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface FormState {
  slug: string;
  name: string;
  description: string;
  sortOrder: string;
  active: boolean;
}

const EMPTY: FormState = {
  slug: "",
  name: "",
  description: "",
  sortOrder: "0",
  active: true,
};

export default function Categories() {
  const { data, isLoading } = useAdminListCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createCategory = useAdminCreateCategory();
  const updateCategory = useAdminUpdateCategory();
  const deleteCategory = useAdminDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminCategory | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getAdminListCategoriesQueryKey() });
    // A rename or a delete rewrites products.category, so the product list is
    // stale too.
    queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
  };

  const openCreate = (slug = "", name = "") => {
    setEditing(null);
    setForm({ ...EMPTY, slug, name: name || slug });
    setSlugTouched(Boolean(slug));
    setDialogOpen(true);
  };

  const openEdit = (category: AdminCategory) => {
    setEditing(category);
    setForm({
      slug: category.slug,
      name: category.name,
      description: category.description ?? "",
      sortOrder: String(category.sortOrder),
      active: category.active,
    });
    setSlugTouched(true);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      slug: form.slug,
      name: form.name.trim(),
      description: form.description.trim(),
      sortOrder: Number(form.sortOrder) || 0,
    };

    try {
      if (editing) {
        await updateCategory.mutateAsync({
          slug: editing.slug,
          data: { ...payload, active: form.active },
        });
        toast({ title: "Category updated" });
      } else {
        await createCategory.mutateAsync({ data: payload });
        toast({ title: "Category created" });
      }
      setDialogOpen(false);
      refresh();
    } catch (error) {
      toast({
        title: editing ? "Could not update category" : "Could not create category",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteCategory.mutateAsync({ slug: pendingDelete.slug });
      toast({
        title: "Category deleted",
        description:
          pendingDelete.productCount > 0
            ? `${pendingDelete.productCount} product(s) are now uncategorised.`
            : undefined,
      });
      refresh();
    } catch (error) {
      toast({ title: "Could not delete category", variant: "destructive" });
    } finally {
      setPendingDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const categories = data?.data ?? [];
  const unmanaged = data?.unmanaged ?? [];
  const saving = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">
            The category list the storefront filters by.
          </p>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {unmanaged.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Categories in use but not on this list</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              These slugs are set on products but have no category row, so they
              cannot be renamed or reordered. Add them to bring them under
              management.
            </p>
            <div className="flex flex-wrap gap-2">
              {unmanaged.map((slug) => (
                <Button
                  key={slug}
                  size="sm"
                  variant="outline"
                  onClick={() => openCreate(slug)}
                >
                  <Plus className="mr-1 h-3 w-3" /> {slug}
                </Button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.slug}>
                <TableCell className="text-muted-foreground">
                  {category.sortOrder}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{category.name}</div>
                  {category.description && (
                    <div className="text-xs text-muted-foreground truncate max-w-[280px]">
                      {category.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {category.slug}
                  </code>
                </TableCell>
                <TableCell>{category.productCount}</TableCell>
                <TableCell>
                  <Badge variant={category.active ? "default" : "secondary"}>
                    {category.active ? "Active" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(category)}
                  >
                    <span className="sr-only">Edit {category.name}</span>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPendingDelete(category)}
                  >
                    <span className="sr-only">Delete {category.name}</span>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Tags className="h-6 w-6" />
                    No categories yet.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? `Edit ${editing.name}` : "Create Category"}
              </DialogTitle>
              {editing && (
                <DialogDescription>
                  Changing the slug moves all {editing.productCount} product(s)
                  on it, but any storefront link using the old slug will break.
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: slugTouched ? f.slug : slugify(name),
                    }));
                  }}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers and hyphens. Used in storefront URLs.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first.
                </p>
              </div>

              {editing && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={form.active}
                    onCheckedChange={(active) =>
                      setForm((f) => ({ ...f, active }))
                    }
                  />
                  <Label htmlFor="active">
                    Visible on the storefront
                  </Label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save changes" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {pendingDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && pendingDelete.productCount > 0
                ? `${pendingDelete.productCount} product(s) will become uncategorised. They stay on sale.`
                : "This category has no products on it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
