import { useListFeaturedProducts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { getProductImage } from "@/lib/image-map";
import { motion, useScroll, useTransform } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Activity, Droplets, ChevronRight } from "lucide-react";
import { useRef } from "react";
import scienceWaterPhoto from "@assets/generated_images/science_water_photo.png";
import waterDropBg from "@assets/generated_images/water_header_bg.png";

export default function Home() {
  const { data: featured, isLoading } = useListFeaturedProducts();
  const heroRef = useRef<HTMLElement>(null);
  const scienceRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const { scrollYProgress: scienceScroll } = useScroll({
    target: scienceRef,
    offset: ["start end", "end start"]
  });

  const heroY = useTransform(heroScroll, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 0.95]);

  const scienceParallaxY = useTransform(scienceScroll, [0, 1], [100, -100]);

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[100dvh] flex items-center overflow-hidden bg-background pt-20">
        <div className="absolute inset-0 mesh-gradient opacity-80" />

        {/* Water drop / ripple background */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <motion.img
            src={waterDropBg}
            alt=""
            aria-hidden="true"
            animate={{
              scale: [1.05, 1.15, 1.08, 1.05],
              x: [0, -25, 15, 0],
              y: [0, 18, -12, 0],
            }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full object-cover object-center opacity-70 mix-blend-multiply will-change-transform"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        </motion.div>

        {/* Drifting ripple accent for added motion */}
        <motion.img
          src={waterDropBg}
          alt=""
          aria-hidden="true"
          animate={{
            scale: [1.3, 1.45, 1.3],
            rotate: [0, 3, -3, 0],
            opacity: [0.18, 0.3, 0.18],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 right-0 w-[80%] h-[150%] object-contain pointer-events-none mix-blend-multiply will-change-transform"
        />
        
        {/* Animated abstract blobs for "splash" energy */}
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
            x: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 mix-blend-multiply" 
        />
        <motion.div 
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1],
            y: [0, -40, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-300/10 rounded-full blur-3xl translate-y-1/3 mix-blend-multiply" 
        />

        <div className="container mx-auto px-6 lg:px-12 relative z-10 h-full flex flex-col justify-center">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center h-full">
            <motion.div 
              style={{ y: heroY, opacity: heroOpacity }}
              className="max-w-2xl pt-12 lg:pt-0"
            >
              <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-4 mb-10"
              >
                <span className="h-px w-12 bg-primary block" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Clinical Grade Biotech</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-6xl md:text-7xl lg:text-[6rem] font-display font-light leading-[1.05] tracking-tight mb-8"
              >
                The future of <br/>
                <span className="font-medium italic text-copper-gradient pr-2">longevity</span> <br/>
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
                <Link href="/products" className="group relative inline-flex items-center justify-center px-8 py-5 bg-primary text-white overflow-hidden rounded-sm shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                  <div className="absolute inset-0 bg-primary/90 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]" />
                  <span className="relative z-10 text-sm font-bold uppercase tracking-widest text-white transition-colors duration-500">
                    Explore Collection
                  </span>
                </Link>
              </motion.div>

              {/* Mobile-only floating product showcase */}
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="lg:hidden relative mt-16 flex justify-center"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/15 via-primary/5 to-transparent blur-2xl" />
                <motion.div
                  animate={{ y: [0, -14, 0], rotate: [-1.5, 1.5, -1.5] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-[270px] h-[360px] glass-card rounded-2xl overflow-hidden shadow-2xl will-change-transform"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
                  <img
                    src={getProductImage("Facial Serum")}
                    alt="Apex Health Facial Serum"
                    className="w-full h-full object-contain p-6 mix-blend-multiply"
                  />
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div 
              style={{ scale: heroScale }}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block h-[800px] w-full"
            >
              {/* Layered visual composition */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent blur-xl" />
              
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[10%] right-[10%] w-[450px] h-[600px] glass-card rounded-2xl overflow-hidden shadow-2xl z-20"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
                <img 
                  src={getProductImage("Facial Serum")} 
                  alt="Apex Health Facial Serum" 
                  className="w-full h-full object-contain p-8 mix-blend-multiply" 
                />
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[5%] left-[5%] w-[350px] h-[450px] bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 shadow-xl overflow-hidden z-10"
              >
                <img 
                  src={getProductImage("Cleanser")} 
                  alt="Apex Health Cleanser" 
                  className="w-full h-full object-contain p-8 mix-blend-multiply opacity-90" 
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products - Editorial Style */}
      <section className="py-32 bg-secondary/20 relative z-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-4 block">Curated</span>
              <h2 className="text-5xl md:text-6xl font-display font-medium tracking-tight mb-6">Core Protocols</h2>
              <p className="text-muted-foreground font-light text-lg">
                Our signature Copper Peptide lineup. Engineered to restore, protect, and enhance your natural biology.
              </p>
            </div>
            <Link href="/products" className="group inline-flex items-center text-xs font-bold uppercase tracking-[0.2em] text-foreground hover:text-primary transition-colors pb-2 border-b border-foreground hover:border-primary">
              View All Formulations
              <ArrowRight className="ml-3 w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20 lg:gap-y-32">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-6">
                  <Skeleton className="w-full aspect-[3/4] rounded-sm" />
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
                  transition={{ duration: 0.8, delay: (idx % 3) * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className={`group relative ${idx % 2 === 1 ? 'lg:mt-24' : ''}`}
                >
                  <Link href={`/products/${product.id}`} className="block relative bg-white overflow-hidden aspect-[3/4] mb-8 shadow-sm border border-border/60 rounded-sm group-hover:shadow-xl transition-all duration-700">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 pointer-events-none" />
                    <img 
                      src={getProductImage(product.name)} 
                      alt={product.name} 
                      className="w-full h-full object-contain p-12 transform group-hover:scale-110 transition-transform duration-1000 ease-[0.16,1,0.3,1] relative mix-blend-multiply" 
                    />
                    
                    {/* Hover Overlay Detail */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 flex justify-end">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                        <ChevronRight className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </Link>
                  <div className="flex flex-col px-2">
                    {product.category && (
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">
                        {product.category}
                      </span>
                    )}
                    <Link href={`/products/${product.id}`} className="block mb-2">
                      <h3 className="text-2xl font-display font-medium tracking-wide group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <span className="font-sans text-sm text-muted-foreground tracking-wide">
                      {product.prices?.[0] ? `$${(product.prices[0].unitAmount / 100).toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* The Science section - Redesigned for splash/dynamic energy */}
      <section id="science" ref={scienceRef} className="py-40 bg-white relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-12 gap-20 items-center">
            <motion.div 
              style={{ y: scienceParallaxY }}
              className="lg:col-span-6 relative"
            >
              {/* Dynamic layered imagery instead of flat icon */}
              <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:mx-0">
                <div className="absolute inset-0 rounded-2xl border border-primary/10 shadow-2xl overflow-hidden bg-white">
                  <img
                    src={scienceWaterPhoto}
                    alt="Copper Peptide serum bottle in a dynamic water splash"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent" />
                </div>
                
                <motion.div 
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/4 -right-12 w-64 h-64 glass-card rounded-full flex items-center justify-center z-20 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-white/80"
                >
                  <div className="text-center">
                    <span className="block text-4xl font-display font-medium text-primary mb-1">GHK-Cu</span>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tripeptide</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="absolute bottom-12 -left-8 bg-white p-6 shadow-xl rounded-xl border border-border/50 z-30 flex items-center gap-5"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-display font-medium mb-1">200<span className="text-sm font-sans text-muted-foreground ml-1">ng/mL</span></div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-semibold">Optimal Baseline</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 lg:pl-10"
            >
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-6 block">The Innovation</span>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-light tracking-tight mb-10 leading-[1.05]">
                The molecule of <br/><span className="font-medium italic text-copper-gradient">regeneration.</span>
              </h2>
              
              <div className="space-y-8 font-light text-muted-foreground leading-relaxed text-lg mb-12">
                <p>
                  GHK-Cu (Copper Peptide) is a naturally occurring human tri-peptide. At age 20, the blood plasma level of GHK-Cu is about 200 ng/mL. By age 60, it drops to 80 ng/mL.
                </p>
                <p>
                  Our clinical-grade formulations replenish this vital molecule, signaling your cells to increase collagen production, reduce inflammation, and accelerate tissue repair. The result is fundamentally healthier, stronger skin and hair.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-10 border-t border-border/60 pt-10">
                <div className="group">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors">
                    <Activity className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-sans font-bold text-xs uppercase tracking-widest mb-3">Cellular Repair</h4>
                  <p className="text-sm font-light text-muted-foreground">Stimulates blood vessel and nerve outgrowth</p>
                </div>
                <div className="group">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors">
                    <Droplets className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-sans font-bold text-xs uppercase tracking-widest mb-3">Deep Hydration</h4>
                  <p className="text-sm font-light text-muted-foreground">Increases natural moisturizing factors</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
