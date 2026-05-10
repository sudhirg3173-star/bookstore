export interface Book {
    subject: string;
    title: string;
    authors: string;
    sku: string;
    price: number;
    currency: string;
    availability: "In Stock" | "Out of Stock";
    pages: number;
    publicationYear: number;
    category: string;
    imageUrl: string;
    bookUrl: string;
    description: string;
    slug: string;
    rating: number;
    reviewCount: number;
    discount?: number;
}

export interface CartItem {
    book: Book;
    quantity: number;
}
