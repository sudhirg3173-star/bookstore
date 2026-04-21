import { getSubjects } from "@/lib/books";
import TopCategoriesGrid from "@/components/home/TopCategoriesGrid";

export default function TopCategories() {
    const subjects = getSubjects();
    return (
        <section className="py-14 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                        Browse by Subject
                    </p>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                        Top Categories
                    </h2>
                </div>
                <TopCategoriesGrid subjects={subjects} />
            </div>
        </section>
    );
}
