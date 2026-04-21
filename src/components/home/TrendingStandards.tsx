import Link from "next/link";
import { Standard } from "@/types/standard";
import StandardCard from "@/components/standards/StandardCard";

interface TrendingStandardsProps {
    standards: Standard[];
}

export default function TrendingStandards({ standards }: TrendingStandardsProps) {
    return (
        <section className="py-14 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                            Industry References
                        </p>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                            Quality &amp; Engineering Standards
                        </h2>
                        <p className="text-sm text-gray-500 mt-1.5 max-w-xl">
                            Official AIAG, IATF and ISO standards for automotive quality management, FMEA, SPC, PPAP and more.
                        </p>
                    </div>
                    <Link
                        href="/standards"
                        className="text-sm font-semibold text-primary hover:underline whitespace-nowrap"
                    >
                        Browse All Standards →
                    </Link>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-5">
                    {standards.slice(0, 8).map((s) => (
                        <StandardCard key={s.slug} standard={s} />
                    ))}
                </div>

                <div className="text-center mt-10">
                    <Link
                        href="/standards"
                        className="inline-block border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-full font-semibold text-sm transition-all duration-200"
                    >
                        View All Standards →
                    </Link>
                </div>
            </div>
        </section>
    );
}
