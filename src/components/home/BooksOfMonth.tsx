"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart } from "lucide-react";
import { Book } from "@/types/book";
import StarRating from "@/components/ui/StarRating";
import { useCartStore } from "@/store/cartStore";
import { useCurrencyStore, useFormatPrice } from "@/store/currencyStore";

interface BooksOfMonthProps {
    books: Book[];
}

function Countdown() {
    const getTimeLeft = () => {
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1, 1);
        endOfMonth.setHours(0, 0, 0, 0);
        const diff = endOfMonth.getTime() - Date.now();
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            mins: Math.floor((diff / (1000 * 60)) % 60),
            secs: Math.floor((diff / 1000) % 60),
        };
    };

    const [time, setTime] = useState(getTimeLeft());
    useEffect(() => {
        const id = setInterval(() => setTime(getTimeLeft()), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="flex gap-2 text-white">
            {[
                { v: time.days, label: "Days" },
                { v: time.hours, label: "Hours" },
                { v: time.mins, label: "Mins" },
                { v: time.secs, label: "Secs" },
            ].map(({ v, label }) => (
                <div key={label} className="flex flex-col items-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg w-12 h-12 flex items-center justify-center text-lg font-bold tabular-nums">
                        {String(v).padStart(2, "0")}
                    </div>
                    <span className="text-[9px] uppercase tracking-wider mt-1 text-white/70">
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function BooksOfMonth({ books }: BooksOfMonthProps) {
    const addToCart = useCartStore((s) => s.addItem);
    const format = useFormatPrice();

    return (
        <section className="py-14 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                            Limited Time
                        </p>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                            Books of the Month
                        </h2>
                    </div>
                    <Link
                        href="/shop"
                        className="text-sm font-semibold text-primary hover:underline"
                    >
                        View All →
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {books.slice(0, 3).map((book) => {
                        const discounted = book.discount
                            ? book.price * (1 - book.discount / 100)
                            : null;

                        return (
                            <div
                                key={book.sku}
                                className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1c2e] to-[#2d2560] shadow-lg flex flex-col"
                            >
                                {/* Featured image area */}
                                <div className="relative h-48 bg-white/5">
                                    {book.imageUrl ? (
                                        <Image
                                            src={book.imageUrl}
                                            alt={book.title}
                                            fill
                                            className="object-contain p-6"
                                            onError={() => { }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-6xl">📖</div>
                                    )}
                                    {book.discount && (
                                        <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded">
                                            -{book.discount}%
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 p-5 text-white">
                                    <StarRating rating={book.rating} count={book.reviewCount} size="sm" />
                                    <h3 className="font-bold text-base mt-2 mb-1 leading-snug line-clamp-2">
                                        {book.title}
                                    </h3>
                                    <p className="text-xs text-white/60 mb-2">
                                        By {book.authors}
                                    </p>

                                    {/* Countdown */}
                                    <div className="mb-4">
                                        <p className="text-xs text-white/50 mb-2 uppercase tracking-wider">
                                            Offer ends in
                                        </p>
                                        <Countdown />
                                    </div>

                                    {/* Price + CTA */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            {discounted ? (
                                                <>
                                                    <span className="text-amber-400 font-bold text-lg">
                                                        {format(discounted)}
                                                    </span>
                                                    <span className="text-white/50 line-through text-sm ml-2">
                                                        {format(book.price)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-amber-400 font-bold text-lg">
                                                    {format(book.price)}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => addToCart(book)}
                                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                        >
                                            <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
