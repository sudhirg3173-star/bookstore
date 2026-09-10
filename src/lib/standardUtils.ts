import { Standard } from "@/types/standard";
import { Book } from "@/types/book";
import { getBookRating, getReviewCount } from "@/lib/utils";

export type StandardFormat = "paperback" | "pdf";

/**
 * Maps a Standard to a Book-shaped object so it can be used with the existing
 * cart / wishlist stores without modification.
 * Kept in a separate file so client components can import it without pulling
 * in the Node.js `fs`/`path` modules from standards.ts.
 */
export function standardToBook(s: Standard, format: StandardFormat = "paperback"): Book {
    const isPdf = format === "pdf";
    const price = isPdf ? (s.pdfPrice ?? s.price) : s.price;
    const sku = isPdf ? `std-${s.slug}-pdf` : `std-${s.slug}`;
    return {
        subject: "Standards",
        title: isPdf ? `${s.name} (PDF Edition)` : s.name,
        authors: s.publisher,
        publisher: s.publisher,
        sku,
        price,
        currency: s.currency,
        availability: "In Stock",
        pages: 0,
        publicationYear: s.year,
        category: "Standards",
        imageUrl: s.imageUrl || "",
        bookUrl: `/standards/${s.slug}`,
        description: s.description,
        slug: sku,
        discount: s.discount,
        rating: getBookRating(sku),
        reviewCount: getReviewCount(sku),
        visible: true,
    };
}
