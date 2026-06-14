import { Link } from "wouter";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background opacity-80" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl w-full text-center relative z-10 bg-white border border-border/60 p-16 rounded-sm shadow-xl"
      >
        <div className="w-20 h-20 rounded-full border border-border flex items-center justify-center mx-auto mb-10 bg-secondary/50 text-muted-foreground">
          <AlertCircle className="w-8 h-8" strokeWidth={1.5} />
        </div>
        
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-6 block">Action Incomplete</span>
        <h1 className="text-5xl md:text-6xl font-display font-light tracking-tight mb-8">
          Checkout <span className="font-medium italic">Suspended.</span>
        </h1>
        
        <p className="text-muted-foreground text-lg mb-12 font-light leading-relaxed max-w-lg mx-auto">
          Your transaction was not finalized. Your selected formulations remain secure in your regimen for when you are ready to proceed.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/cart" className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 bg-foreground text-background text-sm font-bold uppercase tracking-widest hover:bg-primary transition-colors duration-500 rounded-sm shadow-xl shadow-foreground/5">
            Return to Regimen
          </Link>
          <Link href="/products" className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 bg-transparent border border-border text-foreground text-sm font-bold uppercase tracking-widest hover:border-foreground transition-all duration-500 rounded-sm">
            <ArrowLeft className="w-4 h-4 mr-3" />
            Collection
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
