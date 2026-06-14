import { useCart } from "@/lib/cart-context";
import { useCreateCheckout } from "@workspace/api-client-react";
import { Link } from "wouter";
import { getProductImage } from "@/lib/image-map";
import { Minus, Plus, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-4xl md:text-5xl font-display font-light tracking-tight mb-6">Your Regimen is Empty</h1>
          <p className="text-muted-foreground font-light mb-10 max-w-md mx-auto leading-relaxed">
            True longevity requires commitment. Select your clinical-grade formulations to begin your protocol.
          </p>
          <Link href="/products" className="inline-flex items-center justify-center px-8 py-4 bg-foreground text-background text-sm font-semibold uppercase tracking-widest hover:bg-primary transition-colors duration-500">
            Explore Collection
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
        <header className="mb-16 border-b border-border pb-8">
          <h1 className="text-4xl md:text-5xl font-display font-light tracking-tight">Active Protocol</h1>
        </header>

        <div className="grid lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <div className="hidden md:grid grid-cols-12 gap-6 border-b border-border pb-4 mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <div className="col-span-6">Formulation</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-3 text-right">Total</div>
            </div>

            <div className="space-y-8">
              <AnimatePresence>
                {items.map((item, idx) => (
                  <motion.div 
                    key={item.priceId}
                    layout
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-6 border-b border-border/50 group"
                  >
                    <div className="col-span-1 md:col-span-6 flex gap-6 items-center">
                      <Link href={`/products/${item.productId}`} className="w-24 h-32 bg-secondary/10 shrink-0 border border-border/50 p-2 relative overflow-hidden flex items-center justify-center">
                        <img 
                          src={getProductImage(item.productName)} 
                          alt={item.productName}
                          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-screen"
                        />
                      </Link>
                      <div className="flex flex-col">
                        <Link href={`/products/${item.productId}`} className="hover:text-primary transition-colors mb-2">
                          <h3 className="font-display font-medium text-lg leading-tight tracking-wide">{item.productName}</h3>
                        </Link>
                        <span className="text-sm font-light text-muted-foreground">
                          ${(item.unitAmount / 100).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => removeItem(item.priceId)}
                          className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground hover:text-destructive transition-colors mt-4 text-left w-fit flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 flex md:justify-center">
                      <div className="flex items-center border border-border w-fit">
                        <button 
                          className="p-3 hover:bg-secondary/20 transition-colors text-muted-foreground"
                          onClick={() => updateQuantity(item.priceId, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="w-10 text-center font-medium text-sm">{item.quantity}</div>
                        <button 
                          className="p-3 hover:bg-secondary/20 transition-colors text-muted-foreground"
                          onClick={() => updateQuantity(item.priceId, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-3 md:text-right font-light text-lg tracking-wide">
                      ${((item.unitAmount * item.quantity) / 100).toFixed(2)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-secondary/5 border border-border p-8 lg:p-10 sticky top-32">
              <h2 className="font-sans font-semibold uppercase tracking-[0.2em] text-xs mb-8">Protocol Summary</h2>
              
              <div className="space-y-4 mb-8 text-sm font-light border-b border-border pb-8">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({itemCount} formulations)</span>
                  <span className="text-foreground">${(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Priority Shipping</span>
                  <span className="text-foreground">Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-10">
                <span className="font-semibold uppercase tracking-[0.1em] text-sm">Estimated Total</span>
                <span className="text-3xl font-display font-light tracking-tight">${(subtotal / 100).toFixed(2)}</span>
              </div>

              <button 
                className="w-full relative group overflow-hidden bg-foreground text-background py-5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={handleCheckout}
                disabled={createCheckout.isPending}
              >
                <div className="absolute inset-0 bg-primary translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]" />
                <span className="relative z-10 text-sm font-semibold uppercase tracking-widest group-hover:text-white transition-colors duration-500 flex items-center">
                  {createCheckout.isPending ? "Processing..." : "Initiate Checkout"}
                  {!createCheckout.isPending && <ArrowRight className="w-4 h-4 ml-2" />}
                </span>
              </button>
              
              <p className="text-[10px] text-center text-muted-foreground mt-6 uppercase tracking-[0.1em]">
                Secure clinical dispatch via Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
