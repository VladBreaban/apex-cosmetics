import React from "react";
import { useParams, Link } from "wouter";
import { useAdminGetUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, User, Mail, Calendar, CreditCard, ShoppingBag } from "lucide-react";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useAdminGetUser(id || "");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return <div>Customer not found</div>;

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
          <p className="text-muted-foreground mt-1">ID: {user.id}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><User className="h-4 w-4"/> Name</p>
                <p className="font-medium text-lg">{user.name || "Not provided"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4"/> Email</p>
                <p className="font-medium text-lg">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> Member Since</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CreditCard className="h-4 w-4"/> Stripe Customer ID</p>
                <p className="font-mono text-sm">{user.stripeCustomerId || "None"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader>
            <CardTitle className="text-primary-foreground">Lifetime Value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-primary-foreground/80 mb-1">Total Spent</p>
              <p className="text-4xl font-bold">{formatCurrency(user.totalSpent || 0)}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-primary-foreground/10 rounded-lg p-3">
                <p className="text-xs text-primary-foreground/80 mb-1 flex items-center gap-1"><ShoppingBag className="h-3 w-3"/> Total Orders</p>
                <p className="text-xl font-bold">{user.totalOrders || 0}</p>
              </div>
              <div className="flex-1 bg-primary-foreground/10 rounded-lg p-3">
                <p className="text-xs text-primary-foreground/80 mb-1">Avg Order</p>
                <p className="text-xl font-bold">
                  {(user.totalOrders || 0) > 0 ? formatCurrency((user.totalSpent || 0) / (user.totalOrders || 1)) : "$0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
                Recent orders placed by this customer
            </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="h-32 flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground text-sm">
                  View full order history in the Orders tab by filtering for {user.email}
              </div>
          </CardContent>
      </Card>
    </div>
  );
}