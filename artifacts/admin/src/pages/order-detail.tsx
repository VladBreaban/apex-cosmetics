import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useAdminGetOrder, useAdminUpdateOrder, getAdminGetOrderQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Mail, User, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id || "0", 10);
  const { data: order, isLoading } = useAdminGetOrder(orderId);
  const updateOrder = useAdminUpdateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<string>("");

  React.useEffect(() => {
    if (order && !status) {
      setStatus(order.status);
    }
  }, [order, status]);

  const handleStatusUpdate = async () => {
    try {
      await updateOrder.mutateAsync({ id: orderId, data: { status } });
      queryClient.setQueryData(getAdminGetOrderQueryKey(orderId), (old: any) => 
        old ? { ...old, status } : old
      );
      toast({ title: "Order status updated" });
    } catch (e) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "pending": return "secondary";
      case "refunded": return "destructive";
      case "cancelled": return "outline";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!order) return <div>Order not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order #{order.id}</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Placed on {formatDate(order.createdAt)}
              <Badge variant={getStatusColor(order.status) as any} className="capitalize ml-2">
                {order.status}
              </Badge>
            </p>
          </div>
        </div>
        
        <div className="flex items-end gap-2 bg-card p-3 rounded-lg border shadow-sm">
          <div className="space-y-1">
            <Label className="text-xs">Update Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleStatusUpdate} disabled={status === order.status || updateOrder.isPending} size="icon">
            <RefreshCw className={`h-4 w-4 ${updateOrder.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium leading-none">Name</p>
                <p className="text-sm text-muted-foreground">{order.customerName || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium leading-none">Email</p>
                <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">Total Amount</p>
                <p className="text-2xl font-bold mt-1 text-primary">{formatCurrency(order.totalAmount, order.currency)}</p>
              </div>
            </div>
            {order.stripeSessionId && (
              <div className="pt-2 border-t mt-4 text-xs text-muted-foreground font-mono truncate">
                Session: {order.stripeSessionId}
              </div>
            )}
            {order.stripePaymentIntentId && (
              <div className="text-xs text-muted-foreground font-mono truncate">
                Payment Intent: {order.stripePaymentIntentId}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>
            {order.items?.length || 0} items in this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price ID</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items && order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.priceId || "N/A"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitAmount, item.currency)}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.unitAmount * item.quantity, item.currency)}</TableCell>
                </TableRow>
              ))}
              {!order.items || order.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No items found for this order.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}