import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getSubjects } from "@/lib/books";
import { headers } from "next/headers";

export const metadata: Metadata = {
    title: "Buy Academic, Engineering, Management & Medical Books Online | Kabdwal Book Store",
    description:
        "Discover thousands of books across technology, civil services, management, and more. Best prices on academic and professional books.",
    keywords: "Shop the latest academic, engineering, management, medical, AI, and competitive exam books online at Kabdwal Book Store. Explore bestselling textbooks, reference guides, and latest editions with easy online ordering.",
    icons: {
        icon: "/images/favicon.png",
    },
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
