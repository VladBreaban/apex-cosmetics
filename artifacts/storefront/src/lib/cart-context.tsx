import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  priceId: string;
  productId: string;
  quantity: number;
  productName: string;
  unitAmount: number;
  currency: string;
  imageKey: string | null;
}

export interface AppliedDiscount {
  code: string;
  promotionCodeId: string;
  amountOff: number;
  description: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (priceId: string) => void;
  updateQuantity: (priceId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  discount: AppliedDiscount | null;
  applyDiscount: (discount: AppliedDiscount) => void;
  removeDiscount: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("apex-cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [discount, setDiscount] = useState<AppliedDiscount | null>(() => {
    try {
      const stored = localStorage.getItem("apex-discount");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem("apex-cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (discount) {
      localStorage.setItem("apex-discount", JSON.stringify(discount));
    } else {
      localStorage.removeItem("apex-discount");
    }
  }, [discount]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.priceId === newItem.priceId);
      if (existing) {
        return prev.map((i) =>
          i.priceId === newItem.priceId
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (priceId: string) => {
    setItems((prev) => prev.filter((i) => i.priceId !== priceId));
  };

  const updateQuantity = (priceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(priceId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.priceId === priceId ? { ...i, quantity } : i))
    );
  };

  const applyDiscount = (newDiscount: AppliedDiscount) =>
    setDiscount(newDiscount);
  const removeDiscount = () => setDiscount(null);

  const clearCart = () => {
    setItems([]);
    setDiscount(null);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.unitAmount * i.quantity, 0);
  const total = Math.max(0, subtotal - (discount?.amountOff ?? 0));

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        discount,
        applyDiscount,
        removeDiscount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
