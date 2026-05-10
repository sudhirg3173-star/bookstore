import { Standard } from "@/types/standard";
import { Book } from "@/types/book";
import { getBookRating, getReviewCount } from "@/lib/utils";

/**
 * Maps a Standard to a Book-shaped object so it can be used with the existing
 * cart / wishlist stores without modification.
 * Kept in a separate file so client components can import it without pulling
 * in the Node.js `fs`/`path` modules from standards.ts.
 */
export function standardToBook(s: Standard): Book {
    return {
        subject: "Standards",
        title: s.name,
        authors: s.publisher,
        sku: "std-" + s.slug,
        price: s.price,
        currency: s.currency,
        availability: "In Stock",
        pages: 0,
        publicationYear: s.year,
        category: "Standards",
        imageUrl: "",
        bookUrl: `/standards/${s.slug}`,
        description: s.description,
        slug: "std-" + s.slug,
        rating: getBookRating("std-" + s.slug),
        reviewCount: getReviewCount("std-" + s.slug),
    };
}
