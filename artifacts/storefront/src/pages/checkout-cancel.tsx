import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutCancel() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-3xl p-8 md:p-12 max-w-lg w-full text-center"
      >
        <div className="flex justify-center mb-6">
          <XCircle className="w-16 h-16 text-muted-foreground" />
        </div>
        
        <h1 className="text-3xl font-display font-extrabold uppercase tracking-tight mb-4">Checkout Cancelled</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Your order was not completed. Your items remain in your cart when you're ready to proceed.
        </p>
        
        <div className="flex flex-col gap-4">
          <Button asChild size="lg" className="w-full h-14 font-bold uppercase tracking-wide">
            <Link href="/cart">Return to Cart</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full h-14 font-bold uppercase tracking-wide">
            <Link href="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse Catalog
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
