import Link from "next/link";
import { Book } from "@/types/book";
import ProductCard from "@/components/shop/ProductCard";

interface TopBooksSectionProps {
    books: Book[];
    title?: string;
    subtitle?: string;
    viewAllHref?: string;
}

export default function TopBooksSection({
    books,
    title = "Kabdwalbook Top Books",
    subtitle = "Our Bestsellers",
    viewAllHref = "/shop",
}: TopBooksSectionProps) {
    return (
        <section className="py-14 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                            {subtitle}
                        </p>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                            {title}
                        </h2>
                    </div>
                    <Link
                        href={viewAllHref}
                        className="text-sm font-semibold text-primary hover:underline flex-shrink-0"
                    >
                        View All →
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-5">
                    {books.slice(0, 8).map((book) => (
                        <ProductCard key={book.sku} book={book} />
                    ))}
                </div>
            </div>
        </section>
    );
}
