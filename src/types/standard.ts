export interface Standard {
    number: string;       // e.g. "APQP-3 : 2024"
    name: string;
    year: number;
    publisher: string;
    price: number;
    currency: string;     // e.g. "INR", "USD"
    description: string;
    imageUrl: string;
    slug: string;         // URL-safe: "apqp-3-2024"
    discount?: number;    // percentage, e.g. 10 = 10% off; undefined or 0 = no discount
}
