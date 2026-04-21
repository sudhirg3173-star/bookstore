import { Suspense } from "react";
import { getAllBooks, getSubjects } from "@/lib/books";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductGridSkeleton from "@/components/shop/ProductGridSkeleton";

export const metadata = {
    title: "Shop All Books — Kabadwalbook",
    description: "Browse our complete collection of academic and professional books.",
};

export default function ShopPage() {
    const books = getAllBooks();
    const subjects = getSubjects();

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Category banner */}
            <div className="bg-gradient-to-r from-[#1a1c2e] to-[#302b63] py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="text-xs text-white/50 mb-2">
                        <span>Home</span>
                        <span className="mx-1.5">/</span>
                        <span className="text-white/80">Shop</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold text-white">All Books</h1>
                    <p className="text-white/60 text-sm mt-1">
                        {books.length} books available
                    </p>
                </div>
            </div>

            {/* Products */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<ProductGridSkeleton />}>
                    <ProductGrid books={books} subjects={subjects} showSidebar={true} />
                </Suspense>
            </div>
        </div>
    );
}
