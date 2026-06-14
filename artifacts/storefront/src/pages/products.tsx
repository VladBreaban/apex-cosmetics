import { useListProducts } from "@workspace/api-client-react";
import { Link, useSearch } from "wouter";
import { getProductImage } from "@/lib/image-map";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

export default function Products() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const categoryParam = searchParams.get("category") || undefined;

  const { data: productsData, isLoading } = useListProducts({ category: categoryParam });

  const categories = ["All", "Facial", "Body", "Hair", "Bundle"];

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4 uppercase">
          {categoryParam ? `${categoryParam} Care` : "All Formulations"}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Browse our complete collection of clinical-grade Copper Peptide treatments.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24">
            <h3 className="font-display font-bold uppercase tracking-wider mb-4 text-sm">Categories</h3>
            <ul className="space-y-2">
              {categories.map((cat) => {
                const isActive = (cat === "All" && !categoryParam) || (categoryParam?.toLowerCase() === cat.toLowerCase());
                return (
                  <li key={cat}>
                    <Link 
                      href={cat === "All" ? "/products" : `/products?category=${cat.toLowerCase()}`}
                      className={`block py-2 px-3 rounded-md transition-colors ${
                        isActive 
                          ? "bg-primary text-primary-foreground font-medium" 
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <main className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full aspect-[4/5] rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))
            ) : productsData?.data?.length === 0 ? (
              <div className="col-span-full py-24 text-center">
                <p className="text-xl text-muted-foreground">No products found in this category.</p>
              </div>
            ) : (
              productsData?.data?.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group flex flex-col"
                >
                  <Link href={`/products/${product.id}`} className="block relative bg-card border border-border rounded-xl overflow-hidden aspect-[4/5] mb-4">
                    {product.featured && (
                      <Badge className="absolute top-4 left-4 z-20 bg-foreground text-background pointer-events-none uppercase tracking-wider text-[10px]">
                        Featured
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                    <img 
                      src={getProductImage(product.name)} 
                      alt={product.name} 
                      className="w-full h-full object-cover p-8 transform group-hover:scale-105 transition-transform duration-500 relative z-10" 
                    />
                  </Link>
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <Link href={`/products/${product.id}`} className="block flex-1">
                        <h3 className="text-lg font-display font-bold uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">
                          {product.name}
                        </h3>
                      </Link>
                      <span className="font-bold text-lg whitespace-nowrap">
                        {product.prices?.[0] ? `$${(product.prices[0].unitAmount / 100).toFixed(2)}` : 'N/A'}
                      </span>
                    </div>
                    {product.category && (
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-auto pt-2">
                        {product.category}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
