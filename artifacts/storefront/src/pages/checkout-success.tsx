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
      <div className="absolute inset-0 mesh-gradient opacity-80" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl w-full text-center relative z-10 glass-card p-16 rounded-2xl"
      >
        <div className="w-28 h-28 rounded-full border border-primary/20 flex items-center justify-center mx-auto mb-10 bg-white shadow-xl shadow-primary/5 text-primary">
          <Check className="w-12 h-12" strokeWidth={1.5} />
        </div>
        
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-6 block">Order Confirmed</span>
        <h1 className="text-6xl md:text-7xl font-display font-light tracking-tight mb-8 leading-tight">
          Protocol <span className="font-medium italic text-copper-gradient">Initiated.</span>
        </h1>
        
        <p className="text-muted-foreground text-lg mb-12 font-light leading-relaxed max-w-lg mx-auto">
          Your allocation has been secured. Our laboratory is preparing your clinical-grade formulations for priority dispatch.
        </p>
        
        <Link href="/products" className="inline-flex items-center justify-center px-10 py-5 bg-foreground text-background text-sm font-bold uppercase tracking-widest hover:bg-primary transition-colors duration-500 rounded-sm shadow-xl shadow-foreground/5">
          Return to Collection
        </Link>
      </motion.div>
    </div>
  );
}
