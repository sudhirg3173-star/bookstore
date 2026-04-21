import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function AdventureBanner() {
    return (
        <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Banner 1 */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-8 min-h-[200px] flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-48 h-full opacity-10">
                            <div className="text-9xl font-black text-white absolute right-4 top-1/2 -translate-y-1/2">
                                📚
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
                                More Bang for Your Book
                            </p>
                            <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                                Book Your Own<br />Adventures
                            </h3>
                        </div>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-1 bg-white text-[#203a43] hover:bg-amber-400 hover:text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all w-fit"
                        >
                            Shop Now <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Banner 2 */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a0033] via-[#8b0055] to-[#c2185b] p-8 min-h-[200px] flex flex-col justify-between">
                        <div className="absolute top-0 right-0 opacity-10">
                            <div className="text-9xl font-black text-white absolute right-4 top-1/2 -translate-y-1/2">
                                🎓
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-pink-200 uppercase tracking-widest mb-2">
                                Summer Reading
                            </p>
                            <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                                Top Books for<br />Teens & Students
                            </h3>
                        </div>
                        <Link
                            href="/category/entrance-test-prep"
                            className="inline-flex items-center gap-1 bg-white text-pink-800 hover:bg-pink-100 px-5 py-2.5 rounded-full text-sm font-bold transition-all w-fit"
                        >
                            Explore Now <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
