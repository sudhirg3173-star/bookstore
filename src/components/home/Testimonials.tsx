export default function Testimonials() {
    const reviews = [
        {
            name: "Priya Sharma",
            role: "UPSC Aspirant",
            text: "Kabadwalbook has been my go-to for UPSC prep books. The prices are unbeatable and delivery is super fast. Highly recommend to all civil services aspirants!",
            rating: 5,
            avatar: "PS",
        },
        {
            name: "Rahul Mehta",
            role: "Software Engineer",
            text: "Found all the technical books I needed for my career transition. Great collection of emerging technology books. The descriptions really help in choosing the right book.",
            rating: 5,
            avatar: "RM",
        },
        {
            name: "Anita Joshi",
            role: "MBA Graduate",
            text: "The GMAT official guides available here are authentic and reasonably priced. Got my order within 3 days. The packaging was excellent — books arrived in perfect condition.",
            rating: 5,
            avatar: "AJ",
        },
    ];

    return (
        <section className="py-14 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                        Testimonials
                    </p>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                        Happy Clients Say!
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {reviews.map((review, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-4">
                                {Array.from({ length: review.rating }).map((_, j) => (
                                    <svg
                                        key={j}
                                        className="w-4 h-4 text-amber-400"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                    </svg>
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-sm text-gray-600 leading-relaxed mb-5 italic">
                                &ldquo;{review.text}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    {review.avatar}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-800">
                                        {review.name}
                                    </div>
                                    <div className="text-xs text-gray-400">{review.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
