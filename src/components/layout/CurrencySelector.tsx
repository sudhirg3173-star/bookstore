"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrencyStore, CURRENCIES, Currency } from "@/store/currencyStore";

export default function CurrencySelector() {
    const { currency, setCurrency } = useCurrencyStore();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!mounted) {
        // Avoid hydration mismatch — render placeholder matching server
        return (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white/80 text-sm w-[82px] h-[30px]" />
        );
    }

    const current = CURRENCIES[currency];

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-medium"
                aria-label="Select currency"
            >
                <span className="text-base leading-none">{current.flag}</span>
                <span>{current.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-slide-down">
                    {(Object.keys(CURRENCIES) as Currency[]).map((code) => {
                        const c = CURRENCIES[code];
                        const active = code === currency;
                        return (
                            <button
                                key={code}
                                onClick={() => { setCurrency(code); setOpen(false); }}
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${active
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                <span className="text-base leading-none">{c.flag}</span>
                                <span>{c.label}</span>
                                {active && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
