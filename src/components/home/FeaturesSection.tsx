import Link from "next/link";

const features = [
    {
        emoji: "📖",
        title: "Kabdwalbook Press",
        desc: "Publish your book with us",
        cta: "Learn more",
        href: "#",
        bg: "from-blue-50 to-indigo-50",
        border: "border-blue-100",
        icon_bg: "bg-blue-100",
    },
    {
        emoji: "💳",
        title: "Kabdwalbook Card",
        desc: "5% back on all purchases",
        cta: "Learn more",
        href: "#",
        bg: "from-purple-50 to-pink-50",
        border: "border-purple-100",
        icon_bg: "bg-purple-100",
    },
    {
        emoji: "📱",
        title: "Download the App",
        desc: "Millions of eBooks instantly",
        cta: "Download",
        href: "#",
        bg: "from-amber-50 to-orange-50",
        border: "border-amber-100",
        icon_bg: "bg-amber-100",
    },
    {
        emoji: "🎁",
        title: "Give a Gift Card",
        desc: "The perfect gift for everyone",
        cta: "Shop Gift Cards",
        href: "#",
        bg: "from-emerald-50 to-teal-50",
        border: "border-emerald-100",
        icon_bg: "bg-emerald-100",
    },
];

export default function FeaturesSection() {
    return (
        <section className="py-14 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                        More from Kabdwalbook
                    </p>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                        Wonderful World of Books
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className={`group rounded-2xl border ${f.border} bg-gradient-to-br ${f.bg} p-6 hover:shadow-md transition-all duration-300`}
                        >
                            <div
                                className={`${f.icon_bg} w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}
                            >
                                {f.emoji}
                            </div>
                            <h3 className="font-bold text-gray-800 mb-1">{f.title}</h3>
                            <p className="text-sm text-gray-500 mb-4">{f.desc}</p>
                            <Link
                                href={f.href}
                                className="text-sm font-semibold text-primary hover:underline"
                            >
                                {f.cta} →
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
