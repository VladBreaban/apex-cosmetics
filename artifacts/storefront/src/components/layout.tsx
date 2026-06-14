import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart-context";
import { ShoppingCart, Menu, X, Hexagon } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { itemCount } = useCart();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/products", label: "Shop All" },
    { href: "/products?category=facial", label: "Face" },
    { href: "/products?category=body", label: "Body" },
    { href: "/products?category=hair", label: "Hair" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 -ml-2 text-foreground"
              onClick={() => setIsMobileMenuOpen(true)}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative flex items-center justify-center w-8 h-8 text-primary">
                <Hexagon className="w-8 h-8 absolute" strokeWidth={1.5} />
                <div className="w-2.5 h-2.5 bg-primary rounded-full" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight uppercase">Apex Health</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium tracking-wide uppercase transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative p-2 -mr-2 text-foreground hover:text-primary transition-colors" data-testid="link-cart">
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
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
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-card border-r border-border p-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-primary">
                  <Hexagon className="w-6 h-6" />
                  <span className="font-display font-bold text-lg tracking-tight uppercase">Apex</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground"
                  data-testid="button-close-menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-lg font-medium uppercase tracking-wide py-2 ${
                      location === link.href ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-secondary text-secondary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Hexagon className="w-6 h-6 text-primary" />
                <span className="font-display font-bold text-xl tracking-tight uppercase">Apex Health</span>
              </div>
              <p className="text-muted max-w-sm">
                Advanced Copper Peptide formulations for skin and hair. 
                Science-backed wellness for those who want to age well.
              </p>
            </div>
            
            <div>
              <h4 className="font-display font-bold mb-4 uppercase tracking-wider text-sm">Shop</h4>
              <ul className="space-y-2">
                <li><Link href="/products" className="text-muted hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/products?category=facial" className="text-muted hover:text-white transition-colors">Facial Care</Link></li>
                <li><Link href="/products?category=body" className="text-muted hover:text-white transition-colors">Body Care</Link></li>
                <li><Link href="/products?category=hair" className="text-muted hover:text-white transition-colors">Hair Care</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold mb-4 uppercase tracking-wider text-sm">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-muted hover:text-white transition-colors">Science</a></li>
                <li><a href="#" className="text-muted hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-muted hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-sm text-muted flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; {new Date().getFullYear()} Apex Health. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
