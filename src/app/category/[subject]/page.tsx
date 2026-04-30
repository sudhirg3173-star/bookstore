import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getAllBooks, getBooksBySubject, getSubjects, subjectToSlug, slugToSubject } from "@/lib/books";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductGridSkeleton from "@/components/shop/ProductGridSkeleton";

export const dynamic = "force-dynamic";

interface Props {
    params: { subject: string };
}

export async function generateMetadata({ params }: Props) {
    const name = slugToSubject(params.subject);
    return {
        title: name ? `${name} Books — Kabdwalbook` : "Category — Kabdwalbook",
        description: `Browse ${name || "our"} books collection on Kabdwalbook.`,
    };
}

export default function CategoryPage({ params }: Props) {
    const subjectName = slugToSubject(params.subject);
    if (!subjectName) notFound();

    const books = getBooksBySubject(subjectName);
    const allSubjects = getSubjects();

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Banner */}
            <div className="bg-gradient-to-r from-[#1a1c2e] to-[#302b63] py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="text-xs text-white/50 mb-2">
                        <Link href="/" className="hover:text-white/80 transition-colors">
                            Home
                        </Link>
                        <span className="mx-1.5">/</span>
                        <Link href="/shop" className="hover:text-white/80 transition-colors">
                            Shop
                        </Link>
                        <span className="mx-1.5">/</span>
                        <span className="text-white/80">{subjectName}</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold text-white">{subjectName}</h1>
                    <p className="text-white/60 text-sm mt-1">
                        {books.length} books available
                    </p>
                </div>
            </div>

            {/* Subject tabs */}
            <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
                        {allSubjects.map((s) => {
                            const slug = subjectToSlug(s);
                            return (
                                <Link
                                    key={slug}
                                    href={`/category/${slug}`}
                                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${slug === params.subject
                                        ? "bg-primary text-white shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {s}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<ProductGridSkeleton />}>
                    <ProductGrid
                        books={books}
                        subjects={allSubjects}
                        currentSubject={subjectName}
                        showSidebar={true}
                    />
                </Suspense>
            </div>
        </div>
    );
}
