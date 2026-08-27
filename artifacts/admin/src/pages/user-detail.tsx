import React, { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import {
  useAdminGetUser,
  useAdminUpdateUser,
  useAdminSetUserPassword,
  useAdminListUserOrders,
  useAdminListUserAddresses,
  getAdminGetUserQueryKey,
  getAdminListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  CreditCard,
  ShoppingBag,
  KeyRound,
  MapPin,
  AlertTriangle,
} from "lucide-react";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const userId = id ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading } = useAdminGetUser(userId);
  const { data: orders } = useAdminListUserOrders(userId);
  const { data: addresses } = useAdminListUserAddresses(userId);

  const updateUser = useAdminUpdateUser();
  const setPassword = useAdminSetUserPassword();

  const [form, setForm] = useState({ name: "", email: "", role: "customer" });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Seed the form once the record arrives, and re-seed after a save so the
  // inputs reflect what the server actually stored (email is normalised).
  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      email: user.email,
      role: user.role ?? "customer",
    });
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 w-full md:col-span-2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return <div>Customer not found</div>;

  const emailChanged = form.email.trim().toLowerCase() !== user.email;
  const dirty =
    emailChanged ||
    form.name !== (user.name ?? "") ||
    form.role !== (user.role ?? "customer");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser.mutateAsync({
        id: userId,
        data: {
          name: form.name.trim() || null,
          email: form.email.trim().toLowerCase(),
          role: form.role as "customer" | "admin",
        },
      });
      toast({ title: "Customer updated" });
      queryClient.invalidateQueries({ queryKey: getAdminGetUserQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
    } catch (error) {
      toast({
        title: "Could not update customer",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setPassword.mutateAsync({
        id: userId,
        data: { password: newPassword },
      });
      toast({
        title: "Password set",
        description: "Pass it to the customer over a channel you trust.",
      });
      setPasswordOpen(false);
      setNewPassword("");
    } catch (error) {
      toast({
        title: "Could not set password",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const orderRows = orders?.data ?? [];
  const addressRows = addresses?.data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Profile</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">{user.id}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Member since {formatDate(user.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    placeholder="Not provided"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(role) => setForm((f) => ({ ...f, role }))}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Stripe Customer
                  </Label>
                  <p className="font-mono text-sm text-muted-foreground pt-2">
                    {user.stripeCustomerId || "None"}
                  </p>
                </div>
              </div>

              {emailChanged && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Orders are keyed by email. Saving moves this customer's{" "}
                    {orderRows.length} order(s) and their discount history to the
                    new address so nothing is orphaned.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={!dirty || updateUser.isPending}>
                  {updateUser.isPending ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPasswordOpen(true)}
                >
                  <KeyRound className="mr-2 h-4 w-4" /> Set password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader>
            <CardTitle className="text-primary-foreground">
              Lifetime Value
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-primary-foreground/80 mb-1">
                Total Spent
              </p>
              <p className="text-4xl font-bold">
                {formatCurrency(user.totalSpent || 0)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-primary-foreground/10 rounded-lg p-3">
                <p className="text-xs text-primary-foreground/80 mb-1 flex items-center gap-1">
                  <ShoppingBag className="h-3 w-3" /> Total Orders
                </p>
                <p className="text-xl font-bold">{user.totalOrders || 0}</p>
              </div>
              <div className="flex-1 bg-primary-foreground/10 rounded-lg p-3">
                <p className="text-xs text-primary-foreground/80 mb-1">
                  Avg Order
                </p>
                <p className="text-xl font-bold">
                  {(user.totalOrders || 0) > 0
                    ? formatCurrency(
                        (user.totalSpent || 0) / (user.totalOrders || 1),
                      )
                    : "$0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            Every order placed under {user.email}, including guest checkouts
            made before this account existed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderRows.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      #{order.id}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    {(order.items ?? []).reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === "paid" ? "default" : "secondary"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(order.totalAmount, order.currency)}
                  </TableCell>
                </TableRow>
              ))}
              {orderRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Saved Addresses
          </CardTitle>
          <CardDescription>
            Addresses the customer saved to their account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {addressRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved addresses.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {addressRows.map((address) => (
                <div key={address.id} className="rounded-md border p-4 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {address.label || address.name}
                    </span>
                    {address.isDefault && <Badge variant="outline">Default</Badge>}
                  </div>
                  <p className="text-muted-foreground">
                    {address.name}
                    <br />
                    {address.address1}
                    {address.address2 && (
                      <>
                        <br />
                        {address.address2}
                      </>
                    )}
                    <br />
                    {address.city}, {address.state} {address.zip}
                    <br />
                    {address.country}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleSetPassword}>
            <DialogHeader>
              <DialogTitle>Set a new password</DialogTitle>
              <DialogDescription>
                This replaces the customer's password immediately. There is no
                reset email — you have to pass the new password to them
                yourself.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="text"
                required
                minLength={8}
                autoComplete="off"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters.
              </p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={setPassword.isPending}>
                {setPassword.isPending ? "Setting..." : "Set password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
