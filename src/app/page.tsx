import HeroBanner from "@/components/home/HeroBanner";
import PromoBanner from "@/components/home/PromoBanner";
import TrendingBooks from "@/components/home/TrendingBooks";
import TopCategories from "@/components/home/TopCategories";
import TrendingStandards from "@/components/home/TrendingStandards";
import Testimonials from "@/components/home/Testimonials";
import { getTrendingBooks } from "@/lib/books";
import { getTrendingStandards } from "@/lib/standards";

export default function HomePage() {
    const trending = getTrendingBooks(8);
    const standards = getTrendingStandards();

    return (
        <>
            <HeroBanner />
            <PromoBanner />
            <TrendingBooks books={trending} title="Trending on Kabdwalbook" />
            <TopCategories />
            {/* <BooksOfMonth books={booksOfMonth} /> */}
            {/* <AdventureBanner /> */}
            {/* <TopBooksSection
                books={topBooks}
                title="Kabdwalbook Top Books"
                subtitle="Our Bestsellers"
            /> */}
            {/* <TopBooksSection
                books={newReleases}
                title="Travel the World from Home"
                subtitle="New Releases"
                viewAllHref="/category/new-releases"
            /> */}
            <TrendingStandards standards={standards} />
            <Testimonials />
        </>
    );
}
