export type UserRole = "buyer" | "author" | "seller";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    bio?: string;
    createdAt: string;
    // seller-specific
    storeName?: string;
    storeDescription?: string;
    // author-specific
    authorBio?: string;
    publishedBooks?: string[];
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}
