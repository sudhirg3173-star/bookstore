"use client";

interface StarRatingProps {
    rating: number;
    count?: number;
    size?: "sm" | "md" | "lg";
    showCount?: boolean;
}

export default function StarRating({
    rating,
    count,
    size = "sm",
    showCount = true,
}: StarRatingProps) {
    const starSize =
        size === "sm" ? "w-3.5 h-3.5" : size === "md" ? "w-4 h-4" : "w-5 h-5";

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i + 1 <= Math.floor(rating);
                    const halfFilled = !filled && i < rating;
                    return (
                        <svg
                            key={i}
                            className={`${starSize} ${filled || halfFilled ? "text-amber-400" : "text-gray-300"}`}
                            fill={filled ? "currentColor" : "none"}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            {halfFilled ? (
                                <defs>
                                    <linearGradient id={`half-${i}`}>
                                        <stop offset="50%" stopColor="currentColor" stopOpacity={1} />
                                        <stop offset="50%" stopColor="transparent" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                            ) : null}
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill={halfFilled ? `url(#half-${i})` : filled ? "currentColor" : "none"}
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />
                        </svg>
                    );
                })}
            </div>
            {showCount && count !== undefined && (
                <span className="text-xs text-gray-500">({count})</span>
            )}
        </div>
    );
}
