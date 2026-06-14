import { useGetProduct } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { getProductImage } from "@/lib/image-map";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart-context";
import { Minus, Plus, ShoppingBag, ArrowLeft, Hexagon } from "lucide-react";
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
      queryKey: ["getProduct", id] // simplified key for this task
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <Skeleton className="w-full aspect-square rounded-2xl" />
          <div className="space-y-6 pt-8">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Button asChild>
          <Link href="/products">Back to Products</Link>
        </Button>
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
      title: "Added to Cart",
      description: `${quantity}x ${product.name} added to your cart.`,
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <Link href="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors font-medium tracking-wide uppercase text-sm">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Catalog
      </Link>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-border rounded-3xl p-8 flex items-center justify-center aspect-square relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/5 mix-blend-multiply" />
          <img 
            src={getProductImage(product.name)} 
            alt={product.name} 
            className="w-full h-full object-contain drop-shadow-2xl relative z-10" 
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <div className="mb-8">
            {product.category && (
              <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block">
                {product.category}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight uppercase leading-tight mb-4">
              {product.name}
            </h1>
            <div className="text-3xl font-light tracking-tight">{priceDisplay}</div>
          </div>

          <div className="prose prose-lg dark:prose-invert mb-10 text-muted-foreground">
            {product.description ? (
              <p className="leading-relaxed">{product.description}</p>
            ) : (
              <p className="leading-relaxed">Premium Copper Peptide formulation designed for optimal absorption and cellular rejuvenation.</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="font-display font-bold uppercase tracking-wider text-sm">Quantity</span>
              <div className="flex items-center border border-border rounded-lg bg-card">
                <button 
                  className="p-3 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-12 text-center font-medium">{quantity}</div>
                <button 
                  className="p-3 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  onClick={() => setQuantity(q => q + 1)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
              <Button 
                size="lg" 
                className="flex-1 h-14 text-lg font-bold tracking-wide uppercase" 
                onClick={handleAddToCart}
                disabled={!price}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>

          <div className="mt-12 p-6 bg-muted/50 rounded-2xl border border-border">
            <h3 className="font-display font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Hexagon className="w-5 h-5 text-primary" />
              Usage Instructions
            </h3>
            <p className="text-sm text-muted-foreground">
              Apply to clean, dry skin. Allow complete absorption before layering other products. For best results, use consistently as part of your daily protocol.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
