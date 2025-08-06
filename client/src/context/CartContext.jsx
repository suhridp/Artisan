import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart_v1") || "[]");
    } catch {
      return [];
    }
  }); // [{productId, qty}]

  useEffect(() => {
    localStorage.setItem("cart_v1", JSON.stringify(items));
  }, [items]);

  const add = (productId, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.productId === productId);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.max(next[i].qty + qty, 1) };
        return next;
      }
      return [...prev, { productId, qty: Math.max(qty, 1) }];
    });
  };

  const setQty = (productId, qty) => {
    setItems((prev) =>
      prev
        .map((p) =>
          p.productId === productId
            ? { ...p, qty: Math.max(Number(qty) || 1, 1) }
            : p
        )
        .filter((p) => p.qty > 0)
    );
  };

  const remove = (productId) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  };

  const clear = () => setItems([]);

  const totalCount = useMemo(
    () => items.reduce((n, i) => n + (i.qty || 0), 0),
    [items]
  );

  const value = { items, add, setQty, remove, clear, totalCount };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
