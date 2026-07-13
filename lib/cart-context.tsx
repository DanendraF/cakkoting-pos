'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { CartItem, CartItemOption, MenuItem } from './types';
import { generateId } from './format';

interface CartContextValue {
  items: CartItem[];
  addItem: (
    menu: MenuItem,
    qty: number,
    options: CartItemOption[],
    note: string
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQty: (cartItemId: string, qty: number) => void;
  updateNote: (cartItemId: string, note: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  tableId: string | null;
  setTableId: (id: string | null) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_KEY = 'cakkoting_cart';
const TABLE_KEY = 'cakkoting_table';

function computeItemTotal(item: CartItem): number {
  const optionsTotal = item.options.reduce(
    (sum, o) => sum + o.priceAdjustment,
    0
  );
  return (item.basePrice + optionsTotal) * item.qty;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableId, setTableIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(CART_KEY);
      if (stored) setItems(JSON.parse(stored));
      const table = sessionStorage.getItem(TABLE_KEY);
      if (table) setTableIdState(table);
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const setTableId = useCallback((id: string | null) => {
    setTableIdState(id);
    try {
      if (id) sessionStorage.setItem(TABLE_KEY, id);
      else sessionStorage.removeItem(TABLE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const addItem = useCallback(
    (
      menu: MenuItem,
      qty: number,
      options: CartItemOption[],
      note: string
    ) => {
      setItems((prev) => {
        const existingIdx = prev.findIndex(
          (i) =>
            i.menuId === menu.id &&
            JSON.stringify(i.options) === JSON.stringify(options) &&
            i.note === note
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx].qty += qty;
          return updated;
        }
        return [
          ...prev,
          {
            id: generateId(),
            menuId: menu.id,
            name: menu.name,
            basePrice: menu.price,
            qty,
            options,
            note,
            image: menu.image,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  }, []);

  const updateQty = useCallback((cartItemId: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== cartItemId)
        : prev.map((i) => (i.id === cartItemId ? { ...i, qty } : i))
    );
  }, []);

  const updateNote = useCallback((cartItemId: string, note: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === cartItemId ? { ...i, note } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + computeItemTotal(i), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        updateNote,
        clearCart,
        totalItems,
        totalPrice,
        tableId,
        setTableId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export { computeItemTotal };
