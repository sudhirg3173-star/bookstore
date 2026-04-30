import { Suspense } from "react";
import Link from "next/link";
import { searchBooks } from "@/lib/books";
import { searchStandards } from "@/lib/standards";
import ProductGrid from "@/components/shop/ProductGrid";
import StandardsGrid from "@/components/standards/StandardsGrid";

interface Props {
    searchParams: { q?: string; type?: string };
}

export function generateMetadata({ searchParams }: Props) {
    const label = searchParams.type === "standards" ? "Standard" : "Book";
    return {
        title: searchParams.q
            ? `Search: "${searchParams.q}" — Kabdwalbook`
            : "Search — Kabdwalbook",
    };
}

export default function SearchPage({ searchParams }: Props) {
    const query = searchParams.q || "";
    const type = searchParams.type === "standards" ? "standards" : searchParams.type === "books" ? "books" : "all";

    const bookResults = (type === "all" || type === "books") && query ? searchBooks(query) : [];
    const standardResults = (type === "all" || type === "standards") && query ? searchStandards(query) : [];

    const totalCount = bookResults.length + standardResults.length;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="bg-gradient-to-r from-[#1a1c2e] to-[#302b63] py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                        {query ? (
                            <>
                                Search results for{" "}
                                <span className="text-amber-400">&ldquo;{query}&rdquo;</span>
                            </>
                        ) : (
                            "Search"
                        )}
                    </h1>
                    {query && (
                        <p className="text-white/60 mt-1 text-sm">
                            {totalCount} result{totalCount !== 1 ? "s" : ""} found
                            {type !== "all" && <span> in <span className="text-white font-medium capitalize">{type}</span></span>}
                        </p>
                    )}

                    {/* Type tabs */}
                    {query && (
                        <div className="flex items-center gap-2 mt-4">
                            {(["all", "books", "standards"] as const).map((t) => (
                                <Link
                                    key={t}
                                    href={`/search?q=${encodeURIComponent(query)}${t !== "all" ? `&type=${t}` : ""}`}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${type === t
                                        ? "bg-primary text-white"
                                        : "bg-white/10 text-white/70 hover:bg-white/20"
                                        }`}
                                >
                                    {t === "all" ? "All" : t === "books" ? `Books (${searchBooks(query).length})` : `Standards (${searchStandards(query).length})`}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                {!query ? (
                    <div className="text-center py-16">
                        <span className="text-5xl mb-4 block">🔍</span>
                        <p className="text-lg font-semibold text-gray-600">
                            Use the search bar to find books or standards
                        </p>
                    </div>
                ) : totalCount === 0 ? (
                    <div className="text-center py-16">
                        <span className="text-5xl mb-4 block">📭</span>
                        <p className="text-lg font-semibold text-gray-700 mb-2">
                            No results found for &ldquo;{query}&rdquo;
                        </p>
                        <p className="text-sm text-gray-500">
                            Try different keywords or browse our categories
                        </p>
                    </div>
                ) : (
                    <>
                        {bookResults.length > 0 && (
                            <section>
                                {type === "all" && (
                                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                                        Books <span className="text-gray-400 font-normal text-sm">({bookResults.length})</span>
                                    </h2>
                                )}
                                <Suspense fallback={<div className="text-center py-10 text-gray-400">Loading…</div>}>
                                    <ProductGrid books={bookResults} showSidebar={false} />
                                </Suspense>
                            </section>
                        )}

                        {standardResults.length > 0 && (
                            <section>
                                {type === "all" && (
                                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                                        Standards <span className="text-gray-400 font-normal text-sm">({standardResults.length})</span>
                                    </h2>
                                )}
                                <Suspense fallback={<div className="text-center py-10 text-gray-400">Loading…</div>}>
                                    <StandardsGrid standards={standardResults} />
                                </Suspense>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
