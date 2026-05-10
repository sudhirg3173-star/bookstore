"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ShoppingCart, Heart, FileText, Award, ArrowLeft,
    Calendar, Building2, Hash, BookOpen,
} from "lucide-react";
import { Standard } from "@/types/standard";
import { standardToBook } from "@/lib/standardUtils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { formatPrice } from "@/store/currencyStore";
import { cn } from "@/lib/utils";

interface Props {
    standard: Standard;
}

export default function StandardDetailClient({ standard }: Props) {
    const [addedToCart, setAddedToCart] = useState(false);
    const book = standardToBook(standard);

    const addToCart = useCartStore((s) => s.addItem);
    const toggleWishlist = useWishlistStore((s) => s.toggleItem);
    const isWishlisted = useWishlistStore((s) => s.hasItem(book.sku));

    const handleAddToCart = () => {
        addToCart(book);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 1500);
    };

    const acronym = standard.number.split(/[\s:]/)[0].toUpperCase();

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Breadcrumb */}
            <div className="bg-gradient-to-r from-[#1a1c2e] to-[#302b63] py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center gap-2 text-xs text-white/60">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/standards" className="hover:text-white transition-colors">Standards</Link>
                        <span>/</span>
                        <span className="text-white truncate">{standard.number}</span>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Link href="/standards" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Standards
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid md:grid-cols-[280px_1fr] gap-0">
                        {/* Cover panel */}
                        <div className="bg-gradient-to-br from-blue-700 to-blue-900 flex flex-col items-center justify-center p-10 text-white min-h-[320px] relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                                <div className="w-20 h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
                                    <FileText className="w-10 h-10 text-white/90" />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight">{acronym}</h2>
                                <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                                    {standard.publisher} · {standard.year}
                                </span>
                                <div className="mt-2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                                    <Award className="w-3.5 h-3.5" /> Official Standard
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-8 flex flex-col gap-6">
                            <div>
                                <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1">{standard.number}</p>
                                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-3">
                                    {standard.name}
                                </h1>
                                <p className="text-gray-600 text-sm leading-relaxed">{standard.description}</p>
                            </div>

                            {/* Meta grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3">
                                    <Building2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Publisher</p>
                                        <p className="text-sm font-semibold text-gray-700">{standard.publisher}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3">
                                    <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Year</p>
                                        <p className="text-sm font-semibold text-gray-700">{standard.year}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3">
                                    <Hash className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Standard No.</p>
                                        <p className="text-sm font-semibold text-gray-700">{standard.number}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Price + Actions */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2 border-t border-gray-100">
                                <div>
                                    <p className="text-3xl font-extrabold text-gray-900">{formatPrice(standard.price, standard.currency)}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Official print edition</p>
                                </div>
                                <div className="flex items-center gap-3 sm:ml-auto">
                                    <button
                                        onClick={() => toggleWishlist(book)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                                            isWishlisted
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                                        )}
                                    >
                                        <Heart className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} />
                                        {isWishlisted ? "Wishlisted" : "Wishlist"}
                                    </button>
                                    <button
                                        onClick={handleAddToCart}
                                        className={cn(
                                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                                            addedToCart
                                                ? "bg-green-500 text-white"
                                                : "bg-primary hover:bg-primary-dark text-white"
                                        )}
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        {addedToCart ? "Added to Cart ✓" : "Add to Cart"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
