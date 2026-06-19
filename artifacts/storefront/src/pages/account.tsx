import { Link } from "wouter";
import { Show, useUser } from "@clerk/react";
import { useGetMyOrders } from "@workspace/api-client-react";
import { ShoppingBag, Package } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
      return "bg-primary/10 text-primary border-primary/20";
    case "shipped":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "cancelled":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function OrdersList() {
  const { user } = useUser();
  const { data, isLoading, isError } = useGetMyOrders();

  const orders = data?.data ?? [];

  return (
    <div className="container mx-auto px-4 lg:px-12 pt-40 pb-32 max-w-4xl">
      <div className="mb-12">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
          Your Account
        </p>
        <h1 className="font-display text-5xl md:text-6xl text-foreground tracking-tight">
          My Orders
        </h1>
        {user?.primaryEmailAddress?.emailAddress && (
          <p className="text-muted-foreground font-light mt-4">
            Signed in as {user.primaryEmailAddress.emailAddress}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="text-muted-foreground font-light py-20 text-center">
          Loading your orders…
        </div>
      )}

      {isError && (
        <div className="text-destructive font-light py-20 text-center">
          We couldn't load your orders. Please try again later.
        </div>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <div className="text-center py-24 border border-border rounded-3xl bg-white/60">
          <Package className="w-10 h-10 mx-auto text-muted-foreground/60 mb-6" strokeWidth={1.2} />
          <p className="font-display text-3xl text-foreground mb-3">No orders yet</p>
          <p className="text-muted-foreground font-light mb-8">
            When you place an order, it will appear here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
            Shop the collection
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-border rounded-3xl bg-white/70 backdrop-blur-sm p-6 md:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-1">
                  Order #{order.id}
                </p>
                <p className="text-sm text-muted-foreground font-light">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`text-[10px] font-semibold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full border ${statusStyle(
                  order.status,
                )}`}
              >
                {order.status}
              </span>
            </div>

            <div className="space-y-3 border-t border-border pt-5">
              {(order.items ?? []).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-foreground font-light">
                    {item.productName}
                    <span className="text-muted-foreground"> × {item.quantity}</span>
                  </span>
                  <span className="text-sm text-foreground tabular-nums">
                    {formatPrice(item.unitAmount * item.quantity, item.currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-5 mt-5">
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                Total
              </span>
              <span className="font-display text-2xl text-foreground tabular-nums">
                {formatPrice(order.totalAmount, order.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignedOutPrompt() {
  return (
    <div className="container mx-auto px-4 lg:px-12 pt-40 pb-32 max-w-2xl text-center">
      <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
        Your Account
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-foreground tracking-tight mb-6">
        Sign in to view your orders
      </h1>
      <p className="text-muted-foreground font-light mb-10">
        Access your order history and track your copper peptide regimen.
      </p>
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors"
      >
        Sign in
      </Link>
    </div>
  );
}

export default function Account() {
  return (
    <>
      <Show when="signed-in">
        <OrdersList />
      </Show>
      <Show when="signed-out">
        <SignedOutPrompt />
      </Show>
    </>
  );
}
