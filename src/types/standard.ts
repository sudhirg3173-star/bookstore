export interface Standard {
    number: string;       // e.g. "APQP-3 : 2024"
    name: string;
    year: number;
    publisher: string;
    price: number;
    currency: string;     // e.g. "INR", "USD"
    description: string;
    slug: string;         // URL-safe: "apqp-3-2024"
}
