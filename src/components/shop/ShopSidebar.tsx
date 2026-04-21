"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";

const subjectSlug = (s: string) =>
    s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

interface ShopSidebarProps {
    subjects: string[];
    currentSubject?: string;
    onFilterChange?: (filters: {
        availability: string[];
        minPrice: number;
        maxPrice: number;
    }) => void;
    filters?: { availability: string[]; minPrice: number; maxPrice: number };
}

export default function ShopSidebar({
    subjects,
    currentSubject,
    onFilterChange,
    filters = { availability: [], minPrice: 0, maxPrice: 5000 },
}: ShopSidebarProps) {
    const [catOpen, setCatOpen] = useState(true);
    const [availOpen, setAvailOpen] = useState(true);
    const [priceOpen, setPriceOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleAvailability = (val: string) => {
        const current = filters.availability;
        const updated = current.includes(val)
            ? current.filter((v) => v !== val)
            : [...current, val];
        onFilterChange?.({ ...filters, availability: updated });
    };

    const SidebarContent = () => (
        <div className="space-y-4">
            {/* Categories */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 font-semibold text-sm text-gray-800"
                    onClick={() => setCatOpen(!catOpen)}
                >
                    Categories
                    {catOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </button>
                {catOpen && (
                    <div className="px-4 py-3 space-y-1">
                        <Link
                            href="/shop"
                            className={`block text-sm py-1.5 px-2 rounded-md transition-colors ${!currentSubject
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-gray-600 hover:text-primary hover:bg-gray-50"
                                }`}
                        >
                            All Books
                        </Link>
                        {subjects.map((s) => (
                            <Link
                                key={s}
                                href={`/category/${subjectSlug(s)}`}
                                className={`block text-sm py-1.5 px-2 rounded-md transition-colors ${currentSubject && subjectSlug(s) === subjectSlug(currentSubject)
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                                    }`}
                            >
                                {s}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Availability */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 font-semibold text-sm text-gray-800"
                    onClick={() => setAvailOpen(!availOpen)}
                >
                    Availability
                    {availOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </button>
                {availOpen && (
                    <div className="px-4 py-3 space-y-2">
                        {["In Stock", "Out of Stock"].map((val) => (
                            <label
                                key={val}
                                className="flex items-center gap-2.5 cursor-pointer group"
                            >
                                <input
                                    type="checkbox"
                                    checked={filters.availability.includes(val)}
                                    onChange={() => handleAvailability(val)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary accent-primary"
                                />
                                <span className="text-sm text-gray-600 group-hover:text-gray-800">
                                    {val}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Price range */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 font-semibold text-sm text-gray-800"
                    onClick={() => setPriceOpen(!priceOpen)}
                >
                    Price Range
                    {priceOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </button>
                {priceOpen && (
                    <div className="px-4 py-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <span>₹{filters.minPrice}</span>
                            <span>₹{filters.maxPrice}</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={5000}
                            step={100}
                            value={filters.maxPrice}
                            onChange={(e) =>
                                onFilterChange?.({ ...filters, maxPrice: Number(e.target.value) })
                            }
                            className="w-full accent-primary"
                        />
                        <div className="flex gap-2 mt-3">
                            <input
                                type="number"
                                value={filters.minPrice}
                                min={0}
                                max={filters.maxPrice}
                                onChange={(e) =>
                                    onFilterChange?.({
                                        ...filters,
                                        minPrice: Number(e.target.value),
                                    })
                                }
                                className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                                placeholder="Min"
                            />
                            <input
                                type="number"
                                value={filters.maxPrice}
                                min={filters.minPrice}
                                max={5000}
                                onChange={(e) =>
                                    onFilterChange?.({
                                        ...filters,
                                        maxPrice: Number(e.target.value),
                                    })
                                }
                                className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                                placeholder="Max"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
                >
                    <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="absolute left-0 top-0 h-full w-72 bg-white p-5 overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-gray-800">Filters</h3>
                            <button onClick={() => setMobileOpen(false)}>
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <SidebarContent />
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0">
                <SidebarContent />
            </div>
        </>
    );
}
