import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl w-full text-center"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6 block">Action Incomplete</span>
        <h1 className="text-5xl md:text-6xl font-display font-light tracking-tight mb-8">
          Checkout <span className="font-medium italic">Suspended.</span>
        </h1>
        
        <p className="text-muted-foreground text-lg mb-12 font-light leading-relaxed max-w-lg mx-auto">
          Your transaction was not finalized. Your selected formulations remain secure in your regimen for when you are ready to proceed.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/cart" className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 bg-foreground text-background text-sm font-semibold uppercase tracking-widest hover:bg-primary transition-colors duration-500">
            Return to Regimen
          </Link>
          <Link href="/products" className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 bg-transparent border border-border text-foreground text-sm font-semibold uppercase tracking-widest hover:border-foreground transition-colors duration-500">
            <ArrowLeft className="w-4 h-4 mr-3" />
            Collection
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
