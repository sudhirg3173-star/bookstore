"use client";

import Link from "next/link";
import { Book } from "@/types/book";
import ProductCard from "@/components/shop/ProductCard";

interface TrendingBooksProps {
    books: Book[];
    title?: string;
}

export default function TrendingBooks({ books, title = "Trending on Kabdwalbook" }: TrendingBooksProps) {
    return (
        <section className="py-14 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                            What&apos;s Hot
                        </p>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                            {title}
                        </h2>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-5">
                    {books.slice(0, 8).map((book) => (
                        <ProductCard key={book.sku} book={book} />
                    ))}
                </div>

                <div className="text-center mt-10">
                    <Link
                        href="/shop"
                        className="inline-block border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-full font-semibold text-sm transition-all duration-200"
                    >
                        View All Books →
                    </Link>
                </div>
            </div>
        </section>
    );
}
