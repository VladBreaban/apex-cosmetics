import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart-context";
import { ShoppingBag, Menu, X, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { itemCount } = useCart();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/products", label: "Collection" },
    { href: "/products?category=facial", label: "Face" },
    { href: "/products?category=body", label: "Body" },
    { href: "/products?category=hair", label: "Hair" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <header 
        className={`fixed top-0 inset-x-0 z-50 w-full transition-all duration-500 ${
          scrolled ? "bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-border shadow-sm py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 -ml-2 text-foreground hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <Link href="/" className="flex items-center gap-3 group">
              <Sparkles className="w-6 h-6 text-primary group-hover:rotate-12 transition-transform duration-500" strokeWidth={1.5} />
              <span className="font-display font-medium text-2xl tracking-widest uppercase">Apex</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 relative py-2 ${
                  location === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {location === link.href && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-px bg-primary" 
                    initial={false}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors group" data-testid="link-cart">
              <ShoppingBag className="w-5 h-5 transition-transform group-hover:-translate-y-1" strokeWidth={1.5} />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center rounded-full shadow-sm"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex items-center justify-between p-6">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-primary" strokeWidth={1.5} />
                <span className="font-display font-medium text-2xl tracking-widest uppercase">Apex</span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
                data-testid="button-close-menu"
              >
                <X className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>
            <nav className="flex flex-col gap-6 p-8">
              {navLinks.map((link, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.1 }}
                  key={link.href}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-2xl font-display tracking-wide py-2 block ${
                      location === link.href ? "text-primary italic" : "text-foreground"
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

      <main className="flex-1 w-full relative">
        {children}
      </main>

      <footer className="bg-foreground text-background py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-30" />
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 mb-16">
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="w-6 h-6 text-primary" strokeWidth={1.5} />
                <span className="font-display font-medium text-2xl tracking-widest uppercase">Apex Health</span>
              </div>
              <p className="text-muted-foreground/80 max-w-sm font-light leading-relaxed text-sm">
                Clinical-grade copper peptide formulations engineered to restore, protect, and enhance your biology at the cellular level.
              </p>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="font-sans font-semibold mb-6 uppercase tracking-[0.2em] text-xs text-muted-foreground">Collection</h4>
              <ul className="space-y-4">
                <li><Link href="/products" className="text-sm font-light hover:text-primary transition-colors">All Formulations</Link></li>
                <li><Link href="/products?category=facial" className="text-sm font-light hover:text-primary transition-colors">Facial Protocol</Link></li>
                <li><Link href="/products?category=body" className="text-sm font-light hover:text-primary transition-colors">Body Protocol</Link></li>
                <li><Link href="/products?category=hair" className="text-sm font-light hover:text-primary transition-colors">Hair Protocol</Link></li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="font-sans font-semibold mb-6 uppercase tracking-[0.2em] text-xs text-muted-foreground">Stay Informed</h4>
              <p className="text-sm font-light text-muted-foreground/80 mb-4">Subscribe for early access to new clinical trials and exclusive allocations.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm flex-1 focus:outline-none focus:border-primary/50 transition-colors font-light text-white placeholder:text-white/30"
                />
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-xs text-muted-foreground/60 flex flex-col md:flex-row justify-between items-center gap-4 font-light tracking-wide">
            <p>&copy; {new Date().getFullYear()} Apex Health Laboratories. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
