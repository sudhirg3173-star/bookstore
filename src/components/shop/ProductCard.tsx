"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Book } from "@/types/book";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import StarRating from "@/components/ui/StarRating";
import { truncate, getBookUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/store/currencyStore";

interface ProductCardProps {
    book: Book;
    className?: string;
}

export default function ProductCard({ book, className }: ProductCardProps) {
    const [imgError, setImgError] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);

    const addToCart = useCartStore((s) => s.addItem);
    const toggleWishlist = useWishlistStore((s) => s.toggleItem);
    const isWishlisted = useWishlistStore((s) => s.hasItem(book.sku));

    const discountedPrice = book.discount
        ? book.price * (1 - book.discount / 100)
        : null;

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

    return (
        <div
            className={cn(
                "group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col",
                className
            )}
        >
            {/* Image container */}
            <Link href={getBookUrl(book)} className="relative block overflow-hidden bg-gray-50 aspect-[3/4]">
                {!imgError ? (
                    <Image
                        src={book.imageUrl}
                        alt={book.title}
                        fill
                        className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImgError(true)}
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
                        <span className="text-4xl mb-2">📖</span>
                        <p className="text-xs text-gray-500 text-center font-medium leading-tight">
                            {truncate(book.title, 40)}
                        </p>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {book.availability === "Out of Stock" && (
                        <span className="bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                            OUT OF STOCK
                        </span>
                    )}
                    {book.subject === "New Releases" && !book.discount && (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                            NEW
                        </span>
                    )}
                </div>

                {/* Discount banner */}
                {book.discount && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-xs font-bold py-1 text-center tracking-wide">
                        -{book.discount}% OFF
                    </div>
                )}

                {/* Hover actions overlay */}
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
                    <Link
                        href={getBookUrl(book)}
                        className="w-8 h-8 rounded-full bg-white text-gray-600 hover:bg-primary hover:text-white shadow-md flex items-center justify-center transition-colors"
                        aria-label="Quick view"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </Link>

            {/* Card body */}
            <div className="flex flex-col flex-1 p-3">
                {/* Rating */}
                <div className="mb-1">
                    <StarRating rating={book.rating} count={book.reviewCount} size="sm" />
                </div>

                {/* Author */}
                <p className="text-[11px] text-gray-400 mb-1 truncate">
                    By:{" "}
                    <span className="text-primary hover:underline cursor-pointer">
                        {truncate(book.authors, 35)}
                    </span>
                </p>

                {/* Title */}
                <Link href={getBookUrl(book)} className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-800 hover:text-primary transition-colors leading-snug line-clamp-2 mb-2">
                        {book.title}
                    </h3>
                </Link>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                    {discountedPrice ? (
                        <>
                            <span className="text-primary font-bold text-sm">
                                {formatPrice(discountedPrice, book.currency)}
                            </span>
                            <span className="text-gray-400 line-through text-xs">
                                {formatPrice(book.price, book.currency)}
                            </span>
                        </>
                    ) : (
                        <span className="text-primary font-bold text-sm">
                            {formatPrice(book.price, book.currency)}
                        </span>
                    )}
                </div>

                {/* Add to cart */}
                <button
                    onClick={handleAddToCart}
                    disabled={book.availability === "Out of Stock"}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
                        book.availability === "Out of Stock"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : addedToCart
                                ? "bg-emerald-500 text-white"
                                : "bg-primary text-white hover:bg-primary-dark"
                    )}
                >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {book.availability === "Out of Stock"
                        ? "Out of Stock"
                        : addedToCart
                            ? "Added!"
                            : "Add to Cart"}
                </button>
            </div>
        </div>
    );
}
