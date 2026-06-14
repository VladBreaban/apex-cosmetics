import { useListFeaturedProducts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { getProductImage } from "@/lib/image-map";
import { motion, useScroll, useTransform } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Sparkles, Activity, Droplets } from "lucide-react";
import { useRef } from "react";

export default function Home() {
  const { data: featured, isLoading } = useListFeaturedProducts();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[100dvh] flex items-center overflow-hidden bg-background pt-20">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
        
        {/* Abstract animated background elements */}
        <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 mix-blend-multiply dark:mix-blend-screen" />

        <div className="container mx-auto px-6 lg:px-12 relative z-10 h-full flex flex-col justify-center">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center h-full">
            <motion.div 
              style={{ y: y1, opacity }}
              className="max-w-2xl pt-12 lg:pt-0"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-3 mb-8"
              >
                <span className="h-px w-8 bg-primary block" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Clinical Grade Biotech</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-6xl md:text-7xl lg:text-[5.5rem] font-display font-light leading-[1.05] tracking-tight mb-8"
              >
                The future of <br/>
                <span className="font-medium italic text-primary">longevity</span> <br/>
                is here.
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg text-muted-foreground mb-12 leading-relaxed max-w-xl font-light"
              >
                Experience the restorative power of GHK-Cu Copper Peptides. Our cellular-level formulations deliver visible rejuvenation where true beauty begins.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row gap-6"
              >
                <Link href="/products" className="group relative inline-flex items-center justify-center px-8 py-4 bg-foreground text-background overflow-hidden">
                  <div className="absolute inset-0 bg-primary translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]" />
                  <span className="relative z-10 text-sm font-semibold uppercase tracking-widest group-hover:text-white transition-colors duration-500">
                    Explore Collection
                  </span>
                </Link>
                <Link href="#science" className="group inline-flex items-center justify-center px-8 py-4 bg-transparent border border-border text-foreground hover:border-foreground transition-colors duration-500">
                  <span className="text-sm font-semibold uppercase tracking-widest">
                    The Science
                  </span>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block h-[800px]"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-2xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[650px] overflow-hidden rounded-[2rem] border border-border/50 bg-white/5 backdrop-blur-sm shadow-2xl">
                <img 
                  src={getProductImage("Facial Serum")} 
                  alt="Apex Health Facial Serum" 
                  className="w-full h-full object-cover scale-110 object-center mix-blend-multiply dark:mix-blend-screen opacity-90" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-32 bg-secondary/30 relative">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4 block">Curated</span>
              <h2 className="text-4xl md:text-5xl font-display font-medium tracking-tight mb-6">Core Protocols</h2>
              <p className="text-muted-foreground font-light text-lg">
                Our signature Copper Peptide lineup. Engineered to restore, protect, and enhance your natural biology.
              </p>
            </div>
            <Link href="/products" className="group inline-flex items-center text-sm font-semibold uppercase tracking-widest text-foreground hover:text-primary transition-colors">
              View All 
              <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-6">
                  <Skeleton className="w-full aspect-[3/4] rounded-none" />
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))
            ) : (
              featured?.data?.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative"
                >
                  <Link href={`/products/${product.id}`} className="block relative bg-white dark:bg-black/20 overflow-hidden aspect-[3/4] mb-6 shadow-sm border border-border/50 group-hover:border-primary/30 transition-colors duration-500">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                    <img 
                      src={getProductImage(product.name)} 
                      alt={product.name} 
                      className="w-full h-full object-contain p-10 transform group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1] relative" 
                    />
                  </Link>
                  <div className="flex flex-col">
                    {product.category && (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                        {product.category}
                      </span>
                    )}
                    <Link href={`/products/${product.id}`} className="block mb-2">
                      <h3 className="text-xl font-display font-medium tracking-wide group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <span className="font-sans text-sm text-muted-foreground">
                      {product.prices?.[0] ? `$${(product.prices[0].unitAmount / 100).toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* The Science section */}
      <section id="science" className="py-32 bg-background relative overflow-hidden border-t border-border">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/10 -skew-x-12 translate-x-20 z-0" />
        
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative aspect-square max-w-md mx-auto lg:mx-0 w-full"
            >
              <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse-slow" />
              <div className="absolute inset-8 bg-blue-400/10 rounded-full blur-xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-32 h-32 text-primary opacity-80" strokeWidth={1} />
              </div>
            </motion.div>
            
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-6 block">The Innovation</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-light tracking-tight mb-10 leading-[1.1]">
                The molecule of <br/><span className="font-medium italic">regeneration.</span>
              </h2>
              
              <div className="space-y-8 font-light text-muted-foreground leading-relaxed text-lg mb-12">
                <p>
                  GHK-Cu (Copper Peptide) is a naturally occurring human tri-peptide. At age 20, the blood plasma level of GHK-Cu is about 200 ng/mL. By age 60, it drops to 80 ng/mL.
                </p>
                <p>
                  Our clinical-grade formulations replenish this vital molecule, signaling your cells to increase collagen production, reduce inflammation, and accelerate tissue repair. The result is fundamentally healthier, stronger skin and hair.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-8 border-t border-border pt-10">
                <div>
                  <Activity className="w-6 h-6 text-primary mb-4" strokeWidth={1.5} />
                  <h4 className="font-sans font-semibold text-sm uppercase tracking-wider mb-2">Cellular Repair</h4>
                  <p className="text-sm font-light text-muted-foreground">Stimulates blood vessel and nerve outgrowth</p>
                </div>
                <div>
                  <Droplets className="w-6 h-6 text-primary mb-4" strokeWidth={1.5} />
                  <h4 className="font-sans font-semibold text-sm uppercase tracking-wider mb-2">Deep Hydration</h4>
                  <p className="text-sm font-light text-muted-foreground">Increases natural moisturizing factors</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
