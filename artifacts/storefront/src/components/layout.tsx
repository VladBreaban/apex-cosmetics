import { Link, useLocation, useSearch } from "wouter";
import { useCart } from "@/lib/cart-context";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apexLogo from "@assets/apex_logo_trimmed.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const { itemCount } = useCart();
  const [location] = useLocation();
  const searchString = useSearch();
  const activeCategory = new URLSearchParams(searchString).get("category");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/products", label: "Collection", category: null },
    { href: "/products?category=facial", label: "Face", category: "facial" },
    { href: "/products?category=body", label: "Body", category: "body" },
    { href: "/products?category=hair", label: "Hair", category: "hair" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <header 
        className={`fixed top-0 inset-x-0 z-50 w-full transition-all duration-700 ease-[0.16,1,0.3,1] ${
          scrolled ? "py-3" : "py-5"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-12">
          <div className={`flex items-center justify-between gap-6 rounded-full transition-all duration-700 ease-[0.16,1,0.3,1] ${
            scrolled
              ? "bg-white/80 backdrop-blur-2xl border border-white/70 shadow-[0_10px_40px_rgba(15,23,42,0.08)] pl-6 pr-3 py-2.5"
              : "bg-white/55 backdrop-blur-xl border border-white/50 shadow-[0_6px_30px_rgba(15,23,42,0.05)] pl-6 pr-3 py-2.5"
          }`}>
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 -ml-2 text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
                data-testid="button-mobile-menu"
              >
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <Link href="/" className="flex items-center group" aria-label="Apex Health home">
                <img src={apexLogo} alt="Apex Health" className="h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-500" />
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location === "/products" && activeCategory === link.category;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-4 py-2.5 text-[10px] font-semibold tracking-[0.28em] uppercase rounded-full transition-colors duration-300"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-primary/10 border border-primary/15"
                        initial={false}
                        transition={{ type: "spring", stiffness: 350, damping: 32 }}
                      />
                    )}
                    <span className={`relative z-10 transition-colors duration-300 ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/cart" className="relative w-10 h-10 flex items-center justify-center rounded-full text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors group" data-testid="link-cart">
                <ShoppingBag className="w-5 h-5 transition-transform duration-500 group-hover:-translate-y-0.5" strokeWidth={1.5} />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-3xl md:hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center" aria-label="Apex Health home">
                <img src={apexLogo} alt="Apex Health" className="h-12 w-auto object-contain" />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
                data-testid="button-close-menu"
              >
                <X className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>
            <nav className="flex flex-col p-8 pt-12">
              {navLinks.map((link, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.1 + 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  key={link.href}
                  className="border-b border-border/30 last:border-0"
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`font-display text-4xl tracking-wide py-6 block transition-colors ${
                      location === link.href ? "text-primary italic" : "text-foreground hover:text-primary"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full relative z-10">
        {children}
      </main>

      <footer className="bg-secondary/40 border-t border-border pt-32 pb-12 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-60" />
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 mb-24">
            <div className="md:col-span-5 space-y-8">
              <div className="flex items-center group">
                <img src={apexLogo} alt="Apex Health" className="h-16 w-auto object-contain group-hover:scale-105 transition-transform duration-700" />
              </div>
              <p className="text-muted-foreground max-w-sm font-light leading-relaxed text-sm">
                Clinical-grade GHK-Cu copper peptide formulations. Engineered at the intersection of longevity biotech and luxury wellness.
              </p>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="font-sans font-semibold mb-8 uppercase tracking-[0.2em] text-[10px] text-primary">Regimens</h4>
              <ul className="space-y-4">
                <li><Link href="/products" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">All Formulations</Link></li>
                <li><Link href="/products?category=facial" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Face Protocol</Link></li>
                <li><Link href="/products?category=body" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Body Protocol</Link></li>
                <li><Link href="/products?category=hair" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Hair Protocol</Link></li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="font-sans font-semibold mb-8 uppercase tracking-[0.2em] text-[10px] text-primary">Priority Access</h4>
              <p className="text-sm font-light text-muted-foreground mb-6">Join for clinical trial insights and exclusive allocations.</p>
              <div className="flex relative">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="bg-transparent border-b border-border px-0 py-3 text-sm flex-1 focus:outline-none focus:border-primary transition-colors font-light text-foreground placeholder:text-muted-foreground"
                />
                <button className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-[11px] text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4 font-light tracking-[0.1em] uppercase">
            <p>&copy; {new Date().getFullYear()} Apex Health Laboratories.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
