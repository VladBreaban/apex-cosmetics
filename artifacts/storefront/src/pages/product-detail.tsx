import { useGetProduct } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { getProductImage } from "@/lib/image-map";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart-context";
import { Minus, Plus, ArrowLeft, Beaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function ProductDetail() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useGetProduct(id, {
    query: {
      enabled: !!id,
      queryKey: ["getProduct", id] 
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 lg:px-12 py-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <Skeleton className="w-full aspect-[3/4] rounded-none" />
          <div className="space-y-10 pt-12">
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
            </div>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-6 py-40 text-center max-w-lg">
        <h2 className="text-3xl font-display font-medium mb-6">Formulation Unavailable</h2>
        <p className="text-muted-foreground font-light mb-10">We could not locate this specific formulation. It may have been archived or replaced.</p>
        <Link href="/products" className="inline-flex items-center justify-center px-8 py-4 bg-foreground text-background text-sm font-semibold uppercase tracking-widest hover:bg-primary transition-colors duration-500">
          Return to Collection
        </Link>
      </div>
    );
  }

  const price = product.prices?.[0];
  const priceDisplay = price ? `$${(price.unitAmount / 100).toFixed(2)}` : 'Unavailable';

  const handleAddToCart = () => {
    if (!price) return;
    
    addItem({
      priceId: price.id,
      productId: product.id,
      quantity,
      productName: product.name,
      unitAmount: price.unitAmount,
      currency: price.currency,
      imageKey: null
    });

    toast({
      title: "Protocol Updated",
      description: `${quantity}x ${product.name} added to your regimen.`,
    });
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container mx-auto px-6 lg:px-12">
        <Link href="/products" className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-3" />
          Back to Collection
        </Link>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-secondary/10 border border-border/50 aspect-[3/4] relative overflow-hidden flex items-center justify-center p-12 lg:p-24"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
            <img 
              src={getProductImage(product.name)} 
              alt={product.name} 
              className="w-full h-full object-contain relative z-10 mix-blend-multiply dark:mix-blend-screen drop-shadow-2xl" 
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center py-10"
          >
            <div className="mb-10 border-b border-border pb-10">
              {product.category && (
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4 block">
                  {product.category}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-light tracking-tight leading-[1.1] mb-6">
                {product.name}
              </h1>
              <div className="text-2xl font-light text-muted-foreground tracking-wide">{priceDisplay}</div>
            </div>

            <div className="prose prose-lg dark:prose-invert font-light text-muted-foreground leading-relaxed mb-12">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p>Clinical-grade Copper Peptide formulation engineered to restore, protect, and enhance your biology at the cellular level.</p>
              )}
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Quantity</span>
                <div className="flex items-center border border-border">
                  <button 
                    className="p-4 hover:bg-secondary/20 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-12 text-center font-medium text-sm">{quantity}</div>
                  <button 
                    className="p-4 hover:bg-secondary/20 transition-colors text-muted-foreground hover:text-foreground"
                    onClick={() => setQuantity(q => q + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button 
                className="w-full relative group overflow-hidden bg-foreground text-background py-5 disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={handleAddToCart}
                disabled={!price}
              >
                <div className="absolute inset-0 bg-primary translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]" />
                <span className="relative z-10 text-sm font-semibold uppercase tracking-widest group-hover:text-white transition-colors duration-500">
                  {price ? "Add to Regimen" : "Currently Unavailable"}
                </span>
              </button>
            </div>

            <div className="mt-16 pt-10 border-t border-border">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Beaker className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] mb-2">Protocol Instructions</h3>
                  <p className="text-sm font-light text-muted-foreground leading-relaxed">
                    Apply to clean, dry skin. Allow complete absorption before layering other formulations. For optimal cellular regeneration, adhere strictly to daily protocol.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
