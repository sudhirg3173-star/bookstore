import { create } from "zustand";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile as firebaseUpdateProfile,
    type AuthError,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebaseClient";
import { useWishlistStore } from "@/store/wishlistStore";
import { User, UserRole } from "@/types/auth";

interface AuthStore {
    user: User | null;
    isAuthenticated: boolean;
    /** Subscribe to Firebase auth state; returns unsubscribe fn. Call on app mount. */
    init: () => () => void;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (data: {
        name: string;
        email: string;
        password: string;
        role: UserRole;
        storeName?: string;
        authorBio?: string;
    }) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => void;
}

function mapFirebaseError(err: AuthError): string {
    switch (err.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Invalid email or password.";
        case "auth/email-already-in-use":
            return "An account with this email already exists.";
        case "auth/weak-password":
            return "Password must be at least 6 characters.";
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please try again later.";
        case "auth/user-disabled":
            return "This account has been disabled.";
        case "auth/network-request-failed":
            return "Network error. Please check your connection and try again.";
        default:
            return "Something went wrong. Please try again.";
    }
}

async function fetchUserProfile(uid: string): Promise<User | null> {
    const db = getFirebaseFirestore();
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return snap.data() as User;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
    user: null,
    isAuthenticated: false,

    init: () => {
        const auth = getFirebaseAuth();
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                set({ user: null, isAuthenticated: false });
                useWishlistStore.getState().clearItems();
                return;
            }
            const profile = await fetchUserProfile(firebaseUser.uid);
            if (profile) {
                set({ user: profile, isAuthenticated: true });
            } else {
                // Fallback if Firestore doc is missing
                set({
                    user: {
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName ?? firebaseUser.email ?? "",
                        email: firebaseUser.email ?? "",
                        role: "buyer",
                        createdAt: new Date().toISOString(),
                    },
                    isAuthenticated: true,
                });
            }
            useWishlistStore.getState().loadFromFirestore(firebaseUser.uid);
        });
        return unsubscribe;
    },

    login: async (email, password) => {
        try {
            const auth = getFirebaseAuth();
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const profile = await fetchUserProfile(credential.user.uid);
            if (profile) {
                set({ user: profile, isAuthenticated: true });
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: mapFirebaseError(err as AuthError) };
        }
    },

    register: async ({ name, email, password, role, storeName, authorBio }) => {
        try {
            const auth = getFirebaseAuth();
            const db = getFirebaseFirestore();
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            const { uid } = credential.user;

            // Set display name in Firebase Auth
            await firebaseUpdateProfile(credential.user, { displayName: name.trim() });

            // Store full profile in Firestore
            const newUser: User = {
                id: uid,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                role,
                createdAt: new Date().toISOString(),
                ...(role === "seller" && storeName ? { storeName: storeName.trim() } : {}),
                ...(role === "author" && authorBio ? { authorBio: authorBio.trim() } : {}),
            };
            await setDoc(doc(db, "users", uid), newUser);

            set({ user: newUser, isAuthenticated: true });
            return { success: true };
        } catch (err) {
            return { success: false, error: mapFirebaseError(err as AuthError) };
        }
    },

    logout: async () => {
        const auth = getFirebaseAuth();
        await signOut(auth);
        set({ user: null, isAuthenticated: false });
    },

    updateProfile: (data) => {
        const current = get().user;
        if (!current) return;
        const updated = { ...current, ...data };
        set({ user: updated });

        // Persist to Firestore (fire-and-forget)
        const db = getFirebaseFirestore();
        updateDoc(doc(db, "users", current.id), data as Record<string, unknown>).catch(
            (err) => console.error("Failed to update profile in Firestore:", err)
        );

        // Sync displayName to Firebase Auth if name changed
        if (data.name) {
            const auth = getFirebaseAuth();
            if (auth.currentUser) {
                firebaseUpdateProfile(auth.currentUser, { displayName: data.name }).catch(
                    (err) => console.error("Failed to update Firebase displayName:", err)
                );
            }
        }
    },
}));

