import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Book } from "@/types/book";

interface CartStore {
    items: CartItem[];
    addItem: (book: Book, quantity?: number) => void;
    removeItem: (sku: string) => void;
    updateQuantity: (sku: string, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (book, quantity = 1) => {
                const items = get().items;
                const existing = items.find((item) => item.book.sku === book.sku);
                if (existing) {
                    set({
                        items: items.map((item) =>
                            item.book.sku === book.sku
                                ? { ...item, quantity: item.quantity + quantity }
                                : item
                        ),
                    });
                } else {
                    set({ items: [...items, { book, quantity }] });
                }
            },

            removeItem: (sku) => {
                set({ items: get().items.filter((item) => item.book.sku !== sku) });
            },

            updateQuantity: (sku, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(sku);
                    return;
                }
                set({
                    items: get().items.map((item) =>
                        item.book.sku === sku ? { ...item, quantity } : item
                    ),
                });
            },

            clearCart: () => set({ items: [] }),

            getTotal: () =>
                get().items.reduce((sum, item) => {
                    const price = item.book.discount
                        ? item.book.price * (1 - item.book.discount / 100)
                        : item.book.price;
                    return sum + price * item.quantity;
                }, 0),

            getItemCount: () =>
                get().items.reduce((sum, item) => sum + item.quantity, 0),
        }),
        { name: "bookstore-cart", version: 1 }
    )
);
