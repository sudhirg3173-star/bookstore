"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, FileText, Award } from "lucide-react";
import { Standard } from "@/types/standard";
import { standardToBook } from "@/lib/standardUtils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { formatPrice } from "@/store/currencyStore";
import { cn } from "@/lib/utils";

// Deterministic colour per publisher
const publisherColors: Record<string, string> = {
    AIAG: "from-blue-700 to-blue-900",
    ISO: "from-indigo-700 to-indigo-900",
    IATF: "from-violet-700 to-violet-900",
};

function gradientFor(publisher: string) {
    return publisherColors[publisher] ?? "from-slate-700 to-slate-900";
}

interface StandardCardProps {
    standard: Standard;
    className?: string;
}

export default function StandardCard({ standard, className }: StandardCardProps) {
    const [addedToCart, setAddedToCart] = useState(false);
    const book = standardToBook(standard);

    const addToCart = useCartStore((s) => s.addItem);
    const toggleWishlist = useWishlistStore((s) => s.toggleItem);
    const isWishlisted = useWishlistStore((s) => s.hasItem(book.sku));

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        addToCart(book);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 1500);
    };

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        toggleWishlist(book);
    };

    // Acronym: first word or first letters of each word
    const acronym = standard.number.split(/[\s:]/)[0].toUpperCase();

    return (
        <div
            className={cn(
                "group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col",
                className
            )}
        >
            {/* Cover */}
            <Link
                href={`/standards/${standard.slug}`}
                className={cn(
                    "relative flex flex-col items-center justify-center aspect-[3/4] overflow-hidden",
                    !standard.imageUrl && cn("bg-gradient-to-br p-5 text-white", gradientFor(standard.publisher))
                )}
            >
                {standard.imageUrl ? (
                    <Image
                        src={standard.imageUrl}
                        alt={standard.name}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <>
                        {/* Glossy shine */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
                                <FileText className="w-7 h-7 text-white/90" />
                            </div>
                            <span className="text-2xl font-black tracking-tight leading-tight px-2">
                                {acronym}
                            </span>
                            <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                                {standard.publisher} · {standard.year}
                            </span>
                        </div>
                    </>
                )}

                {/* Hover overlay */}
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={handleWishlist}
                        className={cn(
                            "w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-colors",
                            isWishlisted
                                ? "bg-primary text-white"
                                : "bg-white text-gray-600 hover:bg-primary hover:text-white"
                        )}
                        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                        <Heart className="w-3.5 h-3.5" fill={isWishlisted ? "currentColor" : "none"} />
                    </button>
                </div>

                {/* Badge */}
                <div className="absolute top-2 left-2">
                    <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                        <Award className="w-3 h-3" /> STANDARD
                    </span>
                </div>
            </Link>

            {/* Card body */}
            <div className="flex flex-col flex-1 p-3">
                <p className="text-[11px] text-primary font-semibold uppercase tracking-wide mb-0.5 truncate">
                    {standard.number}
                </p>
                <Link
                    href={`/standards/${standard.slug}`}
                    className="text-sm font-bold text-gray-800 leading-snug hover:text-primary transition-colors line-clamp-2 mb-1"
                >
                    {standard.name}
                </Link>
                <p className="text-xs text-gray-500 line-clamp-2 flex-1 mb-3">
                    {standard.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span className="text-base font-extrabold text-gray-900">
                            {formatPrice(standard.price, standard.currency)}
                        </span>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                            addedToCart
                                ? "bg-green-500 text-white"
                                : "bg-primary text-white hover:bg-primary-dark"
                        )}
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {addedToCart ? "Added ✓" : "Add to Cart"}
                    </button>
                </div>
            </div>
        </div>
    );
}
