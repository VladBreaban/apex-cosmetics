import React, { useState } from "react";
import {
  useAdminListDiscounts,
  useAdminCreateDiscount,
  useAdminDeactivateDiscount,
  getAdminListDiscountsQueryKey,
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
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Tag, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type DiscountType = "percentage" | "fixed";
type LimitModel = "per_customer" | "first_time" | "global";

const LIMIT_LABELS: Record<LimitModel, string> = {
  per_customer: "Once per customer",
  first_time: "New customers only",
  global: "Global cap",
};

const EMPTY_FORM = {
  code: "",
  discountType: "percentage" as DiscountType,
  percentOff: "",
  amountOff: "",
  limitModel: "global" as LimitModel,
  maxRedemptions: "",
  minimumAmount: "",
  expiresAt: "",
};

export default function Discounts() {
  const { data, isLoading } = useAdminListDiscounts();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createDiscount = useAdminCreateDiscount();
  const deactivateDiscount = useAdminDeactivateDiscount();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getAdminListDiscountsQueryKey() });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDiscount.mutateAsync({
        data: {
          code: formData.code.trim(),
          discountType: formData.discountType,
          percentOff:
            formData.discountType === "percentage"
              ? Number(formData.percentOff)
              : undefined,
          amountOff:
            formData.discountType === "fixed"
              ? Math.round(Number(formData.amountOff) * 100)
              : undefined,
          limitModel: formData.limitModel,
          maxRedemptions:
            formData.limitModel === "global" && formData.maxRedemptions
              ? Number(formData.maxRedemptions)
              : undefined,
          minimumAmount: formData.minimumAmount
            ? Math.round(Number(formData.minimumAmount) * 100)
            : undefined,
          expiresAt: formData.expiresAt
            ? new Date(formData.expiresAt).toISOString()
            : undefined,
        },
      });
      toast({ title: "Discount code created" });
      setIsCreateOpen(false);
      setFormData(EMPTY_FORM);
      invalidate();
    } catch {
      toast({ title: "Error creating discount", variant: "destructive" });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateDiscount.mutateAsync({ id });
      toast({ title: "Discount deactivated" });
      invalidate();
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  const discounts = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discount Codes</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage promotional codes for the storefront.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Discount Code</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="SUMMER20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(v) =>
                      setFormData({ ...formData, discountType: v as DiscountType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {formData.discountType === "percentage" ? (
                    <>
                      <Label htmlFor="percentOff">Percent off</Label>
                      <Input
                        id="percentOff"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.percentOff}
                        onChange={(e) =>
                          setFormData({ ...formData, percentOff: e.target.value })
                        }
                        placeholder="20"
                        required
                      />
                    </>
                  ) : (
                    <>
                      <Label htmlFor="amountOff">Amount off ($)</Label>
                      <Input
                        id="amountOff"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amountOff}
                        onChange={(e) =>
                          setFormData({ ...formData, amountOff: e.target.value })
                        }
                        placeholder="10.00"
                        required
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Usage limit</Label>
                <Select
                  value={formData.limitModel}
                  onValueChange={(v) =>
                    setFormData({ ...formData, limitModel: v as LimitModel })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_customer">
                      Once per customer
                    </SelectItem>
                    <SelectItem value="first_time">New customers only</SelectItem>
                    <SelectItem value="global">Global cap</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.limitModel === "global" && (
                <div className="space-y-2">
                  <Label htmlFor="maxRedemptions">Max total redemptions</Label>
                  <Input
                    id="maxRedemptions"
                    type="number"
                    min="1"
                    value={formData.maxRedemptions}
                    onChange={(e) =>
                      setFormData({ ...formData, maxRedemptions: e.target.value })
                    }
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumAmount">Min order ($)</Label>
                  <Input
                    id="minimumAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimumAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumAmount: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiresAt: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createDiscount.isPending}>
                  {createDiscount.isPending ? "Creating..." : "Create Code"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage limit</TableHead>
              <TableHead>Redeemed</TableHead>
              <TableHead>Min order</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : discounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  No discount codes yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              discounts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      {d.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    {d.discountType === "percentage"
                      ? `${d.percentOff}%`
                      : formatCurrency(d.amountOff ?? 0)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {LIMIT_LABELS[(d.limitModel as LimitModel) ?? "global"]}
                    {d.limitModel === "global" && d.maxRedemptions != null
                      ? ` (${d.maxRedemptions})`
                      : ""}
                  </TableCell>
                  <TableCell>{d.timesRedeemed ?? 0}</TableCell>
                  <TableCell>
                    {d.minimumAmount != null
                      ? formatCurrency(d.minimumAmount)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {d.expiresAt
                      ? new Date(d.expiresAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.active ? "default" : "secondary"}>
                      {d.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {d.active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivate(d.id)}
                        disabled={deactivateDiscount.isPending}
                      >
                        <Ban className="mr-1.5 h-3.5 w-3.5" /> Deactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
