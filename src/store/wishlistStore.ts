import { create } from "zustand";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebaseClient";
import { Book } from "@/types/book";

interface WishlistStore {
    items: Book[];
    loadFromFirestore: (uid: string) => Promise<void>;
    clearItems: () => void;
    addItem: (book: Book) => void;
    removeItem: (sku: string) => void;
    toggleItem: (book: Book) => void;
    hasItem: (sku: string) => boolean;
}

// Tracks the current user's UID — set by authStore.init to avoid circular imports
let _uid: string | null = null;

export function setWishlistUserId(uid: string | null): void {
    _uid = uid;
}

/** Persist only the SKUs to Firestore — book details are resolved at load time. */
async function persistSkusToFirestore(items: Book[]): Promise<void> {
    if (!_uid) return;
    const db = getFirebaseFirestore();
    const skus = items.map((b) => b.sku);
    await setDoc(doc(db, "wishlists", _uid), { skus });
}

/** Fetch full Book objects for a list of SKUs from the server-side API. */
async function resolveSkusToBooks(skus: string[]): Promise<Book[]> {
    if (!skus.length) return [];
    const res = await fetch(`/api/books?skus=${skus.join(",")}`);
    if (!res.ok) return [];
    return res.json();
}

export const useWishlistStore = create<WishlistStore>()((set, get) => ({
    items: [],

    loadFromFirestore: async (uid) => {
        _uid = uid;
        try {
            const db = getFirebaseFirestore();
            const snap = await getDoc(doc(db, "wishlists", uid));
            if (!snap.exists()) {
                set({ items: [] });
                return;
            }
            const skus: string[] = snap.data().skus ?? [];
            const books = await resolveSkusToBooks(skus);
            set({ items: books });
        } catch (err) {
            console.error("Failed to load wishlist from Firestore:", err);
            set({ items: [] });
        }
    },

    clearItems: () => {
        _uid = null;
        set({ items: [] });
    },

    addItem: (book) => {
        if (get().hasItem(book.sku)) return;
        const items = [...get().items, book];
        set({ items });
        persistSkusToFirestore(items).catch(console.error);
    },

    removeItem: (sku) => {
        const items = get().items.filter((item) => item.sku !== sku);
        set({ items });
        persistSkusToFirestore(items).catch(console.error);
    },

    toggleItem: (book) => {
        if (get().hasItem(book.sku)) {
            get().removeItem(book.sku);
        } else {
            get().addItem(book);
        }
    },

    hasItem: (sku) => get().items.some((item) => item.sku === sku),
}));

