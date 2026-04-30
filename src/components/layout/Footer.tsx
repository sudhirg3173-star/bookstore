"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const subjectSlug = (s: string) =>
    s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export default function Footer({ subjects }: { subjects: string[] }) {
    return (
        <footer className="bg-[#642e2e] text-gray-300">
            {/* Features strip */}
            <div className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap justify-center gap-8">
                    {[
                        // {
                        //     icon: "🚚",
                        //     title: "Free Shipping",
                        //     desc: "Orders over ₹999",
                        // },
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
                        // {
                        //     icon: "🎁",
                        //     title: "Gift Cards",
                        //     desc: "Perfect for everyone",
                        // },
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
                    <Link href="/" className="flex items-center mb-4">
                        <Image
                            src="/images/logo/logo.png"
                            alt="KBI International"
                            width={120}
                            height={48}
                            className="h-12 w-auto object-contain"
                        />
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

                {/* Address */}
                <div>
                    <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                        Address
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                        TEX Centre Premises, <br />
                        Unit No. L – 3, 4, 5 &amp; 6,<br />
                        4th Floor, Narayan Plaza<br />
                        26-A, Chandivali Road,<br />
                        Near Boomerang Building,<br />
                        Andheri East, Mumbai 400 072.
                    </p>
                </div>

                {/* Contact Information */}
                <div>
                    <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                        Contact Information
                    </h3>
                    <ul className="space-y-2.5 text-sm text-gray-400">
                        <li>📍 Mumbai, Maharashtra, India</li>
                        <li>
                            <a href="tel:+919821161908" className="hover:text-primary transition-colors">
                                📞 +91 98211 61908
                            </a>
                        </li>
                        <li>
                            <a href="mailto:order@kabdwalbook.com" className="hover:text-primary transition-colors">
                                🛒 order@kabdwalbook.com
                            </a>
                        </li>
                        <li>🏢 Founded in 2003</li>
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
                    <span>© {new Date().getFullYear()} Kabdwalbook. All Rights Reserved.</span>
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
