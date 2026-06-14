import { useListProducts } from "@workspace/api-client-react";
import { Link, useSearch } from "wouter";
import { getProductImage } from "@/lib/image-map";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

export default function Products() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const categoryParam = searchParams.get("category") || undefined;

  const { data: productsData, isLoading } = useListProducts({ category: categoryParam });

  const categories = ["All", "Facial", "Body", "Hair", "Bundle"];

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container mx-auto px-6 lg:px-12">
        
        <header className="mb-20 text-center max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-6 block">Our Collection</span>
            <h1 className="text-5xl md:text-6xl font-display font-light tracking-tight mb-6">
              {categoryParam ? (
                <>The <span className="font-medium italic capitalize">{categoryParam}</span> Protocol</>
              ) : (
                <>All <span className="font-medium italic">Formulations</span></>
              )}
            </h1>
            <p className="text-muted-foreground text-lg font-light leading-relaxed">
              Clinical-grade Copper Peptide treatments engineered for maximum efficacy and cellular regeneration.
            </p>
          </motion.div>
        </header>

        <div className="flex flex-col lg:flex-row gap-16">
          <aside className="w-full lg:w-48 shrink-0">
            <div className="lg:sticky lg:top-32">
              <h3 className="font-sans font-semibold uppercase tracking-[0.2em] text-xs text-muted-foreground mb-8">Categories</h3>
              <ul className="flex lg:flex-col flex-wrap gap-4 lg:gap-6">
                {categories.map((cat) => {
                  const isActive = (cat === "All" && !categoryParam) || (categoryParam?.toLowerCase() === cat.toLowerCase());
                  return (
                    <li key={cat}>
                      <Link 
                        href={cat === "All" ? "/products" : `/products?category=${cat.toLowerCase()}`}
                        className={`text-sm font-medium tracking-wide uppercase transition-all duration-300 relative py-1 ${
                          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat}
                        {isActive && (
                          <motion.div 
                            layoutId="category-indicator"
                            className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary hidden lg:block"
                            initial={false}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          <main className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <motion.div 
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <Skeleton className="w-full aspect-[3/4] rounded-none" />
                      <div className="space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </motion.div>
                  ))
                ) : productsData?.data?.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="col-span-full py-32 text-center"
                  >
                    <p className="text-xl text-muted-foreground font-light">No formulations found in this category.</p>
                  </motion.div>
                ) : (
                  productsData?.data?.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                      transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="group flex flex-col"
                    >
                      <Link href={`/products/${product.id}`} className="block relative bg-white dark:bg-black/20 overflow-hidden aspect-[3/4] mb-6 border border-border/50 group-hover:border-primary/30 transition-colors duration-500">
                        {product.featured && (
                          <div className="absolute top-4 left-4 z-20">
                            <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5">
                              Featured
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                        <img 
                          src={getProductImage(product.name)} 
                          alt={product.name} 
                          className="w-full h-full object-cover p-10 transform group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1] relative mix-blend-multiply dark:mix-blend-screen" 
                        />
                      </Link>
                      <div className="flex flex-col flex-1">
                        {product.category && (
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                            {product.category}
                          </span>
                        )}
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <Link href={`/products/${product.id}`} className="block flex-1">
                            <h3 className="text-xl font-display font-medium tracking-wide group-hover:text-primary transition-colors leading-tight">
                              {product.name}
                            </h3>
                          </Link>
                        </div>
                        <span className="font-sans text-sm text-muted-foreground mt-auto">
                          {product.prices?.[0] ? `$${(product.prices[0].unitAmount / 100).toFixed(2)}` : 'Unavailable'}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
