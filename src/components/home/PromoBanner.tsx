import Link from "next/link";
import { Tag } from "lucide-react";

export default function PromoBanner() {
    return (
        <section className="bg-amber-400 py-5">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                    <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-amber-900" />
                        <span className="text-sm font-bold text-amber-900 uppercase tracking-widest">
                            More Bang for Your Book
                        </span>
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-amber-600/40" />
                    <p className="text-2xl font-extrabold text-amber-900">
                        20% Off Select Books
                    </p>
                    <div className="hidden sm:block w-px h-6 bg-amber-600/40" />
                    <Link
                        href="/shop"
                        className="bg-amber-900 hover:bg-amber-800 text-amber-100 px-6 py-2.5 rounded-full text-sm font-bold transition-colors"
                    >
                        Shop Now →
                    </Link>
                </div>
            </div>
        </section>
    );
}
