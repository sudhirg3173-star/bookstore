export default function ProductGridSkeleton() {
    return (
        <div className="flex gap-6">
            {/* Sidebar skeleton */}
            <div className="hidden lg:block w-56 shrink-0 space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-3 bg-gray-100 rounded w-full" />
                    ))}
                </div>
            </div>

            {/* Grid skeleton */}
            <div className="flex-1">
                {/* Toolbar skeleton */}
                <div className="flex items-center justify-between mb-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-8 bg-gray-200 rounded w-36" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse"
                        >
                            <div className="aspect-[3/4] bg-gray-100" />
                            <div className="p-3 space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                                <div className="h-3 bg-gray-100 rounded w-3/4" />
                                <div className="h-3 bg-gray-100 rounded w-full" />
                                <div className="h-3 bg-gray-200 rounded w-1/3" />
                                <div className="h-8 bg-gray-100 rounded w-full mt-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
