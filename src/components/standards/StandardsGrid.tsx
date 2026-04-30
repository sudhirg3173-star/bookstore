"use client";

import { useState, useMemo } from "react";
import { Standard } from "@/types/standard";
import StandardCard from "@/components/standards/StandardCard";
import { LayoutGrid, List, SlidersHorizontal, X, FileText, ShoppingCart } from "lucide-react";
import { standardToBook } from "@/lib/standardUtils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCurrencyStore, useFormatPrice } from "@/store/currencyStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StandardsGridProps {
    standards: Standard[];
}

export default function StandardsGrid({ standards }: StandardsGridProps) {
    const [view, setView] = useState<"grid" | "list">("grid");
    const [selectedPublisher, setSelectedPublisher] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "year-new" | "year-old">("default");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const addToCart = useCartStore((s) => s.addItem);
    const format = useFormatPrice();
    const toggleWishlist = useWishlistStore((s) => s.toggleItem);

    const publishers = useMemo(() => {
        const set = new Set(standards.map((s) => s.publisher));
        return ["all", ...Array.from(set).sort()];
    }, [standards]);

    const filtered = useMemo(() => {
        let list = [...standards];
        if (selectedPublisher !== "all") {
            list = list.filter((s) => s.publisher === selectedPublisher);
        }
        switch (sortBy) {
            case "price-asc": return list.sort((a, b) => a.price - b.price);
            case "price-desc": return list.sort((a, b) => b.price - a.price);
            case "year-new": return list.sort((a, b) => b.year - a.year);
            case "year-old": return list.sort((a, b) => a.year - b.year);
            default: return list;
        }
    }, [standards, selectedPublisher, sortBy]);

    const Sidebar = () => (
        <aside className="w-full space-y-6">
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Publisher</h3>
                <div className="space-y-1">
                    {publishers.map((pub) => (
                        <button
                            key={pub}
                            onClick={() => setSelectedPublisher(pub)}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                selectedPublisher === pub
                                    ? "bg-primary text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                            )}
                        >
                            {pub === "all" ? "All Publishers" : pub}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );

    return (
        <div className="flex gap-8">
            {/* Desktop sidebar */}
            <div className="hidden lg:block w-52 flex-shrink-0">
                <Sidebar />
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-900">Filter</h2>
                            <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <Sidebar />
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 min-w-0">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
                        >
                            <SlidersHorizontal className="w-4 h-4" /> Filter
                        </button>
                        <span className="text-sm text-gray-500">{filtered.length} standard{filtered.length !== 1 ? "s" : ""}</span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                        >
                            <option value="default">Default sorting</option>
                            <option value="year-new">Newest first</option>
                            <option value="year-old">Oldest first</option>
                            <option value="price-asc">Price: low to high</option>
                            <option value="price-desc">Price: high to low</option>
                        </select>
                        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setView("grid")}
                                className={cn("p-2 transition-colors", view === "grid" ? "bg-primary text-white" : "hover:bg-gray-100 text-gray-500")}
                                aria-label="Grid view"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setView("list")}
                                className={cn("p-2 transition-colors", view === "list" ? "bg-primary text-white" : "hover:bg-gray-100 text-gray-500")}
                                aria-label="List view"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">No standards match your filters.</div>
                ) : view === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((s) => (
                            <StandardCard key={s.slug} standard={s} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((s) => {
                            const book = standardToBook(s);
                            return (
                                <Link
                                    key={s.slug}
                                    href={`/standards/${s.slug}`}
                                    className="flex gap-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md p-4 transition-all group"
                                >
                                    {/* Icon block */}
                                    <div className="w-16 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white font-black text-xs text-center px-1">
                                        <FileText className="w-6 h-6 opacity-80" />
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <p className="text-[11px] text-primary font-semibold uppercase tracking-wide">{s.number}</p>
                                            <h3 className="font-bold text-gray-800 text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                                {s.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{s.publisher}</span>
                                            <span className="text-xs text-gray-400">{s.year}</span>
                                        </div>
                                    </div>
                                    {/* Price + Cart */}
                                    <div className="flex flex-col items-end justify-between flex-shrink-0 gap-2">
                                        <span className="text-base font-extrabold text-gray-900">{format(s.price)}</span>
                                        <button
                                            onClick={(e) => { e.preventDefault(); addToCart(book); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark transition-colors"
                                        >
                                            <ShoppingCart className="w-3.5 h-3.5" /> Add
                                        </button>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
