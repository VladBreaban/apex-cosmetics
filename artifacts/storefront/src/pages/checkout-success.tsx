import { useEffect } from "react";
import { Link } from "wouter";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Hexagon } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutSuccess() {
  const { clearCart } = useCart();
  
  // Clear cart on successful checkout
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-3xl p-8 md:p-12 max-w-lg w-full text-center shadow-xl"
      >
        <div className="flex justify-center mb-8 relative">
          <Hexagon className="w-24 h-24 text-primary opacity-20 absolute -rotate-12" />
          <CheckCircle2 className="w-20 h-20 text-primary relative z-10" />
        </div>
        
        <h1 className="text-3xl font-display font-extrabold uppercase tracking-tight mb-4">Protocol Initiated</h1>
        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
          Your order has been successfully placed. Your premium formulations are being prepared for dispatch.
        </p>
        
        <div className="space-y-4">
          <Button asChild size="lg" className="w-full h-14 font-bold uppercase tracking-wide">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
