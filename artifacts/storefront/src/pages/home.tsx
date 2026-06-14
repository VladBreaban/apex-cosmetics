import { useListFeaturedProducts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { getProductImage } from "@/lib/image-map";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Hexagon, ShieldCheck, Microscope, Zap } from "lucide-react";

export default function Home() {
  const { data: featured, isLoading } = useListFeaturedProducts();

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-card overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          <svg className="absolute w-full h-full opacity-[0.03] text-primary" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                <path d="M25 0l25 14.4v28.9L25 57.7 0 43.4V14.4z" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
          </svg>
        </div>

        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 uppercase tracking-wider">
                <Microscope className="w-4 h-4" />
                <span>Clinically Proven</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight mb-6 leading-[1.1]">
                <span className="block text-foreground">Defy Time.</span>
                <span className="block text-primary">Master Biology.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Experience the restorative power of GHK-Cu Copper Peptides. 
                Our premium formulations penetrate deep to rejuvenate skin and hair at the cellular level.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="h-14 px-8 text-lg font-bold tracking-wide uppercase">
                  <Link href="/products">
                    Shop Collection
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg font-bold tracking-wide uppercase">
                  <Link href="#science">
                    The Science
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="relative hidden md:flex justify-center"
            >
              <div className="relative w-[400px] h-[500px]">
                <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-6 transform origin-bottom-left" />
                <div className="absolute inset-0 bg-background border border-border rounded-3xl shadow-2xl p-8 flex items-center justify-center overflow-hidden">
                   <img 
                    src={getProductImage("Facial Serum")} 
                    alt="Apex Health Facial Serum" 
                    className="w-full h-auto object-contain max-h-[400px] drop-shadow-2xl hover:scale-105 transition-transform duration-700" 
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-border bg-card py-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="flex flex-col items-center gap-3 pt-6 md:pt-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Microscope className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-wide">1% GHK-Cu Concentration</h3>
              <p className="text-sm text-muted-foreground max-w-[250px]">Maximum clinical efficacy for visible regeneration.</p>
            </div>
            <div className="flex flex-col items-center gap-3 pt-6 md:pt-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-wide">Dermatologist Tested</h3>
              <p className="text-sm text-muted-foreground max-w-[250px]">Rigorous testing ensures safety for sensitive profiles.</p>
            </div>
            <div className="flex flex-col items-center gap-3 pt-6 md:pt-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-wide">Fast Absorption</h3>
              <p className="text-sm text-muted-foreground max-w-[250px]">Advanced delivery system for immediate cellular uptake.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4">Core Formulations</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Our signature Copper Peptide lineup. Engineered to restore, protect, and enhance your natural biology.
              </p>
            </div>
            <Button variant="outline" asChild className="uppercase tracking-wide font-bold">
              <Link href="/products">View All Formulations</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full aspect-[4/5] rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))
            ) : (
              featured?.data?.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group"
                >
                  <Link href={`/products/${product.id}`} className="block relative bg-card border border-border rounded-xl overflow-hidden aspect-[4/5] mb-4">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                    <img 
                      src={getProductImage(product.name)} 
                      alt={product.name} 
                      className="w-full h-full object-cover p-8 transform group-hover:scale-105 transition-transform duration-500 relative z-10" 
                    />
                  </Link>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Link href={`/products/${product.id}`} className="block">
                        <h3 className="text-xl font-display font-bold uppercase tracking-tight group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <span className="font-bold text-lg">
                        {product.prices?.[0] ? `$${(product.prices[0].unitAmount / 100).toFixed(2)}` : 'N/A'}
                      </span>
                    </div>
                    {product.category && (
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {product.category}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* The Science section */}
      <section id="science" className="py-24 bg-card text-foreground border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <Hexagon className="w-[800px] h-[800px] absolute -top-[400px] -right-[400px] text-primary" strokeWidth={0.5} />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Hexagon className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-8">The Apex Difference</h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
              GHK-Cu (Copper Peptide) is a naturally occurring human tri-peptide. At age 20, the blood plasma level of GHK-Cu is about 200 ng/mL. By age 60, it drops to 80 ng/mL.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Our clinical-grade formulations replenish this vital molecule, signaling your cells to increase collagen production, reduce inflammation, and accelerate tissue repair. The result is fundamentally healthier, stronger skin and hair.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
