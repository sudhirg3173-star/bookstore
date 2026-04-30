import { notFound } from "next/navigation";
import Link from "next/link";
import { getBookBySku, getRelatedBooks } from "@/lib/books";
import ProductDetailClient from "@/app/shop/[slug]/ProductDetailClient";

export const dynamic = "force-dynamic";

interface Props {
    params: { title: string; author: string; isbn: string };
}

export async function generateMetadata({ params }: Props) {
    const book = getBookBySku(params.isbn);
    if (!book) return { title: "Book Not Found — Kabdwalbook" };
    return {
        title: `${book.title} — Kabdwalbook`,
        description: book.description.slice(0, 160),
    };
}

export default function ProductPage({ params }: Props) {
    const book = getBookBySku(params.isbn);
    if (!book) notFound();

    const related = getRelatedBooks(book, 4);

    const subjectSlug = book.subject
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <nav className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Link href="/" className="hover:text-primary transition-colors">
                            Home
                        </Link>
                        <span>/</span>
                        <Link href="/shop" className="hover:text-primary transition-colors">
                            Shop
                        </Link>
                        <span>/</span>
                        <Link
                            href={`/category/${subjectSlug}`}
                            className="hover:text-primary transition-colors"
                        >
                            {book.subject}
                        </Link>
                        <span>/</span>
                        <span className="text-gray-600 truncate max-w-[200px]">
                            {book.title}
                        </span>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProductDetailClient book={book} related={related} />
            </div>
        </div>
    );
}
