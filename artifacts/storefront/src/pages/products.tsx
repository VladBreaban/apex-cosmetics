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
    <div className="min-h-screen bg-background pt-32 pb-32">
      <div className="absolute top-0 left-0 right-0 h-[50vh] mesh-gradient opacity-60 pointer-events-none" />
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        
        <header className="mb-24 text-center max-w-4xl mx-auto pt-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-8 block">Our Collection</span>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-light tracking-tight mb-8">
              {categoryParam ? (
                <>The <span className="font-medium italic capitalize text-copper-gradient">{categoryParam}</span> Protocol</>
              ) : (
                <>All <span className="font-medium italic text-copper-gradient">Formulations</span></>
              )}
            </h1>
            <p className="text-muted-foreground text-xl font-light leading-relaxed max-w-2xl mx-auto">
              Clinical-grade Copper Peptide treatments engineered for maximum efficacy and cellular regeneration.
            </p>
          </motion.div>
        </header>

        <div className="flex flex-col lg:flex-row gap-20 lg:gap-32">
          <aside className="w-full lg:w-48 shrink-0">
            <div className="lg:sticky lg:top-40">
              <h3 className="font-sans font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-8">Filter by Category</h3>
              <ul className="flex lg:flex-col flex-wrap gap-4 lg:gap-6">
                {categories.map((cat) => {
                  const isActive = (cat === "All" && !categoryParam) || (categoryParam?.toLowerCase() === cat.toLowerCase());
                  return (
                    <li key={cat}>
                      <Link 
                        href={cat === "All" ? "/products" : `/products?category=${cat.toLowerCase()}`}
                        className={`text-sm font-semibold tracking-widest uppercase transition-all duration-300 relative py-2 block ${
                          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat}
                        {isActive && (
                          <motion.div 
                            layoutId="category-indicator"
                            className="absolute -left-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary hidden lg:block shadow-[0_0_8px_rgba(200,122,91,0.6)]"
                            initial={false}
                          />
                        )}
                        {/* Mobile active indicator */}
                        {isActive && (
                          <motion.div 
                            layoutId="category-indicator-mobile"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary lg:hidden"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-24">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <motion.div 
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <Skeleton className="w-full aspect-[3/4] rounded-sm" />
                      <div className="space-y-3">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </motion.div>
                  ))
                ) : productsData?.data?.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="col-span-full py-32 text-center"
                  >
                    <p className="text-2xl text-muted-foreground font-light">No formulations found in this category.</p>
                  </motion.div>
                ) : (
                  productsData?.data?.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -30 }}
                      transition={{ duration: 0.7, delay: (idx % 6) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className={`group flex flex-col ${idx % 2 === 1 ? 'sm:mt-16 xl:mt-0' : ''} ${idx % 3 === 1 ? 'xl:mt-16' : ''} ${idx % 3 === 2 ? 'xl:mt-32' : ''}`}
                    >
                      <Link href={`/products/${product.id}`} className="block relative bg-white overflow-hidden aspect-[3/4] mb-8 shadow-sm border border-border/60 rounded-sm group-hover:shadow-xl transition-all duration-700">
                        {product.featured && (
                          <div className="absolute top-5 left-5 z-20">
                            <span className="bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm rounded-sm text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 shadow-sm">
                              Featured
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 pointer-events-none" />
                        <img 
                          src={getProductImage(product.name)} 
                          alt={product.name} 
                          className="w-full h-full object-contain p-10 transform group-hover:scale-110 transition-transform duration-1000 ease-[0.16,1,0.3,1] relative mix-blend-multiply" 
                        />
                      </Link>
                      <div className="flex flex-col flex-1 px-2">
                        {product.category && (
                          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">
                            {product.category}
                          </span>
                        )}
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <Link href={`/products/${product.id}`} className="block flex-1">
                            <h3 className="text-2xl font-display font-medium tracking-wide group-hover:text-primary transition-colors leading-tight">
                              {product.name}
                            </h3>
                          </Link>
                        </div>
                        <span className="font-sans text-sm text-muted-foreground mt-auto tracking-wide">
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
