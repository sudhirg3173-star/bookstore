"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import { formatPrice, getBookUrl } from "@/lib/utils";
import StarRating from "@/components/ui/StarRating";

export default function WishlistPage() {
    const { items, removeItem } = useWishlistStore();
    const addToCart = useCartStore((s) => s.addItem);

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
                <Heart className="w-20 h-20 text-gray-200 mb-6" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Your Wishlist is Empty
                </h2>
                <p className="text-gray-500 mb-8">
                    Save books you love to your wishlist
                </p>
                <Link
                    href="/shop"
                    className="bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-dark transition-colors"
                >
                    Browse Books
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-extrabold text-gray-900">
                        My Wishlist{" "}
                        <span className="text-gray-400 font-normal text-lg">
                            ({items.length} {items.length === 1 ? "book" : "books"})
                        </span>
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {items.map((book) => {
                        const discounted = book.discount
                            ? book.price * (1 - book.discount / 100)
                            : null;

                        return (
                            <div
                                key={book.sku}
                                className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                            >
                                <Link
                                    href={getBookUrl(book)}
                                    className="block relative aspect-[3/4] bg-gray-50"
                                >
                                    <Image
                                        src={book.imageUrl}
                                        alt={book.title}
                                        fill
                                        className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                                        onError={() => { }}
                                    />
                                    {book.discount && (
                                        <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                                            -{book.discount}%
                                        </span>
                                    )}
                                </Link>
                                <div className="p-3">
                                    <StarRating
                                        rating={book.rating}
                                        count={book.reviewCount}
                                        size="sm"
                                    />
                                    <Link href={getBookUrl(book)}>
                                        <h3 className="text-sm font-semibold text-gray-800 hover:text-primary transition-colors line-clamp-2 mt-1 mb-1">
                                            {book.title}
                                        </h3>
                                    </Link>
                                    <p className="text-xs text-gray-400 mb-2 truncate">
                                        {book.authors}
                                    </p>
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className="text-primary font-bold text-sm">
                                            {formatPrice(discounted ?? book.price)}
                                        </span>
                                        {discounted && (
                                            <span className="text-gray-400 line-through text-xs">
                                                {formatPrice(book.price)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => addToCart(book)}
                                            disabled={book.availability !== "In Stock"}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-primary disabled:bg-gray-200 disabled:text-gray-400 text-white py-2 rounded-lg text-xs font-semibold hover:bg-primary-dark transition-colors"
                                        >
                                            <ShoppingCart className="w-3.5 h-3.5" />
                                            Add to Cart
                                        </button>
                                        <button
                                            onClick={() => removeItem(book.sku)}
                                            className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                                            aria-label="Remove from wishlist"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
