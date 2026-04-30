"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

const slides = [
    {
        id: 1,
        badge: "NEW RELEASE",
        headline: "Bestselling\n Books",
        subtext: "Over 120,000 trusted reviews",
        cta: "Shop Now",
        href: "/shop",
        gradient: "from-[#0f0c29] via-[#302b63] to-[#24243e]",
        accent: "text-amber-400",
        bookEmoji: "📚",
    },
    {
        id: 2,
        badge: "PRE-ORDER",
        headline: "New Releases\nArrive Daily",
        subtext: "Be the first to own new titles",
        cta: "Pre-Order Now",
        href: "/shop?sort=new",
        gradient: "from-[#02114F] via-[#041B80] to-[#0524A3]",
        accent: "text-orange-300",
        bookEmoji: "",
        image: "/images/banner/banner2.png",
    },
    {
        id: 3,
        badge: "TOP RATED",
        headline: "Explore Our\nTop Picks",
        subtext: "Handpicked by our editorial team",
        cta: "Explore Now",
        href: "/shop?sort=rating",
        gradient: "from-[#57023D] via-[#82045C] to-[#C40465]",
        accent: "text-emerald-300",
        bookEmoji: "⭐",
    },
];

export default function HeroBanner() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 4500);
        return () => clearInterval(interval);
    }, []);

    const slide = slides[current];

    return (
        <section className="relative overflow-hidden">
            <div
                className={`bg-gradient-to-br ${slide.gradient} transition-all duration-700 ease-in-out relative`}
                style={{ minHeight: "480px" }}
            >
                {/* Full-size banner image positioned in outer container */}
                {slide.image && (
                    <div className="absolute inset-y-0 right-8 hidden md:flex items-center pointer-events-none">
                        <Image
                            src={slide.image}
                            alt={slide.headline.replace("\n", " ")}
                            width={0}
                            height={0}
                            sizes="50vw"
                            className="w-auto h-full object-contain drop-shadow-2xl"
                            priority
                        />
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center justify-between gap-10">
                    {/* Text */}
                    <div className="text-white max-w-xl animate-fade-in relative z-10">
                        <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest mb-4 bg-white/20 ${slide.accent}`}
                        >
                            {slide.badge}
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 whitespace-pre-line">
                            {slide.headline}
                        </h1>
                        <p className="text-lg text-white/70 mb-8">{slide.subtext}</p>
                        <Link
                            href={slide.href}
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-all hover:gap-3 shadow-lg"
                        >
                            {slide.cta}
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Decorative emoji (only for slides without an image) */}
                    {!slide.image && (
                        <div className="hidden md:flex items-center justify-center relative">
                            <div className="w-56 h-56 rounded-full bg-white/10 blur-3xl absolute" />
                            <span
                                className="text-9xl drop-shadow-2xl relative"
                                style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))" }}
                            >
                                {slide.bookEmoji}
                            </span>
                        </div>
                    )}
                </div>

                {/* Dots */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`rounded-full transition-all duration-300 ${i === current
                                ? "w-6 h-2 bg-primary"
                                : "w-2 h-2 bg-white/40 hover:bg-white/60"
                                }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
