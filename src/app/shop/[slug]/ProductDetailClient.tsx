"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Share2, Star, Package, BookOpen, Calendar } from "lucide-react";
import { Book } from "@/types/book";
import { formatPrice } from "@/store/currencyStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import StarRating from "@/components/ui/StarRating";
import ProductCard from "@/components/shop/ProductCard";

interface ProductDetailClientProps {
    book: Book;
    related: Book[];
}

type Tab = "description" | "details" | "reviews";

export default function ProductDetailClient({
    book,
    related,
}: ProductDetailClientProps) {
    const [quantity, setQuantity] = useState(1);
    const [imgError, setImgError] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("description");
    const [added, setAdded] = useState(false);

    const addToCart = useCartStore((s) => s.addItem);
    const toggleWishlist = useWishlistStore((s) => s.toggleItem);
    const isWishlisted = useWishlistStore((s) => s.hasItem(book.sku));

    const discounted = book.discount
        ? book.price * (1 - book.discount / 100)
        : null;

    const handleAddToCart = () => {
        addToCart(book, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: "description", label: "Description" },
        { key: "details", label: "Book Details" },
        { key: "reviews", label: `Reviews (${book.reviewCount})` },
    ];

    return (
        <div>
            {/* Product section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-full max-w-sm aspect-[3/4] relative bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                            {!imgError ? (
                                <Image
                                    src={book.imageUrl}
                                    alt={book.title}
                                    fill
                                    className="object-contain p-6"
                                    onError={() => setImgError(true)}
                                    priority
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                                    <span className="text-6xl mb-3">📖</span>
                                    <p className="text-sm text-gray-400 px-4 text-center">
                                        {book.title}
                                    </p>
                                </div>
                            )}
                            {book.discount && (
                                <div className="absolute top-3 left-3 bg-primary text-white text-sm font-bold px-3 py-1 rounded-lg">
                                    -{book.discount}%
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div>
                        {/* Subject badge */}
                        <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
                            {book.subject}
                        </span>

                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-3">
                            {book.title}
                        </h1>

                        {/* Rating */}
                        <div className="flex items-center gap-3 mb-4">
                            <StarRating rating={book.rating} count={book.reviewCount} size="md" />
                            <span className="text-sm text-gray-500">
                                {book.rating.toFixed(1)} out of 5
                            </span>
                        </div>

                        {/* Author */}
                        <p className="text-sm text-gray-600 mb-4">
                            By:{" "}
                            <span className="font-semibold text-primary">{book.authors}</span>
                        </p>

                        {/* Price */}
                        <div className="flex items-baseline gap-3 mb-5 pb-5 border-b border-gray-100">
                            {discounted ? (
                                <>
                                    <span className="text-3xl font-extrabold text-primary">
                                        {formatPrice(discounted, book.currency)}
                                    </span>
                                    <span className="text-lg text-gray-400 line-through">
                                        {formatPrice(book.price, book.currency)}
                                    </span>
                                    <span className="text-sm bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                                        Save {book.discount}%
                                    </span>
                                </>
                            ) : (
                                <span className="text-3xl font-extrabold text-primary">
                                    {formatPrice(book.price, book.currency)}
                                </span>
                            )}
                        </div>

                        {/* Quick info */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                                <Package className="w-4 h-4 text-primary mx-auto mb-1" />
                                <p className="text-xs text-gray-500">Status</p>
                                <p
                                    className={`text-xs font-semibold mt-0.5 ${book.availability === "In Stock"
                                        ? "text-green-600"
                                        : "text-red-500"
                                        }`}
                                >
                                    {book.availability}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                                <BookOpen className="w-4 h-4 text-primary mx-auto mb-1" />
                                <p className="text-xs text-gray-500">Pages</p>
                                <p className="text-xs font-semibold mt-0.5 text-gray-700">
                                    {book.pages}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                                <Calendar className="w-4 h-4 text-primary mx-auto mb-1" />
                                <p className="text-xs text-gray-500">Year</p>
                                <p className="text-xs font-semibold mt-0.5 text-gray-700">
                                    {book.publicationYear}
                                </p>
                            </div>
                        </div>

                        {/* Quantity + Cart */}
                        {book.availability === "In Stock" ? (
                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-fit">
                                    <button
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        className="px-4 py-3 text-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                                    >
                                        −
                                    </button>
                                    <span className="px-4 py-3 text-sm font-semibold min-w-[3rem] text-center">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity((q) => q + 1)}
                                        className="px-4 py-3 text-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${added
                                        ? "bg-green-500 text-white"
                                        : "bg-primary hover:bg-primary-dark text-white"
                                        }`}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {added ? "Added to Cart!" : "Add to Cart"}
                                </button>
                            </div>
                        ) : (
                            <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600 font-medium text-center">
                                Currently Out of Stock
                            </div>
                        )}

                        {/* Wishlist + Share */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => toggleWishlist(book)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${isWishlisted
                                    ? "bg-red-50 border-primary text-primary"
                                    : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                                    }`}
                            >
                                <Heart
                                    className="w-4 h-4"
                                    fill={isWishlisted ? "currentColor" : "none"}
                                />
                                {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                            </button>
                            <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* SKU */}
                        <p className="text-xs text-gray-400 mt-4">
                            ISBN: {book.sku} &nbsp;|&nbsp; Category: {book.category}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-4 text-sm font-semibold transition-all ${activeTab === tab.key
                                ? "border-b-2 border-primary text-primary"
                                : "text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="p-6">
                    {activeTab === "description" && (
                        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                            {book.description || (
                                <p className="text-gray-400 italic">No description available.</p>
                            )}
                        </div>
                    )}
                    {activeTab === "details" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            {[
                                ["ISBN / SKU", book.sku],
                                ["Authors", book.authors],
                                ["Pages", String(book.pages)],
                                ["Publication Year", String(book.publicationYear)],
                                ["Category", book.category],
                                ["Subject", book.subject],
                                ["Availability", book.availability],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex justify-between py-2 border-b border-gray-50"
                                >
                                    <span className="font-medium text-gray-500">{label}</span>
                                    <span className="text-gray-800 text-right max-w-[60%]">
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === "reviews" && (
                        <div>
                            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                                <div className="text-center">
                                    <div className="text-5xl font-extrabold text-gray-800">
                                        {book.rating.toFixed(1)}
                                    </div>
                                    <StarRating rating={book.rating} size="md" showCount={false} />
                                    <div className="text-xs text-gray-400 mt-1">
                                        {book.reviewCount} reviews
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 italic">
                                Detailed reviews are not available for this item.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Related */}
            {related.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-extrabold text-gray-900 mb-5">
                        Related Products
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {related.map((b) => (
                            <ProductCard key={b.sku} book={b} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
