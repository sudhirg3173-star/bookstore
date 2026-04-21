"use client";

import Link from "next/link";
import { BookOpen, Mail, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const subjectSlug = (s: string) =>
    s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export default function Footer({ subjects }: { subjects: string[] }) {
    return (
        <footer className="bg-[#1a1c2e] text-gray-300">
            {/* Features strip */}
            <div className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        {
                            icon: "🚚",
                            title: "Free Shipping",
                            desc: "Orders over ₹999",
                        },
                        {
                            icon: "↩️",
                            title: "Easy Returns",
                            desc: "30-day return policy",
                        },
                        {
                            icon: "🔒",
                            title: "Secure Payments",
                            desc: "100% secured",
                        },
                        {
                            icon: "🎁",
                            title: "Gift Cards",
                            desc: "Perfect for everyone",
                        },
                    ].map((item) => (
                        <div key={item.title} className="flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                                <div className="text-sm font-semibold text-white">
                                    {item.title}
                                </div>
                                <div className="text-xs text-gray-400">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main footer */}
            <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Brand */}
                <div>
                    <Link href="/" className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-6 h-6 text-primary" />
                        <span className="text-lg font-bold text-white">
                            Kabadwal<span className="text-primary">book</span>
                        </span>
                    </Link>
                    <p className="text-sm text-gray-400 leading-relaxed mb-5">
                        Your one-stop destination for academic, professional, and educational
                        books. Discover knowledge that transforms lives.
                    </p>
                    <div className="flex gap-3">
                        {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                            <a
                                key={i}
                                href="#"
                                className="w-8 h-8 bg-white/10 hover:bg-primary rounded-full flex items-center justify-center transition-colors"
                                aria-label="Social"
                            >
                                <Icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Need Help */}
                <div>
                    <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                        Need Help?
                    </h3>
                    <ul className="space-y-2 text-sm">
                        {[
                            "Help Center",
                            "Shipping FAQs",
                            "Track Your Order",
                            "Order Status",
                            "Returns Policy",
                            "Gift Cards",
                        ].map((link) => (
                            <li key={link}>
                                <a
                                    href="#"
                                    className="hover:text-primary transition-colors hover:underline"
                                >
                                    {link}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Categories */}
                <div>
                    <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                        Categories
                    </h3>
                    <ul className="space-y-2 text-sm">
                        {subjects.map((s) => (
                            <li key={s}>
                                <Link
                                    href={`/category/${subjectSlug(s)}`}
                                    className="hover:text-primary transition-colors hover:underline"
                                >
                                    {s}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Newsletter */}
                <div>
                    <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                        Our Newsletter
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Sign up for the latest news, new arrivals and exclusive offers.
                    </p>
                    <form
                        onSubmit={(e) => e.preventDefault()}
                        className="flex flex-col gap-2"
                    >
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                placeholder="Your email address"
                                className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm placeholder-gray-500 text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
                    <span>© {new Date().getFullYear()} Kabadwalbook. All Rights Reserved.</span>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-primary transition-colors">
                            Terms of Use
                        </a>
                        <a href="#" className="hover:text-primary transition-colors">
                            Privacy Policy
                        </a>
                        <a href="#" className="hover:text-primary transition-colors">
                            Sitemap
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
