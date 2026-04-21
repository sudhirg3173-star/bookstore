import { Suspense } from "react";
import { getAllStandards } from "@/lib/standards";
import StandardsGrid from "@/components/standards/StandardsGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Standards — Kabadwalbook",
    description: "Browse official automotive and quality management standards: AIAG APQP, FMEA, IATF 16949, SPC, PPAP, MSA and more.",
};

export default function StandardsPage() {
    const standards = getAllStandards();

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Hero */}
            <div className="bg-gradient-to-r from-[#1a1c2e] to-[#302b63] py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                        Official References
                    </p>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                        Quality &amp; Engineering Standards
                    </h1>
                    <p className="text-white/60 mt-1 text-sm">
                        {standards.length} standard{standards.length !== 1 ? "s" : ""} available — AIAG, IATF, ISO and more
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading standards…</div>}>
                    <StandardsGrid standards={standards} />
                </Suspense>
            </div>
        </div>
    );
}
