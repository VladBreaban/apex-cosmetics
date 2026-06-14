import { useEffect } from "react";
import { Link } from "wouter";
import { useCart } from "@/lib/cart-context";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutSuccess() {
  const { clearCart } = useCart();
  
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-70" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl w-full text-center relative z-10"
      >
        <div className="w-24 h-24 rounded-full border border-primary/30 flex items-center justify-center mx-auto mb-10 bg-primary/5 text-primary">
          <Check className="w-10 h-10" strokeWidth={1} />
        </div>
        
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-6 block">Order Confirmed</span>
        <h1 className="text-5xl md:text-6xl font-display font-light tracking-tight mb-8 leading-tight">
          Protocol <span className="font-medium italic">Initiated.</span>
        </h1>
        
        <p className="text-muted-foreground text-lg mb-12 font-light leading-relaxed max-w-lg mx-auto">
          Your allocation has been secured. Our laboratory is preparing your clinical-grade formulations for priority dispatch.
        </p>
        
        <Link href="/products" className="inline-flex items-center justify-center px-10 py-5 bg-foreground text-background text-sm font-semibold uppercase tracking-widest hover:bg-primary transition-colors duration-500">
          Return to Collection
        </Link>
      </motion.div>
    </div>
  );
}
