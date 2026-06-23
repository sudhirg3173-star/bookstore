"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, Share2, FileText, Calendar, Building2, Hash, Package } from "lucide-react";
import { Standard } from "@/types/standard";
import { standardToBook } from "@/lib/standardUtils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { formatPrice } from "@/store/currencyStore";

interface Props {
    standard: Standard;
}

export default function StandardDetailClient({ standard }: Props) {
    const [addedToCart, setAddedToCart] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const book = standardToBook(standard);

    const addToCart = useCartStore((s) => s.addItem);
    const toggleWishlist = useWishlistStore((s) => s.toggleItem);
    const isWishlisted = useWishlistStore((s) => s.hasItem(book.sku));

    const handleAddToCart = () => {
        addToCart(book, quantity);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const acronym = standard.number.split(/[\s:]/)[0].toUpperCase();

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <nav className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/standards" className="hover:text-primary transition-colors">Standards</Link>
                        <span>/</span>
                        <span className="text-gray-600 truncate max-w-[200px]">{standard.number}</span>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {/* Image */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-full max-w-sm aspect-[3/4] relative bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                {standard.imageUrl && !imgError ? (
                                    <Image
                                        src={standard.imageUrl}
                                        alt={standard.name}
                                        fill
                                        className="object-contain p-6"
                                        onError={() => setImgError(true)}
                                        unoptimized
                                        priority
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                                        <FileText className="w-16 h-16 text-gray-300 mb-3" />
                                        <p className="text-sm text-gray-400 px-4 text-center font-semibold">
                                            {acronym}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div>
                            {/* Standard number badge */}
                            <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
                                {standard.number}
                            </span>

                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
                                {standard.name}
                            </h1>

                            {/* Description */}
                            <p className="text-sm text-gray-600 leading-relaxed mb-5 pb-5 border-b border-gray-100">
                                {standard.description}
                            </p>

                            {/* Price */}
                            <div className="flex items-baseline gap-3 mb-5 pb-5 border-b border-gray-100">
                                <span className="text-3xl font-extrabold text-primary">
                                    {formatPrice(standard.price, standard.currency)}
                                </span>
                                <span className="text-xs text-gray-400">Official print edition</span>
                            </div>

                            {/* Meta grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <Package className="w-4 h-4 text-primary mx-auto mb-1" />
                                    <p className="text-xs text-gray-500">Status</p>
                                    <p className="text-xs font-semibold mt-0.5 text-green-600">In Stock</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <Building2 className="w-4 h-4 text-primary mx-auto mb-1" />
                                    <p className="text-xs text-gray-500">Publisher</p>
                                    <p className="text-xs font-semibold mt-0.5 text-gray-700 leading-tight">{standard.publisher}</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <Calendar className="w-4 h-4 text-primary mx-auto mb-1" />
                                    <p className="text-xs text-gray-500">Year</p>
                                    <p className="text-xs font-semibold mt-0.5 text-gray-700">{standard.year}</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <Hash className="w-4 h-4 text-primary mx-auto mb-1" />
                                    <p className="text-xs text-gray-500">Standard No.</p>
                                    <p className="text-xs font-semibold mt-0.5 text-gray-700 leading-tight">{standard.number}</p>
                                </div>
                            </div>

                            {/* Quantity + Add to Cart */}
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
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${addedToCart
                                        ? "bg-green-500 text-white"
                                        : "bg-primary hover:bg-primary-dark text-white"
                                        }`}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {addedToCart ? "Added to Cart!" : "Add to Cart"}
                                </button>
                            </div>

                            {/* Wishlist + Share */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => toggleWishlist(book)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${isWishlisted
                                        ? "bg-red-50 border-primary text-primary"
                                        : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                                        }`}
                                >
                                    <Heart className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} />
                                    {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                                </button>
                                <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors">
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Standard No. footer */}
                            <p className="text-xs text-gray-400 mt-4">
                                Standard No: {standard.number} &nbsp;|&nbsp; Publisher: {standard.publisher}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
