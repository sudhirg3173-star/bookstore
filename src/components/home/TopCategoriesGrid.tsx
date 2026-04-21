"use client";

import { useState } from "react";
import Link from "next/link";

type CategoryMeta = {
    name: string;
    slug: string;
    emoji: string;
    color: string;
    desc: string;
};

const KNOWN_META: Record<string, { emoji: string; color: string; desc: string }> = {
    "New Releases": { emoji: "🆕", color: "from-blue-500 to-indigo-600", desc: "Latest arrivals" },
    "Emerging Technologies": { emoji: "💡", color: "from-purple-500 to-pink-600", desc: "AI, Blockchain & more" },
    "Computer Science": { emoji: "💻", color: "from-cyan-500 to-blue-600", desc: "Programming & networks" },
    "Engineering": { emoji: "⚙️", color: "from-slate-500 to-gray-700", desc: "All engineering branches" },
    "Mathematics & Statistics": { emoji: "📐", color: "from-teal-500 to-cyan-600", desc: "Maths & stats" },
    "Physics": { emoji: "⚛️", color: "from-sky-500 to-blue-600", desc: "Theory & applied" },
    "Chemistry": { emoji: "🧪", color: "from-lime-500 to-green-600", desc: "Organic & inorganic" },
    "Biology": { emoji: "🧬", color: "from-green-500 to-emerald-600", desc: "Life sciences" },
    "UPSC Civil Services": { emoji: "🏛️", color: "from-amber-500 to-orange-600", desc: "IAS/IPS prep" },
    "Management Entrance": { emoji: "📊", color: "from-orange-500 to-amber-600", desc: "GMAT, NMAT & more" },
    "Entrance Test Prep": { emoji: "🎓", color: "from-rose-500 to-red-600", desc: "JEE, NEET & GRE" },
    "Government Job Exams": { emoji: "🏢", color: "from-indigo-500 to-violet-600", desc: "SSC, Bank & more" },
    "Business Management, Finance & Accounting": { emoji: "💼", color: "from-emerald-500 to-teal-600", desc: "MBA & finance" },
    "For Dummies": { emoji: "📗", color: "from-yellow-400 to-amber-500", desc: "Beginner-friendly" },
    "Reference": { emoji: "📚", color: "from-pink-500 to-rose-600", desc: "Handbooks & guides" },
};

const FALLBACK_COLORS = [
    "from-violet-500 to-purple-600",
    "from-fuchsia-500 to-pink-600",
    "from-red-500 to-rose-600",
    "from-teal-500 to-emerald-600",
];

function subjectToSlug(s: string) {
    return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function buildCategories(subjects: string[]): CategoryMeta[] {
    return subjects.map((name, i) => {
        const meta = KNOWN_META[name] ?? {
            emoji: "📖",
            color: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
            desc: "Explore books",
        };
        return { name, slug: subjectToSlug(name), ...meta };
    });
}

const VISIBLE_COUNT = 10;

export default function TopCategoriesGrid({ subjects }: { subjects: string[] }) {
    const [showAll, setShowAll] = useState(false);
    const categories = buildCategories(subjects);
    const visible = showAll ? categories : categories.slice(0, VISIBLE_COUNT);
    const hasMore = categories.length > VISIBLE_COUNT;

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {visible.map((cat) => (
                    <Link
                        key={cat.slug}
                        href={`/category/${cat.slug}`}
                        className="group flex flex-col items-center text-center p-5 bg-white rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                    >
                        <div
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                        >
                            {cat.emoji}
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors leading-tight mb-1">
                            {cat.name}
                        </h3>
                        <p className="text-[11px] text-gray-400">{cat.desc}</p>
                    </Link>
                ))}
            </div>

            {hasMore && (
                <div className="mt-8 text-center">
                    <button
                        onClick={() => setShowAll((v) => !v)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 border border-primary text-primary rounded-full text-sm font-semibold hover:bg-primary hover:text-white transition-colors duration-200"
                    >
                        {showAll ? "Show Less ↑" : `View More (${categories.length - VISIBLE_COUNT} more) ↓`}
                    </button>
                </div>
            )}
        </>
    );
}
