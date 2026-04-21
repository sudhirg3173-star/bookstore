"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Book } from "@/types/book";
import ProductCard from "@/components/shop/ProductCard";
import ShopSidebar from "@/components/shop/ShopSidebar";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { formatPrice, getBookUrl } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

interface ProductGridProps {
    books: Book[];
    subjects?: string[];
    currentSubject?: string;
    showSidebar?: boolean;
}

type SortKey =
    | "default"
    | "price-asc"
    | "price-desc"
    | "rating"
    | "name"
    | "new";

export default function ProductGrid({
    books,
    subjects = [],
    currentSubject,
    showSidebar = true,
}: ProductGridProps) {
    const [sort, setSort] = useState<SortKey>("new");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(16);
    const [view, setView] = useState<"grid" | "list">("grid");
    const [filters, setFilters] = useState({
        availability: [] as string[],
        minPrice: 0,
        maxPrice: 5000,
    });

    const filtered = useMemo(() => {
        let result = [...books];
        if (filters.availability.length > 0) {
            result = result.filter((b) =>
                filters.availability.includes(b.availability)
            );
        }
        result = result.filter(
            (b) => b.price >= filters.minPrice && b.price <= filters.maxPrice
        );
        return result;
    }, [books, filters]);

    const sorted = useMemo(() => {
        const result = [...filtered];
        switch (sort) {
            case "price-asc":
                return result.sort((a, b) => a.price - b.price);
            case "price-desc":
                return result.sort((a, b) => b.price - a.price);
            case "rating":
                return result.sort((a, b) => b.rating - a.rating);
            case "name":
                return result.sort((a, b) => a.title.localeCompare(b.title));
            case "new":
            default:
                return result.sort((a, b) => b.publicationYear - a.publicationYear);
        }
    }, [filtered, sort]);

    const totalPages = Math.ceil(sorted.length / pageSize);
    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSort(e.target.value as SortKey);
        setPage(1);
    };

    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters);
        setPage(1);
    };

    return (
        <div className="flex gap-6 items-start">
            {showSidebar && (
                <ShopSidebar
                    subjects={subjects}
                    currentSubject={currentSubject}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />
            )}

            <div className="flex-1 min-w-0">
                {/* Sort & view controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
                    <p className="text-sm text-gray-500">
                        Showing{" "}
                        <span className="font-semibold text-gray-800">
                            {(page - 1) * pageSize + 1}–
                            {Math.min(page * pageSize, sorted.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-gray-800">{sorted.length}</span>{" "}
                        results
                    </p>

                    <div className="flex items-center gap-3">
                        <select
                            value={sort}
                            onChange={handleSortChange}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-primary bg-white"
                        >
                            <option value="new">Newest first</option>
                            <option value="rating">Top rated</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="name">Name: A–Z</option>
                        </select>

                        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setView("grid")}
                                className={`p-2 transition-colors ${view === "grid" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50"}`}
                                aria-label="Grid view"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setView("list")}
                                className={`p-2 transition-colors ${view === "list" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50"}`}
                                aria-label="List view"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Books */}
                {paginated.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <span className="text-5xl mb-4 block">📚</span>
                        <p className="text-lg font-semibold mb-1">No books found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                    </div>
                ) : view === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                        {paginated.map((book) => (
                            <ProductCard key={book.sku} book={book} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {paginated.map((book) => (
                            <ListCard key={book.sku} book={book} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
                        {/* Prev */}
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {(() => {
                            const buttons: React.ReactNode[] = [];
                            const delta = 2; // pages each side of current
                            const range: number[] = [];

                            // Always include first, last, and window around current page
                            for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
                                range.push(i);
                            }

                            const allPages = [1, ...range, totalPages].filter(
                                (v, i, arr) => arr.indexOf(v) === i && v >= 1 && v <= totalPages
                            );

                            let prev = 0;
                            for (const pg of allPages) {
                                if (prev && pg - prev > 1) {
                                    buttons.push(
                                        <span key={`ellipsis-${pg}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none">
                                            …
                                        </span>
                                    );
                                }
                                buttons.push(
                                    <button
                                        key={pg}
                                        onClick={() => setPage(pg)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${pg === page
                                            ? "bg-primary text-white shadow-sm"
                                            : "border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                                            }`}
                                    >
                                        {pg}
                                    </button>
                                );
                                prev = pg;
                            }
                            return buttons;
                        })()}

                        {/* Next */}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ListCard({ book }: { book: Book }) {
    const addToCart = useCartStore((s) => s.addItem);
    const [added, setAdded] = useState(false);

    const discounted = book.discount
        ? book.price * (1 - book.discount / 100)
        : null;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        addToCart(book);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <Link
            href={getBookUrl(book)}
            className="flex gap-4 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-primary/20 transition-all group"
        >
            {/* Cover */}
            <div className="w-20 h-28 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden relative border border-gray-100">
                <img
                    src={book.imageUrl}
                    alt={book.title}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                    }}
                />
                {book.discount && (
                    <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                        -{book.discount}%
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] text-primary font-medium bg-primary/5 px-2 py-0.5 rounded-full">
                            {book.subject}
                        </span>
                        {book.availability === "Out of Stock" && (
                            <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                Out of Stock
                            </span>
                        )}
                    </div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 text-sm mt-1 mb-0.5">
                        {book.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1 truncate">By {book.authors}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                        {book.publicationYear > 0 && <span>{book.publicationYear}</span>}
                        {book.pages > 0 && <span>{book.pages} pages</span>}
                        <span>ISBN: {book.sku}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-primary font-bold text-sm">
                            {formatPrice(discounted ?? book.price)}
                        </span>
                        {discounted && (
                            <span className="text-gray-400 line-through text-xs">
                                {formatPrice(book.price)}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleAddToCart}
                        disabled={book.availability !== "In Stock"}
                        className="text-xs bg-primary disabled:bg-gray-200 disabled:text-gray-400 text-white px-3 py-1.5 rounded-md hover:bg-primary-dark transition-colors"
                    >
                        {added ? "Added ✓" : "Add to Cart"}
                    </button>
                </div>
            </div>
        </Link>
    );
}
