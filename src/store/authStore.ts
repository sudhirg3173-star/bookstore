import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole } from "@/types/auth";

interface AuthStore {
    user: User | null;
    isAuthenticated: boolean;

    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (data: {
        name: string;
        email: string;
        password: string;
        role: UserRole;
        storeName?: string;
        authorBio?: string;
    }) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
}

// Simulate a local "database" in localStorage for demo purposes
function getRegisteredUsers(): Array<User & { password: string }> {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem("bookio-users") || "[]");
    } catch {
        return [];
    }
}

function saveRegisteredUsers(users: Array<User & { password: string }>) {
    localStorage.setItem("bookio-users", JSON.stringify(users));
}

function generateId(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,

            login: async (email, password) => {
                // Simulate network delay
                await new Promise((r) => setTimeout(r, 600));

                const users = getRegisteredUsers();
                const found = users.find(
                    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
                );

                if (!found) {
                    return { success: false, error: "Invalid email or password." };
                }

                const { password: _pw, ...user } = found;
                set({ user, isAuthenticated: true });
                return { success: true };
            },

            register: async ({ name, email, password, role, storeName, authorBio }) => {
                await new Promise((r) => setTimeout(r, 700));

                const users = getRegisteredUsers();
                if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
                    return { success: false, error: "An account with this email already exists." };
                }

                const newUser: User & { password: string } = {
                    id: generateId(),
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    password,
                    role,
                    createdAt: new Date().toISOString(),
                    ...(role === "seller" && storeName ? { storeName: storeName.trim() } : {}),
                    ...(role === "author" && authorBio ? { authorBio: authorBio.trim() } : {}),
                };

                users.push(newUser);
                saveRegisteredUsers(users);

                const { password: _pw, ...user } = newUser;
                set({ user, isAuthenticated: true });
                return { success: true };
            },

            logout: () => {
                set({ user: null, isAuthenticated: false });
            },

            updateProfile: (data) => {
                const current = get().user;
                if (!current) return;
                const updated = { ...current, ...data };
                set({ user: updated });

                // Sync to the "db"
                const users = getRegisteredUsers();
                const idx = users.findIndex((u) => u.id === current.id);
                if (idx !== -1) {
                    users[idx] = { ...users[idx], ...data };
                    saveRegisteredUsers(users);
                }
            },
        }),
        { name: "bookio-auth", version: 1 }
    )
);
