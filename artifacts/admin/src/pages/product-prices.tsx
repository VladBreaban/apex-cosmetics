import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useAdminListPrices, useAdminCreatePrice, useAdminDeactivatePrice, getAdminListPricesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProductPrices() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useAdminListPrices({ productId: id });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPrice = useAdminCreatePrice();
  const deactivatePrice = useAdminDeactivatePrice();

  const [formData, setFormData] = useState({
    unitAmount: "",
    currency: "usd",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await createPrice.mutateAsync({
        data: {
          productId: id,
          unitAmount: parseInt(formData.unitAmount) * 100,
          currency: formData.currency
        }
      });
      toast({ title: "Price created successfully" });
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: getAdminListPricesQueryKey({ productId: id }) });
      setFormData({ unitAmount: "", currency: "usd" });
    } catch (error) {
      toast({ title: "Error creating price", variant: "destructive" });
    }
  };

  const handleDeactivate = async (priceId: string) => {
    try {
      await deactivatePrice.mutateAsync({ id: priceId });
      queryClient.invalidateQueries({ queryKey: getAdminListPricesQueryKey({ productId: id }) });
      toast({ title: "Price deactivated" });
    } catch (error) {
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const prices = data?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Prices</h1>
          <p className="text-muted-foreground mt-1">Manage pricing for {id}</p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Price
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create New Price</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Amount ($)</Label>
                  <Input id="price" type="number" min="0.01" step="0.01" required value={formData.unitAmount} onChange={e => setFormData({...formData, unitAmount: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" required value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="uppercase" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createPrice.isPending}>
                  {createPrice.isPending ? "Creating..." : "Create Price"}
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
              <TableHead>Price ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prices.map((price) => (
              <TableRow key={price.id}>
                <TableCell className="font-mono text-sm">{price.id}</TableCell>
                <TableCell className="font-medium">{formatCurrency(price.unitAmount, price.currency)}</TableCell>
                <TableCell className="uppercase">{price.currency}</TableCell>
                <TableCell>
                  <Badge variant={price.active ? "default" : "secondary"}>
                    {price.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {price.active && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeactivate(price.id)} disabled={deactivatePrice.isPending}>
                      <Trash2 className="h-4 w-4 mr-2" /> Deactivate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {prices.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No prices found for this product.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}