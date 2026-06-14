import { useCart } from "@/lib/cart-context";
import { useCreateCheckout } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getProductImage } from "@/lib/image-map";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, itemCount } = useCart();
  const createCheckout = useCreateCheckout();

  const handleCheckout = () => {
    if (items.length === 0) return;

    const currentUrl = window.location.origin;
    
    createCheckout.mutate(
      {
        data: {
          items: items.map(i => ({ priceId: i.priceId, quantity: i.quantity })),
          successUrl: `${currentUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${currentUrl}/checkout/cancel`,
        }
      },
      {
        onSuccess: (data) => {
          window.location.href = data.url;
        }
      }
    );
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-lg">
        <h1 className="text-4xl font-display font-extrabold uppercase tracking-tight mb-6">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8 text-lg">Your protocol requires premium formulations. Explore our catalog.</p>
        <Button size="lg" asChild className="h-14 px-8 text-lg font-bold uppercase tracking-wide">
          <Link href="/products">Shop Formulations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-4xl font-display font-extrabold uppercase tracking-tight mb-12">Protocol Cart</h1>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item, idx) => (
            <motion.div 
              key={item.priceId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-6 p-4 md:p-6 bg-card border border-border rounded-2xl"
            >
              <div className="w-24 md:w-32 aspect-square bg-muted rounded-xl p-2 flex items-center justify-center shrink-0">
                <img 
                  src={getProductImage(item.productName)} 
                  alt={item.productName}
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-4">
                  <Link href={`/products/${item.productId}`} className="hover:text-primary transition-colors">
                    <h3 className="font-display font-bold uppercase tracking-tight md:text-xl leading-tight">{item.productName}</h3>
                  </Link>
                  <button 
                    onClick={() => removeItem(item.priceId)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-end justify-between mt-4">
                  <div className="flex items-center border border-border rounded-lg bg-background">
                    <button 
                      className="p-2 hover:bg-muted transition-colors"
                      onClick={() => updateQuantity(item.priceId, item.quantity - 1)}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-10 text-center font-medium text-sm">{item.quantity}</div>
                    <button 
                      className="p-2 hover:bg-muted transition-colors"
                      onClick={() => updateQuantity(item.priceId, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="font-bold text-lg">
                    ${((item.unitAmount * item.quantity) / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 sticky top-24">
            <h2 className="font-display font-bold uppercase tracking-wider mb-6 pb-6 border-b border-border">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({itemCount} items)</span>
                <span>${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-6 border-t border-border mb-6">
              <span className="font-bold uppercase tracking-wider">Estimated Total</span>
              <span className="text-3xl font-light tracking-tight">${(subtotal / 100).toFixed(2)}</span>
            </div>

            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-bold uppercase tracking-wide"
              onClick={handleCheckout}
              disabled={createCheckout.isPending}
            >
              {createCheckout.isPending ? "Processing..." : "Proceed to Checkout"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
              Secure checkout processed by Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
