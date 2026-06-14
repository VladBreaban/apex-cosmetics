import { useCart } from "@/lib/cart-context";
import { Link, useLocation } from "wouter";
import { getProductImage } from "@/lib/image-map";
import { Minus, Plus, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, itemCount } = useCart();
  const [, navigate] = useLocation();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-40 pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-display font-light tracking-tight mb-8">Your Regimen is <span className="font-medium italic text-copper-gradient">Empty</span></h1>
          <p className="text-muted-foreground font-light text-lg mb-12 max-w-lg mx-auto leading-relaxed">
            True longevity requires commitment. Select your clinical-grade formulations to begin your protocol.
          </p>
          <Link href="/products" className="inline-flex items-center justify-center px-10 py-5 bg-foreground text-background text-sm font-bold uppercase tracking-widest hover:bg-primary transition-colors duration-500 rounded-sm shadow-xl shadow-foreground/5">
            Explore Collection
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-32">
      <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
        <header className="mb-20 border-b border-border/60 pb-10">
          <h1 className="text-5xl md:text-6xl font-display font-light tracking-tight">Active Protocol</h1>
        </header>

        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="hidden md:grid grid-cols-12 gap-6 border-b border-border/60 pb-4 mb-8 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
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
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-6 border-b border-border/40 group"
                  >
                    <div className="col-span-1 md:col-span-6 flex gap-6 items-center">
                      <Link href={`/products/${item.productId}`} className="w-28 h-36 bg-white rounded-sm shrink-0 border border-border/60 p-3 relative overflow-hidden flex items-center justify-center group-hover:border-primary/30 transition-colors">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img 
                          src={getProductImage(item.productName)} 
                          alt={item.productName}
                          className="w-full h-full object-contain mix-blend-multiply transform group-hover:scale-110 transition-transform duration-700"
                        />
                      </Link>
                      <div className="flex flex-col">
                        <Link href={`/products/${item.productId}`} className="hover:text-primary transition-colors mb-2">
                          <h3 className="font-display font-medium text-xl leading-tight tracking-wide">{item.productName}</h3>
                        </Link>
                        <span className="text-sm font-light text-muted-foreground">
                          ${(item.unitAmount / 100).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => removeItem(item.priceId)}
                          className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive transition-colors mt-5 text-left w-fit flex items-center gap-1.5"
                        >
                          <X className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 flex md:justify-center">
                      <div className="flex items-center border border-border/80 bg-white rounded-sm w-fit shadow-sm">
                        <button 
                          className="p-3 hover:bg-secondary transition-colors text-muted-foreground"
                          onClick={() => updateQuantity(item.priceId, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="w-12 text-center font-medium text-sm">{item.quantity}</div>
                        <button 
                          className="p-3 hover:bg-secondary transition-colors text-muted-foreground"
                          onClick={() => updateQuantity(item.priceId, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-3 md:text-right font-light text-xl tracking-wide">
                      ${((item.unitAmount * item.quantity) / 100).toFixed(2)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <div className="glass-card rounded-sm p-8 lg:p-10 sticky top-32">
              <h2 className="font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-8 text-foreground">Protocol Summary</h2>
              
              <div className="space-y-5 mb-8 text-sm font-light border-b border-border/60 pb-8">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({itemCount} formulations)</span>
                  <span className="text-foreground font-medium">${(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Priority Shipping</span>
                  <span className="text-foreground font-medium">Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-10">
                <span className="font-bold uppercase tracking-[0.15em] text-[10px] mb-1">Estimated Total</span>
                <span className="text-4xl font-display font-medium tracking-tight">${(subtotal / 100).toFixed(2)}</span>
              </div>

              <button 
                className="w-full relative group overflow-hidden bg-foreground text-background py-5 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl shadow-foreground/5"
                onClick={() => navigate("/checkout")}
              >
                <div className="absolute inset-0 bg-primary translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]" />
                <span className="relative z-10 text-sm font-bold uppercase tracking-widest group-hover:text-white transition-colors duration-500 flex items-center">
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 ml-3" />
                </span>
              </button>
              
              <p className="text-[9px] text-center text-muted-foreground mt-6 uppercase tracking-[0.2em] font-semibold">
                Secure clinical dispatch via Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
