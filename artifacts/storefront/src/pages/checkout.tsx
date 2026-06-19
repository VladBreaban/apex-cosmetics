import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart-context";
import { useCreateCheckout, useGetShippingRates, ApiError } from "@workspace/api-client-react";
import { getProductImage } from "@/lib/image-map";
import { motion } from "framer-motion";
import { ArrowLeft, Truck, CheckCircle2, AlertCircle, Minus, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShippingForm {
  email: string;
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

const EMPTY_FORM: ShippingForm = {
  email: "",
  name: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
};

function isAddressComplete(form: ShippingForm) {
  return (
    form.name.trim() !== "" &&
    form.address1.trim() !== "" &&
    form.city.trim() !== "" &&
    form.state.trim() !== "" &&
    form.zip.trim() !== "" &&
    form.country.trim() !== ""
  );
}

export default function Checkout() {
  const { items, subtotal, itemCount, updateQuantity, removeItem, discount } =
    useCart();
  const createCheckout = useCreateCheckout();
  const shippingRates = useGetShippingRates();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);

  const addressReady = isAddressComplete(form);

  useEffect(() => {
    if (!addressReady) return;
    const timer = setTimeout(() => {
      shippingRates.mutate({
        data: {
          address: {
            name: form.name,
            address1: form.address1,
            address2: form.address2,
            city: form.city,
            state: form.state,
            zip: form.zip,
            country: form.country,
          },
          itemCount,
          totalWeightOz: itemCount * 8,
        },
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [form.name, form.address1, form.city, form.state, form.zip, form.country, itemCount]);

  useEffect(() => {
    const rates = shippingRates.data?.rates;
    if (rates && rates.length > 0 && !selectedRate) {
      setSelectedRate(rates[0].serviceCode);
    }
  }, [shippingRates.data]);

  const selectedRateObj = shippingRates.data?.rates?.find(
    (r) => r.serviceCode === selectedRate
  );

  const shippingCents = selectedRateObj?.amountCents ?? 0;
  const discountCents = discount?.amountOff ?? 0;
  const totalCents = Math.max(0, subtotal - discountCents) + shippingCents;

  const update = (field: keyof ShippingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    const currentUrl = window.location.origin;
    createCheckout.mutate(
      {
        data: {
          items: items.map((i) => ({ priceId: i.priceId, quantity: i.quantity })),
          customerEmail: form.email || undefined,
          promotionCode: discount?.promotionCodeId || undefined,
          successUrl: `${currentUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${currentUrl}/checkout/cancel`,
        },
      },
      {
        onSuccess: (data) => { window.location.href = data.url; },
        onError: (error) => {
          const serverMessage =
            error instanceof ApiError &&
            error.data &&
            typeof (error.data as { error?: unknown }).error === "string"
              ? (error.data as { error: string }).error
              : "Unable to initiate payment. Please try again.";
          toast({ title: "Checkout failed", description: serverMessage, variant: "destructive" });
        },
      }
    );
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-display font-light mb-6">Nothing to Check Out</h1>
          <p className="text-muted-foreground font-light mb-10">Add formulations to your regimen first.</p>
          <Link href="/products" className="inline-flex items-center justify-center px-10 py-5 bg-foreground text-background text-sm font-bold uppercase tracking-widest hover:bg-primary transition-colors duration-500 rounded-sm">
            Explore Collection
          </Link>
        </motion.div>
      </div>
    );
  }

  const inputClass = "w-full bg-white border border-border px-5 py-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 rounded-sm shadow-sm";
  const labelClass = "block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3";

  return (
    <div className="min-h-screen bg-background pt-32 pb-32 relative">
      <div className="absolute top-0 right-0 w-1/2 h-[50vh] mesh-gradient opacity-30 pointer-events-none" />
      
      <div className="container mx-auto px-6 lg:px-12 max-w-7xl relative z-10">
        <Link href="/cart" className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-primary mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-3" />
          Back to Cart
        </Link>

        <header className="mb-16 border-b border-border/60 pb-10">
          <h1 className="text-5xl md:text-6xl font-display font-light tracking-tight">Checkout</h1>
          <p className="text-muted-foreground font-light text-lg mt-4">Complete your order in one step.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">

            {/* Left: Shipping Form */}
            <div className="lg:col-span-7 space-y-16">

              {/* Contact */}
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <h2 className="font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-8 pb-4 border-b border-border/60">Contact</h2>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" className={inputClass} />
                </div>
              </motion.section>

              {/* Shipping Address */}
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                <h2 className="font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-8 pb-4 border-b border-border/60">Shipping Address</h2>
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Full Name <span className="text-primary">*</span></label>
                    <input type="text" required value={form.name} onChange={update("name")} placeholder="Jane Smith" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Address Line 1 <span className="text-primary">*</span></label>
                    <input type="text" required value={form.address1} onChange={update("address1")} placeholder="123 Main Street" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Address Line 2</label>
                    <input type="text" value={form.address2} onChange={update("address2")} placeholder="Apt, Suite, Unit (optional)" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>City <span className="text-primary">*</span></label>
                      <input type="text" required value={form.city} onChange={update("city")} placeholder="Los Angeles" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>State <span className="text-primary">*</span></label>
                      <input type="text" required value={form.state} onChange={update("state")} placeholder="CA" className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>ZIP Code <span className="text-primary">*</span></label>
                      <input type="text" required value={form.zip} onChange={update("zip")} placeholder="90210" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Country <span className="text-primary">*</span></label>
                      <select required value={form.country} onChange={update("country")} className="w-full bg-white border border-border px-5 py-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all rounded-sm shadow-sm">
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Shipping Method */}
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <h2 className="font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-8 pb-4 border-b border-border/60 flex items-center gap-3">
                  <Truck className="w-4 h-4" /> Shipping Method
                </h2>

                {!addressReady ? (
                  <div className="bg-secondary/30 rounded-sm p-8 text-center border border-dashed border-border">
                    <p className="text-sm text-muted-foreground font-light">
                      Enter your shipping address above to see available rates.
                    </p>
                  </div>
                ) : shippingRates.isPending ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border border-border/60 bg-white p-5 rounded-sm animate-pulse">
                        <div className="h-4 bg-secondary/50 rounded w-1/2 mb-3" />
                        <div className="h-3 bg-secondary/30 rounded w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : shippingRates.isError ? (
                  <div className="flex items-center gap-4 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-sm p-5">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    Could not fetch shipping rates. Please try again.
                  </div>
                ) : shippingRates.data ? (
                  <div className="space-y-4">
                    {!shippingRates.data.isLive && (
                      <p className="text-[9px] uppercase tracking-[0.2em] text-primary/80 mb-5 font-bold">
                        Estimated rates — live rates activate when ShipStation is connected
                      </p>
                    )}
                    {shippingRates.data.rates.map((rate) => (
                      <label
                        key={rate.serviceCode}
                        className={`flex items-center justify-between cursor-pointer border rounded-sm p-5 transition-all duration-300 ${
                          selectedRate === rate.serviceCode
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/60 bg-white hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            selectedRate === rate.serviceCode ? "border-primary" : "border-border"
                          }`}>
                            {selectedRate === rate.serviceCode && (
                              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <input
                            type="radio"
                            name="shippingRate"
                            value={rate.serviceCode}
                            checked={selectedRate === rate.serviceCode}
                            onChange={() => setSelectedRate(rate.serviceCode)}
                            className="sr-only"
                          />
                          <div>
                            <p className="text-sm font-semibold mb-1">{rate.serviceName}</p>
                            <p className="text-xs text-muted-foreground font-light">
                              {rate.carrierName} · {rate.estimatedDays} {rate.estimatedDays === 1 ? "day" : "days"}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium tracking-wide">
                          ${(rate.amountCents / 100).toFixed(2)}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </motion.section>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-5">
              <div className="glass-card rounded-sm p-8 lg:p-10 sticky top-32">
                <h2 className="font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-8 text-foreground">Order Summary</h2>

                <div className="space-y-6 mb-10">
                  {items.map((item) => (
                    <div key={item.priceId} className="flex gap-5 items-center group">
                      <div className="w-20 h-24 bg-white border border-border/60 rounded-sm shrink-0 flex items-center justify-center p-2 group-hover:border-primary/30 transition-colors shadow-sm">
                        <img src={getProductImage(item.productName)} alt={item.productName} className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate mb-2">{item.productName}</p>
                        <div className="flex items-center gap-3">
                          <div className="inline-flex items-center border border-border rounded-sm overflow-hidden">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${item.productName}`}
                              onClick={() => updateQuantity(item.priceId, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                            >
                              <Minus className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                            <span className="w-8 text-center text-xs font-semibold tabular-nums select-none">{item.quantity}</span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.productName}`}
                              onClick={() => updateQuantity(item.priceId, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                            >
                              <Plus className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${item.productName} from cart`}
                            onClick={() => removeItem(item.priceId)}
                            className="w-7 h-7 flex items-center justify-center text-muted-foreground/60 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      <span className="text-sm font-medium shrink-0">
                        ${((item.unitAmount * item.quantity) / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 text-sm font-light border-t border-border/60 pt-8 mb-8">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground font-medium">${(subtotal / 100).toFixed(2)}</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-primary">
                      <span>Discount ({discount.code})</span>
                      <span className="font-medium">−${(discount.amountOff / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-foreground font-medium">
                      {selectedRateObj ? `$${(selectedRateObj.amountCents / 100).toFixed(2)}` : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-border/60 pt-8 mb-10">
                  <span className="font-bold uppercase tracking-[0.15em] text-[10px] mb-1">Total</span>
                  <span className="text-4xl font-display font-medium tracking-tight">
                    ${(totalCents / 100).toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={createCheckout.isPending || items.length === 0}
                  className="w-full relative group overflow-hidden bg-foreground text-background py-5 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl shadow-foreground/5 hover:shadow-primary/20 transition-all"
                >
                  <div className="absolute inset-0 bg-primary translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]" />
                  <span className="relative z-10 text-sm font-bold uppercase tracking-widest group-hover:text-white transition-colors duration-500 flex items-center gap-3">
                    {createCheckout.isPending ? "Processing..." : (
                      <><CheckCircle2 className="w-5 h-5" /> Complete Purchase</>
                    )}
                  </span>
                </button>

                <p className="text-[9px] text-center text-muted-foreground mt-6 uppercase tracking-[0.2em] font-semibold">
                  Secured by Stripe. You will be redirected.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
