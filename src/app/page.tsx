import HeroBanner from "@/components/home/HeroBanner";
import PromoBanner from "@/components/home/PromoBanner";
import TrendingBooks from "@/components/home/TrendingBooks";
import TopCategories from "@/components/home/TopCategories";
import BooksOfMonth from "@/components/home/BooksOfMonth";
import AdventureBanner from "@/components/home/AdventureBanner";
import TopBooksSection from "@/components/home/TopBooksSection";
import TrendingStandards from "@/components/home/TrendingStandards";
import Testimonials from "@/components/home/Testimonials";
import {
    getTrendingBooks,
    getBooksOfMonth,
    getTopBooks,
    getNewReleases,
} from "@/lib/books";
import { getAllStandards } from "@/lib/standards";

export default function HomePage() {
    const trending = getTrendingBooks(8);
    const booksOfMonth = getBooksOfMonth(3);
    const topBooks = getTopBooks(8);
    const newReleases = getNewReleases(8);
    const standards = getAllStandards();

    return (
        <>
            <HeroBanner />
            <PromoBanner />
            <TrendingBooks books={trending} title="Trending on Kabadwalbook" />
            <TopCategories />
            <BooksOfMonth books={booksOfMonth} />
            <AdventureBanner />
            <TopBooksSection
                books={topBooks}
                title="Kabadwalbook Top Books"
                subtitle="Our Bestsellers"
            />
            <TopBooksSection
                books={newReleases}
                title="Travel the World from Home"
                subtitle="New Releases"
                viewAllHref="/category/new-releases"
            />
            <TrendingStandards standards={standards} />
            <Testimonials />
        </>
    );
}
