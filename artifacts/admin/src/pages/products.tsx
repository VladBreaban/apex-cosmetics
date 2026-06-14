import React, { useState } from "react";
import { Link } from "wouter";
import { useAdminListProducts, useAdminCreateProduct, useAdminUpdateProduct, useAdminDeactivateProduct, getAdminListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Plus, Edit, Trash2, DollarSign, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function Products() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading } = useAdminListProducts({ limit, offset: (page - 1) * limit });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProduct = useAdminCreateProduct();
  const updateProduct = useAdminUpdateProduct();
  const deactivateProduct = useAdminDeactivateProduct();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unitAmount: "",
    category: "",
    imageKey: "",
    featured: false
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct.mutateAsync({
        data: {
          name: formData.name,
          description: formData.description,
          unitAmount: parseInt(formData.unitAmount) * 100, // Handle dollars to cents
          category: formData.category,
          imageKey: formData.imageKey,
          featured: formData.featured
        }
      });
      toast({ title: "Product created successfully" });
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
      setFormData({ name: "", description: "", unitAmount: "", category: "", imageKey: "", featured: false });
    } catch (error) {
      toast({ title: "Error creating product", variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      if (active) {
        await deactivateProduct.mutateAsync({ id });
      } else {
        await updateProduct.mutateAsync({ id, data: { active: true } });
      }
      queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
      toast({ title: `Product ${active ? 'deactivated' : 'activated'}` });
    } catch (error) {
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  const products = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your store's inventory.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Product</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Base Price ($)</Label>
                    <Input id="price" type="number" min="0" step="0.01" required value={formData.unitAmount} onChange={e => setFormData({...formData, unitAmount: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supplements">Supplements</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="apparel">Apparel</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imageKey">Image Key / URL</Label>
                  <Input id="imageKey" value={formData.imageKey} onChange={e => setFormData({...formData, imageKey: e.target.value})} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="featured" checked={formData.featured} onCheckedChange={c => setFormData({...formData, featured: c})} />
                  <Label htmlFor="featured">Featured Product</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createProduct.isPending}>
                  {createProduct.isPending ? "Creating..." : "Create Product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                    {product.imageKey ? (
                      <img src={`/assets/${product.imageKey}`} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">{product.id}</div>
                </TableCell>
                <TableCell className="capitalize">{product.category || "Uncategorized"}</TableCell>
                <TableCell>
                  {product.prices && product.prices.length > 0 
                    ? formatCurrency(product.prices[0].unitAmount) 
                    : "No price"}
                </TableCell>
                <TableCell>
                  <Badge variant={product.active ? "default" : "secondary"}>
                    {product.active ? "Active" : "Inactive"}
                  </Badge>
                  {product.featured && (
                    <Badge variant="outline" className="ml-2 text-primary border-primary/20">Featured</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/products/${product.id}/prices`}>
                          <DollarSign className="mr-2 h-4 w-4" /> Manage Prices
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleActive(product.id, product.active)}>
                        {product.active ? "Deactivate Product" : "Activate Product"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
            </PaginationItem>
            <PaginationItem>
              <div className="text-sm px-4">Page {page} of {totalPages}</div>
            </PaginationItem>
            <PaginationItem>
              <Button variant="ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}