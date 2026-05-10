"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Search, ShoppingCart, Heart, User, Menu, X, ChevronDown,
    LogOut, PenLine, Store, ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const roleIcon: Record<string, React.ReactNode> = {
    buyer: <ShoppingBag className="w-3.5 h-3.5" />,
    author: <PenLine className="w-3.5 h-3.5" />,
    seller: <Store className="w-3.5 h-3.5" />,
};

export default function Header({ subjects }: { subjects: string[] }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchType, setSearchType] = useState<"all" | "books" | "standards">("all");
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const searchRef = useRef<HTMLInputElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const cartCount = useCartStore((s) => s.getItemCount());
    const wishlistCount = useWishlistStore((s) => s.items.length);
    const { user, isAuthenticated, logout } = useAuthStore();

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        if (searchOpen) searchRef.current?.focus();
    }, [searchOpen]);

    // Close user menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            const typeParam = searchType !== "all" ? `&type=${searchType}` : "";
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}${typeParam}`);
            setSearchOpen(false);
            setSearchQuery("");
        }
    };

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
        router.push("/");
    };

    const subjectSlug = (s: string) =>
        s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    return (
        <header className="sticky top-0 z-50 shadow-md">
            {/* Top bar */}
            {/* <div className="bg-brand text-white py-2 text-center text-xs tracking-wide hidden md:block">
                USE CODE:{" "}
                <span className="font-bold text-amber-400">KWB20</span> FOR 20% OFF
            </div> */}

            {/* Main navbar */}
            <nav className="bg-[#fa8128] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center flex-shrink-0">
                            <Image
                                src="/images/logo/logo.png"
                                alt="KBI International"
                                width={120}
                                height={48}
                                className="h-12 w-auto object-contain"
                                priority
                            />
                        </Link>

                        {/* Desktop nav links */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                                Home
                            </Link>
                            {/* Books dropdown */}
                            <div className="relative">
                                <button
                                    className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
                                    onClick={() => setCategoryOpen(!categoryOpen)}
                                    onBlur={() => setTimeout(() => setCategoryOpen(false), 150)}
                                >
                                    Books <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                {categoryOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-60 bg-white text-gray-800 rounded-lg shadow-xl py-2 animate-slide-down z-50">
                                        {subjects.map((s) => (
                                            <Link
                                                key={s}
                                                href={`/category/${subjectSlug(s)}`}
                                                className="block px-4 py-2 text-sm hover:bg-red-50 hover:text-primary transition-colors"
                                                onClick={() => setCategoryOpen(false)}
                                            >
                                                {s}
                                            </Link>
                                        ))}
                                        <div className="border-t mt-1 pt-1">
                                            <Link
                                                href="/shop"
                                                className="block px-4 py-2 text-sm font-medium text-primary hover:bg-red-50 transition-colors"
                                                onClick={() => setCategoryOpen(false)}
                                            >
                                                View All Books →
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Link href="/standards" className="text-sm font-medium hover:text-primary transition-colors">
                                Standards
                            </Link>
                            <Link href="/shop?sort=new" className="text-sm font-medium hover:text-primary transition-colors">
                                New Releases
                            </Link>
                            <a
                                href="https://www.kbipublishers.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium hover:text-primary transition-colors"
                            >
                                Our Books
                            </a>
                        </div>

                        {/* Right icons */}
                        <div className="flex items-center gap-2">
                            {/* Search toggle */}
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className="p-2 hover:text-primary transition-colors"
                                aria-label="Search"
                            >
                                <Search className="w-5 h-5" />
                            </button>

                            {/* Wishlist */}
                            <Link href="/wishlist" className="relative p-2 hover:text-primary transition-colors" aria-label="Wishlist">
                                <Heart className="w-5 h-5" />
                                {mounted && wishlistCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Link>

                            {/* Cart */}
                            <Link href="/cart" className="relative p-2 hover:text-primary transition-colors" aria-label="Cart">
                                <ShoppingCart className="w-5 h-5" />
                                {mounted && cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                        {cartCount > 9 ? "9+" : cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* User menu (desktop) */}
                            <div className="relative hidden sm:block" ref={userMenuRef}>
                                {mounted && isAuthenticated && user ? (
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                        aria-label="User menu"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium max-w-[80px] truncate hidden md:block">
                                            {user.name.split(" ")[0]}
                                        </span>
                                        <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                                        aria-label="Sign in"
                                    >
                                        <User className="w-4 h-4" />
                                        <span className="hidden md:block">Sign In</span>
                                    </Link>
                                )}

                                {/* Dropdown */}
                                {userMenuOpen && isAuthenticated && user && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white text-gray-800 rounded-xl shadow-xl py-2 animate-slide-down z-50 border border-gray-100">
                                        {/* User info */}
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                            <div className={cn(
                                                "inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                                user.role === "buyer" ? "bg-blue-50 border-blue-100 text-blue-600" :
                                                    user.role === "author" ? "bg-purple-50 border-purple-100 text-purple-600" :
                                                        "bg-emerald-50 border-emerald-100 text-emerald-600"
                                            )}>
                                                {roleIcon[user.role]}
                                                <span className="ml-0.5 capitalize">{user.role}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href="/account"
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 hover:text-primary transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <User className="w-4 h-4 text-gray-400" /> My Account
                                        </Link>
                                        <Link
                                            href="/cart"
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 hover:text-primary transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <ShoppingCart className="w-4 h-4 text-gray-400" /> My Cart
                                            {cartCount > 0 && (
                                                <span className="ml-auto bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                    {cartCount}
                                                </span>
                                            )}
                                        </Link>
                                        <Link
                                            href="/wishlist"
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 hover:text-primary transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <Heart className="w-4 h-4 text-gray-400" /> Wishlist
                                        </Link>

                                        <div className="border-t border-gray-100 mt-1 pt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile hamburger */}
                            <button
                                className="p-2 md:hidden hover:text-primary transition-colors"
                                onClick={() => setMobileOpen(!mobileOpen)}
                                aria-label="Menu"
                            >
                                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Search bar */}
                    {searchOpen && (
                        <div className="pb-3 animate-slide-down">
                            <form onSubmit={handleSearch} className="relative flex gap-2">
                                <div className="relative flex-1 flex items-center">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={searchType === "standards" ? "Search standards, publishers…" : "Search books, authors, ISBN…"}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:bg-white/15 transition-all"
                                    />
                                </div>
                                <select
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value as "all" | "books" | "standards")}
                                    className="bg-white/10 border border-white/20 rounded-lg text-white text-sm px-3 py-2.5 focus:outline-none focus:border-primary cursor-pointer"
                                >
                                    <option value="all" className="text-gray-900">All</option>
                                    <option value="books" className="text-gray-900">Books</option>
                                    <option value="standards" className="text-gray-900">Standards</option>
                                </select>
                                <button
                                    type="submit"
                                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                >
                                    Search
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden bg-[#fa8128] border-t border-white/10 animate-slide-down">
                        <div className="px-4 py-4 space-y-1">
                            {/* Mobile user area */}
                            {mounted && isAuthenticated && user ? (
                                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-white/10 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                                        <p className="text-xs text-white/50 capitalize">{user.role}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2 mb-2">
                                    <Link
                                        href="/login"
                                        className="flex-1 text-center bg-primary text-white py-2 rounded-lg text-sm font-semibold"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="flex-1 text-center bg-white/10 text-white py-2 rounded-lg text-sm font-semibold"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}

                            <Link href="/" className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-white/10 hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>
                                Home
                            </Link>
                            <Link href="/shop" className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-white/10 hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>
                                Books
                            </Link>
                            <Link href="/standards" className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-white/10 hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>
                                Standards
                            </Link>
                            <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Categories
                            </div>
                            {subjects.map((s) => (
                                <Link
                                    key={s}
                                    href={`/category/${subjectSlug(s)}`}
                                    className="block px-3 py-2 rounded-md text-sm hover:bg-white/10 hover:text-primary transition-colors ml-2"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {s}
                                </Link>
                            ))}

                            {mounted && isAuthenticated && (
                                <>
                                    <div className="border-t border-white/10 mt-2 pt-2">
                                        <Link href="/account" className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-white/10 hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>
                                            My Account
                                        </Link>
                                        <button
                                            onClick={() => { handleLogout(); setMobileOpen(false); }}
                                            className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
