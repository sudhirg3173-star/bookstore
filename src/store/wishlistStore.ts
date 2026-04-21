import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Book } from "@/types/book";

interface WishlistStore {
    items: Book[];
    addItem: (book: Book) => void;
    removeItem: (sku: string) => void;
    toggleItem: (book: Book) => void;
    hasItem: (sku: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (book) => {
                if (!get().hasItem(book.sku)) {
                    set({ items: [...get().items, book] });
                }
            },

            removeItem: (sku) => {
                set({ items: get().items.filter((item) => item.sku !== sku) });
            },

            toggleItem: (book) => {
                if (get().hasItem(book.sku)) {
                    get().removeItem(book.sku);
                } else {
                    get().addItem(book);
                }
            },

            hasItem: (sku) => get().items.some((item) => item.sku === sku),
        }),
        { name: "bookstore-wishlist", version: 1 }
    )
);
