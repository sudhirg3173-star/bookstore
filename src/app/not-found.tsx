import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
            <BookOpen className="w-20 h-20 text-gray-200 mb-6" />
            <h1 className="text-6xl font-extrabold text-gray-800 mb-2">404</h1>
            <h2 className="text-2xl font-bold text-gray-700 mb-3">Page Not Found</h2>
            <p className="text-gray-500 mb-8 max-w-sm">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <div className="flex gap-3">
                <Link
                    href="/"
                    className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold hover:bg-primary-dark transition-colors text-sm"
                >
                    Go Home
                </Link>
                <Link
                    href="/shop"
                    className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full font-semibold hover:border-primary hover:text-primary transition-colors text-sm"
                >
                    Browse Books
                </Link>
            </div>
        </div>
    );
}
