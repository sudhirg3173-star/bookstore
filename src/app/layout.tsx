import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getSubjects } from "@/lib/books";
import { headers } from "next/headers";

export const metadata: Metadata = {
    title: "Kabdwalbook — Your World of Books",
    description:
        "Discover thousands of books across technology, civil services, management, and more. Best prices on academic and professional books.",
    keywords: "books, academic books, UPSC, technology books, online bookstore",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const subjects = getSubjects();
    const headersList = await headers();
    const isAdmin = headersList.get("x-is-admin") === "1";

    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen flex flex-col bg-white">
                {!isAdmin && <Header subjects={subjects} />}
                <main className="flex-1">{children}</main>
                {!isAdmin && <Footer subjects={subjects} />}
            </body>
        </html>
    );
}
